const express = require('express');

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

const router = express.Router();

router.get("/GetOwn", async (req, res) => {
    userInfo = await DB.GetUser(await Login.GetSessionUserID());

    res.json({
        username: userInfo.username,
        admin: userInfo.admin, 
        modifyInspirationLabels: userInfo.modify_inspiration_labels, 
        modifyUsers: userInfo.modify_users, 
        modifySettings: userInfo.modify_settings,
        modifyFiles: userInfo.modify_files,
        watchLogs: userInfo.watch_logs
    });
});

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission("modify_users"))) {
        res.status(401);
        res.send("Geen permissie voor dit deel van de API");
        return;
    }
    next();
});

function ReturnError(res, error) {
    res.status(400);
    res.send(error);
}

router.get("/GetAll", async (req, res) => {
    userInfo = await DB.GetAllUserData();

    var output = [];
    for(var i = 0; i < userInfo.length; i++) {
        output.push({ 
            username: userInfo[i].username,
            admin: userInfo[i].admin, 
            modifyInspirationLabels: userInfo[i].modify_inspiration_labels, 
            modifyUsers: userInfo[i].modify_users, 
            modifySettings: userInfo[i].modify_settings,
            modifyFiles: userInfo[i].modify_files,
            watchLogs: userInfo[i].watch_logs
        });
    }
    res.json(output);
});

router.put("/Grant", async (req, res) => {
    var data = req.body;

    if(data.username == undefined)
        return ReturnError(res, "Specificeer een gebruikersnaam");
    else if(data.username.length > 255)
        return ReturnError(res, "Gebruikersnaam kan niet langer dan 255 karakters zijn");
    else if(data.username.indexOf('"') > -1)
        return ReturnError(res, "Gebruikersnaam kan niet \" erin hebben");
    var username = data.username;
    
    if((await Login.GetSessionUsername()) == username) return ReturnError(res, "Can't modify self");
    
    if(data.admin == undefined)
        return ReturnError(res, "Specificeer permissie voor admin");
    else if(data.admin != "1" && data.admin != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var admin = data.admin == "1";
    
    if(data.modifyInspirationLabels == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen van inspiratie labels");
    else if(data.modifyInspirationLabels != "1" && data.modifyInspirationLabels != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyInspirationLabels = data.modifyInspirationLabels == "1";
    
    if(data.modifyUsers == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen gebruikers");
    else if(data.modifyUsers != "1" && data.modifyUsers != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyUsers = data.modifyUsers == "1";
    
    if(data.modifySettings == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen instellingen");
    else if(data.modifySettings != "1" && data.modifySettings != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifySettings = data.modifySettings == "1";

    if(data.modifyFiles == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen files");
    else if(data.modifyFiles != "1" && data.modifyFiles != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyFiles = data.modifyFiles == "1";

    if(data.watchLogs == undefined)
        return ReturnError(res, "Specificeer permissie voor bekijken logs");
    else if(data.watchLogs != "1" && data.watchLogs != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var watchLogs = data.watchLogs == "1";
    
    await Login.GiveUserPermissions(username, admin, modifyInspirationLabels, modifyUsers, modifySettings, modifyFiles, watchLogs);
    res.send("Permissies aangepast");
});

module.exports = router;