import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Metrics({ cards }) {
  const { t } = useLanguage();
  const total = cards.length;
  const done = cards.filter(c => c.status === 'ok').length;
  const risk = cards.filter(c => c.status === 'risk').length;

  return (
    <div className="metrics">
      <div className="kpi">
        <div className="v">{total}</div>
        <div className="l">{t('metrics.totalSteps')}</div>
      </div>
      <div className="kpi">
        <div className="v">{done}</div>
        <div className="l">{t('metrics.completed')}</div>
      </div>
      <div className="kpi">
        <div className="v">{risk}</div>
        <div className="l">{t('metrics.riskBlocked')}</div>
      </div>
    </div>
  );
}

export default Metrics;
