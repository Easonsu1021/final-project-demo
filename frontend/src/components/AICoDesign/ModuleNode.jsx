import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// �ʺA���o Lucide Icon �ե�
const getLucideIcon = (iconName, props = {}) => {
    const Icon = LucideIcons[iconName];
    if (!Icon) return null;
    return <Icon size={20} strokeWidth={1.5} {...props} />;
};

const ModuleNode = memo(({ data, selected }) => {
    const { t, language } = useLanguage();

    const getVendorClass = (vendor) => {
        switch (vendor) {
            case 'syn': return 'vendor-syn';
            case 'zuk': return 'vendor-zuk';
            case 'ans': return 'vendor-ans';
            case 'inp': return 'vendor-inp';
            default: return '';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'running': return 'status-running';
            case 'completed': return 'status-completed';
            case 'error': return 'status-error';
            default: return 'status-idle';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'running': return <LucideIcons.Loader2 size={14} className="spin" />;
            case 'completed': return <LucideIcons.Check size={14} />;
            case 'error': return <LucideIcons.X size={14} />;
            default: return null;
        }
    };

    // Get translated module name based on language
    const getModuleName = () => {
        if (language === 'en') {
            // For English, use the desc field (which is already English)
            return data.desc || data.name;
        }
        // For Chinese, use the name field
        return data.name;
    };

    return (
        <div className={`module-node ${getVendorClass(data.vendor)} ${getStatusClass(data.status)} ${selected ? 'selected' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className="module-handle"
            />

            <div className="module-header">
                <span className="module-icon">
                    {getLucideIcon(data.icon)}
                </span>
                <span className="module-name">{getModuleName()}</span>
                {data.status && data.status !== 'idle' && (
                    <span className={`module-status ${getStatusClass(data.status)}`}>
                        {getStatusIcon(data.status)}
                    </span>
                )}
            </div>

            <div className="module-desc">{data.desc}</div>

            {/* Custom Parameter Fields for Demo Flow */}
            {data.id === 'substrate-ai-param-design' && (
                <div className="module-params">
                    <div className="param-row">
                        <label>Target</label>
                        <select className="param-input" defaultValue="convex">
                            <option value="convex">Convex</option>
                            <option value="concave">Concave</option>
                        </select>
                    </div>
                </div>
            )}

            {data.id === 'ml-warpage-predictor' && (
                <div className="module-params">
                    <div className="param-row">
                        <label>Substrate (mm)</label>
                        <input className="param-input" type="number" value={data.displayParams?.['Substrate (mm)'] ?? 55} readOnly />
                    </div>
                    <div className="param-row">
                        <label>Copper (%)</label>
                        <input className="param-input" type="number" value={data.displayParams?.['Copper (%)'] ?? 38} readOnly />
                    </div>
                    <div className="param-row">
                        <label>Jig (mm)</label>
                        <input className="param-input" type="number" value={data.displayParams?.['Jig (mm)'] ?? 0.75} readOnly />
                    </div>
                </div>
            )}

            {data.id === 'smart-param-optimizer' && (
                <div className="module-params">
                    <div className="param-row">
                        <label>Optimization</label>
                        <span className="param-value">Auto-tune</span>
                    </div>
                    <div className="param-row">
                        <label>Constrain</label>
                        <span className="param-value">Yield &gt; 95%</span>
                    </div>
                </div>
            )}

            <div className="module-footer">
                <span className={`vendor-badge ${data.vendor}`}>
                    {data.vendor === 'syn' ? 'Synopsys' :
                        data.vendor === 'zuk' ? 'InPack.AI' :
                            data.vendor === 'ans' ? 'Ansys' :
                                data.vendor === 'inp' ? 'AI Module' : data.vendor}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="module-handle"
            />
        </div>
    );
});

ModuleNode.displayName = 'ModuleNode';

export default ModuleNode;
