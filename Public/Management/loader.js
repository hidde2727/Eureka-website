// This file is loaded after the standard page index.js
// This file refrences functions and variables created in index.js:
// Variables: loggedIn
// Functions: GeneralLoad(), FetchInfo()

var currentUserInfo = null;

var amountScriptsLoading = 0;
function LoadScript(location) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = location;
    script.defer = 'true';

    amountScriptsLoading++;
    script.onload = () => {
        amountScriptsLoading--;
        if(amountScriptsLoading == 0)
            AfterScriptLoading();
    };
    script.onerror = () => {
        amountScriptsLoading--;
        if(amountScriptsLoading == 0)
            AfterScriptLoading();
    }

    document.head.appendChild(script);
}

function LoadStyle(location) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = location;

    document.head.appendChild(link);
}

async function LoadManagementScripts() {
    if(GetCookie("sessionID") == undefined || GetCookie('sessionCredential') == undefined) return;
    var [succes, response] = await FetchInfo('API/Private/Self/Permissions', 'GET', null, {includeCredentials:true});
    if(!succes) return;

    loggedIn = true;
    currentUserInfo = response;

    LoadStyle('Management/general.css');

    LoadScript('/Management/Modules/settings.js');

    LoadScript('/Management/Modules/inspiration.js');
    LoadStyle('/Management/Modules/inspiration.css');

    LoadScript('/Management/Modules/projects.js');
    LoadStyle('/Management/Modules/projects.css');

    LoadScript('/Management/Modules/suggestions.js');
    LoadStyle('/Management/Modules/suggestions.css');

    if(currentUserInfo.modify_inspiration_labels) {
        LoadScript('/Management/Modules/labels.js');
        LoadStyle('/Management/Modules/labels.css');
    }
    if(currentUserInfo.modify_users) {
        LoadScript('/Management/Modules/users.js');
        LoadStyle('/Management/Modules/users.css');
    }
    if(currentUserInfo.modify_files) {
        LoadScript('/Management/Modules/files.js');
        LoadStyle('/Management/Modules/files.css');
    }
    if(currentUserInfo.watch_logs) {
        LoadScript('/Management/Modules/logs.js');
        LoadStyle('/Management/Modules/logs.css');
    }

    if(pageLoaded) ReorganizeSidebar();
    else addEventListener("load", ReorganizeSidebar);
}
LoadManagementScripts();

function ReorganizeSidebar() {
    var sidebarBottom = document.getElementById('sidebar-bottom');
    var themeButton = sidebarBottom.firstChild.nextSibling;
    sidebarBottom.removeChild(themeButton);
    document.getElementById('sidebar-middle').appendChild(themeButton);

    sidebarBottom.innerHTML += '<i class="fas fa-thumbs-up fa-fw" onclick="GoToWindow(\'suggestionVoting\')"><p class="tooltip right">Suggesties</p></i>';
    if(currentUserInfo.modify_users)
        sidebarBottom.innerHTML += '<i class="fas fa-users-cog fa-fw" onclick="GoToWindow(\'users\')"><p class="tooltip right">Gebruikers</p></i>';
    if(currentUserInfo.watch_logs)
        sidebarBottom.innerHTML += '<i class="fas fa-book fa-fw" onclick="GoToWindow(\'logs\')"><p class="tooltip right">Logs</p></i>';
    sidebarBottom.innerHTML += '<i class="fas fa-cog fa-fw" onclick="GoToWindow(\'settings\')"><p class="tooltip right">Instellingen</p></i>';
    sidebarBottom.innerHTML += '<i class="fas fa-sign-out-alt fa-fw" onclick="SignOut()"><p class="tooltip right">Log uit</p></i>';
}

function AfterScriptLoading() {
    // Disable the login page opening
    OnCopyrightClick = () => {};
    // Give index.js the chance to run
    GeneralLoad();
}

async function SignOut() {
    var [succes, result] = await FetchInfo('/API/Private/Self/LogOut/', 'POST', null, { includeCredentials:true, jsonResponse:false });
    if(succes) window.location.reload();
}

/* + ======================================================================== +
/* | Some nice functions for the modules                                      |
/* + ========================================================================*/
// Just don't open the editing panel outside the european timezone
function TimeToString(time) {
    var date = new Date(time);
    var now = new Date();
    var difference = (now - date) / 1000;

    var years = Math.floor(difference / 31536000);
    difference -= years * 31536000;
    var months = Math.floor(difference / 2592000);
    difference -= months * 2592000;
    var weeks = Math.floor(difference / 604800);
    difference -= weeks * 604800;
    var days = Math.floor(difference / 86400);
    difference -= days * 86400;
    var hours = Math.floor(difference / 3600);
    difference -= hours * 3600;
    var minutes = Math.floor(difference / 60);
    difference -= minutes * 60;
    var seconds = Math.floor(difference);

    if(years != 0) return years + ' jaar geleden';
    else if(months == 1) return '1 maand geleden';
    else if(months != 0) return months + ' maanden geleden';
    else if(weeks == 1) return '1 week geleden';
    else if(weeks != 0) return weeks + ' weken geleden'; 
    else if(days == 1) return '1 dag geleden';
    else if(days != 0) return days + ' dagen geleden';
    else if(hours != 0) return hours + ' uur geleden';
    else if(minutes == 1) return '1 minuut geleden'; 
    else if(minutes != 0) return minutes + ' minuten geleden';
    else if(seconds <= 1) return '1 seconde geleden';
    else return seconds + ' secondes geleden';
}