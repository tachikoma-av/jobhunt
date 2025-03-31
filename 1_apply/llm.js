

const { HttpsProxyAgent } = require(`https-proxy-agent`);
const { OpenAI } = require(`openai`);

const WRONG_FORMAT_SYMBOLS = [
  // `*`,
  `[`,
]

class CompletePrompt{
  system;
  prompt;
  constructor(system = ``, prompt = ``){
    this.system = system
    this.prompt = prompt
  }
  toMessages(){
    const messages = [];
    if (this.system !== ``){
      messages.push({role: `system`, message: this.system});
    };
    messages.push({role: `user`, message: this.system})
    return messages;
  }
};

class LLMResponse{
  constructor(result = ``, reasoning = ``){
    this.result = result;
    this.reasoning = reasoning;
  }
  resultToJsonString(){
    let json_string = this.result;
    const start_index = json_string.indexOf(`{`);
    const end_index = json_string.lastIndexOf(`}`) + 1;
    json_string = json_string.slice(start_index, end_index);
    return json_string;
  }
};

class Llm{
  url_endpoint = `http://localhost:11434`;
  response_route = `/api/generate`;
  chat_route = `/api/chat`

  system_role = `system`;
  user_role = `user`;
  constructor (model){
    this.model = model;
  };
  async perfromRequestFromPrompt(complete_prompt_obj = new CompletePrompt, custom_options = {}){
    return await this.perfromRequest(complete_prompt_obj.system, complete_prompt_obj.prompt, custom_options);
  };

  async perfromRequest(system = ``, prompt, custom_options = {}){
    const url = `${this.url_endpoint}${this.response_route}`;
    let options = {
      "temperature": 0.7,
      "top_k": 40,
      "top_p": 0.9,
      "num_ctx": 8192,
    }
    for (let parameter in custom_options){
      options[parameter] = custom_options[parameter];
    }

    ({ system, prompt } = this.formQuery(system, prompt));
    const payload = {
      model: this.model,
      prompt: prompt.trim(),
      stream: false,
      options: options,
    };
    if (system != ``){
      payload.system = system.trim();
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      let response_raw = data.response;
      let res = new LLMResponse();

      // only reasoning models need this
      if (response_raw.includes("</think>")) {
        const responseThink = response_raw.split("</think>")[0].replace("<think>", ``);
        res.reasoning = responseThink;// + "</think>"
      }
      res.result = response_raw.split("</think>\n\n").slice(-1)[0];
      return res;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }

    
  };

  formQuery(system, prompt){
    return {system, prompt}
  };
};
// local llms
class DeepseekLocal extends Llm {
  // https://huggingface.co/deepseek-ai/DeepSeek-R1
  // Usage Recommendations
  // "Avoid adding a system prompt; all instructions should be contained within the user prompt."
  formQuery(system, prompt){
    return {system: ``, prompt: `${system + `\n\n`+ prompt}`}
  }
};
// remote llms
class RemoteLlm{
  constructor(url_endpoint, proxy_url, api_key, model){
    this.model = model;
    const options = {
      apiKey: api_key,
    };
    if (url_endpoint){
      options.baseURL = url_endpoint;
    };
    // Attach proxy agent if proxy_url is provided
    if (proxy_url) {
      const proxy_agent = new HttpsProxyAgent(proxy_url);
      options.httpAgent = proxy_agent;
    };
    this.openai = new OpenAI(options);
  };
  async perfromRequestFromPrompt(complete_prompt_obj = new CompletePrompt, custom_options = {}){
    return await this.perfromRequest(complete_prompt_obj.system, complete_prompt_obj.prompt, custom_options);
  };
  async perfromRequest(system = null, prompt, custom_options = {}){
    try {
      const payload = {
        model: this.model,
        messages: [],
      };
      if (system) {
        payload.messages.push({ role: "system", content: system.trim() });
      }
      payload.messages.push({ role: "user", content: prompt.trim() });

      if (custom_options.temperature){
        payload.temperature = custom_options.temperature;
      }
      const response = await this.openai.chat.completions.create(payload);
      let res = new LLMResponse(response.choices[0].message.content);
      return res;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

};

const MODELS = {
  QWEN: {
    get small() { return new Llm(`qwen2.5:1.5b`)},
    get mid() { return new Llm(`qwen2.5:7b`)},
    get large() { return new Llm(`qwen2.5:14b`)}
  },
  DEEPSEEK: {
    get small() { return new DeepseekLocal("deepseek-r1:1.5b")},
    get mid() { return new DeepseekLocal(`deepseek-r1:7b`)},
    get large() { return new DeepseekLocal("deepseek-r1:14b")},
  },
};

const LOCALMODELSPROXY = new Proxy({}, {
  get: (target, modelName) => {
    // reasoning models
    if (modelName.includes(`deepseek-r1`)){
      return new DeepseekLocal(modelName); 
    } else {
      return new Llm(modelName);
    }
  }
});

class LlmModule {
  static url_endpoint = null;
  constructor(api_key, model, proxy){
    this.init(api_key, model, proxy);
  };
  init(api_key, model, proxy){
    this.target_model = new RemoteLlm(this.constructor.url_endpoint, proxy, api_key, model);
  }
  async filterPositions(positions, user_info, user_resume) {
    let prompt_obj = getJobPositionsFilterPrompt(positions, user_info, user_resume);
    let res = await this.target_model.perfromRequest(prompt_obj.system, prompt_obj.prompt, {"temperature": 0.0});
    let match_result = JSON.parse(res.resultToJsonString());
    let filtered_positions = positions.filter( (el, index)=>(match_result[`direct_match`].includes(index) || match_result[`potential_match`].includes(index)))
    return filtered_positions;
  };

  async findIfPositionFitsMe(vacancy_text, user_info, user_resume, user_preferences){
    const prompt_obj = new CompletePrompt();
    prompt_obj.system = `You are a job filter. Filtering job vacancies for a software engineer. 
    USER_INFO: ${user_info}

    USER_RESUME: ${user_resume}

    USER_PREFERENCES: ${user_preferences}
    Return "true" **ONLY IF ANY** positive conditions from USER_PREFERENCES are met.
    Return "false" **ONLY IF ANY** negative conditions from USER_PREFERENCES are met.
    `;
    prompt_obj.prompt = `
    VACANCY_TEXT: ${vacancy_text}

    Respond with exactly "true" or "false" (lowercase, no punctuation).
    `;
    let res = await this.target_model.perfromRequestFromPrompt(prompt_obj, {"temperature": 0.});
    console.log(`[LLM.findIfPositionFitsMe] ${JSON.stringify(res)}`)
    let result = {
      "result": false,
      "reasoning": res.reasoning,
    }
    if (res.result == `false`){
      result.result = false;
    } else if (res.result == `true`){
      result.result = true;
    } else {
      throw `wrong_model_output`;
    }
    return result;
  };

  async generateCoverLetter(position_description, user_info, user_resume, user_name){
    let cover_letter_system = `
    You are my personal professional HR assistant with 10 years of experience in IT recruitment on hh.ru. 

    Your task is to generate a brief and personalized cover letter for the recruiter. Follow these rules:

    Format:
    - Greeting + Position: A short greeting and indication of the position.
    - Connection of experience to the job: Mention only the skills and experience directly related to the job requirements (e.g., Python, GitLab CI, Selenium).
    - Unique advantage: Mention only key achievements that set the candidate apart.
    - Call to action: A short and clear call for further communication.

    Style:
    - Be concise and to the point, without unnecessary details.
    - Use action verbs ("automated," "optimized," "implemented").
    - Emphasize the alignment with the job, but avoid excessive enthusiasm and statements about "guaranteed success."
    - The response should be brief and precise, without unnecessary explanations.

    hh.ru specifics:
    - Use keywords from the job listing.
    - The output format should be regular text, ready to be copied and pasted.
    - prefer telegram over e-mail.

    Additional:
    - *IMPORTANT* Use only the technologies and tools I have actually worked with (e.g., Python, C#, Django, Flask, Selenium, Puppeteer, GitLab CI). Do not add those I have no experience with.
    - Make sure the letter doesn’t sound like a recommendation, but like a personal letter from the candidate, emphasizing their experience and suitable skills for the job. Do not use expressions implying that this is a recommendation letter from a recruiter.
    - The response should be a single message, not divided into sections.
    - The text should be in a regular format, ready for copying and pasting without further editing, and generate the letter as if it were ready for immediate use, without any placeholders.
    - Make cover letter same language as position.
    `;
    let cover_letter_prompt = `
    My_name (JSON): "${JSON.stringify(user_name)}";

    Position_Details (JSON): ${JSON.stringify(position_description)};

    About_me: "${user_info}";

    My_resume: "${user_resume}";
    `;

    let _i = 0;
    while (true){
      _i += 1;
      if (_i >= 2){
        console.log('couldnt generate cover letter for position')
        return null;
      }
      let cover_letter = await this.target_model.perfromRequest(cover_letter_system, cover_letter_prompt, {"temperature": 0.0, "num_ctx": 8192});
      if (WRONG_FORMAT_SYMBOLS.filter(sym => cover_letter.result.includes(sym)).length != 0){
        console.log(`[LLM.generateCoverLetter] contains ${WRONG_FORMAT_SYMBOLS}, generating again\noriginal text ${JSON.stringify(cover_letter)}`)
        continue;
      }
      return cover_letter.result;
    }
  };
  
  // some prototypes below, not used
  static async generateCoverLetter_prototype_for_showing_use_for_company(position_description, user_info, user_resume, user_name){
    let cover_letter_system = `
    You are my personal professional HR assistant with 10 years of experience in IT recruitment on hh.ru. 

    Your task is to generate a brief and personalized cover letter for the recruiter. Follow these rules:

    Format:
    - Greeting + Position: A short greeting and indication of the position.
    - Connection of experience to the job: Mention only the skills and experience directly related to the job requirements (e.g., Python, GitLab CI, Selenium).
    - Unique advantage: Mention only key achievements that set the candidate apart.
    - Call to action: A short and clear call for further communication.

    Style:
    - Be concise and to the point, without unnecessary details.
    - Use action verbs ("automated," "optimized," "implemented").
    - Emphasize the alignment with the job, but avoid excessive enthusiasm and statements about "guaranteed success."
    - The response should be brief and precise, without unnecessary explanations.

    hh.ru specifics:
    - Use keywords from the job listing.
    - The output format should be regular text, ready to be copied and pasted.
    - prefer telegram over e-mail.

    Additional:
    - *IMPORTANT* Use only the technologies and tools I have actually worked with (e.g., Python, C#, Django, Flask, Selenium, Puppeteer, GitLab CI). Do not add those I have no experience with.
    - Make sure the letter doesn’t sound like a recommendation, but like a personal letter from the candidate, emphasizing their experience and suitable skills for the job. Do not use expressions implying that this is a recommendation letter from a recruiter.
    - The response should be a single message, not divided into sections.
    - The text should be in a regular format, ready for copying and pasting without further editing, and generate the letter as if it were ready for immediate use, without any placeholders.
    - Make cover letter same language as position.



    `;
    let cover_letter_prompt = `
My_name (JSON): "${JSON.stringify(user_name)}";
Position_Details (JSON): ${JSON.stringify(position_description)};
About_me: "${user_info}";
My_resume: "${user_resume}";
    `;

    let _i = 0;
    while (true){
      _i += 1;
      if (_i >= 2){
        console.log('couldnt generate cover letter for position')
        return null;
      }
      let cover_letter = await MODELS.QWEN.large.perfromRequest(cover_letter_system, cover_letter_prompt, {"temperature": 0.0, "num_ctx": 8192});
      if (WRONG_FORMAT_SYMBOLS.filter(sym => cover_letter.result.includes(sym)).length != 0){
        console.log(`[LLM.generateCoverLetter] contains ${WRONG_FORMAT_SYMBOLS}, generating again\noriginal text ${JSON.stringify(cover_letter)}`)
        continue;
      }
      return cover_letter.result;
    }
  };
  static async generateCoverLetter_prototype_deepseek_suggestion(position_description, user_info, user_resume, user_name){
    const target_model = MODELS.QWEN.mid;

    const analyze_prompt = new CompletePrompt();
    analyze_prompt.system = `
    You are an AI Job Posting Analyzer. Be precise and only include information explicitly mentioned. Extract information and return JSON exactly following this structure: {"language": "<job posting language either 'english' or 'russian' or 'chinese' or 'another'>"}
    `;
    analyze_prompt.prompt = `
    Analyze the following job posting and extract structured data:
    ${JSON.stringify(position_description)}

    `;
    let analyze_result_raw = await target_model.perfromRequestFromPrompt(analyze_prompt, {"temperature": 0.0, "num_ctx": 8192})
    let analyze_result = JSON.parse(analyze_result_raw.resultToJsonString());
    const position_language = analyze_result.language;


    // Stage 1: User Competency Extraction
    const competency_extractor = `
    You are an HR data analyst. Extract and structure:
    1. Technical capabilities (hard skills from resume)
    2. Verified achievements (quantified results only)
    3. Position-relevant experience (matching job description)

    Rules:
    - Convert resume bullets to CAR format: "Context (20 words) → Action (specific tech) → Result (metric)"
    - Output JSON: { 
      "core_competencies": [{"skill": "", "cases": ["CAR1", "CAR2"]}],
      "differentiators": ["unique_value1", "unique_value2"] 
    }

    USER INPUTS:
      My Resume: "${user_resume}"
      About Me: "${user_info}"
    `;
    const userCompetencies = await target_model.perfromRequest(``, competency_extractor, {"temperature": 0.0, "num_ctx": 8192});

    // Stage 2: Company Need Analysis
    const needs_analyzer = `
    You are a job description decoder. From the position description:
    1. Identify 3-5 key technical requirements
    2. Extract implied business challenges
    3. Highlight preferred success metrics

    Output JSON structure:
    {
      "explicit_needs": [{"skill": "", "priority": "high/medium/low"}],
      "implicit_challenges": ["challenge1", "challenge2"],
      "success_metrics": ["metric1", "metric2"] 
    }

    JOB DESCRIPTION INPUT:
       Position Details: ${JSON.stringify(position_description)}
       Company Name: "${position_description.company}"
    `;
    const companyNeeds = await target_model.perfromRequest(``, needs_analyzer, {"temperature": 0.0, "num_ctx": 8192});

    // Stage 3: Value Proposition Mapping
    const alignment_engine = `
    Create skill-to-need mappings using:
    1. For each company need → match 1-2 user CAR stories
    2. For each challenge → match relevant differentiators
    3. For success metrics → align user's achievement metrics

    Output format:
    [
      {
        "company_need": "",
        "user_evidence": ["CAR1", "CAR2"],
        "metric_match": "" 
      }
    ]

    MATCHING INPUTS:
      User Competencies: ${userCompetencies.resultToJsonString()}
      Company Needs: ${companyNeeds.resultToJsonString()}
    `;
    const alignmentMap = await target_model.perfromRequest(``, alignment_engine, {"temperature": 0.0, "num_ctx": 8192});

    // Stage 4: Letter Generation
    const letter_generator = `
    Compose letter using this structure:
    Paragraph 1: "Your [X need] matches my [Y experience] in [Z environment]"
    Paragraph 2: "I solve [challenge] through [differentiator] → [metric impact]"
    Paragraph 3: "Let's discuss how my [A] and [B] can achieve [company metric]"

    Hard requirements:
    - Begin sentences with "You" 40% of time
    - Include 2-3 metric comparisons
    - Use challenge→solution→outcome sequence
    - 58-word maximum per paragraph

    CONTEXT BUNDLE:
      Alignment Map: ${alignmentMap.resultToJsonString()}
      Contact Preferences: {telegram: "@myhandle", email: "fallback@email.com"}
      Language: English
    `;
    const draftLetter  = await target_model.perfromRequest(``, letter_generator, {"temperature": 0.0, "num_ctx": 8192});

    // Stage 5: Impact Editor

    let cover_letter_system = `
    You are my personal professional HR assistant with 10 years of experience in IT recruitment on hh.ru. 

    Your task is to generate a brief and personalized cover letter for the recruiter. Follow these rules:

    Format:
    - Greeting + Position: A short greeting and indication of the position.
    - Connection of experience to the job: Mention only the skills and experience directly related to the job requirements (e.g., Python, GitLab CI, Selenium).
    - Unique advantage: Mention only key achievements that set the candidate apart.
    - Call to action: A short and clear call for further communication.

    Style:
    - Be concise and to the point, without unnecessary details.
    - Use action verbs ("automated," "optimized," "implemented").
    - Emphasize the alignment with the job, but avoid excessive enthusiasm and statements about "guaranteed success."
    - The response should be brief and precise, without unnecessary explanations.

    hh.ru specifics:
    - Use keywords from the job listing.
    - The output format should be regular text, ready to be copied and pasted.
    - prefer telegram over e-mail.

    Additional:
    - *IMPORTANT* Use only the technologies and tools I have actually worked with (e.g., Python, C#, Django, Flask, Selenium, Puppeteer, GitLab CI). Do not add those I have no experience with.
    - Make sure the letter doesn’t sound like a recommendation, but like a personal letter from the candidate, emphasizing their experience and suitable skills for the job. Do not use expressions implying that this is a recommendation letter from a recruiter.
    - The response should be a single message, not divided into sections.
    - The text should be in a regular format, ready for copying and pasting without further editing, and generate the letter as if it were ready for immediate use, without any placeholders.
    - Make cover letter same language as position.


    `;


    const military_editor = `
    You are a brevity-focused editor. Apply:
    1. Goblin Mode: Cut any adjective/adverb without technical meaning
    2. Power-Verb Replacement: "Did" → "Engineered", "Made" → "Architected"
    3. Metric Fronting: Move numbers to sentence beginnings
    4. You:I Ratio Check (minimum 1:1)
    5. Mobile Readability: Test <40 character line breaks

    Return final text with changes tracked and confidence score (1-100).

    EDITING INPUT:
      Draft Text: "${draftLetter}"
      Styling Rules: ${cover_letter_system}
    `;
    const finalLetter  = await target_model.perfromRequest(``, military_editor, {"temperature": 0.0, "num_ctx": 8192});
    console.log(123);
  };
  static async generateCoverLetter_prototype1(position_description, user_info, user_resume, user_name){

    const analyze_prompt = new CompletePrompt();
    analyze_prompt.system = `
    You are an AI Job Posting Analyzer. Be precise and only include information explicitly mentioned. Extract information and return JSON exactly following this structure: {"language": "<job posting language either 'english' or 'russian' or 'chinese' or 'another'>"}
    `;
    analyze_prompt.prompt = `
    Analyze the following job posting and extract structured data:
    ${JSON.stringify(position_description)}

    `;
    let analyze_result_raw = await MODELS.QWEN.mid.perfromRequestFromPrompt(analyze_prompt, {"temperature": 0.0, "num_ctx": 8192})
    let analyze_result = JSON.parse(analyze_result_raw.resultToJsonString());
    const position_language = analyze_result.language;

    const cover_letter_prompt = new CompletePrompt();
    cover_letter_prompt.system = `You are an expert job-matching assistant helping candidates craft compelling first messages to employers. The goal is to create a short, engaging introduction that highlights the applicant’s key qualifications and enthusiasm for the role.`
    cover_letter_prompt.prompt = `
User Prompt:
Based on the following information, generate a concise and professional first message for a job application. The message should:

- Be polite and engaging.

- Mention relevant skills and experience from the resume.

- Show enthusiasm for the position.

- Avoid repeating the full resume but highlight key qualifications.

- Optionally, include a brief personal touch to make the application stand out.

Inputs:
Vacancy Description:
${JSON.stringify(position_description)}

My Resume:
${user_resume}

About Me:
${user_info}
    `;
    let cover_letter_raw = await MODELS.QWEN.mid.perfromRequestFromPrompt(cover_letter_prompt, {"temperature": 0.0, "num_ctx": 8192})

    cover_letter_prompt.prompt = `
Rewrite the following job application text into a direct job application message following rules:

- Remove any subject line.

- Keep the tone professional yet conversational.

- Ensure it flows naturally as a direct message.

- Translate the following job application message to ${position_language} without changing its structure or meaning.

- The text should be in a regular format, ready for copying and pasting without further editing, and generate the letter as if it were ready for immediate use, without any placeholders.

Inputs:
**user_name:**
${user_name[position_language]}

**Job application text:**
${cover_letter_raw.result}

    `;
    let cover_letter_refined = await MODELS.QWEN.mid.perfromRequestFromPrompt(cover_letter_prompt, {"temperature": 0.0, "num_ctx": 8192})
  };
  static async generateCoverLetter_prototype(position_description, user_info, user_resume, user_name){

    // analyze position
    let task_model = MODELS.QWEN.mid;
    let analyze_position_promt = `
    Analyze the following job posting and extract structured data:
    ${JSON.stringify(position_description)}
    `;

    let output_sample = {
      // "job_title": "<position title>",
      // "company": "<company name>",
      // "location": "<job location>",
      "language": "<job posting language either 'English' or 'Russian' or 'Chinese' or 'Another'>",
      "responsibilities": ["list", "of", "specific responsibilities"],
      "required_skills": ["list", "of", "explicit requirements"],
      "preferred_skills": ["list", "of", "nice-to-have skills"],
      // "education_required": "<degree/diploma level>",
      // "experience_required": "<years/type of experience>",
      // "salary_range": "<mentioned compensation>",
      // "benefits": ["list", "of", "mentioned benefits"]
    }
    let system_msg = `
    You are an AI Job Posting Analyzer. Be precise and only include information explicitly mentioned. Extract information and return JSON exactly following this structure: ${JSON.stringify(output_sample)}
    `;
    let analyze_result_qwen = await task_model.perfromRequest(system_msg, analyze_position_promt, {"temperature": 0.0, "num_ctx": 8192})
    let analyzed_result = JSON.parse(analyze_result_qwen.resultToJsonString());
    if (analyzed_result.language == `another`){
      return null;
    }
    let resume_and_info_analyzer_prompt = new CompletePrompt();
    resume_and_info_analyzer_prompt.system = `
    You are an AI job candidate Analyzer. Be precise and only include information explicitly mentioned. 
    Extract information and return JSON exactly following this structure: {"responsibilities": ["list", "of", "specific responsibilities"], "skills": ["list", "of", "skills"]}
    `;
    resume_and_info_analyzer_prompt.prompt = `
    Analyze the following user info and extract structured data:
    ${user_info}
    ${user_resume}
    
    `;
    let resume_and_info_analyze_result = await task_model.perfromRequestFromPrompt(resume_and_info_analyzer_prompt, {"temperature": 0.0, "num_ctx": 8192})
    console.log(123);


    // find match between position and resume + user info
    output_sample = {
      // Сходства по обязанностям: перечисли обязанности из вакансии, которые соответствуют моему опыту.
      "match_responsibilities": ["list", "of", "match responsibilities"],
      // Сходства по навыкам: перечисли навыки из вакансии, которые у меня есть.
      "match_skills": ["list", "of", "match responsibilities"],
      // Дополнительные полезные навыки: что в моём опыте может быть полезным, но не указано в требованиях.
      "useful_skills": ["list", "of", "match responsibilities"],
    }

    system_msg = `
    You are an advanced AI assistant that helps job seekers analyze job descriptions and match them with their experience. Your goal is to extract relevant job responsibilities and skills from the given job posting and compare them with the user's resume.  

    Your output must be a structured JSON object with three fields:  

    - "match_responsibilities": List of job responsibilities that align with the user's past experience.  
    - "match_skills": List of skills required in the job posting that the user already possesses.  
    - "useful_skills": Additional skills from the user's experience that are valuable but not explicitly mentioned in the job description.  

    Be precise and avoid generic matches. The output should always be **structured JSON** and never contain explanations or extra text.    


    Return JSON exactly following this structure:
    {
      "match_responsibilities": ["list", "of", "match responsibilities"],
      "match_skills": ["list", "of", "match skills"],
      "useful_skills": ["list", "of", "useful skills"]
    }
    `;
    let match_position_prompt = `
    **Job Posting Data:**
    ${JSON.stringify(analyzed_result)}
    
    **About Me:**
    ${JSON.stringify(resume_and_info_analyze_result)}
    
    `;
    let match_result_qwen = await task_model.perfromRequest(system_msg, match_position_prompt, {"temperature": 0.0, "num_ctx": 8192})
    console.log(`todo below`);


    
    // make a cover letter targeting those matches

    // format cover letter by language, and fill the data.


  };
};

// different models behave different, so maybe the prompts for them could be different as well
class LlmModuleLocal extends LlmModule{
  init(api_key, model, proxy){
    this.target_model = LOCALMODELSPROXY[model];
  }
};
class LlmModuleChatGpt extends LlmModule{

};
class LlmModuleDeepseek extends LlmModule{
  static url_endpoint = `https://api.deepseek.com`;
};
class LlmModuleGemini extends LlmModule{
  static url_endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/";
};

function getLLmModule(settings){
  let llm_class;
  if (settings.LLM.BACKEND == `local`){
    llm_class = LlmModuleLocal;
  } else if (settings.LLM.BACKEND == `deepseek`){
    llm_class = LlmModuleDeepseek;
  } else if (settings.LLM.BACKEND == `chatgpt`){
    llm_class = LlmModuleChatGpt;
  } else if (settings.LLM.BACKEND == `gemini`){
    llm_class = LlmModuleGemini;
  } else {
    throw `unknown model ${settings.LLM.BACKEND_TYPE}`;
  };
  return new llm_class(settings.LLM.API_KEY, settings.LLM.MODEL, settings.LLM.PROXY);
};

function getJobPositionsFilterPrompt(positions, user_info, user_resume) {
  const system_msg = `
You are an AI career advisor specialized in analyzing job-market fit. Your task is to evaluate a list of job positions against a user's profile (description and resume) to determine suitability.

Focus on:
1. **Skill Relevance**: Match hard/soft skills from the resume to typical role requirements.
2. **Experience Alignment**: Compare years/type of experience with position seniority.
3. **Industry Context**: Infer industry-specific expectations from job titles (e.g., "Biomedical Engineer" vs. "Full-Stack Developer").
4. **Keyword Resonance**: Identify implicit requirements (e.g., "Cloud Architect" implies AWS/Azure expertise).

**Output Format (JSON):**
{
  "direct_match": [position_indexes],
  "potential_match": [position_indexes],
  "mismatch": [position_indexes]
}
Ensure that **all** positions are evaluated. Even if a position does not match or is not a potential match, include it in the "mismatch" array.
  `;

  const prompt = `
**Inputs:**
- User Description: "${user_info}"
- Resume: "${user_resume}"
- Positions: ${JSON.stringify(positions)}

**Task:**
Evaluate each position and return the output strictly in the following JSON format:

{
  "direct_match": [position_indexes],
  "potential_match": [position_indexes],
  "mismatch": [position_indexes]
}

Do not provide any explanations or additional information. Just return the JSON.
  `;

  return new CompletePrompt(system_msg, prompt);
};

function getCheckPositionFitPrompt(position, user_info, user_resume) {
  const system_msg = `
You are an AI career advisor specialized in analyzing job-market fit. Your task is to evaluate job position against a user's profile (description and resume) to determine suitability.

Focus on:
1. **Skill Relevance**: Match hard/soft skills from the resume to typical role requirements.
2. **Experience Alignment**: Compare years/type of experience with position seniority.
3. **Industry Context**: Infer industry-specific expectations from job titles (e.g., "Biomedical Engineer" vs. "Full-Stack Developer").
4. **Keyword Resonance**: Identify implicit requirements (e.g., "Cloud Architect" implies AWS/Azure expertise).

Ensure that **all** positions are evaluated. Even if a position does not match or is not a potential match, include it in the "mismatch" array.
  `;

  const prompt = `
**Inputs:**
- User Description: "${user_info}"
- Resume: "${user_resume}"
- Position: ${JSON.stringify(position)}

**Task:**
Evaluate position and return the output strictly with exactly "true" or "false" (lowercase, no punctuation).
  `;

  return new CompletePrompt(system_msg, prompt);
};



if (require.main === module) {
  // Only run this if the script is executed directly, not imported
  const main = async () =>{
    const mock_settings = require('./settings');
    let lm = getLLmModule(mock_settings);
    let positions_raw = JSON.parse(`[{"name":"программист-разработчик","company_name":"тоо rise agency","href":"https://nakhodka.hh.ru/vacancy/118480973?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"data engineer","company_name":"corporate performance systems","href":"https://nakhodka.hh.ru/vacancy/117652939?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"back-end developer (international ai brand)","company_name":"mt lab","href":"https://nakhodka.hh.ru/vacancy/118463364?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ml разработчик (llm, whisper, rag, agents)","company_name":"amarkets","href":"https://nakhodka.hh.ru/vacancy/118461834?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"специалист по llm и машинному обучению","company_name":"тензор","href":"https://nakhodka.hh.ru/vacancy/108863360?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"frontend-разработчик (angular)","company_name":"ооо цифра","href":"https://nakhodka.hh.ru/vacancy/118460929?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"full-stack инженер","company_name":"ооо империя кофе","href":"https://nakhodka.hh.ru/vacancy/118459308?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"тестировщик","company_name":"ооо ф-метрикс","href":"https://nakhodka.hh.ru/vacancy/118454055?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ведущий специалист по информационному поиску","company_name":"зао консультантплюс","href":"https://nakhodka.hh.ru/vacancy/118437101?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"c#/.net бекенд разработчик","company_name":"atas ltd","href":"https://nakhodka.hh.ru/vacancy/118434613?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"инженер по нагрузочному тестированию","company_name":"usetech","href":"https://nakhodka.hh.ru/vacancy/118430772?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"python developer | middle+","company_name":"ооо легалбет","href":"https://nakhodka.hh.ru/vacancy/117775923?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"data-scientist junior level","company_name":"ооо андата","href":"https://nakhodka.hh.ru/vacancy/118421806?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ml engineer (middle+)","company_name":"трт","href":"https://nakhodka.hh.ru/vacancy/118400656?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ml-инженер (middle)","company_name":"ооо октопустех","href":"https://nakhodka.hh.ru/vacancy/117372783?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"fullstack-разработчик langchain (node.js, rag)","company_name":"ооо лаборатория маркетинга","href":"https://nakhodka.hh.ru/vacancy/118308378?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"тьютор-fullstack-разработчик","company_name":"abbasov bahadir xəqani̇ oğlu","href":"https://nakhodka.hh.ru/vacancy/117952409?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"qa инженер/тестировщик","company_name":"corporate performance systems","href":"https://nakhodka.hh.ru/vacancy/109147105?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"node.js developer","company_name":"simplenight","href":"https://nakhodka.hh.ru/vacancy/117351814?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"middle fullstack developer","company_name":"ип краснова екатерина сергеевна","href":"https://nakhodka.hh.ru/vacancy/118295178?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"devops-инженер","company_name":"sl soft","href":"https://nakhodka.hh.ru/vacancy/118125800?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"python-разработчик","company_name":"comagic.dev","href":"https://nakhodka.hh.ru/vacancy/117343800?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"nlp engineer (ml-engineer) в проект \\"чат-бот\\"","company_name":"ооо progressive mind","href":"https://nakhodka.hh.ru/vacancy/118064108?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ml-инженер (nlp, llm, stt, tts)","company_name":"gst","href":"https://nakhodka.hh.ru/vacancy/118274069?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"nlp engineer","company_name":"ооо сидорин лаб","href":"https://nakhodka.hh.ru/vacancy/118261763?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"fullstack-разработчик","company_name":"abdurasulov nurmuhammad rustam o'g'li","href":"https://nakhodka.hh.ru/vacancy/118372343?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"разработчик нейросетей","company_name":"бте","href":"https://nakhodka.hh.ru/vacancy/118256272?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"fullstack asp net разработчик","company_name":"ооо аватар машина","href":"https://nakhodka.hh.ru/vacancy/118041663?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"ml engineer llm","company_name":"itoolabs","href":"https://nakhodka.hh.ru/vacancy/118248757?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"middle ml engineer","company_name":"itoolabs","href":"https://nakhodka.hh.ru/vacancy/118247540?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"kotlin multiplatform engineer (kmp)","company_name":"альфа-банк: направление массового бизнеса","href":"https://nakhodka.hh.ru/vacancy/116149174?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"data scientist","company_name":"альфа-банк: направление массового бизнеса","href":"https://nakhodka.hh.ru/vacancy/116148795?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"инженер-программист","company_name":"ооо финсельват","href":"https://nakhodka.hh.ru/vacancy/118471838?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"},{"name":"backend-разработчик","company_name":"hire5 inc","href":"https://nakhodka.hh.ru/vacancy/118432424?query=ai+%7C%7C+llm&hhtmFrom=vacancy_search_list"}]`)
    let position = positions_raw[0].name;
    let prompt_obj = getCheckPositionFitPrompt(position, mock_settings.USER.INFO, mock_settings.USER.RESUME);
    // let is_fit = await MODELS.DEEPSEEK.small.perfromRequest(prompt_obj.system, prompt_obj.prompt, {"temperature": 0.0});

    let positions = positions_raw.map(el=> el.name);
    // let filtered = await lm.filterPositions(positions, mock_settings.USER.INFO, mock_settings.USER.RESUME);

    let sample_position = JSON.parse(`{"title":"QA Automation Engineer / SDET","company":"Студия Кефир","description":"Вы – наш человек, если у вас есть:   опыт тестирования ПО от 1 года   опыт работы с игровым движком Unity   знание C# на уровне Middle   понимание принципов работы клиент-серверных приложений   опыт мобильного тестирования и работы с платформами iOS и Android   знание инструментов и методов автоматизации тестирования на Unity3D (Unity Test Framework)   умение работать с системами CI/CD (Jenkins)   знание систем баг-трекинга   опыт работы в команде   искренняя любовь к играм и большой игровой опыт   Пригодится:   знание Bash, Python   Кое-что о задачах:   написание и поддержка автоматических тестов   развитие фреймворка для игровых проектов студии   настройка инфраструктуры для запуска тестов   разработка вспомогательных инструментов для тестирования;   анализ и улучшение процессов по обеспечению качества игровых проектов   взаимодействие с командой разработчиков   Помимо работы:  лекции от топовых спикеров нашего профиля крутые внутренние ивенты геймифицированная бонусная система собственная медицинская диагностическая клиника  Само собой:  курсы английского мощное железо официальное оформление "}`)
    let cover_letter = await lm.generateCoverLetter(sample_position, mock_settings.USER.INFO, mock_settings.USER.RESUME, mock_settings.USER.NAME);
    // let cover_letter_prototype = await LlmModule.generateCoverLetter_prototype(sample_position, mock_settings.USER.INFO, mock_settings.USER.RESUME, mock_settings.USER.NAME);
    // let cover_letter_prototype = await LlmModule.generateCoverLetter_prototype_deepseek_suggestion(sample_position, mock_settings.USER.INFO, mock_settings.USER.RESUME, mock_settings.USER.NAME);
    console.log(123);
  }
  main()
}

module.exports = { LlmModule, getLLmModule };
