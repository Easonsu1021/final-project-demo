/**
 * AI Tools API Service
 * 整合所有 AI 工具的後端服務調用
 */

// 從環境變數或使用預設值
const DESIGN_API_URL = import.meta.env.VITE_DESIGN_API_URL || '';
const PREDICTION_API_URL = import.meta.env.VITE_PREDICTION_API_URL || '';
const ROUTING_STUDIO_URL = import.meta.env.VITE_ROUTING_STUDIO_URL || 'https://auto-routing-demo.zeabur.app/';
const MICROFLUIDIC_APP_URL = import.meta.env.VITE_MICROFLUIDIC_APP_URL || 'http://127.0.0.1:8004/static/index.html';

/**
 * 工具配置映射
 * 定義每個模組對應的執行方式
 */
export const TOOL_CONFIG = {
    // Substrate 晶圓分析工具
    'substrate-defect-analysis': {
        type: 'api',
        name: 'AI Defect Detection',
        endpoint: '/api/defect-detection',
        method: 'POST',
        baseURL: PREDICTION_API_URL,
    },
    'substrate-warpage-analysis': {
        type: 'window',
        name: 'Warpage Co-Analysis',
        url: '/pcb/warpage.html',
        windowFeatures: 'width=1280,height=850,resizable=yes,scrollbars=yes',
    },
    'substrate-ai-param-design': {
        type: 'window',
        name: 'AI Parameter Design',
        url: '/pcb/design.html',
        windowFeatures: 'width=1280,height=720,resizable=yes,scrollbars=yes',
    },

    // Auto Routing
    'auto-routing-studio': {
        type: 'window',
        name: 'Auto Routing Studio',
        url: ROUTING_STUDIO_URL,
        windowFeatures: 'width=1600,height=900,resizable=yes,scrollbars=yes',
    },

    // Microfluidic Lab
    'microfluidic-lab': {
        type: 'window',
        name: 'Microfluidic AI Materials Lab',
        url: MICROFLUIDIC_APP_URL,
        windowFeatures: 'width=1360,height=900,resizable=yes,scrollbars=yes',
    },

    // AI 缺陷檢測
    'ai-defect-detection': {
        type: 'api',
        name: 'AI Defect Detection',
        endpoint: '/api/defect-detection',
        method: 'POST',
        baseURL: PREDICTION_API_URL,
    },

    // ML 翹曲預測
    'ml-warpage-predictor': {
        type: 'api',
        name: 'ML Warpage Prediction',
        endpoint: '/api/predict-warpage',
        method: 'POST',
        baseURL: PREDICTION_API_URL,
    },

    // 智能參數優化
    'smart-param-optimizer': {
        type: 'api',
        name: 'Smart Parameter Tuning',
        endpoint: '/api/optimize-params',
        method: 'POST',
        baseURL: DESIGN_API_URL,
    },

    // ML 良率預測
    'ml-yield-predictor': {
        type: 'api',
        name: 'ML Yield Prediction',
        endpoint: '/api/predict-yield',
        method: 'POST',
        baseURL: PREDICTION_API_URL,
    },
};

/**
 * 執行模組 - 根據模組類型調用對應的後端服務
 * @param {string} moduleId - 模組 ID
 * @param {object} params - 模組參數
 * @returns {Promise<object>} 執行結果
 */
export async function executeModule(moduleId, params = {}) {
    const config = TOOL_CONFIG[moduleId];

    if (!config) {
        // 如果沒有配置，返回模擬結果
        return {
            success: true,
            type: 'simulation',
            message: `Module "${moduleId}" execution completed (simulation)`,
            data: {
                status: 'completed',
                timestamp: new Date().toISOString(),
            }
        };
    }

    try {
        if (config.type === 'window') {
            // 打開新視窗工具
            return await openToolWindow(config);
        } else if (config.type === 'api') {
            // 調用 API: Pass the LLM arguments if they exist in params.parameters
            const apiPayload = params.parameters ? params.parameters : params;
            return await callAPI(config, apiPayload);
        }
    } catch (error) {
        console.error(`執行模組 ${moduleId} 時發生錯誤:`, error);
        return {
            success: false,
            type: 'error',
            message: `Execution failed: ${error.message}`,
            error: error.message,
        };
    }
}

/**
 * 打開工具視窗
 */
async function openToolWindow(config) {
    try {
        const windowRef = window.open(config.url, '_blank', config.windowFeatures);

        if (!windowRef) {
            throw new Error('Unable to open window, please check popup blocker settings');
        }

        return {
            success: true,
            type: 'window',
            message: `Opened "${config.name}" tool window`,
            data: {
                windowOpened: true,
                url: config.url,
                timestamp: new Date().toISOString(),
            }
        };
    } catch (error) {
        throw new Error(`Failed to open tool window: ${error.message}`);
    }
}

/**
 * 調用後端 API
 */
async function callAPI(config, params) {
    const url = config.baseURL
        ? `${config.baseURL}${config.endpoint}`
        : config.endpoint;

    try {
        const response = await fetch(url, {
            method: config.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            // 如果 API 不可用，返回模擬結果（開發模式）
            console.warn(`API ${url} 不可用，使用模擬數據`);
            return generateMockAPIResponse(config, params);
        }

        const data = await response.json();

        return {
            success: true,
            type: 'api',
            message: `"${config.name}" API execution successful`,
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            }
        };
    } catch (error) {
        // API 無法連接時返回模擬結果（開發模式）
        console.warn(`無法連接 API ${url}，使用模擬數據:`, error.message);
        return generateMockAPIResponse(config, params);
    }
}

/**
 * 生成模擬 API 響應（用於開發/演示）
 */
function generateMockAPIResponse(config, params) {
    const mockResponses = {
        '/api/defect-detection': {
            defects_found: Math.floor(Math.random() * 5),
            defect_types: ['particle', 'scratch', 'void'],
            confidence: 0.92 + Math.random() * 0.08,
            processing_time_ms: 1200 + Math.random() * 800,
        },
        '/api/predict-warpage': {
            predicted_warpage_um: (Math.random() * 50 + 10).toFixed(2),
            confidence: 0.88 + Math.random() * 0.12,
            critical_regions: ['corner-NE', 'edge-S'],
            max_stress_mpa: (Math.random() * 100 + 50).toFixed(1),
        },
        '/api/optimize-params': {
            optimized_params: {
                layer_thickness: 0.8,
                temp_profile: [180, 220, 260],
                pressure_kpa: 150,
            },
            improvement_percent: (Math.random() * 15 + 5).toFixed(1),
            iterations: Math.floor(Math.random() * 50 + 20),
        },
        '/api/predict-yield': {
            predicted_yield_percent: (Math.random() * 10 + 85).toFixed(2),
            risk_factors: ['thermal_stress', 'edge_defects'],
            confidence_interval: [92.5, 97.8],
            recommendation: 'Adjust process parameters to reduce thermal stress',
        },
    };

    const mockData = mockResponses[config.endpoint] || {
        status: 'completed',
        result: 'success',
    };

    return {
        success: true,
        type: 'api-mock',
        message: `"${config.name}" execution successful (mock data)`,
        data: {
            ...mockData,
            timestamp: new Date().toISOString(),
            _isMock: true,
        }
    };
}

/**
 * 批量執行多個模組
 * @param {Array} modules - 模組 ID 數組
 * @param {object} sharedParams - 共享參數
 * @returns {Promise<Array>} 執行結果數組
 */
export async function executeModules(modules, sharedParams = {}) {
    const results = [];

    for (const moduleId of modules) {
        const result = await executeModule(moduleId, sharedParams);
        results.push({
            moduleId,
            ...result,
        });

        // 添加延遲以避免 API 過載
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}

/**
 * 檢查工具是否可用
 * @param {string} moduleId - 模組 ID
 * @returns {Promise<boolean>} 是否可用
 */
export async function isToolAvailable(moduleId) {
    const config = TOOL_CONFIG[moduleId];

    if (!config) {
        return true; // 沒有配置的模組默認可用（模擬模式）
    }

    if (config.type === 'window') {
        // 視窗類型工具，檢查 URL 是否可訪問
        try {
            const response = await fetch(config.url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    } else if (config.type === 'api') {
        // API 類型工具，檢查端點是否可訪問
        const url = config.baseURL
            ? `${config.baseURL}/health`
            : '/health';

        try {
            const response = await fetch(url, { method: 'GET' });
            return response.ok;
        } catch {
            return false; // API 不可用時返回 false（但仍可使用模擬數據）
        }
    }

    return true;
}

export default {
    executeModule,
    executeModules,
    isToolAvailable,
    TOOL_CONFIG,
};
