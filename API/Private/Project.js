const express = require('express');

const DB = require('../../Utils/DB.js');
const Validator = require('../../Utils/Validator.js');

const router = express.Router();

router.get('/Versions', async (req, res) => {
    if(Validator.CheckID(res, req.query.projectID)) return false;

    var versions = await DB.GetAllProjectVersionsOfID(req.query.projectID);
    res.send(JSON.stringify(versions));
});

router.get('/Get', async (req, res) => {
    if(Validator.CheckUUID(res, req.query.uuid)) return false;

    var project = await DB.GetProject(req.query.uuid);
    if(project == undefined) return Validator.ReturnError(res, 'uuid bestaad niet');

    res.send(JSON.stringify(project));
});

module.exports = router;