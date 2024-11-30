import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
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

export default function FetchOptionsInt(url, method, body, { jsonResponse=true, includeCredentials=false, enable=true }={}) {
    return queryOptions({
        queryKey: [url, method, body],
        queryFn: () => FetchInfo(url, method, body, { jsonResponse: jsonResponse, includeCredentials: includeCredentials }),
        staleTime: Infinity,
        enabled: enable
    });
}
export const FetchOptions = FetchOptionsInt;




export function useProjects() {
    const { data, error, isFetching } = useQuery(FetchOptions('/data/projects.json', 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}
export function useProjectsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/data/projects.json', 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}
export function useInspirationLabels() {
    const { data, error, isFetching } = useQuery(FetchOptions('/data/labels.json', 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}
export function useInspirationLabelsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/data/labels.json', 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}
export function useUserData() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useQuery(FetchOptions('/api/private/self/permissions', 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}
export function useUserDataSus() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useSuspenseQuery(FetchOptions('/api/private/self/permissions', 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}
export function useGlobalSettings() {
    const { data, error, isFetching } = useQuery(FetchOptions('/api/private/settings/get', 'GET', null, { includeCredentials: true }));
    return { settings: data, hasError: error, isFetching: isFetching };
}
export function useGlobalSettingsSus() {
    const { data, error, isFetching } = useSuspenseQuery(FetchOptions('/api/private/settings/get', 'GET', null, { includeCredentials: true }));
    return { settings: data, hasError: error, isFetching: isFetching };
}
export function useProjectVersions(projectId) {
    const { data, error, isFetching } = useQuery(FetchOptions('/api/private/project/versions?id=' + projectId, 'GET', null, { includeCredentials: true, enable: projectId!=undefined }));
    return { versions: data, hasError: error, isFetching: isFetching };
}