import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as  Validator from '../../utils/validator.js';

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

export default router;