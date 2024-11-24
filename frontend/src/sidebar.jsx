import { startTransition } from "react";

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
        </div>
        <div id="sidebar-bottom">
            <i className="fas fa-sun fa-fw"><p className="tooltip right">Licht&nbsp;thema</p></i>
        </div>
    </div>
    );
}