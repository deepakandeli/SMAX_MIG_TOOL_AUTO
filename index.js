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
var tarLoginURL;
var checkOnly;
failedComp=0;
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
    checkOnly = config.MiscSetting.CHECKONLY;
    if(checkOnly=='TRUE'){
      headLessBool=false
    }
    
    browser = await puppeteer.launch({
      headless: headLessBool,
      defaultViewport: null
    }); 

    
    //Login URL
    tarLoginURL='https://login.salesforce.com';
    if(config.target.Type=='sandbox'){
      tarLoginURL='https://test.salesforce.com';
    }

    try{
      const curComp = listOfComp[currIndex];
      var migrationStarted = await initiateMigration(browser,config,curComp);
      console.log('Was Migration Started ? '+migrationStarted);
      if(checkOnly!='TRUE'){
        if(migrationStarted){
          await tools.delay(120000);
          await sfUtil.waitForMigComp(tarLoginURL,config.target.Username,config.target.Password,multipleCompCallBack); 
        }else{
          multipleCompCallBack(false,'NON_QUERY_CALL');
        }
      }      
    }catch(err){
        console.log(err);
        await browser.close();//HAL
    } 
}

async function multipleCompCallBack(err, res){
  if (err) { return console.error(err); }
  //console.log(res);
  if((res=='NON_QUERY_CALL') || (res.done && res.totalSize == 0)){
    currIndex=currIndex+1;
    //console.log('listOfComp.length '+listOfComp.length+' currIndex '+currIndex);
    if(checkOnly!='TRUE'){
      if(listOfComp.length>currIndex){
        var curComp=listOfComp[currIndex];
        var migrationStarted = await initiateMigration(browser,config,curComp);
        console.log('Was Migration Started ? '+migrationStarted);
          if(listOfComp.length==currIndex+1){
            await browser.close();//HAL
            //console.log('failedComp callback 1 ==> '+failedComp);
            if(failedComp>0){
              console.log('Found one or more component that could not be migrated \n');
              process.exit(1);
          }
          }else{
            if(migrationStarted){
              await tools.delay(120000);
              await sfUtil.waitForMigComp(tarLoginURL,config.target.Username,config.target.Password,multipleCompCallBack);
            }else{
              multipleCompCallBack(false,'NON_QUERY_CALL');            }
          }
      }else{
        await browser.close();//HAL
        console.log('failedComp callback 2 ==> '+failedComp);
        if(failedComp>0){
          console.log('Found one or more component that could not be migrated \n');
          process.exit(1);
        }
      }
    }
  }else{
      console.log('Job still running');
      await tools.delay(120000);
      await sfUtil.waitForMigComp(tarLoginURL,config.target.Username,config.target.Password,multipleCompCallBack);
  }  
}


async function initiateMigration(browser,config,curComp){
  var migrationStarted=false;
  console.log('\n*** Start processing components from Index '+currIndex);
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  
  let validateTimeout = config.MiscSetting.TIMEOUTS.VALIDATE;
  await page.setDefaultNavigationTimeout(validateTimeout);   // change timeout

  page.on('console', (log) => console[log._type](log._text));

  const url = config.migration.URL;    
  await page.goto(url);
  const migPagePromise = page.waitForNavigation({waitUntil: "domcontentloaded"});

  var isSPMAlertExists = config.MiscSetting.SPM_MODAL;
  
  var status='';

  try{
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
  
    //console.log('Before Wait Response Validate');

  
    try{
      const validationResponse = await page.waitForResponse(
          (response) =>
            response.url() === 'https://migrate.servicemax.com/MigrationTool/migration/validate' && response.status() === 200
            ,{timeout: validateTimeout});
    }catch (err){
      throw 'Validation request failed '+err;
    }
  
    //console.log('After  Wait Response Validate');
  
    var checkOnly = config.MiscSetting.CHECKONLY;
    if(checkOnly!='TRUE'){
      await tools.delay(10000);
      //console.log('After  Delay');
      const deploySelection = page;
      await deploySelection.$('#validateUI[style*="visibility: visible"]');
      //console.log('After  deploySelection');
    
      var toOverwrite = config.MiscSetting.OVERWRITE;
      if(toOverwrite=='TRUE'){
        //Over write
        const selectAllOverwrite = await deploySelection.$('#selectAll');
        //console.log('After  selectAllOverwrite');
        await selectAllOverwrite.evaluate((e) => e.click());  
        //console.log('After  selectAllOverwrite Click');
  
        //profileSelectAllContainer
        const selectAllCProfile = await deploySelection.$('#profileSelectAllContainer > input');
        if(selectAllCProfile!=null){
          await selectAllCProfile.evaluate((e) => e.click());
          //console.log('After  selectAllCProfile Click');
        }
        
        //div.dependentList > div > input.profile-checkbox
        let profileSel= 'div.dependentList > div > input.profile-checkbox';
        const profileSelFrame = page.mainFrame();
        console.log('Profile Selection - Start');
        debugger;
        //Select all Salesforce profile(s)
        await profileSelFrame.evaluate(({profileSel}) => {
          let profileSelNodes = document.querySelectorAll(profileSel);
          var arrayLength = profileSelNodes.length;
          for(var i = 0; i < arrayLength; i++){
            if(profileSelNodes[i].innerText==='Select all Salesforce profile(s)'){
              profileSelNodes[i].click();
            }
          }
        },{profileSel});
        console.log('Profile Selection - End');
      }
  
      //Expand validation result tree
      let validTree='tr.whiteBg>td[style="width:82%"]>a';
      const validTreeFrame = page;

      await page.exposeFunction("addFailedComp", function(curComp) {
        //failedComp.push(curComp);
        failedComp=failedComp+1;
      });



      await validTreeFrame.evaluate(({validTree}) => {
        let anchorList = document.querySelectorAll(validTree);
        var arrayLength = anchorList.length;
        for(var i = 0; i < arrayLength; i++){
          anchorList[i].click();
        }
      },{validTree});
      debugger;
        
        //let validComps='tr.whiteBg > td';
        let validComps='tr.whiteBg';
        const validationFrame = page.mainFrame();
        console.log('Validation Result - Start');
         await validationFrame.evaluate(({validComps}) => {
          let anchorList = document.querySelectorAll(validComps);
          var arrayLength = anchorList.length;
          for(var i = 0; i < arrayLength; i++){
            let curChildNode=anchorList[i].childNodes;
            debugger;
            var curCompStatusStr='';
            for(var j = 0; j < curChildNode.length; j++){
              let curNodeName = curChildNode[j].nodeName;
              if(curNodeName==='TD'){
                let curNodeStyle = curChildNode[j].getAttribute('style');
                let curNodeId = curChildNode[j].getAttribute('Id');
                if(curNodeStyle==='width:82%'){
                  curCompStatusStr+=curChildNode[j].innerText;
                }else if(curNodeId==='migrateData' || curNodeId==='blockData'){
                  curCompStatusStr+=' : '+curChildNode[j].innerText;
                }
              }
            }
            if(curCompStatusStr!=''){
              console.log('--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
              console.log(curCompStatusStr);
              console.log('--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
              //This item will not be migrated
              if(curCompStatusStr.includes('This item will not be migrated')){
                addFailedComp(curCompStatusStr);
              }              
            }          
          }
        },{validComps});
        console.log('Validation Result - End ');

      
        
      const migrateButton = await deploySelection.waitForSelector('#deployData');
      //console.log('After  migrateButton');
      await migrateButton.evaluate((e) => e.click());//HAL
      migrationStarted=true;
      //console.log('After  migrateButton Click');
    
      //#msgBox1[style*="visibility: visible"]
      let deployMessage = await postSelection.evaluate(() => {
        let el = document.querySelector("#msgBox1[style*=\"visibility: visible\"]>#content");
        return el ? el.innerText : ""
      })
      if(deployMessage=='None of the selected configuration items qualify for migration.'){
        //throw 'No component selected for deployment';
        console.log('No component selected for deployment');
        migrationStarted=false;
      } 
      //await page.screenshot({ path: 'example.png' });
      await context.close();//HAL
    }
  }catch(err){
    console.log(err);
    var pathLoc = 'error_'+Date.now()+'.png';
    await page.screenshot({ path: pathLoc,fullPage: true});
    await context.close();//HAL
    failedComp=failedComp+1;
  }
  return migrationStarted;  
}

module.exports = {
  main
};