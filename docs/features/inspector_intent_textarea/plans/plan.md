# T6 詳細意図専用テキストエリア 実装プラン

## 大まかな手順

1. **treeLogic.js にフィールド追加** — `addNodes` の新規ノード生成時に `intent: ''` を追加
   - `addNodes` 内のノードオブジェクト生成部分に `intent: ''` を追加
   - 既存ノードは `node.intent || ''` で空文字扱いになるためマイグレーション不要
2. **i18n.js にキー追加** — `inspector.intent` / `inspector.placeholder_intent` を日英両方に追加
   - ja: `intent: '詳細意図'`, `placeholder_intent: 'このタスクで達成したい状態・なぜこのタスクをするのかを書く...'`
   - en: `intent: 'Detailed Intent'`, `placeholder_intent: 'Describe the intent — what state you want to achieve and why this task matters...'`
   - 追加位置は既存の `description` / `placeholder_desc` の直下
3. **Inspector.jsx を更新** — `DEFAULT_SECTION_ORDER` に `'intent'` を追加し、`sectionMap` に `intent` エントリを追加
4. **REVISIONS.md の更新とコミット**

---

各手順の詳細は以下に順次追記する。
