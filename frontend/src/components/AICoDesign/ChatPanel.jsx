import React, { useState, useRef, useEffect } from 'react';
import {
    Send, Bot, User, Cpu, Package, Thermometer,
    Lightbulb, Zap, Box, Activity, Brain, CircuitBoard,
    CheckCircle, Play, ArrowRight, FileDown
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Lucide icon SVG paths (stroke-based, 24x24 viewBox)
const ICON_PATHS = {
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    circuitboard: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3"/><circle cx="9" cy="9" r="2"/><path d="M7 21v-4a2 2 0 0 1 2-2h4"/><circle cx="15" cy="15" r="2"/>',
    thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    filedown: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>'
};

// Generate inline SVG icon
const createIconSvg = (iconName) => {
    const path = ICON_PATHS[iconName];
    if (!path) return '';
    return `<svg class="chat-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
};

// Simple Markdown parser with table support
const parseMarkdown = (text) => {
    if (!text) return '';
    
    let html = text
        .replace(/::(\w+)::/g, (match, iconName) => createIconSvg(iconName))
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^• /gm, '<span class="bullet">•</span> ')
        .replace(/^---$/gm, '<hr class="chat-divider" />');

    // Handle Markdown Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<div class="chat-table-wrapper"><table>';
            }
            const cells = line.split('|').filter(c => c !== '').map(c => c.trim());
            
            // Check if it is the alignment row (--- | ---)
            if (line.includes('---')) {
                continue; 
            }
            
            tableHtml += '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</table></div>';
                processedLines.push(tableHtml);
                tableHtml = '';
            }
            processedLines.push(line);
        }
    }
    if (inTable) {
        tableHtml += '</table></div>';
        processedLines.push(tableHtml);
    }

    return processedLines.join('<br />');
};

function ChatPanel({ messages, onSendMessage, isProcessing, selectedNode }) {
    const { t, language } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage?.showSuggestions) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !isProcessing) {
            onSendMessage(inputValue.trim());
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const quickCommands = [
        { label: t('aiCoDesign.chat.socDesign'), prompt: language === 'en' ? 'Build SoC design verification flow with logic synthesis, physical synthesis and timing analysis' : '建立 SoC 設計驗證流程，包含邏輯綜合、實體綜合和時序分析', icon: Cpu },
        { label: t('aiCoDesign.chat.advancedPackage'), prompt: language === 'en' ? 'I need to design an advanced packaging flow, from C4 Bump to package routing verification' : '我需要設計一個先進封裝流程，從 C4 Bump 到封裝佈線驗證', icon: Package },
        { label: t('aiCoDesign.chat.thermalManagement'), prompt: language === 'en' ? 'Help me build thermal management analysis flow with thermal simulation and warpage prediction' : '幫我建立熱管理分析流程，包含熱模擬和翹曲預測', icon: Thermometer },
    ];

    const suggestionCommands = [
        { label: t('aiCoDesign.chat.socDesign'), prompt: language === 'en' ? 'Build SoC design verification flow' : '建立 SoC 設計驗證流程', icon: Cpu },
        { label: t('aiCoDesign.chat.3dicChiplet'), prompt: language === 'en' ? 'Build 3DIC Chiplet integration flow' : '建立 3DIC Chiplet 整合流程', icon: Box },
        { label: t('aiCoDesign.chat.advancedPackage'), prompt: language === 'en' ? 'I need to design advanced packaging flow' : '我需要設計先進封裝流程', icon: Package },
        { label: t('aiCoDesign.chat.siPiAnalysis'), prompt: language === 'en' ? 'I need signal integrity and power integrity analysis' : '我需要進行信號完整性和電源完整性分析', icon: Activity },
        { label: t('aiCoDesign.chat.thermalManagement'), prompt: language === 'en' ? 'Help me build thermal management analysis flow' : '幫我建立熱管理分析流程', icon: Thermometer },
        { label: t('aiCoDesign.chat.aiOptimization'), prompt: language === 'en' ? 'Use AI modules for design parameter optimization' : '使用 AI 模組進行設計參數最佳化', icon: Brain },
    ];

    const handleQuickCommand = (prompt) => {
        if (!isProcessing) {
            setShowSuggestions(false);
            onSendMessage(prompt);
        }
    };

    // Get translated module name for selected node
    const getModuleName = (node) => {
        if (!node?.data) return '';
        if (language === 'en') {
            const translated = t(`aiCoDesign.modules.${node.data.id}`);
            return translated !== `aiCoDesign.modules.${node.data.id}` ? translated : node.data.desc;
        }
        return node.data.name;
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <div className="chat-header-icon">
                    <Bot size={20} />
                </div>
                <div className="chat-header-info">
                    <h3>{t('aiCoDesign.chat.title')}</h3>
                    <span className="chat-status">
                        {isProcessing ? t('aiCoDesign.chat.thinking') : t('aiCoDesign.chat.ready')}
                    </span>
                </div>
            </div>

            {/* Selected node info */}
            {selectedNode && (
                <div className="selected-node-info">
                    <div className="node-info-header">
                        <span className="node-info-icon">{selectedNode.data?.icon}</span>
                        <span className="node-info-title">{t('aiCoDesign.chat.selectedModule')}</span>
                    </div>
                    <div className="node-info-name">{getModuleName(selectedNode)}</div>
                    <div className="node-info-desc">{selectedNode.data?.desc}</div>
                    <div className="node-info-hint">{t('aiCoDesign.chat.deleteHint')}</div>
                </div>
            )}

            {/* Quick commands - only show on initial state */}
            {messages.length <= 1 && (
                <div className="quick-commands">
                    <div className="quick-commands-title">{t('aiCoDesign.chat.quickStart')}</div>
                    <div className="quick-commands-list">
                        {quickCommands.map((cmd, index) => {
                            const IconComponent = cmd.icon;
                            return (
                                <button
                                    key={index}
                                    className="quick-command-btn"
                                    onClick={() => handleQuickCommand(cmd.prompt)}
                                    disabled={isProcessing}
                                >
                                    <IconComponent size={14} />
                                    {cmd.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Message list */}
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="message-avatar">
                            {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                        </div>
                        <div className="message-content">
                            <div
                                className="message-text"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                            />
                            
                            {/* Render Custom Action Results */}
                            {msg.actions && msg.actions.length > 0 && (
                                <div className="action-results-container">
                                    {msg.actions.map((act, actIdx) => {
                                        if (act.action === 'param_sweep' && act.results) {
                                            return (
                                                <div key={actIdx} className="param-sweep-table-container" style={{ marginTop: '12px', background: 'var(--bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                            <tr>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>Jig (mm)</th>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>翹曲 (μm)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {act.results.map((row, rIdx) => (
                                                                <tr key={rIdx} style={{ background: row.jig === act.best_jig ? 'rgba(74, 222, 128, 0.1)' : 'transparent' }}>
                                                                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{row.jig.toFixed(2)}</td>
                                                                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: row.jig === act.best_jig ? 'bold' : 'normal', color: row.jig === act.best_jig ? 'var(--success)' : 'inherit' }}>{row.warpage.toFixed(1)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}

                            {msg.showDownloadOption && (
                                <div className="download-option">
                                    <button className="download-report-btn" onClick={() => alert(language === 'en' ? 'Generating report... (Demo)' : '報告生成中...（Demo 模擬）')}>
                                        <FileDown size={16} />
                                        <span>{t('aiCoDesign.chat.downloadReport')}</span>
                                        <span className="file-type">PDF</span>
                                    </button>
                                    <p className="download-hint">{t('aiCoDesign.chat.downloadHint')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Processing indicator */}
                {isProcessing && (
                    <div className="chat-message assistant">
                        <div className="message-avatar">
                            <Bot size={18} />
                        </div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && !isProcessing && (
                <div className="chat-suggestions">
                    <div className="chat-suggestions-header">
                        <Lightbulb size={14} />
                        <span>{t('aiCoDesign.chat.youCanTry')}</span>
                    </div>
                    <div className="chat-suggestions-list">
                        {suggestionCommands.map((cmd, index) => {
                            const IconComponent = cmd.icon;
                            return (
                                <button
                                    key={index}
                                    className="chat-suggestion-btn"
                                    onClick={() => handleQuickCommand(cmd.prompt)}
                                >
                                    <IconComponent size={14} />
                                    <span>{cmd.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Input area */}
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <div className="chat-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('aiCoDesign.chat.inputPlaceholder')}
                        disabled={isProcessing}
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={!inputValue.trim() || isProcessing}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="chat-input-hint">
                    {t('aiCoDesign.chat.inputHint')}
                </div>
            </form>
        </div>
    );
}

export default ChatPanel;
