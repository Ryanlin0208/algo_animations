# Algo Question Animation

**網站：<https://ryanlin0208.github.io/algo_animations/>**

十三道互動演算法動畫，使用原生 HTML、CSS、JavaScript；不需要安裝套件、建置或後端服務。

網站部署後，從根目錄的 `index.html` 開始。所有題目與資源使用相對路徑，可放在任意 GitHub 帳號與儲存庫名稱下。

| 題號 | 題目 | 動畫 |
|---|---|---|
| 92 | Reverse Linked List II | [開啟](./0092-reverse-linked-list-ii/) |
| 146 | LRU Cache | [開啟](./0146-lru-cache/) |
| 208 | Implement Trie · Prefix Tree | [開啟](./0208-implement-trie/) |
| 238 | Product of Array Except Self | [開啟](./0238-product-of-array-except-self/) |
| 394 | Decode String | [開啟](./0394-decode-string/) |
| 560 | Subarray Sum Equals K | [開啟](./0560-subarray-sum-equals-k/) |
| 621 | Task Scheduler | [開啟](./0621-task-scheduler/) |
| 658 | Find K Closest Elements | [開啟](./0658-find-k-closest/) |
| 739 | Daily Temperatures | [開啟](./0739-daily-temperatures/) |
| 767 | Reorganize String | [開啟](./0767-reorganize-string/) |
| 853 | Car Fleet | [開啟](./0853-car-fleet/) |
| 875 | Koko Eating Bananas | [開啟](./0875-koko-eating-bananas/) |
| 1011 | Capacity to Ship Packages | [開啟](./1011-capacity-to-ship-packages/) |

## 部署

GitHub Pages 由 `main` 分支根目錄（/）發布。修改後 commit 並 `git push origin main`，約 1 分鐘後網站自動更新。

## 程式風格

依循 [Google JavaScript](https://google.github.io/styleguide/jsguide.html) 與 [HTML/CSS](https://google.github.io/styleguide/htmlcssguide.html) 風格指南：縮排 2 格、每行 80 字、單引號、必加分號、`const`/`let`。設定檔：`.editorconfig`、`.prettierrc.json`（排版）、`eslint.config.mjs`（規則）。

```sh
npx prettier@3.3.3 --check .
npx eslint@9.9.1 -c eslint.config.mjs '*/*.js' '*/*.cjs'
```

`algorithm.js` 裡的 snake_case 變數名稱刻意對應旁邊的 Python 程式碼，因此在這些檔案關閉 camelcase 檢查。

## 檔案結構

```text
index.html                  題目目錄首頁
README.md                   專案說明
0092-reverse-linked-list-ii/
0146-lru-cache/
0208-implement-trie/
0238-product-of-array-except-self/
0394-decode-string/
0560-subarray-sum-equals-k/
0621-task-scheduler/
0658-find-k-closest/
0739-daily-temperatures/
0767-reorganize-string/
0853-car-fleet/
0875-koko-eating-bananas/
1011-capacity-to-ship-packages/
```

每個題目資料夾含 `index.html`、`style.css`、`app.js`、`algorithm.js`、`check.cjs`。前四個檔案是網頁必需資源；`check.cjs` 是本機驗證用，保留上傳即可。

## 本機使用

可直接用瀏覽器開啟 `index.html`。也可在本資料夾執行 `python3 -m http.server 8080`，再開啟 http://localhost:8080 。不需要伺服器端程式。

若電腦已有 Node.js，可執行以下驗證；部署網站不需要 Node.js：

```sh
node 0092-reverse-linked-list-ii/check.cjs
node 0146-lru-cache/check.cjs
node 0208-implement-trie/check.cjs
node 0238-product-of-array-except-self/check.cjs
node 0394-decode-string/check.cjs
node 0560-subarray-sum-equals-k/check.cjs
node 0621-task-scheduler/check.cjs
node 0658-find-k-closest/check.cjs
node 0739-daily-temperatures/check.cjs
node 0767-reorganize-string/check.cjs
node 0853-car-fleet/check.cjs
node 0875-koko-eating-bananas/check.cjs
node 1011-capacity-to-ship-packages/check.cjs
```

## 新增題目

建立 `四位題號-英文名稱/` 資料夾，放入動畫檔案，再更新根目錄 `index.html` 卡片、題數與本 README 表格。題目內的目錄連結使用 `../`。

## 驗證範圍

13 題的 `check.cjs` 演算法測試全部通過；已用無頭 Chrome 開啟首頁與每一題，從第一步逐步播放到最後一步，無主控台錯誤。

第 394 題動畫支援 1–80 個輸入字元、1–300 的重複次數，展開最多 2,000 字元。

第 739 題動畫支援 1–30 天、30–100 的整數溫度，時間 O(n)、空間 O(n)。

第 208 題採用自寫的 TrieNode 教學實作，參考[題目規格](https://leetcode.com/problems/implement-trie-prefix-tree/)及[Trie 實作說明](https://leetcode.com/discuss/post/1066206/introduction-to-trie/)。支援最多 16 筆操作、每個字串 1–10 個小寫字母。

首頁分頁：每頁最多 10 題，新增卡片後自動計算頁數，保持題號排序。分頁位置保存在網址的 `?page=` 參數中。
