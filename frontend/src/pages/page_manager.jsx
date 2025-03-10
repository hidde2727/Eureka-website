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
const ManagementInspirationPopover = lazy(() => import('../popovers/management/inspiration.jsx'));

import LoginPopover from '../popovers/login.jsx';
import PopoverContext from '../popovers/context.jsx';
import Restricted from '../components/restricted.jsx';
import Loading from '../components/loading.jsx';
import ProjectPopover from '../popovers/project.jsx';
import InspirationPopover from '../popovers/inspiration.jsx';

export default function PageManager({currentWindow, setCurrentWindow}) {
    const loginRef = useRef();
    const projectRef = useRef();
    const inspirationRef = useRef();

    return (
        <div className="content-windows">
        <PopoverContext.Provider value={{ login:loginRef, project:projectRef, inspiration: inspirationRef }}>
            <Home isActive={ currentWindow == 'home' } setCurrentWindow={setCurrentWindow} />
            <Projects isActive={ currentWindow == 'projects' } />
            <Inspiration isActive={ currentWindow == 'inspiration' } />
            <Files isActive={ currentWindow == 'files' } />
            <Suggestions isActive={ currentWindow == 'suggestions' } />

            <Restricted to="watch_logs">
                <Suspense fallback={<div style={ currentWindow == 'management-logs' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementLogs isActive={ currentWindow == 'management-logs' } />
                </Suspense>
            </Restricted>
            <Restricted to="modify_users">
                <Suspense fallback={<div style={ currentWindow == 'management-users' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementUsers isActive={ currentWindow == 'management-users' } />
                </Suspense>
            </Restricted>
            <Restricted>
                <Suspense fallback={<div style={ currentWindow == 'management-suggestions' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementSuggestions isActive={ currentWindow == 'management-suggestions' } />
                </Suspense>
                <Suspense fallback={<div style={ currentWindow == 'management-settings' ? {display: 'block'} : {display: 'none'} }><Loading /></div>}>
                    <ManagementSettings isActive={ currentWindow == 'management-settings' } />
                </Suspense>
            </Restricted>

            <LoginPopover ref={loginRef} />
            <Restricted notLoggedIn={true}>
                <ProjectPopover ref={projectRef} />
                <InspirationPopover ref={inspirationRef} />
            </Restricted>
            <Restricted>
                <Suspense><ManagementProjectPopover ref={projectRef} /></Suspense>
                <Suspense><ManagementInspirationPopover ref={inspirationRef} /></Suspense>
            </Restricted>
            
        </PopoverContext.Provider>
        </div>
    );
}