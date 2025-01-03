import mysql from 'mysql';
import fs from 'node:fs';
import Config from './config.js';

var connection;

export async function CreateConnection() {
    connection = mysql.createConnection({
        host: Config.db.host,
        user: Config.db.user,
        password: Config.db.password,
        database: Config.db.database
    });
    await connection.connect();
}
export async function SetupTables() {
    await ExecuteStatement(fs.readFileSync('./utils/schemas/users.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/sessions.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/projects.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/labels.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/inspiration.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/labels_to_inspiration.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/suggestion_votes.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/logs.schema', { encoding:'ascii' }));
    await ExecuteStatement(fs.readFileSync('./utils/schemas/files.schema', { encoding:'ascii' }));    
}
export async function ExecuteStatement(statement) {
    return new Promise((resolve, reject)=>{
        connection.query(statement, (err, results) => {
            if (err) { 
                console.error(statement + '\n' + err);
                reject('MySQL error');
            }
            return resolve(results);
        });
    });
}
export async function ExecutePreparedStatement(statement, values) {
    return new Promise((resolve, reject)=>{
        connection.query(statement, values, (err, results) => {
            if (err) {
                console.error(statement + '\n\n' + err + '\n\nValues:\n\n' + JSON.stringify(values));
                reject('MySQL error');
            }
            return resolve(results);
        });
    });
}
// + ======================================================================== +
// | General                                                                  |
// + ======================================================================== +
export async function IsTableEmpty(tableName) {
    var results = await ExecuteStatement('SELECT CASE WHEN EXISTS(SELECT 1 FROM ' + tableName + ') THEN 0 ELSE 1 END AS result');
    return results[0]['result'] == '1';
}


// + ======================================================================== +
// | Users                                                                    |
// + ======================================================================== +
// password == NULL if the user is archived
export async function CreateUser(username, password) {
    await ExecutePreparedStatement('INSERT INTO users (username, password) VALUES(?,UNHEX(?))', [username, Buffer.from(password, 'ascii').toString('hex')]);
}
export async function DoesUsernameExist(username) {
    var results = await ExecutePreparedStatement(
        'SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE username=?) THEN 1 ELSE 0 END AS result',
        [username]
    );
    return results[0]['result'] == '1';
}
export async function DeleteUser(id) {
    await ExecutePreparedStatement('DELETE FROM sessions WHERE user_ID=?', [id]);
    await ExecutePreparedStatement('DELETE FROM users WHERE id=?',[id]);
}
export async function SetUserPermissions(id, admin, labels, users, settings, files, logs) {
    await ExecutePreparedStatement(
        'UPDATE users SET admin=?,modify_inspiration_labels=?,modify_users=?,modify_settings=?,modify_files=?,watch_logs=? WHERE id=?',
        [admin, labels, users, settings, files, logs, id]
    )
}
export async function SetUserUsername(id, username) {
    await ExecutePreparedStatement('UPDATE users SET username=? WHERE id=?', [username, id]);
}
export async function SetUserPassword(id, password) {
    await ExecutePreparedStatement('UPDATE users SET password=? WHERE id=?', [password, id]);
}
export async function GetUser(id) {
    var results = await ExecutePreparedStatement(
        'SELECT * FROM users WHERE id=?', [id]
    );
    return results.length == 0 ? undefined : results[0];
}
export async function GetUserByName(username) {
    var results = await ExecutePreparedStatement(
        'SELECT * FROM users WHERE username=?', [username]
    );
    return results.length == 0 ? undefined : results[0];
}
export async function GetAllUsers() {
    return await ExecuteStatement('SELECT * FROM users');
}
export async function GetAmountUsers() {
    var result = await ExecutePreparedStatement('SELECT COUNT(*) FROM users');
    return result.length == 0 ? undefined : result[0]['COUNT(*)'];
}
export async function GetAmountAdmins() {
    var result = await ExecutePreparedStatement('SELECT COUNT(*) FROM users WHERE admin=TRUE');
    return result.length == 0 ? undefined : result[0]['COUNT(*)'];
}


// + ======================================================================== +
// | Sessions                                                                 |
// + ======================================================================== +
export async function CreateSession(id, credential, userID, invalidAt = undefined) {
    if(invalidAt)
        await ExecutePreparedStatement('INSERT INTO sessions (id, credential, user_ID, invalidAt) VALUES(?,?,?,?)', [id, credential, userID, invalidAt]);
    else
        await ExecutePreparedStatement('INSERT INTO sessions (id, credential, user_ID) VALUES(?,?,?)', [id, credential, userID]);
}
export async function DoesSessionIDExist(id) {
    var results = await ExecutePreparedStatement(
        'SELECT CASE WHEN EXISTS(SELECT 1 FROM sessions WHERE id=UNHEX(?)) THEN 1 ELSE 0 END AS result',
        [Buffer.from(id, 'ascii').toString('hex')]
    );
    return results[0]['result'] == '1';
}
export async function DeleteSession(id) {
    await ExecutePreparedStatement('DELETE FROM sessions WHERE id=?', [id]);
}
export async function DeleteInvalidSessions() {
    await ExecuteStatement('DELETE FROM sessions WHERE invalid_at<CURRENT_TIMESTAMP');
}
export async function GetSession(id) {
    var results = await ExecutePreparedStatement('SELECT * FROM sessions WHERE id=UNHEX(?)', [Buffer.from(id, 'ascii').toString('hex')]);
    return results.length == 0 ? undefined : results[0];
}


// + ======================================================================== +
// | Inspiration                                                              |
// + ======================================================================== +
export async function CreateInspiration(
    versionName, versionDescription, versionSuggestor, versionSuggestorID, 
    type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 
    originalID=undefined
) {
    if(originalID != undefined) {

        var previousID = await ExecutePreparedStatement('SELECT id FROM inspiration WHERE original_id=? AND next_version=NULL', [originalID]);
        if(previousID.length == 0) throw new Error('No inspiration with original_id found');
        previousID = previousID[0]['id'];

        await ExecutePreparedStatement(
            `INSERT INTO inspiration 
            (version_name, version_description, version_proposer, version_proposer_id, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 
            previous_version, original_id) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 
            previousID, original_id
        ]);
        var insertedID = await ExecuteStatement('SELECT LAST_INSERT_ID() AS \'id\';');
        if(insertedID.length == 0) throw new Error('Error retrieving the last inserted id');
        insertedID = insertedID[0]['id'];

        ExecutePreparedStatement('UPDATE inspiration SET next_version=? WHERE id=?', [newID, previousID]);

    } else {

        await ExecutePreparedStatement(`INSERT INTO inspiration 
            (version_name, version_description, version_proposer, version_proposer_id, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo, original_id) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 0
        ]);
        await ExecuteStatement('UPDATE inspiration SET original_id=uuid WHERE uuid=LAST_INSERT_ID()');

    }
}
export async function DoesInspirationExist(type, ID) {
    var result = await ExecutePreparedStatement(
        'SELECT CASE WHEN EXISTS(SELECT 1 FROM inspiration WHERE type=? AND ID=?) THEN 1 ELSE 0 END AS result',
        [type, ID]
    );
    return result[0]['result'] == '1';
}
export async function SetInspirationAsActive(uuid) {
    // Set all versions to non active
    var inspirationID = await ExecutePreparedStatement('SELECT original_id FROM inspiration WHERE uuid=?', [uuid]);
    await ExecutePreparedStatement('UPDATE inspiration SET active_version=FALSE WHERE original_id=?', [inspirationID]);
    // Set specified uuid to active
    await ExecutePreparedStatement('UPDATE inspiration SET active_version=TRUE WHERE uuid=?', [uuid]);
}
export async function GetInspiration(uuid) {
    var results = await ExecutePreparedStatement('SELECT * FROM inspiration WHERE uuid=?', [uuid]);
    return results.length == 0 ? undefined : results[0];
}
export async function GetAllActiveInspirationWithLabels(labels, limit, offset) {
    var statement = 'SELECT * FROM inspiration WHERE active_version=TRUE AND original_id IN(SELECT inspiration_id FROM labels_to_inspiration l1 ';
    for(var i = 1; i < labels.length; i++) statement += 'JOIN labels_to_inspiration l' + i.toString() + ' USING(inspiration_id) ';
    for(var i = 0; i < labels.length; i++) {
        statement += i == 0 ? 'WHERE' : 'AND';
        statement += ' l' + i.toString() + '.label_id=' + labels[i] + ' ';
    }
    statement += ' LIMIT ? OFFSET ?)';
    return await ExecutePreparedStatement(statement, labels.concat([limit, offset]));
}
export async function GetAllActiveInspiration(limit, offset) {
    return await ExecutePreparedStatement('SELECT * FROM inspiration WHERE active_version=TRUE LIMIT ? OFFSET ?', [limit, offset]);
}
export async function GetAllInspirationVersionsOfID(inspirationID) {
    return await ExecutePreparedStatement('SELECT * FROM inspiration WHERE original_id=? ORDER BY created_at ASC', [inspirationID]);
}


// + ======================================================================== +
// | InspirationLabels                                                        |
// + ======================================================================== +
export async function CreateCategory(category) {
    await ExecutePreparedStatement('INSERT INTO labels (category) VALUES(?)', [category]);
}
export async function CreateLabel(category, name) {
    await ExecutePreparedStatement('INSERT INTO labels (category, name) VALUES(?,?)', [category, name])
}
export async function AddLabelToInspiration(labelID, inspirationUUID) {
    await ExecutePreparedStatement('INSERT INTO labels_to_inspiration (label_id, inspiration_id) VALUES(?,?)', [labelID, inspirationUUID]);
}
export async function AddLabelsToLastInsertedInspiration(labelIDs) {
    var query = 'INSERT INTO labels_to_inspiration (label_id, inspiration_id) VALUES';
    for(var i = 0; i < labelIDs.length; i++) {
        if(i != 0) query += ',';
        query += '(?,LAST_INSERT_ID())';
    }
    await ExecutePreparedStatement(query, labelIDs);
}
export async function DeleteLabelFromInspiration(labelID, inspirationUUID) {
    await ExecutePreparedStatement('DELETE FROM labels WHERE label_id=? AND inspiration_id=?', [labelID, inspirationUUID]);
}
export async function DeleteCategory(category) {
    await ExecutePreparedStatement('DELETE FROM labels_to_inspiration WHERE label_id IN (SELECT id FROM labels WHERE category=?)', [category]);
    await ExecutePreparedStatement('DELETE FROM labels WHERE category=?', [category]);
}
export async function DeleteLabel(labelID) {
    await ExecutePreparedStatement('DELETE FROM labels_to_inspiration WHERE label_id=?', [labelID]);
    await ExecutePreparedStatement('DELETE FROM labels WHERE id=?', [labelID]);
}
export async function GetAllLabels() {
    return await ExecuteStatement('SELECT * FROM labels');
}


// + ======================================================================== +
// | Projects                                                                 |
// + ======================================================================== +
export async function CreateProject(
    versionName, versionDescription, versionSuggestor, versionSuggestorID, 
    name, description, url1, url2, url3, requester, implementer, requestEmail, 
    originalID=undefined
) {
    if(originalID != undefined) {

        var previousID = await ExecutePreparedStatement('SELECT id FROM projects WHERE original_id=? AND next_version=NULL', [originalID]);
        if(previousID.length == 0) throw new Error('No projects with original_id found');
        previousID = previousID[0]['id'];

        await ExecutePreparedStatement(
            `INSERT INTO projects 
            (version_name, version_description, version_proposer, version_proposer_id, 
            name, description, url1, url2, url3, requester, implementer, request_email, 
            previous_version, original_id) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            name, description, url1, url2, url3, requester, implementer, requestEmail, 
            previousID, original_id
        ]);
        var insertedID = await ExecuteStatement('SELECT LAST_INSERT_ID() AS \'id\'');
        if(insertedID.length == 0) throw new Error('Error retrieving the last inserted id');
        insertedID = insertedID[0]['id'];

        ExecutePreparedStatement('UPDATE projects SET next_version=?  WHERE id=?', [newID, previousID]);

    } else {
        await ExecutePreparedStatement(
            `INSERT INTO projects 
            (version_name, version_description, version_proposer, version_proposer_id, 
            name, description, url1, url2, url3, requester, implementer, request_email, original_id) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            versionName, versionDescription, versionSuggestor, versionSuggestorID,
            name, description, url1, url2, url3, requester, implementer, requestEmail, 0
        ]);
        await ExecuteStatement('UPDATE projects SET original_id=uuid WHERE uuid=LAST_INSERT_ID()');

    }
}
export async function SetProjectAsActive(uuid) {
    // Set all versions to non active
    var projectID = (await ExecutePreparedStatement('SELECT original_id FROM projects WHERE uuid=?', [uuid]))[0]['original_id'];
    await ExecutePreparedStatement('UPDATE projects SET active_version=FALSE WHERE original_id=?', [projectID]);
    // Set specified uuid to active
    await ExecutePreparedStatement('UPDATE projects SET active_version=TRUE WHERE uuid=?', [uuid]);
}
export async function GetProject(uuid) {
    var result = await ExecutePreparedStatement('SELECT * FROM projects WHERE uuid=?', [uuid]);
    return result.length == 0 ? undefined : result[0];
}
export async function GetAllActiveProjects() {
    return await ExecuteStatement('SELECT * FROM projects WHERE active_version=TRUE');
}
export async function GetAllProjectVersionsOfID(projectID) {
    return await ExecutePreparedStatement('SELECT * FROM projects WHERE original_id=? ORDER BY created_at DESC', [projectID]);
}
export async function IsValidProject(uuid) {
    var results = await ExecutePreparedStatement(
        'SELECT CASE WHEN EXISTS(SELECT 1 FROM projects WHERE uuid=?) THEN 1 ELSE 0 END AS result',
        [uuid]
    );
    return results[0]['result'] == '1';
}


// + ======================================================================== +
// | Inspiration SuggestionVoting                                             |
// + ======================================================================== +
export async function CreateInspirationVoteOrUpdate(value, adminVote, userID, inspirationUUID) {
    await ExecutePreparedStatement(
        `INSERT INTO suggestion_votes (value, admin_vote, user_id, inspiration_id) VALUES(?,?,?,?)
        ON DUPLICATE KEY UPDATE value=?, admin_vote=?`, 
        [value, adminVote, userID, inspirationUUID, value, adminVote]
    );
}
export async function GetInspirationVotes(inspirationUUID) {
    return await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE inspiration_id=?', [inspirationUUID]);
}
export async function GetInspirationVote(userID, projectUUID) {
    var results = await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE inspiration_id=? AND user_id=?', [projectUUID, userID]);
    return results.length == 0 ? undefined : results[0];
}
export async function AcceptInspiration(inspirationUUID) {
    await ExecutePreparedStatement('UPDATE inspiration SET voting_result=TRUE WHERE uuid=?', [inspirationUUID]);
    SetInspirationAsActive(inspirationUUID);
}
export async function DenyInspiration(inspirationUUID) {
    await ExecutePreparedStatement('UPDATE inspiration SET voting_result=FALSE WHERE uuid=?', [inspirationUUID]);
}


// + ======================================================================== +
// | Project SuggestionVoting                                                 |
// + ======================================================================== +
export async function CreateProjectVoteOrUpdate(value, adminVote, userID, projectUUID) {
    await ExecutePreparedStatement(
        `INSERT INTO suggestion_votes (value, admin_vote, user_id, project_id) VALUES(?,?,?,?)
        ON DUPLICATE KEY UPDATE value=?, admin_vote=?`, 
        [value, adminVote, userID, projectUUID, value, adminVote]
    );
}
export async function GetProjectVotes(projectUUID) {
    return await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE project_id=?', [projectUUID]);
}
export async function GetProjectVote(userID, projectUUID) {
    var results = await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE project_id=? AND user_id=?', [projectUUID, userID]);
    return results.length == 0 ? undefined : results[0];
}
export async function AcceptProject(projectUUID) {
    await ExecutePreparedStatement('UPDATE projects SET voting_result=TRUE WHERE uuid=?', [projectUUID]);
    SetProjectAsActive(projectUUID);
}
export async function DenyProject(projectUUID) {
    await ExecutePreparedStatement('UPDATE projects SET voting_result=FALSE WHERE uuid=?', [projectUUID]);
}


// + ======================================================================== +
// | Combined suggestions                                                     |
// + ======================================================================== +
export async function GetAllSuggestionWithVotes(userID) {
    return await ExecutePreparedStatement(`
    SELECT
        i.original_id AS original_id,
        i.uuid AS uuid,
        i.name AS name,
        i.version_description AS description,
        sv.value AS vote_value,
        'inspiration' AS type
    FROM inspiration i
    LEFT JOIN (SELECT inspiration_id, value FROM suggestion_votes WHERE user_id=?) AS sv ON i.uuid = sv.inspiration_id
    WHERE i.voting_result IS NULL

    UNION

    SELECT
        p.original_id AS original_id,
        p.uuid AS uuid,
        p.name AS name,
        p.version_description AS description,
        sv.value AS vote_value,
        'project' AS type
    FROM projects p
    LEFT JOIN (SELECT project_id, value FROM suggestion_votes WHERE user_id=?) AS sv ON p.uuid = sv.project_id
    WHERE p.voting_result IS NULL
    `, [userID, userID]);
}
export async function GetAllOpenSuggestions() {
    return await ExecuteStatement(`
    SELECT
        i.uuid AS uuid,
        'inspiration' AS type
    FROM inspiration i
    WHERE i.voting_result IS NULL

    UNION

    SELECT
        p.uuid AS uuid,
        'inspiration' AS type
    FROM inspiration p
    WHERE p.voting_result IS NULL
    `);
}


// + ======================================================================== +
// | Files                                                                    |
// + ======================================================================== +
export async function CreateFileAtPath(parentID, path, uploadThingID) {
    return CreateNodeAtPath(parentID, path, [uploadThingID], {tableName: 'files', tableFields:',uploadthing_id'});
}
export async function DeleteFile(fileID) {
    await ExecutePreparedStatement('DELETE FROM files WHERE id=?', [fileID]);
}
export async function GetUploadthingIDFromPath(parentID, path) {
    const results = await ExecutePreparedStatement(`
        WITH RECURSIVE file_path (id, uploadthing_id, name, path_index) AS
        (
            SELECT id, uploadthing_id, name, 2
                FROM files
                WHERE parent_id<=>?
                    AND name=SUBSTRING_INDEX(SUBSTRING_INDEX(?, '/', 1), '/', -1)
            UNION ALL
            SELECT f.id, f.uploadthing_id, f.name, fp.path_index+1
                FROM file_path AS fp
                JOIN files AS f
                    ON f.parent_id = fp.id
                    AND f.name = SUBSTRING_INDEX(SUBSTRING_INDEX(?, '/', fp.path_index), '/', -1)
                WHERE fp.path_index <= (LENGTH(?) - LENGTH(REPLACE(?, '/', '')) + 2)
        )
        SELECT id,uploadthing_id,name FROM file_path
            WHERE path_index=(LENGTH(?) - LENGTH(REPLACE(?, '/', '')) + 2)
    `, [parentID, path, path, path, path, path, path]);
    return results.length == 0 ? undefined : { ...results[0], path: path };
}
export async function GetChildrenOfFileID(id) {
    return GetChildrenOfNode(id, {tableName: 'files', tableFields:',uploadthing_id'});
}
export async function GetAllFullFilePaths() {
    return GetChildrenOfFileID(null);
}


// + ======================================================================== +
// | Adjacency list                                                           |
// + ======================================================================== +
export function GetExtraFieldsOfNode(nodeInfo, { tableFields }) {
    return tableFields
    .split(',')
    .filter((field) => field.length > 0)
    .map((field) => {
        return nodeInfo[field];
    });
}
export async function CreateNode(parentID, name, otherValues, { tableName, tableFields }) {
    const doesExists = await ExecutePreparedStatement(`SELECT id FROM files WHERE parent_id<=>? AND name=?`, [parentID, name]);
    if(doesExists.length > 0) return false;

    await ExecutePreparedStatement(
        `INSERT INTO ${tableName} (parent_id, name${tableFields}) VALUES(?,?${',?'.repeat(tableFields.split(',').length - 1)})`, 
        [parentID, name, ...otherValues]
    );
    return true;
}
export async function CreateNodeAtPath(parentID, path, otherValues, { tableName, tableFields }) {
    var intParentID = parentID;
    const explodedPath = path.split('/');
    var index = 0;
    for(const folder of explodedPath) {
        if(index+1 >= explodedPath.length) {
            return await CreateNode(intParentID, folder, otherValues, { tableName, tableFields });
        }
        let folderID = (await GetNodeByName(folder, intParentID, { tableName }))?.id;
        if(folderID == undefined) {
            folderID = await ExecutePreparedStatement(`INSERT INTO ${tableName} (parent_id, name) VALUES(?,?) RETURNING id`, [intParentID, folder]);
            if(folderID.length == 0) throw new Error('Failed to use INSERT RETURNING');
            folderID = folderID[0]['id'];
        }
        intParentID = folderID;
        index++;
    }
    return false;
}
export async function CreateNodeReturnID(parentID, otherValues, { tableName, tableFields }) {
    const result = await ExecutePreparedStatement(
        `INSERT INTO ${tableName} (parent_id, name${tableFields}) VALUES(?,"placeholder"${',?'.repeat(tableFields.split(',').length - 1)}) RETURNING id`, 
        [parentID, ...otherValues]
    );
    const insertedID = result[0]['id'];
    if(insertedID == undefined) throw new Error('Failed to use INSERT RETURNING');
    await ExecutePreparedStatement(`UPDATE ${tableName} SET name=? WHERE id=?`, ['new' + insertedID, insertedID]);
    return insertedID;
}
export async function RenameNode(id, newName, { tableName, tableFields, isLeaf }) {
    const currentFileInfo = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE id=?`, [id]);
    if(currentFileInfo[0] == undefined) return [];
    if(!(await isLeaf(currentFileInfo[0]))) {
        const children = await GetChildrenOfNode(currentFileInfo[0].id, {tableName, tableFields});
        let failedNodes = [];
        for(let i = 0; i < children.length; i++) {
            if(!(await CreateNodeAtPath(currentFileInfo[0].parent_id, newName + '/' + children[i].path, GetExtraFieldsOfNode(children[i], {tableFields}), {tableName, tableFields})))
                failedNodes.push(children[i]);
        }
        await DeleteNode(id, {tableName, tableFields});
        // Make sure an empty folder doesn`t get removed:
        await CreateNode(currentFileInfo[0].parent_id, newName, GetExtraFieldsOfNode(currentFileInfo, {tableFields}), {tableName, tableFields});
        return failedNodes;
    }
    await ExecutePreparedStatement(`UPDATE ${tableName} SET name=? WHERE id=?`, [newName, id]);
    return [];
}
export async function MoveNode(id, newParentId, { tableName, tableFields, isLeaf }) {
    const currentFileInfo = await GetNode(id, {tableName});
    if(currentFileInfo == undefined) return [];

    if(!(await isLeaf(currentFileInfo))) {
        const children = await GetChildrenOfNode(currentFileInfo.id, { tableName, tableFields });
        let failedNodes = [];
        for(let i = 0; i < children.length; i++) {
            if(!(await CreateNodeAtPath(newParentId, currentFileInfo.name + '/' + children[i].path, GetExtraFieldsOfNode(children[i], {tableFields}), {tableName, tableFields})))
                failedNodes.push(children[i].uploadthing_id);
        }
        await DeleteNode(id, {tableName, tableFields});
        // Make sure an empty folder doesn`t get removed:
        await CreateNode(newParentId, currentFileInfo.name, GetExtraFieldsOfNode(currentFileInfo, {tableFields}), {tableName, tableFields});
        return failedNodes;
    }
    await ExecutePreparedStatement(`UPDATE ${tableName} SET parent_id=? WHERE id=?`, [newParentId, id]);
    return [];
}
export async function DeleteNode(id, { tableName }) {
    await ExecutePreparedStatement(`DELETE FROM ${tableName} WHERE id=?`, [id]);
}
export async function CheckNodeRenamingConflicts(id, newName, { tableName, tableFields, isLeaf }) {
    const existingID = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE name=? AND parent_id <=> (SELECT parent_id FROM ${tableName} WHERE id=? LIMIT 1)`, [newName, id]);
    if(existingID.length > 0) {
        const mergingFile = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE id=?`, [id]);
        if(!(await isLeaf(mergingFile[0]))) {
            // It is a folder -> compare all the children
            const existingChildren = await GetChildrenOfNode(existingID[0].id, {tableName, tableFields});
            const mergingChildren = await GetChildrenOfNode(mergingFile[0].id, {tableName, tableFields});
            let sharedChildren = [];
            mergingChildren.forEach((merging) => {
                if(merging.uploadthing_id == null) return;
                const conflictIndex = existingChildren.findIndex((existing) => existing.path == merging.path );
                if(conflictIndex != -1) sharedChildren.push({ 
                    child: { ...merging, path: mergingFile[0].name + '/' + merging.path },
                    with: { ...existingChildren[conflictIndex] }
                });
            });
            return sharedChildren;
        } else {
            return [{ 
                child: {...mergingFile[0], path: mergingFile[0].name },
                with: { ...existingID[0] }
            }];
        }
    }
    return false;
}
export async function GetNodeMovingConflicts(id, newParentId, { tableName, tableFields, isLeaf }) {
    const existingID = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE parent_id<=>? AND name=(SELECT name FROM ${tableName} WHERE id=? LIMIT 1)`, [newParentId, id]);
    if(existingID.length > 0) {
        const mergingFile = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE id=?`, [id]);
        if(!(await isLeaf(mergingFile[0]))) {
            // It is a folder -> compare all the children
            const existingChildren = await GetChildrenOfNode(existingID[0].id, {tableName, tableFields});
            const mergingChildren = await GetChildrenOfNode(mergingFile[0].id, {tableName, tableFields});
            let sharedChildren = [];
            mergingChildren.forEach((merging) => {
                if(merging.uploadthing_id == null) return;
                const conflictIndex = existingChildren.findIndex((existing) => existing.path == merging.path );
                if(conflictIndex != -1) sharedChildren.push({ 
                    child: {...merging, path: mergingFile[0].name + '/' + merging.path },
                    with: { ...existingChildren[conflictIndex] }
                });
            });
            return sharedChildren;
        } else {
            // It is a file
            return [{ 
                child: { ...mergingFile[0], path: mergingFile[0].name },
                with: { ...existingID[0] }
            }];
        }
    }
    return false;
}
export async function GetNodeByName(name, parent_id, { tableName }) {
    const results = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE name=? AND parent_id<=>?`, [name, parent_id]);
    return results.length == 0 ? undefined : results[0];
}
export async function GetNode(id, { tableName }) {
    const results = await ExecutePreparedStatement(`SELECT * FROM ${tableName} WHERE id=?`, [id]);
    return results.length == 0 ? undefined : results[0];
}
export async function GetChildrenOfNode(id, { tableName, tableFields }) {
    return await ExecutePreparedStatement(`
        WITH RECURSIVE file_path (id, name${tableFields}, path) AS
        (
        SELECT id, name${tableFields}, name as path
            FROM ${tableName}
            WHERE parent_id <=> ?
        UNION ALL
        SELECT f.id, f.name${tableFields.replaceAll(' ', '').replaceAll(',', ',f.')}, CONCAT(fp.path, '/', f.name)
            FROM file_path AS fp
            JOIN ${tableName} AS f
                ON fp.id = f.parent_id
        )
        SELECT * FROM file_path
        ORDER BY path;
    `, [id]);
}
export async function GetAllFullNodePaths({ tableName, tableFields}) {
    return await GetChildrenOfFileID(null, {tableName, tableFields});
}


// + ======================================================================== +
// | Logs                                                                     |
// + ======================================================================== +
export async function CreateLog(urgency, type, message) {
    await ExecutePreparedStatement('INSERT INTO logs (urgency, type, message) VALUES(?,?,?)', [urgency, type, message]);
}
export async function GetAllLogs(limit, offset) {
    return await ExecutePreparedStatement('SELECT * FROM logs LIMIT ? OFFSET ?', [limit, offset]);
}
export async function GetFilteredLogs(includedString, limit, offset) {
    return await ExecutePreparedStatement('SELECT * FROM logs WHERE MATCH (message) AGAINST (? IN NATURAL LANGUAGE MODE) LIMIT ? OFFSET ?', [includedString, limit, offset]);
}

export const InspirationTypes = Object.freeze({
    None: -1,
    YT_Video: 0,
    YT_Channel: 1,
    Github_account: 2,
    Github_repository: 3,
    Website: 4,
});