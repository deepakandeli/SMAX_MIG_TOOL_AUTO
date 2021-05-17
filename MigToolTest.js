/* node MigToolTest.js "SMAX_PS_Config.json" */
const smax_migtool = require('smax_migtool_0.1');
console.log(process.argv.slice(2));
smax_migtool.main(process.argv.slice(2)[0]);