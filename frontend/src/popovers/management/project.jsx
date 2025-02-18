import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Prepend, IsObjectEmpty } from '../../utils/utils.jsx';
import { setProjectVote, useProjectVersions, useProjectVoteResult, useUserData, suggestProjectChange } from '../../utils/data_fetching.jsx';

import { Popover, Left, Middle, Right, MiddleTop, MiddleBottom } from '../../components/popover.jsx';
import { Project, EditableProject } from '../../components/project.jsx';
import Website from '../../components/website.jsx';
import VersioningSidebar from '../../components/versioning_sidebar.jsx';
import ConformationPopover from '../conformation_popover.jsx';
import { Input, Textarea } from '../../components/inputs.jsx';
import { FormErrorMessage } from '../../components/form_error_message.jsx';

import '/public/components/toolbar.css';
import '/public/components/double_thumbs_up.css';
import '/public/popovers/projects.css'


export const ProjectPopover = forwardRef(({}, ref) => {
    const queryClient = useQueryClient();

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
    const submitSuggestionPopover = useRef();
    const [submitSuggestionError, setSubmitSuggestionError] = useState();
    const [forceUpdate, setForceUpdate] = useState(false);

    const [id, setId] = useState();
    const { versions:data, isFetching, hasError } = useProjectVersions(id);
    const versions = useMemo(() => {
        if(isFetching) return undefined;
        if(localStorage.getItem('project-suggestion-' + id) != undefined)
            return Prepend(data, JSON.parse(localStorage.getItem('project-suggestion-' + id)));
        return data;
    }, [data, isFetching, localStorage.getItem('project-suggestion-' + id)]);
    const [selectedVersionUUID, setSelectedVersionUUID] = useState();
    const selectedVersion = useMemo(() => {
        if(versions == undefined) return undefined;
        return versions
        .filter((version) => version.uuid === selectedVersionUUID )
        .map((version) => {
            if(version.is_suggestion) return version;
            return {...version, 
                url1: JSON.parse(version.url1), 
                url2: JSON.parse(version.url2), 
                url3: JSON.parse(version.url3)
            }
        })[0];
    }, [selectedVersionUUID, versions]);

    if(hasError) return <Popover ref={internalRef} id="project-popover" />;

    const editing = selectedVersion?.is_suggestion;

    return (
        <Popover ref={internalRef} id="project-popover">
            <Left>
                <VersioningSidebar versions={versions} selectedVersionUUID={selectedVersionUUID} setSelectedVersionUUID={setSelectedVersionUUID} />
            </Left>
            <Middle>
                <MiddleTop>
                    <div className="split-window">
                        { editing ? 
                        <EditableProject projectData={selectedVersion} onChange={(name, newValue) => {
                            selectedVersion[name] = newValue;
                            localStorage.setItem('project-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                            setForceUpdate(!forceUpdate);
                        }} />
                        :
                        <Project projectData={selectedVersion} urls={false} /> 
                        }
                        <div className="center-content"><EditableWebsite partialName="url1" /></div>
                    </div>
                    <div className="split-window">
                        <div className="center-content"><EditableWebsite partialName="url2" /></div>
                        <div className="center-content"><EditableWebsite partialName="url3" /></div>
                    </div>
                </MiddleTop>
                <MiddleBottom className="toolbar">
                    <Toolbar versionData={selectedVersion} setSelectedVersionUUID={setSelectedVersionUUID} conformationPopover={conformationPopover} />
                </MiddleBottom>
            </Middle>
            <Right>
                
            </Right>
            <ConformationPopover ref={conformationPopover} />

            <Popover className="inspiration-suggestion-popover" ref={submitSuggestionPopover} form={true} onSubmit={async (ev) => {
                ev.preventDefault();

                if (!ev.target.suggestionName.value) return SetFormErrorMessage(setSubmitSuggestionError, 'Specificeer een naam', ev.target.suggestionName);
                if (ev.target.suggestionName.value.length > 255) return SetFormErrorMessage(setSubmitSuggestionError, 'Maximale lengte is 255 karakters', ev.target.suggestionName);

                if (!ev.target.suggestionDescription.value) return SetFormErrorMessage(setSubmitSuggestionError, 'Specificeer een omschrijving', ev.target.suggestionDescription);
                if (ev.target.suggestionDescription.value.length > 65535) return SetFormErrorMessage(setSubmitSuggestionError, 'Maximale lengte is 65535 karakters', ev.target.suggestionDescription);

                let urls = [];
                if(selectedVersion.url1 != '' && selectedVersion.url1 != null) urls.push(selectedVersion.url1.url);
                if(selectedVersion.url2 != '' && selectedVersion.url2 != null) urls.push(selectedVersion.url2.url);
                if(selectedVersion.url3 != '' && selectedVersion.url3 != null) urls.push(selectedVersion.url3.url);

                try {
                    const insertedUUID = await suggestProjectChange(queryClient, {
                        name: selectedVersion.name, 
                        description: selectedVersion.description, 
                        links: urls,
                        suggestorName: selectedVersion.requester, 
                        implementerName: selectedVersion.implementer, 
                        versionName: ev.target.suggestionName.value,
                        versionDescription: ev.target.suggestionDescription.value,
                        originalID: selectedVersion.original_id
                    });

                    localStorage.removeItem('project-suggestion-' + selectedVersion.original_id);
                    ev.target.reset();
                    submitSuggestionPopover.current.close();
                    setSelectedVersionUUID(parseInt(insertedUUID));
                } catch(err) {
                    alert(err.message);
                }
            }}>
                <Input label="Suggestie naam" placeholder="URL aangepast" name="suggestionName" />
                <Textarea label="Suggestie omschrijving" placeholder="URL van een suggestie aangepast aangezien de video niet meer de recentste versie was" name="suggestionDescription" />
                <input type="submit" value="Suggereer de aanpassingen" />

                <FormErrorMessage error={submitSuggestionError} />
            </Popover>
        </Popover>
    )

    /* + ======================================================================== +
    /* | EditableWebsite                                                          |
    /* + ========================================================================*/
    function EditableWebsite({ partialName }) {
        const websiteData = selectedVersion==undefined? undefined:selectedVersion[partialName];
        return (
            <>
                {editing && <input placeholder="youtube.com" defaultValue={websiteData?.url} onChange={(ev) => {
                    selectedVersion[partialName] = { url: ev.target.value };
                    localStorage.setItem('project-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                    setForceUpdate(!forceUpdate);
                }} />}
                <Website
                    data={(editing && websiteData?.type == undefined) ? undefined : websiteData}
                    url={(editing && websiteData?.type == undefined) ? websiteData?.url : undefined}
                    onDataLoad={(data) => {
                        if (!editing) return;
                        selectedVersion[partialName] = data;
                        localStorage.setItem('project-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                    }}
                />
            </>
        )
    }
    

    /* + ======================================================================== +
    /* | Toolbar                                                                  |
    /* + ========================================================================*/
    function Toolbar({}) {
        const queryClient = useQueryClient();
        const { vote, isFetching:isFetchingP, hasError:hasErrorP } = useProjectVoteResult(selectedVersion?.uuid, selectedVersion?.voting_result == null);
        const { userData, isFetching:isFetchingU, hasError:hasErrorU } = useUserData();

        const [showVotingBar, setShowVotingBar] = useState();
        useEffect(() => {
            setShowVotingBar(false);
        }, [vote, selectedVersion])

        if(isFetchingU || userData == undefined) return;

        if(selectedVersion?.is_suggestion != undefined) {
            return (
                <>
                    <i className="fas fa-trash-alt fa-fw" onClick={() => {
                        conformationPopover.current.open(
                            'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden',
                            () => { 
                                localStorage.removeItem('project-suggestion-' + selectedVersion.original_id); 
                                setSelectedVersionUUID(versions[1].uuid) 
                            }
                        )
                    }}><p className="tooltip bottom">Verwijder suggestie</p></i>
                    <i className="far fa-paper-plane fa-fw" onClick={() => {
                        submitSuggestionPopover.current.open();
                    }}><p className="tooltip bottom">Stel voor</p></i>
                </>
            );
        } else if(selectedVersion?.voting_result == null) {
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
                    <span className="double-thumbs up" onClick={() => { voteAdminAccept(selectedVersion.uuid, selectedVersion.original_id) }}><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><p className="tooltip bottom">Admin ja vote</p></span>
                    <i className="fas fa-thumbs-up fa-fw" onClick={() => { voteAccept(selectedVersion.uuid, selectedVersion.original_id) }}><p className="tooltip bottom">Ja</p></i>
                    <i className="fas fa-thumbs-down fa-fw" onClick={() => { voteDeny(selectedVersion.uuid, selectedVersion.original_id) }}><p className="tooltip bottom">Nee</p></i>
                    <span className="double-thumbs down" onClick={() => { voteAdminDeny(selectedVersion.uuid, selectedVersion.original_id) }}><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><p className="tooltip bottom">Admin nee vote</p></span>
                    </>
                );
            }
            else {
                return (
                    <>
                        <i className="fas fa-thumbs-up fa-fw" onClick={() => { voteAccept(selectedVersion.uuid, selectedVersion.original_id) }}></i><i className="fas fa-thumbs-down fa-fw" onClick={() => { voteDeny(selectedVersion.uuid, selectedVersion.original_id, setShowVotingBar) }}></i>
                    </>
                )
            }
        } else {
            return (
                <>
                    <i className="fas fa-award fa-fw"><p className="tooltip bottom">Stel als inspiratie voor</p></i>
                    <i className="fas fa-edit fa-fw" onClick={() => { openEdit(userData) }}><p className="tooltip bottom">Stel aanpassing voor</p></i>
                    <i className="fas fa-trash-alt fa-fw"><p className="tooltip bottom">Stel verwijdering voor</p></i>
                </>
            );
        }

        /* + ======================================================================== +
        /* | Editing button                                                           |
        /* + ========================================================================*/
        function openEdit(userData, confirmed = false) {
            // Check if there isn't already a suggestion that should be overriden
            var suggestionExists = localStorage.getItem('project-suggestion-' + selectedVersion.original_id) != undefined;
            if(!confirmed && suggestionExists) {
                conformationPopover.current.open(
                    'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden',
                    () => { openEdit(userData, true); }
                )
                return;
            }

            // Create a deep copy
            var editedVersionData = structuredClone(selectedVersion);
            editedVersionData.uuid = 0;
            editedVersionData.is_suggestion = true;
            editedVersionData.active_version = 0;
            editedVersionData.voting_result = null;
            editedVersionData.version_name = 'Geef deze verandering een naam';
            editedVersionData.version_description = 'Insert uitleg hier';
            editedVersionData.version_proposer = userData.username;
            editedVersionData.created_at = new Date();

            localStorage.setItem('project-suggestion-' + selectedVersion.original_id, JSON.stringify(editedVersionData));

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