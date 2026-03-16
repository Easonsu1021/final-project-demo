import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languageOptions } from '../i18n';

// Initial fake settings data
const initialSettings = {
  projectRoot: '/Users/chen/projects/chip_designs/',
  libraryPath: '/Users/chen/neuroshine/studio-react/src/components/library.jsx',
  edaToolCommand: 'vcs -f ${filelist} -R -l ${logfile}',
  apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
};

function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState(initialSettings);
  const [saveStatus, setSaveStatus] = useState('');

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
    setSaveStatus('');
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log('Saving settings:', settings);
    setSaveStatus(t('settings.savedSuccess'));
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm(t('settings.confirmReset'))) {
      setSettings(initialSettings);
      setSaveStatus(t('settings.resetSuccess'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <section className="panel">
      <h2>{t('settings.title')}</h2>
      <p style={{ color: 'var(--muted)', marginTop: '-5px', marginBottom: '25px' }}>
        {t('settings.description')}
      </p>

      <form onSubmit={handleSave}>
        {/* Appearance Section */}
        <div className="settings-group">
          <h3>{t('settings.appearance')}</h3>
          <div className="theme-lock">
            <span className="theme-pill">{t('settings.darkMode')}</span>
            <span className="input-hint">{t('settings.darkModeHint')}</span>
          </div>
        </div>

        {/* Language Section */}
        <div className="settings-group">
          <h3>{t('settings.language')}</h3>
          <div className="form vertical">
            <label htmlFor="language-select">
              <span>{t('settings.language')}</span>
              <select
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                style={{ marginTop: '8px' }}
              >
                {languageOptions.map(option => (
                  <option key={option.code} value={option.code}>
                    {option.nativeName}
                  </option>
                ))}
              </select>
              <p className="input-hint">{t('settings.languageHint')}</p>
            </label>
          </div>
        </div>

        {/* File System Paths Section */}
        <div className="settings-group">
          <h3>{t('settings.fileSystemPaths')}</h3>
          <div className="form vertical">
            <label htmlFor="projectRoot">
              <span>{t('settings.projectRoot')}</span>
              <div className="input-with-button">
                <input
                  type="text"
                  id="projectRoot"
                  value={settings.projectRoot}
                  onChange={handleInputChange}
                  placeholder={t('settings.projectRootPlaceholder')}
                />
                <button type="button" className="btn ghost" disabled>{t('common.browse')}</button>
              </div>
            </label>
          </div>
        </div>

        {/* EDA Tool Configuration Section */}
        <div className="settings-group">
          <h3>{t('settings.edaToolCommand')}</h3>
          <div className="form vertical">
            <label htmlFor="edaToolCommand">
              <span>{t('settings.defaultSimCommand')}</span>
              <input
                type="text"
                id="edaToolCommand"
                value={settings.edaToolCommand}
                onChange={handleInputChange}
                placeholder={t('settings.simCommandPlaceholder')}
              />
              <p className="input-hint">{t('settings.simCommandHint')}</p>
            </label>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="settings-group">
          <h3>{t('settings.apiKeys')}</h3>
          <div className="form vertical">
            <label htmlFor="apiKey">
              <span>{t('settings.apiKey')}</span>
              <div className="input-with-button">
                <input
                  type="password"
                  id="apiKey"
                  value={settings.apiKey}
                  onChange={handleInputChange}
                />
                <button type="button" className="btn ghost">{t('common.testConnection')}</button>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="dialog-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
          {saveStatus && <span style={{ color: 'var(--ok)', marginRight: 'auto' }}>{saveStatus}</span>}
          <button type="button" className="btn ghost" onClick={handleReset}>{t('settings.resetToDefault')}</button>
          <button type="submit" className="btn">{t('settings.saveSettings')}</button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
