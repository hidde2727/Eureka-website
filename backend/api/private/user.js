import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import { CalculateSettingsPercentages, WriteSettingsFile } from '../../utils/settings.js';
import { accessTypes, accessUrgency, AddToAccessLogLoggedIn } from '../../utils/logs.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_users'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});
router.get('/get', async (req, res) => {
    const userInfo = await DB.GetAllUsers();
    const mappedUserinfo = userInfo.map((user) => {
        return { ...user, password: undefined };
    })
    res.json(mappedUserinfo);
});

router.put('/add', async (req, res) => {
    var data = req.body;

    if(await Validator.CheckUsernameU(res, data.username)) return;
    if(Validator.CheckPassword(res, data.password)) return;

    try {
        await Login.GenerateUser(data.username, Buffer.from(data.password, 'base64'));
    } catch(err) {
        Validator.ReturnError(res, 'Server error', 500);
        AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.createUser, { username: data.username, error: err.message }, req);
        return;
    }

    // Recalculate the settings
    CalculateSettingsPercentages();
    WriteSettingsFile();

    res.send('Gebruiker aangemaakt!');
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.createUser, { username: data.username }, req);
});

router.put('/delete', async (req, res) => {
    var data = req.body;

    if(await Validator.CheckID(res, data.id)) return;
    else if(await Validator.IsNotSelf(res, req, data.id)) return;
    
    await Login.DeleteUser(data.id);

    // Recalculate settings
    CalculateSettingsPercentages();
    WriteSettingsFile();

    res.send('Gebruiker verwijdert!');
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.deleteUser, { id: data.id }, req);
});

router.put('/modify', async (req, res) => {
    var data = req.body;

    if(Validator.CheckID(res, data.id)) return;
    else if(await Validator.IsNotSelf(res, req, data.id)) return;
    
    if(Validator.CheckPermission(res, data.admin, 'admin')) return;
    if(Validator.CheckPermission(res, data.labels, 'inspiratie labels')) return;
    if(Validator.CheckPermission(res, data.users, 'veranderen gebruikers')) return;
    if(Validator.CheckPermission(res, data.settings, 'veranderen instellingen')) return;
    if(Validator.CheckPermission(res, data.files, 'veranderen files')) return;
    if(Validator.CheckPermission(res, data.logs, 'bekijken logs')) return;
    
    await Login.GiveUserPermissions(
        data.id,
        data.admin, 
        data.labels, 
        data.users, 
        data.settings, 
        data.files, 
        data.logs
    );
    
    // Recalculate settings
    CalculateSettingsPercentages();
    WriteSettingsFile();
    
    res.send('Permissies aangepast');
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.modifyUser, { id: data.id, admin: data.admin, labels: data.labels, users: data.users, settings: data.settings, files: data.files, logs: data.logs }, req);
});

export default router;