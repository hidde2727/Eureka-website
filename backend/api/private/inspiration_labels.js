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
    TreeListDB.GetSemaphore('labels').runExclusive(async () => {
        const data = req.body;
        if(Validator.CheckID(res, data.parentID, true)) return;
        if(Validator.CheckLabelName(res, data.name)) return;

        const id = await DB.CreateLabel(data.parentID, data.name);

        await RegenLabels();

        res.send(JSON.stringify({ newId: id }));
    });
});
router.put('/move', async (req, res) => {
    const data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    if(Validator.CheckID(res, data.newParentID, true)) return;
    if(Validator.CheckInteger(res, data.atPosition)) return;

    let removalPromises = [];
    let newID = data.id;
    let maxPos = 0;
    let oldPos = 0;
    await TreeListDB.MoveNode(data.id, data.newParentID, data.override, fileTableInfo, {
        onSephamoreActivate: async () => {
            maxPos = await DB.GetMaxPositionInLabel(data.newParentID);
            if((maxPos < data.atPosition - 1) || data.atPosition < 0) { res.status(400).send('Invalid position, needs to be between 0 and amount of labels'); return false; }
            oldPos = (await DB.GetLabel(data.id))['position'];
            await DB.MovePositionDownAfterLabel(data.id);
            await DB.SetLabelPosition(data.id, null);
            return true;
        },
        onNodeDelete: (node, replacedBy) => {
            if(replacedBy == undefined) {
                removalPromises.push(DB.DeleteLabelFromInspiration(node.id));
            } else {
                removalPromises.push(DB.ReplaceLabelFromInspiration(node.id, replacedBy.id));
            }
        },
        onIDChange: (from, to, nodeInfo) => {
            removalPromises.push(DB.ReplaceLabelFromInspiration(from, to));
            if(from == newID) newID = to;
        },
        onComplete: async (conflicts, parentIDChanged) => {
            if (conflicts != undefined) return res.send(JSON.stringify(conflicts));

            await Promise.all(removalPromises);

            // Reorder the elements
            let position = Math.min(data.atPosition, maxPos);
            if(!parentIDChanged && oldPos > data.atPosition) position++;
            if(parentIDChanged) position++;
            await DB.MovePositionUpAfterPosition(newID, position);
            await DB.SetLabelPositionAfterPosition(newID, position);

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
router.put('/rename', async (req, res) => {
    const data = req.body;
    if(Validator.CheckID(res, data.id)) return;
    if(Validator.CheckLabelName(res, data.newName)) return;
    if(Validator.CheckBoolean(res, data.override, false)) return;

    let removalPromises = []
    await TreeListDB.RenameNode(data.id, data.newName, data.override, fileTableInfo, {
        onNodeDelete: (node, replacedBy) => {
            if(replacedBy == undefined) {
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
    const data = req.body;
    if(Validator.CheckID(res, data.id)) return;

    let removalPromises = []
    await TreeListDB.DeleteNode(data.id, fileTableInfo, {
        onNodeDelete: (node, replacedBy) => {
            if(replacedBy == undefined) {
                removalPromises.push(DB.DeleteLabelFromInspiration(node.id));
            } else {
                removalPromises.push(DB.ReplaceLabelFromInspiration(node.id, replacedBy.id));
            }
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

export default router;