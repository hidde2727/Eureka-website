import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';

router.get('/versions', async (req, res) => {
    if(Validator.CheckID(res, req.query.id)) return false;
    
    var versions = await DB.GetAllInspirationVersionsOfID(req.query.id);
    res.send(JSON.stringify(versions));
});

export default router;