const { chromium } = require('playwright');
const { getLLmModule } = require('./llm');

const settings = require('./settings');


class JobApplicant{
  async newPage(){
    
    // playwright
    const new_page = await this.browser.contexts()[0].newPage();
    await new_page.route('**/*.{png,jpg,jpeg}', route => route.abort());

    // puppeteer
    // const new_page = await this.browser.newPage();
    // await new_page.setRequestInterception(true);
    // new_page.on('request', (request) => {
    //   if (request.resourceType() === 'image') request.abort();
    //   else request.continue();
    // });

    return new_page;
  };
  async start(){
    this.browser = await chromium.connectOverCDP('http://localhost:9222');
    this.main_page = await this.newPage();
    this.settings = settings;
    this.llm = getLLmModule(settings);
  }
  async prepare(){
    // do basic checks, smth like check if authenticated or whatever
  }
  async work(){
    // top up resume if needed
    // apply for positions
  }
  async stop(){
    await this.main_page.close();
    await this.browser.close()
  }
  async run(){
    await this.start();
    await this.prepare();
    await this.work();
    await this.stop();
  }
}

module.exports = { JobApplicant };
