import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Prepend, IsObjectEmpty } from '../../utils/utils.jsx';
import { setProjectVote, useProjectVersions, useProjectVoteResult, useUserData } from '../../utils/data_fetching.jsx';

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

    if(hasError) return <Popover ref={internalRef} id="project-popover" />;

    return (
        <Popover ref={internalRef} id="project-popover">
            <Left>
                <VersioningSidebar versions={versions} selectedVersionUUID={selectedVersionUUID} setSelectedVersionUUID={setSelectedVersionUUID} />
            </Left>
            <Middle>
                <MiddleTop>
                    <div className="split-window">
                        <Project projectData={versionData} urls={false} />
                        <Website data={versionData?.url1} />
                    </div>
                    <div className="split-window">
                        <Website data={versionData?.url2} />
                        <Website data={versionData?.url3} />
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

    

    /* + ======================================================================== +
    /* | Toolbar                                                                  |
    /* + ========================================================================*/
    function Toolbar({}) {
        const queryClient = useQueryClient();
        const { vote, isFetching:isFetchingP, hasError:hasErrorP } = useProjectVoteResult(versionData?.uuid, versionData?.voting_result == null);
        const { userData, isFetching:isFetchingU, hasError:hasErrorU } = useUserData();

        const [showVotingBar, setShowVotingBar] = useState();
        useEffect(() => {
            setShowVotingBar(false);
        }, [vote, versionData])

        if(isFetchingU || userData == undefined) return;

        if(versionData?.is_suggestion != undefined) {
            return (
                <>
                    <i className="fas fa-x fa-fw"><p className="tooltip bottom">Annuleer</p></i>
                    <i className="fas fa-save fa-fw"><p className="tooltip bottom">Stel voor</p></i>
                </>
            );
        } else if(versionData?.voting_result == null) {
            if(isFetchingP) return;
            // User has voted
            if(!showVotingBar && !IsObjectEmpty(vote)) {
                var isAdmin = vote.admin_vote;
                var value = vote.value;
                if(isAdmin && value == 1) {
                    return (
                        <span className="double-thumbs up selected" onClick={() => {setShowVotingBar(true)}}><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><p className="tooltip bottom">Admin ja vote</p></span>
                    );
                }
                else if(value == 1) {
                    return (
                        <i className="fas fa-thumbs-up fa-fw selected" onClick={() => {setShowVotingBar(true)}}><p className="tooltip bottom">Ja</p></i>
                    );
                }
                else if(isAdmin && value == -1) {
                    return (
                        <span className="double-thumbs down selected" onClick={() => {setShowVotingBar(true)}}><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><p className="tooltip bottom">Admin nee vote</p></span>
                    )
                }
                else if(value == -1) {
                    return (
                        <i className="fas fa-thumbs-down fa-fw selected" onClick={() => {setShowVotingBar(true)}}><p className="tooltip bottom">Nee</p></i>
                    )
                }
                return;
            }
            // User hasn't voted / wants to revote
            if(userData.admin) {
                return (
                    <>
                    <span className="double-thumbs up" onClick={() => { voteAdminAccept(versionData.uuid, versionData.original_id) }}><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><p className="tooltip bottom">Admin ja vote</p></span>
                    <i className="fas fa-thumbs-up fa-fw" onClick={() => { voteAccept(versionData.uuid, versionData.original_id) }}><p className="tooltip bottom">Ja</p></i>
                    <i className="fas fa-thumbs-down fa-fw" onClick={() => { voteDeny(versionData.uuid, versionData.original_id) }}><p className="tooltip bottom">Nee</p></i>
                    <span className="double-thumbs down" onClick={() => { voteAdminDeny(versionData.uuid, versionData.original_id) }}><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><p className="tooltip bottom">Admin nee vote</p></span>
                    </>
                );
            }
            else {
                return (
                    <>
                        <i className="fas fa-thumbs-up fa-fw" onClick={() => { voteAccept(versionData.uuid, versionData.original_id) }}></i><i className="fas fa-thumbs-down fa-fw" onClick={() => { voteDeny(versionData.uuid, versionData.original_id, setShowVotingBar) }}></i>
                    </>
                )
            }
        } else {
            return (
                <>
                    <i className="fas fa-award fa-fw"><p className="tooltip bottom">Stel als inspiratie voor</p></i>
                    <i className="fas fa-edit fa-fw" onClick={() => { openEdit() }}><p className="tooltip bottom">Stel aanpassing voor</p></i>
                    <i className="fas fa-trash-alt fa-fw"><p className="tooltip bottom">Stel verwijdering voor</p></i>
                </>
            );
        }

        /* + ======================================================================== +
        /* | Editing button                                                           |
        /* + ========================================================================*/
        function openEdit(confirmed) {
            // Check if there isn't already a suggestion that should be overriden
            var suggestionExists = localStorage.getItem('project-suggestion:' + versionData.original_id) != undefined;
            if(!confirmed && suggestionExists) {
                conformationPopover.current.open(
                    'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden',
                    () => { openEdit(true); }
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


        /* + ======================================================================== +
        /* | Voting                                                                   |
        /* + ========================================================================*/
        async function voteAdminAccept(uuid, id) {
            setProjectVote(queryClient, uuid, id, {voteValue:1, adminVote:true})
        }
        async function voteAccept(uuid, id) {
            setProjectVote(queryClient, uuid, id, {voteValue:1, adminVote:false})
        }
        async function voteAdminDeny(uuid, id) {
            setProjectVote(queryClient, uuid, id, {voteValue:-1, adminVote:true})
        }
        async function voteDeny(uuid, id) {
            setProjectVote(queryClient, uuid, id, {voteValue:-1, adminVote:false})
        }
    }

});
export default ProjectPopover;