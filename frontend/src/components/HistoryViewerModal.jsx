import React, { useEffect, useRef, useState, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min/plotly.min.js';
import { INPUT_KEY_MAP } from '../../pcb/config';

function HistoryViewerModal({ isOpen, onClose, record }) {
    const plotRef = useRef(null);
    const modalContentRef = useRef(null);
    const [leftPanelWidth, setLeftPanelWidth] = useState(350); // 左側面板初始寬度

    // 拖曳分隔線的處理邏輯
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;

        const handleMouseMove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            const minWidth = 250; // 最小寬度
            const parentWidth = modalContentRef.current ? modalContentRef.current.offsetWidth : window.innerWidth;
            const maxWidth = parentWidth - 450; // 確保右側面板至少有 400px + 分隔線寬度
            setLeftPanelWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [leftPanelWidth]);

    useEffect(() => {
        if (isOpen && record && record.output && plotRef.current) {
            // 動態讀取 CSS 變數以實現深色主題
            const rootStyles = getComputedStyle(document.documentElement);
            const textColor = rootStyles.getPropertyValue('--text').trim();
            const mutedColor = rootStyles.getPropertyValue('--muted').trim();
            const panelColor = rootStyles.getPropertyValue('--panel').trim();
            const borderColor = rootStyles.getPropertyValue('--border').trim();

            const plotData = [{
                ...record.output,
                type: 'surface',
                colorscale: 'Viridis',
            }];

            const layout = {
                title: { text: '3D Warpage Surface Plot', font: { color: textColor } },
                paper_bgcolor: panelColor,
                plot_bgcolor: panelColor,
                scene: {
                    xaxis: { title: 'X (mm)', color: mutedColor, gridcolor: borderColor },
                    yaxis: { title: 'Y (mm)', color: mutedColor, gridcolor: borderColor },
                    zaxis: { title: 'Z (mm)', color: mutedColor, gridcolor: borderColor },
                    // 手動設定長寬比以防止圖形被壓扁，並適度拉伸 Z 軸讓翹曲更明顯
                    aspectmode: 'manual',
                    aspectratio: {
                        x: 1, y: 1, z: 0.4
                    }
                },
                margin: { l: 0, r: 0, b: 0, t: 40 },
            };

            Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });
        } else if (plotRef.current) {
            Plotly.purge(plotRef.current);
        }

        // 監聽圖表容器大小變化，並觸發重繪以保持長寬比
        const resizeObserver = new ResizeObserver(() => {
            if (plotRef.current && plotRef.current.querySelector('.js-plotly-plot')) {
                Plotly.relayout(plotRef.current, {});
            }
        });

        if (plotRef.current) {
            resizeObserver.observe(plotRef.current);
        }

        return () => {
            if (plotRef.current) {
                resizeObserver.unobserve(plotRef.current);
            }
        }
    }, [isOpen, record]);

    const handleExportInputs = () => {
        if (!record || !record.inputs) {
            alert("No input parameters to export.");
            return;
        }
        try {
            const jsonString = JSON.stringify(record.inputs, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            // 為了檔名安全，將紀錄名稱中的非英數字元替換為底線
            const safeName = record.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.href = url;
            link.download = `params_${safeName}_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export parameters failed:", error);
            alert("An error occurred while exporting parameters.");
        }
    };

    if (!isOpen || !record) {
        return null;
    }

    // Determine if this is AI Design type (no 3D plot)
    const isAIDesignType = ['Substrate AI Parameter Design', 'Substrate AI 參數設計'].includes(record?.analysisType);
    const modalWidth = isAIDesignType ? '800px' : '90vw';
    const modalMaxWidth = isAIDesignType ? '800px' : '1600px';

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div ref={modalContentRef} className="modal-content wide" onClick={e => e.stopPropagation()} style={{ width: modalWidth, maxWidth: modalMaxWidth }}>
                <div className="modal-header">
                    <div>
                        <h2>{record.name}</h2>
                        <p className="modal-subtitle">{record.analysisType}</p>
                    </div>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>

                <div className="history-viewer-body" style={{ display: 'flex' }}>
                    <div className="history-inputs-panel" style={{
                        width: isAIDesignType ? '50%' : `${leftPanelWidth}px`,
                        flexShrink: 0,
                        paddingRight: isAIDesignType ? '16px' : 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>

                        {/* Warpage Prediction Result Display */}
                        {['Substrate Warpage Co-Analysis', 'Substrate 翹曲協同分析'].includes(record.analysisType) && record.result && typeof record.result.warpage_um !== 'undefined' && (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)',
                                border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
                                borderRadius: '12px'
                            }}>
                                <h4 style={{
                                    marginBottom: '8px',
                                    color: 'var(--muted)',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: 500
                                }}>Predicted Warpage</h4>
                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: 'var(--accent)',
                                    lineHeight: 1.1
                                }}>
                                    {record.result.warpage_um.toFixed(2)}
                                    <span style={{ fontSize: '16px', fontWeight: 500, marginLeft: '2px', opacity: 0.85 }}>μm</span>
                                </div>
                            </div>
                        )}

                        {/* AI Parameter Design Target Display */}
                        {['Substrate AI Parameter Design', 'Substrate AI 參數設計'].includes(record.analysisType) && (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px'
                            }}>
                                <h4 style={{
                                    marginBottom: '8px',
                                    color: 'var(--muted)',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: 500
                                }}>Target Allowable Warpage</h4>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 600,
                                    color: 'var(--text)'
                                }}>
                                    {record.inputs.target_warpage}
                                    <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '2px', opacity: 0.7 }}>μm</span>
                                </div>
                            </div>
                        )}

                        {/* Notes Display */}
                        {record.notes && (
                            <div style={{
                                background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <h4 style={{
                                    marginBottom: '10px',
                                    color: 'var(--muted)',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: 500
                                }}>Notes</h4>
                                <p style={{
                                    whiteSpace: 'pre-wrap',
                                    margin: 0,
                                    fontSize: '13px',
                                    color: 'var(--text)',
                                    lineHeight: 1.5
                                }}>
                                    {record.notes}
                                </p>
                            </div>
                        )}

                        {/* Input Parameters Card */}
                        <div style={{
                            background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px',
                            maxHeight: isAIDesignType ? '320px' : '400px',
                            overflow: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'sticky', top: 0, background: 'inherit', paddingBottom: '4px' }}>
                                <h4 style={{
                                    color: 'var(--text)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    margin: 0
                                }}>Input Parameters</h4>
                                <button className="btn ghost" onClick={handleExportInputs} style={{
                                    padding: '6px 12px',
                                    fontSize: '11px'
                                }}>Download</button>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '8px 12px',
                                alignItems: 'baseline',
                                fontSize: '12px'
                            }}>
                                {Object.entries(record.inputs).map(([key, value]) => {
                                    const label = INPUT_KEY_MAP[key] || key;

                                    // Convert special values and truncate long arrays
                                    let displayValue = String(value);
                                    if (key === 'activeTab') {
                                        displayValue = value === 'convex' ? 'Convex' : 'Concave';
                                    } else if (key.endsWith('_preset') && value === '') {
                                        displayValue = 'Manual Input';
                                    } else if (key === 'sbthk_vals' || key === 'material_vals') {
                                        // Truncate long array values
                                        const maxLen = 50;
                                        if (displayValue.length > maxLen) {
                                            displayValue = displayValue.substring(0, maxLen) + '...';
                                        }
                                    }

                                    return (
                                        <React.Fragment key={key}>
                                            <span style={{
                                                justifySelf: 'end',
                                                color: 'var(--muted)',
                                                fontSize: '11px',
                                                whiteSpace: 'nowrap'
                                            }}>{label}:</span>
                                            <span style={{
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                fontSize: '12px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {displayValue}
                                            </span>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Resize divider - only show for Warpage Analysis */}
                    {!isAIDesignType && (
                        <div
                            onMouseDown={handleMouseDown}
                            style={{
                                width: '8px',
                                cursor: 'col-resize',
                                backgroundColor: 'var(--border)',
                                margin: '0 8px',
                                flexShrink: 0
                            }}
                        ></div>
                    )}

                    {/* Right panel - only show for Warpage Analysis (with 3D plot) */}
                    {!isAIDesignType && (
                        <div className="history-plot-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            {/* Warpage Prediction 3D Plot */}
                            {['Substrate Warpage Co-Analysis', 'Substrate 翹曲協同分析'].includes(record.analysisType) && (
                                <>
                                    <h3>3D Preview</h3>
                                    <div ref={plotRef} style={{ width: '100%', height: '450px', minHeight: '450px' }}></div>
                                </>
                            )}
                        </div>
                    )}

                    {/* AI Parameter Design Result - shown inline below input parameters */}
                    {isAIDesignType && record.result && (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0 16px',
                            borderLeft: '1px solid var(--border)'
                        }}>
                            <h3 style={{ marginBottom: '16px' }}>Design Result</h3>
                            <div className="modal-result-display" style={{
                                marginBottom: '24px',
                                padding: '24px',
                                textAlign: 'center',
                                background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)',
                                border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
                                borderRadius: '12px'
                            }}>
                                <h4 style={{ marginBottom: '8px', color: 'var(--muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Achieved Warpage</h4>
                                <div className="value" style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>{record.result.achieved_warpage_um.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: 500 }}>μm</span></div>
                            </div>

                            <h4 style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '14px' }}>Recommended Parameters</h4>
                            <div className="summary-list" style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '14px 24px',
                                alignItems: 'baseline',
                                background: 'var(--card)',
                                padding: '20px 24px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)'
                            }}>
                                {record.result.best_parameters.tool_height !== null && record.result.best_parameters.tool_height !== undefined && (
                                    <React.Fragment>
                                        <strong style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Tool Height:</strong>
                                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{record.result.best_parameters.tool_height.toFixed(3)} mm</span>
                                    </React.Fragment>
                                )}
                                <strong style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Magnet Count:</strong>
                                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{record.result.best_parameters.magnet}</span>
                                <strong style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Jig Thickness:</strong>
                                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{record.result.best_parameters.jig.toFixed(1)} mm</span>
                                <strong style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Jig Center Hole:</strong>
                                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{record.result.best_parameters.b1}x{record.result.best_parameters.w1} mm²</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dialog-actions">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default HistoryViewerModal;
