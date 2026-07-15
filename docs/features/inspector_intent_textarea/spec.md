# 詳細意図専用テキストエリア 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **対象者**: ビジューでタスクを管理するユーザー。
- **困りごと**: 「説明とメモ」欄は用途が定まっておらず、タスクの詳細意図と雑記が混在すると責任分離されていない状態になる。必要な情報をすぐに特定できず、ユーザーのストレスになる。
- **解決策**: タスクの詳細な意図（なぜこのタスクをするのか・このタスクで達成したい状態の解像度を上げる文章）を書く専用フィールド `intent` をノードに追加し、インスペクターに専用テキストエリアとして表示する。説明とメモは引き続き雑記用として残す。

## 2. 画面・データの流れ

### 新規フィールド
- ノードに `intent: ''` を追加（`treeLogic.js` の `addNodes` で初期化）

### インスペクター表示
- `sectionMap` に新しいキー `intent` を追加し、`InspectorTextarea` コンポーネントを使用
- `DEFAULT_SECTION_ORDER` に `'intent'` を追加（デフォルト位置は `description` の直後 = 2番目）
- ラベル: `t('inspector.intent')`、プレースホルダー: `t('inspector.placeholder_intent')`

### i18n キー

| キー | ja | en |
|------|----|----|
| `inspector.intent` | 詳細意図 | Detailed Intent |
| `inspector.placeholder_intent` | このタスクで達成したい状態・なぜこのタスクをするのかを書く... | Describe the intent — what state you want to achieve and why this task matters... |

## 3. 境界条件

| ケース | 挙動 |
|--------|------|
| 既存ノード（`intent` フィールドなし） | `node.intent \|\| ''` で空文字扱い、空ならテキストエリア表示 |
| 新規ノード追加時 | `treeLogic.js` の `addNodes` で `intent: ''` を初期化 |
| ノード切り替え | `InspectorTextarea` 内の useEffect が `nodeId` 変化を検知してリセット |
| 並び替えモードで `intent` セクションを移動 | 他のセクションと同様に `sectionOrder` で管理、localStorage に保存 |

## 4. 変更スコープ

### やること
- `treeLogic.js` の `addNodes` に `intent: ''` を追加
- `i18n.js` に `inspector.intent` / `inspector.placeholder_intent` を追加（日英）
- `Inspector.jsx` の `DEFAULT_SECTION_ORDER` に `'intent'` を追加（`description` の直後）
- `Inspector.jsx` の `sectionMap` に `intent` エントリを追加（`<InspectorTextarea>` を使用）

### やらないこと
- `InspectorTextarea.jsx` 自体の変更
- AI機能（`useAI.js`）への `intent` フィールドの連携
- リストビューでの `intent` 表示
