<div align="center">
  <img src="public/icon-iOS-Default-1024@1x.png" width="120" height="120" alt="Scriptly Logo" />
  <h1>Scriptly</h1>
  <p><strong>專為華語創作者打造的現代化劇本編輯器</strong></p>
</div>

<br />

## 🎬 關於 Scriptly

Scriptly 是一款**最適合華語劇本與中文劇本寫作的編輯應用程式**。

我們深知中文編劇在排版、格式以及寫作邏輯上的獨特需求。有別於傳統文書處理軟體，Scriptly 為編劇量身訂做了一個純粹、專注且美觀的寫作環境，讓你的每一句對白、每一個場景描述，都能自動契合業界標準的劇本格式。

## 🌟 為什麼選擇 Scriptly？

### 1. 🚀 新手友善的結構化寫作流程
你不必一開始就是寫作大師！Scriptly 內建了**漸進式的引導系統**。打破傳統「面對空白文件發呆」的窘境，我們將劇本創作拆解為幾個核心步驟：
- **發想 Logline**：用一句話提煉故事核心，透過 QA 引導釐清你的創作動機。
- **建構大綱與場景 (Scene Outline)**：視覺化的場景列表，讓你能隨時鳥瞰故事全貌、靈活拖曳調整結構。
- **刻劃角色 (Character Builder)**：內建專屬角色檔案庫，支援上傳頭像、裁切與設定性格細節，讓每一個筆下人物都栩栩如生。

### 2. ✍️ 智慧化的專屬劇本編輯器
忘記傳統文書軟體裡繁瑣的空白鍵縮排與字體設定吧！Scriptly 基於 Slate.js 打造了專屬於劇本的富文本編輯核心：
- **自動排版與識別**：智慧辨識並排版「場景」、「角色」、「對白」與「動作」，讓格式自然契合業界標準。
- **快捷鍵輔助**：流暢的鍵盤與快捷列操作體驗，讓寫作思緒完全不中斷。

### 3. 📄 業界標準的一鍵 PDF 匯出
辛辛苦苦寫完的劇本，當然要以最專業的姿態呈現。Scriptly 支援**一鍵匯出高品質 PDF**，自動處理複雜的分頁邏輯、邊距設定與頁碼。無論是要報名創投、申請劇本補助，還是直接提交給製片與導演，都能完美符合專業劇組的要求。

### 4. 🔒 絕對的隱私與資料安全
劇本是創作者最珍貴的心血與商業機密。Scriptly 是一款純單機運行的應用程式：
- **100% 本機儲存**：所有的劇本檔案皆以專屬的 `.sly` 格式安全地儲存在你的電腦硬碟中，無須擔心雲端外洩風險。
- **隨時隨地離線創作**：完全不需要網路連線，讓你能帶著筆電到任何沒有 Wi-Fi 的咖啡廳、深山或海邊，沉浸在絕對專注的創作心流中。

---

## 🚀 快速下載與安裝

想要馬上開始寫作嗎？

👉 **[前往 Releases 頁面下載最新版本](https://github.com/sutimlong/Scriptly/releases)** 👈

請根據你的作業系統下載對應的安裝檔，安裝完成後即可立即開始你的劇本創作之旅！

不知道從何開始，您也可以先下載**範本**看看有什麼功能喔！

👉 **[下載《雨夜的第九條命》 .sly檔](https://github.com/sutimlong/Scriptly/releases/download/v1.1.0/The.Ninth.Life.in.the.Rain_showcase.sly)** 👈

---

## 🛠️ 技術架構

Scriptly 採用了現代 Web 技術搭配強大的跨平台桌面框架，並秉持著嚴格的安全與效能標準來打造：

### 🎨 渲染層 (Frontend)
* **核心框架**：[React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) - 確保 UI 組件的高效能與程式碼型別安全。
* **劇本編輯器引擎**：[Slate.js](https://docs.slatejs.org/) - 捨棄傳統的 `contenteditable` 限制，運用 Slate 打造出高自訂性的劇本富文本編輯核心，能夠精準辨識與排版「場景 (Scene)」、「角色 (Character)」、「對白 (Dialogue)」與「動作 (Action)」。
* **UI 動畫與互動**：[Framer Motion](https://www.framer.com/motion/) - 處理應用程式內平滑的視圖切換與元件動畫。
* **圖示與輔助元件**：採用 [Lucide React](https://lucide.dev/) 提供現代化圖示，以及 [React Easy Crop](https://www.npmjs.com/package/react-easy-crop) 處理角色照片的裁切與上傳。

### ⚙️ 主程序與系統層 (Backend / Electron)
* **桌面引擎**：[Electron](https://www.electronjs.org/) - 將現代 Web 技術無縫轉換為原生桌面應用程式。
* **安全性設計 (Context Isolation)**：遵循 Electron 嚴格的安全規範，關閉 `nodeIntegration` 並啟用 `contextIsolation`。渲染程序與 Node.js 核心完全隔離，所有的本地檔案讀寫 (`.sly` 存檔) 與 PDF 匯出，皆透過安全的 `preload.cjs` IPC 橋接進行通訊。
* **原生 PDF 渲染**：不依賴第三方的瀏覽器列印套件，直接透過 Electron 的 `webContents.printToPDF` 結合自訂 CSS 樣式與分頁邏輯 (`@page`)，匯出符合業界標準的高品質劇本 PDF 檔案。

### 📦 開發與建置工具 (Build Tooling)
* **建置引擎**：[Vite 8](https://vitejs.dev/) - 基於 Rolldown 的極速打包工具，並設定了 `manualChunks` 代碼分割 (Code Splitting) 以優化 Bundle 體積。
* **應用程式發布**：[Electron Builder](https://www.electron.build/) - 負責一鍵打包 macOS (`.app` / `.zip`) 等跨平台可執行檔，並處理應用程式圖示 (Assets Catalog) 等原生配置。

## 🤝 參與貢獻

Scriptly 是一個開源專案，我們非常歡迎各界開發者與創作者參與貢獻！如果你有任何建議、發現錯誤，或是希望新增功能，歡迎透過 Issues 提出，或是直接發起 Pull Request。
