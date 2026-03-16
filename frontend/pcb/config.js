/**
 * 共用設定檔
 * 集中管理 WarpagePredictor 和 WarpageDesigner 的預設值和初始表單資料。
 */

export const presets = {
    sbthk: {
        default1: [
            0.015, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03,
            0.015, 0.03, 0.015, 0.03, 0.018, 1.24, 0.018, 0.03, 0.015, 0.03, 0.015,
            0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.018
        ]
    },
    material: {
        pp: [14900, 0.43, 500, 0.43, 1.10e-5, 3.70e-5, 130],
        pi: [3000, 0.34, 2500, 0.34, 3.5e-5, 5.0e-5, 360]
    }
};

export const initialPredictorFormData = {
    tool_height: '0',
    magnet: '10',
    jig: '1.0',
    copper: '100',
    b1: '40',
    w1: '47',
    substrate: '55',
    sbthk_preset: 'default1',
    sbthk_vals: presets.sbthk.default1.join(', '),
    material_preset: 'pp',
    material_vals: presets.material.pp.join(', '),
};

export const initialDesignerFormData = {
    target_warpage: '25',
    design_substrate: '55',
    design_copper: '100',
    sbthk_preset: 'default1',
    sbthk_vals: presets.sbthk.default1.join(', '),
    material_preset: 'pp',
    material_vals: presets.material.pp.join(', '),
};

export const INPUT_KEY_MAP = {
    // Warpage Prediction
    tool_height: 'Tool Height (mm)',
    magnet: 'Magnet Count',
    jig: 'Jig Thickness (mm)',
    copper: 'Copper Ratio (%)',
    b1: 'Jig Center Hole B1 (mm)',
    w1: 'Jig Center Hole W1 (mm)',
    substrate: 'Substrate Size (mm)',

    // AI Parameter Design
    target_warpage: 'Target Allowable Warpage (μm)',
    design_substrate: 'Substrate Size (mm)',
    design_copper: 'Copper Ratio (%)',

    // Shared Parameters
    activeTab: 'Analysis Mode',
    sbthk_preset: 'Layer Preset',
    sbthk_vals: 'Layer Values',
    material_preset: 'Material Preset',
    material_vals: 'Material Values',
};