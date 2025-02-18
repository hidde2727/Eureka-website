import { useState } from 'react';

import { useUserDataSus, useGlobalSettings, updatePersonalSettings, updateGlobalSettings } from '../../utils/data_fetching.jsx';

import Footer from '../../components/footer.jsx';
import { Input } from '../../components/inputs.jsx'
import Restricted from '../../components/restricted.jsx';
import { SetFormErrorMessage, FormErrorMessage } from '../../components/form_error_message.jsx';
import FormSuccesScreen from '../../components/form_succes_screen.jsx';
import { useQueryClient } from '@tanstack/react-query';
import SplitWindow from '../../components/split_window.jsx';

export default function Settings({isActive}) {
    const queryClient = useQueryClient();

    const { userData } = useUserDataSus();
    const { settings, isFetching } = useGlobalSettings(userData?.modify_settings == 1);

    const [userError, setUserError] = useState();
    const [userSuccesMessage, setUserSuccesMessage] = useState('');

    const [globalError, setGlobalError] = useState();
    const [globalSuccesMessage, setGlobalSuccesMessage] = useState('');

    if(isFetching) return;

    return (
        <div className="window" id="management-settings" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <SplitWindow minColumnWidth={600} seperator={userData['modify_settings']} >
                <form id="settings-left" onSubmit={(ev) => { OnUserSettingsSubmit(ev, userData, setUserError, setUserSuccesMessage); }}>

                    <h2>Instellingen</h2>

                    <Input type="text" placeholder="Pietje" value={userData.username} label="Gebruikersnaam" inline={true} name="settingsUsername" />
                    <Input type="text" placeholder="pietje.jan@gmail.com" value={userData.email} label="Email" inline={true} name="settingsEmail" />

                    <Input type="password" placeholder="Vorige wachtwoord" value="1234" label="Wachtwoord" inline={true} name="settingsPasswordPrevious" />
                    <Input type="password" placeholder="Nieuwe wachtwoord" value="" label="" inline={true} name="settingsPassword" />
                    <Input type="password" placeholder="Herhaal wachtwoord" value="" label="" inline={true} name="settingsPasswordRepeat" />

                    <FormErrorMessage error={userError} />
                    <FormSuccesScreen message={userSuccesMessage} error={userSuccesMessage.includes('Error')} />

                    <input type="submit" value="Opslaan" />

                </form>
                <form id="settings-right" onSubmit={(ev) => { OnGlobalSettingsSubmit(ev, setGlobalError, setGlobalSuccesMessage, queryClient); }}>
                <Restricted to="modify_settings">

                    <h2>Globale instellingen</h2>

                    <p>Goedkeuring</p>
                    <Input type="text" placeholder="1" value={settings?.accept?.normal_vote} label="Punten normale vote" inline={true} name="settingsAcceptNormalVotes" />
                    <Input type="text" placeholder="5" value={settings?.accept?.admin_vote} label="Punten admin vote" inline={true} name="settingsAcceptAdminVotes" />
                    <Input type="text" placeholder="6 / 50%" value={settings?.accept?.accept_votes} label="Punten voor oordeel" inline={true} name="settingsAccept" />

                    <p>Afkeuring</p>
                    <Input type="text" placeholder="1" value={settings?.deny?.normal_vote} label="Punten normale vote" inline={true} name="settingsDenyNormalVotes" />
                    <Input type="text" placeholder="5" value={settings?.deny?.admin_vote} label="Punten admin vote" inline={true} name="settingsDenyAdminVotes" />
                    <Input type="text" placeholder="6 / 50%" value={settings?.deny?.accept_votes} label="Punten voor oordeel" inline={true} name="settingsDeny" />

                    <FormErrorMessage error={globalError} />
                    <FormSuccesScreen message={globalSuccesMessage} error={globalSuccesMessage.includes('Error')} />

                    <input type="submit" value="Opslaan" />

                </Restricted>
                </form>
            </SplitWindow>

            <Footer />
        </div>
    );
}

async function OnUserSettingsSubmit(event, userData, setError, setSuccesMessage) {
    event.preventDefault();

    var newUsername = event.target.settingsUsername?.value;
    if(!newUsername) return SetFormErrorMessage(setError, 'Specificeer een gebruikersnaam', event.target.settingsUsername);
    else if(newUsername.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte is 255', event.target.settingsUsername);
    else if(newUsername == userData.username) newUsername = undefined;

    var newEmail = event.target.settingsEmail?.value;
    // Skip for now
    newEmail = undefined;

    var newPassword = event.target.settingsPassword.value;
    var repeatPassword = event.target.settingsPasswordRepeat.value;
    var previousPassword = event.target.settingsPasswordPrevious.value;
    if(previousPassword == '1234' || previousPassword=='') newPassword = undefined;
    else if(!newPassword) return SetFormErrorMessage(setError, 'Specificeer een wachtwoord', event.target.settingsPassword);
    else if(newPassword.length > 255) return SetFormErrorMessage(setError, 'Wachtwoord lengte is maximaal 255', event.target.settingsPassword);
    else if(!repeatPassword) return SetFormErrorMessage(setError, 'Herhaal het wachtwoord', event.target.settingsPasswordRepeat);
    else if(repeatPassword != newPassword) return SetFormErrorMessage(setError, 'Wachtwoorden moeten hetzelfde zijn', event.target.settingsPasswordRepeat);
    else if(!previousPassword) return SetFormErrorMessage(setError, 'Geef je oude wachtwoord', event.target.settingsPasswordPrevious);
    else if(previousPassword.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte is 255', event.target.settingsPasswordPrevious);

    var base64Password = undefined;
    var base64PreviousPassword = undefined;
    if(newPassword != undefined) {
        {
            var encoder = new TextEncoder();
            var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(newPassword)));
            var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
            base64Password = base64;
        }
        {
            var encoder = new TextEncoder();
            var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(previousPassword)));
            var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
            base64PreviousPassword = base64;
        }
    }

    if(newUsername == undefined && newEmail == undefined && newPassword == undefined) return;

    try {
        await updatePersonalSettings({ 
            username: newUsername, 
            email: newEmail, 
            password: base64Password, 
            previousPassword: base64PreviousPassword 
        });
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

async function OnGlobalSettingsSubmit(event, setError, setSuccesMessage, queryClient) {
    event.preventDefault();

    var acceptNormalVote = event.target.settingsAcceptNormalVotes.value;
    if(!acceptNormalVote) return SetFormErrorMessage(setError, 'Specificeer getal', event.target.settingsAcceptNormalVotes);
    else if(!IsInteger(acceptNormalVote)) return SetFormErrorMessage(setError, 'Moet getal zijn', event.target.settingsAcceptNormalVotes);

    var acceptAdminVote = event.target.settingsAcceptAdminVotes.value;
    if(!acceptAdminVote) return SetFormErrorMessage(setError, 'Specificeer getal', event.target.settingsAcceptAdminVotes);
    else if(!IsInteger(acceptAdminVote)) return SetFormErrorMessage(setError, 'Moet getal zijn', event.target.settingsAcceptAdminVotes);

    var acceptAmount = event.target.settingsAccept.value;
    if(!acceptAmount) return SetFormErrorMessage(setError, 'Specificeer getal/percentage', event.target.settingsAccept);
    else if(!IsInteger(acceptAmount) || (acceptAmount.substr(acceptAmount.length - 1) == '%' && !IsFloat(acceptAmount.substr(0, acceptAmount.length - 1))))
        return SetFormErrorMessage(setError, 'Moet getal/percentage zijn', event.target.settingsAccept);



    var denyNormalVote = event.target.settingsDenyNormalVotes.value;
    if(!denyNormalVote) return SetFormErrorMessage(setError, 'Specificeer getal', event.target.settingsDenyNormalVotes);
    else if(!IsInteger(denyNormalVote)) return SetFormErrorMessage(setError, 'Moet getal zijn', event.target.settingsDenyNormalVotes);

    var denyAdminVote = event.target.settingsDenyAdminVotes.value;
    if(!denyAdminVote) return SetFormErrorMessage(setError, 'Specificeer getal', event.target.settingsDenyAdminVotes);
    else if(!IsInteger(denyAdminVote)) return SetFormErrorMessage(setError, 'Moet getal zijn', event.target.settingsDenyAdminVotes);

    var denyAmount = event.target.settingsDeny.value;
    if(!denyAmount) return SetFormErrorMessage(setError, 'Specificeer getal/percentage', event.target.settingsAccept);
    else if(!IsInteger(denyAmount) || (denyAmount.substr(denyAmount.length - 1) == '%' && !IsFloat(denyAmount.substr(0, denyAmount.length - 1))))
        return SetFormErrorMessage(setError, 'Moet getal/percentage zijn', event.target.settingsAccept);

    try {
        await updateGlobalSettings({
            acceptNormalVote,
            acceptAdminVote,
            acceptAmount,

            denyNormalVote,
            denyAdminVote,
            denyAmount
        })
    } catch(err) {
        return setSuccesMessage('Error: ' + err.message);
    }
    setSuccesMessage('Instellingen zijn gewijzigd');
    queryClient.invalidateQueries();
}