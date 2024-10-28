const mysql = require('mysql');
const fs = require('node:fs');
const config = require('./Config.js');

var connection;

async function CreateConnection() {
    connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });
    await connection.connect();
}
async function SetupTables() {
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/projects.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/labels.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/inspiration.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/labels_to_inspiration.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/users.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/sessions.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/suggestion_votes.schema", { encoding:"ascii" }));
    await ExecuteStatement(fs.readFileSync("./Utils/Schemas/logs.schema", { encoding:"ascii" }));
}
async function ExecuteStatement(statement) {
    return new Promise((resolve, reject)=>{
        connection.query(statement, (err, results) => {
            if (err) throw new Error(statement + "\n" + err);
            return resolve(results);
        });
    });
}
async function ExecutePreparedStatement(statement, values) {
    return new Promise((resolve, reject)=>{
        connection.query(statement, values, (err, results) => {
            if (err) throw new Error(statement + "\n" + err);
            return resolve(results);
        });
    });
}
// + ======================================================================== +
// | Users                                                                    |
// + ======================================================================== +
async function IsTableEmpty(tableName) {
    var results = await ExecuteStatement("SELECT CASE WHEN EXISTS(SELECT 1 FROM " + tableName + ") THEN 0 ELSE 1 END AS result");
    return results[0]['result'] == "1";
}


// + ======================================================================== +
// | Users                                                                    |
// + ======================================================================== +
// password == NULL if the user is archived
async function CreateUser(username, password) {
    await ExecutePreparedStatement("INSERT INTO users (username, password) VALUES(?,?)", [username, Buffer.from(password, "ascii").toString("hex")]);
}
async function DoesUsernameExist(username) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE username=?) THEN 1 ELSE 0 END AS result",
        [username]
    );
    return results[0]['result'] == "1";
}
async function DeleteUser(id) {
    await ExecutePreparedStatement("DELETE users WHERE id=?",[id]);
}
async function DeleteUserWithName(username) {
    await ExecutePreparedStatement("DELETE users WHERE username=?",[username]);
}
async function SetUserPermissions(id, admin, modify_inspiration_labels, modify_users, modify_settings, modify_files) {
    await ExecutePreparedStatement(
        "UPDATE users SET admin=?,modify_inspiration_labels=?,modify_users=?,modify_settings=?,modify_files=? WHERE id=?",
        [admin, modify_inspiration_labels, modify_users, modify_settings, modify_files, id]
    )
}
async function GetUser(id) {
    var results = await ExecutePreparedStatement(
        "SELECT * FROM users WHERE id=?", [id]
    );
    return results.length == 0 ? undefined : results[0];
}
async function GetUserByName(username) {
    var results = await ExecutePreparedStatement(
        "SELECT * FROM users WHERE name=?", [username]
    );
    return results.length == 0 ? undefined : results[0];
}
async function GetAllUsers() {
    return await ExecuteStatement("SELECT * FROM users");
}


// + ======================================================================== +
// | Sessions                                                                 |
// + ======================================================================== +
async function CreateSession(id, credential, userID, invalidAt = undefined) {
    if(invalidAt)
        await ExecutePreparedStatement("INSERT INTO sessions (id, credential, userID, invalidAt) VALUES(?,?,?,?)", [id, credential, userID, invalidAt]);
    else
        await ExecutePreparedStatement("INSERT INTO sessions (id, credential, userID) VALUES(?,?,?)", [id, credential, userID]);
}
async function DoesSessionIDExist(id) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM sessions WHERE id=UNHEX(?)) THEN 1 ELSE 0 END AS result",
        [Buffer.from(id, "ascii").toString("hex")]
    );
    return results[0]['result'] == "1";
}
async function DeleteSession(id) {
    await ExecutePreparedStatement("DELETE FROM sessions WHERE id=?", [id]);
}
async function DeleteInvalidSessions() {
    await ExecuteStatement("DELETE FROM sessions WHERE invalid_at<CURRENT_TIMESTAMP");
}
async function GetSession(id) {
    var results = await ExecutePreparedStatement("SELECT * FROM sessions WHERE id=UNHEX(?)", [Buffer.from(id, "ascii").toString("hex")]);
    return results.length == 0 ? undefined : results[0];
}


// + ======================================================================== +
// | Inspiration                                                              |
// + ======================================================================== +
async function CreateInspiration(
    versionName, versionDescription, versionSuggestor, versionSuggestorID, 
    type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 
    originalID=undefined
) {
    if(originalID != undefined) {

        var previousID = await ExecutePreparedStatement("SELECT id FROM inspiration WHERE original_id=? AND next_version=NULL", [originalID]);
        if(previousID.length == 0) throw new Error("No inspiration with original_id found");
        previousID = previousID[0]['id'];

        await ExecutePreparedStatement(
            "INSERT INTO inspiration (version_name, version_description, version_suggestor, version_suggestor_id, type, name, description, ID, url, recommendation1, recommendation2, additionInfo, previous_version, original_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo, 
            previousID, original_id
        ]);
        var insertedID = await ExecuteStatement("SELECT LAST_INSERT_ID() AS 'id';");
        if(insertedID.length == 0) throw new Error("Error retrieving the last inserted id");
        insertedID = insertedID[0]['id'];

        ExecutePreparedStatement("UPDATE inspiration WHERE id=? SET next_version=", [previousID, newID]);

    } else {

        await ExecutePreparedStatement("INSERT INTO inspiration (version_name, version_description, version_suggestor, version_suggestor_id, type, name, description, ID, url, recommendation1, recommendation2, additionInfo) VALUES(?,?,?,?,?,?,?,?,?,?)", [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            type, name, description, ID, url, recommendation1, recommendation2, additionInfo
        ]);
        await ExecuteStatement("UPDATE inspiration SET original_id=uuid WHERE uuid=LAST_INSERT_ID()");

    }
}
async function SetInspirationAsActive(uuid) {
    // Set all versions to non active
    var inspirationID = await ExecutePreparedStatement("SELECT original_id FROM inspiration WHERE uuid=?", [uuid]);
    await ExecutePreparedStatement("UPDATE inspiration WHERE original_id=? SET active_version=FALSE", [inspirationID]);
    // Set specified uuid to active
    await ExecutePreparedStatement("UPDATE inspiration WHERE uuid=? SET active_version=TRUE", [uuid]);
}
async function GetInspiration(uuid) {
    var results = await ExecutePreparedStatement("SELECT * FROM inspiration WHERE uuid=?", [uuid]);
    return results.length == 0 ? undefined : results[0];
}
async function GetAllActiveInspirationWithLabels(labels, limit, offset) {
    var statement = "SELECT * FROM inspiration WHERE active_version=TRUE AND original_id IN(SELECT inspiration_id FROM labels_to_inspiration l1 ";
    for(var i = 1; i < labels.length; i++) statement += "JOIN labels_to_inspiration l" + i.toString() + " USING(inspiration_id) ";
    for(var i = 0; i < labels.length; i++) {
        statement += i == 0 ? "WHERE" : "AND";
        statement += " l" + i.toString() + ".label_id=" + labels[i] + " ";
    }
    statement += " LIMIT ? OFFSET ?)";
    var results = await ExecutePreparedStatement(statement, labels.concat([limit, offset]));
    return results.length == 0 ? undefined : results;
}
async function GetAllActiveInspiration(limit, offset) {
    var results = await ExecutePreparedStatement("SELECT * FROM inspiration WHERE active_version=TRUE LIMIT ? OFFSET ?", [limit, offset]);
    return results.length == 0 ? undefined : results;
}


// + ======================================================================== +
// | InspirationLabels                                                        |
// + ======================================================================== +
async function CreateCategory(category) {
    await ExecutePreparedStatement("INSERT INTO labels (category) VALUES(?)", [category]);
}
async function CreateLabel(category, name) {
    await ExecutePreparedStatement("INSERT INTO labels (category, name) VALUES(?,?)", [category, name])
}
async function AddLabelToInspiration(labelID, inspirationUUID) {
    await ExecutePreparedStatement("INSERT INTO labels_to_inspiration (label_id, inspiration_id) VALUES(?,?)", [labelID, inspirationUUID]);
}
async function DeleteLabelFromInspiration(labelID, inspirationUUID) {
    await ExecutePreparedStatement("DELETE FROM labels WHERE label_id=? AND inspiration_id=?", [labelID, inspirationUUID]);
}
async function DeleteCategory(category) {
    await ExecutePreparedStatement("DELETE FROM labels_to_inspiration WHERE label_id IN (SELECT id FROM labels WHERE category=)", [category]);
    await ExecutePreparedStatement("DELETE FROM labels WHERE category=", [category]);
}
async function DeleteLabel(labelID) {
    await ExecutePreparedStatement("DELETE FROM labels_to_inspiration WHERE label_id=?", [labelID]);
    await ExecutePreparedStatement("DELETE FROM labels WHERE id=?", [labelID]);
}
async function GetAllLabels() {
    results = await ExecuteStatement("SELECT * FROM labels");
    return results.length == 0 ? undefined : results;
}


// + ======================================================================== +
// | Projects                                                                 |
// + ======================================================================== +
async function CreateProject(
    versionName, versionDescription, versionSuggestor, versionSuggestorID, 
    name, description, url1, url2, url3, requester, executor, requestEmail, 
    originalID=undefined
) {
    if(originalID != undefined) {

        var previousID = await ExecutePreparedStatement("SELECT id FROM projects WHERE original_id=? AND next_version=NULL", [originalID]);
        if(previousID.length == 0) throw new Error("No projects with original_id found");
        previousID = previousID[0]['id'];

        await ExecutePreparedStatement(
            "INSERT INTO projects (version_name, version_description, version_suggestor, version_suggestor_id, name, description, url1, url2, url3, requester, executor, request_email, previous_version, original_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            versionName, versionDescription, versionSuggestor, versionSuggestorID, 
            name, description, url1, url2, url3, requester, executor, requestEmail, 
            previousID, original_id
        ]);
        var insertedID = await ExecuteStatement("SELECT LAST_INSERT_ID() AS 'id';");
        if(insertedID.length == 0) throw new Error("Error retrieving the last inserted id");
        insertedID = insertedID[0]['id'];

        ExecutePreparedStatement("UPDATE projects WHERE id=? SET next_version=", [previousID, newID]);

    } else {

        await ExecutePreparedStatement("INSERT INTO projects (version_name, version_description, version_suggestor, version_suggestor_id, name, description, url1, url2, url3, requester, executor, request_email) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [
            versionName, versionDescription, versionSuggestor, versionSuggestorID,
            name, description, url1, url2, url3, requester, executor, requestEmail
        ]);
        await ExecuteStatement("UPDATE projects SET original_id=uuid WHERE uuid=LAST_INSERT_ID()");

    }
}
async function SetProjectAsActive(uuid) {
    // Set all versions to non active
    var projectID = await ExecutePreparedStatement("SELECT original_id FROM projects WHERE uuid=?", [uuid]);
    await ExecutePreparedStatement("UPDATE projects WHERE original_id=? SET active_version=FALSE", [projectID]);
    // Set specified uuid to active
    await ExecutePreparedStatement("UPDATE projects WHERE uuid=? SET active_version=TRUE", [uuid]);
}
async function GetProject(uuid) {
    var result = await ExecutePreparedStatement("SELECT * FROM projects WHERE uuid=?", [uuid]);
    return result.length == 0 ? undefined : result[0];
}
async function GetAllActiveProjects() {
    var results = await ExecuteStatement("SELECT * FROM projects WHERE active_version=TRUE");
    return results.length == 0 ? undefined : results;
}


// + ======================================================================== +
// | Inspiration SuggestionVoting                                             |
// + ======================================================================== +
async function CreateInspirationVote(value, userID, inspirationUUID) {
    await ExecutePreparedStatement("INSERT INTO suggestion_votes (value, user_id, inspiration_id) VALUES(?,?,?)", [value, userID, inspirationUUID]);
}
async function GetInspirationVotes(inspirationUUID) {
    var results = await ExecutePreparedStatement("SELECT * FROM suggestion_votes WHERE inspiration_id=?", [inspirationUUID]);
    return results.length == 0 ? undefined : results;
}
async function AcceptInspiration(inspirationUUID) {
    await ExecutePreparedStatement("UPDATE inspiration WHERE uuid=? SET votingResult=TRUE", [inspirationUUID]);
    SetInspirationAsActive(inspirationUUID);
}
async function DenyInspiration(inspirationUUID) {
    await ExecutePreparedStatement("UPDATE inspiration WHERE uuid=? SET votingResult=FALSE", [inspirationUUID]);
}


// + ======================================================================== +
// | Project SuggestionVoting                                                 |
// + ======================================================================== +
async function CreateProjectVote(value, userID, projectUUID) {
    await ExecutePreparedStatement("INSERT INTO suggestion_votes (value, user_id, project_id) VALUES(?,?,?)", [value, userID, projectUUID]);
}
async function GetProjectVotes(projectUUID) {
    var results = await ExecutePreparedStatement("SELECT * FROM suggestion_votes WHERE project_id=?", [projectUUID]);
    return results.length == 0 ? undefined : results;
}
async function AcceptProject(projectUUID) {
    await ExecutePreparedStatement("UPDATE projects WHERE uuid=? SET votingResult=TRUE", [inspirationUUID]);
    SetProjectAsActive(projectUUID);
}
async function DenyProject(projectUUID) {
    await ExecutePreparedStatement("UPDATE projects WHERE uuid=? SET votingResult=FALSE", [inspirationUUID]);
}


// + ======================================================================== +
// | Logs                                                                     |
// + ======================================================================== +
async function CreateLog(urgency, type, message) {
    await ExecutePreparedStatement("INSERT INTO logs (urgency, type, message) VALUES(?,?,?)", [urgency, type, message]);
}
async function GetAllLogs(limit, offset) {
    var results = await ExecutePreparedStatement("SELECT * FROM logs LIMIT ? OFFSET ?", [limit, offset]);
    return results.length == 0 ? undefined : results;
}
async function GetFilteredLogs(includedString, limit, offset) {
    var results = await ExecutePreparedStatement("SELECT * FROM logs WHERE MATCH (message) AGAINST (? IN NATURAL LANGUAGE MODE) LIMIT ? OFFSET ?", [includedString, limit, offset]);
    return results.length == 0 ? undefined : results;
}

const InspirationTypes = Object.freeze({
    YT_Video: 0,
    YT_Channel: 1,
    Github_account: 2,
    Github_repository: 3,
    Website: 4,
});

module.exports = {
    ExecuteStatement, ExecutePreparedStatement,
    CreateConnection, SetupTables,
    IsTableEmpty,

    CreateUser, DoesUsernameExist, DeleteUser, DeleteUserWithName, SetUserPermissions, GetUser, GetUserByName, GetAllUsers,
    CreateSession, DoesSessionIDExist, DeleteSession, DeleteInvalidSessions, GetSession,
    CreateInspiration, SetInspirationAsActive, GetInspiration, GetAllActiveInspirationWithLabels, GetAllActiveInspiration,
    CreateCategory, CreateLabel, AddLabelToInspiration, DeleteLabelFromInspiration, DeleteCategory, DeleteLabel, GetAllLabels,
    CreateProject, SetProjectAsActive, GetProject, GetAllActiveProjects,
    CreateInspirationVote, GetInspirationVotes, AcceptInspiration, DenyInspiration,
    CreateProjectVote, GetProjectVotes, AcceptProject, DenyProject,
    CreateLog, GetAllLogs, GetFilteredLogs,

    InspirationTypes, 
};