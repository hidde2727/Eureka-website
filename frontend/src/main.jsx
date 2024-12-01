import { lazy, StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GetWindowParam, PushWindowParam } from './utils/utils.jsx';

import Sidebar from './sidebar.jsx';
import PageManager from './pages/page_manager.jsx';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/production').then((d) => ({
    default: d.ReactQueryDevtools,
  }))
);

import '/public/index.css';

const queryClient = new QueryClient();
export default function App() {
  const [currentWindow, setWindow] = useState(GetWindowParam('window', 'home'));
  PushWindowParam('window', currentWindow);

  const [showDevtools, setShowDevtools] = useState(false)
  useEffect(() => {
    window.toggleDevtools = () => setShowDevtools((old) => !old)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div id="body" className="split-window seperator">
        <Sidebar currentWindow={currentWindow} setWindow={setWindow} />
        <PageManager currentWindow={currentWindow} />
      </div>

      <ReactQueryDevtools initialIsOpen={false} />
      {showDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);