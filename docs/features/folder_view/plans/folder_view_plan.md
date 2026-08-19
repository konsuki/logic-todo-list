# 実装プラン：フォルダ表示（検索・見つけやすさ特化モード）

## 大まかな手順

1. データモデル拡張：`src/logic/treeLogic.js` にフォルダ関連ロジック（フォルダ追加・削除・タスク割り当て）と `folderId` / `type: 'FOLDER'` サポートを追加する
2. `src/hooks/useTodoTree.js` にフォルダ操作ハンドラを追加する
3. リスト表示（`src/components/features/list/ListView.jsx`）に「論理ツリー ⇔ フォルダ」トグルとフォルダ階層表示を追加する
4. インスペクター（`src/components/features/inspector/Inspector.jsx`）にフォルダ割り当て UI を追加する
5. 設定（`src/logic/SettingsContext.jsx` / `SettingsPanel.jsx`）に「フォルダ機能を使う」トグルを追加する
6. `src/logic/i18n.js` に翻訳キーを追加する
7. テスト（`src/logic/treeLogic.test.js`）を追加する

## 詳細手順

### 1. データモデル拡張（treeLogic.js）

- **入力**: `src/logic/treeLogic.js`（既存の `NODE_TYPES`、`addNode`、`softDeleteNode` 等）
- **操作**:
  1. `NODE_TYPES` に `FOLDER: 'FOLDER'` を追加。
  2. 新規ノード作成（`addNode` / `addNodes` の `newNode` 生成部）に `folderId: null` を追加。`addTreeUnderNode` / `importTreeToNodes` にも同様に `folderId: null` を追加。
  3. フォルダを作る関数 `addFolder(nodes, parentFolderId, title)` を追加。フォルダは `type: 'FOLDER'`、`parentId` は `null`（因果ツリーには現れない）、`folderId` に親フォルダIDを持つ。
  4. フォルダを削除する関数 `deleteFolder(nodes, folderId)` を追加。対象フォルダと子孫フォルダを物理削除し、配下のタスクの `folderId` を `null` に戻す。
  5. タスクをフォルダへ割り当てる関数 `assignTaskToFolder(nodes, taskId, folderId)` を追加。`folderId` に null を渡せば「未整理」に戻す。
  6. フォルダ階層の循環参照防止を考慮（フォルダ同士の移動は今回はスコープ外のため、`addFolder` 時の親指定のみ考慮）。
- **出力**: フォルダ追加・削除・割り当てができる `treeLogic.js`。
- **注意**:
  - 進捗計算（`calculateNodeProgress`）は `parentId` ベースのまま変更しない。`FOLDER` ノードは `parentId: null` なのでルート扱いになる恐れがあるため、**rootNodes 算出時に `type === 'FOLDER'` を除外**する必要がある点を手順2で扱う。
  - `type: 'FOLDER'` のノードは `parentId: null` だが因果ツリーのルートではない、という整合を保つ。

### 2. useTodoTree.js へのフォルダ操作ハンドラ追加

- **入力**: `src/hooks/useTodoTree.js`
- **操作**:
  1. `handleAddFolder`（`useCallback`）を追加。`treeLogic.addFolder` を呼ぶ。
  2. `handleDeleteFolder` を追加。`treeLogic.deleteFolder` を呼ぶ。
  3. `handleAssignTaskToFolder` を追加。`treeLogic.assignTaskToFolder` を呼ぶ。
  4. **`rootNodes` の算出を修正**：現在は `!node.parentId && !node.deletedAt && !node.hidden`。ここに `&& node.type !== NODE_TYPES.FOLDER` を追加し、フォルダが因果ツリーのルートとして現れないようにする。
  5. フォルダ一覧を返す `folders`（`type === 'FOLDER'` かつ `!deletedAt && !hidden` のノード）を追加して return に含める。
  6. return に `addFolder` / `deleteFolder` / `assignTaskToFolder` / `folders` を追加。
- **出力**: フォルダ操作ができ、`folders` と因果ツリー（`rootNodes`）が正しく分離された `useTodoTree.js`。
- **注意**:
  - `rootNodes` の修正により、既存のツリー表示・リスト表示（論理ツリー）から `FOLDER` ノードが除外される。これが既存機能のデグレを防ぐ要。
  - `trashedRootNodes` / `hiddenRootNodes` にも `type !== 'FOLDER'` 相当の考慮が必要か確認（フォルダは削除＝物理削除なので、ゴミ箱に入らない方針。ただし整合のため確認）。

### 3. ListView.jsx へのフォルダモードトグルと階層表示

- **入力**: `src/components/features/list/ListView.jsx`
- **操作**:
  1. ローカル state に `displayMode`（`'logic' | 'folder'`）を追加。初期値 `'logic'`、localStorage 永続化は任意（今回は state のみで可）。
  2. ヘッダー（`list-view-header`）の `phase-filter-bar` 付近に、トグル（「論理ツリー ⇔ フォルダ」）を追加。クリックで `displayMode` を切り替える。設定 `settings.useFolderView` がオフの場合はトグルを非表示。
  3. `arboristData` の useMemo を拡張：
     - `displayMode === 'logic'` のときは既存ロジック（`parentId` ベース）をそのまま。
     - `displayMode === 'folder'` のときは、`folderId` を基準に階層を組む。
       - フォルダノード（`type === 'FOLDER'`）とタスクノードを混在させ、`folderId` が親を指すようにデータを整形。
       - `folderId: null` のタスクは「未整理」という仮想ルート（フォルダ）配下にまとめる。
       - フォルダ配下のタスクを `children` として並べる。
  4. フォルダモードでは、フォルダ行にディレクトリアイコン等を表示（`ArboristNode` で `data.type === 'FOLDER'` を判別）。
  5. タスク行クリックで `onSelectNode` → インスペクターを開く（既存どおり。フォルダ行クリックは選択せず展開/折りたたみのみ）。
- **出力**: 論理ツリーとフォルダを切り替えて表示できるリスト表示。
- **境界条件**:
  - フォルダが1つも無い場合、フォルダモードでは「未整理」配下に全タスクが並ぶ。
  - フォルダモードでも `deletedAt` / `hidden` のフィルタを適用。
  - フェーズフィルタはフォルダモードでは無効化する（または論理ツリーモードのみ表示）。混乱を避けるためトグルで表示を切り替える。
- **注意**:
  - react-arborist の `Tree` は単一の `data` ツリーを期待する。フォルダモード用のツリーを `buildFolderTree` 的なロジック（`treeLogic` に追加 or ListView 内で構築）で生成する。
  - フォルダの追加 UI（新規フォルダボタン）もここに置くか、手順4のインスペクターに置くかは実装時に確定。MVP ではインスペクター起点を主とし、リストにも簡易「＋フォルダ」ボタンを置く想定。

### 4. Inspector.jsx へのフォルダ割り当て UI

- **入力**: `src/components/features/inspector/Inspector.jsx`
- **操作**:
  1. `Inspector` の props に `folders`、`addFolder`、`assignTaskToFolder`、`deleteFolder` を追加（`App.jsx` 経由で配線）。
  2. `DEFAULT_SECTION_ORDER` に `folder` セクションを追加（例：`['description', 'intent', 'folder', 'ai', 'schedule', ...]`。既存の localStorage に保存済みの order がある場合は、既存の「missing 補完」ロジックが自然に `folder` を末尾に足す）。
  3. `sectionMap` に `folder` セクションを追加：
     - 選択中ノードがタスク（`type !== 'FOLDER'`）の場合のみ表示。
     - 現在の所属フォルダ（`node.folderId`）を表示。
     - フォルダのドロップダウン（`folders` 一覧＋「未整理」）で割り当てを変更。`assignTaskToFolder(node.id, folderId || null)` を呼ぶ。
     - 新規フォルダ作成ボタン（`addFolder` を呼び、作成後そのフォルダに割り当て）。
- **出力**: タスクのフォルダ割り当て・フォルダ作成ができるインスペクター。
- **境界条件**:
  - フォルダ未使用設定（`useFolderView` オフ）でもインスペクターのフォルダセクションは表示するか → 表示しない（フォルダ機能自体を使わないため）。
  - `deleteFolder` はフォルダ選択時のみ。ただし本手順ではフォルダ選択の入口が未確定のため、`deleteFolder` の UI 呼び出し口は手順3（リストのフォルダ行）側で担保する。
- **注意**:
  - `Inspector` は現在 `node` が無い場合は早期 return する。`FOLDER` ノードも `nodes[selectedNodeId]` として取得できるが、手順3でフォルダ行クリックは「選択しない」方針にしたため、インスペクターでフォルダを選択・削除する導線は MVP ではリスト側に寄せる。

### 5. 設定（SettingsContext / SettingsPanel）に「フォルダ機能を使う」トグル

- **入力**: `src/logic/SettingsContext.jsx` と `src/components/features/settings/SettingsPanel.jsx`
- **操作**:
  1. `SettingsContext.jsx` のデフォルト設定に `useFolderView: true` を追加。
  2. `SettingsPanel.jsx` の「表示設定（view_preferences）」セクションに、既存のトグル（showDescriptionInList 等）と同じ形式で「フォルダ機能を使う」トグルを追加。
     - アイコンは `Folder`（lucide-react）を使用。
     - ラベル・説明は i18n キー（手順6で追加）を参照。
     - `settings.useFolderView` を `updateSetting('useFolderView', e.target.checked)` で更新。
- **出力**: フォルダ機能の ON/OFF を切り替えられる設定。
- **境界条件**:
  - `useFolderView` がオフの場合、リスト表示のフォルダモードトグル（手順3）とインスペクターのフォルダセクション（手順4）を非表示にする。
  - オフにしても、既にフォルダに割り当て済みのデータ（`folderId`）は消さない（設定を戻せば再表示される）。
- **注意**:
  - 設定は `logido_settings` キーで localStorage に永続化される（既存 `SettingsContext` の仕組みをそのまま利用）。
  - デフォルト `true` としたが、既存ユーザーの localStorage に `useFolderView` キーが無い場合は `undefined` になるため、表示側では `settings.useFolderView !== false` で判定する（`false` のときだけ非表示）。

### 6. i18n.js への翻訳キー追加

- **入力**: `src/logic/i18n.js` の `translations.ja` と `translations.en`
- **操作**:
  1. `header` セクションに以下を追加：
     - `folder_view`: ja「フォルダ表示」/ en「Folder View」
  2. `list` セクションに以下を追加：
     - `logic_tree_mode`: ja「論理ツリー」/ en「Logic Tree」
     - `folder_mode`: ja「フォルダ」/ en「Folder」
     - `uncategorized`: ja「未整理」/ en「Uncategorized」
     - `new_folder`: ja「新規フォルダ」/ en「New Folder」
     - `enter_folder`: ja「フォルダ名を入力してください:」/ en「Enter folder name:」
  3. `inspector` セクションに以下を追加：
     - `folder`: ja「フォルダ」/ en「Folder」
     - `assign_folder`: ja「所属フォルダ」/ en「Folder」
     - `no_folder`: ja「未整理」/ en「Uncategorized」
  4. `settings` セクションに以下を追加：
     - `use_folder_view`: ja「フォルダ機能を使う」/ en「Use Folder View」
     - `use_folder_view_desc`: ja「因果とは独立したフォルダでタスクを整理できるようにします。」/ en「Organize tasks into folders independent of causality.」
- **出力**: ja/en 両方にキーが揃った `i18n.js`。
- **注意**:
  - キー名は既存の命名規則（snake_case、セクション配下）に合わせる。
  - 重複する概念（未整理・フォルダ）は、コンテキストごとに適切なキーを使う（list と inspector で別キーにしたが、共通化できるなら `common` 配下に寄せる選択もある。実装時に最小化を検討）。

### 7. テスト（treeLogic.test.js）追加

- **入力**: `src/logic/treeLogic.test.js`（Vitest 形式）
- **操作**: 以下をカバーするテストケースを追加。
  1. `addFolder`：フォルダが `type: 'FOLDER'`・`parentId: null`・`folderId`（親フォルダ指定時）で作成される。
  2. `assignTaskToFolder`：タスクの `folderId` が更新される。`null` を渡すと「未整理」に戻る。
  3. `deleteFolder`：フォルダと子孫フォルダが物理削除され、配下タスクの `folderId` が `null` に戻る。
  4. `rootNodes` 分離（`useTodoTree` のロジック相当）：`type === 'FOLDER'` のノードが因果ツリーのルートとして現れないこと。
  5. 進捗計算が `folderId` に影響されないこと（`parentId` ベースのまま）。
- **出力**: フォルダ機能のロジックを担保するテスト。
- **注意**:
  - `rootNodes` 分離は `useTodoTree` のロジック（React フック）にあるため、純関数としてテスト可能な形に切り出せないか検討。切り出しが難しい場合は、`treeLogic` に関数（例：`isFolderNode`）を追加してテストする。
  - 既存テストが `NODE_TYPES` や `addNode` の戻り値に依存している場合、`folderId: null` 追加による影響がないか確認。
