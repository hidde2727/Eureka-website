import Home from './home.jsx';
import Projects from './projects.jsx';
import Inspiration from './inspiration.jsx';
import Files from './files.jsx';
import Suggestions from './suggestions.jsx';

export default function PageManager(props) {
    return (
        <div>
            <Home isActive={ props.currentWindow == 'home' } />
            <Projects isActive={ props.currentWindow == 'projects' } />
            <Inspiration isActive={ props.currentWindow == 'inspiration' } />
            <Files isActive={ props.currentWindow == 'files' } />
            <Suggestions isActive={ props.currentWindow == 'suggestions' } />
        </div>
    );
}