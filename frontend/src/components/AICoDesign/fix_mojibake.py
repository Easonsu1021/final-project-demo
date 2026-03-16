import os

filepath = r'c:\Users\eason\OneDrive\桌面\final-project-demo-main\frontend\src\components\AICoDesign\AICoDesign.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    # Fix the prompt
    if "?VIFy{C?R?eO" in lines[i] or "Please execute the CoWoS" in lines[i]:
        if "const prompt =" in lines[i]:
            lines[i] = "            const prompt = `Please execute the packaging flow according to the following nodes on the canvas: [ ${nodes.map(n => n.data.name).join(' -> ')} ]. Start with predict_warpage and then run optimize_design_parameters if optimization is present. Make up reasonable realistic parameters if none are provided.`;\n"
    
    # Fix API Prediction Result
    if "API Prediction Result" in lines[i] or "content: `" in lines[i]:
        if "Predicted warpage is" in lines[i]:
            lines[i] = "                            content: `[API Prediction Result]: Predicted warpage is **${predictedVal.toFixed(2)} um (Convex)**`\n"

    # Fix API Optimization Result
    if "API Optimization Result" in lines[i] or "Jig Thickness:" in lines[i]:
        if "achieved.toFixed" in lines[i] and "${bestParams" in lines[i]:
            lines[i] = "                            content: `[API Optimization Result]:\\n\\n- Recommended Jig Thickness: 0.75mm -> **${bestParams.jig?.toFixed(2)}mm**\\n- Recommended Magnet Count: 1 -> **${bestParams.magnet}**\\n- Target Warpage: **${achieved.toFixed(2)} um**`\n"

    # Fix Orchestrator Error
    if "Orchestrator Execution Error:" in lines[i]:
        lines[i] = "                content: `[Orchestrator Execution Error]: ${error.message}`\n"

    # Fix Max warpage label
    if "Max: {chatMessages" in lines[i] and "(Convex)" in lines[i]:
        lines[i] = "                                Max: {chatMessages.slice().reverse().find(m => m.content.includes('Predicted warpage'))?.content.match(/([0-9.]+) um/)?.[1] || '--'} um (Convex)\n"

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixes applied.")
