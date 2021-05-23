<centre>
<table border='0px'>
    <tr>
        <td>To Support our work</td>
        <td><a href="https://www.buymeacoffee.com/Lifeonauto" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a></td>
    </tr>
</table>
</centre>


# How to get started with this npm package
## 1. Install package 
```bash
npm i smax_mig_tool_auto
```
## 2. Create a config file with the source and target details
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
        "components":[["test"]                        
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
Mention the Org Type, Username and Password for Source and Target Org
Also mention the components that needs to be migrated. 
At the moment this feature only supports smaller volume of migration, so please do not include entire folders such as SFM Wizard, SFM Search etc
## 3. Create a Javascript program that includes the package and invoke the Main function as shown in the below example

### Package Usage - Example 
#### MigToolTest.js
```js
const smax_migtool = require('smax_mig_tool_auto');
console.log(process.argv.slice(2));
smax_migtool.main(process.argv.slice(2)[0]);
```
## 4. Start the migration process using the below command
```bash
node MigToolTest.js "./SMAX_PS_Config.json"
```

# Things to remember
1. Make sure the Source and Target user do not have Two Factor or Multi Factor Authentication. Avoid MFA/TFA screen by introducing Login IP range on the User Profile
2. Currently does not support ServiceMax Profile migration
3. Use the Checkonly setting as TRUE to only validate the components between the 2 orgs and it will not be Headless process