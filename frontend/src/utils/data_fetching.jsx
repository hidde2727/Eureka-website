import { keepPreviousData, queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { GetCookie, DeleteCookie } from './utils.jsx';

export async function FetchInfo(url, method, body, { jsonResponse=true, includeCredentials=false }) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if(includeCredentials)
        headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

    const response = await fetch(url, { 
        credentials: 'same-origin', 
        headers: headers, 
        method: method, 
        body: body
    });
    if (!response.ok) {
        const error = await response.text();
        if(error == 'Log in voor dit deel van de API') { DeleteCookie('sessionCredential'); DeleteCookie('sessionID'); DeleteCookie('userID'); return window.location.reload(); }
        throw new Error(error);
    }

    var decodedResult = null;
    if(jsonResponse)
        decodedResult = await response.json();
    else
        decodedResult = await response.text();

    return decodedResult;
}

function FetchOptions(url, queryKeys, method, body, { jsonResponse=true, includeCredentials=false, enable=true }={}) {
    var newURL = url;
    if(queryKeys != undefined) {
        newURL += '?';
        queryKeys.forEach((queryKey, index) =>  {
            if(index != 0) newURL += '&';
            newURL += encodeURI(queryKey[0]) + '=' + encodeURI(queryKey[1]);
        });
    }

    return queryOptions({
        queryKey: [url, queryKeys, method, body],
        queryFn: () => FetchInfo(newURL, method, body, { jsonResponse: jsonResponse, includeCredentials: includeCredentials,  }),
        staleTime: Infinity,
        enabled: enable,
        placeholderData: keepPreviousData
    });
}


export function useWebsiteInfo(url, enable) {
    const { data, error, isPending } = useQuery(FetchOptions('api/retrieve/url/', [['url', url]], 'GET', {enable: enable}));
    return { fetchedData: data, hasError: error, isFetching: isPending };
}


export function useProjects() {
    const { data, error, isFetching } = useQuery(FetchOptions('/data/projects.json', undefined, 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}
export function useProjectsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/data/projects.json', undefined, 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}



export function useInspirationLabels() {
    const { data, error, isFetching } = useQuery(FetchOptions('/data/labels.json', undefined, 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}
export function useInspirationLabelsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/data/labels.json', undefined, 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}



export function useUserData() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useQuery(FetchOptions('/api/private/self/permissions', undefined, 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}
export function useUserDataSus() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useSuspenseQuery(FetchOptions('/api/private/self/permissions', undefined, 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}



export function useGlobalSettings() {
    const { data, error, isFetching } = useQuery(FetchOptions('/api/private/settings/get', undefined, 'GET', null, { includeCredentials: true }));
    return { settings: data, hasError: error, isFetching: isFetching };
}
export function useGlobalSettingsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/api/private/settings/get', undefined, 'GET', null, { includeCredentials: true }));
    return { settings: data, hasError: error, isFetching: isFetching };
}



export function useProjectVersions(projectId) {
    const { data, error, isFetching } = useQuery(FetchOptions(`/api/private/project/versions`, [['id', projectId]], 'GET', null, { includeCredentials: true, enable: projectId!=undefined, usePlaceholder: true }));
    return { versions: data, hasError: error, isFetching: isFetching };
}
export function useProjectVoteResult(projectUUID, enable) {
    const { data, error, isFetching } = useQuery(FetchOptions(`/api/private/self/vote`, [['type', 'project'], ['uuid', projectUUID]], 'GET', null, { includeCredentials: true, enable: enable, usePlaceholder: true }));
    return { vote: data, hasError: error, isFetching: isFetching };
}
export function setVoteQueryData(queryClient, projectUUID, projectId, {voteValue,adminVote,voteResult}) {
    queryClient.setQueryData([`/api/private/project/versions`, [['id', projectId]], 'GET', null], (oldData) => {
        if(oldData == undefined) return undefined;
        return oldData.map((version) => {
            if(version.uuid = projectUUID) {
                var newVersion = structuredClone(version);
                newVersion.vote_result = voteResult;
                return newVersion;
            }
            return version;
        });
    });
    queryClient.setQueryData([`/api/private/self/vote`, [['type', 'project'], ['uuid', projectUUID]], 'GET', null], (oldData) => {
        if(oldData == undefined) return undefined;
        var newData = structuredClone(oldData);
        newData.value = voteValue;
        newData.admin_vote = adminVote;
        return newData;
    });
}
export function refetchProjectVotes(queryClient, projectUUID, projectId) {
    queryClient.invalidateQueries({ queryKey:[`/api/private/project/versions`, [['id', projectId]], 'GET', null]});
    queryClient.invalidateQueries({ queryKey:[`/api/private/self/vote`, [['type', 'project'], ['uuid', projectUUID]], 'GET', null]});
    queryClient.invalidateQueries({ queryKey:['/api/private/suggestion/get']});
}



export function useSuggestions(page, window, history) {
    const { data, error, isFetching } = useQuery(FetchOptions(`/api/private/suggestion/get`, [['page', page], ['window', window], ['history', history]], 'GET', null, { includeCredentials: true }));
    return { suggestions: data, hasError: error, isFetching: isFetching };
}