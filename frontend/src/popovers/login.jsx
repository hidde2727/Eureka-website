import { forwardRef, useState } from 'react';

import { attemptLogin } from '../utils/data_fetching.jsx'

import { Popover } from '../components/popover.jsx';
import { IconedInput } from '../components/inputs.jsx';
import { SetFormErrorMessage, FormErrorMessage } from '../components/form_error_message.jsx';

export const LoginPopover = forwardRef(({}, ref) => {

    const [error, setError] = useState(undefined);

    return (
        <Popover ref={ref} id="login-popover" form={true} onSubmit={ (ev) => { OnLoginAttempt(ev, setError); } }>
            <IconedInput iconClass="fas fa-user-alt" type="text" placeholder="Gebruikersnaam" name="loginUsername" />
            <IconedInput iconClass="fas fa-lock" type="password" placeholder="Wachtwoord" name="loginPassword" />

            <FormErrorMessage error={error} />

            <input type="submit" value="Inloggen"></input>
        </Popover>
    )
})
export default LoginPopover;

async function OnLoginAttempt(event, setError) {
    event.preventDefault();

    var username = event.target.loginUsername.value;
    if(!username) return SetFormErrorMessage(setError, 'Specificeer een naam', event.target.loginUsername);
    else if(username.length > 255) return SetFormErrorMessage(setError, 'Maximum lengte is 255', event.target.loginUsername);
  
    var password = event.target.loginPassword.value;
    if(!password) return SetFormErrorMessage(setError, 'Specificeer een wachtwoord', event.target.loginPassword);
    else if(password.length > 255) return SetFormErrorMessage(setError, 'Maximum lengte is 255', event.target.loginPassword);
  
    var encoder = new TextEncoder();
    var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
    var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
    
    try {
        await attemptLogin({ username: username, password: base64 });
    } catch(err) {
        return SetFormErrorMessage(setError, 'Fout wachtwoord of gebruikersnaam', event.target.loginUsername);
    }
  
    event.target.reset();
  
    window.location.reload();
}