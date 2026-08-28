# ドメイン用語の命名を統一する（マジック文字列 → 定数参照へ）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: ドメイン用語（ノード種別・ステータス・フェーズ・表示モード）が裸の文字列リテラルとしてソースコードに散在しており、(1) 意図が名前から読み取れず、(2) typo しても実行時に静かに分岐が外れるため検知しづらい。既存定数または新規定数へ置換して名前で意図を示す。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「裸の文字列リテラル → 定数参照」への置換のみ。
- ロジック・値は 1 文字も変更しない（値の意味を名前で示すのが目的）。

## 3. 定数設計と配置方針

### 配置方針の根拠

- bulletproof-react 原本の `project-structure.md` には `config`（`global configurations, exported env variables etc.`）の記述しかなく、アプリ内 UI 状態定数の配置ルールは存在しない。
- 本アプリの `architecture.md` §4.4 の一方向依存（shared → features → app）に従うと、アプリ横断の UI 状態（`view`）の定数を feature 配下に置くと「App が feature の定数に依存する」逆方向依存が生じる。
- よって、アプリ横断で使う `VIEW_MODE` は共有層 `src/constants/` に、todo 機能に閉じた `DISPLAY_MODE` / `PHASES` は `src/features/todo/lib/treeConstants.js` に置く。

### 定数一覧

| 定数 | 配置先 | 値 | 対象 |
|---|---|---|---|
| `NODE_TYPES` / `NODE_STATUS` | 既存 `src/features/todo/lib/treeConstants.js`（利用のみ） | — | ノード種別・ステータス |
| `PHASES`（新規追記） | `src/features/todo/lib/treeConstants.js` | `{ PREP: 'PREP', EXEC: 'EXEC', REVIEW: 'REVIEW', ALL: 'ALL' }` | フェーズ（`ALL` 含む） |
| `DISPLAY_MODE`（新規追記） | `src/features/todo/lib/treeConstants.js` | `{ LOGIC: 'logic', FOLDER: 'folder' }` | ListView の表示モード |
| `VIEW_MODE`（新規ファイル） | `src/constants/views.js` | `{ LIST: 'list', TREE: 'tree', PREVIEW: 'preview' }` | App の view 状態 |

### 数値の定数化（命名のみ）

- 期日3日判定 `3 * 24 * 60 * 60 * 1000` → 名前付き定数（ArboristNode.jsx / TodoItem.jsx）
- 説明プレビュー `substring(0, 50)` → 名前付き定数（ArboristNode.jsx / TodoItem.jsx）

## 4. 普通ではないケース・境界条件

- **`'ALL'` の扱い**: フェーズフィルタの「全件」を表す特殊値だが、既存コードで `['ALL', 'PREP', 'EXEC', 'REVIEW']` と同一 UI グループに並ぶため、`PHASES` に `ALL` を含めて「フェーズフィルタの全選択肢」を一箇所に集約する。
- **`view` と `displayMode` の区別**: `view`（list/tree/preview）は App の UI 状態、`displayMode`（logic/folder）は ListView の表示モード。値は似ているが別概念なので、`VIEW_MODE` と `DISPLAY_MODE` に分離する。
- **`searchNodes` の `mode`（'logic'/'folder'）**: `treeDisplay.js` の検索スコープ。値は `DISPLAY_MODE` と同じだが意味が異なる（検索スコープ）。本タスクでは `DISPLAY_MODE` と同一視せず、そのまま維持するか、`SEARCH_MODE` として別定数にするかは**対象外**（既存の `searchNodes` の API を変えない）。
- **`TreeView` は既に定数化済み**（`treeViewConstants.js` の `LAYOUT_MODE` 等）: 対象外。
- **`useShortcuts.js` の `'New Task'`**: デフォルト文言。ドメイン用語ではないため対象外（コメント調整タスクで扱う）。
- **barrel file の禁止（§4.2）**: `index.js` は作らず直接 import。

## 5. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。ロジック・値は変えず、文字列リテラルの定数参照への置換のみ。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。

## 6. 完了の定義（DoD）

- `PHASES` / `DISPLAY_MODE` が `treeConstants.js` に、`VIEW_MODE` が `src/constants/views.js` に定義されている。
- 対象の裸のマジック文字列（ノード種別・ステータス・フェーズ・表示モード・数値）が定数参照に置換されている。
- barrel file が作られていない。
- `npm run lint` / `npm run test:run`（53 件）/ `npm run build` が全て通る。
