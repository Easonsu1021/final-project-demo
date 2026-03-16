import React, { useState, useMemo } from 'react';
import { fakeComponents } from '../../pcb/fake-components';
import '../../pcb/ComponentLibrary.css';

// 狀態標籤的樣式
const statusStyles = {
  Verified: { background: 'var(--ok)', color: 'var(--panel)' },
  'In Review': { background: 'var(--warn)', color: '#000' },
  Obsolete: { background: 'var(--bad)', color: 'var(--panel)' },
};

const ComponentCard = ({ component, onClick }) => (
  <div className="component-card" onClick={onClick}>
    <div className="card-thumbnail">
      <img src={component.thumbnailUrl} alt={component.name} />
    </div>
    <div className="card-name">{component.name}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--muted)' }}>
      <span>v{component.version}</span>
      <span style={{ padding: '2px 8px', borderRadius: '99px', ...statusStyles[component.status] }}>
        {component.status}
      </span>
    </div>
  </div>
);

const ComponentDetailModal = ({ component, onClose }) => {
    if (!component) return null;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{component.name}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <img src={component.thumbnailUrl} alt={component.name} style={{ width: '150px', height: '150px', borderRadius: '8px' }}/>
                    <div>
                        <p>{component.description}</p>
                        <p><strong>Category:</strong> {component.category}</p>
                        <p><strong>Version:</strong> {component.version}</p>
                        <p><strong>Status:</strong> <span style={{ padding: '2px 8px', borderRadius: '99px', ...statusStyles[component.status] }}>{component.status}</span></p>
                    </div>
                </div>
                <h3>Specifications</h3>
                <div className="summary-list" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                    {Object.entries(component.specs).map(([key, value]) => (
                        <React.Fragment key={key}>
                            <strong style={{ justifySelf: 'end' }}>{key}:</strong>
                            <span>{value}</span>
                        </React.Fragment>
                    ))}
                </div>
                 <div className="dialog-actions">
                    <button className="btn ghost">Download Files</button>
                    <button className="btn">Add to Project</button>
                </div>
            </div>
        </div>
    );
};


function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedComponent, setSelectedComponent] = useState(null);

  const categories = useMemo(() => 
    ['All', ...new Set(fakeComponents.map(c => c.category))]
  , []);

  const filteredComponents = useMemo(() => {
    return fakeComponents.filter(component => {
      const matchesCategory = activeCategory === 'All' || component.category === activeCategory;
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, activeCategory]);

  return (
    // [重構] 移除 library-container，使其可以被嵌入
    <>
      <div className="library-toolbar">
        <div className="search">
          <input
            type="text"
            placeholder="Search components by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {/* Search Icon SVG */}
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159L11.5 12.5L12.5 11.5L10.0159 9.30884C9.44651 9.73143 8.74016 10 8 10H6.5C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5C10 7.24016 9.73143 7.94651 9.30884 8.51587V10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
        </div>
        {/* View Toggle Buttons can be added here */}
      </div>
      <div className="library-content-wrapper">
        <aside className="library-content-sidebar">
          <div className="filter-group">
            <h3>Categories</h3>
            <ul>
              {categories.map(category => (
                <li key={category}>
                  <button
                    className={activeCategory === category ? 'active' : ''}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="library-grid-main">
          <div className="library-grid">
            {filteredComponents.map(component => (
              <ComponentCard key={component.id} component={component} onClick={() => setSelectedComponent(component)} />
            ))}
          </div>
        </main>
      </div>
      
      <ComponentDetailModal component={selectedComponent} onClose={() => setSelectedComponent(null)} />
    </>
  );
}

export default ComponentLibrary;