import { Router } from 'express';
const router = Router();

import * as DB from '../../utils/db.js';
import * as Login from '../../utils/login.js';
import * as Validator from '../../utils/validator.js';
import { RegenLabels } from '../../utils/inspiration_labels.js';
import * as TreeListDB from '../../utils/adjancency_db_list.js';

const fileTableInfo = TreeListDB.CreateTableInfo('labels', ',position', async () => {
    return false;
});

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission(req, 'modify_inspiration_labels'))) {
        res.status(401);
        res.send('Geen permissie voor dit deel van de API');
        return;
    }
    next();
});

router.put('/add', async (req, res) => {
    const data = req.body;
    if(Validator.CheckID(res, data.parentID, true)) return;
    if(Validator.CheckLabelName(res, data.name)) return;

    const id = await DB.CreateLabel(data.parentID, data.name);

    await RegenLabels();

    res.send(JSON.stringify({ newId: id }));
});
router.put('/reorder', async (req, res) => {
    
});
router.put('/move', async (req, res) => {
    
});
router.put('/rename', async (req, res) => {
    const data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    if(Validator.CheckLabelName(res, data.newName)) return;
    if(Validator.CheckBoolean(res, data.override, false)) return;

    let removalPromises = []
    await TreeListDB.RenameNode(data.id, data.newName, data.override=='true', fileTableInfo, {
        onNodeDelete: (node, replacedBy) => {
            if(replacedBy != undefined) {
                removalPromises.push(DB.DeleteLabelFromInspiration(node.id));
            } else {
                removalPromises.push(DB.ReplaceLabelFromInspiration(node.id, replacedBy.id));
            }
        },
        onIDChange: (from, to, nodeInfo) => {
            removalPromises.push(DB.ReplaceLabelFromInspiration(from, to));
        },
        onComplete: async (conflicts) => {
            if (conflicts != undefined) return res.send(JSON.stringify(conflicts));

            await Promise.all(removalPromises);
            await RegenLabels();
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
    
});

export default router;