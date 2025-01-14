import { Router } from 'express';
const router = Router();

import * as Validator from '../../utils/validator.js'; 
import * as DB from '../../utils/db.js';

router.get('/get', async (req, res) => {
    if(Validator.CheckInteger(res, req.query.cursor, true)) return;
    if(Validator.CheckInteger(res, req.query.window, true)) return;
    if(req.query.cursor < 0) return Validator.ReturnError(res, 'Cursor kan niet kleiner dan 0 zijn');
    if(req.query.window > 50) return Validator.ReturnError(res, 'Window te groot, kan niet meer dan 50 zijn');
    if(req.urgency!=undefined && Validator.CheckInteger(res, req.query.urgency, true)) return;
    if(req.type!=undefined && Validator.CheckInteger(res, req.query.type, true)) return;
    if(req.user!=undefined && Validator.CheckID(res, req.query.user, true)) return;

    return res.json(await DB.GetAllLogs(
        parseInt(req.query.window), 
        parseInt(req.query.cursor),
        req.query.urgency, 
        req.query.type, 
        req.query.user
    ));    

});

export default router;