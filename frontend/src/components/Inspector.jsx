import React, { useState, useEffect } from 'react';
import Metrics from './Metrics';
import { useLanguage } from '../contexts/LanguageContext';

// --- SVG Icons for Actions ---
const ApplyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

function Inspector({ selectedCard, onRequestUpdate, onRequestDelete, cards }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (selectedCard) {
      // Convert titleKey to title for display if needed
      const cardData = { ...selectedCard };
      if (cardData.titleKey && !cardData.title) {
        cardData.title = t(cardData.titleKey);
      }
      // When editing, we store the actual title value, not the key
      setFormData(cardData);
    } else {
      setFormData(null);
    }
  }, [selectedCard, t]);

  if (!selectedCard || !formData) {
    return (
      <aside className="panel" id="inspector">
        <h2>{t('inspector.title')}</h2>
        <div id="empty-inspector" style={{ color: 'var(--muted)', fontSize: '13px' }}>
          {t('inspector.emptyMessage')}
        </div>
        <div className="sp"></div>
        <Metrics cards={cards} />
      </aside>
    );
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace('f-', '');
    setFormData({ ...formData, [key]: value });
  };

  const handleApply = () => {
    onRequestUpdate(formData);
  };

  const handleDelete = () => {
    onRequestDelete(selectedCard.id);
  };

  return (
    <aside className="panel" id="inspector">
      <h2>{t('inspector.title')}</h2>
      <form className="form" id="form" onSubmit={(e) => e.preventDefault()}>
        <label>
          {t('inspector.name')}
          <input id="f-title" value={formData.title || ''} onChange={handleChange} />
        </label>
        <label>
          {t('inspector.vendor')}
          <select id="f-vendor" value={formData.vendor || 'syn'} onChange={handleChange}>
            <option value="syn">Synopsys</option>
            <option value="zuk">InPack.AI</option>
            <option value="ans">Ansys</option>
          </select>
        </label>
        <label>
          {t('inspector.status')}
          <select id="f-status" value={formData.status || 'todo'} onChange={handleChange}>
            <option value="todo">{t('inspector.statusOptions.todo')}</option>
            <option value="ok">{t('inspector.statusOptions.ok')}</option>
            <option value="risk">{t('inspector.statusOptions.risk')}</option>
          </select>
        </label>
        <label>
          {t('inspector.flowChannel')}
          <select id="f-lane" value={formData.lane || 'SoC'} onChange={handleChange}>
            <option value="SoC">SoC</option>
            <option value="3DIC">3DIC</option>
            <option value="Package">Package</option>
            <option value="PCB">PCB</option>
          </select>
        </label>
        <textarea
          id="f-notes"
          placeholder={t('inspector.notesPlaceholder')}
          value={formData.notes || ''}
          onChange={handleChange}
        ></textarea>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: '8px' }}>
          <button className="btn" type="button" onClick={handleApply}>
            <ApplyIcon />
            {t('common.apply')}
          </button>
          <button className="btn ghost" type="button" onClick={handleDelete}>
            <DeleteIcon />
            {t('common.delete')}
          </button>
        </div>
      </form>
      <div className="sp"></div>
      <Metrics cards={cards} />
    </aside>
  );
}

export default Inspector;
