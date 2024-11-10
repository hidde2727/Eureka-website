const express = require('express');

const DB = require('../../Utils/DB.js');
const Login = require('../../Utils/Login.js');
const Validator = require('../../Utils/Validator.js');

const router = express.Router();

router.get('/Permissions', async (req, res) => {
    userInfo = await DB.GetUser(Login.GetSessionUserID(req));
    res.json(userInfo);
});

router.post('/LogOut', async (req, res) => {
    await Login.RemoveSession(req, res);
    res.send('Succes');
});

router.put('/UpdateInfo', async (req, res) => {
    var data = req.body;
    
    var username = undefined;
    if(data.username == undefined) username = undefined;
    else if(await Validator.CheckUsernameU(res, data.username)) return;
    else username = data.username;

    var email = undefined;
    if(data.email == undefined) email = undefined;
    else if(Validator.CheckEmail(res, data.email)) return;
    else email = data.email;
    
    var password = undefined;
    if(Validator.CheckPassword(res, data.password)) return;
    else if(Validator.CheckPassword(res, data.previousPassword)) return;
    else if(!(await Login.ValidatePassword(await Login.GetSessionUsername(req), Buffer.from(data.previousPassword, 'base64')))[0])
        return Validator.ReturnError(res, 'Vorige wachtwoord moet het juiste wachtwoord zijn');
    else password = data.password;

    if(username != undefined) Login.UpdateUsername(req, username);
    else if(email != undefined) email = undefined;
    else if(password != undefined) Login.UpdatePassword(req, Buffer.from(data.password, 'base64'));

    res.send("Succes");
});

module.exports = router;