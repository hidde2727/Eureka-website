import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useInspirationLabels, useInspirationVersions, useInspirationVoteResult, useUserData, setInspirationVote, suggestInspirationChange } from '../../utils/data_fetching.jsx';
import { IsObjectEmpty, Prepend } from '../../utils/utils.jsx';

import { Left, Middle, MiddleTop, MiddleBottom, Right, Popover } from '../../components/popover.jsx';
import Website from '../../components/website.jsx';
import VersioningSidebar from '../../components/versioning_sidebar.jsx';
import Loading from '../../components/loading.jsx';
import { Checkbox, Input, Textarea } from '../../components/inputs.jsx';
import ConformationPopover from '../conformation_popover.jsx';
import { FormErrorMessage, SetFormErrorMessage } from '../../components/form_error_message.jsx';

import '/public/components/toolbar.css';
import '/public/components/double_thumbs_up.css';
import '/public/popovers/inspiration.css';

export const InspirationPopover = forwardRef(({}, ref) => {
    const queryClient = useQueryClient();

    const { labels } = useInspirationLabels();
    const mappedLabels = useRef({});
    useEffect(() => {
        if(labels == undefined) return;
        labels.labels.forEach((category) => {
            mappedLabels.current[-1] = 'Loading';
            mappedLabels.current[-2] = 'The labels';
            category.labels.forEach((label) => {
                mappedLabels.current[label.id] = label.name;
            });
        });
    }, [labels]);

    const internalRef = useRef();
    useImperativeHandle(ref, () => ({
        open: (inspirationData) => {
            setId(inspirationData.original_id);
            setSelectedVersionUUID(inspirationData.uuid);
            internalRef.current.open();
        },
        close: () => {
            internalRef.current.close();
            setId(undefined);
            setSelectedVersionUUID(undefined);            
        }
    }));

    const [id, setId] = useState();
    const [selectedVersionUUID, setSelectedVersionUUID] = useState();
    const { versions:data, isFetching, hasError } = useInspirationVersions(id);
    const versions = useMemo(() => {
        if(isFetching) return undefined;
        if(localStorage.getItem('inspiration-suggestion-' + id) != undefined)
            return Prepend(data, JSON.parse(localStorage.getItem('inspiration-suggestion-' + id)));
        return data;
    }, [data, isFetching, localStorage.getItem('inspiration-suggestion-' + id)]);
    const selectedVersion = useMemo(() => {
        if(versions == undefined) return undefined;
        return versions
        .filter((version) => version.uuid === selectedVersionUUID )
        .map((version) => { 
            if(version.is_suggestion) return version;
            return {...version, 
                additionInfo: JSON.parse(version.additionInfo), 
                recommendation1: JSON.parse(version.recommendation1), 
                recommendation2: JSON.parse(version.recommendation2)
            }
        })[0];
    }, [selectedVersionUUID, isFetching]);

    useEffect(() => {
        const labelSelector = internalRef.current.content.getElementsByClassName('right')[0];
        const labels = (selectedVersion?.labels ?? '').split(',');

        (new Array(labelSelector.getElementsByClassName('inspiration-label'))).forEach((label) => { label.checked = false; })

        Object.entries(mappedLabels.current).forEach(([id, value]) => {
            const elements = labelSelector.getElementsByClassName(id);
            if(elements.length == 0) return;
            labelSelector.getElementsByClassName(id)[0].checked = labels.includes(id);
        });
    }, [labels, selectedVersionUUID, localStorage.getItem('inspiration-suggestion-' + id)])

    const conformationPopover = useRef();
    const submitSuggestionPopover = useRef();
    const [submitSuggestionError, setSubmitSuggestionError] = useState();
    const [forceUpdate, setForceUpdate] = useState(false);

    if(labels == undefined || mappedLabels.current==undefined || hasError) return <Popover ref={internalRef} id="inspiration-popover" />;

    const editing = selectedVersion?.is_suggestion;
    
    return (
        <Popover ref={internalRef} id="inspiration-popover">
            <Left>
                <VersioningSidebar versions={versions} selectedVersionUUID={selectedVersionUUID} setSelectedVersionUUID={setSelectedVersionUUID} />
            </Left>
            <Middle>
                <MiddleTop>
                    <div className="split-window">
                        <div className="center-content">
                            <Website data={selectedVersion?.additionInfo} />
                        </div>
                        <div className="description">
                            { editing?
                                <Textarea value={selectedVersion?.description} onChange={(ev) => {
                                    selectedVersion.description = ev.target.value;
                                    localStorage.setItem('inspiration-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                                }} />
                                :
                                <p>{selectedVersion?.description ?? <Loading />}</p>
                            }
                            <div className="labels">
                                {
                                    (selectedVersion?.labels ?? '-1,-2').split(',').map((labelID) => {
                                        return (
                                            <p className="label" key={labelID}>{mappedLabels.current[labelID]}</p>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <p className="comparable">Vergelijkbaar:</p>
                    <div className="split-window">
                        <div className="center-content">
                            <EditableWebsite partialName="recommendation1" />
                        </div>
                        <div className="center-content">
                            <EditableWebsite partialName="recommendation2" />
                        </div>
                    </div>
                </MiddleTop>
                <MiddleBottom className="toolbar">
                    <Toolbar />
                </MiddleBottom>
            </Middle>
            <Right keepClosed={!editing}>
                {
                    labels.labels.map((category) => {
                        return (
                            <div className="category" key={category.id}>
                                <p>{category.name}</p>
                                <div className="content">
                                {
                                    category.labels.map((label) => {
                                        return <div key={label.id}><Checkbox label={label.name} className={'inspiration-label ' + label.id} onChange={() => {
                                            const labels = selectedVersion.labels.split(',');
                                            const index = labels.indexOf(label.id.toString());
                                            if(index == -1) labels.push(label.id.toString());
                                            else labels.splice(index, 1);
                                            selectedVersion.labels = labels.join(',');
                                            localStorage.setItem('inspiration-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                                            setForceUpdate(!forceUpdate);
                                        }}/></div>;
                                    })
                                }
                                </div>
                            </div>
                        )
                    })
                }
            </Right>
            <ConformationPopover ref={conformationPopover} />

            <Popover className="inspiration-suggestion-popover" ref={submitSuggestionPopover} form={true} onSubmit={async (ev) => {
                ev.preventDefault();

                if(!ev.target.suggestionName.value) return SetFormErrorMessage(setSubmitSuggestionError, 'Specificeer een naam', ev.target.suggestionName);
                if(ev.target.suggestionName.value.length > 255) return SetFormErrorMessage(setSubmitSuggestionError, 'Maximale lengte is 255 karakters', ev.target.suggestionName);

                if(!ev.target.suggestionDescription.value) return SetFormErrorMessage(setSubmitSuggestionError, 'Specificeer een omschrijving', ev.target.suggestionDescription);
                if(ev.target.suggestionDescription.value.length > 65535) return SetFormErrorMessage(setSubmitSuggestionError, 'Maximale lengte is 65535 karakters', ev.target.suggestionDescription);

                let suggestions = [];
                if(selectedVersion.recommendation1 != undefined && selectedVersion.recommendation1.url != '') suggestions.push(selectedVersion.recommendation1.url);
                if(selectedVersion.recommendation2 != undefined && selectedVersion.recommendation2.url != '') suggestions.push(selectedVersion.recommendation2.url);

                try {
                    const insertedUUID = await suggestInspirationChange(queryClient, {
                        url: selectedVersion.url, 
                        description: selectedVersion.description, 
                        recommendations: suggestions,
                        labels: selectedVersion.labels.split(',').map((label) => parseInt(label)),
                        versionName: ev.target.suggestionName.value,
                        versionDescription: ev.target.suggestionDescription.value,
                        originalID: selectedVersion.original_id
                    });

                    localStorage.removeItem('inspiration-suggestion-' + selectedVersion.original_id);
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
    );

    /* + ======================================================================== +
    /* | EditableWebsite                                                          |
    /* + ========================================================================*/
    function EditableWebsite({ partialName }) {
        const websiteData = selectedVersion==undefined? undefined:selectedVersion[partialName];
        return (
            <>
                {editing && <input placeholder="youtube.com" defaultValue={websiteData?.url} onChange={(ev) => {
                    console.log('url: ' + ev.target.value);
                    selectedVersion[partialName] = { url: ev.target.value };
                    localStorage.setItem('inspiration-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                    setForceUpdate(!forceUpdate);
                }} />}
                <Website
                    data={(editing && websiteData?.type == undefined) ? undefined : websiteData}
                    url={(editing && websiteData?.type == undefined) ? websiteData?.url : undefined}
                    onDataLoad={(data) => {
                        if (!editing) return;
                        selectedVersion[partialName] = data;
                        localStorage.setItem('inspiration-suggestion-' + selectedVersion.original_id, JSON.stringify(selectedVersion));
                    }}
                />
            </>
        )
    }

    /* + ======================================================================== +
    /* | Toolbar                                                                  |
    /* + ========================================================================*/
    function Toolbar({ }) {
        const queryClient = useQueryClient();
        const { vote, isFetching:isFetchingP, hasError:hasErrorP } = useInspirationVoteResult(selectedVersion?.uuid, selectedVersion?.voting_result == null);
        const { userData, isFetching:isFetchingU, hasError:hasErrorU } = useUserData();

        const [showVotingBar, setShowVotingBar] = useState();
        useEffect(() => {
            setShowVotingBar(false);
        }, [vote, selectedVersion]);

        if(isFetchingU || userData == undefined) return <Loading />;

        if(selectedVersion?.is_suggestion != undefined) {
            return (
                <>
                    <i className="fas fa-trash-alt fa-fw" onClick={() => {
                        conformationPopover.current.open(
                            'Deze actie zal de huidige suggestie verwijderen en dit kan niet ongedaan worden',
                            () => { 
                                localStorage.removeItem('inspiration-suggestion-' + selectedVersion.original_id); 
                                setSelectedVersionUUID(versions[1].uuid) 
                            }
                        )
                    }}><p className="tooltip bottom">Verwijder suggestie</p></i>
                    <i className="far fa-paper-plane fa-fw" onClick={() => {
                        submitSuggestionPopover.current.open();
                    }}><p className="tooltip bottom">Stel voor</p></i>
                </>
            );
        } else if(selectedVersion?.voting_result === null) {
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
                    <span className="double-thumbs up" onClick={() => { VoteAdminAccept(selectedVersion.uuid, selectedVersion.original_id) }}><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><i className="fas fa-thumbs-up"></i><p className="tooltip bottom">Admin ja vote</p></span>
                    <i className="fas fa-thumbs-up fa-fw" onClick={() => { VoteAccept(selectedVersion.uuid, selectedVersion.original_id) }}><p className="tooltip bottom">Ja</p></i>
                    <i className="fas fa-thumbs-down fa-fw" onClick={() => { VoteDeny(selectedVersion.uuid, selectedVersion.original_id) }}><p className="tooltip bottom">Nee</p></i>
                    <span className="double-thumbs down" onClick={() => { VoteAdminDeny(selectedVersion.uuid, selectedVersion.original_id) }}><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><i className="fas fa-thumbs-down"></i><p className="tooltip bottom">Admin nee vote</p></span>
                    </>
                );
            }
            else {
                return (
                    <>
                        <i className="fas fa-thumbs-up fa-fw" onClick={() => { VoteAccept(selectedVersion.uuid, selectedVersion.original_id) }}></i><i className="fas fa-thumbs-down fa-fw" onClick={() => { VoteDeny(selectedVersion.uuid, selectedVersion.original_id, setShowVotingBar) }}></i>
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
            var suggestionExists = localStorage.getItem('inspiration-suggestion-' + selectedVersion.original_id) != undefined;
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

            localStorage.setItem('inspiration-suggestion-' + selectedVersion.original_id, JSON.stringify(editedVersionData));

            setSelectedVersionUUID(0);
        }

        /* + ======================================================================== +
        /* | Voting                                                                   |
        /* + ========================================================================*/
        async function VoteAdminAccept(uuid, id) {
            setInspirationVote(queryClient, uuid, id, {voteValue:1, adminVote:true})
        }
        async function VoteAccept(uuid, id) {
            setInspirationVote(queryClient, uuid, id, {voteValue:1, adminVote:false})
        }
        async function VoteAdminDeny(uuid, id) {
            setInspirationVote(queryClient, uuid, id, {voteValue:-1, adminVote:true})
        }
        async function VoteDeny(uuid, id) {
            setInspirationVote(queryClient, uuid, id, {voteValue:-1, adminVote:false})
        }
    }


});
export default InspirationPopover;