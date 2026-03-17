import React, { useState, useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min/plotly.min.js';
import SharedFormFields from './SharedFormFields';
import { presets, initialPredictorFormData } from './config';
import { PREDICTION_API_BASE_URL } from './apiConfig';

// --- SVG Icons for Actions ---
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);


function WarpagePredictor() {
    // 使用 state 管理表單資料、當前 Tab、載入狀態、結果和錯誤訊息
    const [activeTab, setActiveTab] = useState('convex');
    const [formData, setFormData] = useState(initialPredictorFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [recordName, setRecordName] = useState('');
    const [recordNotes, setRecordNotes] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let updated = false;
        const newFormData = { ...initialPredictorFormData };
        
        ['substrate', 'copper', 'jig'].forEach(key => {
            if (params.has(key)) {
                newFormData[key] = params.get(key);
                updated = true;
            }
        });
        
        if (updated) {
            setFormData(newFormData);
        }
        
        if (params.get('autorun') === 'true') {
            setTimeout(() => {
                const formToUse = updated ? newFormData : initialPredictorFormData;
                runPredictionLogic(formToUse, 'convex'); // Default to convex
            }, 100);
        }
    }, []);

    // 使用 ref 來獲取繪圖的 DOM 節點
    const surfaceRef = useRef(null);
    const heatmapRef = useRef(null);
    const fileInputRef = useRef(null);

    // 副作用 Hook：當 results.plot_data 變更時，重新繪製圖表
    useEffect(() => {
        const surfaceEl = surfaceRef.current;
        const heatmapEl = heatmapRef.current;
        if (!surfaceEl || !heatmapEl) return;

        if (results && results.plot_data) {
            const rootStyles = getComputedStyle(document.documentElement);
            const textColor = rootStyles.getPropertyValue('--text').trim() || '#e5e7eb';
            const mutedColor = rootStyles.getPropertyValue('--muted').trim() || '#94a3b8';
            const panelColor = rootStyles.getPropertyValue('--panel').trim() || '#0b1220';
            const borderColor = rootStyles.getPropertyValue('--border').trim() || '#1f2937';

            const { x, y, z } = results.plot_data;
            const hasData = x?.length && y?.length && z?.length;
            const numericZ = (z || []).flat().filter((v) => Number.isFinite(v));
            if (!hasData || !numericZ.length) {
                Plotly.purge(surfaceEl);
                Plotly.purge(heatmapEl);
                return;
            }

            const surfaceTrace = {
                x,
                y,
                z,
                type: 'surface',
                colorscale: 'Viridis',
                showscale: true,
                colorbar: { title: 'μm' },
                hovertemplate: 'X: %{x:.2f} mm<br>Y: %{y:.2f} mm<br>Z: %{z:.3f} mm<extra></extra>'
            };

            const surfaceLayout = {
                title: { text: 'Warpage 3D Surface', font: { color: textColor, size: 16 } },
                paper_bgcolor: panelColor,
                plot_bgcolor: panelColor,
                scene: {
                    xaxis: { title: 'X (mm)', color: mutedColor, gridcolor: borderColor },
                    yaxis: { title: 'Y (mm)', color: mutedColor, gridcolor: borderColor },
                    zaxis: { title: 'Z (mm)', color: mutedColor, gridcolor: borderColor },
                    aspectmode: 'manual',
                    aspectratio: { x: 1, y: 1, z: 0.2 }
                },
                margin: { l: 0, r: 0, b: 0, t: 40 }
            };

            const surfaceConfig = {
                responsive: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['toImage']
            };

            const colorScale = [
                [0, '#0b1f3b'],
                [0.2, '#1f4c86'],
                [0.4, '#2f87c1'],
                [0.6, '#5dd1c1'],
                [0.8, '#f0c36c'],
                [1, '#f1663d'],
            ];

            const heatmapTrace = {
                x,
                y,
                z,
                type: 'heatmap',
                zsmooth: 'best',
                colorscale: colorScale,
                hoverongaps: false,
                connectgaps: false,
                colorbar: {
                    title: 'μm',
                    thickness: 12,
                    len: 0.7,
                    outlinewidth: 0
                },
                hovertemplate: 'X: %{x:.2f} mm<br>Y: %{y:.2f} mm<br>Z: %{z:.3f} mm<extra></extra>'
            };

            const contourTrace = {
                x,
                y,
                z,
                type: 'contour',
                xaxis: 'x',
                yaxis: 'y',
                ncontours: 14,
                showscale: false,
                connectgaps: false,
                contours: {
                    coloring: 'lines',
                    showlabels: true,
                    labelfont: { size: 10, color: textColor }
                },
                line: { color: 'rgba(255,255,255,0.6)', width: 1 },
                hoverinfo: 'skip'
            };

            const heatmapLayout = {
                title: { text: 'Warpage Heatmap', font: { color: textColor, size: 16 } },
                paper_bgcolor: panelColor,
                plot_bgcolor: panelColor,
                margin: { l: 60, r: 60, b: 60, t: 40 },
                xaxis: {
                    title: { text: 'X (mm)', font: { color: mutedColor } },
                    color: mutedColor,
                    zeroline: false,
                    showgrid: false,
                    tickformat: '.1f',
                    showline: true,
                    linecolor: borderColor,
                    linewidth: 1
                },
                yaxis: {
                    title: { text: 'Y (mm)', font: { color: mutedColor } },
                    color: mutedColor,
                    zeroline: false,
                    showgrid: false,
                    tickformat: '.1f',
                    showline: true,
                    linecolor: borderColor,
                    linewidth: 1,
                    scaleanchor: 'x',
                    scaleratio: 1
                },
                hovermode: 'closest',
                dragmode: 'pan',
                transition: { duration: 160, easing: 'cubic-in-out' },
                font: { color: textColor }
            };

            const heatmapConfig = {
                responsive: true,
                scrollZoom: true,
                displaylogo: false,
                doubleClick: false,
                modeBarButtonsToRemove: ['toImage', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian']
            };

            Plotly.purge(surfaceEl);
            Plotly.purge(heatmapEl);
            Plotly.newPlot(surfaceEl, [surfaceTrace], surfaceLayout, surfaceConfig);
            Plotly.newPlot(heatmapEl, [heatmapTrace, contourTrace], heatmapLayout, heatmapConfig);
        } else {
            Plotly.purge(surfaceEl);
            Plotly.purge(heatmapEl);
        }

        return () => {
            if (surfaceEl) Plotly.purge(surfaceEl);
            if (heatmapEl) Plotly.purge(heatmapEl);
        };
    }, [results]);

    // [新功能] 匯出參數
    const handleExportParams = () => {
        try {
            const jsonString = JSON.stringify(formData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `warpage_predictor_params_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export parameters failed:", error);
            alert("An error occurred while exporting parameters.");
        }
    };

    // [新功能] 匯入參數
    const handleImportParams = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                const requiredKeys = ['tool_height', 'magnet', 'jig', 'sbthk_vals'];
                const hasRequiredKeys = requiredKeys.every(key => key in importedData);

                if (!hasRequiredKeys) {
                    throw new Error("The imported JSON file format is invalid, missing required parameter keys.");
                }
                setFormData(importedData);
                alert("Parameters imported successfully!");
            } catch (error) {
                alert(`Error importing parameters: ${error.message}`);
            } finally {
                event.target.value = null; // 重置 file input
            }
        };
        reader.readAsText(file);
    };
    // 統一處理表單輸入變更
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // 處理預設值選擇
    const handlePresetChange = (e) => {
        const { id, value } = e.target;
        const type = id.includes('sbthk') ? 'sbthk' : 'material';
        const valsId = `${type}_vals`;

        let newVals = '';
        if (value && presets[type][value]) {
            newVals = presets[type][value].join(', ');
        }

        setFormData(prev => ({
            ...prev,
            [id]: value,
            [valsId]: newVals
        }));
    };

    // 獨立出預測邏輯
    const runPredictionLogic = async (currentFormData, currentTab = activeTab) => {
        setIsLoading(true);
        setError('');
        setResults(null);

        try {
            const sbthk_vals = currentFormData.sbthk_vals.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            const material_vals = currentFormData.material_vals.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

            if (sbthk_vals.length !== 33) {
                throw new Error(`Substrate layers must be 33 values, you entered ${sbthk_vals.length}.`);
            }
            if (material_vals.length !== 7) {
                throw new Error(`Material parameters must be 7 values, you entered ${material_vals.length}.`);
            }

            const payload = {
                magnet: parseInt(currentFormData.magnet),
                jig: parseFloat(currentFormData.jig),
                copper: parseInt(currentFormData.copper),
                b1: parseInt(currentFormData.b1),
                w1: parseInt(currentFormData.w1),
                substrate: parseInt(currentFormData.substrate),
                sbthk_vals: sbthk_vals,
                material_vals: material_vals,
            };

            if (currentTab === 'convex') {
                payload.tool_height = parseFloat(currentFormData.tool_height);
            }

            const response = await fetch(`${PREDICTION_API_BASE_URL}/predict/${currentTab}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`API Error: ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            setResults(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 處理表單提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        await runPredictionLogic(formData, activeTab);
    };

    // [新流程] 開啟儲存 Modal
    const handleOpenSaveModal = () => {
        const tabName = activeTab === 'convex' ? 'Convex' : 'Concave';
        const defaultRecordName = `Warpage Co-Analysis (${tabName})`;
        setRecordName(defaultRecordName);
        setRecordNotes(''); // 重置備註
        setIsSaveModalOpen(true);
    };

    // [新流程] 確認儲存
    const handleConfirmSave = () => {
        if (!recordName.trim()) {
            alert('Record name cannot be empty.');
            return;
        }

        const newRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: recordName.trim(),
            notes: recordNotes.trim(), // 新增備註欄位
            analysisType: 'Substrate Warpage Co-Analysis',
            lane: 'PCB', // 新增Flow Channel標籤
            vendor: 'inPack.AI', // 新增供應商標籤
            result: { warpage_um: results.warpage_um },
            inputs: formData,
            output: results.plot_data
        };

        try {
            const history = JSON.parse(localStorage.getItem('warpage-history') || '[]');
            history.unshift(newRecord);
            localStorage.setItem('warpage-history', JSON.stringify(history));
            setIsSaveModalOpen(false);
            alert(`Record "${recordName.trim()}" saved successfully!`);
        } catch (storageError) {
            console.error("Unable to save history to localStorage:", storageError);
            alert("An error occurred while saving the record.");
        }
    };

    // [新流程] 取消儲存
    const handleCancelSave = () => {
        setIsSaveModalOpen(false);
    };


    return (
        <div className="warpage-container">
            <div className="panel">
                <h2>Parameter Settings</h2>
                <div className="tab-group">
                    <button
                        className={`btn ghost ${activeTab === 'convex' ? 'active' : ''}`}
                        onClick={() => setActiveTab('convex')}
                    >
                        Warpage Prediction (Convex)
                    </button>
                    <button
                        className={`btn ghost ${activeTab === 'concave' ? 'active' : ''}`}
                        onClick={() => setActiveTab('concave')}
                    >
                        Warpage Prediction (Concave)
                    </button>
                </div>

                <form className="form vertical" onSubmit={handleSubmit}>
                    {/* 使用 CSS class 來控制顯示/隱藏以實現動畫 */}
                    <label
                        htmlFor="tool_height"
                        className={`form-field-collapsible ${activeTab !== 'convex' ? 'hidden' : ''}`}
                    >
                        <span>Tool Height (mm)</span>
                        <input type="number" id="tool_height" value={formData.tool_height} onChange={handleInputChange} step="0.001" />
                    </label>
                    <label htmlFor="magnet">
                        <span>Magnet Count</span>
                        <input type="number" id="magnet" value={formData.magnet} onChange={handleInputChange} min="10" max="40" />
                    </label>
                    <label htmlFor="jig">
                        <span>Jig Thickness (mm)</span>
                        <select id="jig" value={formData.jig} onChange={handleInputChange}>
                            <option value="0.5">0.5</option>
                            <option value="1.0">1.0</option>
                            <option value="1.5">1.5</option>
                            <option value="2.0">2.0</option>
                        </select>
                    </label>
                    <label htmlFor="copper">
                        <span>Copper Ratio (%)</span>
                        <select id="copper" value={formData.copper} onChange={handleInputChange}>
                            <option value="100">100</option><option value="90">90</option><option value="85">85</option>
                            <option value="80">80</option><option value="75">75</option><option value="70">70</option>
                        </select>
                    </label>
                    <label htmlFor="b1">
                        <span>Jig Center Hole B1 (mm)</span>
                        <input type="number" id="b1" value={formData.b1} onChange={handleInputChange} min="40" max="60" />
                    </label>
                    <label htmlFor="w1">
                        <span>Jig Center Hole W1 (mm)</span>
                        <input type="number" id="w1" value={formData.w1} onChange={handleInputChange} min="47" max="67" />
                    </label>
                    <SharedFormFields
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handlePresetChange={handlePresetChange}
                        substrateField="substrate"
                        copperField="copper"
                    />
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? 'Predicting...' : 'Start Prediction'}
                        </button>
                        <button type="button" className="btn ghost" onClick={handleExportParams}>
                            <ExportIcon />
                            Export Params
                        </button>
                        <button type="button" className="btn ghost" onClick={() => fileInputRef.current.click()}>
                            <ImportIcon />
                            Import Params
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImportParams}
                    />
                </form>
            </div>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="result-panel">
                    <h2>Prediction Results</h2>
                    <div className="result-summary">
                        {isLoading && <p>Calculating, please wait...</p>}
                        {error && <p style={{ color: 'var(--bad)' }}>Error: {error}</p>}
                        {!isLoading && !error && !results && <p style={{ color: 'var(--muted)' }}>Please enter parameters and click "Start Prediction".</p>}
                        {results && (
                            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Predicted Warpage Card */}
                                <div style={{
                                    padding: '28px',
                                    textAlign: 'center',
                                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent)',
                                    border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
                                    borderRadius: '14px'
                                }}>
                                    <h4 style={{
                                        marginBottom: '12px',
                                        color: 'var(--muted)',
                                        fontSize: '13px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px',
                                        fontWeight: 500
                                    }}>Predicted Warpage</h4>
                                    <div style={{
                                        fontSize: '42px',
                                        fontWeight: 'bold',
                                        color: 'var(--accent)',
                                        lineHeight: 1.1
                                    }}>
                                        {results.warpage_um.toFixed(2)}
                                        <span style={{ fontSize: '20px', fontWeight: 500, marginLeft: '4px', opacity: 0.85 }}>μm</span>
                                    </div>
                                </div>

                                {/* Input Parameters Summary Card */}
                                <div>
                                    <h4 style={{
                                        marginBottom: '14px',
                                        color: 'var(--text)',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>Input Parameters Summary</h4>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'auto 1fr',
                                        gap: '12px 20px',
                                        alignItems: 'center',
                                        background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                                        padding: '18px 22px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {Object.entries(results.input_summary).map(([key, value]) => (
                                            <React.Fragment key={key}>
                                                <span style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>{key}:</span>
                                                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{String(value)}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button onClick={handleOpenSaveModal} className="btn" style={{
                                    padding: '14px 28px',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}>
                                    Save Record
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="plot-shell">
                    <div className="plot-main" ref={surfaceRef}></div>
                </div>
                <div className="plot-shell">
                    <div className="plot-main" ref={heatmapRef}></div>
                </div>
            </div>

            {/* [新流程] 自訂的儲存紀錄 Modal */}
            {isSaveModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Save Analysis Record</h2>
                        </div>
                        <div className="form vertical" style={{ padding: '20px' }}>
                            <label htmlFor="recordName">
                                <span>Record Name</span>
                                <input
                                    type="text"
                                    id="recordName"
                                    value={recordName}
                                    onChange={(e) => setRecordName(e.target.value)}
                                    autoFocus
                                />
                            </label>
                            <label htmlFor="recordNotes">
                                <span>Notes (Optional)</span>
                                <textarea
                                    id="recordNotes"
                                    value={recordNotes}
                                    onChange={(e) => setRecordNotes(e.target.value)}
                                    rows="3"
                                />
                            </label>
                        </div>
                        <div className="dialog-actions">
                            <button className="btn ghost" onClick={handleCancelSave}>Cancel</button>
                            <button className="btn" onClick={handleConfirmSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WarpagePredictor;
