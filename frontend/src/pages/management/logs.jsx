import { useState } from 'react';
import Footer from '../../components/footer.jsx';
import { Select } from '../../components/inputs.jsx';
import Pagination from '../../components/pagination.jsx';

import { useLogs, useUsers } from '../../utils/data_fetching.jsx';

import '/public/pages/logs.css';

export const accessUrgency = {
    'Info': 1,
    'Warning': 2,
    'Error': 3
}
export const accessTypes = {
    'Unknown': 0,

    'Add user': 101,
    'Modify user': 102,
    'Delete user': 103,

    'Modify self': 201,

    'Modify settings': 301,

    'Create project': 401,
    'Vote project': 402,
    'Deny project': 403,
    'Accept project': 404,
    'Delete project': 405,

    'Create inspiration': 501,
    'Vote inspiration': 502,
    'Deny inspiration': 503,
    'Accept inspiration': 504,
    'Delete inspiration': 505,

    'Create file': 601,
    'Rename file': 602,
    'Move file': 603,
    'Delete file': 604,

    'Failed login': 701,
    'Login': 702,

    'Create label': 801,
    'Rename label': 802,
    'Move label': 803,
    'Delete label': 804
}
function toMinLength(number, length) {
    return number.toString().padStart(length, '0');
}
function toTimeString(time) {
    let date = new Date(time);
    date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000))
    return date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear() + ' ' + toMinLength(date.getHours(), 2) + ':' + toMinLength(date.getMinutes(), 2);
}

export default function Logs({isActive}) {
    const { users } = useUsers();

    const [urgency, setUrgency] = useState(undefined);
    const [type, setType] = useState(undefined);
    const [user, setUser] = useState(undefined);
    const [windowSize, setWindowSize] = useState(25);
    const [cursor, setCursor] = useState(0);
    const {logs,amountPages} = useLogs(cursor, windowSize, urgency, type, user);

    return (
        <div className="window" id="management-logs" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Logs</h1>
                <Pagination 
                    columns={['', 'Type', 'Tijd', 'Gebruiker', 'Omschrijving']}
                    amountPages={amountPages}
                    currentPage={Math.floor(cursor/windowSize) + 1}
                    setPage={(page) => { setCursor((page - 1)*windowSize) }}
                    header={<>
                        <Select 
                            items={['Alle levels', ...Object.keys(accessUrgency)]} 
                            defaultActive="Alle levels" 
                            onChange={ (selected) => { 
                                if(selected == 'Alle levels') setUrgency(undefined);
                                else setUrgency(accessUrgency[selected]);
                            } } 
                        />
                        <Select 
                            items={['Alle soorten', ...Object.keys(accessTypes)]} 
                            defaultActive="Alle soorten" 
                            onChange={ (selected) => { 
                                if(selected == 'Alle soorten') setType(undefined);
                                else setType(accessTypes[selected]);
                            } } 
                        />
                        <Select 
                            items={['Alle gebruikers', 'Unknown', 'System', ...(users ?? []).map((user) => user.username)]} 
                            defaultActive="Alle gebruikers" 
                            onChange={ (selected) => { 
                                if(selected == 'Unknown') setUser(null);
                                else if(selected == 'System') setUser(0);
                                else if(selected == 'Alle gebruikers') setUser(undefined);
                                else setUser(users.find((user) => user.username==selected).id);
                            } } 
                        />
                        <Select 
                            items={['10 items per pagina', '25 items per pagina', '50 items per pagina']} 
                            defaultActive="25 items per pagina" 
                            onChange={ (selected) => { setWindowSize(parseInt(selected)) } } 
                        />
                    </>}
                >
                    {
                        (logs ?? []).map((log) => {
                            let icon = <><i className="fas fa-info-circle" /><p>Info</p></>
                            if(log.urgency == accessUrgency.Warning) icon = <><i className="fa fa-warning" /><p>Warning</p></>
                            if(log.urgency == accessUrgency.Error) icon = <><i className="fa fa-warning error" /><p>Error</p></>
                            return (
                            <div className="log" key={log.id}>
                                {icon}
                                <p className="time">{toTimeString(log.time)}</p>
                                <p className="username">{log.username}</p>
                                <p>{getDescription(log)}</p>
                            </div>)
                        })
                    }
                </Pagination>
            </div>
            <Footer />
        </div>
    );
    function getDescription(log) {
        const extraInfo = JSON.parse(log.extra_info);
        if(log.type == accessTypes['Unknown']) return log.message;

        if(log.type == accessTypes['Add user'] && log.urgency==accessUrgency.Error) return `Error tijdens het toevoegen van een nieuwe gebruiker`;
        if(log.type == accessTypes['Add user']) return `Gebruiker met de naam ${extraInfo.username} toegevoegd`;
        if(log.type == accessTypes['Modify user'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanpassen van gebruiker ${(users ?? []).find((user) => user.id == extraInfo.id)?.username} (id: ${extraInfo.id})`;
        if(log.type == accessTypes['Modify user']) return `Gebruiker ${(users ?? []).find((user) => user.id == extraInfo.id)?.username} (id: ${extraInfo.id}) aangepast`;
        if(log.type == accessTypes['Delete user'] && log.urgency==accessUrgency.Error) return `Error tijdens het verwijderen van gebruiker ${(users ?? []).find((user) => user.id == extraInfo.id)?.username} (id: ${extraInfo.id})`;
        if(log.type == accessTypes['Delete user']) return `Gebruiker ${(users ?? []).find((user) => user.id == extraInfo.id)?.username} (id: ${extraInfo.id}) verwijdert`;

        if(log.type == accessTypes['Modify self'] && log.urgency==accessUrgency.Error) return `Error tijdens aanpassen eigen instellingen`;
        if(log.type == accessTypes['Modify self']) return `Informatie over zichzelf aangepast ${extraInfo.newPassword?'inclusief zijn wachtwoord':'exclusief zijn wacthwoord'}`;
        if(log.type == accessTypes['Modify settings'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanpassen van de algemene settings`;
        if(log.type == accessTypes['Modify settings']) return `Algemene settings aangepast`;

        if(log.type == accessTypes['Create project'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanmaken van een project`;
        if(log.type == accessTypes['Create project']) return `Project aangemaakt`;
        if(log.type == accessTypes['Vote project'] && log.urgency==accessUrgency.Error) return `Error tijdens het stemmen op een project`;
        if(log.type == accessTypes['Vote project']) return `Gestemd op een project`;
        if(log.type == accessTypes['Deny project'] && log.urgency==accessUrgency.Error) return `Error tijdens het afwijzen van een project`;
        if(log.type == accessTypes['Deny project']) return `Project suggestie afgewezen`;
        if(log.type == accessTypes['Accept project'] && log.urgency==accessUrgency.Error) return `Error tijdens het goedkeuren van een project`;
        if(log.type == accessTypes['Accept project']) return `Project suggestie geaccepteerd`;
        if(log.type == accessTypes['Delete project'] && log.urgency==accessUrgency.Error) return `Error tijdens het verwijderen van een project`;
        if(log.type == accessTypes['Delete project']) return `Project verwijdert`;

        if(log.type == accessTypes['Create inspiration'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanmaken van inspiratie`;
        if(log.type == accessTypes['Create inspiration']) return `Inspiratie aangemaakt`;
        if(log.type == accessTypes['Vote inspiration'] && log.urgency==accessUrgency.Error) return `Error tijdens het stemmen op inspiratie`
        if(log.type == accessTypes['Vote inspiration']) return `Gestemd op inspiratie`;
        if(log.type == accessTypes['Deny inspiration'] && log.urgency==accessUrgency.Error) return `Error tijdens het afwijzen van inspiratie`;
        if(log.type == accessTypes['Deny inspiration']) return `Inspiratie suggestie afgewezen`;
        if(log.type == accessTypes['Accept inspiration'] && log.urgency==accessUrgency.Error) return `Error tijdens het goedkeuren van inspiratie`;
        if(log.type == accessTypes['Accept inspiration']) return `Inspiratie goedgekeurd`;
        if(log.type == accessTypes['Delete inspiration'] && log.urgency==accessUrgency.Error) return `Error tijdens het verwijderen van inspiratie`;
        if(log.type == accessTypes['Delete inspiration']) return `Inspiratie verwijdert`;

        if(log.type == accessTypes['Create file'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanmaken van een file`;
        if(log.type == accessTypes['Create file']) return `File aangemaakt`;
        if(log.type == accessTypes['Rename file'] && log.urgency==accessUrgency.Error) return `Error tijdens het veranderen van een file zijn naam`;
        if(log.type == accessTypes['Rename file']) return `File van naam verandert`;
        if(log.type == accessTypes['Move file'] && log.urgency==accessUrgency.Error) return `Error tijdens het verplaatsen van een file verplaatst`;
        if(log.type == accessTypes['Move file']) return `File verplaatst`;
        if(log.type == accessTypes['Delete file'] && log.urgency==accessUrgency.Error) return `Error tijdens het verwijderen van een file verwijdert`;
        if(log.type == accessTypes['Delete file']) return `File verwijdert`;

        if(log.type == accessTypes['Failed login'] && log.urgency==accessUrgency.Error) return `Error tijdens een inlog poging`;
        if(log.type == accessTypes['Failed login']) return `Mislukte inlog poging van ip: ${extraInfo.ip}`;
        if(log.type == accessTypes['Login'] && log.urgency==accessUrgency.Error) return `Error tijdens het inloggen`;
        if(log.type == accessTypes['Login']) return `Login op ip: ${extraInfo.ip}`;

        if(log.type == accessTypes['Create label'] && log.urgency==accessUrgency.Error) return `Error tijdens het aanmaken van een label`;
        if(log.type == accessTypes['Create label']) return `Label aangemaakt`;
        if(log.type == accessTypes['Rename label'] && log.urgency==accessUrgency.Error) return `Error tijdens het veranderen van een label zijn naam`;
        if(log.type == accessTypes['Rename label']) return `Label van naam verandert`;
        if(log.type == accessTypes['Move label'] && log.urgency==accessUrgency.Error) return `Error tijdens het verplaatsen van een label`;
        if(log.type == accessTypes['Move label']) return `Label verplaatst`;
        if(log.type == accessTypes['Delete label'] && log.urgency==accessUrgency.Error) return `Error tijdens het verwijderen van een label`;
        if(log.type == accessTypes['Delete label']) return `Label verwijdert`;
    }
}