import { Textarea } from "./inputs";

export default function IntProject({ projectData, urls=true, onClick }) {
    if(projectData == undefined) return <div className="project"></div>;
    var url1 = projectData.url1, url2 = projectData.url2, url3 = projectData.url3;
    if(typeof(url1) == 'string') url1 = JSON.parse(url1);
    if(typeof(url2) == 'string') url2 = JSON.parse(url2);
    if(typeof(url3) == 'string') url3 = JSON.parse(url3);

    return (
        <div className="project" onClick={onClick}>
            <h2 className="card-title title">{projectData.name}</h2>
            <div className="split-window">
                <div className="requestor"><p>Aangevraagd door:</p><p>{projectData.requester}</p></div>
                <div className="executor"><p>Uitgevoerd door:</p><p>{projectData.implementer}</p></div>
            </div>
            <p className="description">{projectData.description}</p>
            {
                urls && url1 ?
                <div className="urls">
                    { url1 != undefined ? <a href={url1.url}>{(new URL(url1.url)).hostname}</a> : <></> }
                    { url2 != undefined ? <a href={url2.url}>{(new URL(url2.url)).hostname}</a> : <></> }
                    { url3 != undefined ? <a href={url3.url}>{(new URL(url3.url)).hostname}</a> : <></> }
                </div>
                : <></>
            }
        </div>
    );
}
export const Project = IntProject;

export function EditableProject({ projectData, onClick, onChange }) {
    if(projectData == undefined) return <div className="project"></div>;

    return (
        <div className="project editable" onClick={onClick}>
            <input type="text" className="card-title title" placeholder="Ledkubus" defaultValue={projectData.name} onChange={(ev) => onChange('name', ev.target.value)} />
            <div className="split-window">
                <div className="requestor"><p>Aangevraagd door:</p><input type="text" placeholder="Biologie sectie" defaultValue={projectData.requester} onChange={(ev) => onChange('requester', ev.target.value)} /></div>
                <div className="executor"><p>Uitgevoerd door:</p><input type="text" placeholder="Pietje en Jan" defaultValue={projectData.implementer} onChange={(ev) => onChange('implementer', ev.target.value)}/></div>
            </div>
            <Textarea className="description" placeholder="Helemaal mooi dit, gewoon geweldig" value={projectData.description} onChange={(ev) => onChange('description', ev.target.value)} />
        </div>
    );
}