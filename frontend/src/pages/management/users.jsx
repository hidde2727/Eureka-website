import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Footer from '../../components/footer.jsx';
import { createUser, useUsers, modifyUser, deleteUser, useUserData } from '../../utils/data_fetching.jsx';
import { Popover } from '../../components/popover.jsx';
import { Input, SliderToggle } from '../../components/inputs.jsx';
import { FormErrorMessage, SetFormErrorMessage } from '../../components/form_error_message.jsx';
import ConformationPopover from '../../popovers/conformation_popover.jsx';

import '/public/pages/users.css';

export default function Users({isActive}) {
    const { userData: currentUserData, sessionSet } = useUserData();
    const queryClient = useQueryClient();
    const { users, hasError, isFetching } = useUsers();

    const createUserPopover = useRef();
    const [creationError, setCreationError] = useState();

    const modifyUserPopover = useRef();
    const [modifyingUser, setModifyingUser] = useState();
    useEffect(() => {
        if(modifyingUser == undefined) return;
        modifyUserPopover.current.content.admin.checked = modifyingUser?.admin;
        modifyUserPopover.current.content.labels.checked = modifyingUser?.modify_inspiration_labels;
        modifyUserPopover.current.content.users.checked = modifyingUser?.modify_users;
        modifyUserPopover.current.content.settings.checked = modifyingUser?.modify_settings;
        modifyUserPopover.current.content.files.checked = modifyingUser?.modify_files;
        modifyUserPopover.current.content.logs.checked = modifyingUser?.watch_logs;
    }, [modifyingUser])

    const conformationPopover = useRef();

    if(users == undefined || hasError) return <div className="window" id="users" style={isActive ? {display: 'block'} : {display: 'none'}} />;

    return (
        <div className="window" id="users" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Users</h1>
                <div className="align-names">
                    <p></p>
                    <p>Naam</p>
                    <p>Email</p>
                    <p>Admin</p>
                    <p>Labels</p>
                    <p>Users</p>
                    <p>Settings</p>
                    <p>Files</p>
                    <p>Logs</p>
                </div>
                <div className="content">
                    {
                        users.map((user) => {
                            return (
                                <div className="user" key={user.id}>
                                    <i className="fas fa-user-alt" />
                                    <p>{ user.username }</p>
                                    <p>{ user.email }</p>
                                    <p>{ user.admin ? 'Ja' : 'Nee' }</p>
                                    <p>{ user.modify_inspiration_labels ? 'Ja' : 'Nee' }</p>
                                    <p>{ user.modify_users ? 'Ja' : 'Nee' }</p>
                                    <p>{ user.modify_settings ? 'Ja' : 'Nee' }</p>
                                    <p>{ user.modify_files ? 'Ja' : 'Nee' }</p>
                                    <p>{ user.watch_logs ? 'Ja' : 'Nee' }</p>
                                    <span className="buttons">
                                        <i className="far fa-edit" onClick={() => {
                                            setModifyingUser(user);
                                            modifyUserPopover.current.open();
                                        }} />
                                        <i className="far fa-trash-alt" onClick={() => {
                                            onUserDeletetion(user);
                                        }} />
                                    </span>
                                </div>
                            )
                        })
                    }
                    <i className="add-button fas fa-plus" onClick={() => { createUserPopover.current.open() }} />
                </div>

                <Popover className="user-creation" ref={createUserPopover} form={true} onSubmit={(ev) => { onUserCreationSubmit(ev) }}>
                    <Input type="text" label="Gebruikersnaam" placeholder="Gebruikersnaam" name="username" />
                    <Input type="password" label="Wachtwoord" placeholder="Wachtwoord" name="password"  />
                    <Input type="password" label="Herhaal wachtwoord" placeholder="Wachtwoord" name="passwordRepeat" />

                    <FormErrorMessage error={creationError} />

                    <input type="submit" value="Maak aan" />
                </Popover>
                <Popover className="user-modification" ref={modifyUserPopover} form={true} onSubmit={(ev) => { onUserModification(ev) }}>
                    <div className="header">
                        <i className="fas fa-user-alt" />
                        <p>{ modifyingUser?.username }</p>
                        <p>{ modifyingUser?.email }</p>
                    </div>
                    <SliderToggle name="admin" label="Admin" /><br />
                    <SliderToggle name="labels" label="Inspiratie labels aanpassen" /><br />
                    <SliderToggle name="users" label="Gebruikers aanpassen" /><br />
                    <SliderToggle name="settings" label="Settings aanpassen" /><br />
                    <SliderToggle name="files" label="Files aanpassen" /><br />
                    <SliderToggle name="logs" label="Logs bekijken" /><br />

                    <input type="submit" value="Opslaan" />
                </Popover>
                <ConformationPopover ref={conformationPopover} />
            </div>

            <Footer />
        </div>
    );

    async function onUserCreationSubmit(ev) {
        ev.preventDefault();

        var username = ev.target.username.value;
        if(!username) return SetFormErrorMessage(setCreationError, 'Specificeer een naam', ev.target.username);
        else if(username.length > 255) return SetFormErrorMessage(setCreationError, 'Maximale lengte 255', ev.target.username);

        var password = ev.target.password.value;
        if(!password) return SetFormErrorMessage(setCreationError, 'Specificeer een wachtwoord', ev.target.password);
        else if(password.length > 255) return SetFormErrorMessage(setCreationError, 'Maximale lengte 255', ev.target.password);

        var passwordRepeat = ev.target.passwordRepeat.value;
        if(!passwordRepeat) return SetFormErrorMessage(setCreationError, 'Specificeer een wachtwoord', ev.target.passwordRepeat);
        else if(passwordRepeat.length > 255) return SetFormErrorMessage(setCreationError, 'Maximale lengte 255', ev.target.passwordRepeat);

        if(password != passwordRepeat) return SetFormErrorMessage(setCreationError, 'Wachtwoorden moeten hetzelfde zijn', ev.target.password);

        var encoder = new TextEncoder();
        var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
        var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));
        const base64Password = base64;

        try {
            await createUser(queryClient, username, base64Password);
            ev.target.reset();
            createUserPopover.current.close();
        } catch(err) {
            return SetFormErrorMessage(setCreationError, err.message, ev.target.username);
        }

    }

    async function onUserModification(ev) {
        ev.preventDefault();
        if(currentUserData.id == modifyingUser.id) return alert('Kan niet jezelf aanpassen');
        modifyUserPopover.current.close();
        try {
            await modifyUser(queryClient, {
                id: modifyingUser.id,
                admin: ev.target.admin.checked,
                labels: ev.target.labels.checked,
                users: ev.target.users.checked,
                settings: ev.target.settings.checked,
                files: ev.target.files.checked,
                logs: ev.target.logs.checked
            });
        } catch(err) {
            alert(err.message);
        }
    }

    function onUserDeletetion(user) {
        if(currentUserData.id == user.id) return alert('Kan niet jezelf verwijderen');
        conformationPopover.current.open('Deze actie zal de gebruiker verwijderen en dit kan niet ongedaan worden', async () => {
            try {
                await deleteUser(queryClient, user.id);
            } catch(err) {
                alert(err.message);
            }
        });
    }
}