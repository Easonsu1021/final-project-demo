import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// --- SVG Icons for Toolbar ---
const SystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

function Toolbar({ searchTerm, onSearchChange, onShowAddModal }) {
  const { t } = useLanguage();

  return (
    <div className="toolbar">
      <div className="title">
        <SystemIcon />
        {t('toolbar.title')}
      </div>
      <div className="search">
        <input
          id="search"
          placeholder={t('toolbar.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="white" opacity=".6"></circle>
          <path d="M20 20L16 16" stroke="white" opacity=".6"></path>
        </svg>
      </div>
      <button className="btn ghost" id="btn-new" onClick={onShowAddModal}>
        <PlusIcon />
        {t('toolbar.addStep')}
      </button>
    </div>
  );
}

export default Toolbar;
