import { Router } from 'express';
const router = Router();

import * as Files from '../../utils/files.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as DB from '../../utils/db.js';
import { utapi } from './uploadthing_router.js';
import Config from '../../utils/config.js';
import SendRequest from '../../utils/https_request.js';

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_files'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});

router.get('/usage', async (req, res) => {
    if(Config.uploadthing.apiKey == undefined) return Validator.ReturnError(res, 'Uploadthing API key is undefined', 500);
    const { totalBytes, appTotalBytes, filesUploaded, limitBytes } = await SendRequest({
        host:'api.uploadthing.com',
        path:'/v6/getUsageInfo',
        method:'POST',
        headers: {
            'X-Uploadthing-Api-Key': Config.uploadthing.apiKey
        }
    });
    res.send(JSON.stringify({totalBytes, appTotalBytes, filesUploaded, limitBytes}));
});
router.put('/add', async (req, res) => {
    await Files.fileSemaphore.runExclusive(async (val) => {
        // Only used to add folders, files need to be created using the uploadthing_router.js
        let data = req.body;

        if(Validator.CheckID(res, data.parentID, true)) return;
        let newId = await DB.CreateFileReturnId(data.parentID, null);

        await Files.RegenFileIndices();
        res.send(JSON.stringify({name: 'newFile' + newId, id: newId}));
    }).catch((err) => {
        console.error('Error while adding folders: ' + err.message);
        return Validator.ReturnError(res, 'Server error', 500);
    });
});
// When modifying the /move path also needs to be modified most of the time
router.put('/rename', async (req, res) => {
    await Files.fileSemaphore.runExclusive(async (val) => {
        var data = req.body;
        if(Validator.CheckID(res, data.id)) return;
        else if(Validator.CheckFilename(res, data.newName)) return;
        else if(data.override == undefined) return Validator.ReturnError(res, 'Please specify the overrides');
        if(data.id == null) return Validator.ReturnError(res, "Can't rename the root");

        const currentName = await DB.GetFileName(data.id);
        if(currentName === undefined) { console.error('Current name is undefined'); return Validator.ReturnError(res, 'Incorrect file id') }
        if(data.newName == currentName) { res.send('succes!'); return; }

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
                if(data.override[conflict.id] == undefined) { return Validator.ReturnError(res, 'Incorrect override array'); }
                if(data.override[conflict.id] === 'replace') {
                    toBeRemovedUT.push(conflict.conflictWithUTId);
                } else if(data.override[conflict.id] === 'ignore') { } 
                else { return Validator.ReturnError(res, 'Incorrect override array'); }
            });
            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { return Validator.ReturnError(res, 'Server error', 500); }
            if(deletedCount != toBeRemovedUT.length) { console.error('Deleted and to be deleted counts do not match'); return Validator.ReturnError(res, 'Server error', 500);  }

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

        let failedUTIDs = await DB.RenameFile(data.id, data.newName);

        // Replace the files that needed to be kept:
        if(toBeKept.length > 0) {
            for(let i = 0; i < toBeKept.length; i++) {
                if(!(await DB.CreateFileAtPath(parentID, toBeKept[i].path, toBeKept[i].uploadthing_id)))
                    failedUTIDs.push(toBeKept[i].uploadthing_id);
            }
        }

        if(failedUTIDs.length > 0) {
            console.error('Failed to insert uploadthing ids');
            const { success, deletedCount } = await utapi.deleteFiles(failedUTIDs, { keyType: 'fileKey' });
            if(!success) console.error('Failed to delete Uploadthing files');
            if(deletedCount != failedUTIDs.length) console.error('Deleted and to be deleted counts do not match');
        }

        await Files.RegenFileIndices();
        res.send('succes!');
    }).catch((err) => {
        console.error('Error while renaming files: ' + err.message);
        return Validator.ReturnError(res, 'Server error', 500);
    });
});
// When modifying the /rename path also needs to be modified most of the time
// Almost the same as the function above:
router.put('/move', async (req, res) => {
    await Files.fileSemaphore.runExclusive(async (val) => { 
        var data = req.body;
        if(Validator.CheckID(res, data.id)) return;
        else if(Validator.CheckID(res, data.newParentId, true)) return;
        else if(data.override == undefined) return Validator.ReturnError(res, 'Please specify the overrides');
        if(data.id == null) return Validator.ReturnError(res, "Can't move the root");

        const currentParentId = await DB.GetFileParentId(data.id);
        if(currentParentId === undefined) { console.error('Parent id is undefined'); return Validator.ReturnError(res, 'Incorrect file id') }
        if(data.newParentId == currentParentId) { res.send('succes!'); return; }

        const conflicts = await DB.CheckFileMovingConflicts(data.id, data.newParentId);
        let toBeKept = [];
        if(!data.override && conflicts.length > 0) {
            res.send(JSON.stringify({ conflicts: conflicts }));
            return;
        }
        else if(conflicts.length > 0) {
            // Go through all the conflicts and look at their respective matches in the override array
            let toBeRemovedUT = [];
            conflicts.forEach((conflict) => {
                if(data.override[conflict.id] == undefined) { return Validator.ReturnError(res, 'Incorrect override array'); }
                if(data.override[conflict.id] === 'replace') {
                    toBeRemovedUT.push(conflict.conflictWithUTId);
                } else if(data.override[conflict.id] === 'ignore') { }
                else { return Validator.ReturnError(res, 'Incorrect override array') }
            });
            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) {  return Validator.ReturnError(res, 'Server error', 500); }
            if(deletedCount != toBeRemovedUT.length) { console.error('Deleted and to be deleted counts do not match'); return Validator.ReturnError(res, 'Server error', 500); }

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

        let failedUTIDs = await DB.MoveFile(data.id, data.newParentId);

        // Replace the files that needed to be kept:
        if(toBeKept.length > 0) {
            if(currentParentId === undefined) throw new Error('Parent id is undefined!');
            for(let i = 0; i < toBeKept.length; i++) {
                if(!(await DB.CreateFileAtPath(currentParentId, toBeKept[i].path, toBeKept[i].uploadthing_id)))
                    failedUTIDs.push(toBeKept[i].uploadthing_id);
            }
        }

        if(failedUTIDs.length > 0) {
            console.error('Failed to insert uploadthing ids');
            const { succes, deletedCount } = await utapi.deleteFiles(failedUTIDs, { keyType: 'fileKey' });
            if(!succes) console.error('Failed to delete Uploadthing files');
            if(deletedCount != failedUTIDs.length) console.error('Deleted and to be deleted counts do not match');
        }

        await Files.RegenFileIndices();
        res.send('succes!');
    }).catch((err) => {
        console.error('Error while moving files: ' + err.message);
        return Validator.ReturnError(res, 'Server error', 500);
    });;
});
router.put('/delete', async (req, res) => {
    await Files.fileSemaphore.runExclusive(async (val) => { 
        let data = req.body;
        if(Validator.CheckID(res, data.id)) return;

        const utid = await DB.GetUploadthingID(data.id);

        if(utid == undefined) {
            const children = await DB.GetChildrenOfFileID(data.id);
            const toBeRemoved = children.map((child) => child.uploadthing_id).filter((child) => child != null && child != undefined);
            const { success, deletedCount } = await utapi.deleteFiles(toBeRemoved, { keyType:'fileKey' });
            if(!success) {  return Validator.ReturnError(res, 'Server error', 500); }
            if(deletedCount != toBeRemoved.length) { console.error('Deleted and to be deleted counts do not match'); return Validator.ReturnError(res, 'Server error', 500); }
        } else {
            const { success, deletedCount } = await utapi.deleteFiles([utid], { keyType:'fileKey' });
            if(!success) { return Validator.ReturnError(res, 'Server error', 500); }
            if(deletedCount != 1) { console.error('Deleted and to be deleted counts do not match'); return Validator.ReturnError(res, 'Server error', 500); }
        }

        await DB.DeleteFile(data.id);

        await Files.RegenFileIndices();
        res.send('Succes!');
    }).catch((err) => {
        console.error('Error while deleting files: ' + err.message);
        return Validator.ReturnError(res, 'Server error', 500);
    });;
});

export default router;