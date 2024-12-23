import { startTransition } from "react";

import { signOut } from './utils/data_fetching.jsx';

import Restricted from "./components/restricted.jsx";

export default function Sidebar(props) {
    return (
    <div id="sidebar">
        <div id="sidebar-top">
            <i className="fas fa-home fa-fw" onClick={() => { startTransition(() => { props.setWindow('home'); }); }}><p className="tooltip right">Home</p></i>
            <i className="fas fa-wrench fa-fw" onClick={() => { startTransition(() => { props.setWindow('projects'); }); }}><p className="tooltip right">Projecten</p></i>
            <i className="fas fa-lightbulb fa-fw" onClick={() => { startTransition(() => { props.setWindow('inspiration'); }); }}><p className="tooltip right">Inspiratie</p></i>
            <i className="far fa-file fa-fw" onClick={() => { startTransition(() => { props.setWindow('files'); }); }}><p className="tooltip right">Tom's&nbsp;hoekje</p></i>
            <i className="fas fa-comments fa-fw" onClick={() => { startTransition(() => { props.setWindow('suggestions'); }); }}><p className="tooltip right">Suggesties</p></i>
        </div>
        <div id="sidebar-middle">
            <Restricted>
                <i className="fas fa-sun fa-fw"><p className="tooltip right">Licht&nbsp;thema</p></i>
            </Restricted>
        </div>
        <div id="sidebar-bottom">
            <Restricted notLoggedIn={true}>
                <i className="fas fa-sun fa-fw"><p className="tooltip right">Licht&nbsp;thema</p></i>
            </Restricted>
            <Restricted>
                <i className="fas fa-thumbs-up fa-fw" onClick={() => { startTransition(() => { props.setWindow('management-suggestions'); }); }}><p className="tooltip right">Suggesties</p></i>
            </Restricted>
            <Restricted to="modify_users">
                <i className="fas fa-users-cog fa-fw" onClick={() => { startTransition(() => { props.setWindow('management-users'); }); }}><p className="tooltip right">Gebruikers</p></i>
            </Restricted>
            <Restricted to="watch_logs">
                <i className="fas fa-book fa-fw" onClick={() => { startTransition(() => { props.setWindow('management-logs'); }); }}><p className="tooltip right">Logs</p></i>
            </Restricted>
            <Restricted>
                <i className="fas fa-cog fa-fw" onClick={() => { startTransition(() => { props.setWindow('management-settings'); }); }}><p className="tooltip right">Instellingen</p></i>
                <i className="fas fa-sign-out-alt fa-fw" onClick={() => { SignOut(); }}><p className="tooltip right">Log uit</p></i>
            </Restricted>
        </div>
    </div>
    );
}

async function SignOut() {
    await signOut();
    window.location.reload();
}