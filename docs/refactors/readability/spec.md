# コード可読性（命名・構造・コメント）向上 — 改善点の優先順位付き一覧

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: 評価基準「コードの可読性が高く綺麗に整形されている」を満たすには、命名・構造・コメントを俯瞰して改善する必要がある。しかし全 src（約 30 ファイル・7,163 LOC）を一気に直すのは調査範囲が広すぎ、方針が定まらず「瞑想状態」に陥る。本ドキュメントは、その前に**現状をファイル別にレビューし、改善点を「ファイル → 改善項目 → 優先度」の一覧に落とし込む**ことで、以降の子タスクの対象と順序を固定する。

## 2. 現状の俯瞰（レビュー結果の要約）

- 総ファイル数: 30（`.js` / `.jsx`）
- 総 LOC: 約 7,163
- 大規模ファイル（構造の可読性が低い）:
  - `src/features/todo/lib/treeLogic.js` — 1,104 行（単一ファイルに CRUD・進捗・フォルダ・検索が混在）
  - `src/features/todo/components/list/ListView.jsx` — 635 行（レンダラ ArboristNode と本体 ListView が同居）
  - `src/features/todo/components/inspector/Inspector.jsx` — 634 行（9 セクションを単一コンポーネントに内包）
  - `src/features/todo/components/tree/TreeView.jsx` — 507 行（D3 描画ロジックと JSX が同居）
  - `src/features/todo/hooks/useTodoTree.js` — 393 行
  - `src/app/App.jsx` — 347 行（テーマ副作用・祝賀ロジック・構成が混在）

## 3. 改善点の優先順位付き一覧

優先度の定義:
- **高**: 構造の可読性（ファイル分割・責務分離）を損なう、または明らかなデッドコード。単独タスク化して直ちに着手すべき。
- **中**: 命名・マジック文字列の統一。既存定数への置換で typo リスクを下げる。
- **低**: コメントの過不足・整形。他タスク後の仕上げ。

### 優先度 高（構造）

| # | ファイル | 改善項目 | 根拠 |
|---|---|---|---|
| H1 | `treeLogic.js` | 責務ごとにサブモジュールへ分割（CRUD / 進捗 / ORグループ / 削除 / フォルダ / 検索表示 の 7 責務） | 1,104 行に 7 責務が混在し、処理を追いにくい → 実装済み（treeConstants / treeNodes / treeProgress / treeGroups / treeLifecycle / treeFolders / treeDisplay の 7 ファイルに分割） |
| H2 | `ListView.jsx` | `ArboristNode` レンダラを別ファイルへ抽出 | 635 行。レンダラ（1-328）とビュー本体（330-633）が同居 → 実装済み（`ArboristNode.jsx` に抽出） |
| H3 | `Inspector.jsx` | 9 セクション（description/intent/procedure/folder/ai/schedule/dependency/why/how）をサブコンポーネント化 | 634 行。`sectionMap` に巨大 JSX が並ぶ |
| H4 | `App.jsx` | テーマ適用と confetti 祝賀ロジックをカスタムフックへ抽出 | 347 行。副作用が App 本体に混在 |
| H5 | `App.jsx` | ListView 呼び出しのデッド props を除去 | `expandedNodeIds`/`toggleExpand`/`folders`/`assignTaskToFolder` を渡しているが ListView は未受領（react-arborist 移行時の残骸） |

### 優先度 中（命名・マジック文字列）

| # | ファイル | 改善項目 | 根拠 |
|---|---|---|---|
| M1 | `ListView.jsx` / `TodoItem.jsx` | 期日判定 `3 * 24 * 60 * 60 * 1000` を定数化 | 2 箇所に同一マジックナンバー |
| M2 | `ListView.jsx` / `TodoItem.jsx` / `Inspector.jsx` | `showMeceWarning` の判定ロジックを共通化 | 3 箇所で `type` と子数による同一判定（ただし STRATEGY のみ vs STRATEGY/GOAL で条件が微妙に異なる点に注意） |
| M3 | `ListView.jsx` / `TodoItem.jsx` / `Inspector.jsx` | `progress === 100` の色分岐を共通ヘルパーへ | 3 箇所で同一の三項演算 |
| M4 | `ListView.jsx` / `TodoItem.jsx` | `isOverdue`/`isDueSoon` を共通ユーティリティへ | 2 箇所で重複 |
| M5 | `ListView.jsx` / `TodoItem.jsx` | 説明プレビュー `substring(0, 50)` を共通化 | 2 箇所で重複 |
| M6 | `ListView.jsx` / `App.jsx` / `useShortcuts.js` | view/displayMode の `'list'`/`'tree'`/`'logic'`/`'folder'`/`'preview'` を定数化 | 裸の文字列が散在、typo リスク |
| M7 | 各コンポーネント | `'DONE'`/`'FOLDER'`/`'STRATEGY'`/`'GOAL'`/`'ACTION'` を `NODE_STATUS`/`NODE_TYPES` へ | `treeLogic.js` に定義済みの定数が未活用 |
| M8 | `ListView.jsx` / `TodoItem.jsx` | `node.type.toLowerCase()` によるクラス生成を共通化 | 複数箇所で重複 |
| M9 | `Inspector.jsx` | `'PREP'`/`'EXEC'`/`'REVIEW'` のフェーズ定数を共通化 | `phase` 選択肢が裸文字列（`treeLogic.js` にも `phase: 'PREP'` が直書き） |
| M10 | `useAI.js` | システムプロンプト文字列を別モジュールへ分離 | 111 行中 30 行超がプロンプト定数で、ロジックの見通しを損なう |

### 優先度 低（コメント・整形）

| # | ファイル | 改善項目 | 根拠 |
|---|---|---|---|
| L1 | `useAI.js` | 連続した空行（27-28）を除去 | 整形漏れ |
| L2 | `Inspector.jsx` | インライン `style` を CSS クラスへ移す（タイトル行・reorder ボタン） | 可読性・スタイル一元管理 |
| L3 | `Inspector.jsx` | `title="セクションを並び替え"` 等のハードコード日本語タイトルを i18n 化 | 翻訳漏れ |
| L4 | `useShortcuts.js` / `TodoItem.jsx` | `'New Task'` 等のデフォルト文言の定数化 | 命名・一貫性 |
| L5 | 全体 | コメント過不足の調整（冗長コメント削除、意図コメント/JSDoc 補完） | 可読性の仕上げ |
| L6 | 全体 | Prettier 等 formatter の導入と適用 | 整形の自動化 |

## 4. 以降の子タスクへの対応付け

本一覧が「可読性 STRATEGY」配下の子タスクの対象を固定する。対応関係:

- 子タスク 2「treeLogic.js 分割」→ H1
- 子タスク 3「ArboristNode 抽出」→ H2
- 子タスク 4「Inspector 分割」→ H3
- 子タスク 5「App.jsx フック抽出」→ H4, H5
- 子タスク 6「ドメイン用語の命名統一」→ M6〜M10
- 子タスク 7「コメント過不足調整」→ L1〜L5
- 子タスク 8「整形と最終検証」→ L6

> 注: M1〜M5 の「重複ロジック共通化」は可読性の観点（命名・単一化）では関係するが、本来的には「DRY 原則の適用」タスク（別 STRATEGY 下）の管轄。ここでは「名前を付けて意図を明示する」部分のみ可読性側で扱い、ロジック抽出そのものは DRY タスクへ委譲する。

## 5. 普通ではないケース・境界条件

- **M2（showMeceWarning）の条件差**: `ListView.jsx`/`TodoItem.jsx` は `STRATEGY && 子1`、`Inspector.jsx` は `(STRATEGY || GOAL) && 子1` と**意図的に異なる**。共通化の際は「リスト側」と「インスペクター側」で仕様が違うことを踏まえ、無理に同一関数にしない。
- **H2/H3 の抽出は barrel 禁止（architecture.md §4.2）**: サブファイルを分けても `index.js` は作らず直接 import する。
- **H5 のデッド props 除去は挙動非変更**: 未使用 props の除去は安全だが、`TreeView` 側は `expandedNodeIds`/`toggleExpand` を使うため、**TreeView 呼び出しは触らない**（ListView 呼び出しのみ対象）。
- **M10 のプロンプト分離は動作に影響しないこと**: プロンプト文字列の内容を 1 文字も変えない。

## 6. 完了の定義（DoD）

- 本一覧（spec.md）が作成され、優先度 高/中/低 の 3 段階で改善点が列挙されている。
- 各改善項目に「対象ファイル」と「根拠」が明記されている。
- 以降の子タスクが本一覧の項目番号を参照して対象を限定できる状態になっている。
- `claude-info.md` に本 spec 作成時のセッション情報が記録されている。
