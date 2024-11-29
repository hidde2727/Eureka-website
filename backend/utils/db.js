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
                console.error(statement + '\n\n' + err + + '\n\nValues:\n\n' + JSON.stringify(values));
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
    await ExecutePreparedStatement('DELETE users WHERE id=?',[id]);
}
export async function DeleteUserWithName(username) {
    await ExecutePreparedStatement('DELETE users WHERE username=?',[username]);
}
export async function SetUserPermissions(id, admin, modify_inspiration_labels, modify_users, modify_settings, modify_files, watch_logs) {
    await ExecutePreparedStatement(
        'UPDATE users SET admin=?,modify_inspiration_labels=?,modify_users=?,modify_settings=?,modify_files=?,watch_logs=? WHERE id=?',
        [admin, modify_inspiration_labels, modify_users, modify_settings, modify_files, watch_logs, id]
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
    var results = await ExecutePreparedStatement(statement, labels.concat([limit, offset]));
    return results.length == 0 ? undefined : results;
}
export async function GetAllActiveInspiration(limit, offset) {
    var results = await ExecutePreparedStatement('SELECT * FROM inspiration WHERE active_version=TRUE LIMIT ? OFFSET ?', [limit, offset]);
    return results.length == 0 ? undefined : results;
}
export async function GetAllInspirationVersionsOfID(inspirationID) {
    var results = await ExecutePreparedStatement('SELECT * FROM inspiration WHERE original_id=? ORDER BY created_at ASC', [inspirationID]);
    return results.length == 0 ? undefined : results;
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
    await ExecutePreparedStatement('DELETE FROM labels_to_inspiration WHERE label_id IN (SELECT id FROM labels WHERE category=)', [category]);
    await ExecutePreparedStatement('DELETE FROM labels WHERE category=', [category]);
}
export async function DeleteLabel(labelID) {
    await ExecutePreparedStatement('DELETE FROM labels_to_inspiration WHERE label_id=?', [labelID]);
    await ExecutePreparedStatement('DELETE FROM labels WHERE id=?', [labelID]);
}
export async function GetAllLabels() {
    results = await ExecuteStatement('SELECT * FROM labels');
    return results.length == 0 ? undefined : results;
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
    var results = await ExecuteStatement('SELECT * FROM projects WHERE active_version=TRUE');
    return results.length == 0 ? undefined : results;
}
export async function GetAllProjectVersionsOfID(projectID) {
    var results = await ExecutePreparedStatement('SELECT * FROM projects WHERE original_id=? ORDER BY created_at DESC', [projectID]);
    return results.length == 0 ? undefined : results;
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
    var results = await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE inspiration_id=?', [inspirationUUID]);
    return results.length == 0 ? undefined : results;
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
    var results = await ExecutePreparedStatement('SELECT * FROM suggestion_votes WHERE project_id=?', [projectUUID]);
    return results.length == 0 ? undefined : results;
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
    var results = await ExecutePreparedStatement(`
    SELECT
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
        p.uuid AS uuid,
        p.name AS name,
        p.version_description AS description,
        sv.value AS vote_value,
        'project' AS type
    FROM projects p
    LEFT JOIN (SELECT project_id, value FROM suggestion_votes WHERE user_id=?) AS sv ON p.uuid = sv.project_id
    WHERE p.voting_result IS NULL
    `, [userID, userID]);
    return results.length == 0 ? undefined : results;
}
export async function GetAllOpenSuggestions() {
    var results = await ExecuteStatement(`
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
    return results.length == 0 ? undefined : results;
}


// + ======================================================================== +
// | Logs                                                                     |
// + ======================================================================== +
export async function CreateLog(urgency, type, message) {
    await ExecutePreparedStatement('INSERT INTO logs (urgency, type, message) VALUES(?,?,?)', [urgency, type, message]);
}
export async function GetAllLogs(limit, offset) {
    var results = await ExecutePreparedStatement('SELECT * FROM logs LIMIT ? OFFSET ?', [limit, offset]);
    return results.length == 0 ? undefined : results;
}
export async function GetFilteredLogs(includedString, limit, offset) {
    var results = await ExecutePreparedStatement('SELECT * FROM logs WHERE MATCH (message) AGAINST (? IN NATURAL LANGUAGE MODE) LIMIT ? OFFSET ?', [includedString, limit, offset]);
    return results.length == 0 ? undefined : results;
}

export const InspirationTypes = Object.freeze({
    None: -1,
    YT_Video: 0,
    YT_Channel: 1,
    Github_account: 2,
    Github_repository: 3,
    Website: 4,
});