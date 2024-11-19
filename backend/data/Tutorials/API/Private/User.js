const express = require('express');
const router = express.Router();
const validator = require('validator');

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

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

router.put("/Add", async (req, res) => {
    var data = req.body;

    if(data.username == undefined)
        return ReturnError("Specificeer een gebruikersnaam");
    else if(data.username.length > 255)
        return ReturnError("Gebruikersnaam kan niet langer dan 255 karakters zijn");
    else if(data.username.indexOf('"') > -1)
        return ReturnError("Gebruikersnaam kan niet \" erin hebben");
    var username = data.username;
    
    if(data.password == undefined)
        return ReturnError("Specificeer een wachtwoord");
    else if(data.password.length != 44)
        return ReturnError("Wachtwoord moet 44 karakters zijn");
    else if(!validator.isBase64(data.password))
        return ReturnError("Wachtwoord moet base64 encoded zijn");
    var password = data.password;
    
    if(await DB.DoesUserExist(username))
        return ReturnError("Gebruikersnaam bestaat al!");
    
    await Login.GenerateUser(username, atob(password));
    res.send("Gebruiker aangemaakt!");
});

router.put("/Delete", async (req, res) => {
    var data = req.body;

    if(data.username == undefined)
        return ReturnError("Specificeer een gebruikersnaam");
    else if(data.username.length > 255)
        return ReturnError("Gebruikersnaam kan niet langer dan 255 karakters zijn");
    else if(data.username.indexOf('"') > -1)
        return ReturnError("Gebruikersnaam kan niet \" erin hebben");
    var username = data.username;
    
    if((await Login.GetSessionUsername()) == username) return ReturnError("Can't delete self");
    
    await Login.DeleteUser(username);
    res.send("Gebruiker verwijdert!");
});

module.exports = router;