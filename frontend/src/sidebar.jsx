import { startTransition, useState } from "react";

import { signOut } from './utils/data_fetching.jsx';

import Restricted from "./components/restricted.jsx";

export default function Sidebar({ setWindow }) {
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(localStorage.getItem('default-collapse-sidebar')=='true');
    return (<>
    <div id="sidebar" className={(open?'open':'closed')+(collapsed?' collapsed':'')}>
        
        <div id="sidebar-top">
            <p className="button" onClick={() => { startTransition(() => { setWindow('home') }); setOpen(false); }} ><i className="fas fa-home fa-fw"/><p>Home</p></p>
            <p className="button" onClick={() => { startTransition(() => { setWindow('projects'); setOpen(false); }); }} ><i className="fas fa-wrench fa-fw"/><p>Projecten</p></p>
            <p className="button" onClick={() => { startTransition(() => { setWindow('inspiration'); setOpen(false); }); }} ><i className="fas fa-lightbulb fa-fw"/><p>Inspiratie</p></p>
            <p className="button" onClick={() => { startTransition(() => { setWindow('files'); }); setOpen(false); }} ><i className="far fa-file fa-fw"/><p>Tom's&nbsp;hoekje</p></p>
            <p className="button" onClick={() => { startTransition(() => { setWindow('suggestions'); setOpen(false); }); }} ><i className="fas fa-comments fa-fw"/><p>Suggesties</p></p>
        </div>
        <div id="sidebar-middle">
            <Restricted>
                <p className="button" onClick={() => {toggleColorTheme()}} ><i className="fas fa-sun fa-fw"/><p>Licht&nbsp;thema</p></p>
            </Restricted>
        </div>
        <div id="sidebar-bottom">
            <Restricted notLoggedIn={true}>
                <p className="button" onClick={() => {toggleColorTheme()}} ><i className="fas fa-sun fa-fw"/><p>Licht&nbsp;thema</p></p>
            </Restricted>
            <Restricted>
                <p className="button" onClick={() => { startTransition(() => { setWindow('management-suggestions'); setOpen(false); }); }} ><i className="fas fa-thumbs-up fa-fw"/><p>Suggesties</p></p>
            </Restricted>
            <Restricted to="modify_users">
                <p className="button" onClick={() => { startTransition(() => { setWindow('management-users'); setOpen(false); }); }} ><i className="fas fa-users-cog fa-fw"/><p>Gebruikers</p></p>
            </Restricted>
            <Restricted to="watch_logs">
                <p className="button" onClick={() => { startTransition(() => { setWindow('management-logs'); }); setOpen(false); }} ><i className="fas fa-book fa-fw"/><p>Logs</p></p>
            </Restricted>
            <Restricted>
                <p className="button" onClick={() => { startTransition(() => { setWindow('management-settings'); setOpen(false); }); }} ><i className="fas fa-cog fa-fw"/><p>Instellingen</p></p>
                <p className="button" onClick={() => { SignOut(); setOpen(false); }} ><i className="fas fa-sign-out-alt fa-fw"/><p>Log uit</p></p>
            </Restricted>
            <p className="button" onClick={() => { 
                setCollapsed(!collapsed);
                localStorage.setItem('default-collapse-sidebar', !collapsed);
            }}>
                <span className="double-chevron">
                    <i className="fas fa-chevron-right"/>
                    <i className="fas fa-chevron-right" />
                </span>
                <p>Inklappen</p>
            </p>
        </div>
    </div>
    <div id="toggle-sidebar" className={open?'open':'closed'} onClick={() => setOpen(!open)}><i className="fas fa-bars" /></div>
    </>);
}

async function SignOut() {
    await signOut();
    window.location.reload();
}
//var currentMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
var currentMode = true;
document.documentElement.classList.add(currentMode?'dark':'light');

function toggleColorTheme() {
    document.documentElement.classList.remove(currentMode?'dark':'light');
    document.documentElement.classList.add(currentMode?'light':'dark');
    currentMode = !currentMode;
}