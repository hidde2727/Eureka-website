import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as Voting from '../../utils/suggestion_voting.js';
import * as Projects from '../../utils/projects.js';

router.get('/get',  async (req, res) => {
    res.send(await DB.GetAllSuggestionWithVotes(Login.GetSessionUserID(req)));
});

router.put('/vote', async (req, res) => {
    var data = req.body;
    if(Validator.CheckSuggestionType(res, data.type)) return;
    if(Validator.CheckUUID(res, data.uuid)) return;
    if(Validator.CheckVoteValue(res, data.voteValue)) return;
    if(Validator.CheckIsAdminVote(res, data.adminVote)) return;

    var result = undefined;
    if(data.type == 'project') {
        if(!(await DB.IsValidProject(data.uuid))) return Validator.ReturnError(res, 'Specificeer valide uuid');
        if(await DB.HasProjectVoteResult(data.uuid)) return Validator.ReturnError(res, 'Project kan geen votes meer ontvangen, stemming is klaar');
        result = await Voting.VoteProject(req, data.uuid, data.voteValue, data.adminVote);
        if(result != 'nothing') await Projects.GenerateProjectJSON();
    } else if(data.type == 'inspiration') {
        if(!(await DB.IsValidInspiration(data.uuid))) return Validator.ReturnError(res, 'Specificeer valide uuid');
        if(await DB.HasInspirationVoteResult(data.uuid)) return Validator.ReturnError(res, 'Inspiration kan geen votes meer ontvangen, stemming is klaar');
        result = await Voting.VoteInspiration(req, data.uuid, data.voteValue, data.adminVote);
    }

    res.send(JSON.stringify({result: result}));
});

export default router;