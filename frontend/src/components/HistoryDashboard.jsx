import React, { useState, useEffect } from 'react';
import HistoryViewerModal from './HistoryViewerModal';
import ComparisonViewerModal from './ComparisonViewerModal';
import { INPUT_KEY_MAP } from '../../pcb/config';
import { useLanguage } from '../contexts/LanguageContext';

const HistoryDashboard = () => {
    const { t } = useLanguage();
    const [history, setHistory] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilterTab, setActiveFilterTab] = useState('all');
    const [sortKey, setSortKey] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [comparisonSelection, setComparisonSelection] = useState([]);
    const [isComparisonModeActive, setIsComparisonModeActive] = useState(false);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        try {
            const storedHistory = JSON.parse(localStorage.getItem('warpage-history') || '[]');
            setHistory(storedHistory);
        } catch (error) {
            console.error("Failed to read or parse history:", error);
        }
    }, []);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'warpage-history') {
                try {
                    const updatedHistory = JSON.parse(event.newValue || '[]');
                    setHistory(updatedHistory);
                } catch (error) {
                    console.error("Failed to parse updated history:", error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleDelete = (id) => {
        if (window.confirm(t('history.confirmDelete'))) {
            const updatedHistory = history.filter(record => record.id !== id);
            setHistory(updatedHistory);
            localStorage.setItem('warpage-history', JSON.stringify(updatedHistory));
        }
    };

    const handleView = (record) => {
        setSelectedRecord(record);
    };

    const handleSelectForComparison = (e, id) => {
        if (e.target.checked) {
            if (comparisonSelection.length < 2) {
                setComparisonSelection([...comparisonSelection, id]);
            } else {
                alert(t('history.maxCompareWarning'));
                e.target.checked = false;
            }
        } else {
            setComparisonSelection(comparisonSelection.filter(selectedId => selectedId !== id));
        }
    };

    const handleStartComparison = () => {
        if (comparisonSelection.length === 2) {
            setIsComparisonModalOpen(true);
        }
    };

    const handleEnterComparisonMode = () => {
        setIsComparisonModeActive(true);
    };

    const handleCancelComparison = () => {
        setIsComparisonModeActive(false);
        setComparisonSelection([]);
    };

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection(key === 'timestamp' ? 'desc' : 'asc');
        }
    };

    const filterTabs = [
        { id: 'all', name: t('history.allTab') },
        // Support both English (new) and Chinese (legacy) analysisType values
        { id: 'warpage', name: t('history.warpageAnalysisTab'), matches: ['Substrate Warpage Co-Analysis', 'Substrate 翹曲協同分析'] },
        { id: 'aidesign', name: t('history.aiParamDesignTab'), matches: ['Substrate AI Parameter Design', 'Substrate AI 參數設計'] },
    ];

    const processedHistory = history
        .filter(record => {
            if (activeFilterTab === 'all') return true;
            // Find the active filter tab and check if record.analysisType matches any of its 'matches' values
            const activeTab = filterTabs.find(tab => tab.id === activeFilterTab);
            if (activeTab && activeTab.matches) {
                return activeTab.matches.includes(record.analysisType);
            }
            return record.analysisType === activeFilterTab;
        }).filter(record => {
            const term = searchTerm.toLowerCase();
            const nameMatch = record.name.toLowerCase().includes(term);
            const notesMatch = record.notes ? record.notes.toLowerCase().includes(term) : false;
            return nameMatch || notesMatch;
        }).sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    const totalPages = Math.ceil(processedHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedHistory = processedHistory.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (history.length === 0) {
        return (
            <div className="history-dashboard-panel">
                <h3>{t('history.title')}</h3>
                <p>{t('history.emptyMessage')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="history-dashboard-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h3>{t('history.title')}</h3>
                        <div className="tab-group" style={{ marginBottom: 0, paddingBottom: 0 }}>
                            {filterTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`btn ghost ${activeFilterTab === tab.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveFilterTab(tab.id);
                                        setCurrentPage(1);
                                    }}>
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {isComparisonModeActive ? (
                            <>
                                <button className="btn" onClick={handleStartComparison} disabled={comparisonSelection.length !== 2}>
                                    {t('history.confirmCompare')} ({comparisonSelection.length}/2)
                                </button>
                                <button className="btn ghost" onClick={handleCancelComparison}>
                                    {t('common.cancel')}
                                </button>
                            </>
                        ) : (
                            <button className="btn ghost" onClick={handleEnterComparisonMode}>
                                {t('history.compareRecords')}
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder={t('history.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ padding: '8px 12px', width: '260px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                    </div>
                </div>

                <div className="history-list">
                    <table>
                        <thead>
                            <tr>
                                {isComparisonModeActive && <th style={{ width: '40px' }}></th>}
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    {t('history.recordName')} {sortKey === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th onClick={() => handleSort('lane')} style={{ cursor: 'pointer' }}>
                                    {t('history.flowChannel')} {sortKey === 'lane' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th onClick={() => handleSort('vendor')} style={{ cursor: 'pointer' }}>
                                    {t('history.vendor')} {sortKey === 'vendor' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th>{t('history.analysisType')}</th>
                                <th>{t('history.predictionResult')}</th>
                                <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>
                                    {t('history.saveTime')} {sortKey === 'timestamp' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th>{t('history.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedHistory.map(record => (
                                <tr key={record.id}>
                                    {isComparisonModeActive && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                onChange={(e) => handleSelectForComparison(e, record.id)}
                                                checked={comparisonSelection.includes(record.id)}
                                            />
                                        </td>
                                    )}
                                    <td>{record.name}</td>
                                    <td>
                                        {record.lane && <span className="tag pcb-lane-tag">{record.lane}</span>}
                                    </td>
                                    <td>
                                        {record.vendor && <span className="tag inp-tag">{record.vendor}</span>}
                                    </td>
                                    <td>{record.analysisType || 'N/A'}</td>
                                    <td className="result-cell">
                                        <div className="tooltip-container">
                                            {(() => {
                                                // Support both English (new) and Chinese (legacy) values
                                                const isAIDesign = ['Substrate AI Parameter Design', 'Substrate AI 參數設計'].includes(record.analysisType);
                                                const isWarpageAnalysis = ['Substrate Warpage Co-Analysis', 'Substrate 翹曲協同分析'].includes(record.analysisType);

                                                if (isAIDesign && record.result?.achieved_warpage_um !== undefined) {
                                                    return `${t('history.achieved')}: ${record.result.achieved_warpage_um.toFixed(2)} μm`;
                                                }
                                                if (isWarpageAnalysis && record.result?.warpage_um !== undefined) {
                                                    return `${t('history.predicted')}: ${record.result.warpage_um.toFixed(2)} μm`;
                                                }
                                                return 'N/A';
                                            })()}
                                            <div className="tooltip">
                                                <div className="tooltip-header">{t('history.detailedParams')}</div>
                                                <div className="tooltip-content">
                                                    {Object.entries(record.inputs || {}).map(([key, value]) => (
                                                        <div key={key} className="tooltip-item">
                                                            <strong>{INPUT_KEY_MAP[key] || key}:</strong>
                                                            <span>{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(record.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</td>
                                    <td className="actions">
                                        <button className="btn ghost" onClick={() => handleView(record)}>{t('common.view')}</button>
                                        <button className="btn ghost danger" onClick={() => handleDelete(record.id)}>{t('common.delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {processedHistory.length === 0 && searchTerm && (
                        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px' }}>
                            {t('history.noMatchingRecords', { term: searchTerm })}
                        </p>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="pagination-controls">
                    <span>
                        {processedHistory.length > 0
                            ? t('history.showing', { start: startIndex + 1, end: startIndex + paginatedHistory.length, total: processedHistory.length })
                            : t('history.totalRecords', { count: 0 })
                        }
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn ghost" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            {t('history.prevPage')}
                        </button>
                        <span>{t('history.pageOf', { current: currentPage, total: totalPages })}</span>
                        <button className="btn ghost" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
                            {t('history.nextPage')}
                        </button>
                    </div>
                </div>
            </div>

            <HistoryViewerModal
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />

            <ComparisonViewerModal
                isOpen={isComparisonModalOpen}
                onClose={() => setIsComparisonModalOpen(false)}
                records={history.filter(r => comparisonSelection.includes(r.id))}
            />
        </>
    );
};

export default HistoryDashboard;
