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
## 2a. Create a config file with the source and target details with migration type = LIST
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
        "Type":"LIST",
        "components":[
            ["SFM Wizards"]  
        ],
        "URL":"https://migrate.servicemax.com/MigrationTool/"
    },
    "MiscSetting":{
        "CHECKONLY":"TRUE",
        "SPM_MODAL":"FALSE",
        "OVERWRITE":"TRUE",
        "HEADLESS":"TRUE",
        "TIMEOUTS":{
            "SFLOGIN":600000,
            "VALIDATE":3600000,
            "GLOBAL":3600000           
        }
    }
}
```
## 2b. Create a config file with the source and target details with migration type = PACKAGE
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
        "Type":"PACKAGE",
        "Location":"./manifest/package_DKSH.xml",
        "components":[
            ["SFM Wizards"]  
        ],
        "URL":"https://migrate.servicemax.com/MigrationTool/"
    },
    "MiscSetting":{
        "CHECKONLY":"FALSE",
        "SPM_MODAL":"FALSE",
        "OVERWRITE":"TRUE",
        "HEADLESS":"FALSE",
        "SPLITS":{
            "SFM":"1",
            "SFW":"1"
        },
        "TIMEOUTS":{
            "SFLOGIN":600000,
            "VALIDATE":3600000,
            "GLOBAL":3600000           
        }
    }
}
```
Mention the Org Type, Username and Password for Source and Target Org
If one has package.xml from Watchman, set  the migration type attribute as 'PACKAGE' and set the relative path of the package.xml file
If one has no package.xml from Watchman, set the migration type attribute as 'LIST' and set the list of component into a 2D array
Note: At the moment this feature only supports smaller volume of migration, so please do not include entire folders such as SFM Wizard, SFM Search etc

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
node MigToolTest.js "config/SMAX_PS_Config.json" |tee log.txt
```

# Things to remember
1. Make sure the Source and Target user do not have Two Factor or Multi Factor Authentication. Avoid MFA/TFA screen by introducing Login IP range on the User Profile
2. Currently does not support ServiceMax Profile migration
3. Use the Checkonly setting as TRUE to only validate the components between the 2 orgs and it will not be Headless process
4. If Checkonly is TRUE, only the first index in the array of component will be processed.



# Release Log
- 1.8 Logging the validation results to a log file and Seletion of Profile from the validation screen.
- 1.9 Fixes related to Logging SFM dependent list post validation
- 1.10 Fixes related to expanding the validation screen
- 1.11 Fixes the "No component selected for deployment" scenario
- 1.12 Added Try-Catch block to progress if one of the iteration fails instead of terminating the job
- 1.13 Displaying Validation result screen
- 1.14 Moved Override flag logic to limit it to Override selection and Profile selection
- 1.15 Calling out if there was any component that was not deployed
- 1.16 Exit process.exit(1);
- 1.17 Added Global Variable to check if any component failed
- 1.18 Seperate Timeouts for Validation, Login and Global
- 1.19 Added Package.xml support, now config file or package.xml can be used identify the deployable components