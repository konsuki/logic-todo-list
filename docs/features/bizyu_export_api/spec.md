# 詳細仕様：MCP 連携用データエクスポート API（Vite ミドルウェア経由）

## 1. 概要

ビジューの全ツリーデータ（`localStorage` 上の `logido_tree_data`）を、Vite dev server のカスタムミドルウェアを経由してローカルファイルシステム（`~/.bizyu/tree_data.json`）に自動エクスポートする機能。

MCP サーバー（`bizyu-mcp-server`）はこの JSON ファイルを読み取ることで、ビジューのツリーデータを AI エージェントの前提情報として利用可能になる。

## 2. 背景

ビジューはブラウザアプリであり、全ツリーデータは `localStorage` にのみ保存されている。MCP サーバー（Node.js プロセス）はこのデータに直接アクセスできないため、ファイルシステムを介したデータ受け渡しの仕組みが必要。

## 3. 誰の、どんな困りごとを解決するのか

- **誰**: AI エージェント（Claude Code 等）に作業を依頼するビジューユーザー
- **困りごと**: AI エージェントがビジューのツリーデータ（タスクの親子関係・依存関係・詳細意図）を前提情報として読み取れない
- **解決**: ビジューがデータ変更のたびにファイルエクスポートし、MCP サーバーがそれを読み取れるようにする

## 4. データの流れ

```
ユーザー操作（ノード追加/編集/削除/完了）
  → useTodoTree の nodes state 更新
  → useEffect 発火
       │
       ├── localStorage.setItem('logido_tree_data', JSON.stringify(nodes))  // 既存の永続化
       │
       └── [DEV only] fetch('POST /__bizyu_export', { body: JSON.stringify(nodes) })
              │
              ▼
       Vite dev server の configureServer ミドルウェア
              │
              ├── ~/.bizyu/ ディレクトリ作成（なければ）
              └── ~/.bizyu/tree_data.json 書き込み
```

## 5. 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `vite.config.js` | カスタム Vite プラグイン `bizyuExportPlugin` を追加し、`configureServer` フック経由で `POST /__bizyu_export` エンドポイントを生やす |
| `src/hooks/useTodoTree.js` | 既存 `useEffect` 内に、DEV 時のみ Vite サーバーへの `fetch` を追加 |

## 6. 詳細仕様

### 6.1 Vite ミドルウェア (`vite.config.js`)

- **エンドポイント**: `POST /__bizyu_export`
- **リクエストボディ**: ビジューの `nodes` オブジェクトを `JSON.stringify` した文字列（`Content-Type: application/json`）
- **処理**:
  1. `os.homedir()` から `~/.bizyu/` の絶対パスを構築
  2. ディレクトリが存在しなければ `fs.mkdirSync({ recursive: true })` で作成
  3. リクエストボディをそのまま `~/.bizyu/tree_data.json` に書き込み（`fs.writeFileSync`）
- **レスポンス**:
  - 成功: `201 Created` + `{ "status": "ok", "path": "/Users/xxx/.bizyu/tree_data.json" }`
  - エラー: `500 Internal Server Error` + `{ "status": "error", "message": "..." }`

### 6.2 クライアント側変更 (`useTodoTree.js`)

- 既存の `useEffect`（localStorage 保存）内に以下を追加:
  ```js
  if (import.meta.env.DEV) {
    fetch('/__bizyu_export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nodes),
    }).catch(err => console.error('[bizyu-export] Export failed:', err));
  }
  ```
- `fetch` の失敗は `console.error` に出力するのみで、アプリ本体の動作には一切影響しない
- `import.meta.env.DEV` ガードにより、本番ビルド時（`vite build`）にはこの処理は存在しない（tree-shaking される）

## 7. 境界条件・エッジケース

| ケース | 対処 |
|---|---|
| `~/.bizyu/` ディレクトリが存在しない | ミドルウェアが初回リクエスト時に `fs.mkdirSync({ recursive: true })` で自動作成 |
| ビジューが起動していない | エクスポートは行われず、MCP サーバーは最後にエクスポートされたファイルを読む。鮮度は MCP 側でメタデータとして通知（Step 3 で対応） |
| エクスポート API 呼び出しが失敗（Vite サーバー停止中など） | `fetch().catch()` により `console.error` 出力。ビジュー本体の動作には影響しない |
| JSON シリアライズエラー | `JSON.stringify` は循環参照がないオブジェクトに対して例外を throw しないが、念のため try-catch で保護（useTodoTree 側） |
| 大量ノード（1000+） | `JSON.stringify` と `fetch` body は同期的に処理され、書き込みも同期的な `writeFileSync` のため問題なし |
| 本番ビルド時 | `import.meta.env.DEV` ガードにより実行されない |
| `os` モジュール未 import | `vite.config.js` の先頭で `import os from 'node:os'` および `import fs from 'node:fs'` を追加 |

## 8. 非機能要件

- **パフォーマンス**: `fetch` は非同期かつ `.catch()` のみで結果を待たないため、UI スレッドをブロックしない
- **セキュリティ**: エンドポイントは Vite dev server の内部 API であり、`localhost` 以外からアクセス不可
- **デバッグ容易性**: エクスポート失敗時はブラウザのコンソールに明示的なエラーメッセージが出力される
