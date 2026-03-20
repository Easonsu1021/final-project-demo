import json
import os
import httpx
from typing import Dict, Any

DESIGN_API_URL = os.getenv("DESIGN_API_URL", "http://127.0.0.1:8001")
PREDICTION_API_URL = os.getenv("PREDICTION_API_URL", "http://127.0.0.1:8002")

DEFAULT_SBTHK = [
    0.015, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03,
    0.015, 0.03, 0.015, 0.03, 0.018, 1.24, 0.018, 0.03, 0.015, 0.03, 0.015,
    0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.03, 0.015, 0.018
]
DEFAULT_MATERIAL = [14900.0, 0.43, 500.0, 0.43, 1.10e-5, 3.70e-5, 130.0]

# Definition of tools the LLM can trigger
TOOLS = [{
    "function_declarations": [
        {
            "name": "generate_cowos_flow",
            "description": "Generates a complete predefined CoWoS (Chip-on-Wafer-on-Substrate) design flow template. Call this when the user asks to build, start, or design a CoWoS or advanced packaging flow.",
            "parameters": {
                "type": "OBJECT",
                "properties": {}
            }
        },
        {
            "name": "predict_warpage",
            "description": "Predict the warpage of a package design. CRITICAL: If the user provides specific numeric values in their prompt (e.g. substrate=55, copper=38), you MUST use exactly those values. ONLY guess values for parameters the user did NOT specify.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "target_warpage_type": {
                        "type": "STRING",
                        "description": "Type of prediction (convex or concave), default to convex"
                    },
                    "tool_height": {"type": "NUMBER", "description": "Tool height in mm, e.g. 0.0075"},
                    "magnet": {"type": "INTEGER", "description": "Magnet count, e.g. 1"},
                    "jig": {"type": "NUMBER", "description": "Jig parameter, e.g. 0.75"},
                    "copper": {"type": "NUMBER", "description": "Copper ratio in %, e.g. 38.0"},
                    "substrate": {"type": "NUMBER", "description": "Substrate size in mm, e.g. 55.0"},
                    "b1": {"type": "NUMBER", "description": "b1 parameter, e.g. 10.0"},
                    "w1": {"type": "NUMBER", "description": "w1 parameter, e.g. 10.0"}
                }
            }
        },
        {
            "name": "optimize_design_parameters",
            "description": "Optimize package design parameters to achieve a target warpage. Pass target_warpage_um (e.g. from predict_warpage) and optionally any initial parameters you want to constrain.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "target_warpage_type": {
                        "type": "STRING",
                        "description": "The desired type of warpage (convex or concave)."
                    },
                    "target_warpage_um": {
                        "type": "NUMBER",
                        "description": "The target warpage value in micrometers (um)."
                    },
                    "tool_height": {"type": "NUMBER", "description": "Initial Tool height in mm"},
                    "magnet": {"type": "INTEGER", "description": "Initial Magnet"},
                    "jig": {"type": "NUMBER", "description": "Initial Jig"},
                    "copper": {"type": "NUMBER", "description": "Initial Copper ratio"},
                    "substrate": {"type": "NUMBER", "description": "Initial Substrate size"},
                    "b1": {"type": "NUMBER", "description": "Initial b1 parameter"},
                    "w1": {"type": "NUMBER", "description": "Initial w1 parameter"}
                },
                "required": ["target_warpage_type", "target_warpage_um"]
            }
        }
    ]
}]


async def execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool based on the name and arguments returned by the LLM."""
    print(f"[AGENT] 執行工具: {name}, 參數: {arguments}")
    if name == "generate_cowos_flow":
        return {
            "action": "load_flow",
            "flow_type": "cowos",
            "message": "Generated CoWoS template flow."
        }
        
    elif name == "predict_warpage":
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                data = {
                    "tool_height": float(arguments.get("tool_height", 0.0075)),
                    "magnet": int(arguments.get("magnet", 1)),
                    "jig": float(arguments.get("jig", 0.75)),
                    "copper": float(arguments.get("copper", 38.0)),
                    "substrate": float(arguments.get("substrate", 55.0)),
                    "b1": float(arguments.get("b1", 10.0)),
                    "w1": float(arguments.get("w1", 10.0)),
                    "sbthk_vals": DEFAULT_SBTHK,
                    "material_vals": DEFAULT_MATERIAL
                }
                target_type = arguments.get("target_warpage_type", "convex")
                res = await client.post(f"{PREDICTION_API_URL}/predict/{target_type}", json=data)
                res.raise_for_status()
                result_data = res.json()
                
                return {
                    "action": "run_node",
                    "node_type": "ml-warpage-predictor",
                    "parameters": arguments,
                    "message": "Warpage prediction accomplished via AI Model.",
                    "result": result_data # Include warpage_um and plot_data
                }
        except Exception as e:
            return {"error": f"Failed to call Prediction API: {str(e)}"}
            
    elif name == "optimize_design_parameters":
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                data = {
                    "target_warpage_um": float(arguments.get("target_warpage_um", 20.0)),
                    "target_warpage_type": arguments.get("target_warpage_type", "convex"),
                    "tool_height": float(arguments.get("tool_height", 0.0075)),
                    "magnet": int(arguments.get("magnet", 1)),
                    "jig": float(arguments.get("jig", 0.75)),
                    "copper": float(arguments.get("copper", 38.0)),
                    "substrate": float(arguments.get("substrate", 55.0)),
                    "b1": float(arguments.get("b1", 10.0)),
                    "w1": float(arguments.get("w1", 10.0)),
                    "sbthk_vals": DEFAULT_SBTHK,
                    "material_vals": DEFAULT_MATERIAL
                }
                target_type = arguments.get("target_warpage_type", "convex")
                res = await client.post(f"{DESIGN_API_URL}/design/{target_type}", json=data)
                res.raise_for_status()
                submit_data = res.json()
                task_id = submit_data.get("task_id")
                
                import asyncio
                result_data = {}
                for _ in range(30):  # poll up to 30 seconds
                    status_res = await client.get(f"{DESIGN_API_URL}/design/status/{task_id}")
                    if status_res.status_code == 200:
                        status_data = status_res.json()
                        if status_data.get("status") == "completed":
                            result_data = status_data.get("result", {})
                            break
                    await asyncio.sleep(1)
                
                return {
                    "action": "run_node",
                    "node_type": "substrate-ai-param-design",
                    "parameters": arguments,
                    "message": f"Started design parameter optimization for target warpage.",
                    "result": result_data
                }
        except Exception as e:
            return {"error": f"Failed to call Design API: {str(e)}"}
            
    else:
        return {"error": f"Unknown tool: {name}"}
