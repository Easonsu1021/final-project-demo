import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Trash2, MousePointerClick, CheckCircle, XCircle, Beaker, FileText, AlertCircle, Cpu } from 'lucide-react';
import Plotly from 'plotly.js-dist-min/plotly.min.js';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ModuleNode from './ModuleNode';
import MiniMapNode from './MiniMapNode';
import ChatPanel from './ChatPanel';
import ModulePalette from './ModulePalette';
import './AICoDesign.css';
import { executeModule, executeModules, TOOL_CONFIG } from '../../services/aiToolsAPI';
import { useLanguage } from '../../contexts/LanguageContext';
import { sendChatMessage } from '../../services/orchestrator';

const nodeTypes = {
    moduleNode: ModuleNode,
};


const EDA_MODULES = [
    {
        category: 'Substrate',
        categoryIcon: 'Layers',
        modules: [
            { id: 'substrate-defect-analysis', name: 'Substrate Defect Detection', desc: 'Substrate Defect Detection', icon: 'ScanEye', vendor: 'inp' },
            { id: 'substrate-warpage-analysis', name: 'Warpage Co-Analysis', desc: 'Warpage Co-Analysis', icon: 'TrendingUp', vendor: 'inp' },
            { id: 'substrate-ai-param-design', name: 'AI Parameter Design', desc: 'AI Parameter Design', icon: 'Sliders', vendor: 'inp' },
            { id: 'substrate-material-selection', name: 'Material Selection', desc: 'Material Selection', icon: 'Layers', vendor: 'zuk' },
        ]
    },
    {
        category: 'SoC',
        categoryIcon: 'Cpu',
        modules: [
            { id: 'logic-synthesis', name: 'Logic Synthesis', desc: 'Logic Synthesis', icon: 'Binary', vendor: 'syn' },
            { id: 'physical-synthesis', name: 'Physical Synthesis', desc: 'Physical Synthesis', icon: 'LayoutGrid', vendor: 'syn' },
            { id: 'timing-analysis', name: 'Timing Analysis', desc: 'Timing Analysis', icon: 'Clock', vendor: 'syn' },
            { id: 'power-analysis', name: 'Power Analysis', desc: 'Power Analysis', icon: 'Zap', vendor: 'syn' },
            { id: 'floorplan', name: 'Floorplanning', desc: 'Floorplanning', icon: 'Grid2x2', vendor: 'syn' },
            { id: 'place-route', name: 'Place & Route', desc: 'Place & Route', icon: 'GitBranch', vendor: 'syn' },
        ]
    },
    {
        category: '3DIC',
        categoryIcon: 'Box',
        modules: [
            { id: '3dic-planning', name: 'Chiplet Co-Planning', desc: 'Chiplet Co-Planning', icon: 'Target', vendor: 'syn' },
            { id: 'chiplet-partition', name: 'Chiplet Partitioning', desc: 'Chiplet Partitioning', icon: 'Split', vendor: 'syn' },
            { id: 'interposer-routing', name: 'Interposer Routing', desc: 'Interposer Routing', icon: 'Network', vendor: 'zuk' },
            { id: 'ubump-placement', name: 'Micro Bump Placement', desc: 'Micro Bump Placement', icon: 'CircleDot', vendor: 'syn' },
            { id: 'tsv-design', name: 'Through-Silicon Via', desc: 'Through-Silicon Via', icon: 'ArrowDownUp', vendor: 'zuk' },
            { id: '3dic-compiler', name: '3DIC Compiler', desc: '3DIC Compiler', icon: 'FileCode2', vendor: 'syn' },
        ]
    },
    {
        category: 'Package',
        categoryIcon: 'Package',
        modules: [
            { id: 'c4-bump', name: 'C4 Bump Mapping', desc: 'C4 Bump Mapping', icon: 'Grid3x3', vendor: 'zuk' },
            { id: 'pin-assignment', name: 'Pin Assignment', desc: 'Pin Assignment', icon: 'MapPin', vendor: 'zuk' },
            { id: 'ball-map', name: 'Ball Grid Array', desc: 'Ball Grid Array', icon: 'Circle', vendor: 'zuk' },
            { id: 'package-layout', name: 'Package Layout', desc: 'Package Layout', icon: 'SquareDashedBottom', vendor: 'zuk' },
            { id: 'package-routing', name: 'Package Routing', desc: 'Package Routing', icon: 'Route', vendor: 'zuk' },
            { id: 'sip-integration', name: 'System-in-Package', desc: 'System-in-Package', icon: 'BoxSelect', vendor: 'zuk' },
        ]
    },
    {
        category: 'PCB',
        categoryIcon: 'CircuitBoard',
        modules: [
            { id: 'pcb-design', name: 'PCB Layout Design', desc: 'PCB Layout Design', icon: 'SquareStack', vendor: 'zuk' },
            { id: 'pcb-stackup', name: 'PCB Stackup', desc: 'PCB Stackup', icon: 'Layers3', vendor: 'zuk' },
            { id: 'pkg-pcb-cosim', name: 'Package-PCB Co-Sim', desc: 'Package-PCB Co-Sim', icon: 'Combine', vendor: 'ans' },
            { id: 'soc-sip-pcb-analysis', name: 'Full System Analysis', desc: 'Full System Analysis', icon: 'FileSearch', vendor: 'ans' },
            { id: 'si-analysis', name: 'Signal Integrity', desc: 'Signal Integrity', icon: 'Activity', vendor: 'ans' },
            { id: 'pi-analysis', name: 'Power Integrity', desc: 'Power Integrity', icon: 'BatteryCharging', vendor: 'ans' },
            { id: 'emc-analysis', name: 'EMC/EMI Analysis', desc: 'EMC/EMI Analysis', icon: 'Radio', vendor: 'ans' },
        ]
    },
    {
        category: 'Thermal',
        categoryIcon: 'Thermometer',
        modules: [
            { id: 'thermal-sim', name: 'Thermal Simulation', desc: 'Thermal Simulation', icon: 'Flame', vendor: 'ans' },
            { id: 'cfd-analysis', name: 'CFD Analysis', desc: 'CFD Analysis', icon: 'Wind', vendor: 'ans' },
            { id: 'stress-analysis', name: 'Thermal-Mechanical Stress', desc: 'Thermal-Mechanical Stress', icon: 'Gauge', vendor: 'ans' },
            { id: 'warpage-predict', name: 'Warpage Simulation', desc: 'Warpage Simulation', icon: 'Waves', vendor: 'ans' },
            { id: 'thermal-cycling', name: 'Thermal Cycling', desc: 'Thermal Cycling', icon: 'RefreshCw', vendor: 'ans' },
        ]
    },
    {
        category: 'Verification',
        categoryIcon: 'ShieldCheck',
        modules: [
            { id: 'dfm-check', name: 'Design for Manufacturing', desc: 'Design for Manufacturing', icon: 'Factory', vendor: 'syn' },
            { id: 'dft-insertion', name: 'Design for Test', desc: 'Design for Test', icon: 'TestTube', vendor: 'syn' },
            { id: 'lec-verify', name: 'Logic Equivalence Check', desc: 'Logic Equivalence Check', icon: 'Equal', vendor: 'syn' },
            { id: 'ir-drop-analysis', name: 'IR Drop Analysis', desc: 'IR Drop Analysis', icon: 'BatteryWarning', vendor: 'ans' },
            { id: 'em-analysis', name: 'Electromigration', desc: 'Electromigration', icon: 'Zap', vendor: 'ans' },
            { id: 'yield-analysis', name: 'Yield Analysis', desc: 'Yield Analysis', icon: 'TrendingUp', vendor: 'inp' },
        ]
    },
    {
        category: 'Materials',
        categoryIcon: 'Beaker',
        modules: [
            { id: 'microfluidic-lab', name: 'Microfluidic AI Lab', desc: 'AI Materials Prediction', icon: 'Droplet', vendor: 'inp' },
            { id: 'material-db', name: 'Material Database', desc: 'Material Database', icon: 'Database', vendor: 'zuk' },
            { id: 'dielectric-analysis', name: 'Dielectric Analysis', desc: 'Dielectric Analysis', icon: 'Waves', vendor: 'ans' },
            { id: 'underfill-sim', name: 'Underfill Simulation', desc: 'Underfill Simulation', icon: 'Droplets', vendor: 'ans' },
        ]
    },
    {
        category: 'AI Studio',
        categoryIcon: 'Bot',
        modules: [
            { id: 'ai-defect-detection', name: 'AI Defect Detection', desc: 'AI Defect Detection', icon: 'ScanEye', vendor: 'inp' },
            { id: 'smart-param-optimizer', name: 'Smart Parameter Tuning', desc: 'Smart Parameter Tuning', icon: 'Sparkles', vendor: 'inp' },
            { id: 'ml-warpage-predictor', name: 'ML Warpage Prediction', desc: 'ML Warpage Prediction', icon: 'TrendingUp', vendor: 'inp' },
            { id: 'auto-routing-studio', name: 'Auto Routing Studio', desc: 'Auto Routing Studio', icon: 'Workflow', vendor: 'inp' },
            { id: 'ml-yield-predictor', name: 'ML Yield Prediction', desc: 'ML Yield Prediction', icon: 'LineChart', vendor: 'inp' },
            { id: 'generative-design', name: 'Generative Design AI', desc: 'Generative Design AI', icon: 'Brain', vendor: 'inp' },
        ]
    },
];

const initialNodes = [];
const initialEdges = [];

function AICoDesign() {
    const { t, language } = useLanguage();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showWarpageMap, setShowWarpageMap] = useState(false);
    const warpagePlotRef = useRef(null);


    useEffect(() => {
        setChatMessages([{
            role: 'assistant',
            content: t('aiCoDesign.messages.welcome')
        }]);
    }, [language, t]);


    useEffect(() => {
        if (showWarpageMap && warpagePlotRef.current) {

            const gridSize = 20;
            const x = Array.from({ length: gridSize }, (_, i) => i - gridSize / 2);
            const y = Array.from({ length: gridSize }, (_, i) => i - gridSize / 2);
            const z = [];

            for (let i = 0; i < gridSize; i++) {
                const zRow = [];
                for (let j = 0; j < gridSize; j++) {
                    const r2 = x[i] * x[i] + y[j] * y[j];

                    zRow.push(45.2 * Math.exp(-r2 / 100));
                }
                z.push(zRow);
            }

            const data = [{
                z: z,
                type: 'surface',
                colorscale: 'Viridis',
                showscale: false
            }];

            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 0, r: 0, b: 0, t: 0 },
                scene: {
                    xaxis: { visible: false },
                    yaxis: { visible: false },
                    zaxis: { visible: false },
                    camera: {
                        eye: { x: 1.5, y: 1.5, z: 1.2 }
                    }
                }
            };

            Plotly.newPlot(warpagePlotRef.current, data, layout, { staticPlot: false, displayModeBar: false });
        }
    }, [showWarpageMap]);


    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'var(--accent)', strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'var(--accent)',
            },
        }, eds)),
        [setEdges]
    );


    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);


    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const moduleData = event.dataTransfer.getData('application/reactflow');
            if (!moduleData || !reactFlowInstance) return;

            const module = JSON.parse(moduleData);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `${module.id}-${Date.now()}`,
                type: 'moduleNode',
                position,
                data: {
                    ...module,
                    status: 'idle',
                    inputs: [],
                    outputs: [],
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );


    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);


    const deleteSelectedNode = useCallback(() => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
        }
    }, [selectedNode, setNodes, setEdges]);


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                deleteSelectedNode();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [deleteSelectedNode]);


    const handleUserMessage = async (message) => {
        const newUserMessage = { role: 'user', content: message };
        const updatedMessages = [...chatMessages, newUserMessage];
        setChatMessages(updatedMessages);
        setIsProcessing(true);

        try {

            const response = await sendChatMessage(updatedMessages);

            setChatMessages((prev) => [...prev, {
                role: 'assistant',
                content: response.message.content,
                showSuggestions: false,
                actions: response.actions // Ensure actions are passed to ChatPanel for rendering tables
            }]);


            if (response.actions && response.actions.length > 0) {
                response.actions.forEach(action => {
                    if (action.action === 'load_flow' && action.flow_type === 'cowos') {

                        const predefinedFlow = [
                            { id: 'substrate-ai-param-design', position: { x: 100, y: 150 } },
                            { id: 'ml-warpage-predictor', position: { x: 450, y: 150 } },
                            { id: 'smart-param-optimizer', position: { x: 800, y: 150 } },
                            { id: 'ml-yield-predictor', position: { x: 1150, y: 150 } },
                        ];

                        clearCanvas();
                        setTimeout(() => addNodesFromAI(predefinedFlow, updatedMessages), 300);
                    } else if (action.action === 'run_node') {

                    }
                });
            }
        } catch (error) {
            setChatMessages((prev) => [...prev, {
                role: 'assistant',
                content: `發生錯誤: ${error.message}`
            }]);
        } finally {
            setIsProcessing(false);
        }
    };


    const addNodesFromAI = (nodeConfigs, messages = chatMessages) => {
        const allModules = EDA_MODULES.flatMap(cat => cat.modules);


        const START_X = 100;
        const START_Y = 150;
        const COL_WIDTH = 320;
        const ROW_HEIGHT = 180;
        const MAX_COLS = 4;

        const newNodes = nodeConfigs.map((config, index) => {
            const module = allModules.find(m => m.id === config.id);
            if (!module) return null;


            const row = Math.floor(index / MAX_COLS);
            const col = index % MAX_COLS;


            const x = (row % 2 === 0)
                ? START_X + col * COL_WIDTH
                : START_X + (MAX_COLS - 1 - col) * COL_WIDTH;

            const y = START_Y + row * ROW_HEIGHT;
            
            // Try to parse values from the user's chat history to prefill nodes
            let initialParams = {};
            if (config.id === 'ml-warpage-predictor') {
                const recentMsgs = messages.slice(-5).map(m => m.content).join(' ');
                const subMatch = recentMsgs.match(/基板(?:大小)?\s*(?:是|為|:)?\s*(\d+)/i) || recentMsgs.match(/substrate\s*(\d+)/i) || recentMsgs.match(/(\d+)\s*(?:x\s*\d+\s*)?mm/i);
                const copMatch = recentMsgs.match(/銅(?:含量)?\s*(?:是|為|:)?\s*(\d+)/i) || recentMsgs.match(/copper\s*(\d+)/i) || recentMsgs.match(/(\d+)\s*%/i);
                
                initialParams = {
                    'Substrate (mm)': subMatch ? parseInt(subMatch[1]) : 55,
                    'Copper (%)': copMatch ? parseInt(copMatch[1]) : 38,
                    'Jig (mm)': 0.75
                };
            }

            return {
                id: `${config.id}-${Date.now()}-${index}`,
                type: 'moduleNode',
                position: { x, y },
                data: {
                    ...module,
                    status: 'idle',
                    displayParams: initialParams,
                },
            };
        }).filter(Boolean);

        setNodes((nds) => [...nds, ...newNodes]);


        if (newNodes.length > 1) {
            const newEdges = [];
            for (let i = 0; i < newNodes.length - 1; i++) {
                newEdges.push({
                    id: `edge-${newNodes[i].id}-${newNodes[i + 1].id}`,
                    source: newNodes[i].id,
                    target: newNodes[i + 1].id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: 'var(--accent)', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'var(--accent)',
                    },
                });
            }
            setEdges((eds) => [...eds, ...newEdges]);
        }


        if (reactFlowInstance) {
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
            }, 100);
        }
    };


    const clearCanvas = () => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setShowWarpageMap(false);
    };


    const runFlow = async () => {
        if (nodes.length === 0) return;

        setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: t('aiCoDesign.messages.startExecution')
        }]);

        setIsProcessing(true);

        try {

            const prompt = `Please execute the packaging flow according to the following nodes on the canvas: [ ${nodes.map(n => n.data.name).join(' -> ')} ]. Start with predict_warpage and then run optimize_design_parameters if optimization is present. Make up reasonable realistic parameters if none are provided.`;

            const response = await sendChatMessage([...chatMessages, { role: 'user', content: prompt }]);


            const warpageAction = response.actions?.find(a => a.node_type === 'ml-warpage-predictor');
            const optimizeAction = response.actions?.find(a => a.node_type === 'substrate-ai-param-design');


            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const moduleId = node.data.id;

                setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n));

                if (moduleId === 'substrate-ai-param-design') {
                    await new Promise((resolve) => setTimeout(resolve, 800));
                    setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'completed' } } : n));
                } else if (moduleId === 'ml-warpage-predictor') {
                    await new Promise((resolve) => setTimeout(resolve, 1500));

                    const warpageRes = warpageAction?.result || {};
                    const predictedVal = warpageRes.warpage_um;

                    if (predictedVal) {
                        setChatMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `[API Prediction Result]: Predicted warpage is **${predictedVal.toFixed(2)} um (Convex)**`
                        }]);
                    }


                    if (warpageAction?.result?.plot_data && warpagePlotRef.current) {
                        setShowWarpageMap(true);
                        setTimeout(() => {
                            warpagePlotRef.current.__hasRealData = true;
                            const pData = warpageAction.result.plot_data;
                            const plotlyData = [{
                                z: pData.z,
                                type: 'surface',
                                colorscale: 'Viridis',
                                showscale: false
                            }];
                            const layout = {
                                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                                margin: { l: 0, r: 0, b: 0, t: 0 },
                                scene: { xaxis: { visible: false }, yaxis: { visible: false }, zaxis: { visible: false } }
                            };
                            Plotly.newPlot(warpagePlotRef.current, plotlyData, layout, { displayModeBar: false });
                        }, 50);
                    } else {
                        setShowWarpageMap(true);
                    }

                    const wParams = warpageAction?.parameters || {};
                    setNodes((nds) => nds.map((n) => n.id === node.id ? { 
                        ...n, 
                        data: { 
                            ...n.data, 
                            status: 'completed',
                            displayParams: {
                                'Substrate (mm)': wParams.substrate ?? 55,
                                'Copper (%)': wParams.copper ?? 38,
                                'Jig (mm)': wParams.jig ?? 0.75
                            }
                        } 
                    } : n));
                } else if (moduleId === 'smart-param-optimizer') {
                    await new Promise((resolve) => setTimeout(resolve, 1500));

                    const optRes = optimizeAction?.result || {};
                    const achieved = optRes.achieved_warpage_um;
                    const bestParams = optRes.best_parameters;

                    if (achieved && bestParams) {
                        // Inherit the exact text behavior from the orchestrator response instead of making a duplicate block
                        // Actually, the main text response is already appended at the very end of `handleUserMessage`. 
                        // To avoid duplicate printing of optimization results in the chat panel, we only need to update the node UI.
                        // We can optionally add a small system note, but let's just keep the API result UI card simple if needed,
                        // or rely completely on the orchestrator's rich text response.
                        
                        // We will just let the Orchestrator's final text handle the summary, and only update the Node status here.
                    }
                    setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'completed' } } : n));
                } else if (moduleId === 'ml-yield-predictor') {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'completed' } } : n));
                }
            }


            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message.content
            }]);

        } catch (error) {
            console.error(error);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `[Orchestrator Error]: ${error.message}`
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="ai-codesign">
            {/* G??O */}
            <ModulePalette modules={EDA_MODULES} />

            {/* Gy{e */}
            <div className="flow-canvas-wrapper" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: true,
                    }}
                >
                    <Background color="var(--border)" gap={20} />
                    <Controls className="flow-controls" />
                    <MiniMap
                        className="flow-minimap"
                        nodeComponent={MiniMapNode}
                        nodeColor={(node) => {
                            switch (node.data?.vendor) {
                                case 'syn': return 'var(--syn)';
                                case 'zuk': return 'var(--zuk)';
                                case 'ans': return 'var(--ans)';
                                case 'inp': return 'var(--accent)';
                                default: return 'var(--muted)';
                            }
                        }}
                        maskColor="transparent"
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
                    />
                    <Panel position="top-right" className="flow-actions">
                        <button className="btn flow-action-btn" onClick={runFlow} disabled={nodes.length === 0}>
                            <Play size={16} /> {t('aiCoDesign.flow.runFlow')}
                        </button>
                        <button className="btn flow-action-btn ghost" onClick={clearCanvas}>
                            <Trash2 size={16} /> {t('aiCoDesign.flow.clear')}
                        </button>
                    </Panel>
                </ReactFlow>

                {/* Empty state hint */}
                {nodes.length === 0 && (
                    <div className="empty-canvas-hint">
                        <div className="empty-icon">
                            <MousePointerClick size={48} />
                        </div>
                        <h3>{t('aiCoDesign.flow.emptyHintTitle')}</h3>
                        <p>{t('aiCoDesign.flow.emptyHintDesc')}</p>
                    </div>
                )}

                {/* 3D Warpage Map Pop-out Overlay */}
                {showWarpageMap && (
                    <div className="warpage-map-overlay" style={{
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        width: '320px',
                        background: 'var(--panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        animation: 'slideInRight 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>3D Warpage Map</h4>
                            </div>
                            <button onClick={() => setShowWarpageMap(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                <XCircle size={16} />
                            </button>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '240px',
                            background: 'color-mix(in srgb, var(--bg) 50%, transparent)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div ref={warpagePlotRef} style={{ width: '100%', height: '100%' }}></div>

                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.6)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: 'var(--text)'
                            }}>
                                Max: {chatMessages.slice().reverse().find(m => m.content.includes('Predicted warpage'))?.content.match(/([0-9.]+) um/)?.[1] || '--'} um (Convex)
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Right: AI Chat Panel */}
            <ChatPanel
                messages={chatMessages}
                onSendMessage={handleUserMessage}
                isProcessing={isProcessing}
                selectedNode={selectedNode}
            />
        </div>
    );
}

export default AICoDesign;
