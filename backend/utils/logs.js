import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import Config from './config.js';

const logRetentionDays = Config.logRetention!=undefined?parseInt(Config.logRetention):14;

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
    const oldConsole = { ...console };

    let newConsole = {};
    newConsole.log = function(message) {
        oldConsole.log(message);
        logFile.write(GetTimeString() + ' -> LOG: ' + message + '\n');
        logFile2.write(GetTimeString() + ' -> LOG: ' + message + '\n');
    };
    newConsole.info = function(message) {
        oldConsole.info(message);
        logFile.write(GetTimeString() + ' -> INFO: ' + message + '\n');
        logFile2.write(GetTimeString() + ' -> INFO: ' + message + '\n');
    };
    newConsole.warn = function(message) {
        oldConsole.warn(message);
        logFile.write(GetTimeString() + ' -> WARNING: ' + message + '\n');
        logFile2.write(GetTimeString() + ' -> WARNING: ' + message + '\n');
    };
    newConsole.error = function(message) {
        oldConsole.error(message);
        logFile.write(GetTimeString() + ' -> ERROR: ' + message + '\n');
        logFile2.write(GetTimeString() + ' -> ERROR: ' + message + '\n');
    };
    console = newConsole;
}