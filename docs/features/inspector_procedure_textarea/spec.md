# 実行手順専用テキストエリア 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **対象者**: ビジューでタスクを管理するユーザー。
- **困りごと**: 「実行手順」を書く専用の場所がないため、手順を「説明とメモ」や「詳細意図」に混ぜて書くことになり、情報が散らかる。タスクを実行する際の具体的な手順をすぐに参照できない。
- **解決策**: タスクの実行手順を書く専用フィールド `procedure` をノードに追加し、インスペクターに専用テキストエリアとして表示する。既存の `description`（説明とメモ）・`intent`（詳細意図）と同じ `InspectorTextarea` コンポーネントを再利用する。

## 2. 画面・データの流れ

### 新規フィールド
- ノードに `procedure: ''` を追加（`treeLogic.js` の `addNodes` および `addFolder` で初期化）

### インスペクター表示
- `sectionMap` に新しいキー `procedure` を追加し、`InspectorTextarea` コンポーネントを使用
- `DEFAULT_SECTION_ORDER` に `'procedure'` を追加（デフォルト位置は `intent` の直後 = 3番目）
- ラベル: `t('inspector.procedure')`、プレースホルダー: `t('inspector.placeholder_procedure')`
- 更新は既存の `updateNode`（spread 更新）をそのまま使用するため、`useTodoTree.js` の変更は不要

### i18n キー

| キー | ja | en |
|------|----|----|
| `inspector.procedure` | 実行手順 | Procedure |
| `inspector.placeholder_procedure` | このタスクを実行する具体的な手順を書く... | Describe the concrete steps to carry out this task... |

## 3. 境界条件

| ケース | 挙動 |
|--------|------|
| 既存ノード（`procedure` フィールドなし） | `node.procedure \|\| ''` で空文字扱い、空ならテキストエリア表示 |
| 新規ノード追加時 | `treeLogic.js` の `addNodes` で `procedure: ''` を初期化 |
| 新規フォルダ追加時 | `treeLogic.js` の `addFolder` で `procedure: ''` を初期化 |
| ノード切り替え | `InspectorTextarea` 内の useEffect が `nodeId` 変化を検知してリセット |
| 並び替えモードで `procedure` セクションを移動 | 他のセクションと同様に `sectionOrder` で管理、localStorage に保存 |
| 既存ユーザーの localStorage に `procedure` キーが無い場合 | 初期化ロジックが「既存キー保持＋未登録キーを末尾追加」するため、`procedure` は末尾に自動追加される |

## 4. 変更スコープ

### やること
- `treeLogic.js` の `addNodes` と `addFolder` に `procedure: ''` を追加
- `i18n.js` に `inspector.procedure` / `inspector.placeholder_procedure` を追加（日英）
- `Inspector.jsx` の `DEFAULT_SECTION_ORDER` に `'procedure'` を追加（`intent` の直後）
- `Inspector.jsx` の `sectionMap` に `procedure` エントリを追加（`<InspectorTextarea>` を使用）

### やらないこと
- `InspectorTextarea.jsx` 自体の変更
- AI機能（`useAI.js`）への `procedure` フィールドの連携
- リストビューでの `procedure` 表示
- `useTodoTree.js` の変更（`updateNode` が汎用 spread 更新のため不要）
