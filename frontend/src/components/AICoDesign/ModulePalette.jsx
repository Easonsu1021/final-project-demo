import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// 動態取得 Lucide Icon 組件
const getLucideIcon = (iconName, props = {}) => {
    const Icon = LucideIcons[iconName];
    if (!Icon) return null;
    return <Icon size={18} strokeWidth={1.5} {...props} />;
};

const ChevronIcon = ({ isOpen }) => (
    <LucideIcons.ChevronDown
        size={16}
        style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
        }}
    />
);

function ModuleItem({ module }) {
    const { t, language } = useLanguage();

    const onDragStart = (event, module) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(module));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Get translated module name or use default
    const moduleName = language === 'en'
        ? (t(`aiCoDesign.modules.${module.id}`) !== `aiCoDesign.modules.${module.id}`
            ? t(`aiCoDesign.modules.${module.id}`)
            : module.desc)
        : module.name;

    return (
        <div className={`palette-module ${module.vendor}`} draggable onDragStart={(e) => onDragStart(e, module)}>
            <span className="palette-module-icon">
                {getLucideIcon(module.icon)}
            </span>
            <div className="palette-module-info">
                <span className="palette-module-name">{moduleName}</span>
                <span className="palette-module-desc">{module.desc}</span>
            </div>
        </div>
    );
}

function ModulePalette({ modules }) {
    const { t } = useLanguage();
    const [expandedCategories, setExpandedCategories] = useState(
        modules.reduce((acc, cat) => ({ ...acc, [cat.category]: true }), {})
    );
    const [searchTerm, setSearchTerm] = useState('');

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const filteredModules = modules.map(category => ({
        ...category,
        modules: category.modules.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.desc.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.modules.length > 0);

    return (
        <div className="module-palette">
            <div className="palette-header">
                <h3>{t('aiCoDesign.palette.title')}</h3>
                <span className="palette-hint">{t('aiCoDesign.palette.hint')}</span>
            </div>
            <div className="palette-search">
                <LucideIcons.Search size={16} className="palette-search-icon" />
                <input
                    type="text"
                    placeholder={t('aiCoDesign.palette.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="palette-categories">
                {filteredModules.map((category) => (
                    <div key={category.category} className="palette-category">
                        <button className="category-header" onClick={() => toggleCategory(category.category)}>
                            <span className="category-icon">
                                {getLucideIcon(category.categoryIcon, { size: 16 })}
                            </span>
                            <span className="category-name">{category.category}</span>
                            <span className="category-count">{category.modules.length}</span>
                            <ChevronIcon isOpen={expandedCategories[category.category]} />
                        </button>
                        {expandedCategories[category.category] && (
                            <div className="category-modules">
                                {category.modules.map((module) => (
                                    <ModuleItem key={module.id} module={module} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="palette-footer">
                <div className="vendor-legend">
                    <span className="legend-item syn">Synopsys</span>
                    <span className="legend-item zuk">InPack.AI</span>
                    <span className="legend-item ans">Ansys</span>
                    <span className="legend-item inp">AI</span>
                </div>
            </div>
        </div>
    );
}

export default ModulePalette;
