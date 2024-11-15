const fs = require('node:fs');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');

const DB = require('./DB.js');

let pepper = null;
let hmacSecret = null;
function SetupLoginSystem(forceRegenerate = false) {
    // Make sure all the correct folders are here
    if (!fs.existsSync('./Data/')) fs.mkdirSync('./Data');
    if (!fs.existsSync('./Data/Private')) fs.mkdirSync('./Data/Private');
    // Generate the pepper
    if (fs.existsSync('./Data/Private/Pepper.txt') && !forceRegenerate) {
        pepper = fs.readFileSync('./Data/Private/Pepper.txt');
    } else {
        pepper = crypto.randomBytes(256);
        fs.writeFileSync('./Data/Private/Pepper.txt', pepper);
    }
    // Generate the hmacSecret (not sure if this is needed)
    if (fs.existsSync('./Data/Private/HMacSecret.txt') && !forceRegenerate) {
        hmacSecret = fs.readFileSync('./Data/Private/HMacSecret.txt');
    } else {
        hmacSecret = crypto.randomBytes(128);
        fs.writeFileSync('./Data/Private/HMacSecret.txt', pepper);
    }
}
async function ValidatePassword(username, password) {
    if(!pepper) throw new Error('No pepper generated');
    if(!hmacSecret) throw new Error('No hmac secret generated');
    try {
        var user = await DB.GetUserByName(username);
        var hashedPassword = '';
        try {
            hashedPassword = user.password;
        } catch(err) {}
        const hmac = crypto.createHmac('sha256', hmacSecret);
        hmac.update(Buffer.from(password));
        hmac.update(Buffer.from(pepper));
        pepperedPassword = hmac.digest('ascii');

        if(hashedPassword === undefined) { // The user was not found
            // Prevent timing attack so still hash and verify
            const result = await bcrypt.compare(pepperedPassword, '$2b$10$dEPL9hQYCgl3pGA29Ev8FOLhfDWmaQJCPCGOtzhPkdos/1cvAvRlu');
            return [false, null];
        }
        // Check the password
        const result = await bcrypt.compare(pepperedPassword, hashedPassword.toString('ascii'));
        if(!result) // Wrong password
            return [false, null];
        return [true, user['id']];
    } catch(err) {
        console.log(err.message);
        return [false, null];
    }
}

async function GenerateUser(username, password) {
    if(!pepper) throw new Error('No pepper generated');
    if(!hmacSecret) throw new Error('No hmac secret generated');
    if(await DB.DoesUsernameExist(username)) throw new Error('Username already exists');

    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(Buffer.from(password));
    hmac.update(Buffer.from(pepper));
    pepperedPassword = hmac.digest('ascii');

    hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    if((await bcrypt.compare(pepperedPassword, hashedPassword)) == false)
        throw new Error('Help, the generated hash doesn\'t match the password');
    await DB.CreateUser(username, hashedPassword);
}
async function DeleteUser(username) {
    await DB.DeleteUserWithName(username);
}

async function CreateSession(res, userID) {
    var sessionID = null;
    do { sessionID = crypto.randomBytes(32).toString('ascii'); }
    while(await DB.DoesSessionIDExist(sessionID.toString('ascii')));
    sessionCredential = crypto.randomBytes(32).toString('ascii');

    await DB.CreateSession(sessionID, sessionCredential, userID);

    res.cookie('sessionID', encodeURI(sessionID), { maxAge: 720000, secure: true });
    res.cookie('sessionCredential', encodeURI(sessionCredential), { maxAge: 720000, secure: true });
    res.cookie('userID', encodeURI(userID), { maxAge: 720000, secure: true });
}

function RemoveSessionCookies(res) {
    res.clearCookie('sessionID');
    res.clearCookie('sessionCredential');
    res.clearCookie('userID');
    return false;
}

async function CheckSession(req, res, repeatRequired = true) {
    if(req.cookies.sessionID == undefined) return RemoveSessionCookies(res);
    if(req.cookies.sessionCredential == undefined) return RemoveSessionCookies(res);
    if(repeatRequired && req.headers['sessioncredentialrepeat'] == undefined) return RemoveSessionCookies(res);
    if(req.cookies.userID == undefined) return RemoveSessionCookies();

    sessionID = decodeURI(req.cookies.sessionID);
    sessionCredential = decodeURI(req.cookies.sessionCredential);
    if(repeatRequired && sessionCredential != decodeURIComponent(req.headers['sessioncredentialrepeat']))
        return RemoveSessionCookies(res);
    var sessionUserID = decodeURI(req.cookies.userID);

    await DB.DeleteInvalidSessions();
    session = await DB.GetSession(sessionID);

    if(session == undefined) return RemoveSessionCookies(res);
    if(session.id != sessionID) return RemoveSessionCookies(res);
    if(session.credential != sessionCredential) return RemoveSessionCookies(res);
    if(session.user_ID != sessionUserID) return RemoveSessionCookies(res);

    req.user_ID = sessionUserID;

    return true;
}
async function GetSessionUsername(req) {
    if(req.username == undefined) req.username = (await DB.GetUser(GetSessionUserID(req))).username;
    return req.username;
}
function GetSessionUserID(req) {
    return req.user_ID;
}
async function RemoveSession(req, res) {
    await DB.DeleteSession(req.cookies.sessionID);
    RemoveSessionCookies(res);
}


async function HasUserPermission(req, permissionName) {
    try {
        userData = await DB.GetUser(GetSessionUserID(req));
        return userData[permissionName];

    } catch(exc) {
        return false;
    }
}
async function GiveUserPermissions(id, admin, modifyInspirationLabels, modifyUsers, modifySettings, modifyFiles, watchLogs) {
    await DB.SetUserPermissions(id, admin, modifyInspirationLabels, modifyUsers, modifySettings, modifyFiles, watchLogs);
}

async function UpdateUsername(req, username) {
    await DB.SetUserUsername(GetSessionUserID(req), username);
}

async function UpdatePassword(req, password) {
    if(!pepper) throw new Error('No pepper generated');
    if(!hmacSecret) throw new Error('No hmac secret generated');

    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(Buffer.from(password));
    hmac.update(Buffer.from(pepper));
    pepperedPassword = hmac.digest('ascii');

    hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    if((await bcrypt.compare(pepperedPassword, hashedPassword)) == false)
        throw new Error('Help, the generated hash doesn\'t match the password');
    await DB.SetUserPassword(GetSessionUserID(req), hashedPassword);
}

module.exports = {
    SetupLoginSystem,
    ValidatePassword,
    GenerateUser, DeleteUser,
    CreateSession, CheckSession, GetSessionUsername, GetSessionUserID, RemoveSession,
    HasUserPermission, GiveUserPermissions,
    UpdateUsername, UpdatePassword
};