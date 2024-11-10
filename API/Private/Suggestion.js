const express = require('express');

const DB = require('../../Utils/DB.js');
const Login = require('../../Utils/Login.js');
const Validator = require('../../Utils/Validator.js');
const Voting = require('../../Utils/SuggestionVoting.js');
const Projects = require('../../Utils/Projects.js');

const router = express.Router();

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

module.exports = router;