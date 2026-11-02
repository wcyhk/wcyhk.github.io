# 揮手鑑古：舊連結相容轉址

遊戲專案：<https://github.com/YuenHK/QingMing-Hand-Treasure>

遊戲網址：<https://yuenhk.github.io/QingMing-Hand-Treasure/>

此專案只提供靜態轉址頁，使原來全小階的遊戲網址及已印製 QR code 繼續可用。遊戲程式及素材保留在原遊戲專案。

- `qingming-hand-treasure/index.html`：舊遊戲入口。
- `redirect.mjs`：將舊路徑轉到新大小階路徑，保留查詢參數及書籤。
- `404.html`：只為遊戲路徑的大小階差異提供相容轉址，不改寫其他網址。
- GitHub Pages：從 `main` 分支的根目錄發佈。

測試：`node --test tests/*.test.mjs`。

## 鄰伴智慧社區平台入口

入口：<https://yuenhk.github.io/neighbour/>，自動前往 <https://neighbour-yuenhk-live.onrender.com/>。

`neighbour/` 只包含公開靜態入口。居民對話、管理登入、資料庫及服務憑證繼續由原雲端平台處理；不在此庫保存居民資料或金鑰。既有遊戲首頁及舊連結保持原樣。
