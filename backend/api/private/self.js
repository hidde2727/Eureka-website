import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import { accessTypes, accessUrgency, AddToAccessLogLoggedIn } from '../../utils/logs.js';

router.get('/permissions', async (req, res) => {
    const userInfo = await DB.GetUser(Login.GetSessionUserID(req));
    res.json(userInfo);
});

router.post('/logout', async (req, res) => {
    await Login.RemoveSession(req, res);
    res.send('Succes');
});

router.put('/update', async (req, res) => {
    const data = req.body;
    
    var username = undefined;
    if(data.username == undefined) username = undefined;
    else if(await Validator.CheckUsernameU(res, data.username)) return;
    else username = data.username;

    var email = undefined;
    if(data.email == undefined) email = undefined;
    else if(Validator.CheckEmail(res, data.email)) return;
    else email = data.email;
    
    var password = undefined;
    if(data.password == undefined) password = undefined;
    else if(Validator.CheckPassword(res, data.password)) return;
    else if(Validator.CheckPassword(res, data.previousPassword)) return;
    else if(!(await Login.ValidatePassword(await Login.GetSessionUsername(req), Buffer.from(data.previousPassword, 'base64')))[0])
        return Validator.ReturnError(res, 'Vorige wachtwoord moet het juiste wachtwoord zijn');
    else password = data.password;

    if(username != undefined) Login.UpdateUsername(req, username);
    else if(email != undefined) email = undefined;
    else if(password != undefined) Login.UpdatePassword(req, Buffer.from(data.password, 'base64'));

    res.send("Succes");
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.modifySelf, { newUsername: username, newEmail: email, newPassword: password!=undefined }, req);
});

router.get('/vote', async (req, res) => {
    var type = req.query.type;
    if(Validator.CheckSuggestionType(res, type)) return;
    var uuid = req.query.uuid;
    if(Validator.CheckUUID(res, uuid)) return;

    var vote = undefined;
    if(type == 'project') vote = await DB.GetProjectVote(Login.GetSessionUserID(req), uuid);
    else if(type == 'inspiration') vote = await DB.GetInspirationVote(Login.GetSessionUserID(req), uuid);
    res.send(JSON.stringify(vote==undefined?{}:vote));
});

export default router;