import fs from 'node:fs/promises';
import fsSync from 'node:fs';

import Config from './config.js';
import * as DB from './db.js';
import { GetSessionUserID, GetSessionUsername } from './login.js';

const logRetentionDays = Config.logRetention!=undefined?parseFloat(Config.logRetention):14;

function ToMinLength(number, length) {
    return number.toString().padStart(length, '0');
}
function GetTimeString() {
    const currentDate = new Date();
    return ToMinLength(currentDate.getHours(), 2) + ':' + ToMinLength(currentDate.getMinutes(), 2) + ':' + ToMinLength(currentDate.getSeconds(), 2);
}
function GetDateTimeString() {
    const currentDate = new Date();
    return currentDate.getDate() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear() + '@' + ToMinLength(currentDate.getHours(), 2) + ';' + ToMinLength(currentDate.getMinutes(),2);
}
async function DeleteLogsOlderThen(maxFileAge) {
    const currentTime = (new Date).getTime();
    const logs = await fs.readdir('./logs/');
    for(const log of logs) {
        const fileInfo = await fs.stat('./logs/' + log);
        const fileAge = currentTime - fileInfo.mtime.getTime();
        if(fileAge > maxFileAge) await fs.unlink('./logs/' + log);
    }
}

let overridenLogging = false;
export async function OverrideDefaultLogging() {
    if(overridenLogging) return;
    overridenLogging = true;

    if(!fsSync.existsSync('./logs/')) await fs.mkdir('./logs/');
    await DeleteLogsOlderThen(1000*60*60*24*logRetentionDays);
    const logFile = fsSync.createWriteStream('./logs/debug.log', {flags : 'w'});
    const logFile2 = fsSync.createWriteStream('./logs/' + GetDateTimeString() + '.log');
    const oldStdout = process.stdout.write.bind(process.stdout);

    process.stdout.write = (message) => {
        logFile.write(message);
        logFile2.write(message);
        oldStdout(message);
    }

    let newConsole = {...console};
    newConsole.log = function(message) {
        process.stdout.write('[' + GetTimeString() + '] -> LOG : ' + message + '\n');
    };
    newConsole.info = function(message) {
        process.stdout.write('[' + GetTimeString() + '] -> INFO: ' + message + '\n');
    };
    newConsole.warn = function(message) {
        process.stdout.write('[' + GetTimeString() + '] -> WARN: ' + message + '\n');
    };
    newConsole.error = function(message) {
        process.stdout.write('[' + GetTimeString() + '] -> ERR : ' + message + '\n');
    };
    console = newConsole;
}

export const accessUrgency = {
    info: 1,
    warning: 2,
    error: 3
}
export const accessTypes = {
    unknown: 0,

    createUser: 101,
    modifyUser: 102,
    deleteUser: 103,

    modifySelf: 201,

    modifySettings: 301,

    createProjectSuggestion: 401,
    voteProjectSuggestion: 402,
    denyProjectSuggestion: 403,
    acceptProjectSuggestion: 404,
    deleteProjectSuggestion: 405,

    createInspirationSuggestion: 501,
    voteInspirationSuggestion: 502,
    denyInspirationSuggestion: 503,
    acceptInspirationSuggestion: 504,
    deleteInspirationSuggestion: 505,

    createFile: 601,
    renameFile: 602,
    moveFile: 603,
    deleteFile: 604,

    failedLoginAttempt: 701,
    login: 702,

    createInspirationLabel: 801,
    renameInspirationLabel: 802,
    moveInspirationLabel: 803,
    deleteInspirationLabel: 804
}
export async function AddToAccessLog(urgency, type, username, userId, jsonInfo) {
    try {
        await DB.CreateLog(urgency, type, username, userId, JSON.stringify(jsonInfo));
    } catch(err) {
        console.error(err.stack);
    }
}
export async function AddToAccessLogLoggedIn(urgency, type, jsonInfo, req) {
    await AddToAccessLog(urgency, type, await GetSessionUsername(req), GetSessionUserID(req), jsonInfo);
}