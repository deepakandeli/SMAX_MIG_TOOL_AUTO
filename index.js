const puppeteer = require('puppeteer');
var jsforce = require('jsforce');
var tools = require('./lib/SMAX_PS_Tools.js');
var srcOrg = require('./lib/SMAX_PS_Src_Org.js');
var targOrg = require('./lib/SMAX_PS_Targ_Org.js');
var sfUtil = require('./lib/SMAX_PS_SF_Util.js');

var config;
var browser;
var noOfIterations=0;
var currIndex=0;
var listOfComp; 
async function main(configPath){
  //Init Config  
    //var configJSON = tools.initConfig('./config/SMAX_PS_Config.json');
    var configJSON = tools.initConfig(configPath);
    config= JSON.parse(configJSON);
    const headLess = config.MiscSetting.HEADLESS;
    var headLessBool=false;
    listOfComp = config.migration.components;
    if(headLess=='TRUE'){
        headLessBool=true;
    }

    //If Checkonly is TRUE then it should be Headless
    var checkOnly = config.MiscSetting.CHECKONLY;
    if(checkOnly=='TRUE'){
      headLessBool=false
    }
    
    const width=1024, height=1600;
    browser = await puppeteer.launch({
      headless: headLessBool,
      defaultViewport: null
    }); 

    try{
      const curComp = listOfComp[currIndex];
      await initiateMigration(browser,config,curComp);
      await sfUtil.waitForMigComp(config.target.Username,config.target.Password,multipleCompCallBack);
    }catch(err){
        console.log(err);
    } 
}

async function multipleCompCallBack(err, res){
  if (err) { return console.error(err); }
  console.log(res);
  if(res.done && res.totalSize == 0){
    currIndex=currIndex+1;
    if(listOfComp.length>currIndex){
      var curComp=listOfComp[currIndex];
      console.log('curComp '+curComp);  
      await initiateMigration(browser,config,curComp);
      await tools.delay(120000);
      await sfUtil.waitForMigComp(config.target.Username,config.target.Password,multipleCompCallBack);
    }else{
      await browser.close();
    }
  }else{
      console.log('Job still running');
      await tools.delay(120000);
      await sfUtil.waitForMigComp(config.target.Username,config.target.Password,multipleCompCallBack);
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
  let validateTimeout = config.MiscSetting.TIMEOUTS.VALIDATE;

  try{
    const validationResponse = await page.waitForResponse(
        (response) =>
          response.url() === 'https://migrate.servicemax.com/MigrationTool/migration/validate' && response.status() === 200
          ,{timeout: validateTimeout});
  }catch (err){
    throw 'Validation request failed '+err;
  }

  console.log('After  Wait Response Validate');

  var checkOnly = config.MiscSetting.CHECKONLY;
  if(checkOnly!='TRUE'){
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
  }
  await page.screenshot({ path: 'example.png' });
  await context.close();
  return ;  
}

module.exports = {
  main
};