import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import usePOSStore from './store/posStore';

const MainApp = () => {
  const initSocket = usePOSStore(state => state.initSocket);
  
  React.useEffect(() => {
    initSocket();
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MainApp />);
