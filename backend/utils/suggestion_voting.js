import * as DB from './db.js';
import * as Login from './login.js';
import * as Settings from './settings.js';
import { accessTypes, accessUrgency, AddToAccessLog, AddToAccessLogLoggedIn } from './logs.js';

// Dirty hack to overcome a circular dependency
Settings.SetCheckSuggestionVoting(async () => {
    const openSuggestions = await DB.GetAllOpenSuggestions();
    await Promise.all(openSuggestions.map(suggestion => {
        if(suggestion.type == 'project')
            return CheckProjectVotes(suggestion.uuid);
        else if(suggestion.type == 'inspiration')
            return CheckInspirationVotes(suggestion.uuid);
        else
            throw new Error('invalid suggestion type');
    }));
});

export async function VoteProject(req, uuid, value, isAdmin) {
    await DB.CreateProjectVoteOrUpdate(value, isAdmin, Login.GetSessionUserID(req), uuid);
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.voteProjectSuggestion, { uuid: uuid, vote: value, admin: isAdmin }, req);

    return await CheckProjectVotes(uuid);
}
export async function CheckProjectVotes(uuid) {
    var votes = await DB.GetProjectVotes(uuid);
    var settings = Settings.GetSettings();
    var upVotes = 0;
    var downVotes = 0;
    for(var i = 0; i < votes.length; i++) {
        if(votes[i].value == 1 && votes[i].admin_vote == true) upVotes += settings.accept.admin_vote;
        else if(votes[i].value == 1) upVotes += settings.accept.normal_vote;
        else if(votes[i].value == -1 && votes[i].admin_vote == true) downVotes += settings.deny.admin_vote;
        else if(votes[i].value == -1) downVotes += settings.deny.normal_vote;
        else throw new Error('Invalid suggestion vote in database');
    }

    if(upVotes >= settings.accept.calculated_votes) { 
        await DB.AcceptProject(uuid);
        AddToAccessLog(accessUrgency.info, accessTypes.acceptProjectSuggestion, 'System', 0, { uuid: uuid });
        return 'accepted'; 
    }
    else if(downVotes >= settings.deny.calculated_votes) { 
        await DB.DenyProject(uuid);
        AddToAccessLog(accessUrgency.info, accessTypes.denyProjectSuggestion, 'System', 0, { uuid: uuid });
        return 'denied'; 
    }
    return 'nothing';
}

export async function VoteInspiration(req, uuid, value, isAdmin) {
    await DB.CreateInspirationVoteOrUpdate(value, isAdmin, Login.GetSessionUserID(req), uuid);
    AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.voteInspirationSuggestion, { uuid: uuid, vote: value, admin: isAdmin }, req);

    return await CheckInspirationVotes(uuid);
}

export async function CheckInspirationVotes(uuid) {
    var votes = await DB.GetInspirationVotes(uuid);
    var settings = Settings.GetSettings();
    var upVotes = 0;
    var downVotes = 0;
    for(var i = 0; i < votes.length; i++) {
        if(votes[i].value == 1 && votes[i].admin_vote == true) upVotes += settings.accept.admin_vote;
        else if(votes[i].value == 1) upVotes += settings.accept.normal_vote;
        else if(votes[i].value == -1 && votes[i].admin_vote == true) downVotes += settings.deny.admin_vote;
        else if(votes[i].value == -1) downVotes += settings.deny.normal_vote;
        else throw new Error('Invalid suggestion vote in database');
    }

    if(upVotes >= settings.accept.calculated_votes) { 
        await DB.AcceptInspiration(uuid);
        AddToAccessLog(accessUrgency.info, accessTypes.acceptInspirationSuggestion, 'System', 0, { uuid: uuid });
        return 'accepted'; 
    }
    else if(downVotes >= settings.deny.calculated_votes) { 
        await DB.DenyInspiration(uuid);
        AddToAccessLog(accessUrgency.info, accessTypes.denyInspirationSuggestion, 'System', 0, { uuid: uuid });
        return 'denied';
    }
    return 'nothing';
}