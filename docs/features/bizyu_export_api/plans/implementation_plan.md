# 実装プラン：MCP 連携用データエクスポート API

## 大まかな手順

1. `vite.config.js` にカスタム Vite プラグイン `bizyuExportPlugin` を追加し、`configureServer` フック経由で `POST /__bizyu_export` エンドポイントを実装する
2. `src/hooks/useTodoTree.js` の `useEffect` に DEV 時のエクスポート `fetch` を追加する
3. 動作確認：ビジューを起動し、タスク操作後に `~/.bizyu/tree_data.json` が生成されることを確認する

---

## 詳細手順

### 手順1：`vite.config.js` に `configureServer` フックを追加

**対象**: `vite.config.js`

**変更内容**:

1. ファイル先頭に Node.js 標準モジュールの import を追加する：
   ```js
   import os from 'node:os';
   import fs from 'node:fs';
   import path from 'node:path';
   ```

2. `defineConfig` の `server` セクション内に `configureServer` フックを追加する。
   既存の `proxy` 設定の後ろ（同じ `server` オブジェクト内）に配置する。

   ```js
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8000',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/api/, '')
       }
     },
     // ★ 追加
     configureServer(server) {
       server.middlewares.use('/__bizyu_export', (req, res) => {
         // POST メソッドのみ受け付ける
         if (req.method !== 'POST') {
           res.statusCode = 405;
           res.setHeader('Content-Type', 'application/json');
           res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
           return;
         }

         let body = '';
         req.on('data', chunk => { body += chunk; });
         req.on('end', () => {
           try {
             const bizyuDir = path.join(os.homedir(), '.bizyu');
             if (!fs.existsSync(bizyuDir)) {
               fs.mkdirSync(bizyuDir, { recursive: true });
             }
             const filePath = path.join(bizyuDir, 'tree_data.json');
             fs.writeFileSync(filePath, body, 'utf-8');

             res.statusCode = 201;
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({ status: 'ok', path: filePath }));
           } catch (err) {
             res.statusCode = 500;
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({ status: 'error', message: err.message }));
           }
         });
       });
     }
   },
   ```

3. **変更後の `vite.config.js` 全体像**:
   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import os from 'node:os'
   import fs from 'node:fs'
   import path from 'node:path'

   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:8000',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, '')
         }
       },
       configureServer(server) {
         server.middlewares.use('/__bizyu_export', (req, res) => {
           if (req.method !== 'POST') {
             res.statusCode = 405;
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
             return;
           }

           let body = '';
           req.on('data', chunk => { body += chunk; });
           req.on('end', () => {
             try {
               const bizyuDir = path.join(os.homedir(), '.bizyu');
               if (!fs.existsSync(bizyuDir)) {
                 fs.mkdirSync(bizyuDir, { recursive: true });
               }
               const filePath = path.join(bizyuDir, 'tree_data.json');
               fs.writeFileSync(filePath, body, 'utf-8');

               res.statusCode = 201;
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify({ status: 'ok', path: filePath }));
             } catch (err) {
               res.statusCode = 500;
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify({ status: 'error', message: err.message }));
             }
           });
         });
       }
     },
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: './src/setupTests.js'
     }
   })
   ```

**補足**:
- Vite の `configureServer` は内部で Connect 互換のミドルウェア API を提供している。`req` / `res` は Node.js の `http.IncomingMessage` / `http.ServerResponse` そのもの。
- `server.middlewares.use('/__bizyu_export', ...)` はパスが `/__bizyu_export` で始まるリクエストにのみマッチする。
- `body` は生の JSON 文字列をそのまま受け取り、検証せずにファイルに書き込む。バリデーションは行わない（ブラウザ側の `JSON.stringify` の出力を信頼する）。

---

### 手順2：`useTodoTree.js` に DEV 時のエクスポート `fetch` を追加

**対象**: `src/hooks/useTodoTree.js`（14〜18 行目の `useEffect`）

**変更前**:
```js
  // Persist to LocalStorage whenever nodes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [nodes]);
```

**変更後**:
```js
  // Persist to LocalStorage whenever nodes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));

    // DEV 時のみ: MCP 連携用にツリーデータをファイルエクスポートする
    if (import.meta.env.DEV) {
      fetch('/__bizyu_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodes),
      }).catch(err => console.error('[bizyu-export] Export failed:', err));
    }
  }, [nodes]);
```

**補足**:
- `import.meta.env.DEV` は Vite が提供するグローバル変数。`vite build` 時には `false` に置換され、コード自体が tree-shaking で削除される。
- `fetch` は非同期かつ `.catch()` のみで結果を待たないため、UI スレッドをブロックしない。
- エクスポートに失敗しても `console.error` を出力するだけで、アプリの動作には一切影響しない。
- `nodes` が空オブジェクト `{}` の状態でも書き出しは実行される（初回レンダリング時）。これにより、MCP サーバー側からは「ツリーが空である」という状態が常に判別可能。

---

### 手順3：動作確認

**確認手順**:

1. ビジューを起動する：
   ```bash
   cd /Users/konnsuki/Desktop/Programs/logic-todo-list && npm run dev
   ```

2. ブラウザで `http://localhost:5173` を開く。

3. タスクを追加する（例: 新規 GOAL として「テスト用プロジェクト」を作成）。

4. エクスポートファイルが生成されていることを確認する：
   ```bash
   cat ~/.bizyu/tree_data.json | head -c 500
   ```
   → GOAL ノードの JSON が表示されれば成功。

5. タスクの状態を変更する（例: 完了にする）。

6. ファイルが即時更新されていることを確認する：
   ```bash
   cat ~/.bizyu/tree_data.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'ノード数: {len(d)}')"
   ```

7. ブラウザの DevTools Console に `[bizyu-export] Export failed:` のエラーが出ていないことを確認する。

8. MCP サーバーから読み取り可能であることを確認する：
   ```bash
   node -e "
   const fs = require('fs');
   const path = require('path');
   const os = require('os');
   const data = fs.readFileSync(path.join(os.homedir(), '.bizyu', 'tree_data.json'), 'utf-8');
   const nodes = JSON.parse(data);
   console.log('読み取り成功: ノード数 =', Object.keys(nodes).length);
   "
   ```
