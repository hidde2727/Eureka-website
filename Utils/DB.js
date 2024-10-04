const mysql = require('mysql')
const config = require('./Config.js')

var connection;

function InitDatabase() {
    connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });
    connection.connect();
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

async function CreateProjectSuggestion(json) {
    await ExecutePreparedStatement("INSERT INTO suggestions (type, json) VALUES(?,?)", ["project", json]);
}
async function CreateUser(username, password) {
    await ExecutePreparedStatement("INSERT INTO users (username, password) VALUES(?,UNHEX(?))", [username, Buffer.from(password, "utf-8").toString("hex")]);
}
async function CreateSession(id, credential, username) {
    userID = await GetUserID(username);
    if (userID == undefined)
        throw new Error("Unknow user");

    await ExecutePreparedStatement(
        "INSERT INTO sessions (id, credential, username, user_ID) VALUES(UNHEX(?),UNHEX(?),?,?)", [
        Buffer.from(id, "utf-8").toString("hex"),
        Buffer.from(credential, "utf-8").toString("hex"),
        username,
        userID
    ]);
}
async function CreateCategory(category) {
    await ExecutePreparedStatement(
        "INSERT INTO labels (category) VALUES(?)", [
        category
    ]);
}
async function CreateLabel(category, label, color) {
    await ExecutePreparedStatement(
        "INSERT INTO labels (category, name, color) VALUES(?,?,?)", [
        category,
        label,
        color
    ]);
}
async function SetUserPermissions(username, modifyUsers, addFiles, modifyInspiration, modifyProjects) {
    await ExecutePreparedStatement(
        "UPDATE users SET modify_users=?,add_files=?,modify_inspiration=?,modify_projects=? WHERE username=?", [
        modifyUsers, addFiles, modifyInspiration, modifyProjects, username
    ]);
}
async function SetLabelName(category, name, newName) {
    await ExecutePreparedStatement("UPDATE labels SET name=? WHERE (category=? AND name=?)",[newName, category, name]);
}
async function DeleteSession(sessionID) {
    await ExecutePreparedStatement("DELETE FROM sessions WHERE id=?", [Buffer.from(sessionID, "utf-8").toString("hex")]);
}
async function DeleteUser(username) {
    var userID = await GetUserID(username);
    if (userID == undefined)
        throw new Error("Unknow user");
    await ExecutePreparedStatement("DELETE FROM sessions WHERE user_ID=?", [userID]);
    await ExecutePreparedStatement("DELETE FROM suggestion_votes WHERE user_ID=?", [userID]);
    await ExecutePreparedStatement("DELETE FROM users WHERE id=?", [userID]);
}
async function DeleteLabel(category, label) {
    await ExecutePreparedStatement("DELETE FROM labels WHERE (category=? AND name=?)", [category, label]);
}

async function IsTableEmpty(tableName) {
    var results = await ExecuteStatement("SELECT CASE WHEN EXISTS(SELECT 1 FROM " + tableName + ") THEN 0 ELSE 1 END AS result");
    return results[0]['result'] == "1";
}
async function DoesSessionIDExist(id) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM sessions WHERE id=UNHEX(?)) THEN 1 ELSE 0 END AS result",
        [Buffer.from(id, "utf-8").toString("hex")]
    );
    return results[0]['result'] == "1";
}
async function DoesUserExist(username) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE username=?) THEN 1 ELSE 0 END AS result",
        [username]
    );
    return results[0]['result'] == "1";
}
async function DoesCategoryExist(category) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM labels WHERE category=?) THEN 1 ELSE 0 END AS result",
        [category]
    );
    return results[0]['result'] == "1";
}
async function DoesLabelExist(category, label) {
    var results = await ExecutePreparedStatement(
        "SELECT CASE WHEN EXISTS(SELECT 1 FROM labels WHERE (category=? AND name=?)) THEN 1 ELSE 0 END AS result",
        [category, label]
    );
    return results[0]['result'] == "1";
}


async function GetUserPassword(username) {
    var results = await ExecutePreparedStatement("SELECT password FROM users WHERE username=?", [username]);
    return results.length == 0 ? undefined : results[0].password;
}
async function GetUserID(username) {
    var results = await ExecutePreparedStatement("SELECT id FROM users WHERE username=?", [username]);
    return results.length == 0 ? undefined : results[0].id;
}
async function GetSession(sessionID) {
    await ExecuteStatement("DELETE FROM sessions WHERE invalid_at<CURRENT_TIMESTAMP"); // First remove all the session that are over

    var results = await ExecutePreparedStatement("SELECT * FROM sessions WHERE id=UNHEX(?)", [Buffer.from(sessionID, "utf-8").toString("hex")]);
    return results.length == 0 ? undefined : results[0];
}
async function GetUserByUsername(username) {
    var results = await ExecutePreparedStatement("SELECT * FROM users WHERE username=?", [username]);
    return results.length == 0 ? undefined : results[0];
}
async function GetUser(userID) {
    var results = await ExecutePreparedStatement("SELECT * FROM users WHERE id=?", [userID]);
    return results.length == 0 ? undefined : results[0];
}
async function GetAllUserData() {
    return await ExecuteStatement("SELECT * FROM users");
}
async function GetVotableRequestsForUser(id) {
    var results = await ExecutePreparedStatement("SELECT * FROM suggestions WHERE id NOT IN(SELECT suggestion_ID FROM suggestion_votes WHERE user_ID=?)", [id]);
    return results;
}
async function GetAllLabels() {
    return await ExecuteStatement("SELECT name,category,color FROM labels ORDER BY name ASC");
}
async function GetAllInspiration() {
    return await ExecuteStatement("SELECT * FROM inspiration");
}

module.exports = {
    ExecuteStatement, ExecutePreparedStatement,
    InitDatabase, 
    CreateProjectSuggestion,CreateUser,CreateSession,CreateCategory,CreateLabel,
    SetUserPermissions,SetLabelName,
    DeleteSession,DeleteUser,DeleteLabel,
    IsTableEmpty,DoesSessionIDExist,DoesUserExist,DoesCategoryExist,DoesLabelExist,
    GetUserPassword,GetSession,GetUserByUsername,GetUser,GetAllUserData,GetVotableRequestsForUser,GetAllLabels,GetAllInspiration
};