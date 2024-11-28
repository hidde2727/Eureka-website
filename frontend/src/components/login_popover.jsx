import { forwardRef, createContext, useState } from 'react';

import { FetchInfo } from '../utils/data_fetching.jsx'

import { Popover } from './popover.jsx';
import { IconedInput } from './inputs.jsx';
import { SetFormErrorMessage, FormErrorMessage } from './form_error_message.jsx';

export const LoginContext = createContext();
export const LoginPopover = forwardRef(({}, ref) => {

    const [error, setError] = useState(undefined);
    const [errorAtInput, setErrorAtInput] = useState(undefined);

    return (
        <Popover ref={ref} id="login-popover" form={true} onSubmit={ (ev) => { OnLoginAttempt(ev, { setError: setError, setErrorAtInput: setErrorAtInput }); } }>
            <IconedInput iconClass="fas fa-user-alt" type="text" placeholder="Gebruikersnaam" name="loginUsername" />
            <IconedInput iconClass="fas fa-lock" type="password" placeholder="Wachtwoord" name="loginPassword" />

            <FormErrorMessage message={error} atInput={errorAtInput} />

            <input type="submit" value="Inloggen"></input>
        </Popover>
    )
})
export default LoginPopover;

async function OnLoginAttempt(event, errorMessaging) {
    event.preventDefault();

    var username = event.target.loginUsername.value;
    if(!username) return SetFormErrorMessage(errorMessaging, 'Specificeer een naam', event.target.loginUsername);
    else if(username.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximum lengte is 255', event.target.loginUsername);
  
    var password = event.target.loginPassword.value;
    if(!password) return SetFormErrorMessage(errorMessaging, 'Specificeer een wachtwoord', event.target.loginPassword);
    else if(password.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximum lengte is 255', event.target.loginPassword);
  
    var encoder = new TextEncoder();
    var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
    var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
    
    try {
        var response = await FetchInfo('api/login/', 'POST', JSON.stringify({
        'username':username,
        'password':base64
        }), {jsonResponse: false});
    } catch(err) {
        return SetFormErrorMessage(errorMessaging, 'Fout wachtwoord of gebruikersnaam', event.target.loginUsername);
    }
  
    event.target.reset();
  
    window.location.reload();
}