// This file is loaded after the loader.js (and the whole page is already loaded)
// This file refrences functions and variables created in index.js and loader.js:
// Variables: currentUserInfo
// Functions: FetchInfo(), ShowFaultMessage()

var websiteSettings = null;
if(currentUserInfo.modify_settings)
    websiteSettings = FetchInfo('API/Private/Settings/Get', 'GET', null, {includeCredentials: true});

async function PopulateSettingsWindow() {
    var body = document.getElementById('body');

    var window = document.createElement('div');
    window.className = 'window';
    window.id = 'settings';
    window.innerHTML = '<div class="split-window ' + (currentUserInfo.modify_settings ? 'seperator' : '') + '"><form id="settings-left"></form><form id="settings-right"></form></div>';

    body.appendChild(window);

    // User settings
    var left = document.getElementById('settings-left');
    left.onsubmit = OnSettingsSubmit.bind(null, left);
    left.innerHTML = `
        <h2>Instellingen</h2>

        <label class="inline" for="settings-username">Gebruikersnaam</label>
        <input type="text" placeholder="Pietje" value="${currentUserInfo.username}" id="settings-username">

        <label class="inline" for="settings-email">Email</label>
        <input type="text" placeholder="pietje.jan@gmail.com" value="${currentUserInfo.email}" id="settings-email">

        <label class="inline" for="settings-password">Wachtwoord</label>
        <input type="password" placeholder="Wachtwoord" value="1234" id="settings-password">
        <label class="inline" for="settings-password-repeat"></label>
        <input type="password" placeholder="Herhaal wachtwoord" id="settings-password-repeat" value="">
        <label class="inline" for="settings-previous-password"></label>
        <input type="password" placeholder="Vorige wachtwoord" id="settings-previous-password" value="">

        <input type="submit" value="Opslaan">
    `;

    // Global settings
    if(!currentUserInfo.modify_settings) return;
    var succes = false;
    [succes, websiteSettings] = await websiteSettings;

    var right = document.getElementById('settings-right');
    right.onsubmit = OnGlobalSettingsSubmit.bind(null, right);

    right.innerHTML = `
        <h2>Globale instellingen</h2>

        <p>Goedkeuring</p>
        <label class="inline" for="accept-normal-vote-points">Punten normale vote</label>
        <input type="number" placeholder="1" id="accept-normal-vote-points" value=${websiteSettings.accept.normal_vote}>

        <label class="inline" for="accept-admin-vote-points">Punten admin vote</label>
        <input type="number" placeholder="5" id="accept-admin-vote-points" value=${websiteSettings.accept.admin_vote}>

        <label class="inline" for="accept-amount-points">Punten voor oordeel</label>
        <input type="text" placeholder="6 / 50%" id="accept-amount-points" value=${websiteSettings.accept.accept_votes}>

        <p>Afkeuring</p>
        <label class="inline" for="deny-normal-vote-points">Punten normale vote</label>
        <input type="number" placeholder="1" id="deny-normal-vote-points" value=${websiteSettings.deny.normal_vote}>

        <label class="inline" for="deny-admin-vote-points">Punten admin vote</label>
        <input type="number" placeholder="5" id="deny-admin-vote-points" value=${websiteSettings.deny.admin_vote}>

        <label class="inline" for="deny-amount-points">Punten voor oordeel</label>
        <input type="text" placeholder="6 / 50%" id="deny-amount-points" value=${websiteSettings.deny.accept_votes}>

        <input type="submit" value="Opslaan">
    `;
    
}
PopulateSettingsWindow();

async function OnSettingsSubmit(form, event) {
    event.preventDefault();

    var newUsername = document.getElementById('settings-username').value;
    if(!newUsername) return ShowFaultMessage(document.getElementById('settings-username'), 'Specificeer een gebruikersnaam');
    else if(newUsername.length > 255) return ShowFaultMessage(document.getElementById('settings-username'), 'Maximale lengte is 255');
    else if(newUsername == currentUserInfo.username) newUsername = undefined;

    var newEmail = document.getElementById('settings-email').value;
    // Skip for now
    newEmail = undefined;

    var newPassword = document.getElementById('settings-password').value;
    var repeatPassword = document.getElementById('settings-password-repeat').value;
    var previousPassword = document.getElementById('settings-previous-password').value;
    if(!newPassword) return ShowFaultMessage(document.getElementById('settings-password'), 'Specificeer een wachtwoord');
    else if(newPassword.length > 255) return ShowFaultMessage(document.getElementById('settings-password'), 'Wachtwoord lengte is maximaal 255');
    else if(newPassword == '1234') newPassword = undefined;
    else if(!repeatPassword) return ShowFaultMessage(document.getElementById('settings-password-repeat'), 'Herhaal het wachtwoord');
    else if(repeatPassword != newPassword) return ShowFaultMessage(document.getElementById('settings-password-repeat'), 'Wachtwoorden moeten hetzelfde zijn');
    else if(!previousPassword) return ShowFaultMessage(document.getElementById('settings-previous-password'), 'Geef je oude wachtwoord');
    else if(previousPassword.length > 255) return ShowFaultMessage(document.getElementById('settings-previous-password'), 'Maximale lengte is 255');

    var json = {};
    if(newUsername != undefined) json.username = newUsername;
    if(newEmail != undefined) json.email = newEmail;
    if(newPassword != undefined) {
        {
            var encoder = new TextEncoder();
            var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(newPassword)));
            var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
            json.password = base64;
        }
        {
            var encoder = new TextEncoder();
            var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(previousPassword)));
            var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
            json.previousPassword = base64;
        }
    }

    if(json.username == undefined && json.email == undefined && json.password == undefined) return;

    var [result, response] = await FetchInfo('/API/Private/Self/UpdateInfo', 'PUT', JSON.stringify(json), {includeCredentials:true, jsonResponse:false});
    if(!result) {
        form.innerHTML = '<div class="center-content"><i class="fas fa-sad-tear" style="font-size:2rem;"></i></div><div class="center-content"><h2>Error bij het indienen</h2></div><div class="center-content"><p>' + response + '</p></div>';
        return;
    }

    form.innerHTML = '<div class="center-content"><i class="fas fa-smile-beam" style="font-size:2rem;"></i></div><div class="center-content"><h2>Alles is goed gegaan!</h2></div><div class="center-content"></div>';

}

function IsInteger(val) {
    try {
        var value = Number.parseInt(val);
        return value != NaN;
    } catch(err) {
        return false;
    }
}
function IsFloat(val) {
    try {
        var value = Number.parseFloat(val);
        return value != NaN;
    } catch(err) {
        return false;
    }
}

async function OnGlobalSettingsSubmit(form, event) {
    event.preventDefault();

    var acceptNormalVote = document.getElementById('accept-normal-vote-points').value;
    if(!acceptNormalVote) return ShowFaultMessage(document.getElementById('accept-normal-vote-points'), 'Specificeer getal');
    else if(!IsInteger(acceptNormalVote)) return ShowFaultMessage(document.getElementById('accept-normal-vote-points'), 'Moet getal zijn');

    var acceptAdminVote = document.getElementById('accept-admin-vote-points').value;
    if(!acceptAdminVote) return ShowFaultMessage(document.getElementById('accept-admin-vote-points'), 'Specificeer getal');
    else if(!IsInteger(acceptAdminVote)) return ShowFaultMessage(document.getElementById('accept-admin-vote-points'), 'Moet getal zijn');

    var acceptAmount = document.getElementById('accept-amount-points').value;
    if(!acceptAmount) return ShowFaultMessage(document.getElementById('accept-amount-points'), 'Specificeer getal/percentage');
    else if(!IsInteger(acceptAmount) || (acceptAmount.substr(acceptAmount.length - 1) == '%' && !IsFloat(acceptAmount.substr(0, acceptAmount.length - 1))))
        return ShowFaultMessage(document.getElementById('accept-amount-points'), 'Moet getal/percentage zijn');



    var denyNormalVote = document.getElementById('deny-normal-vote-points').value;
    if(!denyNormalVote) return ShowFaultMessage(document.getElementById('deny-normal-vote-points'), 'Specificeer getal');
    else if(!IsInteger(denyNormalVote)) return ShowFaultMessage(document.getElementById('deny-normal-vote-points'), 'Moet getal zijn');

    var denyAdminVote = document.getElementById('deny-admin-vote-points').value;
    if(!denyAdminVote) return ShowFaultMessage(document.getElementById('deny-admin-vote-points'), 'Specificeer getal');
    else if(!IsInteger(denyAdminVote)) return ShowFaultMessage(document.getElementById('deny-admin-vote-points'), 'Moet getal zijn');

    var denyAmount = document.getElementById('deny-amount-points').value;
    if(!denyAmount) return ShowFaultMessage(document.getElementById('deny-amount-points'), 'Specificeer getal/percentage');
    else if(!IsInteger(denyAmount) || (denyAmount.substr(denyAmount.length - 1) == '%' && !IsFloat(denyAmount.substr(0, denyAmount.length - 1))))
        return ShowFaultMessage(document.getElementById('deny-amount-points'), 'Moet getal/percentage zijn');

    var [result, response] = await FetchInfo('/API/Private/Settings/Set', 'PUT', JSON.stringify( {
        "acceptNormalVote": acceptNormalVote,
        "acceptAdminVote": acceptAdminVote,
        "acceptAmount": acceptAmount,

        "denyNormalVote": denyNormalVote,
        "denyAdminVote": denyAdminVote,
        "denyAmount": denyAmount
    }), {includeCredentials: true, jsonResponse: false});

    if(!result) {
        form.innerHTML = '<div class="center-content"><i class="fas fa-sad-tear" style="font-size:2rem;"></i></div><div class="center-content"><h2>Error bij het indienen</h2></div><div class="center-content"><p>' + response + '</p></div>';
        return;
    }
    form.innerHTML = '<div class="center-content"><i class="fas fa-smile-beam" style="font-size:2rem;"></i></div><div class="center-content"><h2>Alles is goed gegaan!</h2></div><div class="center-content"></div>';

}