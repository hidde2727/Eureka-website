import { Router } from 'express';
const router = Router();

// Connect the private API
import PrivateAPI from './Private/private.js';
router.use('/Private', PrivateAPI);

// Public API
import * as Validator from '../utils/validator.js';
import * as Login from '../utils/login.js';
import * as DB from '../utils/db.js';
import * as INS from '../utils/inspiration.js';

router.post('/Login', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 255+29+14) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckUsername(res, data.username)) return;
    if(Validator.CheckPassword(res, data.password)) return;

    var [isValid, userID] = await Login.ValidatePassword(data.username, Buffer.from(data.password, 'base64'));
    if (!isValid) {
        res.status(401);
        res.send('Verkeerde credentials');
        return;
    }
    // Correct password - give user the correct cookies
    if (await Login.CheckSession(req, res, false)) {
        res.status(401);
        res.send('Al ingelogd');
        return;
    }

    await Login.CreateSession(res, userID);
    res.send('Correct!!!');
} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
}
});
router.post('/SuggestProject', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 1000000) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckSuggestionName(res, data.name)) return;
    if(Validator.CheckSuggestionDescription(res, data.description)) return;

    if(data.links.length > 3) return Validator.ReturnError(res, 'Maximum hoeveelheid linkjes is 3');
    var links = [];
    for (var i = 0; i < data.links.length; i++) {
        if (data.links[i] == undefined) continue;
        else if (Validator.CheckLink(res, data.links[i])) return;
        links.push(data.links[i]);
    }

    if(Validator.CheckSuggestorName(res, data.suggestorName)) return;
    if(Validator.CheckEmail(res, data.suggestorEmail)) return;

    await DB.CreateProject(
        'Origineel', 'Originele suggestie', data.suggestorName, null,
        data.name, data.description,
        links.length >= 1 ? JSON.stringify(await INS.GetURLInfo(links[0])) : null, 
        links.length >= 2 ? JSON.stringify(await INS.GetURLInfo(links[1])) : null, 
        links.length >= 3 ? JSON.stringify(await INS.GetURLInfo(links[2])) : null,
        data.suggestorName, '-', data.suggestorEmail
    );

    res.send('Project is aangevraagd!');
} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
}
});

router.post('/SuggestInspiration', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 1000000) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckLink(res, data.url)) return;
    if(Validator.CheckSuggestionDescription(res, data.description)) return;

    if(data.recommendations.length > 3) return Validator.ReturnError(res, 'Data mag niet meer dan 2 recommendaties bevatten');
    if(data.recommendations.length > 1 && Validator.CheckLink(res, data.recommendations[0])) return;
    if(data.recommendations.length > 2 && Validator.CheckLink(res, data.recommendations[1])) return;

    if(data.labels == undefined)
        return Validator.ReturnError(res, 'Specificeer labels');
    var error = false;
    data.labels.forEach((label, index) => {
        if(Validator.CheckLabelID(res, label)) error = true;
    });
    if(error) return true;

    var urlInfo = await INS.GetURLInfo(data.url);
    if(await DB.DoesInspirationExist(urlInfo.type, urlInfo.ID)) return Validator.ReturnError(res, 'Inspiratie url zit al in onze database');
    await DB.CreateInspiration(
        'Origineel', 'Originele suggestie', '-', null,
        urlInfo.type, urlInfo.name, data.description, urlInfo.ID, data.url, 
        data.recommendations.length >= 1 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[0])) : null, 
        data.recommendations.length >= 2 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[1])) : null, 
        JSON.stringify(urlInfo.json)
    );
    await DB.AddLabelsToLastInsertedInspiration(data.labels);

    res.send('Inspiratie is aangevraagd!');
} catch(err) {
    if(err.message.includes('Illegale website string: ')) return Validator.ReturnError(res, 'Inspiratie url is incorrect');
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
}
});
router.get('/RetrieveURLInfo', async (req, res) => {
try {
    if(Validator.CheckLink(res, req.query.url)) return;

    try { res.send(JSON.stringify(await INS.GetURLInfo(req.query.url))); } 
    catch(err) { console.log(err.message); return Validator.ReturnError(res, err.message); }

} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
}
});

export default router;