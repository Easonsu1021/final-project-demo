import React, { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Card = memo(function Card({ card, onSelectCard, isSelected, isHighlighted }) {
  const { t } = useLanguage();
  const { title, titleKey, vendor, status, notes } = card;

  // Use titleKey for translation if available, otherwise use title directly
  const displayTitle = titleKey ? t(titleKey) : title;

  const vendorNameMap = {
    syn: 'Synopsys',
    zuk: 'InPack.AI',
    ans: 'Ansys'
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ok': return t('flowCanvas.statusDone');
      case 'todo': return t('flowCanvas.statusTodo');
      case 'risk': return t('flowCanvas.statusRisk');
      default: return status;
    }
  };

  const classNames = [
    'card',
    isSelected ? 'glow' : '',
    isHighlighted ? 'card-highlight' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={() => onSelectCard(card.id)}
    >
      {/* Top Tier */}
      <div className="card-title">{displayTitle}</div>

      {/* Middle Tier */}
      <div className="card-meta">
        <span className={`tag vendor-tag ${vendor}`}>{vendorNameMap[vendor] || vendor}</span>
        <span className={`tag status-tag ${status === 'ok' ? 'ok' : 'todo'}`}>{getStatusLabel(status)}</span>
      </div>

      {/* Bottom Tier */}
      {notes && <div className="card-notes">{notes}</div>}
    </div>
  );
});

export default Card;
