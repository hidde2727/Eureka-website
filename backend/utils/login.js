import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

import * as DB from './db.js';

var pepper = null;
var hmacSecret = null;
export function SetupLoginSystem(forceRegenerate = false) {
    // Make sure all the correct folders are here
    if (!fs.existsSync('./data/')) fs.mkdirSync('./data');
    if (!fs.existsSync('./data/private')) fs.mkdirSync('./data/private');
    // Generate the pepper
    if (fs.existsSync('./data/private/pepper.txt') && !forceRegenerate) {
        pepper = fs.readFileSync('./data/private/pepper.txt');
    } else {
        pepper = crypto.randomBytes(256);
        fs.writeFileSync('./data/private/pepper.txt', pepper);
    }
    // Generate the hmacSecret (not sure if this is needed)
    if (fs.existsSync('./data/private/hmac_secret.txt') && !forceRegenerate) {
        hmacSecret = fs.readFileSync('./data/private/hmac_secret.txt');
    } else {
        hmacSecret = crypto.randomBytes(128);
        fs.writeFileSync('./data/private/hmac_secret.txt', pepper);
    }
}
export async function ValidatePassword(username, password) {
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
        const pepperedPassword = hmac.digest('ascii');

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

export async function GenerateUser(username, password) {
    if(!pepper) throw new Error('No pepper generated');
    if(!hmacSecret) throw new Error('No hmac secret generated');
    if(await DB.DoesUsernameExist(username)) throw new Error('Username already exists');

    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(Buffer.from(password));
    hmac.update(Buffer.from(pepper));
    const pepperedPassword = hmac.digest('ascii');

    const hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    if((await bcrypt.compare(pepperedPassword, hashedPassword)) == false)
        throw new Error('Help, the generated hash doesn\'t match the password');
    await DB.CreateUser(username, hashedPassword);
}
export async function DeleteUser(username) {
    await DB.DeleteUserWithName(username);
}

export async function CreateSession(res, userID) {
    var sessionID = null;
    do { sessionID = crypto.randomBytes(32).toString('ascii'); }
    while(await DB.DoesSessionIDExist(sessionID.toString('ascii')));
    const sessionCredential = crypto.randomBytes(32).toString('ascii');

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

export async function CheckSession(req, res, repeatRequired = true) {
    if(req.cookies.sessionID == undefined) return RemoveSessionCookies(res);
    if(req.cookies.sessionCredential == undefined) return RemoveSessionCookies(res);
    if(repeatRequired && req.headers['sessioncredentialrepeat'] == undefined) return RemoveSessionCookies(res);
    if(req.cookies.userID == undefined) return RemoveSessionCookies();

    const sessionID = decodeURI(req.cookies.sessionID);
    const sessionCredential = decodeURI(req.cookies.sessionCredential);
    if(repeatRequired && sessionCredential != decodeURIComponent(req.headers['sessioncredentialrepeat']))
        return RemoveSessionCookies(res);
    var sessionUserID = decodeURI(req.cookies.userID);

    await DB.DeleteInvalidSessions();
    var session = await DB.GetSession(sessionID);

    if(session == undefined) return RemoveSessionCookies(res);
    if(session.id != sessionID) return RemoveSessionCookies(res);
    if(session.credential != sessionCredential) return RemoveSessionCookies(res);
    if(session.user_ID != sessionUserID) return RemoveSessionCookies(res);

    req.user_ID = sessionUserID;

    return true;
}
export async function GetSessionUsername(req) {
    if(req.username == undefined) req.username = (await DB.GetUser(GetSessionUserID(req))).username;
    return req.username;
}
export function GetSessionUserID(req) {
    return req.user_ID;
}
export async function RemoveSession(req, res) {
    await DB.DeleteSession(req.cookies.sessionID);
    RemoveSessionCookies(res);
}


export async function HasUserPermission(req, permissionName) {
    try {
        const userData = await DB.GetUser(GetSessionUserID(req));
        return userData[permissionName];

    } catch(exc) {
        return false;
    }
}
export async function GiveUserPermissions(id, admin, modifyInspirationLabels, modifyUsers, modifySettings, modifyFiles, watchLogs) {
    await DB.SetUserPermissions(id, admin, modifyInspirationLabels, modifyUsers, modifySettings, modifyFiles, watchLogs);
}

export async function UpdateUsername(req, username) {
    await DB.SetUserUsername(GetSessionUserID(req), username);
}

export async function UpdatePassword(req, password) {
    if(!pepper) throw new Error('No pepper generated');
    if(!hmacSecret) throw new Error('No hmac secret generated');

    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(Buffer.from(password));
    hmac.update(Buffer.from(pepper));
    const pepperedPassword = hmac.digest('ascii');

    const hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    if((await bcrypt.compare(pepperedPassword, hashedPassword)) == false)
        throw new Error('Help, the generated hash doesn\'t match the password');
    await DB.SetUserPassword(GetSessionUserID(req), hashedPassword);
}