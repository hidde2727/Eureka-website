import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_users'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});
router.put('/add', async (req, res) => {
    var data = req.body;

    if(await Validator.CheckUsernameU(res, data.username))
    if(Validator.CheckPassword(res, data.password)) return;

    await Login.GenerateUser(data.username, atob(data.password));

    // Recalculate the settings

    res.send('Gebruiker aangemaakt!');
});

router.put('/delete', async (req, res) => {
    var data = req.body;

    if(await Validator.CheckUsernameNS(res, data.username)) return;
    
    await Login.DeleteUser(data.username);

    // Recalculate settings

    res.send('Gebruiker verwijdert!');
});

router.get('/get', async (req, res) => {
    userInfo = await DB.GetAllUserData();

    var output = [];
    for(var i = 0; i < userInfo.length; i++) {
        output.push({ 
            username: userInfo[i].username,
            admin: userInfo[i].admin, 
            modifyInspirationLabels: userInfo[i].modify_inspiration_labels, 
            modifyUsers: userInfo[i].modify_users, 
            modifySettings: userInfo[i].modify_settings,
            modifyFiles: userInfo[i].modify_files,
            watchLogs: userInfo[i].watch_logs
        });
    }
    res.json(output);
});

router.put('/grant', async (req, res) => {
    var data = req.body;

    if(await Validator.CheckUsernameNS(res, data.username)) return;
    
    if(Validator.CheckPermission(res, data.admin, 'admin')) return;
    if(Validator.CheckPermission(res, data.modifyInspirationLabels, 'inspiratie labels')) return;
    if(Validator.CheckPermission(res, data.modifyUsers, 'veranderen gebruikers')) return;
    if(Validator.CheckPermission(res, data.modifySettings, 'veranderen instellingen')) return;
    if(Validator.CheckPermission(res, data.modifyFiles, 'veranderen files')) return;
    if(Validator.CheckPermission(res, data.watchLogs, 'bekijken logs')) return;
    
    await Login.GiveUserPermissions(username, 
        data.admin == '1', 
        data.modifyInspirationLabels == '1', 
        data.modifyUsers == '1', 
        data.modifySettings == '1', 
        data.modifyFiles == '1', 
        data.watchLogs == '1'
    );
    
    // Recalculate settings
    
    res.send('Permissies aangepast');
});

export default router;