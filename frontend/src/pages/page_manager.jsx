import { useRef, lazy, Suspense } from 'react';

import Home from './home.jsx';
import Projects from './projects.jsx';
import Inspiration from './inspiration.jsx';
import Files from './files.jsx';
import Suggestions from './suggestions.jsx';

const ManagementSuggestions = lazy(() => import('../management/pages/suggestions.jsx'));
const ManagementUsers = lazy(() => import('../management/pages/users.jsx'));
const ManagementLogs = lazy(() => import('../management/pages/logs.jsx'));
const ManagementSettings = lazy(() => import('../management/pages/settings.jsx'));

import { LoginContext, LoginPopover } from '../management/components/login_popover.jsx';
import Restricted from '../components/restricted.jsx';
import Loading from '../components/loading.jsx';

export default function PageManager(props) {
    const ref = useRef();

    return (
        <div>
        <LoginContext.Provider value={ref}>
            <Home isActive={ props.currentWindow == 'home' } />
            <Projects isActive={ props.currentWindow == 'projects' } />
            <Inspiration isActive={ props.currentWindow == 'inspiration' } />
            <Files isActive={ props.currentWindow == 'files' } />
            <Suggestions isActive={ props.currentWindow == 'suggestions' } />

            <Restricted to="watch_logs">
                <Suspense fallback={<div style={ props.currentWindow == 'management-logs' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementLogs isActive={ props.currentWindow == 'management-logs' } />
                </Suspense>
            </Restricted>
            <Restricted to="modify_users">
                <Suspense fallback={<div style={ props.currentWindow == 'management-users' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementUsers isActive={ props.currentWindow == 'management-users' } />
                </Suspense>
            </Restricted>
            <Restricted>
                <Suspense fallback={<div style={ props.currentWindow == 'management-suggestions' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementSuggestions isActive={ props.currentWindow == 'management-suggestions' } />
                </Suspense>
                <Suspense fallback={<div style={ props.currentWindow == 'management-settings' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementSettings isActive={ props.currentWindow == 'management-settings' } />
                </Suspense>
            </Restricted>

            <LoginPopover ref={ref} />
        </LoginContext.Provider>
        </div>
    );
}