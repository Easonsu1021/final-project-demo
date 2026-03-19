# -*- coding: utf-8 -*-
import os
import re
import asyncio
import random
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 載入環境變數（包含 GCP 憑證路徑）
load_dotenv(override=True)
from typing import List, Tuple, Dict, Any
from .tool_registry import TOOLS, execute_tool

# 強化的系統提示詞，引導模型按照邏輯鏈推理
SYSTEM_PROMPT = """你是一個半導體封裝設計平台的 AI 協作助手 (AI Co-Design Assistant)。
你的角色是連接各種工程工具的「大腦」。

請遵循以下推理與行動流程：
1. **理解意圖**：精確識別用戶需求（例如：CoWoS 2.5D 設計、翹曲預測、參數優化）。
2. **規劃路徑**：決定需要呼叫哪些工具以及順序。
3. **提取參數 (Source of Truth)**：
    - 若用戶提供具體數值（如 Substrate 55mm, Copper 38%），或者以「畫布節點清單」(Canvas Nodes) 形式提供參數內容（例如：`ML Warpage Prediction (Substrate: 60, Jig: 1.0)`），你「必須」以這些最新出現的數值為絕對準則。
    - **優先級最高**：若畫布清單中的數據與之前的對話歷史不一致，應以畫布清單中的最新數值為準。
    - 不可隨意更動用戶提供的數字。
4. **執行與分析 (AI Pipeline 核心規則)**：
    - **連鎖執行模式**：若流程包含「預測 + 優化」，你必須完成所有工具呼叫。
    - **中斷禁止**：在工具 A 結束後不准回覆用戶，必須立刻進行下一個工具的呼叫，直到流水線結束。
    - **合併回覆規範**：最終回覆應將「預測結果」與「優化建議」依序排列，格式如下：
      🤖「翹曲預測完成：**{warpage_um} μm** (Convex)」
      🤖「優化完成！建議參數調整：
       ● Jig 厚度：{old_jig}mm → **{new_jig}mm**
       ● 磁鐵數量：{old_magnet} → **{new_magnet}**
       ● 預期翹曲：**{new_warpage} μm** ✅(降低 {reduction_pct}%)
      是否接受此參數？」
5. **數據計算規範**：
    - `reduction_pct` = `(原始翹曲 - 預期翹曲) / 原始翹曲 * 100`。
    - 數值必須精確反映工具回傳的數據，保留兩位小數。

可用工具規範：
- `generate_cowos_flow`: 用於初始規劃流程。
- `predict_warpage`: 用於預測當前參數下的翹曲。
- `optimize_design_parameters`: 用於根據目標（target_warpage_um）反推最佳參數。

場景化固定回覆規範 (穩定性要求)：
1. **當用戶發起「CoWoS 規劃」或類似流程設計需求時 (Scene 2 第一次回覆)**：
   - 「必須」呼叫 `generate_cowos_flow` 工具。
   - 最終文本回覆請「務必完整且精確」使用以下格式：
🤖「收到！我為您規劃了一個 CoWoS 2.5D 完整設計流程：
1️⃣Substrate 參數配置 — 設定基板規格
2️⃣Warpage 預測 — 預測初始翹曲狀態
3️⃣AI 參數優化 — 自動找到最佳化參數組合
4️⃣結果報告 — 匯總所有分析結果
已在畫布上建立流程，是否要我開始執行？」

2. **當執行「翹曲預測」(`predict_warpage`) 後**：
   - 回覆格式：🤖「翹曲預測完成：**{warpage_um} μm** (Convex)」
   - 請帶入真實算出的 `warpage_um` 數值。

3. **當執行「設計優化」(`optimize_design_parameters`) 後 (Scene 3)**：
   - 回覆格式必須完全對齊以下樣式：
🤖「優化完成！建議參數調整：
 ● Jig 厚度：{old_jig}mm → **{new_jig}mm**
 ● 磁鐵數量：{old_magnet} → **{new_magnet}**
 ● 預期翹曲：**{new_warpage} μm** ✅(降低 {reduction_pct}%)
是否接受此參數？」
   - 請根據工具回傳的結果計算並帶入 `{...}` (數值保留小數點後兩位)。

回覆規範：
- 必須以一個 🤖 機器人表情符號開頭。
- 不要在最終文本回覆中重複詳細的數值矩陣（如 3D 圖表數據）。
- 對於上述規劃場景，請嚴格遵守範例文字格式。
"""

async def process_chat_message(messages_data: List[Any], context: dict = None) -> Tuple[Dict[str, str], List[Dict[str, Any]]]:
    """
    純粹的 LLM 推理處理函數。
    不再包含硬編碼的 Demo Hack，完全依賴模型判斷。
    """
    project_id = os.getenv("GCP_PROJECT_ID", "rock-figure-489901-v5")
    
    # 初始化 Vertex AI 客戶端
    client = genai.Client(vertexai=True, project=project_id, location="us-central1")
    
    # 轉換訊息格式為字典（規避 Pydantic 類型檢查問題）
    gemini_messages = []
    for msg in messages_data:
        role = getattr(msg, "role", None) or msg.get("role")
        content = getattr(msg, "content", None) or msg.get("content")
        gemini_messages.append({
            'role': 'model' if role == 'assistant' else 'user',
            'parts': [{'text': str(content)}] # 強制字串化防止傳輸異常
        })
        
    MAX_TURNS = 5
    actions_taken = []
    
    try:
        for turn in range(MAX_TURNS):
            response = None
            retries = 3
            # 指數退避重試邏輯
            for i in range(retries + 1):
                try:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=gemini_messages,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=TOOLS,
                            temperature=0.1,
                        ),
                    )
                    break
                except Exception as gen_err:
                    err_str = str(gen_err)
                    if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and i < retries:
                        wait = (2 ** (i + 1)) + random.random()
                        print(f"[RETRY] 遇到 429 錯誤，正在進行第 {i+1} 次重試，等待 {wait:.2f} 秒...")
                        await asyncio.sleep(wait)
                        continue
                    raise gen_err
            
            if not response or not response.candidates or not response.candidates[0].content:
                break

            # 記錄模型回覆（可能有工具呼叫）
            if response.function_calls:
                model_parts = []
                for fc in response.function_calls:
                    model_parts.append({'function_call': {'name': fc.name, 'args': fc.args}})
                
                gemini_messages.append({'role': 'model', 'parts': model_parts})
                
                tool_parts = []
                for tool_call in response.function_calls:
                    function_name = tool_call.name
                    arguments = {k: v for k, v in tool_call.args.items()}
                    
                    print(f"[AGENT] 執行工具: {function_name}, 參數: {arguments}")
                    
                    # 執行實際的 API
                    try:
                        action_result = await execute_tool(function_name, arguments)
                        actions_taken.append(action_result)
                        
                        # 徹底修剪繪圖數據
                        gemini_friendly_result = dict(action_result)
                        if "result" in gemini_friendly_result and isinstance(gemini_friendly_result["result"], dict):
                            gemini_friendly_result["result"] = {k: v for k, v in gemini_friendly_result["result"].items() if k not in ["plot_data", "image_data"]}
                            
                        tool_parts.append({
                            'function_response': {
                                'name': function_name,
                                'response': gemini_friendly_result
                            }
                        })
                    except Exception as tool_err:
                        print(f"[ERROR] 工具執行失敗: {tool_err}")
                        tool_parts.append({
                            'function_response': {
                                'name': function_name,
                                'response': {"error": f"工具執行失敗: {str(tool_err)}"}
                            }
                        })
                
                # 將工具結果加入歷史
                gemini_messages.append({'role': 'user', 'parts': tool_parts})
                
            else:
                try:
                    final_content = response.text if response.text else "流程處理完成。"
                except:
                    final_content = "處理完畢（文本受限）。"
                print(f"[AGENT] 模型最終回覆: {final_content}")
                return {"role": "assistant", "content": final_content}, actions_taken
                
        return {"role": "assistant", "content": "已完成所有推理步驟。"}, actions_taken
            
    except Exception as e:
        error_msg = f"AI 服務發生錯誤: {str(e)}"
        print(f"[ERROR] Agent: {error_msg}")
        return {"role": "assistant", "content": error_msg}, []
