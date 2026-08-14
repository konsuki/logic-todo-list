# 実装プラン: ショートカットでのタスク追加後に自動でタイトル入力に入る（リスト表示）

## 大まかな手順

1. [App.jsx](src/App.jsx) で ListView に `editingNodeId` と `setEditingNodeId` を渡す。
2. [ListView.jsx](src/components/features/list/ListView.jsx) で props を受け取り、`tree.props` 経由で `ArboristNode` へ渡す。
3. `ArboristNode` に `useEffect` を追加し、`editingNodeId === data.id` のとき自動で編集モードに入り、確定時に `setEditingNodeId(null)` を呼ぶ。
4. 修正内容を手動確認（ビルド／動作確認）する。

## 手順の詳細

### 手順1: App.jsx で ListView に `editingNodeId` / `setEditingNodeId` を渡す（詳細）

**対象**: [App.jsx](src/App.jsx) の `<ListView>` 呼び出し部分（現行 219〜235 行目付近）。

**変更内容:**
- `<ListView>` の props に `editingNodeId={editingNodeId}` と `setEditingNodeId={setEditingNodeId}` を追加する。
- これらは既に `useShortcuts` と `<TreeView>` に渡しているものと同一の state / setter を再利用する。

**修正後イメージ:**
```jsx
<ListView
  nodes={nodes}
  rootNodes={rootNodes}
  addNode={addNode}
  deleteNode={deleteNode}
  hideNode={hideNode}
  toggleStatus={toggleStatus}
  updateNode={updateNode}
  selectedNodeId={selectedNodeId}
  onSelectNode={handleSelectNode}
  expandedNodeIds={expandedNodeIds}
  toggleExpand={toggleExpand}
  moveNode={moveNode}
  hiddenRootNodes={hiddenRootNodes}
  onOpenHiddenTasks={() => setIsHiddenTasksOpen(true)}
  editingNodeId={editingNodeId}
  setEditingNodeId={setEditingNodeId}
  t={t}
/>
```

**期待される結果:**
- ListView 側で `editingNodeId` / `setEditingNodeId` を受け取れるようになる（この時点ではまだ未使用）。

### 手順2: ListView.jsx で props を受け取り、`tree.props` 経由で `ArboristNode` へ渡す（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ListView` コンポーネント（props 定義と `<Tree>` の props）。

**変更内容:**
1. `ListView` の props 分割代入に `editingNodeId` と `setEditingNodeId` を追加する。
2. `<Tree>` に `editingNodeId={editingNodeId}` と `setEditingNodeId={setEditingNodeId}` を渡す（既存の `onUpdateNode` / `selectedNodeId` 等と同様、`ArboristNode` は `tree.props.xxx` で参照する）。

**修正後イメージ（props 定義）:**
```jsx
const ListView = ({
  nodes,
  rootNodes,
  addNode,
  deleteNode,
  hideNode,
  toggleStatus,
  updateNode,
  selectedNodeId,
  onSelectNode,
  expandedNodeIds,
  toggleExpand,
  moveNode,
  hiddenRootNodes,
  onOpenHiddenTasks,
  editingNodeId,
  setEditingNodeId,
  t
}) => {
```

**修正後イメージ（`<Tree>` への渡し）:**
```jsx
<Tree
  data={arboristData}
  onMove={...}
  ...
  selectedNodeId={selectedNodeId}
  editingNodeId={editingNodeId}
  setEditingNodeId={setEditingNodeId}
  ...
/>
```

**期待される結果:**
- `ArboristNode` が `tree.props.editingNodeId` / `tree.props.setEditingNodeId` で参照できるようになる。

### 手順3: `ArboristNode` に `useEffect` を追加（自動編集モード＆確定時クリア）（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` コンポーネント。

**変更内容:**

1. `useEffect` を追加し、`tree.props.editingNodeId === data.id` になったら `setEditTitle(data.title)` と `setIsEditing(true)` を実行する。
2. 確定処理 `handleTitleSubmit` の Enter / blur 分岐で、`setIsEditing(false)` する際に `tree.props.setEditingNodeId?.(null)` も呼ぶ。

**修正後イメージ（useEffect 追加）:**
```jsx
useEffect(() => {
  if (tree.props.editingNodeId === data.id) {
    setEditTitle(data.title);
    setIsEditing(true);
  }
}, [tree.props.editingNodeId, data.id, data.title]);
```

**修正後イメージ（handleTitleSubmit の確定時クリア）:**
```jsx
const handleTitleSubmit = (e) => {
  if (e.type === 'keydown') {
    e.stopPropagation();
  }
  if (e.key === 'Enter' || e.type === 'blur') {
    setIsEditing(false);
    tree.props.setEditingNodeId?.(null);
    if (editTitle.trim() !== data.title) {
      tree.props.onUpdateNode?.(data.id, { title: editTitle });
    }
  }
};
```

**変更のポイント:**
- `useEffect` の依存配列に `tree.props.editingNodeId` を含めることで、ショートカットで `setEditingNodeId(newId)` が呼ばれた際に自動で編集モードへ遷移する。
- 編集確定時に `setEditingNodeId(null)` を呼ぶことで、`editingNodeId` が残留し続けて別のタイミングで再発火するのを防ぐ。
- 前回修正（`inspector_title_edit_overwrite`）で `node-title` の `onClick` に追加した `setEditTitle(data.title)` はそのまま維持する。

**期待される結果:**
- リスト表示で Enter / Tab 追加直後に、新タスクが選択＆編集モードになる。
- 確定（Enter / blur）で編集モードが閉じ、`editingNodeId` がクリアされる。

### 手順4: 手動確認（詳細）

**対象**: 修正後のアプリを起動し、リスト表示でショートカット追加の挙動を確認する。

**確認項目:**
1. リスト表示でタスクを選択し、**Enter** を押す → 兄弟タスクが追加され、**そのままタイトル入力状態**になる。
2. そのままタイトルを入力して **Enter（または blur）** で確定できる。
3. リスト表示でタスクを選択し、**Tab** を押す → 子タスクが追加され、**そのままタイトル入力状態**になる（親は展開済み）。
4. 子タスク追加後にタイトルを入力して確定できる。
5. 複数連続で Enter / Tab 追加 → 入力 → 確定を繰り返し、スムーズに進むことを確認する。
6. 追加後に別ノードをクリックした場合、通常の選択動作に戻ること。
7. 前回までの修正（編集中のショートカット誤発火防止、インスペクター→リスト編集の保持）が引き続き機能することを確認する。
8. TreeView（ツリー表示）でも Enter / Tab 追加→自動編集が従来どおり機能することを確認する。

**確認方法:**
- `npm run dev` で起動し、ブラウザで手動確認する。
- 必要に応じて既存のテスト（`npm test`）が通ることを確認する。
