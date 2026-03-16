import React from 'react';
import Lane from './Lane';
import { useLanguage } from '../contexts/LanguageContext';

const LANES = ['SoC', '3DIC', 'Package', 'PCB', 'Thermal'];

function FlowCanvas({ cards, onSelectCard, selectedCardId, recentlyAddedCardId }) {
  const { t } = useLanguage();

  return (
    <section className="panel glow" id="flow-panel">
      <h2>{t('flowCanvas.title')}</h2>
      <div className="ribbon">Synopsys · InPack.AI · Ansys</div>
      <div className="lanes" id="lanes">
        {LANES.map(lane => (
          <Lane
            key={lane}
            title={lane}
            cards={cards.filter(card => card.lane === lane)}
            onSelectCard={onSelectCard}
            selectedCardId={selectedCardId}
            recentlyAddedCardId={recentlyAddedCardId}
          />
        ))}
      </div>
      <div className="footer">{t('flowCanvas.footerHint')}</div>
    </section>
  );
}

export default FlowCanvas;
