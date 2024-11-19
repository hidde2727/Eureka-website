import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as Voting from '../../utils/suggestion_voting.js';
import * as Projects from '../../utils/projects.js';

router.get('/GetAll',  async (req, res) => {
    res.send(await DB.GetAllSuggestionWithVotes(Login.GetSessionUserID(req)));
});

router.put('/Vote', async (req, res) => {
    var data = req.body;
    if(Validator.CheckProjectType(res, data.type)) return;
    if(Validator.CheckUUID(res, data.uuid)) return;
    if(Validator.CheckVoteValue(res, data.voteValue)) return;
    if(Validator.CheckIsAdminVote(res, data.adminVote)) return;

    var result = undefined;
    if(data.type == 'project') {
        if(!(await DB.IsValidProject(data.uuid))) return Validator.ReturnError(res, 'Specificeer valide uuid');
        result = await Voting.VoteProject(req, data.uuid, data.voteValue == 'accept', data.adminVote);
        if(result != 'nothing') await Projects.GenerateProjectJSON();
    } else if(data.type == 'inspiration') {

    }

    res.send(JSON.stringify({result: result}));
});

export default router;