import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';

import { Prepend } from '../../utils/utils.jsx';
import { useProjectVersions } from '../../utils/data_fetching.jsx';

import { Popover, Left, Middle, Right, MiddleTop, MiddleBottom } from '../../components/popover.jsx';
import Project from '../../components/project.jsx';
import Website from '../../components/website.jsx';
import VersioningSidebar from '../../components/versioning_sidebar.jsx';
import ConformationPopover from '../conformation_popover.jsx';

import '/public/components/toolbar.css';
import '/public/components/double_thumbs_up.css';

export const ProjectPopover = forwardRef(({}, ref) => {
    const internalRef = useRef();
    useImperativeHandle(ref, () => ({
        open: (projectData) => {
            setId(projectData.original_id);
            setSelectedVersionUUID(projectData.uuid);
            internalRef.current.open();
        },
        close: () => {
            internalRef.current.close();
        }
    }));

    const conformationPopover = useRef();

    const [id, setId] = useState();
    const { versions:data, isFetching, hasError } = useProjectVersions(id);
    const versions = useMemo(() => {
        if(isFetching) return undefined;
        if(localStorage.getItem('project-suggestion:' + id) != undefined)
            return Prepend(data, JSON.parse(localStorage.getItem('project-suggestion:' + id)));
        return data;
    }, [data, isFetching, localStorage.getItem('project-suggestion:' + id)]);
    const [selectedVersionUUID, setSelectedVersionUUID] = useState();
    const versionData = useMemo(() => {
        if(versions == undefined) return undefined;
        return versions.filter((version) => version.uuid === selectedVersionUUID )[0];
    }, [selectedVersionUUID, isFetching]);

    if(isFetching || hasError || versionData==undefined) return <Popover ref={internalRef} id="project-popover" />;

    return (
        <Popover ref={internalRef} id="project-popover">
            <Left>
                <VersioningSidebar versions={versions} selectedVersionUUID={selectedVersionUUID} setSelectedVersionUUID={setSelectedVersionUUID} />
            </Left>
            <Middle>
                <MiddleTop>
                    <div className="split-window">
                        <Project projectData={versionData} urls={false} />
                        <Website data={JSON.parse(versionData.url1)} />
                    </div>
                    <div className="split-window">
                        <Website data={JSON.parse(versionData.url2)} />
                        <Website data={JSON.parse(versionData.url3)} />
                    </div>
                </MiddleTop>
                <MiddleBottom className="toolbar">
                    <Toolbar versionData={versionData} setSelectedVersionUUID={setSelectedVersionUUID} conformationPopover={conformationPopover} />
                </MiddleBottom>
            </Middle>
            <Right>
                
            </Right>
            <ConformationPopover ref={conformationPopover} />
        </Popover>
    )
});
export default ProjectPopover;

/* + ======================================================================== +
/* | Toolbar                                                                  |
/* + ========================================================================*/
function Toolbar({ versionData, setSelectedVersionUUID, conformationPopover }) {
    if(versionData.is_suggestion != undefined) {
        return (
            <>
                 <i class="fas fa-x fa-fw"><p class="tooltip bottom">Annuleer</p></i>
                 <i class="fas fa-save fa-fw"><p class="tooltip bottom">Stel voor</p></i>
            </>
        );
    } else if(versionData.voting_result == null) {
        // User hasn't voted
        if(voteValue != undefined && voteValue.vote_value != null) {
            var isAdmin = voteValue.admin_vote;
            var value = voteValue.vote_value;
            if(isAdmin && value == 1) {
                return (
                    <span class="double-thumbs up selected" onclick="OnVoteClick(${uuid}, ${originalID})"><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><p class="tooltip bottom">Admin ja vote</p></span>
                );
            }
            else if(value == 1) {
                return (
                    <i class="fas fa-thumbs-up fa-fw selected" onclick="OnVoteClick(${uuid}, ${originalID})"><p class="tooltip bottom">Ja</p></i>
                );
            }
            else if(isAdmin && value == -1) {
                return (
                    <span class="double-thumbs down selected" onclick="OnVoteClick(${uuid}, ${originalID})"><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><p class="tooltip bottom">Admin nee vote</p></span>
                )
            }
            else if(value == -1) {
                return (
                    <i class="fas fa-thumbs-down fa-fw selected" onclick="OnVoteClick(${uuid}, ${originalID})"><p class="tooltip bottom">Nee</p></i>
                )
            }
            return;
        }
        // User has voted
        if(currentUserInfo.admin) {
            return (
                <>
                <span class="double-thumbs up" onclick="VoteAdminAccept(${uuid}, ${originalID})"><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><i class="fas fa-thumbs-up"></i><p class="tooltip bottom">Admin ja vote</p></span>
                <i class="fas fa-thumbs-up fa-fw" onclick="VoteAccept(${uuid}, ${originalID})"><p class="tooltip bottom">Ja</p></i><i class="fas fa-thumbs-down fa-fw" onclick="VoteDeny(${uuid}, ${originalID})"><p class="tooltip bottom">Nee</p></i>
                <span class="double-thumbs down" onclick="VoteAdminDeny(${uuid}, ${originalID})"><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><i class="fas fa-thumbs-down"></i><p class="tooltip bottom">Admin nee vote</p></span>
                </>
            );
        }
        else {
            return (
                <>
                    <i class="fas fa-thumbs-up fa-fw" onclick="VoteAccept(${uuid}, ${originalID})"></i><i class="fas fa-thumbs-down fa-fw" onclick="VoteDeny(${uuid}, ${originalID})"></i>
                </>
            )
        }
    } else {
        return (
            <>
                <i className="fas fa-award fa-fw"><p className="tooltip bottom">Stel als inspiratie voor</p></i>
                <i className="fas fa-edit fa-fw" onClick={() => { OpenEdit(versionData, setSelectedVersionUUID, conformationPopover) }}><p className="tooltip bottom">Stel aanpassing voor</p></i>
                <i className="fas fa-trash-alt fa-fw"><p className="tooltip bottom">Stel verwijdering voor</p></i>
            </>
        );
    }
}

/* + ======================================================================== +
/* | Editing button                                                           |
/* + ========================================================================*/
function OpenEdit(versionData, setSelectedVersionUUID, conformationPopover, confirmed) {
    // Check if there isn't already a suggestion that should be overriden
    var suggestionExists = localStorage.getItem('project-suggestion:' + versionData.original_id) != undefined;
    if(!confirmed && suggestionExists) {
        conformationPopover.current.open(
            'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden',
            () => { OpenEdit(versionData, setSelectedVersionUUID, undefined, true); }
        )
        return;
    }

    // Create a deep copy
    var editedVersionData = JSON.parse(JSON.stringify(versionData));
    editedVersionData.uuid = 0;
    editedVersionData.is_suggestion = true;
    editedVersionData.active_version = 0;
    editedVersionData.voting_result = null;
    editedVersionData.version_name = 'Geef deze verandering een naam';
    editedVersionData.version_description = 'Insert uitleg hier';
    editedVersionData.version_proposer = '<insert huidige gebruikersnaam>';
    editedVersionData.created_at = new Date();

    localStorage.setItem('project-suggestion:' + versionData.original_id, JSON.stringify(editedVersionData));

    setSelectedVersionUUID(0);
}