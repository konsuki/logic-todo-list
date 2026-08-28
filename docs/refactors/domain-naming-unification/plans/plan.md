# プラン: ドメイン用語の命名を統一する（マジック文字列 → 定数参照へ）

## 大まかな手順

1. `src/features/todo/lib/treeConstants.js` に `PHASES` と `DISPLAY_MODE` を追記する。
2. 新規ファイル `src/constants/views.js` を作成し、`VIEW_MODE` を定義する。
3. ノード種別・ステータスの裸文字列（`'GOAL'`/`'STRATEGY'`/`'ACTION'`/`'FOLDER'`/`'DONE'` 等）を `NODE_TYPES` / `NODE_STATUS` 参照へ置換する。
4. フェーズの裸文字列（`'PREP'`/`'EXEC'`/`'REVIEW'`/`'ALL'`）を `PHASES` 参照へ置換する。
5. 表示モードの裸文字列（`'logic'`/`'folder'` と `'list'`/`'tree'`/`'preview'`）を `DISPLAY_MODE` / `VIEW_MODE` 参照へ置換する。
6. 数値の定数化（期日3日判定・説明プレビュー50文字）を行う。
7. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
8. 連鎖修正（`docs/` 内の該当記述の確認）とコミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（treeConstants.js に PHASES / DISPLAY_MODE を追記）

**やること**

1. `src/features/todo/lib/treeConstants.js` の末尾に以下を追記する:

```js
export const PHASES = {
  PREP: 'PREP',
  EXEC: 'EXEC',
  REVIEW: 'REVIEW',
  ALL: 'ALL',
};

export const DISPLAY_MODE = {
  LOGIC: 'logic',
  FOLDER: 'folder',
};
```

**変更しないもの**

- 既存の `NODE_TYPES` / `NODE_STATUS` / `GROUP_COLOR_PALETTE` は 1 文字も変更しない。

**この手順単体での検証**

- この時点ではまだ参照が無いため、lint に影響しない。統合検証は手順 7 で行う。

---

## 手順 3 の詳細（ノード種別・ステータスの裸文字列置換）

**やること**

`'GOAL'`/`'STRATEGY'`/`'ACTION'`/`'FOLDER'`/`'DONE'` の裸文字列を、`NODE_TYPES` / `NODE_STATUS` 参照へ置換する。対象ファイルと置換箇所は以下の通り（事前調査済み）。

| ファイル | 現状 | 置換後 |
|---|---|---|
| `FolderSection.jsx` | `node.type === 'FOLDER'` | `node.type === NODE_TYPES.FOLDER` |
| `Inspector.jsx` | `node.type === 'STRATEGY' \|\| node.type === 'GOAL'` | `node.type === NODE_TYPES.STRATEGY \|\| node.type === NODE_TYPES.GOAL` |
| `SearchBar.jsx` | `r.type === 'FOLDER'` | `r.type === NODE_TYPES.FOLDER` |
| `ArboristNode.jsx` | `data.status === 'DONE'`（2箇所）, `data.type === 'FOLDER'`, `data.type === 'STRATEGY'` | `data.status === NODE_STATUS.DONE`（2箇所）, `data.type === NODE_TYPES.FOLDER`, `data.type === NODE_TYPES.STRATEGY` |
| `TodoItem.jsx` | `node.status === 'DONE'`（2箇所）, `node.type === 'STRATEGY'` | `node.status === NODE_STATUS.DONE`（2箇所）, `node.type === NODE_TYPES.STRATEGY` |
| `useShortcuts.js` | `addNode(selectedNodeId, 'ACTION', ...)` | `addNode(selectedNodeId, NODE_TYPES.ACTION, ...)` |
| `treeDisplay.js` | `node.type === 'GOAL' \|\| node.type === 'STRATEGY'` | `node.type === NODE_TYPES.GOAL \|\| node.type === NODE_TYPES.STRATEGY` |

**各ファイルへの import 追加**

- `FolderSection.jsx` / `Inspector.jsx` / `SearchBar.jsx` / `ArboristNode.jsx` / `TodoItem.jsx` / `useShortcuts.js`: `import { NODE_TYPES, NODE_STATUS } from '../../lib/treeConstants';`（または相対パスに応じて）
- `treeDisplay.js`: 既に `NODE_TYPES` を import 済み（`searchNodes` で使用）。`NODE_STATUS` は不要。

**変更しないもの**

- 各判定ロジック・条件式の構造は 1 文字も変更しない（文字列リテラル → 定数参照のみ）。

**この手順単体での検証**

- 置換後、`grep -rnE "'(GOAL|STRATEGY|ACTION|FOLDER|DONE)'"` で対象が残っていないか確認する。統合検証は手順 7 で行う。

---

## 手順 4 の詳細（フェーズの裸文字列置換）

**やること**

`'PREP'`/`'EXEC'`/`'REVIEW'`/`'ALL'` の裸文字列を `PHASES` 参照へ置換する。

| ファイル | 現状 | 置換後 |
|---|---|---|
| `ScheduleSection.jsx` | `node.phase \|\| 'PREP'`、`value="PREP"`/`value="EXEC"`/`value="REVIEW"` | `node.phase \|\| PHASES.PREP`、`value={PHASES.PREP}` 等 |
| `ListView.jsx` | `saved \|\| 'ALL'`、`phaseFilter === 'ALL'`、`['ALL', 'PREP', 'EXEC', 'REVIEW'].map(p => ...)` | `saved \|\| PHASES.ALL`、`phaseFilter === PHASES.ALL`、`[PHASES.ALL, PHASES.PREP, PHASES.EXEC, PHASES.REVIEW].map(p => ...)` |
| `treeFolders.js` | `phase: 'PREP'` | `phase: PHASES.PREP` |
| `treeNodes.js` | `phase: 'PREP'`（3箇所） | `phase: PHASES.PREP` |

**import 追加**

- `ScheduleSection.jsx` / `ListView.jsx`: `PHASES` を `../../lib/treeConstants` から import。
- `treeFolders.js` / `treeNodes.js`: 既に `treeConstants.js` から `NODE_TYPES`/`NODE_STATUS` を import 済み。`PHASES` を追加 import。

**注意（フェーズの特殊ケース）**

- `i18n.js` の `phases.PREP` 等のキーは、翻訳キー（文字列）でありドメイン定数ではないため**対象外**。
- `useTodoTree.js` の `phase: 'PREP'` は既に treeLogic 経由で無い（`addNode` 等は treeNodes に移動済み）。対象外。

**この手順単体での検証**

- `grep -rnE "'(PREP|EXEC|REVIEW|ALL)'"` で対象が残っていないか確認（i18n.js の翻訳キーを除く）。

---

## 手順 5 の詳細（表示モードの裸文字列置換）

**やること**

`DISPLAY_MODE`（logic/folder）と `VIEW_MODE`（list/tree/preview）の裸文字列を定数参照へ置換する。

| ファイル | 現状 | 置換後 |
|---|---|---|
| `App.jsx` | `view === 'tree'`/`'list'`/`'preview'`（多数）、`displayMode === 'logic'`/`'folder'` | `view === VIEW_MODE.TREE` 等、`displayMode === DISPLAY_MODE.LOGIC` 等 |
| `ListView.jsx` | `displayMode === 'logic'`/`'folder'`（多数） | `displayMode === DISPLAY_MODE.LOGIC` 等 |
| `useShortcuts.js` | `view === 'list' ? 'tree' : 'list'`、`prev === 'preview' ? 'list' : 'preview'` | `VIEW_MODE` 参照へ |

**import 追加**

- `App.jsx`: `import { VIEW_MODE } from '../constants/views';` と `import { DISPLAY_MODE } from '../features/todo/lib/treeConstants';`
- `ListView.jsx`: `DISPLAY_MODE` を `../../lib/treeConstants` から import。
- `useShortcuts.js`: `VIEW_MODE` を `../../constants/views` から import。

**注意（`useState` の初期値）**

- `App.jsx` の `useState('list')` → `useState(VIEW_MODE.LIST)`、`useState('logic')` → `useState(DISPLAY_MODE.LOGIC)`。

**この手順単体での検証**

- `grep -rnE "'(list|tree|logic|folder|preview)'"` で対象が残っていないか確認（`searchNodes` の `mode` 引数デフォルトと、CSS 文字列は除く）。

---

## 手順 6 の詳細（数値の定数化）

**やること**

- 期日3日判定 `3 * 24 * 60 * 60 * 1000`（ArboristNode.jsx / TodoItem.jsx）→ `DUE_SOON_THRESHOLD_MS` 定数。
- 説明プレビュー `substring(0, 50)`（ArboristNode.jsx / TodoItem.jsx）→ `DESCRIPTION_PREVIEW_MAX_LENGTH` 定数。

**配置**: いずれも「リスト表示の UI 表示」に関する定数なので、`src/features/todo/lib/treeViewConstants.js` ではなく、各使用ファイルに近い場所（`ArboristNode.jsx` 内のローカル定数、または共有）に置く。ただし 2 ファイルで重複するため、**共通定数として `treeViewConstants.js` に追記**するのが妥当。

**この手順単体での検証**

- 置換後、`grep -rn "3 \* 24 \* 60 \* 60 \* 1000\|substring(0, 50)"` で対象が残っていないか確認。

---

## 手順 7 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 8 の詳細（連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（連鎖修正）**

1. `docs/` 全体を `VIEW_MODE` / `DISPLAY_MODE` / `PHASES` / `views.js` で grep し、矛盾する古い記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/refactors/readability/spec.md` の M6（view/displayMode の定数化）・M7（NODE_STATUS/NODE_TYPES 活用）・M9（フェーズ定数）の記述を実装後の状態に合わせて更新する。
   - `docs/core/architecture.md` §1 の `src/constants/` に `views.js` を反映する必要があるか確認する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`refactor:` プレフィックス）。
2. コミットメッセージ例: `refactor: ドメイン用語のマジック文字列を定数参照へ統一`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「ドメイン用語の命名を統一する（マジック文字列 → 定数参照へ）」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/domain-naming-unification`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。

**やること**

1. 新規ファイル `src/constants/views.js` を作成し、以下を定義する:

```js
/**
 * アプリのビュー状態（App.jsx の `view`）。
 * todo ドメインではなく App 層の UI 状態のため、共有層 src/constants/ に置く。
 */
export const VIEW_MODE = {
  LIST: 'list',
  TREE: 'tree',
  PREVIEW: 'preview',
};
```

**変更しないもの**

- 既存の `src/constants/themes.js` は 1 文字も変更しない。

**この手順単体での検証**

- この時点ではまだ参照が無いため、lint に影響しない。統合検証は手順 7 で行う。
