var tools = require('./SMAX_PS_Tools.js');

module.exports = {
    setupSrcOrg: function (browser,page,config){
        return setSrcOrg(browser,page,config);
    }
}
async function setSrcOrg(browser,page,config){
    await page.waitForSelector('#step1');
    //Pop up Source 
    const newPagePromise = getSrcPageWhenLoaded(browser);
    await page.click('.sourceLogin'); //Opens pop-up window
    const newPage = await newPagePromise;
    const newPageMain = newPage.mainFrame();

    //importType Radio button
    const importType = await newPageMain.waitForSelector('input[value=\'migrate\']');
    await  importType.click();

    //Org Type
    console.log('config.source.Type '+config.source.Type );
    const orgType = await newPageMain.select('#orgType',config.source.Type);
    

    //Login
    await Promise.all([
        newPageMain.waitForNavigation(),
        await newPageMain.click('#loginNext')        
    ]);

    //Login to Salesforce & Authorize
    //await tools.login2SF(page,newPagePromise,'deepak.andeli@sysmex.dev06','Melbourne@12345','#okbtn');
    var isSPMAlertExists = config.MiscSetting.SPM_MODAL;
    var onCompleteSelector='';
    if(isSPMAlertExists=='TRUE'){
        onCompleteSelector='#okbtn';
    }else{
        onCompleteSelector='ul > li.jstree-closed > i.jstree-icon';
    }
    await Promise.all([
        await tools.login2SF(page,newPagePromise,config.source.Username,config.source.Password,onCompleteSelector)
    ]);
    
    return;
}

function getSrcPageWhenLoaded(browser) {
    return new Promise((x) => browser.once('targetcreated', async (target) => {
        const newPage = await target.page();
        const newPagePromise = new Promise(() => newPage.once('domcontentloaded', () => x(newPage)));
        const isPageLoaded = await newPage.evaluate(() => document.readyState);
        return isPageLoaded.match('complete|interactive') ? x(newPage) : newPagePromise;
    }));
  }