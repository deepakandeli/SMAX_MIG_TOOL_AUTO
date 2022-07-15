/* node MigToolTest.js "config/SMAX_PS_Config_Package.json" |tee log.txt */
/* node MigToolTest.js "config/SMAX_PS_Config_LIST.json" |tee log.txt */

const smax_migtool = require('./index.js');
console.log(process.argv.slice(2));
smax_migtool.main(process.argv.slice(2)[0]);