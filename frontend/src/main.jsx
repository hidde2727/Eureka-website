import { StrictMode, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GetWindowParam, PushWindowParam } from './utils/utils.jsx';

import Sidebar from './sidebar.jsx';
import PageManager from './pages/page_manager.jsx';

import '../public/index.css';

const queryClient = new QueryClient();

export default function App() {
  const [currentWindow, setWindow] = useState(GetWindowParam('window', 'home'));
  PushWindowParam('window', currentWindow);

  return (
    <QueryClientProvider client={queryClient}>
      <div id="body" className="split-window seperator">
        <Sidebar currentWindow={currentWindow} setWindow={setWindow} />
        <PageManager currentWindow={currentWindow} />
      </div>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);