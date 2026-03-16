import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import WarpagePredictor from './WarpagePredictor.jsx';
import '../src/index.css';

function App() {
  // 為獨立視窗加入主題管理
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return <WarpagePredictor />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
