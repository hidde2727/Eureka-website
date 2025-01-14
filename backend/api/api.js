import { Router } from 'express';
const router = Router();

// Connect the private API
import PrivateAPI from './private/private.js';
router.use('/private', PrivateAPI);

// Public API
import * as Validator from '../utils/validator.js';
import * as Login from '../utils/login.js';
import * as DB from '../utils/db.js';
import * as INS from '../utils/inspiration.js';
import * as Voting from '../utils/suggestion_voting.js';
import { GenerateProjectJSON } from '../utils/projects.js';
import { accessTypes, accessUrgency, AddToAccessLog } from '../utils/logs.js';

const pageSize = 25;
router.get('/inspiration', async (req, res) => {
    const labels = req.query.labels==''||req.query.labels==undefined ? []:req.query.labels.split(',');
    for(let i = 0; i < labels.length; i++) {
        try { parseInt(labels[i]) }
        catch(err) { res.status(400).send('Invalide labels'); }
    }

    let returnAvailablePages = undefined;
    let cursor = req.query.cursor;
    if(req.query.cursor == undefined) {
        const maxPages = Math.ceil((await DB.GetAmountInspiration(labels)) / pageSize);
        const returningIndex = Math.floor(Math.random() * (maxPages - 1));
        if(returningIndex == -1) return res.json({ availablePages: [], data: [] });
        returnAvailablePages = Array.from({length: maxPages}, (thisArg, i) => i);
        cursor = returnAvailablePages[returningIndex];
        returnAvailablePages.splice(returningIndex, 1);
    }
    if(Validator.CheckInteger(res, cursor)) return;
    
    let inspirations = undefined;
    if(labels.length == 0) inspirations = await DB.GetAllActiveInspiration(pageSize, pageSize*cursor);
    else inspirations = await DB.GetAllActiveInspirationWithLabels(labels, pageSize, pageSize*cursor);

    const response = inspirations.map((inspiration) => {
        return {
            uuid: inspiration.uuid,
            original_id: inspiration.original_id,
            type: inspiration.type,
            name: inspiration.name,
            description: inspiration.description,
            ID: inspiration.ID,
            url: inspiration.url,
            recommendation1: JSON.parse(inspiration.recommendation1),
            recommendation2: JSON.parse(inspiration.recommendation2),
            additionInfo: JSON.parse(inspiration.additionInfo),
            labels: inspiration.labels
        }
    });
    if(returnAvailablePages != undefined) {
        res.json({ availablePages: returnAvailablePages, returnedPage: cursor, data: response });
    } else {
        res.json(response);
    }
});
router.post('/login', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 255+29+14) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckUsername(res, data.username)) return;
    if(Validator.CheckPassword(res, data.password)) return;

    var [isValid, userID] = await Login.ValidatePassword(data.username, Buffer.from(data.password, 'base64'));
    if (!isValid) {
        res.status(401);
        res.send('Verkeerde credentials');
        AddToAccessLog(accessUrgency.info, accessTypes.failedLoginAttempt, data.username, userID, { userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country });
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
    AddToAccessLog(accessUrgency.info, accessTypes.login, data.username, userID, { userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country });
} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
    AddToAccessLog(accessUrgency.error, accessTypes.login, data.username, userID, { userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country, error: err.message });
}
});
router.post('/suggest/project', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 1000000) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckSuggestionName(res, data.name)) return;
    if(Validator.CheckSuggestionDescription(res, data.description)) return;

    if(data.links == undefined) return Validator.ReturnError(res, 'Specificeer een array van linkjes');
    if(data.links.length > 3) return Validator.ReturnError(res, 'Maximum hoeveelheid linkjes is 3');
    var links = [];
    for (var i = 0; i < data.links.length; i++) {
        if (data.links[i] == undefined) continue;
        else if (Validator.CheckLink(res, data.links[i])) return;
        links.push(data.links[i]);
    }

    if(Validator.CheckSuggestorName(res, data.suggestorName)) return;
    if(Validator.CheckEmail(res, data.suggestorEmail)) return;

    const insertedID = await DB.CreateProject(
        'Origineel', 'Originele suggestie', data.suggestorName, null,
        data.name, data.description,
        links.length >= 1 ? JSON.stringify(await INS.GetURLInfo(links[0])) : null, 
        links.length >= 2 ? JSON.stringify(await INS.GetURLInfo(links[1])) : null, 
        links.length >= 3 ? JSON.stringify(await INS.GetURLInfo(links[2])) : null,
        data.suggestorName, '-', data.suggestorEmail
    );
    if(await Login.CheckSession(req, res)) {
        await Voting.VoteProject(req, insertedID, 1, await Login.HasUserPermission(req, 'admin'))
    }

    await GenerateProjectJSON();

    res.send('Project is aangevraagd!');
    AddToAccessLog(accessUrgency.info, accessTypes.createProjectSuggestion, data.suggestorName, null, { initial: true, id: insertedID, userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country });
} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
    AddToAccessLog(accessUrgency.error, accessTypes.createProjectSuggestion, 'Unknown', null, { initial: true, userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country, error: err.message });
}
});

router.post('/suggest/inspiration', async (req, res) => {
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
        if(Validator.CheckID(res, label)) error = true;
    });
    if(error) return Validator.ReturnError(res, 'Invalide label id');

    var loggedIn = await Login.CheckSession(req, res);
    let username = loggedIn?Login.GetSessionUsername():'-';

    var urlInfo = await INS.GetURLInfo(data.url);
    if(await DB.DoesInspirationExist(urlInfo.type, urlInfo.ID)) return Validator.ReturnError(res, 'Inspiratie url zit al in onze database');
    const insertedID = await DB.CreateInspiration(
        'Origineel', 'Originele suggestie', username, null,
        urlInfo.type, urlInfo.name, data.description, urlInfo.ID, data.url, 
        data.recommendations.length >= 1 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[0])) : null, 
        data.recommendations.length >= 2 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[1])) : null, 
        JSON.stringify(urlInfo),
        data.labels
    );
    if(loggedIn) {
        await Voting.VoteInspiration(req, insertedID, 1, await Login.HasUserPermission(req, 'admin'))
    }

    res.send('Inspiratie is aangevraagd!');
    AddToAccessLog(accessUrgency.info, accessTypes.createInspirationSuggestion, 'Unknown', null, { initial: true, id: insertedID, userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country });
} catch(err) {
    console.error(err.message);
    if(err.message.includes('Illegale website string: ')) return Validator.ReturnError(res, 'Inspiratie url is incorrect');
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    AddToAccessLog(accessUrgency.error, accessTypes.createInspirationSuggestion, 'Unknown', null, { initial: true, userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country, error: err.message });
}
});
router.get('/retrieve/url', async (req, res) => {
try {
    if(Validator.CheckLink(res, req.query.url)) return;

    try { res.send(JSON.stringify(await INS.GetURLInfo(req.query.url))); } 
    catch(err) { console.log(err.message); return Validator.ReturnError(res, err.message); }

} catch(err) {
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    console.error(err.message);
    AddToAccessLog(accessUrgency.error, accessTypes.unknown, 'Unknown', null, { userAgent: req.headers['user-agent'], ip: req.cfIP, country: req.country, error: err.message });
}
});

export default router;