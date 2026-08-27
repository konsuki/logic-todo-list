# treeLogic.js の責務ごとのサブモジュールへの分割

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `src/features/todo/lib/treeLogic.js`（1,104 行）に CRUD・進捗・依存・ORグループ・ソフト削除・フォルダ・検索表示の **7 責務**が単一ファイルに混在しており、初見の評価者が処理を追いにくい。責務ごとのサブモジュールへ分割して構造の可読性を上げる。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「ファイルの物理的な分割」と「import 経路」のみ。
- 関数のロジック・定数の値は 1 文字も変更しない。
- データフロー（`useTodoTree` → `treeLogic` 各関数 → `nodes` 更新）は不変。

## 3. モジュール構成と関数対応表

新規に `src/features/todo/lib/` 配下へ **6 モジュール＋1 定数ファイル＝7 ファイル**を作り、`treeLogic.js` を削除する。

| 新ファイル | 責務 | 収容する関数 |
|---|---|---|
| `treeConstants.js` | 定数 | `NODE_TYPES`, `NODE_STATUS`, `GROUP_COLOR_PALETTE` |
| `treeNodes.js` | CRUD・構造 | `addNode`, `addNodes`, `addTreeUnderNode`, `importTreeToNodes`, `reorderNode`, `outdentNode` |
| `treeProgress.js` | 進捗・状態・依存 | `calculateNodeProgress`, `updateProgressRecursively`, `isNodeLocked`, `checkCircularDependency`, `toggleNodeStatus` |
| `treeGroups.js` | OR グループ | `normalizeGroups`, `normalizeOrGroups`, `calculateGroupProgress`, `addGroup`, `removeGroup`, `assignChildToGroup`, `updateGroup` |
| `treeLifecycle.js` | 削除・非表示 | `softDeleteNode`, `hideNode`, `unhideNode`, `restoreNode`, `permanentDeleteNode` |
| `treeFolders.js` | フォルダ | `isFolderNode`, `addFolder`, `assignTaskToFolder`, `deleteFolder`, `buildFolderTree` |
| `treeDisplay.js` | 検索・表示 | `searchNodes`, `getFlattenedFlow`, `getVisibleNodesList`, `buildArboristTree` |

## 4. 普通ではないケース・境界条件

- **barrel file の禁止（architecture.md §4.2）**: `index.js` による一括 re-export は作らない。各 import サイトは使う関数を**直接 import** する。
- **import サイトの書き換え**: 現在 `import * as treeLogic from '../../lib/treeLogic'` している 8 ファイル＋テスト 1 ファイルを、各モジュールからの import に変更する。`useTodoTree.js` は 20 関数超を跨ぐため複数モジュールから import する。
- **内部相互依存はモジュール間 import で解決**: 例 `treeNodes.js` → `treeProgress.js`（`updateProgressRecursively`）→ `treeConstants.js`。依存方向を「constants ← 各機能」に一方向化し、循環依存を作らない。
- **`getFlattenedFlow` 内のハードコード `'GOAL'`/`'STRATEGY'`**: 移動時はそのまま維持。定数化は後続の「命名統一」タスクに委ねる（本タスクのスコープ外）。
- **テストファイルの配置・命名（重要）**: 下記 §6 参照。

## 5. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。関数のロジックは 1 文字も変えず、配置と import 経路のみ変更する。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。

## 6. テスト方針（bulletproof-react との整合）

- **「テストを 1 ファイル維持するか、モジュール毎に分割するか」の粒度判断は bulletproof-react の規定外である。**
  - bulletproof-react の `docs/testing.md` には「テストファイルを何個に分けるか」を定める規定は無い。
  - `docs/project-structure.md` の `testing` ディレクトリは「test utilities and mocks」の置き場であり、テストファイルそのものの配置を定めるものではない。
  - 出典:
    - https://github.com/alan2207/bulletproof-react/blob/master/docs/testing.md
    - https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
- **本タスクではテストの配置・命名を変えない**（既存の `treeLogic.test.js` の同居を維持し、import 経路の変更だけに留める）。
- **bulletproof 準拠を厳密に追う場合の対応（`__tests__/` サブディレクトリ化・`test_*.test.jsx` の命名統一）は、本タスクのスコープ外とし、別タスクとして切り出す。**

## 7. 完了の定義（DoD）

- `treeLogic.js` が 7 ファイル（6 モジュール＋1 定数）へ分割され、元の `treeLogic.js` が削除されている。
- 全 import サイトが新しいモジュールからの import に更新されている。
- barrel file が作られていない。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
- テストの配置・命名が変更されていない。
