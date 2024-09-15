const fs = require('node:fs');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');

const DB = require("./DB.js");

let pepper = null;
let hmacSecret = null;
function SetupLoginSystem(forceRegenerate = false) {
    // Generate the pepper
    if (fs.existsSync("./Data/Private/Pepper.txt") && !forceRegenerate) {
        pepper = fs.readFileSync("./Data/Private/Pepper.txt");
    } else {
        pepper = crypto.randomBytes(256);
        fs.writeFileSync("./Data/Private/Pepper.txt", pepper);
    }
    // Generate the hmacSecret (not sure if this is needed)
    if (fs.existsSync("./Data/Private/HMacSecret.txt") && !forceRegenerate) {
        hmacSecret = fs.readFileSync("./Data/Private/HMacSecret.txt");
    } else {
        hmacSecret = crypto.randomBytes(128);
        fs.writeFileSync("./Data/Private/HMacSecret.txt", pepper);
    }
}
async function ValidatePassword(username, password) {
    if(!pepper) throw new Error("No pepper generated");
    if(!hmacSecret) throw new Error("No hmac secret generated");
    try {        
        hashedPassword = await DB.GetUserPassword(username);
        const hmac = crypto.createHmac("sha256", hmacSecret);
        hmac.update(Buffer.from(password));
        hmac.update(Buffer.from(pepper));
        pepperedPassword = hmac.digest("ascii");

        if(hashedPassword === undefined) { // The user was not found
            // Prevent timing attack so still hash and verify
            const result = await bcrypt.compare(pepperedPassword, "$2b$10$dEPL9hQYCgl3pGA29Ev8FOLhfDWmaQJCPCGOtzhPkdos/1cvAvRlu");
            return false;
        }
        // Check the password
        const result = await bcrypt.compare(pepperedPassword, hashedPassword);
        if(!result) // Wrong password
            return false;
        return true;
    } catch(exc) {
        return false;
    }
}

async function GenerateUser(username, password) {
    if(!pepper) throw new Error("No pepper generated");
    if(!hmacSecret) throw new Error("No hmac secret generated");

    const hmac = crypto.createHmac("sha256", hmacSecret);
    hmac.update(Buffer.from(password));
    hmac.update(Buffer.from(pepper));
    pepperedPassword = hmac.digest("ascii");

    hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    if((await bcrypt.compare(pepperedPassword, hashedPassword)) == false)
        throw new Error("Help, the generated hash doesn't match the password");
    await DB.CreateUser(username, hashedPassword);
}
async function DeleteUser(username) {
    await DB.DeleteUser(username);
}

async function CreateSession(res, username) {
    var sessionID = null;
    do { sessionID = crypto.randomBytes(32).toString("ascii"); }
    while(await DB.DoesSessionIDExist(sessionID.toString("ascii")));
    sessionCredential = crypto.randomBytes(32).toString("ascii");

    await DB.CreateSession(sessionID, sessionCredential, username);

    res.cookie("sessionID", encodeURI(sessionID), { maxAge: 720000, secure: true });
    res.cookie("sessionCredential", encodeURI(sessionCredential), { maxAge: 720000, secure: true });
    res.cookie("username", encodeURI(username), { maxAge: 720000, secure: true });
}

function RemoveSessionCookies(res) {
    res.clearCookie("sessionID");
    res.clearCookie("sessionCredential");
    res.clearCookie("username");
    return false;
}
var sessionUsername = null;
var sessionUserID = null;
async function CheckSession(req, res, repeatRequired = true) {
    if(req.cookies.sessionID == undefined) return RemoveSessionCookies(res);
    if(req.cookies.sessionCredential == undefined) return RemoveSessionCookies(res);
    if(repeatRequired && req.headers["sessioncredentialrepeat"] == undefined) return RemoveSessionCookies(res);
    if(req.cookies.username == undefined) return RemoveSessionCookies();

    sessionID = decodeURI(req.cookies.sessionID);
    sessionCredential = decodeURI(req.cookies.sessionCredential);
    // For some reason when sending the sessioncredentialrepeat via the headers does the client side put an extra URI encodiing over the sessioncredential
    if(repeatRequired && sessionCredential != decodeURIComponent(req.headers["sessioncredentialrepeat"]))
        return RemoveSessionCookies(res);
    sessionUsername = decodeURI(req.cookies.username);

    session = await DB.GetSession(sessionID);

    if(session == undefined) return RemoveSessionCookies(res);
    if(session.id != sessionID) return RemoveSessionCookies(res);
    if(session.credential != sessionCredential) return RemoveSessionCookies(res);
    if(session.username != sessionUsername) return RemoveSessionCookies(res);

    sessionUsername = session.username;
    sessionUserID = session.user_ID;
    return true;
}
async function GetSessionUsername() {
    if(sessionUsername == null) {
        if(!(await CheckSession()))
            throw new Error("Can't retrieve username of user that is not logged in");
    }
    return sessionUsername;
}
async function GetSessionUserID() {
    if(sessionUserID == null) {
        if(!(await CheckSession()))
            throw new Error("Can't retrieve username of user that is not logged in");
    }
    return sessionUserID;
}
async function RemoveSession(req, res) {
    await DB.DeleteSession(req.cookies.sessionID);
    RemoveSessionCookies(res);
}


async function HasUserPermission(permissionName) {
    try {
        userData = await DB.GetUser(sessionUserID);
        return userData[permissionName];

    } catch(exc) {
        return false;
    }
}
async function GiveUserPermissions(username, modifyUsers, addFiles, modifyInspiration, modifyProjects) {
    await DB.SetUserPermissions(username, modifyUsers, addFiles, modifyInspiration, modifyProjects);
}

module.exports = {
    SetupLoginSystem,
    ValidatePassword,
    GenerateUser, DeleteUser,
    CreateSession, CheckSession, GetSessionUsername, GetSessionUserID, RemoveSession,
    HasUserPermission, GiveUserPermissions
};