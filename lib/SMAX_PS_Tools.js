const fs =  require('fs');

module.exports = {
  login2SF: function (page,newPagePromise,username, password, onCompleteSelector) {
    return loginToSalesforce(page,newPagePromise,username, password, onCompleteSelector);
  },
  modalOK : function (page,onCompleteSelector) {
    return modalOK(page,onCompleteSelector);
  },
  initConfig : function (configFilePath) {
    return fs.readFileSync(configFilePath, (err, data) => {
      if (err) throw err;      
    });
  },
  expandTree : async function(page,pageFrame){
    //TREE Expand All
    let listSourceTreeExp="ul > li.jstree-closed > i.jstree-icon";
    const sourceTreeExp = await pageFrame.waitForSelector(listSourceTreeExp);
    await page.evaluate((selector) => {
      const list = Array.from(document.querySelectorAll(selector));
      list.map(data => {
        data.click();
      });
    }, listSourceTreeExp);
  },
  selectElement : async function(page,listOfComp){
    let eleMig = 'a.jstree-anchor';
    for(let index = 0; index < listOfComp.length; index++){
      const curComp = listOfComp[index];
      await page.evaluate(({eleMig,curComp}) => {
        let anchorList = document.querySelectorAll(eleMig);
        let ele2Sel=curComp;
        //console.log('ele2Sel 1 '+ele2Sel );
        var arrayLength = anchorList.length;
        for(var i = 0; i < arrayLength; i++){
          let anchorText=anchorList[i].innerText;
          if(anchorText.includes(ele2Sel)){
            anchorList[i].click();
            break;
          }
        }
      },{eleMig,curComp});
    }
  },
  delay : function (time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
}




async function loginToSalesforce (page,sfPagePromise,username, password, onCompleteSelector) {
  const sfPage = await sfPagePromise;
  const sfPageMain = sfPage.mainFrame();
  const usernameEle = await sfPageMain.$('#username');
  await usernameEle.type(username);

  const passwordEle = await sfPageMain.$('#password');
  await passwordEle.type(password);

  const Login = await sfPageMain.$('#Login');
  
  //Auth
  await Promise.all([
    sfPageMain.waitForSelector('#oaapprove',{timeout: 120000}),sfPageMain.waitForNavigation(),await Login.click()
  ]);

  
  //oaapprove
  sfPageMain.waitForSelector('#oaapprove',{timeout: 120000});
  const auth = await sfPageMain.$('#oaapprove');

  await Promise.all([
    page.waitForSelector(onCompleteSelector,{timeout: 120000}),await auth.click()
  ]);

  return;
}

async function modalOK (page,onCompleteSelector){
  const okButton = await page.$(onCompleteSelector);
  await okButton.evaluate((e) => e.click());
  return;
}

async function selectElement2Migrate(page,eleMig,ele2Sel){
  await page.evaluate((eleMig) => function(ele2Sel){
    let anchorList = document.querySelectorAll(eleMig);
    anchorList.forEach(e => function(ele2Sel){
      //let ele2Sel='SMAX PS Sysmex Work Order Entitlement Rule (Auto Entitlement WO)';
      //let ele2Sel='Configuration Profiles';
      let anchorText = e.innerText;
      //console.log("anchorText::", anchorText);
        if(anchorText.includes(ele2Sel)){
          e.click();
        }
      });
   },eleMig);
}

