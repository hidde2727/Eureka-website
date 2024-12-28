import { startTransition, useState } from "react";

import { signOut } from './utils/data_fetching.jsx';

import Restricted from "./components/restricted.jsx";

export default function Sidebar({ setWindow }) {
    const [open, setOpen] = useState(false);
    return (<>
    <div id="sidebar" className={open?'open':'closed'}>
        
        <div id="sidebar-top">
            <i className="fas fa-home fa-fw" onClick={() => { startTransition(() => { setWindow('home') }); setOpen(false); }}><p className="tooltip right">Home</p></i>
            <i className="fas fa-wrench fa-fw" onClick={() => { startTransition(() => { setWindow('projects'); setOpen(false); }); }}><p className="tooltip right">Projecten</p></i>
            <i className="fas fa-lightbulb fa-fw" onClick={() => { startTransition(() => { setWindow('inspiration'); setOpen(false); }); }}><p className="tooltip right">Inspiratie</p></i>
            <i className="far fa-file fa-fw" onClick={() => { startTransition(() => { setWindow('files'); }); setOpen(false); }}><p className="tooltip right">Tom's&nbsp;hoekje</p></i>
            <i className="fas fa-comments fa-fw" onClick={() => { startTransition(() => { setWindow('suggestions'); setOpen(false); }); }}><p className="tooltip right">Suggesties</p></i>
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
                <i className="fas fa-thumbs-up fa-fw" onClick={() => { startTransition(() => { setWindow('management-suggestions'); setOpen(false); }); }}><p className="tooltip right">Suggesties</p></i>
            </Restricted>
            <Restricted to="modify_users">
                <i className="fas fa-users-cog fa-fw" onClick={() => { startTransition(() => { setWindow('management-users'); setOpen(false); }); }}><p className="tooltip right">Gebruikers</p></i>
            </Restricted>
            <Restricted to="watch_logs">
                <i className="fas fa-book fa-fw" onClick={() => { startTransition(() => { setWindow('management-logs'); }); setOpen(false); }}><p className="tooltip right">Logs</p></i>
            </Restricted>
            <Restricted>
                <i className="fas fa-cog fa-fw" onClick={() => { startTransition(() => { setWindow('management-settings'); setOpen(false); }); }}><p className="tooltip right">Instellingen</p></i>
                <i className="fas fa-sign-out-alt fa-fw" onClick={() => { SignOut(); setOpen(false); }}><p className="tooltip right">Log uit</p></i>
            </Restricted>
        </div>
    </div>
    <div id="toggle-sidebar" className={open?'open':'closed'} onClick={() => setOpen(!open)}><i className="fas fa-bars" /></div>
    </>);
}

async function SignOut() {
    await signOut();
    window.location.reload();
}