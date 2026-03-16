import React from 'react';

const SharedFormFields = ({ formData, handleInputChange, handlePresetChange, substrateField, copperField }) => {
    return (
        <>
            <label htmlFor={substrateField}>
                <span>Substrate Size (mm)</span>
                <select id={substrateField} value={formData[substrateField]} onChange={handleInputChange}>
                    <option value="55">55x55</option><option value="65">65x65</option><option value="75">75x75</option>
                    <option value="85">85x85</option><option value="105">105x105</option>
                </select>
            </label>
            <label htmlFor={copperField}>
                <span>Copper Ratio (%)</span>
                <select id={copperField} value={formData[copperField]} onChange={handleInputChange}>
                    <option value="100">100</option><option value="90">90</option><option value="85">85</option>
                    <option value="80">80</option><option value="75">75</option><option value="70">70</option>
                </select>
            </label>
            <label htmlFor="sbthk_preset" className="sbthk-field">
                <span>Substrate Layers (SBthk)</span>
                <select
                    id="sbthk_preset"
                    className="sbthk-select"
                    value={formData.sbthk_preset}
                    onChange={handlePresetChange}
                >
                    <option value="">Manual Input</option>
                    <option value="default1">Preset 1</option>
                </select>
                <textarea
                    id="sbthk_vals"
                    className="sbthk-textarea"
                    value={formData.sbthk_vals}
                    onChange={handleInputChange}
                    placeholder="Enter 33 comma-separated layer thickness values (mm)"
                ></textarea>
            </label>
            <label htmlFor="material_preset">
                <span>Substrate Material Parameters</span>
                <select id="material_preset" value={formData.material_preset} onChange={handlePresetChange}>
                    <option value="">Manual Input</option><option value="pp">PP</option><option value="pi">PI</option>
                </select>
                <textarea id="material_vals" value={formData.material_vals} onChange={handleInputChange} placeholder="Enter 7 comma-separated material parameters"></textarea>
            </label>
        </>
    );
};

export default SharedFormFields;
