var jsforce = require('jsforce');

module.exports = {
    waitForMigComp: async function (loginURL,username,password,multipleCompCallBack){
        return await queryMigJobStatus(loginURL,username,password,multipleCompCallBack);
    }
}

async function queryMigJobStatus(loginURL,username,password,multipleCompCallBack){
    var conn = new jsforce.Connection({loginUrl : loginURL});
    conn.login(username, password, async function(err, res) {
      if (err) { return console.error(err); }
      await queryMigJobStatusCon(conn,multipleCompCallBack);
    });
    
}

async function queryMigJobStatusCon(conn,multipleCompCallBack){
    conn.query('SELECT Id,Name, SVMXC__OptiMax_Message__c,CREATEDDATE FROM SVMXC__SVMX_Jobs__c WHERE SVMXC__Type__c=\'Configuration Migration Tool\' AND SVMXC__OptiMax_Message__c <> \'Success\' ORDER BY CREATEDDATE DESC LIMIT 1',
    async function(err, res) {
        multipleCompCallBack(err, res);
    });
}