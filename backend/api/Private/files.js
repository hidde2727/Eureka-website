import { Router } from 'express';
const router = Router();

import * as fs from 'node:fs/promises';
import * as path from 'path';

import * as  Login from '../../utils/login.js';
import * as  Validator from '../../utils/validator.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_files'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});

router.put('/Add', async (req, res) => {
    var data = req.body;

    if(Validator.CheckFilePath(res, data.filepath)) return;
    if(Validator.CheckBase64Blob(res, data.blob, 1333333)) return;

    var dir = path.dirname('./Data/Tutorials/' + data.filePath);
    try {
        try { await fs.access(dir, fs.constants.X_OK); }
        catch(err) { await fs.mkdir(dir, { recursive: true }); }
        await fs.writeFile('./Data/Tutorials' + data.filePath, Buffer.from(data.blob, 'base64'));
    } catch (err) {
        console.log(err);
        return Validator.ReturnError(res, 'Mislukt');
    }
    res.send('Toegevoegd!!!');
});
router.put('/RegenIndex', async (req, res) => {
    var allFiles = await fs.readdir('./Data/Tutorials/', {withFileTypes: true, recursive: true});
    var folderDict = {};
    allFiles.forEach((value, index) => {
        if(value.name == 'contents.json')
            return;
        if(folderDict[value.parentPath] == undefined)
            folderDict[value.parentPath] = [];
        folderDict[value.parentPath].push(value.name);
    });
    for (var [key, value] of Object.entries(folderDict)) {
        fs.writeFile(key + '/contents.json', JSON.stringify(value));
    }
});

export default router;