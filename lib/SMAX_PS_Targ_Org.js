var tools = require('./SMAX_PS_Tools.js');

module.exports = {
    setupTargOrg: function (browser,page,config){
        return setTargOrg(browser,page,config);
    }
}
async function setTargOrg(browser,page,config){
    const pageFrame = page.mainFrame();
    await page.waitForSelector('#step2');
    let targetBtn = 'div#step2 > div > a.btn';
    await pageFrame.waitForSelector(targetBtn);
    const newTargPagePromise = gettarPageWhenLoaded(browser);  

    await page.evaluate((targetBtn) => {
    const tarBtn = document.querySelector(targetBtn);
    tarBtn.click();
    }, targetBtn);
    


    const newTargPage = await newTargPagePromise;
    const targNewPageMain = newTargPage.mainFrame();

    //Org Type
    console.log('config.target.Type '+config.target.Type );
    const orgType = await targNewPageMain.select('#orgType',config.target.Type);

    //Login
    await Promise.all([
        targNewPageMain.waitForNavigation(),
        await targNewPageMain.click('#loginNext')        
    ]);

    //Login to Salesforce & Authorize
    try{
        await Promise.all([
            await tools.login2SF(page,newTargPagePromise,config.target.Username,config.target.Password,'#targetLogout:not(.con-hidden)',config.MiscSetting.TIMEOUTS.SFLOGIN)
        ]);
    }
    catch(err){
        errorMesg="TargetLoginfailed : ";
        //var pathLoc = 'errorMesg'+Date.now()+'.png';
        //await targNewPageMain.screenshot({ path: pathLoc,fullPage: true});
        throw errorMesg+' '+err;
    }    
    
    return;
}
  function gettarPageWhenLoaded(browser) {
    return new Promise((y) => {
      browser.once('targetcreated', async (target2) => {
          const newTarPage = await target2.page();
          const newTarPagePromise = new Promise(() => newTarPage.once('domcontentloaded', () => y(newTarPage)));
          const isPageLoaded = await newTarPage.evaluate(() => document.readyState);
          return isPageLoaded.match('complete|interactive') ? y(newTarPage) : newTarPagePromise;
      })
    }
    );
  }