# プラン: treeLogic.js の責務ごとのサブモジュールへの分割

## 大まかな手順

1. 新規定数ファイル `treeConstants.js` を作成し、`NODE_TYPES` / `NODE_STATUS` / `GROUP_COLOR_PALETTE` を移す。
2. 6 つの機能モジュール（`treeNodes.js` / `treeProgress.js` / `treeGroups.js` / `treeLifecycle.js` / `treeFolders.js` / `treeDisplay.js`）を新規作成し、関数を責務ごとに移す（ロジックは変更しない）。
3. モジュール間の内部 import（例: `treeNodes.js` → `treeProgress.js`）を張り、循環依存が無いことを確認する。
4. 外部 import サイト（8 ファイル＋テスト 1 ファイル）を新しいモジュールからの import に書き換える。
5. 元の `treeLogic.js` を削除する。
6. `npm run lint` と `npm run test:run`（53 件）で検証する。
7. 連鎖修正（`docs/` 内の `treeLogic.js` 参照の grep 確認）とコミット。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（treeConstants.js の作成）

**やること**

1. 新規ファイル `src/features/todo/lib/treeConstants.js` を作成する。
2. `treeLogic.js` から以下の 3 定数を、**既存の JSDoc コメント・値そのまま**で移す:
   - `NODE_TYPES`（`GOAL`/`STRATEGY`/`ACTION`/`FOLDER`）
   - `NODE_STATUS`（`TODO`/`IN_PROGRESS`/`DONE`）
   - `GROUP_COLOR_PALETTE`（6 色の配列）
3. ファイル先頭の既存ヘッダコメント（`LogiDo Tree Logic Engine ...`）は、このモジュール専用の説明（「ツリーデータの定数（ノード種別・ステータス・グループ配色）」）に置き換える。

**変更しないもの**

- 各定数の値・キー名・JSDoc 本文は 1 文字も変更しない。
- `GROUP_COLOR_PALETTE` の「Color palette for auto-assigning group colors.」という JSDoc も保持する。

**この手順単体での検証**

- この時点ではまだ `treeLogic.js` が残っているため、他ファイルからの import は変更しない。
- 単体では検証不要（import がまだ張られていないため lint に影響しない）。手順 4 で import を張るまで統合検証は行わない。

---

## 手順 2 の詳細（6 モジュールの作成と関数移行）

**やること**

`src/features/todo/lib/` 配下に 6 ファイルを新規作成し、`treeLogic.js` の関数を責務ごとに移す。各関数の**本体・JSDoc・引数・返り値は 1 文字も変更しない**。各モジュール先頭に責務を説明するヘッダコメントを付ける。

| 新ファイル | 収容する関数（移行元の export 順を保つ） |
|---|---|
| `treeNodes.js` | `addNode`, `addNodes`, `addTreeUnderNode`, `importTreeToNodes`, `reorderNode`, `outdentNode` |
| `treeProgress.js` | `calculateNodeProgress`, `updateProgressRecursively`, `isNodeLocked`, `checkCircularDependency`, `toggleNodeStatus` |
| `treeGroups.js` | `normalizeGroups`, `normalizeOrGroups`, `calculateGroupProgress`, `addGroup`, `removeGroup`, `assignChildToGroup`, `updateGroup` |
| `treeLifecycle.js` | `softDeleteNode`, `hideNode`, `unhideNode`, `restoreNode`, `permanentDeleteNode` |
| `treeFolders.js` | `isFolderNode`, `addFolder`, `assignTaskToFolder`, `deleteFolder`, `buildFolderTree` |
| `treeDisplay.js` | `searchNodes`, `getFlattenedFlow`, `getVisibleNodesList`, `buildArboristTree` |

**関数内で使う定数・別関数は、この段階ではまだ import を張らない**（参照を一時的に壊すため、手順 3 で import を張る）。

**変更しないもの**

- 各関数のロジック・コメント・引数・返り値。
- `getFlattenedFlow` 内のハードコード `'GOAL'`/`'STRATEGY'`（定数化は後続タスク）。

**この手順単体での検証**

- この時点では `treeLogic.js` は残したまま、新規ファイルを並置する（未使用ファイルとして置く）。lint/test は `treeLogic.js` がまだ全てを export しているため、既存のまま通るはず。
- ただし未 import の関数が「未使用 export」になるが、ESLint は未使用 export を警告しない（`no-unused-vars` はローカル変数のみ対象）ため問題ない。

---

## 手順 3 の詳細（モジュール間の内部 import を張る）

**やること**

各モジュール内で参照している「定数」と「別モジュールの関数」に import 文を追加する。参照関係は以下の通り（原 `treeLogic.js` の呼び出しを精査して確定済み）。

| モジュール | 内部で import する対象 |
|---|---|
| `treeConstants.js` | （依存なし。全ての起点） |
| `treeProgress.js` | `treeConstants.js` の `NODE_STATUS`（`calculateNodeProgress` / `updateProgressRecursively` / `isNodeLocked` / `toggleNodeStatus` で使用） |
| `treeGroups.js` | `treeConstants.js` の `GROUP_COLOR_PALETTE`（`normalizeGroups` / `addGroup` で使用） |
| `treeNodes.js` | `treeConstants.js` の `NODE_TYPES`, `NODE_STATUS` ／ `treeProgress.js` の `updateProgressRecursively`（`addNodes` / `addTreeUnderNode` / `importTreeToNodes` で使用） |
| `treeLifecycle.js` | `treeProgress.js` の `updateProgressRecursively`（`softDeleteNode` / `hideNode` / `unhideNode` / `restoreNode` / `permanentDeleteNode` で使用） |
| `treeFolders.js` | `treeConstants.js` の `NODE_TYPES`（`isFolderNode` / `addFolder` / `assignTaskToFolder` / `deleteFolder` / `buildFolderTree` で使用） |
| `treeDisplay.js` | `treeConstants.js` の `NODE_TYPES`（`buildFolderTree` 相当の仮想ルート生成は `treeFolders.js` 側にあるため、`treeDisplay.js` は `treeFolders.js` の `buildFolderTree` を import するかは要確認） |

**注意（確定が必要な依存）**

- `buildFolderTree` は責務分類上 `treeFolders.js` に置く。一方 `treeDisplay.js` の `getFlattenedFlow` は `node.type === 'GOAL' || 'STRATEGY'` のハードコード比較のみで、`buildFolderTree` は呼ばない。したがって `treeDisplay.js` から `treeFolders.js` への依存は**無い**。
- 循環依存のチェック: 依存方向は「`treeConstants` ← `treeProgress` / `treeGroups` / `treeFolders` ← `treeNodes` / `treeLifecycle`」となり、`treeConstants` が最下層。`treeNodes` → `treeProgress` の方向は `treeProgress` → `treeNodes` を生まないため循環しない。

**変更しないもの**

- 各関数の本体・ロジックは不変。import 文の追加のみ。

**この手順単体での検証**

- `treeLogic.js` はまだ残っているため、この時点で `npm run lint` が通ることを確認する（新規モジュール同士の import が構文・未定義参照で壊れていないことの確認）。
- 未使用 import が生じていないか `lint` で検知する。

---

## 手順 4 の詳細（外部 import サイト 8 ファイル＋テスト 1 ファイルの書き換え）

**やること**

全 import サイト（8 ソース＋1 テスト＝9 ファイル）を、新しいモジュールからの import に書き換え、`treeLogic.` 参照を対応する関数名へ置換する。書き換え前後で挙動は同一。方針: 使用関数が 1〜2 個のファイルは **named import**（`treeLogic.X` → 裸の `X`）、`useTodoTree.js` とテストは **モジュール毎に named import をグルーピング**する。

### ソース 8 ファイルの書き換え対応表

| ファイル | 現 import | 新 import | 参照置換 |
|---|---|---|---|
| `TreeView.jsx` | `import * as treeLogic from '../../lib/treeLogic'` | `import { getFlattenedFlow } from '../../lib/treeDisplay'` | `treeLogic.getFlattenedFlow` → `getFlattenedFlow`（1 箇所） |
| `SearchBar.jsx` | `import * as treeLogic from '../../lib/treeLogic'` | `import { searchNodes } from '../../lib/treeDisplay'` | `treeLogic.searchNodes` → `searchNodes`（1 箇所） |
| `TodoItem.jsx` | `import * as treeLogic from '../../lib/treeLogic'` | `import { isNodeLocked } from '../../lib/treeProgress'` | `treeLogic.isNodeLocked` → `isNodeLocked`（1 箇所） |
| `useShortcuts.js` | `import * as treeLogic from '../lib/treeLogic'` | `import { getVisibleNodesList } from '../lib/treeDisplay'` | `treeLogic.getVisibleNodesList` → `getVisibleNodesList`（1 箇所） |
| `Inspector.jsx` | `import * as treeLogic from '../../lib/treeLogic'` | `import { normalizeGroups, calculateGroupProgress } from '../../lib/treeGroups'` | `treeLogic.normalizeGroups` → `normalizeGroups`、`treeLogic.calculateGroupProgress` → `calculateGroupProgress`（各 1 箇所） |
| `ListView.jsx` | `import { NODE_TYPES } from '../../lib/treeLogic'`<br>`import * as treeLogic from '../../lib/treeLogic'` | `import { NODE_TYPES } from '../../lib/treeConstants'`<br>`import { buildFolderTree } from '../../lib/treeFolders'`<br>`import { buildArboristTree } from '../../lib/treeDisplay'` | `treeLogic.buildFolderTree` → `buildFolderTree`、`treeLogic.buildArboristTree` → `buildArboristTree`（各 1 箇所） |
| `importLogic.js` | `import { NODE_TYPES } from './treeLogic'` | `import { NODE_TYPES } from './treeConstants'` | 置換なし（import 先のみ変更） |
| `useTodoTree.js` | `import * as treeLogic from '../lib/treeLogic'` | 下記「useTodoTree.js の書き換え」参照 | 下記参照 |

### useTodoTree.js の書き換え（20 関数超・6 モジュールに跨る）

新 import（6 行）:

```js
import { NODE_TYPES } from '../lib/treeConstants';
import { addNode, addNodes, addTreeUnderNode, importTreeToNodes, reorderNode, outdentNode } from '../lib/treeNodes';
import { toggleNodeStatus, isNodeLocked } from '../lib/treeProgress';
import { addGroup, removeGroup, assignChildToGroup, updateGroup } from '../lib/treeGroups';
import { softDeleteNode, restoreNode, permanentDeleteNode, hideNode, unhideNode } from '../lib/treeLifecycle';
import { addFolder, deleteFolder, assignTaskToFolder } from '../lib/treeFolders';
```

参照置換:
- `treeLogic.addNode` → `addNode`（ほか `addNodes` / `addTreeUnderNode` / `importTreeToNodes` / `reorderNode` / `outdentNode` / `toggleNodeStatus` / `isNodeLocked` / `addGroup` / `removeGroup` / `assignChildToGroup` / `updateGroup` / `softDeleteNode` / `restoreNode` / `permanentDeleteNode` / `hideNode` / `unhideNode` / `addFolder` / `deleteFolder` / `assignTaskToFolder` も同様）
- `treeLogic.NODE_TYPES.FOLDER` → `NODE_TYPES.FOLDER`（`rootNodes` / `folders` / `trashedRootNodes` / `hiddenRootNodes` の filter 内 5 箇所）

### テスト 1 ファイルの書き換え（`treeLogic.test.js`）

新 import（6 行）:

```js
import * as treeNodes from './treeNodes';
import * as treeProgress from './treeProgress';
import * as treeGroups from './treeGroups';
import * as treeFolders from './treeFolders';
import * as treeDisplay from './treeDisplay';
```

参照置換（`treeLogic.X` → 対応モジュールの `*.X`）:

| 元参照 | 新参照 |
|---|---|
| `treeLogic.reorderNode` | `treeNodes.reorderNode` |
| `treeLogic.buildArboristTree` | `treeDisplay.buildArboristTree` |
| `treeLogic.normalizeGroups` / `addGroup` / `removeGroup` / `assignChildToGroup` / `updateGroup` | `treeGroups.*` |
| `treeLogic.calculateNodeProgress` | `treeProgress.calculateNodeProgress` |
| `treeLogic.addFolder` / `assignTaskToFolder` / `deleteFolder` / `buildFolderTree` | `treeFolders.*` |
| `treeLogic.searchNodes` | `treeDisplay.searchNodes` |

**変更しないもの**

- 各 import サイトの関数呼び出し引数・ロジックは不変。
- `getFlattenedFlow` 内のハードコード `'GOAL'`/`'STRATEGY'` は維持。

**この手順単体での検証**

- 全参照を置換後、`treeLogic` を import しているファイルが無いことを `grep -rn "treeLogic"` で確認する（`treeViewConstants.js` 内のコメント参照 `treeLogic.js の NODE_TYPES` は false positive なので除外）。
- `npm run lint` と `npm run test:run`（53 件）が通ることを確認する。この時点では `treeLogic.js` は残るが、誰からも import されない死にファイルになる（手順 5 で削除）。

---

## 手順 5 の詳細（元 treeLogic.js の削除）

**やること**

1. 手順 4 の検証が通ったことを確認した上で、`src/features/todo/lib/treeLogic.js` を削除する。
2. `git rm src/features/todo/lib/treeLogic.js` で削除（追跡下にあるため `rm` ではなく `git rm` を使う）。

**変更しないもの**

- 新規 7 ファイル（6 モジュール＋1 定数）の内容は不変。

**この手順単体での検証**

- `grep -rn "treeLogic"` を再実行し、`treeViewConstants.js` のコメント以外に `treeLogic` 参照が無いことを確認する。
- `npm run lint` と `npm run test:run`（53 件）が通ることを確認する（削除後に残る import エラーが無いことの最終確認）。

---

## 手順 6 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する（Vite のツリーシェイキング・import 解決が壊れていないことの確認）。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 7 の詳細（連鎖修正とコミット）

**やること（連鎖修正）**

1. `docs/` 全体を `treeLogic` で grep し、旧パス `src/logic/treeLogic.js` や「treeLogic.js 単一ファイル」を前提とした記述が残っていないか確認する。
2. 該当があれば、現在の分割後構造（`features/todo/lib/` 配下の 7 ファイル）に合わせて更新する。
   - 特に `docs/core/architecture.md` §2 の `lib/` 構造図に、新規 7 ファイルを反映する（`treeLogic.js` → `treeConstants.js` / `treeNodes.js` / `treeProgress.js` / `treeGroups.js` / `treeLifecycle.js` / `treeFolders.js` / `treeDisplay.js`）。
   - `docs/refactors/readability/spec.md` の H1（treeLogic 分割）の記述が、実装後のモジュール構成と一致しているか確認する。
3. bizyu MCP サーバー側（`bizyu-mcp-server/src/data/writer.js`）が `treeLogic.js` を import している点に注意: これは**別リポジトリ**（`/Users/konnsuki/Desktop/Programs/bizyu-mcp-server/`）の参照で、本リポジトリのリファクタリングとは別物。今回の分割でパスが変わると bizyu 側が壊れるため、**必要に応じて bizyu 側の import パスも更新するか、その旨を報告に明記する**。

**やること（コミット）**

1. 変更をまとめてコミットする（`refactor:` プレフィックス）。分割は論理的に 1 つの変更なので 1 コミットにまとめる。
2. コミットメッセージ例: `refactor: treeLogic.js を責務ごとの 7 サブモジュールへ分割`

**この手順単体での検証**

- コミット前に `git status` で、想定外のファイル（bizyu 側など）が混入していないか確認する。
- コミット後に `git log --oneline -1` で内容を確認する。
