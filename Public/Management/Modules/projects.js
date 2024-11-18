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
        SetStandardBottom(data);

    var left = popover.getElementsByClassName('left')[0];
    left.innerHTML = '';
    if(localStorage.getItem('project-suggestion:' + data.original_id) != undefined)
        left.appendChild(CreateVersionDiv(JSON.parse(localStorage.getItem('project-suggestion:' + data.original_id)), false));
    for(var i = 0; i < versions.length; i++) {
        if(versions[i].voting_result == null)
            versions[i].vote_value = userVoteValue;
        left.appendChild(CreateVersionDiv(versions[i], versions[i].uuid == data.uuid));
    }
}
OpenProjectPopover = OpenManagementProjectPopover;
function CreateVersionDiv(versionData, isSelected) {
    var statusClass = '';
    var statusValue = '';
    if(versionData.voting_result == false) {
        statusClass = 'denied';
        statusValue = '(afgekeurd)'
    } else if(versionData.active_version == true) {
        statusClass = 'active';
        statusValue = '(huidige)';
    }

    var innerHTML = '';
    innerHTML += '<div class="top"><p class="title">' + versionData.version_name + '</p><p class="status ' + statusClass + '">' + statusValue + '</p></div>';
    innerHTML += '<div class="bottom"><i class="fas fa-user-alt"></i><p>' + versionData.version_proposer + '</p>';
    innerHTML += '<p class="time">' + TimeToString(versionData.created_at) + '</p></div>';
    innerHTML += '<div class="description">' + versionData.version_description + '</div>';

    var div = document.createElement('div');
    div.classList.add('version');
    if(isSelected) { selectedVersionSidebar = div; div.classList.add('current'); }
    div.innerHTML = innerHTML;

    div.onclick = OnVersionClick.bind(null, versionData, div);

    return div;
}

// Remove some parts of the popover
function EditStandardPopover() {
    popover.getElementsByClassName('right')[0].innerHTML = '';

    var middle = popover.getElementsByClassName('middle')[0];
    middle.innerHTML = '<div class="top">' + middle.innerHTML + '</div><div class="bottom toolbar"></div>';

    var left = document.createElement('div');
    left.className = 'left';
    popover.appendChild(left);

    // Add a conformation popover
    var conformation = document.createElement('div');
    conformation.popover = 'true';
    conformation.id = 'project-conformation';
    conformation.innerHTML = `<div class="content">
    <h2>Weet je het zeker?</h2>
    <p id="project-conformation-message">Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden</p>
    <div class="split-window">
    <button popovertarget="project-conformation" popovertargetaction="hide" class="conformation-button" id="project-conformation-button">Doe het</button>
    <button popovertarget="project-conformation" popovertargetaction="hide" class="cancel-button" id="project-cancel-button">Annuleer</button>
    </div>
    </div>
    `;

    popover.appendChild(conformation);
}   
EditStandardPopover();


/* + ======================================================================== +
/* | Toolbars                                                                 |
/* + ========================================================================*/
function SetStandardBottom(versionData) {
    var bottom = popover.getElementsByClassName('middle')[0].getElementsByClassName('bottom')[0];

    bottom.innerHTML = '<i class="fas fa-award fa-fw"><p class="tooltip bottom">Stel als inspiratie voor</p></i><i class="fas fa-edit fa-fw"><p class="tooltip bottom">Stel aanpassing voor</p></i><i class="fas fa-trash-alt fa-fw"><p class="tooltip bottom">Stel verwijdering voor</p></i>';
    bottom.getElementsByClassName('fas fa-edit fa-fw')[0].onclick = StartEditing.bind(null, versionData, false);
}
function SetEditingBottom() {
    var bottom = popover.getElementsByClassName('middle')[0].getElementsByClassName('bottom')[0];

    bottom.innerHTML = '<i class="fas fa-plus fa-rotate-45 fa-fw"><p class="tooltip bottom">Annuleer</p></i><i class="fas fa-save fa-fw"><p class="tooltip bottom">Stel voor</p></i>';
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

/* + ======================================================================== +
/* | Versioning sidebar                                                       |
/* + ========================================================================*/
function OnVersionClick(versionData, sidebarVersion) {
    selectedVersionSidebar.classList.remove('current');
    selectedVersionSidebar = sidebarVersion;
    sidebarVersion.classList.add('current');

    if(versionData.is_suggestion != undefined) {
        OpenEditPanel(versionData);
        return;
    }

    defaultOpenProjectPopover(versionData);

    if(versionData.voting_result == null)
        SetVotingBottom(versionData.vote_value, versionData.uuid, versionData.original_id);
    else
        SetStandardBottom(versionData);
}


/* + ======================================================================== +
/* | Voting                                                                   |
/* + ========================================================================*/
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

/* + ======================================================================== +
/* | Editing button                                                           |
/* + ========================================================================*/
function OpenEditPanel(versionData) {
    defaultOpenProjectPopover(versionData);

    var popoverMiddle = document.getElementById('project-popover').getElementsByClassName('top')[0];
    popoverMiddle.getElementsByClassName('title')[0].contentEditable = 'true';
    popoverMiddle.getElementsByClassName('requestor')[0].getElementsByTagName('p')[1].contentEditable = 'true';
    popoverMiddle.getElementsByClassName('executor')[0].getElementsByTagName('p')[1].contentEditable = 'true';
    popoverMiddle.getElementsByClassName('description')[0].contentEditable = 'true';

    var websites = popoverMiddle.getElementsByClassName('website');
    for(var i = 1; i <= 3; i++) {
        var input = document.createElement('input');
        input.value = versionData['url' + i].url;
        input.type = 'text';
        input.placeholder = 'www.youtube.com';
        input.id = 'edit-url' + i;

        websites[i - 1].prepend(input);
    }

    SetEditingBottom();
}
function StartEditing(versionData, confirmed) {
    // Check if there isn't already a suggestion that should be overriden
    var suggestionExists = localStorage.getItem('project-suggestion:' + versionData.original_id) != undefined;
    if(!confirmed && suggestionExists) {
        // Create a popover to check if the user wants to override the current suggestion
        document.getElementById('project-conformation-message').innerText = 'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden';
        document.getElementById('project-conformation-button').onclick = StartEditing.bind(null, versionData, true);
        document.getElementById('project-conformation').showPopover();
        return;
    }

    // Create a deep copy
    var editedVersionData = JSON.parse(JSON.stringify(versionData));
    editedVersionData.is_suggestion = true;
    editedVersionData.active_version = 0;
    editedVersionData.voting_result = null;
    editedVersionData.version_name = 'Geef deze verandering een naam';
    editedVersionData.version_description = 'Insert uitleg hier';
    editedVersionData.version_proposer = currentUserInfo.username;
    editedVersionData.created_at = new Date();

    localStorage.setItem('project-suggestion:' + versionData.original_id, JSON.stringify(editedVersionData));

    OpenEditPanel(editedVersionData);

    var left = popover.getElementsByClassName('left')[0];
    selectedVersionSidebar.classList.remove('current');
    if(suggestionExists) left.firstElementChild.remove();
    left.prepend(CreateVersionDiv(editedVersionData, true));
}