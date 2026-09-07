# 実装プラン：カレンダー書き込みのメモ内容（見出し付き＋実行手順）

## 全体方針

- `useTodoTree.js` の `handleToggleStatus` 内の description 組み立てを修正する。
- フォーマット: `## 説明とメモ` / `## 詳細意図` / `## 実行手順` の見出し付き、項目間1行空け、空でも見出しを出す。
- 変更は1ファイル（`useTodoTree.js`）のみ。

---

## 大まかな手順

### 手順 1. description 組み立てロジックを修正する

- `useTodoTree.js` の `handleToggleStatus` 内で、`[intent, description]` の連結を、見出し付きフォーマットに変更。
- 実行手順（`procedure`）を追加。

### 手順 2. 検証（lint / テスト）

- `npm run lint` と `npm run test:run` で検証。

---

## 詳細手順（以下、1ステップずつ詳細化して報告する）

### 手順 1 の詳細：description 組み立てロジックの修正

`src/features/todo/hooks/useTodoTree.js` の `handleToggleStatus` 内にある、以下の行を置き換える。

**修正前**
```js
const description = [completedNode.intent, completedNode.description].filter(Boolean).join('\n');
```

**修正後**
```js
const description = [
  '## 説明とメモ',
  completedNode.description || '',
  '',
  '## 詳細意図',
  completedNode.intent || '',
  '',
  '## 実行手順',
  completedNode.procedure || '',
].join('\n');
```

**ポイント**
- 見出しは固定文言（`## 説明とメモ` / `## 詳細意図` / `## 実行手順`）。
- 空項目でも見出しを出すため、`|| ''` で空文字を許容し、`filter(Boolean)` は使わない。
- 各項目の間は `''`（空文字）を挟んで1行空ける。
- 実行手順は `completedNode.procedure` を追加。

### 手順 2 の詳細：検証（lint / テスト）

- `nvm use 20` してから `npm run lint` が exit 0 になること。
- `npm run test:run` が全件 pass（既存 78 件）すること。
- description 組み立ての変更はロジック（`timeTracking.js` 等）への影響がないため、既存テストがそのまま通ることを確認する。

