import { Router } from 'express';
const router = Router();

import * as Files from '../../utils/files.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import { utapi } from './uploadthing_router.js';
import Config from '../../utils/config.js';
import SendRequest from '../../utils/https_request.js';
import * as TreeListDB from '../../utils/adjancency_db_list.js';
import { accessTypes, accessUrgency, AddToAccessLogLoggedIn } from '../../utils/logs.js';

const fileTableInfo = TreeListDB.CreateTableInfo('files', ',uploadthing_id', async (node) => {
    return node.uploadthing_id != null;
});

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
    try {
        const { totalBytes, appTotalBytes, filesUploaded, limitBytes } = await SendRequest({
            host:'api.uploadthing.com',
            path:'/v6/getUsageInfo',
            method:'POST',
            headers: {
                'X-Uploadthing-Api-Key': Config.uploadthing.apiKey
            }
        });
        res.send(JSON.stringify({totalBytes, appTotalBytes, filesUploaded, limitBytes}));
    } catch(err) {
        console.error(err?.message);
        return res.status(500).send('Internal server error');
    }
});
router.put('/add', async (req, res) => {
    const data = req.body;
    if(Validator.CheckID(res, data.parentID, true)) return;
    await TreeListDB.CreateNode(data.parentID, [null], fileTableInfo, {
        onComplete: (newId) => {
            res.send(JSON.stringify({name: 'new'+ newId, id: newId}));
            AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.createFile, { parentID: data.parentID, name: 'new'+newId }, req);
        }, onError: (err) => {
            console.error(err);
            res.status(500).send('Server error');
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.createFile, { id: data.id, newName: data.newName, err: err }, req);
        }
    });
});
// When modifying the /move path also needs to be modified most of the time
router.put('/rename', async (req, res) => {
    var data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    else if(Validator.CheckFilename(res, data.newName)) return;

    let toBeRemovedUT = []
    await TreeListDB.RenameNode(data.id, data.newName, data.override, fileTableInfo, {  
        onNodeDelete: (node) => {
            if(node.uploadthing_id == null) return;
            toBeRemovedUT.push(node.uploadthing_id);
        },
        onComplete: async (conflicts) => {
            if(conflicts != undefined) return res.send(JSON.stringify(conflicts));

            await Files.RegenFileIndices();
            if(toBeRemovedUT.length == 0) { 
                res.send('succes!');
                AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.renameFile, { id: data.id, newName: data.newName, conflicts: false }, req);
                return;
            }
            
            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { throw new Error('Failed to delete\n' + toBeRemovedUT); }
            if(deletedCount != toBeRemovedUT.length) { throw new Error('Deleted and to be deleted counts do not match'); }
            
            res.send('succes!');
            AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.renameFile, { id: data.id, newName: data.newName, conflicts: true }, req);
        },
        onInvalidInput: (message) => {
            res.status(400).send(message);
        },
        onError: (err) => {
            console.error(err);
            res.status(500).send('Server error');
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.renameFile, { id: data.id, newName: data.newName, err: err }, req);
        }
    });
});
// When modifying the /rename path also needs to be modified most of the time
// Almost the same as the function above:
router.put('/move', async (req, res) => {
    var data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    else if(Validator.CheckID(res, data.newParentId, true)) return;

    let toBeRemovedUT = [];
    await TreeListDB.MoveNode(data.id, data.newParentId, data.override, fileTableInfo, { 
        onNodeDelete: (node) => {
            if(node.uploadthing_id == null) return;
            toBeRemovedUT.push(node.uploadthing_id);
        },
        onComplete: async (conflicts) => {
            if(conflicts != undefined) return res.send(JSON.stringify(conflicts));

            await Files.RegenFileIndices();
            if(toBeRemovedUT.length == 0) { 
                res.send('succes!');
                AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.moveFile, { id: data.id, newParentId: data.newParentId, conflicts: false }, req);
                return;
            }

            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { throw new Error('Failed to delete\n' + toBeRemovedUT); }
            if(deletedCount != toBeRemovedUT.length) { throw new Error('Deleted and to be deleted counts do not match'); }

            res.send('succes!');
            AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.moveFile, { id: data.id, newParentId: data.newParentId, conflicts: true }, req);
        },
        onInvalidInput: (message) => {
            res.status(400).send(message);
        },
        onError: (err) => {
            console.error(err);
            res.status(500).send('Server error');
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.moveFile, { id: data.id, newParentId: data.newParentId, err: err }, req);
        }
    });
});
router.put('/delete', async (req, res) => {
    let data = req.body;
    if(Validator.CheckID(res, data.id)) return;

    let toBeRemovedUT = [];
    await TreeListDB.DeleteNode(data.id, fileTableInfo, {
        onNodeDelete: (node) => {
            if(node.uploadthing_id == null) return;
            toBeRemovedUT.push(node.uploadthing_id);
        },
        onComplete: async () => {
            await Files.RegenFileIndices();
            if(toBeRemovedUT.length == 0) return res.send('succes!');

            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { throw new Error('Failed to delete\n' + toBeRemovedUT); }
            if(deletedCount != toBeRemovedUT.length) { throw new Error('Deleted and to be deleted counts do not match') }
            
            res.send('succes!');
        },
        onError: (err) => {
            console.error(err);
            res.status(500).send('Server error');
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.deleteFile, { id: data.id, err: err }, req);
        }
    });
});

export default router;