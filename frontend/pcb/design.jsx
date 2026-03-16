import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import WarpageDesigner from './WarpageDesigner.jsx';
import '../src/index.css'; // 引入全域樣式

function App() {
  // [新功能] 為獨立視窗加入主題管理
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return <WarpageDesigner />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
