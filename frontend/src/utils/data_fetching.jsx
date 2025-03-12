import { keepPreviousData, queryOptions, useInfiniteQuery, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { GetCookie, DeleteCookie, Prepend } from './utils.jsx';

async function fetchInfo(url, method, body, { jsonResponse=true, includeCredentials=false }) {
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

function fetchOptions(url, queryKeys, method, body, { jsonResponse=true, includeCredentials=false, enable=true }={}) {
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
        queryFn: () => fetchInfo(newURL, method, body, { jsonResponse: jsonResponse, includeCredentials: includeCredentials,  }),
        staleTime: Infinity,
        enabled: enable,
        placeholderData: keepPreviousData
    });
}


export function useWebsiteInfo(url, enable) {
    const { data, error, isPending, isPlaceholderData } = useQuery(fetchOptions('api/retrieve/url/', [['url', encodeURIComponent(url)]], 'GET', null, {enable: enable}));
    return { fetchedData: data, hasError: error, isFetching: isPending, isPlaceholderData };
}


export function useProjects() {
    const { data, error, isFetching } = useQuery(fetchOptions('/data/projects.json', undefined, 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}
export function useProjectsSus() {
    const { data, error, isFetching } = useSuspenseQuery(fetchOptions('/data/projects.json', undefined, 'GET', null));
    return { projects: data, hasError: error, isFetching: isFetching };
}
export async function suggestProject({ name, description, links, suggestorName, suggestorEmail }) {
    await fetchInfo('/api/suggest/project/', 'POST', JSON.stringify(
        { name, description, links, suggestorName, suggestorEmail }
    ), {jsonResponse:false, includeCredentials: true});
}


export function useFiles() {
    const { data, error, isFetching } = useQuery(fetchOptions('/data/files.json', undefined, 'GET', null));
    return { files: data, hasError: error, isFetching: isFetching };
}
export function useFilesSus() {
    const { data, error, isFetching } = useSuspenseQuery(fetchOptions('/data/files.json', undefined, 'GET', null));
    return { files: data, hasError: error, isFetching: isFetching };
}


export function useInspirationLabels() {
    const { data, error, isFetching } = useQuery(fetchOptions('/data/labels.json', undefined, 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}
export function useInspirationLabelsSus() {
    const { data, error, isFetching } = useSuspenseQuery(fetchOptions('/data/labels.json', undefined, 'GET', null));
    return { labels: data, hasError: error, isFetching: isFetching };
}
let remaining = [];
export function useInspiration(selectedLabels) {
    function getNextPage() {
        let index = Math.floor(Math.random() * (remaining.length - 1));
        if(index == -1) return undefined;
        const cursor = remaining[index];
        remaining.splice(index, 1);
        return cursor;
    }
    const { data, error, isFetching, isPlaceholderData, fetchNextPage, hasNextPage } = useInfiniteQuery(queryOptions({
        queryKey: ['inspiration', ...selectedLabels],
        queryFn: async ({ pageParam }) => {
            let cursor = pageParam==-1?'':'&cursor='+pageParam;
            const data = await fetchInfo('/api/inspiration/?labels='+selectedLabels.join(',')+cursor, 'GET', undefined, {});
            if(pageParam==-1) {
                remaining = data.availablePages;
                return { data: data.data, nextPage: getNextPage() };
            }
            return { data, nextPage: getNextPage() };
        },
        initialPageParam: -1,
        getNextPageParam: (lastPage, pages) => {
            return lastPage.nextPage;
        },
        placeholderData: keepPreviousData,
        staleTime: Infinity
    }));
    return { inspiration: data, hasError: error, isFetching, isPlaceholderData, fetchNextPage, hasNextPage };
}
export async function suggestInspiration({ url, description, recommendations, labels }) {
    await fetchInfo('/api/suggest/inspiration/', 'POST', JSON.stringify(
        { url, description, recommendations, labels }
    ), {jsonResponse:false, includeCredentials: true});
}


export async function attemptLogin({ username, password }) {
    await fetchInfo('api/login/', 'POST', JSON.stringify(
        { username, password }
    ), {jsonResponse: false});
}


export function useUserData() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useQuery(fetchOptions('/api/private/self/permissions', undefined, 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}
export function useUserDataSus() {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isFetching } = useSuspenseQuery(fetchOptions('/api/private/self/permissions', undefined, 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    return { userData: data, isFetching: isFetching, sessionSet: sessionSet };
}



export function useGlobalSettings(enable) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/settings/get', undefined, 'GET', null, { includeCredentials: true, enable }));
    return { settings: data, hasError: error, isFetching: isFetching };
}
export async function updatePersonalSettings({ username, email, password, previousPassword }) {
    await fetchInfo('/api/private/self/update', 'PUT', JSON.stringify(
        { username, email, password, previousPassword }
    ), {includeCredentials:true, jsonResponse:false});
}
export async function updateGlobalSettings({ acceptNormalVote, acceptAdminVote, acceptAmount, denyNormalVote, denyAdminVote, denyAmount }) {
    await fetchInfo('/api/private/settings/set', 'PUT', JSON.stringify({
        acceptNormalVote,
        acceptAdminVote,
        acceptAmount,
    
        denyNormalVote,
        denyAdminVote,
        denyAmount
    }), {includeCredentials: true, jsonResponse: false});
}



export function useProjectVersions(projectId) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/project/versions', [['id', projectId]], 'GET', null, { includeCredentials: true, enable: projectId!=undefined, usePlaceholder: true }));
    return { versions: data, hasError: error, isFetching: isFetching };
}
export function useProjectVoteResult(projectUUID, enable) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/self/vote', [['type', 'project'], ['uuid', projectUUID]], 'GET', null, { includeCredentials: true, enable: enable && projectUUID!=undefined, usePlaceholder: true }));
    return { vote: data, hasError: error, isFetching: isFetching };
}
export async function setProjectVote(queryClient, projectUUID, projectID, {voteValue, adminVote}) {
    try {
        // Try to optimistically update
        queryClient.setQueryData(['/api/private/self/vote', [['type', 'project'], ['uuid', projectUUID]], 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            var newData = structuredClone(oldData);
            newData.value = voteValue;
            newData.admin_vote = adminVote;
            return newData;
        });
        // Request the vote
        var response = await fetchInfo('/api/private/suggestion/vote', 'PUT', JSON.stringify({
            type: 'project',
            uuid: projectUUID,
            voteValue: voteValue,
            adminVote: adminVote
        }), {includeCredentials: true});
        
        var voteResult = null;
        if(response.result == 'accepted') voteResult = true;
        else if(response.result == 'denied') voteResult = false;

        // Set the vote result
        queryClient.setQueryData(['/api/private/project/versions', [['id', projectID]], 'GET', null], (oldData) => {
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
        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/api/private/project/versions', [['id', projectID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/self/vote', [['type', 'project'], ['uuid', projectUUID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/suggestion/get']});

    } catch(err) {
        throw new Error('Failed to vote:\n' + err.message);
    }
}
export async function suggestProjectChange(queryClient, newData) {
    try {
        // Try to optimistically update
        queryClient.setQueryData(['/api/private/project/versions', [['id', newData.originalID]], 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            var clone = structuredClone(oldData);
            Prepend(clone, newData);
            return clone;
        });

        // Request the vote
        var response = await fetchInfo('/api/private/project/suggest', 'PUT', JSON.stringify(newData), {includeCredentials: true, jsonResponse: false});

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/data/project.json']});
        queryClient.invalidateQueries({ queryKey:['/api/private/project/versions', [['id', newData.originalID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/suggestion/get']});

        return response;
    } catch(err) {
        throw new Error('Failed to vote:\n' + err.message);
    }
}


export async function renameLabel(queryClient, parentID, id, newName, override) {
    try {
        // Optimistic update
        queryClient.setQueryData(['/data/labels.json', undefined, 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            let newData = structuredClone(oldData);

            if(parentID == null) {
                newData.labels.map((category) => {
                    if(category.id == id) return { ...category, name: newName };
                    return category;
                });
            } else {
                newData.labels.forEach((category) => {
                    if(category.id == parentID) { 
                        category.labels = category.labels.map((label) => {
                            if(label.id == id) return { ...label, name: newName };
                            return label;
                        });
                    }
                });
            }
            return newData;
        });
        // Request the folder renaming
        var response = await fetchInfo('/api/private/labels/rename', 'PUT', JSON.stringify({
            id: id,
            newName: newName,
            override: override
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/data/labels.json', undefined, 'GET', null]});

        try {
            response = JSON.parse(response);
            return { hasConflicts: true, conflicts: response.conflicts };
        } catch(err) {
            return { hasConflicts: false };
        }
    } catch(err) {
        throw new Error('Failed to change labels name:\n' + err.message);
    }
}
export async function moveLabel(queryClient, id, newParentID, oldParentId, atPosition, override) {
    try {
        // Request the folder renaming
        var response = await fetchInfo('/api/private/labels/move', 'PUT', JSON.stringify({
            id: id,
            newParentID: newParentID,
            atPosition: atPosition,
            override: override
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/data/labels.json', undefined, 'GET', null]});

        try {
            response = JSON.parse(response);
            return { hasConflicts: true, conflicts: response.conflicts };
        } catch(err) {
            return { hasConflicts: false };
        }
    } catch(err) {
        throw new Error('Failed to move label:\n' + err.message);
    }
}
export async function addLabel(queryClient, parentID, name) {
    try {
        // Request the folder renaming
        await fetchInfo('/api/private/labels/add', 'PUT', JSON.stringify({
            parentID: parentID,
            name: name
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/data/labels.json', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to add label:\n' + err.message);
    }
}
export async function deleteLabel(queryClient, id) {
    try {
        // Request the folder renaming
        await fetchInfo('/api/private/labels/delete', 'PUT', JSON.stringify({
            id: id
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/data/labels.json', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to delete label:\n' + err.message);
    }
}


export function useInspirationVersions(inspirationID) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/inspiration/versions', [['id', inspirationID]], 'GET', null, { includeCredentials: true, enable: inspirationID!=undefined }));
    return { versions: data, hasError: error, isFetching: isFetching };
}
export function useInspirationVoteResult(inspirationUUID, enable) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/self/vote', [['type', 'inspiration'], ['uuid', inspirationUUID]], 'GET', null, { includeCredentials: true, enable: enable && inspirationUUID != undefined, usePlaceholder: true }));
    return { vote: data, hasError: error, isFetching: isFetching };
}
export async function setInspirationVote(queryClient, inspirationUUID, inspirationID, {voteValue, adminVote}) {
    try {
        // Try to optimistically update
        queryClient.setQueryData(['/api/private/self/vote', [['type', 'inspiration'], ['uuid', inspirationUUID]], 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            var newData = structuredClone(oldData);
            newData.value = voteValue;
            newData.admin_vote = adminVote;
            return newData;
        });
        // Request the vote
        var response = await fetchInfo('/api/private/suggestion/vote', 'PUT', JSON.stringify({
            type: 'inspiration',
            uuid: inspirationUUID,
            voteValue: voteValue,
            adminVote: adminVote
        }), {includeCredentials: true});
        
        var voteResult = null;
        if(response.result == 'accepted') voteResult = true;
        else if(response.result == 'denied') voteResult = false;

        // Set the vote result
        queryClient.setQueryData(['/api/private/inspiration/versions', [['id', inspirationID]], 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            return oldData.map((version) => {
                if(version.uuid = inspirationUUID) {
                    var newVersion = structuredClone(version);
                    newVersion.vote_result = voteResult;
                    return newVersion;
                }
                return version;
            });
        });
        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/api/inspiration', undefined, 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/inspiration/versions', [['id', inspirationID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/self/vote', [['type', 'inspiration'], ['uuid', inspirationUUID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/suggestion/get']});

    } catch(err) {
        throw new Error('Failed to vote:\n' + err.message);
    }
}
export async function suggestInspirationChange(queryClient, newData) {
    try {
        // Try to optimistically update
        queryClient.setQueryData(['/api/private/inspiration/versions', [['id', newData.originalID]], 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            var clone = structuredClone(oldData);
            Prepend(clone, newData);
            return clone;
        });

        // Request the vote
        var response = await fetchInfo('/api/private/inspiration/suggest', 'PUT', JSON.stringify(newData), {includeCredentials: true, jsonResponse: false});

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/api/inspiration', undefined, 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/inspiration/versions', [['id', newData.originalID]], 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/suggestion/get']});

        return response;
    } catch(err) {
        throw new Error('Failed to vote:\n' + err.message);
    }
}


export function useFileStorageUsage() {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/files/usage', undefined, 'GET', null, { includeCredentials: true }));
    return { storageUsage: data, hasError: error, isFetching: isFetching };
}
export async function createFolder(queryClient, parentID) {
    try {
        // Request the folder creation
        var response = await fetchInfo('/api/private/files/add', 'PUT', JSON.stringify({
            parentID: parentID
        }), {includeCredentials: true});

        return { name: response.name, id: response.id };
    } catch(err) {
        throw new Error('Failed to create a folder:\n' + err.message);
    }
}
export async function createWebsiteFile(queryClient, parentID, url) {
    try {
        // Request the folder creation
        var response = await fetchInfo('/api/private/files/add', 'PUT', JSON.stringify({
            parentID: parentID,
            websiteURL: url
        }), {includeCredentials: true});

        return { name: response.name, id: response.id };
    } catch(err) {
        throw new Error('Failed to create a website file:\n' + err.message);
    }
}
export async function changeFileName(queryClient, parentFolder, id, oldName, newName, override=false) {
    try {
        // Optimistic update
        queryClient.setQueryData(['/data/files.json', undefined, 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            let newData = structuredClone(oldData);
            let selectData = newData;
            for(let i = 1; i < parentFolder.length; i++) selectData = selectData[parentFolder[i].name];

            selectData = { ...selectData, [oldName]: undefined, [newName]: selectData[oldName] };

            return newData;
        });
        // Request the folder renaming
        var response = await fetchInfo('/api/private/files/rename', 'PUT', JSON.stringify({
            id: id,
            newName: newName,
            override: override
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/data/files.json', undefined, 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/files/usage', undefined, 'GET', null]});

        try {
            response = JSON.parse(response);
            return { hasConflicts: true, conflicts: response.conflicts };
        } catch(err) {
            return { hasConflicts: false };
        }
    } catch(err) {
        throw new Error('Failed to change folder name:\n' + err.message);
    }
}
export async function changeFileParent(queryClient, currentParentId, newParentId, id, override=false) {
    try {
        // Optimistic update
        
        // Request the folder renaming
        var response = await fetchInfo('/api/private/files/move', 'PUT', JSON.stringify({
            id: id,
            newParentId: newParentId,
            override: override
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/data/files.json', undefined, 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/files/usage', undefined, 'GET', null]});

        try {
            response = JSON.parse(response);
            return { hasConflicts: true, conflicts: response.conflicts };
        } catch(err) {
            return { hasConflicts: false };
        }
    } catch(err) {
        throw new Error('Failed to change folder name:\n' + err.message);
    }
}
export async function deleteFile(queryClient, parentFolder, id) {
    try {
        // Optimistic update
        queryClient.setQueryData(['/data/files.json', undefined, 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;

            let newData = structuredClone(oldData);
            let selectData = newData;
            for(let i = 1; i < parentFolder.length; i++) selectData = selectData[parentFolder[i].name];
            
            selectData = Object.entries(selectData).filter(([fileName, file]) => file.id!==id).reduce( (res, [fileName, file]) => Object.assign(res, { [fileName]: file }), {} );

            return newData;
        });

        // Request the folder renaming
        await fetchInfo('/api/private/files/delete', 'PUT', JSON.stringify({
            id: id
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh (just in case anything went wrong updating optimistically)
        queryClient.invalidateQueries({ queryKey:['/data/files.json', undefined, 'GET', null]});
        queryClient.invalidateQueries({ queryKey:['/api/private/files/usage', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to delete file:\n' + err.message);
    }
}
export function invalidateFiles(queryClient) {
    queryClient.invalidateQueries({ queryKey:['/data/files.json', undefined, 'GET', null]});
    queryClient.invalidateQueries({ queryKey:['/api/private/files/usage', undefined, 'GET', null]});
}

var amountSuggestionPages = 0;
export function useSuggestions(page, limit, history, search) {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/suggestion/get', [['page', page], ['window', limit], ['history', history], ['getAmountPages', page==0], ['search', search]], 'GET', null, { includeCredentials: true }));
    if(page==0 && data!=undefined) {
        if(data?.amount!=undefined) amountSuggestionPages = data.amount;
        return { suggestions: data.data, amountPages: amountSuggestionPages, hasError: error, isFetching: isFetching };
    }
    return { suggestions: data?.data ?? data, amountPages: amountSuggestionPages, hasError: error, isFetching: isFetching };
}

export function useUsers() {
    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/users/get', undefined, 'GET', null, { includeCredentials: true }));
    return { users: data, hasError: error, isFetching: isFetching };
}
export async function createUser(queryClient, username, password) {
    try {
        // Request the user creation
        await fetchInfo('/api/private/users/add', 'PUT', JSON.stringify({
            username: username,
            password: password
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/api/private/users/get', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to create user:\n' + err.message);
    }
}
export async function modifyUser(queryClient, { id, admin, labels, users, settings, files, logs }) {
    try {
        // Optimistic update
        queryClient.setQueryData(['/api/private/users/get', undefined, 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            return oldData.map((user) => {
                if(user.id != id) return user;
                return { ...user, admin: admin, modify_inspiration_labels: labels, modify_users: users, modify_settings: settings, modify_files: files, watch_logs: logs };
            });
        });
        // Request the user creation
        await fetchInfo('/api/private/users/modify', 'PUT', JSON.stringify({
            id, admin, labels, users, settings, files, logs
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/api/private/users/get', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to create user:\n' + err.message);
    }
}
export async function deleteUser(queryClient, id) {
    try {
        // Optimistic update
        queryClient.setQueryData(['/api/private/users/get', undefined, 'GET', null], (oldData) => {
            if(oldData == undefined) return undefined;
            return oldData.filter((user) => {
                return user.id !== id;
            });
        });
        // Request the user creation
        await fetchInfo('/api/private/users/delete', 'PUT', JSON.stringify({
            id
        }), { includeCredentials: true, jsonResponse: false });

        // Force a refresh
        queryClient.invalidateQueries({ queryKey:['/api/private/users/get', undefined, 'GET', null]});
    } catch(err) {
        throw new Error('Failed to delete user:\n' + err.message);
    }
}

export function useLogs(cursor, windowSize, urgencyFilters, typeFilters, userFilters) {
    let searchParams = [['cursor', cursor],['window', windowSize]];
    if(urgencyFilters!==undefined) searchParams.push(['urgency', urgencyFilters]);
    if(typeFilters!==undefined) searchParams.push(['type', typeFilters]);
    if(userFilters!==undefined) searchParams.push(['user', userFilters]);

    const { data, error, isFetching } = useQuery(fetchOptions('/api/private/logs/get', searchParams, 'GET', null, { includeCredentials: true }));

    return { logs: data?.data, amountPages: data?.amountPages, hasError: error, isFetching: isFetching };
}

export async function signOut() {
    await fetchInfo('/api/private/self/logout/', 'POST', null, { includeCredentials:true, jsonResponse:false });
}