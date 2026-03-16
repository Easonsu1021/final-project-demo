import React, { useRef, memo } from 'react';
import logoImage from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';

// --- SVG Icons for Navigation ---
const FlowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2a4 4 0 0 0 4 4h2" /><path d="M12 15v2a4 4 0 0 1-4 4H6" /><path d="M18 15h2a4 4 0 0 0 4-4V9" /><path d="M6 9H4a4 4 0 0 0-4 4v2" /><rect width="8" height="8" x="8" y="8" rx="2" /></svg>
);
const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8a6 6 0 0 0-6 0" /><path d="M12.7 14a6 6 0 0 0-6 0" /><path d="M12 18H3" /><path d="M18 12H9" /></svg>
);
const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);
// --- Icons for Quick Actions ---
const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
);

// --- Icon for Footer ---
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);

// AI Co-Design Icon
const AICoDesignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);

const Sidebar = memo(function Sidebar({ activeTab, onTabChange, onExport, onImport, onReset }) {
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  const navItems = [
    { id: 'ai-codesign', labelKey: 'sidebar.aiCoDesign', icon: <AICoDesignIcon /> },
    { id: 'flow', labelKey: 'sidebar.flowDesign', icon: <FlowIcon /> },
    { id: 'analytics', labelKey: 'sidebar.analytics', icon: <AnalyticsIcon /> },
    { id: 'library', labelKey: 'sidebar.library', icon: <LibraryIcon /> },
    { id: 'settings', labelKey: 'sidebar.settings', icon: <SettingsIcon /> },
  ];

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logoImage} alt="InPack.ai Logo" className="logo" />
        <div>
          <h1>InPack.AI</h1>
          <p style={{ fontSize: '12px', opacity: '.6', margin: '2px 0 0', lineHeight: '1.2', letterSpacing: '0.2px' }}>Co‑Design Studio</p>
        </div>
      </div>
      <div className="nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => onTabChange(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {item.icon}
            <span className="nav-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
      <div className="quick">
        <div style={{ color: 'var(--muted)', fontSize: '12px', letterSpacing: '.3px' }}>{t('sidebar.quickActions')}</div>
        <button id="btn-export" onClick={onExport}>
          <ExportIcon />
          <span className="quick-label">{t('sidebar.exportJSON')}</span>
        </button>
        <button id="btn-import" onClick={handleImportClick}>
          <ImportIcon />
          <span className="quick-label">{t('sidebar.importJSON')}</span>
        </button>
        <input
          type="file"
          id="file"
          ref={fileInputRef}
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onImport}
        />
        <button id="btn-reset" onClick={onReset}>
          <ResetIcon />
          <span className="quick-label">{t('sidebar.reset')}</span>
        </button>
      </div>
      <div className="sidebar-footer">
        <ShieldIcon />
        <span>{t('sidebar.poweredBy')} <strong>Neuroshine</strong></span>
      </div>
    </aside>
  );
});

export default Sidebar;
