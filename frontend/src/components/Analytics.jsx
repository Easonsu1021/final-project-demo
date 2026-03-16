import React from 'react';
import HistoryDashboard from './HistoryDashboard';
import { useLanguage } from '../contexts/LanguageContext';

const MICROFLUIDIC_APP_URL = import.meta.env.VITE_MICROFLUIDIC_APP_URL || 'http://127.0.0.1:8004/static/index.html';
const ROUTING_STUDIO_URL = import.meta.env.VITE_ROUTING_STUDIO_URL || 'https://auto-routing-demo.zeabur.app/';

function Analytics() {
  const { t } = useLanguage();

  const handleLaunchWarpagePredictor = () => {
    const url = '/pcb/warpage.html';
    const windowFeatures = 'width=1280,height=850,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
  };

  const handleLaunchWarpageDesigner = () => {
    const url = '/pcb/design.html';
    const windowFeatures = 'width=1280,height=720,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
  };

  const handleLaunchAutoRoute = () => {
    const url = ROUTING_STUDIO_URL;
    const windowFeatures = 'width=1600,height=900,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
  };

  const handleLaunchMicrofluidicsLab = () => {
    const url = MICROFLUIDIC_APP_URL;
    const windowFeatures = 'width=1360,height=900,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
  };

  return (
    <>
      <section className="panel">
        <h2>{t('analytics.title')}</h2>
        <div
          className="metrics"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'stretch' }}
        >
          {/* Warpage Co-Analysis */}
          <div className="kpi" style={{ display: 'flex', flexDirection: 'column', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)' }}>
            <div className="v" style={{ fontSize: '18px', color: 'var(--text)' }}>{t('analytics.warpageCoAnalysis')}</div>
            <div className="l" style={{ flexGrow: 1, marginBottom: '12px' }}>{t('analytics.warpageCoAnalysisDesc')}</div>
            <button className="btn" onClick={handleLaunchWarpagePredictor} style={{ width: '100%' }}>
              {t('analytics.launchAnalysis')}
            </button>
          </div>

          {/* AI Parameter Design */}
          <div className="kpi" style={{ display: 'flex', flexDirection: 'column', background: 'color-mix(in srgb, var(--syn) 10%, transparent)', borderColor: 'var(--syn)' }}>
            <div className="v" style={{ fontSize: '18px', color: 'var(--text)' }}>{t('analytics.aiParamDesign')}</div>
            <div className="l" style={{ flexGrow: 1, marginBottom: '12px' }}>{t('analytics.aiParamDesignDesc')}</div>
            <button className="btn" onClick={handleLaunchWarpageDesigner} style={{ width: '100%' }}>
              {t('analytics.launchDesign')}
            </button>
          </div>

          {/* Auto Routing Studio */}
          <div className="kpi" style={{ display: 'flex', flexDirection: 'column', background: 'color-mix(in srgb, var(--ans) 10%, transparent)', borderColor: 'var(--ans)' }}>
            <div className="v" style={{ fontSize: '18px', color: 'var(--text)' }}>{t('analytics.autoRoutingStudio')}</div>
            <div className="l" style={{ flexGrow: 1, marginBottom: '12px' }}>{t('analytics.autoRoutingStudioDesc')}</div>
            <button className="btn" onClick={handleLaunchAutoRoute} style={{ width: '100%' }}>
              {t('analytics.launchRouting')}
            </button>
          </div>

          {/* Microfluidic AI Materials Lab */}
          <div className="kpi" style={{ display: 'flex', flexDirection: 'column', background: 'color-mix(in srgb, var(--zuk) 15%, transparent)', borderColor: 'var(--zuk)' }}>
            <div className="v" style={{ fontSize: '18px', color: 'var(--text)' }}>{t('analytics.microfluidicLab')}</div>
            <div className="l" style={{ flexGrow: 1, marginBottom: '12px' }}>
              {t('analytics.microfluidicLabDesc')}
            </div>
            <button className="btn" onClick={handleLaunchMicrofluidicsLab} style={{ width: '100%' }}>
              {t('analytics.launchTool')}
            </button>
          </div>
        </div>
        <div className="footer" style={{ marginTop: '16px' }}>
          {t('analytics.footerHint')}
        </div>
      </section>

      <HistoryDashboard />
    </>
  );
}

export default Analytics;
