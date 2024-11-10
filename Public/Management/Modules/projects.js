// This file is loaded after the loader.js (and the whole page is already loaded)
// This file refrences functions and variables created in index.js and loader.js:
// Variables: currentUserInfo, fetchCache
// Functions: FetchInfo(), OpenProjectPopover(), TimeToString()

// GetUsersVoteResult(), PopulateSuggestionWindow() and votableSuggestions from suggestions.js





// Override OpenProjectPopover()
var defaultOpenProjectPopover = OpenProjectPopover;
var popover = document.getElementById('project-popover').getElementsByClassName('content')[0];
var selectedVersionSidebar = null;
async function OpenManagementProjectPopover(data) {
    var [succes, versions] = await FetchInfo('/API/Private/Project/Versions?projectID=' + encodeURI(data.original_id), 'GET', null, {includeCredentials:true});
    if(!succes) throw new Error('Failed to get the version of project with projectID=' + data.original_id);
    data = versions.filter((value) => value.uuid === data.uuid )[0];

    defaultOpenProjectPopover(data);

    var userVoteValue = undefined;
    if(data.voting_result == null) {
        userVoteValue = GetUsersVoteValue('project', data.uuid);
        SetVotingBottom(userVoteValue, data.uuid, data.original_id);
    } else
        SetStandardBottom();

    var left = popover.getElementsByClassName('left')[0];
    left.innerHTML = '';
    for(var i = 0; i < versions.length; i++) {
        if(versions[i].voting_result == null)
            versions[i].vote_value = userVoteValue;

        var statusClass = '';
        var statusValue = '';
        if(versions[i].voting_result == false) {
            statusClass = 'denied';
            statusValue = '(afgekeurd)'
        } else if(versions[i].active_version == true) {
            statusClass = 'active';
            statusValue = '(huidige)';
        }

        var innerHTML = '';
        innerHTML += '<div class="top"><p class="title">' + versions[i].version_name + '</p><p class="status ' + statusClass + '">' + statusValue + '</p></div>';
        innerHTML += '<div class="bottom"><i class="fas fa-user-alt"></i><p>' + versions[i].version_proposer + '</p>';
        innerHTML += '<p class="time">' + TimeToString(versions[i].created_at) + '</p></div>';
        innerHTML += '<div class="description">' + versions[i].version_description + '</div>';

        var div = document.createElement('div');
        div.classList.add('version');
        if(versions[i].uuid == data.uuid) { selectedVersionSidebar = div; div.classList.add('current'); }
        div.innerHTML = innerHTML;

        div.onclick = OnVersionClick.bind(null, versions[i], div);

        left.appendChild(div);
    }
}
OpenProjectPopover = OpenManagementProjectPopover;

// Remove some parts of the popover
function EditStandardPopover() {
    popover.getElementsByClassName('right')[0].innerHTML = '';

    var middle = popover.getElementsByClassName('middle')[0];
    middle.innerHTML = '<div class="top">' + middle.innerHTML + '</div><div class="bottom toolbar"></div>';

    var left = document.createElement('div');
    left.className = 'left';
    popover.appendChild(left);
}   
EditStandardPopover();

function SetStandardBottom() {
    var bottom = popover.getElementsByClassName('middle')[0].getElementsByClassName('bottom')[0];

    bottom.innerHTML = '<i class="fas fa-award fa-fw"></i><i class="fas fa-edit fa-fw"></i><i class="fas fa-trash-alt fa-fw"></i>';
}
function SetEditingBottom() {
    var bottom = popover.getElementsByClassName('middle')[0].getElementsByClassName('bottom')[0];

    bottom.innerHTML = '<i class="fas fa-plus fa-rotate-90 fa-fw"></i><i class="fas fa-save fa-fw"></i>';
}
function SetVotingBottom(voteValue, uuid, originalID) {
    var bottom = popover.getElementsByClassName('middle')[0].getElementsByClassName('bottom')[0];

    if(voteValue != undefined && voteValue.vote_value != null) {
        var isAdmin = voteValue.admin_vote;
        var value = voteValue.vote_value;
        if(isAdmin && value == 1)
            bottom.innerHTML = `<span class="double-thumbs up selected" onclick="OnVoteClick(${uuid}, ${originalID})"><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><p class="tooltip bottom">Admin ja vote</p></span>`;
        else if(value == 1)
            bottom.innerHTML = `<i class="fas fa-thumbs-up fa-fw selected" onclick="OnVoteClick(${uuid}, ${originalID})"><p class="tooltip bottom">Ja</p>`;
        else if(isAdmin && value == -1)
            bottom.innerHTML = `<span class="double-thumbs down selected" onclick="OnVoteClick(${uuid}, ${originalID})"><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><p class="tooltip bottom">Admin nee vote</p></span>`;
        else if(value == -1)
            bottom.innerHTML = `<i class="fas fa-thumbs-down fa-fw selected" onclick="OnVoteClick(${uuid}, ${originalID})"><p class="tooltip bottom">Nee</p></i>`;
        return;
    }

    if(currentUserInfo.admin)
        bottom.innerHTML = `
    <span class="double-thumbs up" onclick="VoteAdminAccept(${uuid}, ${originalID})"><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><p class="tooltip bottom">Admin ja vote</p></span>
    <i class="fas fa-thumbs-up fa-fw" onclick="VoteAccept(${uuid}, ${originalID})"><p class="tooltip bottom">Ja</p></i><i class="fas fa-thumbs-down fa-fw" onclick="VoteDeny(${uuid}, ${originalID})"><p class="tooltip bottom">Nee</p></i>
    <span class="double-thumbs down" onclick="VoteAdminDeny(${uuid}, ${originalID})"><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><p class="tooltip bottom">Admin nee vote</p></span>
    `;
    else
        bottom.innerHTML = `<i class="fas fa-thumbs-up fa-fw" onclick="VoteAccept(${uuid}, ${originalID})"></i><i class="fas fa-thumbs-down fa-fw" onclick="VoteDeny(${uuid}, ${originalID})"></i>`;
}

function OnVersionClick(versionData, sidebarVersion) {
    selectedVersionSidebar.classList.remove('current');
    selectedVersionSidebar = sidebarVersion;
    sidebarVersion.classList.add('current');

    defaultOpenProjectPopover(versionData);

    if(versionData.voting_result == null)
        SetVotingBottom(versionData.vote_value, versionData.uuid, versionData.original_id);
    else
        SetStandardBottom();
}

async function VoteAdminAccept(uuid, projectID) {
    var [result, response] = await FetchInfo('/API/Private/Suggestion/Vote', 'PUT', JSON.stringify({
        type: 'project',
        uuid: uuid,
        voteValue: 'accept',
        adminVote: 1
    }), {includeCredentials: true});

    if(!result) throw new Error('Failed to vote');

    GetUsersVoteValue('project', uuid).vote_value = 1;
    GetUsersVoteValue('project', uuid).admin_vote = true;
    if(response.result == 'accepted') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = true;
        });
    } else if(response.result == 'denied') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = false;
        });
    }
    OpenManagementProjectPopover({uuid: uuid, original_id: projectID});
    PopulateSuggestionWindow();
}
async function VoteAccept(uuid, projectID) {
    var [result, response] = await FetchInfo('/API/Private/Suggestion/Vote', 'PUT', JSON.stringify({
        type: 'project',
        uuid: uuid,
        voteValue: 'accept',
        adminVote: 0
    }), {includeCredentials: true});
    
    if(!result) throw new Error('Failed to vote');

    GetUsersVoteValue('project', uuid).vote_value = 1;
    GetUsersVoteValue('project', uuid).admin_vote = false;
    if(response.result == 'accepted') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = true;
        });
    } else if(response.result == 'denied') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = false;
        });
    }
    OpenManagementProjectPopover({uuid: uuid, original_id: projectID});
    PopulateSuggestionWindow();
}
async function VoteAdminDeny(uuid, projectID) {
    var [result, response] = await FetchInfo('/API/Private/Suggestion/Vote', 'PUT', JSON.stringify({
        type: 'project',
        uuid: uuid,
        voteValue: 'deny',
        adminVote: 1
    }), {includeCredentials: true});
    
    if(!result) throw new Error('Failed to vote');

    GetUsersVoteValue('project', uuid).vote_value = -1;
    GetUsersVoteValue('project', uuid).admin_vote = true;
    if(response.result == 'accepted') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = true;
        });
    } else if(response.result == 'denied') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = false;
        });
    }
    OpenManagementProjectPopover({uuid: uuid, original_id: projectID});
    PopulateSuggestionWindow();
}
async function VoteDeny(uuid, projectID) {
    var [result, response] = await FetchInfo('/API/Private/Suggestion/Vote', 'PUT', JSON.stringify({
        type: 'project',
        uuid: uuid,
        voteValue: 'deny',
        adminVote: 0
    }), {includeCredentials: true});
    
    if(!result) throw new Error('Failed to vote');

    GetUsersVoteValue('project', uuid).vote_value = -1;
    GetUsersVoteValue('project', uuid).admin_vote = false;
    if(response.result == 'accepted') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = true;
        });
    } else if(response.result == 'denied') {
        fetchCache['/API/Private/Project/Versions?projectID=' + encodeURI(projectID)].forEach(version => {
            if(version.uuid != uuid) return;
            version.voteResult = false;
        });
    }
    OpenManagementProjectPopover({uuid: uuid, original_id: projectID});
    PopulateSuggestionWindow();
}

function OnVoteClick(uuid, projectID) {
    SetVotingBottom(undefined, uuid, projectID);
}