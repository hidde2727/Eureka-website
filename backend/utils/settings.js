import fs from 'node:fs';
import * as DB from './db.js';

var settings = {
    accept: {
        'normal_vote': 1,
        'admin_vote': 2,
        'accept_votes': '3',
        'calculated_votes': 3
    },
    deny: {
        'normal_vote': 1,
        'admin_vote': 2,
        'accept_votes': '3',
        'calculated_votes': 3
    }
};

export function WriteSettingsFile() {
    fs.writeFileSync('./Data/Private/Settings.json', JSON.stringify(settings));
}

export function LoadSettings() {
    // Make sure all the correct folders are here
    if (!fs.existsSync('./Data/')) fs.mkdirSync('./Data');
    if (!fs.existsSync('./Data/Private')) fs.mkdirSync('./Data/Private');
    // Check if Settings.js exists generate if not
    if (fs.existsSync('./Data/Private/Settings.json')) {
        settings = JSON.parse(fs.readFileSync('./Data/Private/Settings.json'));
    } else {
        WriteSettingsFile();
    }
}

export function SetSettings(acceptNormalVote, acceptAdminVote, acceptAmount, denyNormalVote, denyAdminVote, denyAmount) {
    settings.accept.normal_vote = acceptNormalVote;
    settings.accept.admin_vote = acceptAdminVote;
    settings.accept.accept_votes = acceptAmount;

    settings.deny.normal_vote = denyNormalVote;
    settings.deny.admin_vote = denyAdminVote;
    settings.deny.accept_votes = denyAmount;
}

export function GetSettings() {
    return settings;
}

export async function CalculateSettingsPercentages() {
    var amountUsers = await DB.GetAmountUsers();
    var amountAdmins = await DB.GetAmountAdmins();
    var normalUsers = amountUsers - amountAdmins;

    var accept = settings.accept.accept_votes;
    if(accept.substring(accept.length - 1) == '%') {
        var percentage = Number.parseFloat(accept.substring(0, accept.length - 1));
        if(percentage == NaN) throw new Error('Invalid percentage');
        var totalVotes = normalUsers * settings.accept.normal_vote + amountAdmins * settings.accept.admin_vote;
        settings.accept.calculated_votes = Math.min(Math.max(Math.ceil(totalVotes * (percentage / 100)), 0), totalVotes);
    } else {
        settings.accept.calculated_votes = Number.parseInt(accept);
        if(settings.accept.calculated_votes == NaN) throw new Error('Invalid number');
    }

    var deny = settings.deny.accept_votes;
    if(deny.substring(deny.length - 1) == '%') {
        var percentage = Number.parseFloat(deny.substring(0, deny.length - 1));
        if(percentage == NaN) throw new Error('Invalid percentage');
        var totalVotes = normalUsers * settings.deny.normal_vote + amountAdmins * settings.deny.admin_vote;
        settings.deny.calculated_votes = Math.min(Math.max(Math.ceil(totalVotes * (percentage / 100)), 0), totalVotes);
    } else {
        settings.deny.calculated_votes = Number.parseInt(deny);
        if(settings.deny.calculated_votes == NaN) throw new Error('Invalid number');
    }

    // Dirty hack to overcome a circular dependency
    if(checkSuggestionVoting) await checkSuggestionVoting();
}

// Dirty hack to overcome a circular dependency
var checkSuggestionVoting = null;
export function SetCheckSuggestionVoting(func){
    checkSuggestionVoting = func;
}