import { useQuery } from '@tanstack/react-query';

import { GetCookie } from '../utils/utils.jsx';
import { FetchOptions } from '../utils/data_fetching.jsx';

export default function Restricted({children, to, notLoggedIn}) {
    const sessionSet = GetCookie('sessionID') != undefined && GetCookie('sessionCredential') != undefined && GetCookie('userID') != undefined;
    const { data, isPending } = useQuery(FetchOptions('/api/private/self/permissions', 'GET', undefined, { includeCredentials: true, enable: sessionSet }));
    
    if(notLoggedIn && !sessionSet) return children;
    if(notLoggedIn) return;

    if(!sessionSet || isPending) return;
    if(to != undefined && data[to] == false) return;

    return children;
}