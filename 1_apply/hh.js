"use strict";
// https://stackoverflow.com/questions/75982191/connecting-to-an-existing-browser-using-playwright
`
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
`

const Datastore = require('nedb');

const { JobApplicant } = require('./applicant.js');

const TEMP_STATUS_CODES = {
  applied: 0,
  rejected: 1,
  ignored: 2,
  couldnt_generate_cover_letter: 3,
}

async function fillForm() {
  // get questions and indexes
  question_elements = document.querySelectorAll(`[data-qa="task-body"]`);
  questions = Array.from(question_elements).map( (el, index) => {
    question = {

    }
    question.index = index;
    question.text = el.querySelector(`[data-qa="task-question"]`).textContent;
    question.answers = [];
    answer_elements = Array.from(el.querySelectorAll(`[data-qa="cell-text"]`));
    if (answer_elements.length == 0){
      question.answers.push(`text_answer`);
    } else {
      answer_elements.map(el=>{
        question.answers.push(el.textContent);
      })
    }

    return question;
  })
  console.log(JSON.stringify(questions, null, 4))
  // scroll to element
  question_elements[index].querySelector(`div [data-interactive="true"]`).scrollIntoView()

  // tap on input field

  // set value


  // open cover letter thing
  document.querySelectorAll(`[data-qa="cell-left-side"]`)[1];

  // could be filled as well
}


function getPositionDescription(){
  let position = {
    title: ``,
    company: ``,
    description: ``,
  };
  position.title = document.querySelector('[data-qa="vacancy-title"]').textContent;
  position.company = document.querySelector('[data-qa="vacancy-company-name"]')?.textContent;
  position.description = document.querySelector('[data-qa="vacancy-description"]').textContent;
  return position;
}

class HHru extends JobApplicant {
  constructor(){
    super();
    this.temp = new Datastore({filename : 'data/hh_temp.json', autoload: true });
  }
  async prepare(){
    await this.main_page.goto("https://hh.ru", { "waitUntil": 'domcontentloaded'});
    const authenticated = await this.main_page.evaluate( ()=> document.querySelector(`[data-qa="login"]`) == null )
    if (authenticated == false){
      throw "[HHru.prepare] not authenticated on hh.ru";
    }

  }
  async topUpResumes() {
    const page = this.main_page;
    await page.evaluate(()=>{
      document.querySelector('[data-qa="mainmenu_myResumes"]').click();
    });
    await page.waitForNavigation({ "waitUntil": 'networkidle'})
    await page.evaluate( async ()=>{
      buttons = document.querySelectorAll('[data-qa="resume-update-button resume-update-button_actions"]');
      for (let button_el of buttons){
        button_el.click();
        await new Promise(r => setTimeout(r, 2000));
        let modal_button = document.querySelector('[data-qa="bot-update-resume-modal__close-button"]');
        if (modal_button != null){
          modal_button.click()
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    })
  }
  async getPositionsFromUrl(position_uri){
    const page = this.main_page;
    await page.goto(position_uri, { "waitUntil": 'domcontentloaded'});
    const positions = await page.evaluate( () => {
      positions_buttons = document.querySelectorAll(`[data-qa="vacancy-serp__vacancy_response"]`);
      const COMPANY_NAME_SELECTORS = [
        `[data-qa="vacancy-serp__vacancy-employer"]`,
        `[data-qa="vacancy-serp__vacancy-employer-text"]`
      ]
      let positions = Array.from(positions_buttons).map(el=>{
        if (el.checkVisibility() == false){
          return null;
        }
        let position_block = el.parentElement.parentElement.parentElement.parentElement;
        let position = {};
  
        position.name = position_block.querySelector(`h2`).textContent.trim().toLowerCase();
        position.company_name = ``;
        let company_name_element = null;
        for (let company_el_selector of COMPANY_NAME_SELECTORS){
          company_name_element = position_block.querySelector(company_el_selector);
          if (company_name_element != null){
            position.company_name = company_name_element.textContent.trim().toLowerCase();
            break
          }
        }
        position.href = position_block.querySelector(`h2`).querySelector(`a`).href;
        return position;
      }).filter(el=>el!= null)
      return positions;
    })
    return positions;
  }
  filterPositions(positions) {
    let position_names = [];
    let filtered_positions = [];
    let positions_to_ignore = this.temp.getAllData();

    for (let el of positions){
      let position_name = el.name;

      // exlude duplicates
      if (position_names.filter(el=> el == position_name).length != 0){
        console.log(`[HHru.filterPositions] skipping duplicate ${JSON.stringify(el)}`)
        continue;
      // exlude one with restricted keywords
      } else if (this.settings.HH.POSITION_TITLE_KEYWORDS_TO_IGNORE.filter( keyword => position_name.toLowerCase().includes(keyword)).length != 0){
        console.log(`[HHru.filterPositions] skipping restricted keyword ${JSON.stringify(el)} `)
        continue;
      }

      // exclude one which we applied\rejected or whatever
      let can_apply = true;
      for (let pos of positions_to_ignore){
        if (pos.name == el.name && pos.company_name == el.company_name){
          can_apply = false;
          break
        }
      }
      if (!can_apply){
        continue;
      }

      position_names.push(position_name);
      filtered_positions.push(el);
    }
    return filtered_positions;
  }
  async applyForPosition(position, page){
    await page.goto(position.href, { "waitUntil": 'domcontentloaded'})
    let position_description = await page.evaluate(getPositionDescription);
    // click apply
    await page.evaluate(()=>{
      document.querySelector(`[data-qa="vacancy-response-link-top"]`).click()
    })

    // wait for result

    // TODO sometimes some window with relocation appear
    let _i = 0
    let redirected = false;
    while (true){
      _i+=1;
      if (_i > 30){
        throw `stuck modal window`
      }
      await new Promise(r => setTimeout(r, 2000));

      let res = ``;
      try {
        res = await page.evaluate(()=>{
          let current_location = document.location.toString();
          if (current_location.includes(`/applicant/vacancy_response?vacancyId=`) ){
            return `redirected`;
          }
          
          let relocation_button_element = document.querySelector(`[data-qa="relocation-warning-confirm"]`);
          if (relocation_button_element != null){
            relocation_button_element.click();
            return `removed_relocation_thing`;
          }
          // TODO sometimes it asks to fill some additional forms
          let modal_element = document.querySelector(`[data-qa="modal-header"]`);
          if (modal_element != null){
            return `modal_appeared`;
            
          }
          return ``;
        })
      } catch (error) {
        console.log(`err on loading ${res}`);
        redirected = true;
        break;
      }
      console.log(`modal msg ${res}`);
      if (res == `modal_appeared`){
        break;
      } else if (res == `redirected`){
        console.log(`redirected ${res}`);
        redirected = true;
        break;

      }

    }

    if (redirected){
      this.temp.insert({"name": position.name, "company_name": position.company_name, "status": TEMP_STATUS_CODES.ignored})
      return false;
    }

    let action_bar_button_text = await page.evaluate( ()=>{
      return document.querySelector(`[data-qa="action-bar"]`).querySelector('span').textContent;
    })
    // TODO sometimes the message may be fullfilled, so the previous one will be sent
    
  
    switch (action_bar_button_text) {
      case 'Откликнуться':
        let coord_orig = await page.evaluate( ()=>{
          const element = document.querySelector(`[data-qa="textarea-wrapper"]`);
          // Get the element's position relative to the document
          const rect = element.getBoundingClientRect();
          const x = rect.left + window.scrollX;
          const y = rect.top + window.scrollY;
          return [x,y]
        })
        await page.mouse.click(coord_orig[0]+50, coord_orig[1]+50)
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.press('Control+A');
        await new Promise(r => setTimeout(r, 1000));
        await page.keyboard.press('Backspace');
      case 'Добавить сопроводительное':
        await page.evaluate( ()=>{
          document.querySelector(`[data-qa="action-bar"]`).querySelector('span').click()
        })
        await page.waitForSelector(`[data-qa="textarea-wrapper"]`, { visible: true });
        let coords = await page.evaluate( ()=>{
          const element = document.querySelector(`[data-qa="textarea-wrapper"]`);
          // Get the element's position relative to the document
          const rect = element.getBoundingClientRect();
          const x = rect.left + window.scrollX;
          const y = rect.top + window.scrollY;
          return [x,y]
        })
        await page.mouse.click(coords[0]+50, coords[1]+50)
        break;
      default:
        throw `unknown button text ${action_bar_button_text}`;
    }

    const is_match = await this.llm.findIfPositionFitsMe(position_description.description, this.settings.USER.INFO, this.settings.USER.RESUME, this.settings.USER.PREFERENCIES);
    if (is_match.result == false){
      this.temp.insert({"name": position.name, "company_name": position.company_name, "status": TEMP_STATUS_CODES.rejected})
      return false;
    }

    let cover_letter = await this.llm.generateCoverLetter(position_description, this.settings.USER.INFO, this.settings.USER.RESUME, this.settings.USER.NAME);
    if (cover_letter == null){
      this.temp.insert({"name": position.name, "company_name": position.company_name, "status": TEMP_STATUS_CODES.couldnt_generate_cover_letter})
      return false;
    }
    console.log(`[hh.applyForPosition] applying with coverletter ${cover_letter}`)
    await page.keyboard.type(cover_letter);
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate( () =>{
      document.querySelector(`[data-qa="vacancy-response-submit-popup"]`).click()
    })
    await new Promise(r => setTimeout(r, 5000));

    while (true){
      const applied_appeared = await page.evaluate(()=>(document.querySelector(`.vacancy-actions_responded`) != null))
      if (applied_appeared) break 
      await new Promise(r => setTimeout(r, 5000));
    }

    this.temp.insert({"name": position.name, "company_name": position.company_name, "cover_letter": cover_letter, "status": TEMP_STATUS_CODES.applied});
    return true;
  }
  async work(){
    if (false){
      await this.topUpResumes();
    }
    let applied_for_count = 0;
    for (const position_uri of this.settings.HH.SEARCH_QUERIES){
      console.log(`[HH.work] applying for queries in ${position_uri}`)
      let positions = await this.getPositionsFromUrl(position_uri);
      positions = this.filterPositions(positions);
      // positions = await this.llm.filterPositions(positions);
      for (let position of positions){
        const position_page =  await this.newPage();
        const applied = await this.applyForPosition(position, position_page);
        await position_page.close()

        if (applied){
          applied_for_count+=1;
          console.log(`[HH.work] applied for ${applied_for_count} positions this session`)
          if (applied_for_count > 100){
            return;            
          }
        }

      }
    }
  }
}


if (require.main === module) {
  async function main(){
    const hh = new HHru();
    await hh.run();
    console.log("done");
  } 
  main()
}

