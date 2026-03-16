import React, { useState } from 'react';
import '../../pcb/ComponentLibrary.css';
import { useLanguage } from '../contexts/LanguageContext';

// --- SVG Icon for Component Placeholder ---
const ComponentPlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', opacity: 0.3 }}>
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

// --- Sample Data for Component Library ---
const sampleComponents = [
  { id: 'c1', name: 'UHD BGA Package (25x25)', category: 'Packages', type: 'BGA' },
  { id: 'c2', name: 'DDR5 Memory Module', category: 'Memory', type: 'DIMM' },
  { id: 'c3', name: 'PCIe Gen5 Connector', category: 'Connectors', type: 'Edge' },
  { id: 'c4', name: 'High-speed Coaxial Cable', category: 'Cables', type: 'Coaxial' },
  { id: 'c5', name: 'RF Filter Component', category: 'RF', type: 'Filter' },
  { id: 'c6', name: 'Power Management IC (PMIC)', category: 'ICs', type: 'PMIC' },
  { id: 'c7', name: 'Fan-out WLP Template', category: 'Packages', type: 'WLP' },
  { id: 'c8', name: '0402 Capacitor Model', category: 'Passives', type: 'Capacitor' },
];

const filterCategories = [
  { id: 'all', name: 'All' },
  { id: 'Packages', name: 'Packages' },
  { id: 'Memory', name: 'Memory' },
  { id: 'Connectors', name: 'Connectors' },
  { id: 'ICs', name: 'ICs' },
];

function Library() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredComponents = activeCategory === 'all'
    ? sampleComponents
    : sampleComponents.filter(c => c.category === activeCategory);

  return (
    <div className="panel">
      <div className="library-content-wrapper">
        <aside className="library-content-sidebar">
          <div className="filter-group">
            <h3>{t('library.categories')}</h3>
            <ul>
              {filterCategories.map(cat => (
                <li key={cat.id}>
                  <button
                    className={activeCategory === cat.id ? 'active' : ''}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="library-grid-main">
          <div className="library-toolbar">
            <span>{t('library.componentsFound', { count: filteredComponents.length })}</span>
          </div>
          <div className="library-grid">
            {filteredComponents.map(component => (
              <div key={component.id} className="component-card">
                <div className="card-thumbnail">
                  <ComponentPlaceholderIcon />
                </div>
                <div className="card-name">{component.name}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Library;