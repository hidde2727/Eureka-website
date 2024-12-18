import { Router } from 'express';
const router = Router();

import * as Files from '../../utils/files.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as DB from '../../utils/db.js';
import { utapi } from './uploadthing_router.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_files'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});

router.put('/add', async (req, res) => {
    // Only used to add folders, files need to be created using the uploadthing_router.js
    let data = req.body;

    if(Validator.CheckID(res, data.parentID, true)) return;
    let newId = await DB.CreateFileReturnId(data.parentID, null);

    Files.RegenFileIndices();
    res.send(JSON.stringify({name: 'newFile' + newId, id: newId}));
});
router.put('/rename', async (req, res) => {
    var data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    else if(Validator.CheckFilename(res, data.newName)) return;
    else if(data.override == undefined) return Validator.ReturnError(res, 'Please specify the overrides');
    if(data.id == null) return Validator.ReturnError(res, "Can't rename the root");

    const conflicts = await DB.CheckFileRenamingConflicts(data.id, data.newName);
    let toBeKept = [];
    if(!data.override && conflicts.length > 0) {
        res.send(JSON.stringify({ conflicts: conflicts }));
        return;
    }
    else if(conflicts.length > 0) {
        // Go through all the conflicts and look at their respective matches in the override array
        let toBeRemovedUT = [];
        conflicts.forEach((conflict) => {
            if(data.override[conflict.id] == undefined) {
                res.status(400);
                res.send('incorrect override array');
                return;
            }
            if(data.override[conflict.id] === 'replace') {
                toBeRemovedUT.push(conflict.conflictWithUTId);
            } else if(data.override[conflict.id] === 'ignore') { } 
            else {
                res.status(400);
                res.send('incorrect override array');
                return;
            }
        });
        const { success } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'filekey' });
        if(!success) { res.status(500); res.send('Server error'); return; }

        let toBeRemoved = [];
        conflicts.forEach((conflict) => {
            if(data.override[conflict.id] === 'replace') {
                // Remove the file at the new location
                toBeRemoved.push(DB.DeleteFile(conflict.conflictWithId));
            } else if(data.override[conflict.id] === 'ignore') {
                // Keep a record and delete for now at old location
                toBeKept.push({ path: conflict.path, uploadthing_id: conflict.uploadthing_id });
                toBeRemoved.push(DB.DeleteFile(conflict.id));
            }
        });
        await Promise.all(toBeRemoved);
    }
    let parentID = undefined;
    if(toBeKept.length > 0) {
        parentID = await DB.GetFileParentId(data.id);
    }

    await DB.RenameFile(data.id, data.newName);

    // Replace the files that needed to be kept:
    if(toBeKept.length > 0) {
        console.log('parentid: ' + parentID);
        for(let i = 0; i < toBeKept.length; i++) {
            await DB.CreateFileAtPath(parentID, toBeKept[i].path, toBeKept[i].uploadthing_id);
        }
    }

    await Files.RegenFileIndices();
    res.send('succes!');
});

export default router;