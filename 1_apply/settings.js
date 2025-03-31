
// user related
const USER_RESUME = `
Vladislav Abyshkin
vladislav.abyshkin@gmail.com
tg:@shmeshhlai
https://github.com/tachikoma-av


WORK EXPERIENCE
         											          
Youfeng Information Technology Co., Ltd.
Test Automation Engineer — Remote							          May 2023 – June 2024				           
Developed an automation tool for testing game mechanics in Path of Exile, which simulated player actions and automated the collection of in-game resources. The project helped identify bottlenecks in gameplay and ensured the stability of interaction systems.
Set up multi-threaded test environments on Hyper-V virtual machines for load testing.
Utilized Python (libraries: NumPy, Matplotlib, OpenCV, PyWin32) and C# (working with JSON, creating web servers) to build a reliable and scalable tool.
Created a testing process that involved developing code in Jupyter Notebook, followed by stability checks and compilation using Cython for the production environment.
Conducted testing of new game strategies using both manual and automated approaches, leading to increased performance and the identification of bugs in the game environment.
Implemented logging and data analysis to monitor system stability and enable automatic recovery after errors.
After optimizations, the performance of the test environment increased fivefold, while deployment costs were reduced to zero, significantly lowering operational infrastructure maintenance costs.
Collaborated with managers and the sales department to ensure smooth data and result transfer, as well as testing and implementing new approaches to enhance the stability and autonomy of the tool.

Backend developer— Remote							         	            Jan. 2022 – Apr. 2023
										     		       
Developed a Telegram bot to automate product selection, payment, and order delivery, reducing operator workload and minimizing errors.
Used Python/Django for bot development and JavaScript/Express with Puppeteer for automating Ethereum transaction verification.
Performed manual testing of critical scenarios, ensuring reliability across the store, payment, and warehouse systems.
Developed an admin panel for easy product information management by store employees.
Ensured security and system stability through Telegram’s built-in features and rigorous testing.

Software developer —Remote	   						             Sep.2020– Dec. 2021

Built a Python/Selenium scraper for identifying surebets on bookmaker sites and notifying users via Telegram API.
Developed parsers for Amazon, Etsy, eBay, and AliExpress, managing tasks with Puppeteer and Express, and using a master node to coordinate proxies.
Created web applications and APIs with Django and Flask for managing data and integrating external notifications.
Refined web scraping techniques to bypass anti-bot measures and ensure successful data collection.

SKILLS & INTERESTS 
Programming Languages: Python, C#, JavaScript
Technologies & Tools: Hyper-V, Jupyter Notebook, Django, Flask, Puppeteer, Selenium, PyWin32
Languages: Russian (Native), English (Upper-Intermediate), Chinese (Upper-Intermediate)
Interests: Sci-fi, RPGs, Food, Yoga
`
const USER_INFO =`
i'm russian. male 29, from a small town on the east of russia. I have experience in application development. i have a open source project on github. i can work remotely and i am fluent in english. i also can speak chinese.
i started my development journey as a freelancer on upwork. the first orders were about the data mining. manually extracting data. there i did learn some browser automation. then i started to take orders for some browser automation. most of the tasks were releated to scraping, so i did migrate from python selenium to javascript puppeteer. my first big project there was to automate the spending free deposit process on some gambling website and help to scale it, my next big project was the e-commerce web scraping from aliexpress+amazon+ebay+etsy, i was responsible for making the crawlers and allowing it to scale on free deploying platform(heroku was free to deploy by that time) .
then i got an order for making a telegram bot for a company. they were selling some phyical stuff online. but the order+payment+delivery process was done through operators. which were slow, stealing some, made mistakes sometimes. I did automate the whole purchase process via creating telegram bot which also did include admin panel with different levels of permissions for delivery guys and operators(which were mostly acting as a customer support).
later, i had a gap in development, i was working non developer job irl and got into crypto mining. i didnt do that much there, since the only thing i did it was control panel to setup djust old r9 fury gpu which didnt have linux support.
later i decided to quit my non developer irl job, and started to look for a job as a software developer. during search process, i decided to improve my skills of computer vision and game automation. i basically was reimplementing centernet in keras for getting the data from game window of Dota2, i was planning to make TBD(100 hours of playtime) accounts and sell them for 40cny. but later, a friend of mine asked me if i can automate another game, path of exile. there was an infinite heist strat which did allow to get 20cny daily per window. and scaling was easy, i shared my software with him and we did start to scale. later another guy contacted me and told that it's also easy to scale simulacrum on dd for 10cny account price. i started to do this strategy and later reselling company started to use my software for %. managing was hell. then, that guy asked if i can do beast farming on lowtier maps, it was cheaper to deploy charaacters since there was no need to buy the stash tabs(20 dollars per account). and i did got into mapping, he was mostly promoting some cheesy strats, i was making the software. i was making the core slowly, since i was managing, fixing, improving things by that time. 2 years i was working like that. originally, i was getting the game data by running the http server in HUD(Gamehelper), later i made a plugin for dreampoebot, but it was bad to run on chinese region, due to GFW and it was also 20 dollars per month per window. later i did make a plugin for ExileApi to retrieve ingame data. and processing it with python. i also did use some computer vision things, all the inputs were sent by socket running and executing commands like "mouseClick?x=100&y=200&" which did use win32 api, i basically made it autonomous to complete around 70% of storyline. so scaling did become easier. i made a core of my bot as oop style for data, and all the routines were in functional programming like function(another_fucntion). and the whole workflow looks like while(true){refreshData(); doAction();}, sometimes those actions are nested and actions can be a loop of actions and so on.
Then, path of exile 2 was released, i did public my bot as open source, and still was looking for a job. around 200 applications, still no job, only 3 interviews. and still decline without explaining he reason. later i did start posting some videos on my youtube channel with bot demo + link to my github, my project got 45 stars and 36 forks, im pretty sure there are some ppl activly using it, but i dont want to make it paid, since it's functionality sucks in a comparasion with paid ones, it's not user friendly, and mostly a project for coders\devs rather than usual users.
I'm currently developing a tool which helps me to find a job. I run ollama locally with deepseek + qwen2.5, and do some browser automation using playwright. I do apply for jobs using playwright, some logic such as filtering, and cover message text are generated by llm.
`
const USER_NAME ={
  "Russian": "Абышкин Владислав",
  "English": `Vladislav Abyshkin`,
} 
const USER_PREFERENCES = `
user wants:
- to do automation
- devops
- QA, testing
- data engineering
- to do development or coding job
- AI field is ok
user doesnt want to:
- do PHP development
- do 1C development
- teaching, tutoring
`;

// llm related
// const LLM_BACKEND =  "local"; // "local" or "deepseek" or "chatgpt" or "gemini"
// const LLM_MODEL =  `qwen2.5:14b`;
// const LLM_PROXY =  null; // null or `http:127.0.0.1:34567@password`
// const LLM_API_KEY =  `your_api_key`; // only for remote models

// const LLM_BACKEND =  "chatgpt"; // "local" or "deepseek" or "chatgpt" or "gemini"
// const LLM_MODEL =  `gpt-4o`;
// const LLM_PROXY =  `http:127.0.0.1:34567`; // null or `http:127.0.0.1:34567@password`
// const LLM_API_KEY =  `<your_api_key>`; // only for remote models

const LLM_BACKEND =  "gemini"; // "local" or "deepseek" or "chatgpt" or "gemini"
const LLM_MODEL =  `gemini-2.0-flash-001`;
const LLM_PROXY =  `http:127.0.0.1:34567`; // null or `http:127.0.0.1:34567@password`
const LLM_API_KEY =  `<your_api_key>`; // only for remote models

// hh.ru related
const HH_SEARCH_QUERIES = [
  // ai || llm
  `https://hh.ru/search/vacancy?ored_clusters=true&items_on_page=100&order_by=publication_time&search_period=3&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line&professional_role=156&professional_role=160&professional_role=165&professional_role=124&professional_role=96&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=ai+%7C%7C+llm&enable_snippets=false`,
  // playwright
  `https://hh.ru/search/vacancy?text=Playwright&excluded_text=&salary=&currency_code=RUR&experience=doesNotMatter&order_by=relevance&search_period=3&items_on_page=100&L_save_area=true&hhtmFrom=vacancy_search_filter`,
  // recommended for resume
  `https://hh.ru/search/vacancy?resume=9bbf94dfff0e6361050039ed1f745171586c4c&text=&excluded_text=&salary=&currency_code=RUR&experience=doesNotMatter&work_format=REMOTE&order_by=relevance&search_period=3&items_on_page=100&L_save_area=true&hhtmFrom=vacancy_search_filter`,
  // startup
  `https://hh.ru/search/vacancy?text=%22%D1%81%D1%82%D0%B0%D1%80%D1%82%D0%B0%D0%BF%22&salary=&professional_role=156&professional_role=160&professional_role=165&professional_role=96&professional_role=104&professional_role=113&professional_role=148&professional_role=114&professional_role=124&ored_clusters=true&items_on_page=100&experience=between1And3&search_period=3&excluded_text=&work_format=REMOTE&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line`,
  // devops
  `https://hh.ru/search/vacancy?ored_clusters=true&items_on_page=100&order_by=publication_time&search_period=3&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line&enable_snippets=false&professional_role=160&professional_role=165&professional_role=124&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=devops`,
  // by categories
  `https://hh.ru/search/vacancy?ored_clusters=true&items_on_page=100&order_by=publication_time&search_period=3&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line&enable_snippets=false&professional_role=156&professional_role=160&professional_role=165&professional_role=124&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=`,
  // keyword automation
  `https://hh.ru/search/vacancy?order_by=publication_time&search_period=3&items_on_page=100&L_save_area=true&hhtmFrom=vacancy_search_filter&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=automation&enable_snippets=false`,
];
const HH_POSITION_TITLE_KEYWORDS_TO_IGNORE = [
  `teacher`,
  `1c`,
  `1с`,
  `senior`,
  `lead`,
  `php`
];

// compose
const USER = {
  NAME: USER_NAME,
  RESUME: USER_RESUME,
  INFO: USER_INFO,
  PREFERENCES: USER_PREFERENCES,
};

const LLM = {
  BACKEND: LLM_BACKEND,
  MODEL: LLM_MODEL,
  PROXY: LLM_PROXY,
  API_KEY: LLM_API_KEY,
};

const HH = {
  SEARCH_QUERIES:HH_SEARCH_QUERIES,
  POSITION_TITLE_KEYWORDS_TO_IGNORE: HH_POSITION_TITLE_KEYWORDS_TO_IGNORE
};

module.exports = {
  USER,
  LLM,
  HH,
};