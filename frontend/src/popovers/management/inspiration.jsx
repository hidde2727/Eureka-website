import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useMemo } from 'react';

import { Left, Middle, MiddleTop, MiddleBottom, Right, Popover } from '../../components/popover.jsx';
import Website from '../../components/website.jsx';
import VersioningSidebar from '../../components/versioning_sidebar.jsx';
import Loading from '../../components/loading.jsx';

import { useInspirationLabels, useInspirationVersions, useInspirationVoteResult, useUserData, setInspirationVote } from '../../utils/data_fetching.jsx';
import { IsObjectEmpty, Prepend } from '../../utils/utils.jsx';
import ConformationPopover from '../conformation_popover.jsx';
import { useQueryClient } from '@tanstack/react-query';

import '/public/components/toolbar.css';

export const InspirationPopover = forwardRef(({}, ref) => {
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
        }
    }));

    const [id, setId] = useState();
    const [selectedVersionUUID, setSelectedVersionUUID] = useState();
    const { versions:data, isFetching, hasError } = useInspirationVersions(id);
    const versions = useMemo(() => {
        if(isFetching) return undefined;
        if(localStorage.getItem('inspiration-suggestion:' + id) != undefined)
            return Prepend(data, JSON.parse(localStorage.getItem('inspiration-suggestion:' + id)));
        return data;
    }, [data, isFetching, localStorage.getItem('inspiration-suggestion:' + id)]);
    const selectedVersion = useMemo(() => {
        if(versions == undefined) return undefined;
        return versions.filter((version) => version.uuid === selectedVersionUUID )[0];
    }, [selectedVersionUUID, isFetching]);

    const conformationPopover = useRef();

    if(labels == undefined || mappedLabels.current==undefined || hasError) return <Popover ref={internalRef} id="inspiration-popover" />;

    return (
        <Popover ref={internalRef} id="inspiration-popover">
            <Left>
                <VersioningSidebar versions={versions} selectedVersionUUID={selectedVersionUUID} setSelectedVersionUUID={setSelectedVersionUUID} />
            </Left>
            <Middle>
                <MiddleTop>
                    <div className="split-window">
                        <div className="center-content"><Website data={selectedVersion?.additionInfo} /></div>
                        <div className="description">
                            <p>{selectedVersion?.description ?? <Loading />}</p>
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
                        <div className="center-content"><Website data={selectedVersion?.recommendation1} /></div>
                        <div className="center-content"><Website data={selectedVersion?.recommendation2} /></div>
                    </div>
                </MiddleTop>
                <MiddleBottom className="toolbar">
                    <Toolbar />
                </MiddleBottom>
            </Middle>
            <Right>

            </Right>
            <ConformationPopover ref={conformationPopover} />
        </Popover>
    );

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
                    <i className="fas fa-x fa-fw"><p className="tooltip bottom">Annuleer</p></i>
                    <i className="fas fa-save fa-fw"><p className="tooltip bottom">Stel voor</p></i>
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
                    <i className="fas fa-edit fa-fw" onClick={() => { OpenEdit(selectedVersion, setSelectedVersionUUID, conformationPopover) }}><p className="tooltip bottom">Stel aanpassing voor</p></i>
                    <i className="fas fa-trash-alt fa-fw"><p className="tooltip bottom">Stel verwijdering voor</p></i>
                </>
            );
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