import { Router } from 'express';
const router = Router();

import * as Files from '../../utils/files.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import * as DB from '../../utils/db.js';
import { utapi } from './uploadthing_router.js';
import Config from '../../utils/config.js';
import SendRequest from '../../utils/https_request.js';
import * as TreeListDB from '../../utils/adjancency_db_list.js';

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
    const data = req.body;
    if(Validator.CheckID(res, data.parentID, true)) return;
    await TreeListDB.CreateNode(data.parentID, [null], fileTableInfo, {
        onComplete: (newId) => {
            res.send(JSON.stringify({name: 'new'+ newId, id: newId}));
        }, onError: (err) => {
            res.status(500).send('Server error');
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

            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { console.error('Failed to delete\n' + toBeRemovedUT); return res.status(500).send('Server error'); }
            if(deletedCount != toBeRemovedUT.length) { console.error('Deleted and to be deleted counts do not match'); return res.status(500).send('Server error'); }
            
            res.send('succes!');
        },
        onInvalidInput: (message) => {
            res.status(400).send(message);
        },
        onError: (err) => {
            res.status(500).send('Server error');
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

            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { console.error('Failed to delete\n' + toBeRemovedUT); return res.status(500).send('Server error'); }
            if(deletedCount != toBeRemovedUT.length) { console.error('Deleted and to be deleted counts do not match'); return res.status(500).send('Server error'); }

            res.send('succes!');
        },
        onInvalidInput: (message) => {
            res.status(400).send(message);
        },
        onError: (err) => {
            res.status(500).send('Server error');
        }
    });
});
router.put('/delete', async (req, res) => {
    let data = req.body;
    if(Validator.CheckID(res, data.id)) return;

    let toBeRemovedUT = [];
    await TreeListDB.DeleteNode(data.id, fileTableInfo, {
        onNodeDelete: (node) => {
            console.log(node);
            if(node.uploadthing_id == null) return;
            toBeRemovedUT.push(node.uploadthing_id);
        },
        onComplete: async () => {
            await Files.RegenFileIndices();

            const { success, deletedCount } = await utapi.deleteFiles(toBeRemovedUT, { keyType: 'fileKey' });
            if(!success) { console.error('Failed to delete\n' + toBeRemovedUT); return res.status(500).send('Server error'); }
            if(deletedCount != toBeRemovedUT.length) { console.error('Deleted and to be deleted counts do not match'); return res.status(500).send('Server error'); }
            
            res.send('succes!');
        },
        onError: (err) => {
            res.status(500).send('Server error');
        }
    });
});

export default router;