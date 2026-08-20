# 実装プラン：フォルダ表示（＋論理ツリー）の検索ボックス

## 大まかな手順

1. i18n キーの追加（`src/logic/i18n.js`）
2. 検索候補抽出ロジックの追加（`src/logic/treeLogic.js` に純関数として追加）
3. 検索ボックス UI と候補一覧ドロップダウンの実装（`src/components/features/list/ListView.jsx`）
4. ジャンプ処理（展開・スクロール・選択）の実装（react-arborist の `TreeApi` ref 経由）
5. スタイル追加（`src/components/features/list/ListView.css`）
6. テスト追加（`src/logic/treeLogic.test.js`）

## 詳細手順

### 1. i18n キーの追加（`src/logic/i18n.js`）

- `translations.ja.list` と `translations.en.list` に以下を追加する。
  - `search_placeholder`: ja「検索...」/ en「Search...」
  - `search_no_results`: ja「見つかりませんでした」/ en「No results found」
- 既存の `list` セクション末尾（`add_subfolder` の後）に追記する。
- 既存の命名規則（snake_case、`list` 配下）に合わせる。

### 2. 検索候補抽出ロジックの追加（`src/logic/treeLogic.js`）

- 純関数 `searchNodes(nodes, query, options)` を追加する。`options.mode` で対象を絞る。
  - シグネチャ: `searchNodes(nodes, query, { mode })`
  - `query` を trim し、空なら `[]` を返す。
  - 大文字小文字を区別しない部分一致（`toLowerCase().includes()`）。
  - 正規表現特殊文字をエスケープする（`String.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` で RegExp を構築し `test`）。※ 実装は `includes` で足りるが、仕様の「エスケープ」方針を明示するため RegExp ベースにする。
  - **対象抽出ルール**:
    - `mode === 'folder'` → `type === 'FOLDER'` のノード名（`title`）＋タスク（`type !== 'FOLDER'`）のタイトル。ただし仮想「未整理」ルート（`id === '__unclassified__'`）は除外。
    - `mode === 'logic'` → タスク（`type !== 'FOLDER'`）のタイトルのみ。フォルダは対象外。
  - 共通で `deletedAt` / `hidden` が設定されたノードは除外。
  - 戻り値: マッチしたノードの配列。各要素は `{ id, title, type }` の形（UI で候補表示に使う）。
- 既存 `isFolderNode`（`src/logic/treeLogic.js` の末尾付近）と同様の export スタイルで追加する。
- 進捗計算・`parentId` ベースのロジックには変更を加えない。

### 3. 検索ボックス UI と候補一覧ドロップダウン（`src/components/features/list/ListView.jsx`）

- コンポーネント内に state を追加する。
  - `searchQuery`（入力値）
  - `searchOpen`（候補一覧の開閉。`searchQuery` が非空かつフォーカス中は true）
- `Search` アイコンを lucide-react から import に追加する。
- ヘッダー（`header-right` の先頭）に検索ボックスを配置する。
  - `<div className="search-box">` 内に `<Search size={14} />` と `<input>` を置く。
  - input の `placeholder` は `t('list.search_placeholder')`。
  - `onFocus` で `searchOpen` を true、`onBlur` で（クリックを逃さないよう `setTimeout` で）false にする。
- 候補一覧（ドロップダウン）:
  - `searchQuery` を `useMemo` で `searchNodes(nodes, searchQuery, { mode: displayMode })` に渡し、候補を算出。
  - 候補が空かつ `searchQuery` 非空なら「見つかりませんでした」（`t('list.search_no_results')`）を表示。
  - 各候補は `type === 'FOLDER'` ならフォルダアイコン、タスクなら種別ラベルを小さく表示。
  - 候補クリックで後述のジャンプ処理（手順4）を呼び、`searchOpen` を閉じて `searchQuery` をクリアする。
- 論理モード・フォルダモードの両方で表示する（`displayMode` に依存させない）。

### 4. ジャンプ処理（展開・スクロール・選択）の実装

- `<Tree>` に `ref={treeRef}` を追加し、`useRef(null)` を宣言する。react-arborist v3.6.1 は `forwardRef` で `TreeApi` を公開する（確認済み）。
- ジャンプハンドラ `handleSearchSelect(nodeId)` を `useCallback` で追加する。
  1. `treeRef.current?.openParents(nodeId)` で親を展開。
  2. `treeRef.current?.scrollTo(nodeId, 'center')` でスクロール（`Promise` を返すが await 不要）。
  3. `onSelectNode(nodeId)` で選択（インスペクターを開く）。
  4. 候補一覧を閉じ、`searchQuery` をクリア。
- フォルダモードでは `openParents` がフォルダ階層（`folderId` ベース）の展開に作用する。仮想「未整理」ルート配下のタスクは `__unclassified__` を親として展開されるが、`searchNodes` 側で仮想ルートを除外済みのため、候補は実在ノードのみ。
- 論理モードで親を展開すると、既存の `openState`（localStorage 永続化）と同期する必要がある点に注意。`onToggle` で管理している `openState` との整合を確認し、必要なら `openParents` 後の状態を `openState` に反映するか、`Tree` の `initialOpenState` との二重管理を避ける方針を実装時に確定する。

### 5. スタイル追加（`src/components/features/list/ListView.css`）

- `.search-box`（検索ボックス外枠）: 既存の `add-goal-btn` 等と高さを揃え、`display: flex; align-items: center;` でアイコンと入力欄を横並びにする。
- `.search-box input`: ボーダーなし・背景透過で、プレースホルダーは既存の `--border-color` 系変数で色付け。
- `.search-results`（候補一覧ドロップダウン）: `position: absolute` で検索ボックス直下に配置。`z-index` を既存のドロップダウン（モーダル等）より低く、リスト上に浮かせる程度に設定。`max-height` と `overflow-y: auto` を指定。
- `.search-result-item`: ホバー時背景色、選択不可（ジャンプ専用）。フォルダ行は `folder-icon`、タスク行は種別ラベルを小さく表示。
- テーマ変数（`--border-color` / `--primary-color` 等）を既存 CSS の流儀に合わせて使用する。

### 6. テスト追加（`src/logic/treeLogic.test.js`）

- `searchNodes` のテストを追加する（Vitest 形式）。
  1. `mode: 'logic'` でタスクタイトルの部分一致（大文字小文字無視）が返る。
  2. `mode: 'folder'` でフォルダ名＋タスクタイトルが返る。
  3. `deletedAt` / `hidden` のノードが除外される。
  4. 空クエリで `[]` を返す。
  5. 正規表現特殊文字（例: `(` や `.`）を含むクエリでも、文字列としてマッチする（エスケープ動作）。
  6. 仮想「未整理」ルート（`id: '__unclassified__'`）がフォルダモードで返らない。
- 既存テストが `NODE_TYPES` や `addNode` の戻り値に依存している場合は影響を確認する。
