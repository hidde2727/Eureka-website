import { useRef, lazy, Suspense } from 'react';

import Home from './home.jsx';
import Projects from './projects.jsx';
import Inspiration from './inspiration.jsx';
import Files from './files.jsx';
import Suggestions from './suggestions.jsx';

const ManagementSuggestions = lazy(() => import('./management/suggestions.jsx'));
const ManagementUsers = lazy(() => import('./management/users.jsx'));
const ManagementLogs = lazy(() => import('./management/logs.jsx'));
const ManagementSettings = lazy(() => import('./management/settings.jsx'));
const ManagementProjectPopover = lazy(() => import('../popovers/management/project.jsx'));

import LoginPopover from '../popovers/login.jsx';
import PopoverContext from '../popovers/context.jsx';
import Restricted from '../components/restricted.jsx';
import Loading from '../components/loading.jsx';
import ProjectPopover from '../popovers/project.jsx';

export default function PageManager(props) {
    const loginRef = useRef();
    const projectRef = useRef();

    return (
        <div>
        <PopoverContext.Provider value={{ login:loginRef, project:projectRef }}>
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

            <LoginPopover ref={loginRef} />
            <Restricted notLoggedIn={true}>
                <ProjectPopover ref={projectRef} />
            </Restricted>
            <Restricted>
                <Suspense><ManagementProjectPopover ref={projectRef} /></Suspense>
            </Restricted>
            
        </PopoverContext.Provider>
        </div>
    );
}