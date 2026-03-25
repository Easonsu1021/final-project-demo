# AI Semiconductor Package Co-Design Platform

這是一個整合 AI 代理、前端視覺化、以及後端機器學習預測與優化 API 的半導體封裝設計協作平台。

## 🏗️ 系統架構 (System Architecture)

本專案採微服務架構，主要由以下模組構成：

### 1. **AI Co-Design Orchestrator (Orchestrator API)**
- **核心角色**：系統的「大腦」，基於 Gemini Pro 驅動。
- **功能**：識別用戶意圖、規劃工具呼叫鏈 (Tool Chaining)、維持設計上下文 (Context Management)。
- **技術棧**：FastAPI, Vertex AI SDK, Async httpx。

### 2. **AI-Driven Layout Optimization (Design API)**
- **功能**：提供參數優化服務，根據翹曲目標 (Target Warpage) 反推最佳 Jig 厚度與磁鐵配比。
- **技術棧**：FastAPI, Optimization Algorithms。

### 3. **High-Precision Warpage Prediction (Prediction API)**
- **功能**：整合訓練好的 ML 模型，提供即時的高精度翹曲 (Warpage) 預測。
- **技術棧**：FastAPI, Machine Learning Models。

### 4. **Dynamic Flow Visualizer (Frontend)**
- **功能**：互動式畫布、AI 聊天面板、實體參數即時預覽。
- **技術棧**：React, Vite, React Flow, TailwindCSS (如適用), Lucide-React。

---

## 🚀 核心功能與演示指南

### A. CoWoS 2.5D 設計規劃 (Scene 2)
- **操作**：輸入「我要設計一個 CoWoS 2.5D 封裝，基板 55x55mm，兩顆 chiplet，銅含量 38%」。
- **特點**：AI 會自動呼叫 `generate_cowos_flow` 並在畫布上建立標準設計節點。

### B. 連鎖工具執預測與優化 (Scene 3)
- **操作**：根據畫布上的 4 個步驟，點擊「執行」或直接對話引導，AI 會自動進行連鎖預測與優化。
- **邏輯**：AI 會先呼叫 `predict_warpage` 取得數值，自動將目標設為 50%，再呼叫 `optimize_design_parameters` 產出建議數值。

### C. 假設性分析 (What-if Analysis - 加分題 1)
- **操作**：詢問「如果把銅含量提高到 45%，翹曲會如何變化？」。
- **特點**：AI 會自動對照目前基準 (Baseline) 與新參數，產出帶有 🤖 建議與百分比增減的對比分析。

### D. 自動化參數掃描 (Parameter Sweep - 加分題 2)
- **操作**：輸入「用不同 Jig 厚度 (0.5~2.0mm) 跑參數掃描」。
- **技術亮點**：
  - **自動化批次執行**：AI 自主決定取樣點並發送多輪 API 請求。
  - **GFM 渲染列表**：前端升級後的解析器能完美顯示表格，並標註「工程最佳點」。

---

## 🛠️ 技術實作細節

- **Markdown Parser**：前端 `ChatPanel` 具備自定義 GFM 渲染能力，支持表格與特殊 Icon 解析。
- **Transparency Logging**：後端 `tool_registry.py` 內建即時工具調用日誌，每一次 API 互動皆可追蹤。
- **Context Persistence**：Orchestrator 能在多輪對話中穩定維持 Substrate 與 Copper 等基準參數，確保預測數據的物理邏輯一致性。

---

## 📦 啟動與部署

1. **環境變數**：確保 `.env` 包含 `GCP_PROJECT_ID` 且 `DESIGN_API_URL`, `PREDICTION_API_URL` 設定正確。
2. **啟動後端服務** (請開啟三個獨立終端機)：
   - **Design API (Port 8001)**:
     ```powershell
     cd services/design-api; .\design-api\Scripts\Activate.ps1; uvicorn design_app.main:app --port 8001 --reload
     ```
   - **Prediction API (Port 8002)**:
     ```powershell
     cd services/prediction-api; .\prediction-api\Scripts\Activate.ps1; uvicorn prediction_app.main:app --port 8002 --reload
     ```
   - **Orchestrator API (Port 8003)**:
     ```powershell
     cd services/orchestrator-api; .\orchestrator-api\Scripts\Activate.ps1; uvicorn main:app --port 8003 --reload
     ```
3. **啟動前端**:
   ```powershell
   cd frontend; npm install; npm run dev
   ```

---
*專案開發者：蘇子涵*
