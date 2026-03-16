# Neuroshine Chiplet Flow Studio

React + Vite 應用程式，提供快速展示 InPackAI-flow-suite 的流程總覽、AI 分析工具啟動器與 PCB 自動繞線互動頁面。此 README 專注於 `frontend/` 目錄的開發與維運說明。

## ✨ 功能亮點
- **Flow Studio 主介面**：Swimlane 方式呈現 SoC / 3DIC / Package / PCB 任務，支援搜尋、卡片 CRUD、JSON 匯入/匯出。
- **Analytics 啟動器**：在主介面揭示 AI 工具（Warpage Predictor、Designer、Auto Router）並以新視窗載入。
- **獨立工具頁**：`/pcb/warpage.html`、`/pcb/design.html` 皆為獨立 React/Vite entry，與後端 API 透過 Vite proxy 或 `.env` url 互動。Auto Routing Studio 則使用外部服務。
- **主題切換**：預設為淺色主題，可在 Settings 面板切換；偏好儲存在 `localStorage.app-theme`。
- **離線資料保存**：主要流程資料儲存在瀏覽器 `localStorage`，Demo 前無須後端即可操作。

## 🛠 技術棧
- React 18、Vite 7、原生 CSS。
- Plotly.js 用於 Warpage 視覺化。
- Vite proxy 連接後端 API：`/design/*`、`/predict/*` 等皆由前端 container 反向代理。

## 📦 主要指令
在 `frontend/` 目錄執行：

```bash
npm install          # 安裝依賴
npm run dev          # 啟動 Vite 開發伺服器（預設 http://localhost:5173）
npm run build        # 產生 dist/ 靜態檔案（Podman/Docker build 使用）
npm run preview      # 驗證 build 後的靜態資產
```

> Podman demo 透過 `make demo` 啟動時，會由 frontend 容器執行 `npm run dev -- --host 0.0.0.0 --port 5173`，並由 Vite proxy 連同後端 service。

## 🌐 Environment Variables
在 `infra/env/frontend.env`（由 `.sample` 複製）設定：

| 變數 | 用途 |
| --- | --- |
| `VITE_DESIGN_API_URL` | 適用於直接呼叫 host URL； demo 預設留空，使用相對路徑。 |
| `VITE_PREDICTION_API_URL` | 同上。 |
| `VITE_ROUTING_STUDIO_URL` | Auto Routing Studio 外部服務 URL。 |
| `VITE_DESIGN_API_PROXY` | Vite dev/proxy 轉送目標（Podman 預設 `http://design-api:8001`）。 |
| `VITE_PREDICTION_API_PROXY` | 其他後端代理目標。 |

本機純前端開發時，如需連到遠端 API，可將 `VITE_*_URL` 指向可由瀏覽器直接存取的 `http(s)://host:port`。

## 🔌 入口點
| 路徑 | 說明 |
| --- | --- |
| `/`、`/index.html` | Flow Studio 主介面 |
| `/pcb/warpage.html` | Warpage Predictor（連線至 `/predict/*`） |
| `/pcb/design.html` | Warpage Designer（與 `/design/*` 背景任務互動） |
| Auto Routing Studio | 外部服務，透過 `VITE_ROUTING_STUDIO_URL` 環境變數設定 |

可在 `vite.config.js` 的 `build.rollupOptions.input` 中看到完整 entry 列表。

## 📁 目錄概覽
```
frontend/
├── pcb/                # Warpage/Design 獨立 entry（HTML + JSX）
│   ├── warpage.jsx     # Warpage Predictor React root
│   ├── design.jsx      # Warpage Designer React root
│   └── apiConfig.js    # 公用 API base URL helper
├── src/                # Flow Studio 主應用
│   ├── components/     # Sidebar / Toolbar / Settings / Analytics / Library …等元件
│   ├── App.jsx         # 主畫面
│   ├── main.jsx        # React 進入點
│   └── index.css       # 全域樣式（淺色為預設主題）
├── index.html          # 主應用 HTML 入口
├── vite.config.js      # Vite 設定（多 entry + proxy）
├── package.json        # NPM 腳本與依賴
└── README.md           # 本文件
```

## 🤝 開發建議
1. 首次切 branch 時執行 `npm install` 以確保 lockfile 同步。
2. 若需要新增新的分析工具頁，請在 `vite.config.js` 的 `input` 中加入對應 HTML 入口並建立 `./<module>/<name>.jsx` 作為 React root。
3. 調整主題色系請修改 `src/index.css` 的 `:root` 變數；預設是 light theme，`[data-theme='dark']` 保留夜間色盤。
4. 與後端協作時，優先透過 `.env` 控制 proxy 與 base URL，避免在程式碼寫死 `localhost`。
