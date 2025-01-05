import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Validator from '../../utils/validator.js';
import * as Login from '../../utils/login.js';
import * as INS from '../../utils/inspiration.js';
import * as Voting from '../../utils/suggestion_voting.js';
import { GenerateProjectJSON } from '../../utils/projects.js';

router.get('/versions', async (req, res) => {
    if(Validator.CheckID(res, req.query.id)) return false;

    var versions = await DB.GetAllProjectVersionsOfID(req.query.id);
    res.send(JSON.stringify(versions));
});

router.get('/get', async (req, res) => {
    if(Validator.CheckUUID(res, req.query.uuid)) return false;

    var project = await DB.GetProject(req.query.uuid);
    if(project == undefined) return Validator.ReturnError(res, 'uuid bestaad niet');

    res.send(JSON.stringify(project));
});

router.put('/suggest', async (req, res) => {
try {
    var data = req.body;
    if (data.length > 1000000) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckID(res, data.originalID)) return;
    if(await DB.HasProjectPendingVotes(data.originalID)) return Validator.ReturnError(res, 'Beoordeel eerste de openstaande versie');
    if(Validator.CheckSuggestionName(res, data.name)) return;
    if(Validator.CheckSuggestionDescription(res, data.description)) return;
    if(Validator.CheckSuggestionDescription(res, data.versionDescription)) return;
    if(Validator.CheckSuggestionName(res, data.versionName)) return;

    if(data.links == undefined) return Validator.ReturnError(res, 'Specificeer een array van linkjes');
    if(data.links.length > 3) return Validator.ReturnError(res, 'Maximum hoeveelheid linkjes is 3');
    var links = [];
    for (var i = 0; i < data.links.length; i++) {
        if (data.links[i] == undefined) continue;
        else if (Validator.CheckLink(res, data.links[i])) return;
        links.push(data.links[i]);
    }

    if(Validator.CheckSuggestorName(res, data.suggestorName)) return;
    if(Validator.CheckSuggestorName(res, data.implementerName)) return;

    const username = await Login.GetSessionUsername(req);
    const userID = Login.GetSessionUserID(req);
    const currentVersions = await DB.GetAllProjectVersionsOfID(data.originalID);

    const insertedID = await DB.CreateProject(
        data.versionName, data.versionDescription, username, userID,
        data.name, data.description,
        links.length >= 1 ? JSON.stringify(await INS.GetURLInfo(links[0])) : null,
        links.length >= 2 ? JSON.stringify(await INS.GetURLInfo(links[1])) : null,
        links.length >= 3 ? JSON.stringify(await INS.GetURLInfo(links[2])) : null,
        data.suggestorName, data.implementerName, currentVersions[0].request_email,
        data.originalID
    );
    await Voting.VoteProject(req, insertedID, 1, await Login.HasUserPermission(req, 'admin'));
    await GenerateProjectJSON();

    res.send(insertedID.toString());
} catch(err) {
    console.error(err.message);
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
}
});

export default router;