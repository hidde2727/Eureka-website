import { lazy } from 'react';

import Home from './home.jsx';
import Inspiration from './inspiration.jsx';
import Projects from './projects.jsx';
import Suggestions from './suggestions.jsx';

const SuggestionManagement = lazy(() => { import('./management/'); })

export default function PageManager() {

}