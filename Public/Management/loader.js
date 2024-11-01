// This file is loaded after the standard page index.js
// This file refrences functions and variables created in index.js:
// Variables: loggedIn
// Functions: GeneralLoad(), FetchInfo()

var permissions = null;

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
    if(GetCookie("sessionID") == undefined || GetCookie("sessionCredential") == undefined) return;
    var [succes, response] = await FetchInfo('API/Private/Permission/GetOwn', 'GET', null, {includeCredentials:true});
    if(!succes) return;

    loggedIn = true;
    permissions = response;

    LoadScript('/Management/Settings/index.js');
    LoadStyle('/Management/Settings/index.css');

    LoadScript('/Management/Inspiration/index.js');
    LoadStyle('/Management/Inspiration/index.css');

    LoadScript('/Management/Projects/index.js');
    LoadStyle('/Management/Projects/index.css');

    LoadScript('/Management/Suggestions/index.js');
    LoadStyle('/Management/Suggestions/index.css');

    if(permissions.modifyInspirationLabels) {
        LoadScript('/Management/Labels/index.js');
        LoadStyle('/Management/Labels/index.css');
    }
    if(permissions.modifyUsers) {
        LoadScript('/Management/Users/index.js');
        LoadStyle('/Management/Users/index.css');
    }
    if(permissions.modifyFiles) {
        LoadScript('/Management/Files/index.js');
        LoadStyle('/Management/Files/index.css');
    }
    if(permissions.watchLogs) {
        LoadScript('/Management/Files/index.js');
        LoadStyle('/Management/Files/index.css');
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
    if(permissions.modifyUsers)
        sidebarBottom.innerHTML += '<i class="fas fa-users-cog fa-fw" onclick="GoToWindow(\'users\')"><p class="tooltip right">Gebruikers</p></i>';
    if(permissions.watchLogs)
        sidebarBottom.innerHTML += '<i class="fas fa-book fa-fw" onclick="GoToWindow(\'logs\')"><p class="tooltip right">Logs</p></i>';
    sidebarBottom.innerHTML += '<i class="fas fa-cog fa-fw" onclick="GoToWindow(\'settings\')"><p class="tooltip right">Instellingen</p></i>';
    sidebarBottom.innerHTML += '<i class="fas fa-sign-out-alt fa-fw" onclick="SignOut()"><p class="tooltip right">Log uit</p></i>';
}

function AfterScriptLoading() {
    GeneralLoad();
}

async function SignOut() {
    var [succes, result] = await FetchInfo('/API/Private/LogOut/', 'POST', null, { includeCredentials:true, jsonResponse:false });
    if(succes) window.location.reload();
}