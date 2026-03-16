import React, { useState, useEffect, useRef } from 'react';
import SharedFormFields from './SharedFormFields';
import { presets, initialDesignerFormData } from './config';
import { DESIGN_API_BASE_URL } from './apiConfig';

// --- SVG Icons for Actions ---
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

function WarpageDesigner() {
    const [activeTab, setActiveTab] = useState('convex');
    const [formData, setFormData] = useState(initialDesignerFormData);
    const [taskStatus, setTaskStatus] = useState('idle'); // idle, submitted, polling, completed, failed
    const [statusMessage, setStatusMessage] = useState('Please set parameters and click "Start Design".');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [dots, setDots] = useState(''); // 新增 state 用於動畫省略號
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [recordName, setRecordName] = useState('');
    const [recordNotes, setRecordNotes] = useState('');

    const pollingIntervalRef = useRef(null);
    const fileInputRef = useRef(null);

    const isProcessing = taskStatus === 'submitted' || taskStatus === 'polling';

    // 副作用 Hook：在處理期間產生動畫省略號
    useEffect(() => {
        if (isProcessing) {
            const dotInterval = setInterval(() => {
                setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
            }, 600);
            return () => clearInterval(dotInterval);
        }
    }, [isProcessing]);

    // 副作用 Hook：處理 API 輪詢
    useEffect(() => {
        if (taskStatus !== 'polling' || !taskId) {
            return;
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const response = await fetch(`${DESIGN_API_BASE_URL}/design/status/${taskId}`);
                if (!response.ok) {
                    // 如果 API 回應 404 Not Found 等，也視為一種錯誤
                    throw new Error(`Status query failed: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.status === 'completed') {
                    clearInterval(pollingIntervalRef.current);
                    setResults(data.result);
                    setTaskStatus('completed');
                    setStatusMessage('AI Design Complete!');
                } else if (data.status === 'failed') {
                    clearInterval(pollingIntervalRef.current);
                    setError(data.error || 'AI design task execution failed.');
                    setTaskStatus('failed');
                }
                // 如果狀態是 'pending' 或 'running'，則不執行任何操作，等待下一次輪詢
            } catch (err) {
                clearInterval(pollingIntervalRef.current);
                setError(err.message);
                setTaskStatus('failed');
            }
        }, 3000); // 每 3 秒查詢一次

        // Cleanup function: 當元件卸載或 task 改變時，清除 interval
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [taskStatus, taskId]);

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

    // [新功能] 匯出參數
    const handleExportParams = () => {
        try {
            const jsonString = JSON.stringify(formData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `warpage_designer_params_${date}.json`;
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
                const requiredKeys = ['target_warpage', 'design_substrate', 'sbthk_vals'];
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

    // 處理表單提交
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 重置狀態
        setTaskStatus('submitted');
        setStatusMessage('AI design task submitted, starting...');
        setError('');
        setResults(null);
        setTaskId(null);
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        try {
            const sbthk_vals = formData.sbthk_vals.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            const material_vals = formData.material_vals.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

            if (sbthk_vals.length !== 33) throw new Error(`Substrate layers must be 33 values, you entered ${sbthk_vals.length}.`);
            if (material_vals.length !== 7) throw new Error(`Material parameters must be 7 values, you entered ${material_vals.length}.`);

            const payload = {
                target_warpage_um: parseFloat(formData.target_warpage),
                substrate: parseInt(formData.design_substrate),
                copper: parseInt(formData.design_copper),
                sbthk_vals: sbthk_vals,
                material_vals: material_vals,
            };

            const response = await fetch(`${DESIGN_API_BASE_URL}/design/${activeTab}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorData = { detail: `HTTP error! status: ${response.status}` };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // 如果回應不是 JSON，則使用狀態文字
                }
                throw new Error(`API Error: ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            setTaskId(data.task_id);
            setTaskStatus('polling');
            setStatusMessage('AI is searching for optimal parameter combinations, please wait... (this may take several minutes)');

        } catch (err) {
            setError(err.message);
            setTaskStatus('failed');
            // [修正] 確保 isProcessing 在此處也為 false，讓按鈕可以再次點擊
        }
    };

    // [新流程] 開啟儲存 Modal
    const handleOpenSaveModal = () => {
        const tabName = activeTab === 'convex' ? 'Convex' : 'Concave';
        const defaultRecordName = `AI Parameter Design (${tabName})`;
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
            analysisType: 'Substrate AI Parameter Design',
            lane: 'PCB', // 新增Flow Channel標籤
            vendor: 'inPack.AI', // 新增供應商標籤
            result: results,
            inputs: { ...formData, activeTab },
            output: null
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
                <h2>BGA-AI Parameter Design</h2>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '-5px', marginBottom: '15px' }}>
                    Given target allowable warpage, the model will use DQN technology to reverse-calculate suggested process parameter combinations.
                </p>
                <div className="tab-group">
                    <button className={`btn ghost ${activeTab === 'convex' ? 'active' : ''}`} onClick={() => setActiveTab('convex')}>AI Design (Convex)</button>
                    <button className={`btn ghost ${activeTab === 'concave' ? 'active' : ''}`} onClick={() => setActiveTab('concave')}>AI Design (Concave)</button>
                </div>

                <form className="form vertical" onSubmit={handleSubmit}>
                    {/* 預留位置：未來若有與 Tab 相關的欄位，可在此處加入並套用 'form-field-collapsible' class */}
                    {/* 範例: <div className={`form-field-collapsible ${activeTab !== 'convex' ? 'hidden' : ''}`}> ... </div> */}
                    <label htmlFor="target_warpage">
                        <span>Target Allowable Warpage (μm)</span>
                        <input type="number" id="target_warpage" value={formData.target_warpage} onChange={handleInputChange} step="0.1" />
                    </label>
                    <SharedFormFields
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handlePresetChange={handlePresetChange}
                        substrateField="design_substrate"
                        copperField="design_copper"
                    />
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button type="submit" className="btn" disabled={isProcessing}>
                            {isProcessing ? 'AI Designing...' : 'Start Design'}
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
            <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2>Design Results</h2>
                <div className="result-summary" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {taskStatus === 'idle' && <p className="fade-in" style={{ color: 'var(--muted)' }}>{statusMessage}</p>}
                    {isProcessing && <p className="fade-in">{statusMessage}{dots}</p>}
                    {taskStatus === 'failed' && <p className="fade-in" style={{ color: 'var(--bad)' }}>Error: {error}</p>}
                    {taskStatus === 'completed' && results && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Achieved Warpage Card */}
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
                                }}>Achieved Warpage</h4>
                                <div style={{
                                    fontSize: '42px',
                                    fontWeight: 'bold',
                                    color: 'var(--accent)',
                                    lineHeight: 1.1
                                }}>
                                    {results.achieved_warpage_um.toFixed(2)}
                                    <span style={{ fontSize: '20px', fontWeight: 500, marginLeft: '4px', opacity: 0.85 }}>μm</span>
                                </div>
                                <p style={{
                                    marginTop: '12px',
                                    color: 'var(--ok)',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}>✓ Optimization Complete</p>
                            </div>

                            {/* Recommended Parameters Card */}
                            <div>
                                <h4 style={{
                                    marginBottom: '14px',
                                    color: 'var(--text)',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}>Recommended Parameters</h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    gap: '14px 24px',
                                    alignItems: 'center',
                                    background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                                    padding: '20px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {results.best_parameters.tool_height !== null && results.best_parameters.tool_height !== undefined && (
                                        <>
                                            <span style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Tool Height:</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{results.best_parameters.tool_height.toFixed(3)} mm</span>
                                        </>
                                    )}
                                    <span style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Magnet Count:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{results.best_parameters.magnet}</span>
                                    <span style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Jig Thickness:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{results.best_parameters.jig.toFixed(1)} mm</span>
                                    <span style={{ justifySelf: 'end', color: 'var(--muted)', fontSize: '13px' }}>Jig Center Hole:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{results.best_parameters.b1}x{results.best_parameters.w1} mm²</span>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button onClick={handleOpenSaveModal} className="btn" style={{
                                marginTop: '8px',
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

export default WarpageDesigner;
