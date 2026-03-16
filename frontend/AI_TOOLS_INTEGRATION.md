# AI 工具整合使用指南

## 📖 概述

InPack.AI 的 AI 協作設計系統已整合以下真實 AI 後端工具：

1. **Warpage Predictor** - 晶圓翹曲預測分析
2. **Auto Routing Studio** - 智能自動佈線工具  
3. **Microfluidic AI Materials Lab** - 材料特性 AI 預測

這些工具可以透過模組節點直接調用，或在執行流程時自動觸發。

---

## 🎯 整合的模組

### 1. **Substrate 晶圓層**

| 模組 ID | 名稱 | 整合方式 | 說明 |
|---------|------|----------|------|
| `substrate-defect-analysis` | 晶圓缺陷分析 | API 調用 | AI 驅動的缺陷檢測 (模擬) |
| `substrate-warpage-analysis` | 晶圓翹曲協同分析 | **視窗工具** | 打開 `/pcb/warpage.html` |
| `substrate-ai-param-design` | AI 參數設計 | **視窗工具** | 打開 `/pcb/design.html` |

### 2. **AI Studio 智能層**

| 模組 ID | 名稱 | 整合方式 | 說明 |
|---------|------|----------|------|
| `ai-defect-detection` | AI 缺陷檢測 | API 調用 | 自動化缺陷識別 (模擬) |
| `ml-warpage-predictor` | ML 翹曲預測 | API 調用 | 機器學習翹曲預測 (模擬) |
| `smart-param-optimizer` | 智能參數優化 | API 調用 | AI 參數調優 (模擬) |
| `auto-routing-studio` | 智能佈線工作室 | **外部服務** | 開啟外部 Routing Studio 應用 |
| `ml-yield-predictor` | ML 良率預測 | API 調用 | 製程良率預測 (模擬) |

### 3. **Materials 材料層**

| 模組 ID | 名稱 | 整合方式 | 說明 |
|---------|------|----------|------|
| `microfluidic-lab` | Microfluidic AI Lab | **視窗工具** | 打開 Microfluidic 工具 |

---

## 🚀 使用方式

### **方法 1：對話式調用**

在 AI 聊天面板中輸入關鍵字，AI 會自動建立包含這些工具的流程：

```
建立 Substrate 晶圓分析流程
```

AI 會自動添加：
- 晶圓缺陷分析
- 晶圓翹曲協同分析 ← 實際工具
- AI 參數設計 ← 實際工具
- 基板材料選型

### **方法 2：拖曳模組**

從左側面板拖曳對應模組到畫布，例如：
- 拖曳「晶圓翹曲協同分析」
- 拖曳「智能佈線工作室」
- 拖曳「Microfluidic AI Lab」

### **方法 3：執行完整流程**

點擊「▶ 執行流程」按鈕，系統會：

1. **自動識別**模組類型
2. **視窗工具**：打開新視窗
3. **API 工具**：調用後端 API
4. **模擬工具**：返回演示數據（後端未啟動時）
5. **顯示結果**：在聊天面板展示分析報告

---

## 📊 執行結果範例

執行流程後，你會在聊天面板看到類似報告：

```
✅ 流程執行完成！

執行摘要：
• 總模組數：8
• 成功：8 | 失敗：0
• API 調用：5 | 工具視窗：3

AI 分析結果：

🔹 ML 翹曲預測
⚠️ （演示數據 - 後端服務未啟動）
  • 預測翹曲量：35.24 μm
  • 信心度：94.3%

🔹 AI 缺陷檢測
⚠️ （演示數據 - 後端服務未啟動）
  • 發現缺陷：2 個
  • 信心度：96.7%

🔹 ML 良率預測
⚠️ （演示數據 - 後端服務未啟動）
  • 預測良率：92.45%
  • 風險因素：thermal_stress, edge_defects

---
💡 提示：
• 標記「演示數據」的模組使用模擬結果（後端服務未啟動）
• 「工具視窗」類型的模組已在新視窗中打開
• 完整的分析數據可在各工具視窗中查看
```

---

## 🔧 後端 API 配置

### **環境變數設定**

在 `.env` 文件或 `.env.local` 中配置：

```bash
# 設計 API (AI 參數優化等)
VITE_DESIGN_API_URL=http://localhost:8001

# 預測 API (翹曲預測、缺陷檢測、良率預測等)
VITE_PREDICTION_API_URL=http://localhost:8002

# 佈線工具 (外部服務)
VITE_ROUTING_STUDIO_URL=https://auto-routing-demo.zeabur.app/

# Microfluidic 工具 URL
VITE_MICROFLUIDIC_APP_URL=http://127.0.0.1:8004/static/index.html
```

### **API 端點說明**

| API 端點 | 方法 | 功能 | 參數 |
|----------|------|------|------|
| `/api/defect-detection` | POST | AI 缺陷檢測 | `{ image, threshold }` |
| `/api/predict-warpage` | POST | 翹曲量預測 | `{ params, material }` |
| `/api/optimize-params` | POST | 參數優化 | `{ constraints, target }` |
| `/api/predict-yield` | POST | 良率預測 | `{ process_params }` |

---

## 🎨 開發模式

### **模擬數據模式**

當後端 API 無法連接時，系統會自動：

1. ✅ 返回模擬數據（標記 `_isMock: true`）
2. ✅ 在結果中顯示「⚠️ 演示數據」提示
3. ✅ 保持前端功能正常運作

### **實際 API 模式**

當後端 API 可用時：

1. ✅ 調用真實 API
2. ✅ 返回實際分析結果
3. ✅ 不顯示「演示數據」標記

---

## 🛠️ 開發者擴展

### **新增自定義工具**

編輯 `/src/services/aiToolsAPI.js`：

```javascript
export const TOOL_CONFIG = {
  // 添加你的新工具
  'my-custom-tool': {
    type: 'api',  // 或 'window'
    name: '我的自定義工具',
    endpoint: '/api/my-tool',
    method: 'POST',
    baseURL: MY_API_URL,
  },
};
```

### **自定義結果顯示**

在 `AICoDesign.jsx` 的 `runFlow()` 函數中，修改結果格式化邏輯：

```javascript
if (data.my_custom_result) {
  reportContent += `  • 自定義結果：${data.my_custom_result}\n`;
}
```

---

## ✅ 功能特性

- ✨ **統一介面**：所有 AI 工具通過同一個執行接口調用
- ✨ **智能降級**：API 不可用時自動使用模擬數據
- ✨ **視窗管理**：自動打開並配置工具視窗
- ✨ **結果聚合**：統一展示所有工具的分析結果
- ✨ **錯誤處理**：優雅處理 API 錯誤與連接問題
- ✨ **模擬 vs 真實**：清楚標示數據來源

---

## 📝 注意事項

1. **彈出視窗限制**：請允許瀏覽器彈出視窗
2. **API 連接**：確保後端服務正在運行
3. **跨域設置**：開發環境已配置 Vite Proxy
4. **數據持久化**：模組執行結果暫存在節點的 `executionResult` 中

---

## 🎯 下一步計劃

- [ ] 支援流程儲存與載入
- [ ] 支援批量執行與參數掃描
- [ ] 支援執行結果匯出 (PDF/JSON)
- [ ] 支援 WebSocket 即時更新
- [ ] 支援更多 AI 工具整合

---

## 📚 相關文件

- `src/services/aiToolsAPI.js` - API 服務層
- `src/components/AICoDesign/AICoDesign.jsx` - 主要組件
- `frontend/pcb/apiConfig.js` - PCB 工具 API 配置
- `frontend/vite.config.js` - Vite Proxy 配置
