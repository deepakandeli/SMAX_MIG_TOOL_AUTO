<centre>
<table border='0px'>
    <tr>
        <td>To Support our work</td>
        <td><a href="https://www.buymeacoffee.com/Lifeonauto" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a></td>
    </tr>
</table>
</centre>


# How to get started with this npm package
## Install package 
```bash
npm i smax_mig_tool_auto
```
## Create a config file with the source and target details

### Example Config file
#### SMAX_PS_Config.json
```json
{
    "source":{
        "Type":"sandbox",
        "Username":"Source_Username",
        "Password":"Source_Password"
    },
    "target":{
        "Type":"production",
        "Username":"Target_Username",
        "Password":"Target_Password"
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
## Create a Javascript program that includes the package and invoke the Main function as shown in the below example

### Package Usage - Example 
#### MigToolTest.js
```js
const smax_migtool = require('smax_mig_tool_auto');
console.log(process.argv.slice(2));
smax_migtool.main(process.argv.slice(2)[0]);
```
## Start the migration process using the below command
```bash
node MigToolTest.js "./SMAX_PS_Config.json"
```

# Things to remember
1. Make sure the Source and Target user do not have Two Factor or Multi Factor Authentication. Avoid MFA/TFA screen by introducing Login IP range on the User Profile