import React, { useEffect, useRef, useState, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min/plotly.min.js';
import { INPUT_KEY_MAP } from '../../pcb/config';

function ComparisonViewerModal({ isOpen, onClose, records }) {
    const plot1Ref = useRef(null);
    const plot2Ref = useRef(null);
    const modalRef = useRef(null);

    // --- State for resizing ---
    const [size, setSize] = useState({ width: 900, height: 750 }); // [新功能] 增加預設大小並啟用縮放
    const [isResizing, setIsResizing] = useState(false);

    // Use refs for drag properties to avoid re-renders during drag
    const dragStartPos = useRef({ x: 0, y: 0 });
    const dragStartSize = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (!isOpen || records.length < 2) return;

        const plotRecord = (plotRef, record) => {
            if (!plotRef.current) return;
            Plotly.purge(plotRef.current);

            if (record && record.output) {
                const rootStyles = getComputedStyle(document.documentElement);
                const textColor = rootStyles.getPropertyValue('--text').trim();
                const mutedColor = rootStyles.getPropertyValue('--muted').trim();
                const borderColor = rootStyles.getPropertyValue('--border').trim();

                const plotData = [{ ...record.output, type: 'surface', colorscale: 'Viridis' }];
                const layout = {
                    title: { text: record.name, font: { color: textColor, size: 14 }, y: 0.95 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    scene: {
                        camera: { eye: { x: 1.8, y: 1.8, z: 0.8 } },
                        xaxis: { title: 'X', color: mutedColor, gridcolor: borderColor, titlefont: { size: 10 }, tickfont: { size: 8 } },
                        yaxis: { title: 'Y', color: mutedColor, gridcolor: borderColor, titlefont: { size: 10 }, tickfont: { size: 8 } },
                        zaxis: { title: 'Z', color: mutedColor, gridcolor: borderColor, titlefont: { size: 10 }, tickfont: { size: 8 } },
                    },
                    margin: { l: 0, r: 0, b: 0, t: 30 },
                };
                Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });
            }
        };

        plotRecord(plot1Ref, records[0]);
        plotRecord(plot2Ref, records[1]);

        // [修正] 當視窗大小改變時，通知 Plotly 一起縮放
        if (modalRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                if (plot1Ref.current) Plotly.Plots.resize(plot1Ref.current);
                if (plot2Ref.current) Plotly.Plots.resize(plot2Ref.current);
            });
            resizeObserver.observe(modalRef.current);
            return () => resizeObserver.disconnect();
        }

    }, [isOpen, records]); // 移除 size 依賴，由 ResizeObserver 處理

    // --- [修正] Resizing Logic ---
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        if (modalRef.current) {
            const modalRect = modalRef.current.getBoundingClientRect();
            dragStartSize.current = { width: modalRect.width, height: modalRect.height };
        }
    };

    const handleResizeMouseMove = useCallback((e) => {
        if (!isResizing) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setSize({
            width: Math.max(700, dragStartSize.current.width + dx), // 最小寬度
            height: Math.max(600, dragStartSize.current.height + dy), // 最小高度
        });
    }, [isResizing]);

    const handleResizeMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // [修正] 使用 useEffect 在全域掛載/卸載事件監聽器
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

    if (!isOpen || records.length < 2) return null;

    const [record1, record2] = records;

    // 結合兩筆紀錄的所有參數鍵，並去重
    const allKeys = [...new Set([...Object.keys(record1.inputs), ...Object.keys(record2.inputs)])];

    const renderValue = (value) => {
        if (value === undefined || value === null) return <span style={{ color: 'var(--muted)' }}>N/A</span>;
        return String(value);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                ref={modalRef}
                className="modal-content resizable"
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    maxWidth: '95vw',
                    maxHeight: '95vh'
                }}
                onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Compare Analysis Records</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {/* [新功能] 3D 渲染圖比較區塊 */}
                <div className="comparison-plots">
                    <div className="plot-wrapper">
                        {record1.output
                            ? <div ref={plot1Ref} style={{ width: '100%', height: '300px' }}></div>
                            : <div className="plot-placeholder"><h3>{record1.name}</h3><p>No 3D plot data available</p></div>
                        }
                    </div>
                    <div className="plot-wrapper">
                        {record2.output
                            ? <div ref={plot2Ref} style={{ width: '100%', height: '300px' }}></div>
                            : <div className="plot-placeholder"><h3>{record2.name}</h3><p>No 3D plot data available</p></div>
                        }
                    </div>
                </div>
                <div className="comparison-container">
                    <div className="comparison-grid">
                        {/* Headers */}
                        <div className="comparison-header">Parameter</div>
                        <div className="comparison-header" style={{ textAlign: 'left' }}>{record1.name}</div>
                        <div className="comparison-header" style={{ textAlign: 'left' }}>{record2.name}</div>

                        {/* Parameters */}
                        {allKeys.map(key => {
                            const value1 = record1.inputs[key];
                            const value2 = record2.inputs[key];
                            const isDifferent = String(value1) !== String(value2);

                            return (
                                <React.Fragment key={key}>
                                    <div className="comparison-label">{INPUT_KEY_MAP[key] || key}</div>
                                    <div className={`comparison-value ${isDifferent ? 'highlight' : ''}`}>{renderValue(value1)}</div>
                                    <div className={`comparison-value ${isDifferent ? 'highlight' : ''}`}>{renderValue(value2)}</div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
                <div className="dialog-actions">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
                {/* [新功能] 縮放控制點 */}
                <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
            </div>
        </div>
    );
}

export default ComparisonViewerModal;