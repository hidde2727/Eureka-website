const express = require('express');
const router = express.Router();

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

router.get("/GetOwn", async (req, res) => {
    userInfo = await DB.GetUser(await Login.GetSessionUserID());

    res.json({ 
        modifyUsers: userInfo.modify_users, 
        addFiles: userInfo.add_files, 
        modifyInspiration: userInfo.modify_inspiration, 
        modifyProjects: userInfo.modify_projects
    });
});

router.get("/GetAll", async (req, res) => {
    userInfo = await DB.GetAllUserData();

    var output = [];
    for(var i = 0; i < userInfo.length; i++) {
        output.push({ 
            username: userInfo[i].username,
            modifyUsers: userInfo[i].modify_users, 
            addFiles: userInfo[i].add_files, 
            modifyInspiration: userInfo[i].modify_inspiration, 
            modifyProjects: userInfo[i].modify_projects
        });
    }
    res.json(output);
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

router.put("/Grant", async (req, res) => {
    var data = req.body;

    if(data.username == undefined)
        return ReturnError(res, "Specificeer een gebruikersnaam");
    else if(data.username.length > 255)
        return ReturnError(res, "Gebruikersnaam kan niet langer dan 255 karakters zijn");
    else if(data.username.indexOf('"') > -1)
        return ReturnError(res, "Gebruikersnaam kan niet \" erin hebben");
    var username = data.username;
    
    if(await Login.GetSessionUsername() == username) return ReturnError(res, "Can't modify self");
    
    if(data.modifyUsers == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen gebruikers");
    else if(data.modifyUsers != "1" && data.modifyUsers != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyUsers = data.modifyUsers == "1";
    
    if(data.addFiles == undefined)
        return ReturnError(res, "Specificeer permissie voor toevoegen files");
    else if(data.addFiles != "1" && data.addFiles != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var addFiles = data.addFiles == "1";
    
    if(data.modifyProjects == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen projecten");
    else if(data.modifyProjects != "1" && data.modifyProjects != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyProjects = data.modifyProjects == "1";
    
    if(data.modifyInspiration == undefined)
        return ReturnError(res, "Specificeer permissie voor veranderen inspiratie");
    else if(data.modifyInspiration != "1" && data.modifyInspiration != "0")
        return ReturnError(res, "Permissie moet 1 of 0 zijn");
    var modifyInspiration = data.modifyInspiration == "1";
    
    await Login.GiveUserPermissions(username, modifyUsers, addFiles, modifyInspiration, modifyProjects);
    res.send("Permissies aangepast");
});

module.exports = router;