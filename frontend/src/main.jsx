import React from 'react';
import ReactDOM from 'react-dom';

import Sidebar from './sidebar.jsx';
import PageManager from './pages/page_manager.jsx';

export default function App() {

  

  return (
    <div className="split-window seperator">
      <Sidebar />
      <PageManager />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);