# -*- coding: utf-8 -*-
import os
import re
import asyncio
import json
import httpx
from dotenv import load_dotenv
from typing import List, Tuple, Dict, Any
from .tool_registry import TOOLS, execute_tool

# 載入環境變數
load_dotenv(override=True)

# 系統提示詞 (完全複製自 llm_agent.py)
SYSTEM_PROMPT = """你是一個半導體封裝設計平台的 AI 協作助手 (AI Co-Code Design Assistant)。
你的角色是連接各種工程工具的「大腦」。

請遵循以下推理與行動流程：
1. **理解意圖**：精確識別用戶需求（例如：CoWoS 2.5D 設計、翹曲預測、參數優化）。
2. **規劃路徑**：決定需要呼叫哪些工具以及順序。
3. **提取參數 (Source of Truth)**：
    - 若用戶提供具體數值（如 Substrate 55mm, Copper 38%），或者以「畫布節點清單」(Canvas Nodes) 形式提供參數內容（例如：`ML Warpage Prediction (Substrate: 60, Jig: 1.0)`），你「必須」以這些最新出現的數值為絕對準則。
    - **優先級最高**：若畫布清單中的數據與之前的對話歷史不一致，應以畫布清單中的最新數值為準。
    - 不可隨意更動用戶提供的數字。
4. **執行與分析 (AI Pipeline 核心規則)**：
    - **連鎖執行模式**：若流程包含「預測 + 優化」，必須全流程執行。
    - **中斷禁止**：在工具 A 結束後不准回覆用戶，必須立即進入下一步工具呼叫。
5. **數據串接與計算規範 (精度要求)**：
    - **優化目標設定**：在預測得到 `warpage_um` 後，呼叫優化工具時的 `target_warpage_um` 請設定為 **預測值的 50%**（例如：預測 15um，目標設 7.5um）；若預測值已低於 20um，則目標統一設為 **10um**。
    - **計算降幅**：`reduction_pct` = `(原始值 - 優化值) / 原始值 * 100`。
    - **回覆格式**：合併顯示預測與優化結果，數值保留兩位小數。
      🤖「翹曲預測完成：**{warpage_um} μm** (Convex)」
      🤖「優化完成！建議參數調整：
       ● Jig 厚度：{old_jig}mm → **{new_jig}mm**
       ● 磁鐵數量：{old_magnet} → **{new_magnet}**
       ● 預期翹曲：**{new_warpage} μm** ✅(降低 {reduction_pct}%)
      是否接受此參數？」

可用工具規範：
- `generate_cowos_flow`: 用於初始規劃流程。
- `predict_warpage`: 用於預測當前參數下的翹曲。
- `optimize_design_parameters`: 用於根據目標（target_warpage_um）反推最佳參數。

場景化固定回覆規範 (穩定性要求 - 必須嚴格執行)：
1. **[場景 2] CoWoS 規劃需求**：
   - 觸發條件：用戶提到「規劃」、「設計流程」等。
   - 工具：呼叫 `generate_cowos_flow`。
   - **唯一合法回覆內容 (不准自行發揮)**：
🤖「收到！我為您規劃了一個 CoWoS 2.5D 完整設計流程：
1️⃣Substrate 參數配置 — 設定基板規格
2️⃣Warpage 預測 — 預測初始翹曲狀態
3️⃣AI 參數優化 — 自動找到最佳化參數組合
4️⃣結果報告 — 匯總所有分析結果
已在畫布上建立流程，是否要我開始執行？」

2. **[場景 3] 工具鏈執行 (預測+優化)**：
   - 工具：連續呼叫 `predict_warpage` 與 `optimize_design_parameters`。
   - 格式：🤖「翹曲預測完成：**{warpage_um} μm** (Convex)」
      🤖「優化完成！建議參數調整：
       ● Jig 厚度：{old_jig}mm → **{new_jig}mm**
       ● 磁鐵數量：{old_magnet} → **{new_magnet}**
       ● 預期翹曲：**{new_warpage} μm** ✅(降低 {reduction_pct}%)
      是否接受此參數？」

3. **[場景 4] 假設性分析 (What-if)**：
   - 格式：🤖「我來幫您預測... {變更項目} {數值} 時翹曲為 **{new_warpage} μm** ({增加/降低} {diff_pct}%)。{建議內容}」

4. **[場景 5] 參數掃描 (Sweep)**：
   - **Context 維持**：必須將 `substrate` 與 `copper` 數值帶入每一次 `predict_warpage` 呼叫。
   - **範圍建議**：掃描不同 Jig 厚度時，請預設採樣 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0 (共 7 點)。
   - **格式指令 (必須包含首尾 Pipe)**：
🤖 為您執行參數掃描 (Jig 厚度 0.5mm 到 2.0mm, 步長 0.25mm)...

| Jig 厚度 (mm) | 預期翹曲 (μm) |
| --- | --- |
| {值} | {新值} |

最佳點：Jig 厚度 = {值}mm, 翹曲 = {最小值}μm

**【通用指令】**：
- 必須以 🤖 表情符號開頭。
- 數據保留兩位小數。
- 嚴禁添加任何「好的」、「沒問題」等個人化墊片詞彙，直接套用樣板。
- 規劃階段嚴禁出現 5️⃣ 或 6️⃣ 等自創步驟。
"""

async def process_chat_message(messages_data: List[Any], context: dict = None) -> Tuple[Dict[str, str], List[Dict[str, Any]]]:
    """
    純粹移植版：將 llm_agent.py 的 Gemini 調用替換為 Ollama。
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    model_name = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    
    # 核心訊息轉換 (對齊 llm_agent.py)
    ollama_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages_data:
        role = getattr(msg, "role", None) or msg.get("role")
        content = getattr(msg, "content", None) or msg.get("content")
        m_role = "assistant" if role in ["model", "assistant"] else ("tool" if role == "tool" else "user")
        ollama_messages.append({"role": m_role, "content": str(content)})

    # 工具格式轉換 (對齊 OpenAI/Ollama 標準)
    openai_tools = [{"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}} for t in TOOLS[0]["function_declarations"]]

    MAX_TURNS = 10
    actions_taken = []
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            for turn in range(MAX_TURNS):
                payload = {
                    "model": model_name,
                    "messages": ollama_messages,
                    "tools": openai_tools,
                    "stream": False,
                    "options": {"temperature": 0.1}
                }
                
                resp = await client.post(f"{ollama_url}/api/chat", json=payload)
                resp.raise_for_status()
                message_resp = resp.json()["message"]
                tool_calls = message_resp.get("tool_calls")
                
                # 記錄模型回覆
                ollama_messages.append(message_resp)
                
                if tool_calls:
                    for tc in tool_calls:
                        f_name = tc["function"]["name"]
                        f_args = tc.get("function", {}).get("arguments", {})
                        if isinstance(f_args, str): f_args = json.loads(f_args)
                        
                        print(f"[AGENT] 執行工具: {f_name}, 參數: {f_args}")
                        try:
                            action_result = await execute_tool(f_name, f_args)
                            actions_taken.append(action_result)
                            
                            ollama_messages.append({
                                "role": "tool",
                                "name": f_name,
                                "content": json.dumps(action_result)
                            })
                        except Exception as e:
                            ollama_messages.append({"role": "tool", "name": f_name, "content": f"Error: {str(e)}"})
                else:
                    final_content = message_resp.get("content", "").strip()
                    if not final_content: final_content = "流程處理完成。"
                    
                    # 考慮到 8b 模型偶爾會有拼寫錯誤，進行最起碼的修復
                    final_content = final_content.replace("厭度", "厚度")
                    
                    print(f"[AGENT] 模型最終回覆: {final_content}")
                    return {"role": "assistant", "content": final_content}, actions_taken
                    
            return {"role": "assistant", "content": "已完成所有推理步驟。"}, actions_taken
            
    except Exception as e:
        print(f"[ERROR] AI 服務發生錯誤: {e}")
        return {"role": "assistant", "content": f"AI 服務發生錯誤: {str(e)}"}, []
