import { useState } from 'react';

import { FetchInfo, useUserDataSus, useGlobalSettingsSus } from '../utils/data_fetching.jsx';

import Footer from '../components/footer.jsx';
import { Input } from '../components/inputs.jsx'
import Restricted from '../components/restricted.jsx';
import { SetFormErrorMessage, FormErrorMessage } from '../components/form_error_message.jsx';
import FormSuccesScreen from '../components/form_succes_screen.jsx';

export default function Settings({isActive}) {
    const { userData, isFetchingU } = useUserDataSus();
    const { settings, isFetchingS } = useGlobalSettingsSus();
    if(isFetchingU || isFetchingS) return;

    const [userErorMessage, setUserErrorMessage] = useState();
    const [userErrorInput, setUserErrorInput] = useState();
    const [userSuccesMessage, setUserSuccesMessage] = useState('');

    const [globalErorMessage, setGlobalErrorMessage] = useState();
    const [globalErrorInput, setGlobalErrorInput] = useState();
    const [globalSuccesMessage, setGlobalSuccesMessage] = useState('');

    return (
        <div className="window" id="management-settings" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div className={`split-window ${ userData['modify_settings'] ? 'seperator' : ''}`}>
                <form id="settings-left" onSubmit={(ev) => { OnUserSettingsSubmit(ev, userData, {setError: setUserErrorMessage, setErrorAtInput: setUserErrorInput}, setUserSuccesMessage); }}>

                    <h2>Instellingen</h2>

                    <Input type="text" placeholder="Pietje" value={userData.username} label="Gebruikersnaam" inline={true} name="settingsUsername" />
                    <Input type="text" placeholder="pietje.jan@gmail.com" value={userData.email} label="Email" inline={true} name="settingsEmail" />

                    <Input type="password" placeholder="Wachtwoord" value="1234" label="Wachtwoord" inline={true} name="settingsPassword" />
                    <Input type="password" placeholder="Herhaal wachtwoord" value="" label="" inline={true} name="settingsPasswordRepeat" />
                    <Input type="password" placeholder="Vorige wachtwoord" value="" label="" inline={true} name="settingsPasswordPrevious" />

                    <FormErrorMessage message={userErorMessage} atInput={userErrorInput} />
                    <FormSuccesScreen message={userSuccesMessage} error={userSuccesMessage.includes('Error')} />

                    <input type="submit" value="Opslaan" />

                </form>
                <form id="settings-right" onSubmit={(ev) => { OnGlobalSettingsSubmit(ev, {setError: setGlobalErrorMessage, setErrorAtInput: setGlobalErrorInput}, setGlobalSuccesMessage); }}>
                <Restricted to="modify_settings">

                    <h2>Globale instellingen</h2>

                    <p>Goedkeuring</p>
                    <Input type="text" placeholder="1" value={settings.accept.normal_vote} label="Punten normale vote" inline={true} name="settingsAcceptNormalVotes" />
                    <Input type="text" placeholder="5" value={settings.accept.admin_vote} label="Punten admin vote" inline={true} name="settingsAcceptAdminVotes" />
                    <Input type="text" placeholder="6 / 50%" value={settings.accept.accept_votes} label="Punten voor oordeel" inline={true} name="settingsAccept" />

                    <p>Afkeuring</p>
                    <Input type="text" placeholder="1" value={settings.deny.normal_vote} label="Punten normale vote" inline={true} name="settingsDenyNormalVotes" />
                    <Input type="text" placeholder="5" value={settings.deny.admin_vote} label="Punten admin vote" inline={true} name="settingsDenyAdminVotes" />
                    <Input type="text" placeholder="6 / 50%" value={settings.deny.accept_votes} label="Punten voor oordeel" inline={true} name="settingsDeny" />

                    <FormErrorMessage message={globalErorMessage} atInput={globalErrorInput} />
                    <FormSuccesScreen message={globalSuccesMessage} error={globalSuccesMessage.includes('Error')} />

                    <input type="submit" value="Opslaan" />

                </Restricted>
                </form>
            </div>

            <Footer />
        </div>
    );
}

async function OnUserSettingsSubmit(event, userData, errorMessaging, setSuccesMessage) {
    event.preventDefault();

    var newUsername = event.target.settingsUsername.value;
    if(!newUsername) return SetFormErrorMessage(errorMessaging, 'Specificeer een gebruikersnaam', event.target.settingsUsername);
    else if(newUsername.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte is 255', event.target.settingsUsername);
    else if(newUsername == userData.username) newUsername = undefined;

    var newEmail = event.target.settingsEmail.value;
    // Skip for now
    newEmail = undefined;

    var newPassword = event.target.settingsPassword.value;
    var repeatPassword = event.target.settingsPasswordRepeat.value;
    var previousPassword = event.target.settingsPasswordPrevious.value;
    if(!newPassword) return SetFormErrorMessage(errorMessaging, 'Specificeer een wachtwoord', event.target.settingsPassword);
    else if(newPassword.length > 255) return SetFormErrorMessage(errorMessaging, 'Wachtwoord lengte is maximaal 255', event.target.settingsPassword);
    else if(newPassword == '1234') newPassword = undefined;
    else if(!repeatPassword) return SetFormErrorMessage(errorMessaging, 'Herhaal het wachtwoord', event.target.settingsPasswordRepeat);
    else if(repeatPassword != newPassword) return SetFormErrorMessage(errorMessaging, 'Wachtwoorden moeten hetzelfde zijn', event.target.settingsPasswordRepeat);
    else if(!previousPassword) return SetFormErrorMessage(errorMessaging, 'Geef je oude wachtwoord', event.target.settingsPasswordPrevious);
    else if(previousPassword.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte is 255', event.target.settingsPasswordPrevious);

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

    try {
    var response = await FetchInfo('/api/private/self/update', 'PUT', JSON.stringify(json), {includeCredentials:true, jsonResponse:false});
    } catch(err) {
        return setSuccesMessage('Error: ' + err.message);
    }
    setSuccesMessage('Instellingen zijn gewijzigd')
}

function IsInteger(val) {
    try {
        var value = Number.parseInt(val);
        return !isNaN(value);
    } catch(err) {
        return false;
    }
}
function IsFloat(val) {
    try {
        var value = Number.parseFloat(val);
        return !isNaN(value);
    } catch(err) {
        return false;
    }
}

async function OnGlobalSettingsSubmit(event, errorMessaging, setSuccesMessage) {
    event.preventDefault();

    var acceptNormalVote = event.target.settingsAcceptNormalVotes.value;
    if(!acceptNormalVote) return SetFormErrorMessage(errorMessaging, 'Specificeer getal', event.target.settingsAcceptNormalVotes);
    else if(!IsInteger(acceptNormalVote)) return SetFormErrorMessage(errorMessaging, 'Moet getal zijn', event.target.settingsAcceptNormalVotes);

    var acceptAdminVote = event.target.settingsAcceptAdminVotes.value;
    if(!acceptAdminVote) return SetFormErrorMessage(errorMessaging, 'Specificeer getal', event.target.settingsAcceptAdminVotes);
    else if(!IsInteger(acceptAdminVote)) return SetFormErrorMessage(errorMessaging, 'Moet getal zijn', event.target.settingsAcceptAdminVotes);

    var acceptAmount = event.target.settingsAccept.value;
    if(!acceptAmount) return SetFormErrorMessage(errorMessaging, 'Specificeer getal/percentage', event.target.settingsAccept);
    else if(!IsInteger(acceptAmount) || (acceptAmount.substr(acceptAmount.length - 1) == '%' && !IsFloat(acceptAmount.substr(0, acceptAmount.length - 1))))
        return SetFormErrorMessage(errorMessaging, 'Moet getal/percentage zijn', event.target.settingsAccept);



    var denyNormalVote = event.target.settingsDenyNormalVotes.value;
    if(!denyNormalVote) return SetFormErrorMessage(errorMessaging, 'Specificeer getal', event.target.settingsDenyNormalVotes);
    else if(!IsInteger(denyNormalVote)) return SetFormErrorMessage(errorMessaging, 'Moet getal zijn', event.target.settingsDenyNormalVotes);

    var denyAdminVote = event.target.settingsDenyAdminVotes.value;
    if(!denyAdminVote) return SetFormErrorMessage(errorMessaging, 'Specificeer getal', event.target.settingsDenyAdminVotes);
    else if(!IsInteger(denyAdminVote)) return SetFormErrorMessage(errorMessaging, 'Moet getal zijn', event.target.settingsDenyAdminVotes);

    var denyAmount = event.target.settingsDeny.value;
    if(!denyAmount) return SetFormErrorMessage(errorMessaging, 'Specificeer getal/percentage', event.target.settingsAccept);
    else if(!IsInteger(denyAmount) || (denyAmount.substr(denyAmount.length - 1) == '%' && !IsFloat(denyAmount.substr(0, denyAmount.length - 1))))
        return SetFormErrorMessage(errorMessaging, 'Moet getal/percentage zijn', event.target.settingsAccept);

    try {
        var response = await FetchInfo('/api/private/settings/set', 'PUT', JSON.stringify( {
            "acceptNormalVote": acceptNormalVote,
            "acceptAdminVote": acceptAdminVote,
            "acceptAmount": acceptAmount,

            "denyNormalVote": denyNormalVote,
            "denyAdminVote": denyAdminVote,
            "denyAmount": denyAmount
        }), {includeCredentials: true, jsonResponse: false});
    } catch(err) {
        return setSuccesMessage('Error: ' + err.message);
    }
    setSuccesMessage('Instellingen zijn gewijzigd')
}