import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as INS from '../../utils/inspiration.js';
import * as Voting from '../../utils/suggestion_voting.js';
import { accessTypes, accessUrgency, AddToAccessLogLoggedIn } from '../../utils/logs.js';

router.get('/versions', async (req, res) => {
    if(Validator.CheckID(res, req.query.id)) return false;
    
    var versions = await DB.GetAllInspirationVersionsOfID(req.query.id);
    res.send(JSON.stringify(versions));
});

router.put('/suggest', async (req, res) => {
try {
    const data = req.body;
    if(data.length > 1000000) return Validator.ReturnError(res, 'Aanvraag te groot');

    if(Validator.CheckID(res, data.originalID)) return;
    if(await DB.HasInspirationPendingVotes(data.originalID))
    if(Validator.CheckSuggestionDescription(res, data.description)) return;
    if(Validator.CheckSuggestionDescription(res, data.versionDescription)) return;
    if(Validator.CheckSuggestionName(res, data.versionName)) return;

    if(data.recommendations.length > 3) return Validator.ReturnError(res, 'Data mag niet meer dan 2 recommendaties bevatten');
    if(data.recommendations.length > 1 && Validator.CheckLink(res, data.recommendations[0])) return;
    if(data.recommendations.length > 2 && Validator.CheckLink(res, data.recommendations[1])) return;

    if(data.labels == undefined)
        return Validator.ReturnError(res, 'Specificeer labels');
    let error = false;
    data.labels.forEach((label, index) => {
        if(Validator.CheckID(res, label)) error = true;
    });
    if(error) return Validator.ReturnError(res, 'Invalide label id');

    const username = await Login.GetSessionUsername(req);
    const userID = Login.GetSessionUserID(req);

    const currentVersions = await DB.GetAllInspirationVersionsOfID(data.originalID);
    if(data?.playlistID?.length!=undefined && currentVersions[0].type == DB.InspirationTypes.YT_Video) {
        const currentData = JSON.parse(currentVersions[0].additionInfo);
        if(data.playlistID == '') {
            currentVersions[0].additionInfo = JSON.stringify({
                ...currentData, 
                json: { ...currentData.json, playlistID: undefined },
                url: `https://www.youtube.com/watch?v=${currentVersions[0].ID}`
            });
        } else {
            currentVersions[0].additionInfo = JSON.stringify({
                ...currentData,
                json: { ...currentData.json, playlistID: data.playlistID },
                url: `https://www.youtube.com/watch?v=${currentVersions[0].ID}&list=${data.playlistID}`
            });
        }
    }

    const insertedID = await DB.CreateInspiration(
        data.versionName, data.versionDescription, username, userID,
        currentVersions[0].type, currentVersions[0].name, data.description, currentVersions[0].ID, currentVersions[0].url, 
        data.recommendations.length >= 1 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[0])) : null, 
        data.recommendations.length >= 2 ? JSON.stringify(await INS.GetURLInfo(data.recommendations[1])) : null, 
        currentVersions[0].additionInfo,
        data.labels,
        data.originalID
    );
    await Voting.VoteInspiration(req, insertedID, 1, await Login.HasUserPermission(req, 'admin'))

    res.send(insertedID.toString());
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.createInspirationSuggestion, { initial: false, id: insertedID }, req);
} catch(err) {
    console.error(err.message);
    if(err.message.includes('Illegale website string: ')) return Validator.ReturnError(res, 'Inspiratie url is incorrect');
    res.status(500);
    res.send('Er is iets fout gegaan op de server');
    AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.createInspirationSuggestion, { initial: false, id: insertedID, error: err.message }, req);
}
});

export default router;