import * as DB from './db.js';
import { Semaphore } from 'async-mutex';

// tableName = just the tableName
// fields = ,fieldName,otherFieldName (every fieldname should be started with a ,)
// isLeaf => receives the full node info and should decide if it is a leaf (async function) (only for optimization, can also always return false)
export function CreateTableInfo(tableName, fields, isLeaf) {
    return { tableName: tableName, tableFields: fields, isLeaf };
}

var semaphores = {};
export function GetSemaphore(tableName) {
    if (semaphores[tableName] == undefined) {
        semaphores[tableName] = new Semaphore(1);
    }
    return semaphores[tableName];
}
async function ResolveConflicts(conflicts, resolveConflicts, movingID, { tableInfo, modificationAction, onNodeDelete, onIDChange }) {
    let toBeKept = [];
    let parentID = undefined;
    if (conflicts.length > 0) {
        // Go through all the conflicts and look at their respective matches in the override array
        conflicts.forEach((conflict) => {
            if (resolveConflicts[conflict.child.id] == undefined) { return 'Incorrect override array'; }
            if (resolveConflicts === true || resolveConflicts[conflict.child.id] === 'replace') {
                onNodeDelete(conflict.with, conflict.child);
            } else if (resolveConflicts[conflict.child.id] === 'ignore') { parentID=true }
            else { return 'Incorrect override array'; }
        });
        if (parentID) { parentID = (await DB.GetNode(movingID, tableInfo)).parent_id; }

        let toBeRemoved = [];
        conflicts.forEach((conflict) => {
            if (resolveConflicts === true || resolveConflicts[conflict.child.id] === 'replace') {
                // Remove the file at the new location
                toBeRemoved.push(DB.DeleteNode(conflict.with.id, tableInfo));
            } else if (resolveConflicts[conflict.child.id] === 'ignore') {
                // Keep a record and delete for now at old location
                toBeKept.push(conflict.child);
                toBeRemoved.push(DB.DeleteNode(conflict.child.id, tableInfo));
            }
        });
        await Promise.all(toBeRemoved);
    }

    await modificationAction();

    // Replace the nodes that needed to be kept:
    if (toBeKept.length > 0) {
        for (let i = 0; i < toBeKept.length; i++) {
            const newID = await DB.CreateNodeAtPath(parentID, toBeKept[i].path, DB.GetExtraFieldsOfNode(toBeKept[i], tableInfo), tableInfo);
            if (!newID) {
                console.error('Failed to insert node ids');
                onNodeDelete(toBekept[i], undefined);
            }
            onIDChange(toBeKept[i].id, newID, toBeKept[i]);
        }
    }

    return false;
}

export async function CreateNode(parentId, otherValues, tableInfo, { onComplete, onSephamoreActivate, onError }) {
    await GetSemaphore(tableInfo.tableName).runExclusive(async (val) => {
        if(onSephamoreActivate != undefined) { const result = await onSephamoreActivate(); if(!result) return }

        let newId = await DB.CreateNodeReturnID(parentId, otherValues, tableInfo);
        if(onComplete != undefined) await onComplete(newId);
    }).catch((err) => {
        console.error('Error while adding node: ' + err.stack);
        return onError('Server error');
    });
}

export async function DeleteNode(id, tableInfo, { onNodeDelete, onSephamoreActivate, onComplete, onError }) {
    await GetSemaphore(tableInfo.tableName).runExclusive(async (val) => {
        if(onSephamoreActivate != undefined) { const result = await onSephamoreActivate(); if(!result) return }

        const node = await DB.GetNode(id, tableInfo);
        if (!(await tableInfo.isLeaf(node))) {
            const children = await DB.GetChildrenOfNode(id, tableInfo);
            children.forEach((child) => onNodeDelete(child, undefined));
        } else {
            onNodeDelete(node, undefined);
        }

        await DB.DeleteNode(id, tableInfo);

        if(onComplete != undefined) await onComplete();
    }).catch((err) => {
        console.error('Error while deleting nodes: ' + err.stack);
        return onError('Server error');
    });
}

export async function RenameNode(id, newName, override, tableInfo, { onNodeDelete, onIDChange, onSephamoreActivate, onComplete, onInvalidInput, onError }) {
    await GetSemaphore(tableInfo.tableName).runExclusive(async (val) => {
        if(onSephamoreActivate != undefined) { const result = await onSephamoreActivate(); if(!result) return }

        if (override == undefined) return onInvalidInput('Please specify the overrides');
        if (id == null) return onInvalidInput("Can't rename the root");

        const currentName = (await DB.GetNode(id, tableInfo)).name;
        if (currentName === undefined) { console.error('Current name is undefined'); return onInvalidInput('Incorrect file id') }
        if (newName == currentName) { await onComplete(); return; }

        const conflicts = await DB.CheckNodeRenamingConflicts(id, newName, tableInfo);
        if (!override && conflicts.length > 0) {
            return await onComplete({ conflicts: conflicts });
        }
        const result = await ResolveConflicts(conflicts, override, id, {
            tableInfo: tableInfo,
            modificationAction: async () => {
                let [failedNodes, changedIDs] = await DB.RenameNode(id, newName, tableInfo);
                failedNodes.forEach((node) => {
                    onNodeDelete(node, undefined);
                })
                changedIDs.forEach(({ from, to, nodeInfo }) => {
                    onIDChange(from, to, nodeInfo);
                });
            },
            onNodeDelete: onNodeDelete
        });
        if(result) return onInvalidInput(result);

        if(onComplete != undefined) await onComplete();
    }).catch((err) => {
        console.error('Error while renaming nodes: ' + err.stack);
        return onError('Server error');
    });
}

export async function MoveNode(id, newParentId, override, tableInfo, { onNodeDelete, onIDChange, onSephamoreActivate, onComplete, onInvalidInput, onError }) {
    await GetSemaphore(tableInfo.tableName).runExclusive(async (val) => {
        if(onSephamoreActivate != undefined) { const result = await onSephamoreActivate(); if(!result) return }

        if (override == undefined) return onInvalidInput('Please specify the overrides');
        if (id == null) return onInvalidInput("Can't move the root");

        const currentParentId = (await DB.GetNode(id, tableInfo)).parent_id;
        if (currentParentId === undefined) { console.error('Parent id is undefined'); return onInvalidInput('Incorrect file id'); }
        if (newParentId == currentParentId) { await onComplete(undefined, false); return; }

        const conflicts = await DB.GetNodeMovingConflicts(id, newParentId, tableInfo);
        if (!override && conflicts.length > 0) {
            return await onComplete({ conflicts: conflicts }, false);
        }
        const result = await ResolveConflicts(conflicts, override, id, {
            tableInfo: tableInfo,
            modificationAction: async () => {
                let [failedNodes, changedIDs] = await DB.MoveNode(id, newParentId, tableInfo);
                failedNodes.forEach((node) => {
                    onNodeDelete(node, undefined);
                })
                changedIDs.forEach(({ from, to, nodeInfo }) => {
                    onIDChange(from, to, nodeInfo);
                });
            },
            onNodeDelete: onNodeDelete
        });
        if(result) return onInvalidInput(result);

        if(onComplete != undefined) await onComplete(undefined, true);
    }).catch((err) => {
        console.error('Error while moving nodes: ' + err.stack);
        return onError('Server error');
    });
}