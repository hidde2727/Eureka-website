import { Router } from 'express';
const router = Router();

import * as Login from '../../utils/login.js';
import * as Settings from '../../utils/settings.js';
import * as Validator from '../../utils/validator.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_settings'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});

router.get('/Get', (req, res) => {
    res.send(JSON.stringify(Settings.GetSettings()));
});

router.put('/Set', async (req, res) => {
    var data = req.body;

    if(Validator.CheckIntSettings(res, data.acceptNormalVote, 'de hoeveelheid punten die een normaal iemand krijgt voor acceptatie')) return;
    if(Validator.CheckIntSettings(res, data.acceptAdminVote, 'de hoeveelheid punten die een admin iemand krijgt voor acceptatie')) return;
    if(Validator.CheckPercentageSettings(res, data.acceptAmount, 'de hoeveelheid punten voor het accepteren van een suggestie')) return;

    if(Validator.CheckIntSettings(res, data.denyNormalVote, 'de hoeveelheid punten die een normaal iemand krijgt voor afkeuring')) return;
    if(Validator.CheckIntSettings(res, data.denyAdminVote, 'de hoeveelheid punten die een admin iemand krijgt voor afkeuring')) return;
    if(Validator.CheckPercentageSettings(res, data.acceptAmount, 'de hoeveelheid punten voor het afkeuren van een suggestie')) return;

    Settings.SetSettings(
        data.acceptNormalVote, data.acceptAdminVote, data.acceptAmount, 
        data.denyNormalVote, data.denyAdminVote, data.denyAmount
    );

    try {
        await Settings.CalculateSettingsPercentages();
        Settings.WriteSettingsFile();
    } catch (err) {
        return Validator.ReturnError(res, 'Invalide error');
    }

    res.send("Succes!");
});

export default router;