<centre>
<table border='0px'>
    <tr>
        <td>To Support our work</td>
        <td><a href="https://www.buymeacoffee.com/Lifeonauto" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a></td>
    </tr>
</table>
</centre>


## How to get started with npm package
1. Install package npm i smax_mig_tool_auto
2. Create a config file with the source and target details
    
Example Config file
===============
```json
{
    "source":{
        "Type":"sandbox",
        "Username":"deepak.andeli@servicemax.com.hts.dev06",
        "Password":"12345"
    },
    "target":{
        "Type":"production",
        "Username":"deepak.andeli@901trial.com",
        "Password":"12345"
    },
    "migration":{
        "components":[["SFM Wizards","test"]                        
        ],
        "URL":"https://migrate.servicemax.com/MigrationTool/"
    },
    "MiscSetting":{
        "SPM_MODAL":"FALSE",
        "OVERWRITE":"FALSE",
        "HEADLESS":"TRUE"
    }
}
```

That was my JSON code block.
    Mention the Org Type, Username and Password for Source and Target Org
3. Create a Javascript program that includes the package and invoke the Main function as shown in the below example

Package Usage - Example MigToolTest.js
===============
```js
const smax_migtool = require('smax_mig_tool_auto');
console.log(process.argv.slice(2));
smax_migtool.main(process.argv.slice(2)[0]);
```
4. Refer to the test class to understand how to use the package and run the same.
node MigToolTest.js "./config/SMAX_PS_Config.json"



## Things to remember
1. Make sure the Source and Target user do not have Two Factor or Multi Factor Authentication. Avoid MFA/TFA screen by introducing Login IP range on the User Profile