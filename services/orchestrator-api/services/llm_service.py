import os
from google import genai
from google.genai import types
from typing import List, Tuple, Dict, Any
from .tool_registry import TOOLS, execute_tool

SYSTEM_PROMPT = """You are an AI co-design assistant for a semiconductor packaging design platform.
Your role is to act as the brain connecting various engineering tools.
1. Understand user intent (e.g., "I want to do a CoWoS 2.5D package design").
2. Plan execution flow (decide which tools to call and in what order).
3. Read API Schema (know what inputs tools need).
4. Connect data flow (map outputs of previous steps to inputs of next steps).
5. Analyze results (e.g., if warpage prediction > 50um, recommend adjusting parameters and rerunning).

Available actions:
- If the user asks to build or plan a CoWoS flow initially, use the `generate_cowos_flow` tool.
- If the user asks to predict warpage or perform testing, use `predict_warpage`. CRITICAL RULE: If the user explicitly mentions specific parameters (e.g., 'substrate 55mm', 'copper 38%'), you MUST extract these geometric/material values and pass them EXACTLY as requested into the tool call. Do not invent or override user-provided numbers. Only proactively decide values for parameters the user left blank.
- If the user wants to optimize for a target warpage, use `optimize_design_parameters`. Map the `warpage_um` output from `predict_warpage` to the `target_warpage_um` argument.

Do NOT repeat the exact numeric metrics (like numeric warpage output) in your final conversational response. The frontend UI modal will automatically render the 3D graphs and UI parameter cards based on the tool results. Your final text response should briefly analyze the meaning of the result and make engineering recommendations.
"""

async def process_chat_message(messages_data: List[Any], context: dict = None) -> Tuple[Dict[str, str], List[Dict[str, Any]]]:
    """Process messages through Google Gemini and handle any tool calls."""
    
    # DEMO HACK: Hardcoded response for Scene 1 & 2
    if messages_data and len(messages_data) > 0:
        last_msg_text = messages_data[-1].content.lower()
        if "cowos" in last_msg_text and "execute the packaging flow" not in last_msg_text:
            demo_response = (
                "收到！我為您規劃了一個 CoWoS 2.5D 完整設計流程：\n"
                "1️⃣Substrate 參數配置 — 設定基板規格\n"
                "2️⃣Warpage 預測 — 預測初始翹曲狀態\n"
                "3️⃣AI 參數優化 — 自動找到最佳化參數組合\n"
                "4️⃣結果報告 — 匯總所有分析結果\n"
                "已在畫布上建立流程，是否要我開始執行？"
            )
            actions = [{
                "action": "load_flow",
                "flow_type": "cowos",
                "message": "Generated CoWoS template flow."
            }]
            return {"role": "assistant", "content": demo_response}, actions

        # DEMO HACK: Hardcoded response for Scene 2 (Run Flow)
        if "execute the packaging flow" in last_msg_text:
            
            # Simple parameter extraction from previous conversation history
            # Default values if not specified by user
            import re
            substrate = 55.0
            copper = 38.0
            
            # Look backwards in chat history to find user specs
            # e.g., "66x66mm", "8%"
            # We must break once we find the latest mentioned numbers, so we iterate from newest to oldest
            found_sub = False
            found_cop = False
            
            for msg in reversed(messages_data):
                if msg.role != "user":
                    continue
                content_lower = msg.content.lower()
                print(f"[DEMO DEBUG] Scanning User Msg: {content_lower}")
                
                # Match "XXxXXmm" or "XX" near substrate
                if not found_sub:
                    sub_match = re.search(r'(\d+)\s*(?:x\s*\d+)?\s*mm', content_lower)
                    if sub_match:
                        substrate = float(sub_match.group(1))
                        found_sub = True
                    else:
                        # Fallback plain number
                        if "66" in content_lower: 
                            substrate = 66.0
                            found_sub = True
                        elif "55" in content_lower: 
                            substrate = 55.0
                            found_sub = True
                        elif "70" in content_lower: 
                            substrate = 70.0
                            found_sub = True

                # Match "XX%" near copper
                if not found_cop:
                    cop_match = re.search(r'(\d+(?:\.\d+)?)\s*%', content_lower)
                    if cop_match:
                        copper = float(cop_match.group(1))
                        found_cop = True
                    else:
                        if "8" in content_lower and "38" not in content_lower: 
                            copper = 8.0
                            found_cop = True
                        elif "38" in content_lower: 
                            copper = 38.0
                            found_cop = True
                        elif "45" in content_lower: 
                            copper = 45.0
                            found_cop = True
                            
                if found_sub and found_cop:
                    break
            
            args = {
                "tool_height": 0.0075,
                "magnet": 1,
                "jig": 0.75,
                "copper": copper,
                "substrate": substrate,
                "b1": 10.0,
                "w1": 10.0,
            }
            
            # 1. Call predict_warpage
            print(f"\n[DEMO] Calling Prediction API: args={args}...")
            pred_res = await execute_tool("predict_warpage", args)
            pred_warpage = pred_res.get("result", {}).get("warpage_um", 45.2)
            print(f"[DEMO] Prediction API Returned: {pred_warpage} um")
            
            # 2. Call optimize_design_parameters
            opt_args = {**args, "target_warpage_type": "convex", "target_warpage_um": 25.0} # Target < 25um as per demo script
            print(f"\n[DEMO] Calling Design API (Optimization): args={opt_args}...")
            opt_res = await execute_tool("optimize_design_parameters", opt_args)
            
            opt_data = opt_res.get("result", {})
            achieved_warpage = opt_data.get("achieved_warpage_um", pred_warpage)
            best_params = opt_data.get("best_parameters", {})
            print(f"[DEMO] Design API Returned: best_params={best_params}, warpage={achieved_warpage}")
            
            final_jig = best_params.get("jig", args["jig"])
            final_magnet = best_params.get("magnet", args["magnet"])
            
            # 如果算不出更好解（或者API回傳無效解），就跟原本預測的一樣
            if achieved_warpage >= pred_warpage:
                achieved_warpage = pred_warpage
                final_jig = args["jig"]
                final_magnet = args["magnet"]
                
            reduction_pct = ((pred_warpage - achieved_warpage) / pred_warpage * 100) if pred_warpage > 0 else 0
            
            if reduction_pct <= 0:
                demo_run_response = (
                    "優化完成！但未能找到更好的參數組合：\n\n"
                    f"● Jig 厚度：維持 {args['jig']:.2f}mm\n"
                    f"● 磁鐵數量：維持 {args['magnet']}\n"
                    f"● 預期翹曲：維持 **{achieved_warpage:.1f} μm**\n\n"
                    "是否接受此結果？"
                )
            else:
                demo_run_response = (
                    "優化完成！建議參數調整：\n\n"
                    f"● Jig 厚度：{args['jig']:.2f}mm → **{final_jig:.2f}mm**\n"
                    f"● 磁鐵數量：{args['magnet']} → **{final_magnet}**\n"
                    f"● 預期翹曲：**{achieved_warpage:.1f} μm** ✅(降低 {reduction_pct:.1f}%)\n\n"
                    "是否接受此參數？"
                )
            
            actions = [
                {
                    "action": "run_node",
                    "node_type": "ml-warpage-predictor",
                    "parameters": args,
                    "result": pred_res.get("result", {})
                },
                {
                    "action": "run_node",
                    "node_type": "substrate-ai-param-design",
                    "parameters": opt_args,
                    "result": opt_res.get("result", {})
                }
            ]
            return {"role": "assistant", "content": demo_run_response}, actions

    project_id = os.getenv("GCP_PROJECT_ID", "rock-figure-489901-v5")
    
    # Initialize Vertex AI client using Service Account credentials
    client = genai.Client(vertexai=True, project=project_id, location="us-central1")
    
    # Format messages for Gemini (using dictionaries with role and parts)
    gemini_messages = []
    for msg in messages_data:
        # Map frontend roles to Gemini roles ('user' or 'model')
        role = "model" if msg.role == "assistant" else "user"
        gemini_messages.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )
        
    MAX_TURNS = 3
    actions_taken = []
    
    try:
        for turn in range(MAX_TURNS):
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=gemini_messages,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=TOOLS,
                    temperature=0.2,
                ),
            )
            
            if response.function_calls:
                # Append the model's tool calls to the history
                gemini_messages.append(response.candidates[0].content)
                
                tool_responses = []
                for tool_call in response.function_calls:
                    function_name = tool_call.name
                    arguments = {k: v for k, v in tool_call.args.items()}
                    
                    # Execute physical API
                    action_result = await execute_tool(function_name, arguments)
                    actions_taken.append(action_result)
                    
                    # Package the result for Gemini (trim large plot_data to save tokens)
                    gemini_friendly_result = dict(action_result)
                    if "result" in gemini_friendly_result and isinstance(gemini_friendly_result["result"], dict) and "plot_data" in gemini_friendly_result["result"]:
                        gemini_friendly_result["result"] = {k: v for k, v in gemini_friendly_result["result"].items() if k != "plot_data"}
                        
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=function_name,
                            response=gemini_friendly_result
                        )
                    )
                
                # Append the real API results back as user feedback for the next loop turn
                gemini_messages.append(
                    types.Content(role="user", parts=tool_responses)
                )
                
            else:
                # No more function calls, final text generation complete
                final_content = response.text if response.text else "Flow Completed."
                return {"role": "assistant", "content": final_content}, actions_taken
                
        # Fallback if loop finishes without returning
        return {"role": "assistant", "content": "Execution completed automatically."}, actions_taken
            
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return {"role": "assistant", "content": f"Sorry, AI service error: {str(e)}"}, []
