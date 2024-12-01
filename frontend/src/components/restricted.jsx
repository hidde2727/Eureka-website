import { useUserData } from '../utils/data_fetching.jsx';

export default function Restricted({children, to, notLoggedIn}) {
    const { userData, isFetching, sessionSet } = useUserData();
    
    if(notLoggedIn && !sessionSet) return children;
    if(notLoggedIn) return;

    if(!sessionSet || isFetching) return;
    if(to != undefined && userData[to] == false) return;

    return children;
}