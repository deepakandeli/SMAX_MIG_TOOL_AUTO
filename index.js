const puppeteer = require('puppeteer');
var tools = require('./lib/SMAX_PS_Tools.js');
var srcOrg = require('./lib/SMAX_PS_Src_Org.js');
var targOrg = require('./lib/SMAX_PS_Targ_Org.js');
var config;
var browser;

async function main(configPath){
  //Init Config  
    //var configJSON = tools.initConfig('./config/SMAX_PS_Config.json');
    var configJSON = tools.initConfig(configPath);
    config= JSON.parse(configJSON);
    const headLess = config.MiscSetting.HEADLESS;
    var headLessBool=false;
    if(headLess=='TRUE'){
        headLessBool=true;
    }
    const width=1024, height=1600;
    browser = await puppeteer.launch({
      headless: headLessBool,
      defaultViewport: null
    }); 

    const listOfComp = config.migration.components;
    try{
        for (let index = 0; index < listOfComp.length; index++) {
            const curComp = listOfComp[index]
            await initiateMigration(browser,config,curComp);
          }
    }catch(err){
        console.log(err);
    }

    finally{
        await browser.close();
    }    
}


async function initiateMigration(browser,config,curComp){
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  const url = config.migration.URL;    
  await page.goto(url);
  const migPagePromise = page.waitForNavigation({waitUntil: "domcontentloaded"});

  var isSPMAlertExists = config.MiscSetting.SPM_MODAL;

  var status='';
  await Promise.all([
    status=srcOrg.setupSrcOrg(browser,page,config)
  ]);

  if(isSPMAlertExists=='TRUE'){
    //Ok Button
    await tools.modalOK(page,'#okbtn');
  }

  await migPagePromise;
  const pageFrame = page.mainFrame();
  
  await Promise.all([
    targOrg.setupTargOrg(browser,page,config)
  ]);
  
  //Expand All Tree
  await tools.expandTree(page,pageFrame);

  if(curComp.length<1){
    throw 'No component found in the config file';
  }
  await tools.selectElement(page,curComp);

  const postSelection = page.mainFrame();

  let seletedTar = await postSelection.evaluate(() => {
    let el = document.querySelector("ul.myList > ul")
    return el ? el.innerText : ""
  })
  if(seletedTar==''){
    throw 'No component selected for migration';
  }

  const validateButton = await postSelection.$('input[value=\'Validate\']');
  await validateButton.click();

  console.log('Before Wait Response Validate');
  const validationResponse = await page.waitForResponse(
    (response) =>
      response.url() === 'https://migrate.servicemax.com/MigrationTool/migration/validate' && response.status() === 200
      ,{timeout: 130000});
  console.log('After  Wait Response Validate');
  await tools.delay(10000);
  console.log('After  Delay');
  const deploySelection = page;
  await deploySelection.$('#validateUI[style*="visibility: visible"]',{timeout: 120000});
  console.log('After  deploySelection');

  var toOverwrite = config.MiscSetting.OVERWRITE;
  if(toOverwrite=='TRUE'){
    //Over write
    const selectAllOverwrite = await deploySelection.$('#selectAll',{timeout: 120000});
    console.log('After  selectAllOverwrite');
    await selectAllOverwrite.evaluate((e) => e.click());  
    console.log('After  selectAllOverwrite Click');
  } 
  
    
  const migrateButton = await deploySelection.waitForSelector('#deployData',{timeout: 120000});
  console.log('After  migrateButton');
  await migrateButton.evaluate((e) => e.click());
  console.log('After  migrateButton Click');

  //#msgBox1[style*="visibility: visible"]
  let deployMessage = await postSelection.evaluate(() => {
    let el = document.querySelector("#msgBox1[style*=\"visibility: visible\"]>#content");
    return el ? el.innerText : ""
  })
  if(deployMessage=='None of the selected configuration items qualify for migration.'){
    throw 'No component selected for deployment';
  } 

  await page.screenshot({ path: 'example.png' });
  return ;  
}

module.exports = {
  main
};