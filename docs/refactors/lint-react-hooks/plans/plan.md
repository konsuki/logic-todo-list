# プラン: React Hooks ルール違反の解消（set-state-in-effect・exhaustive-deps）

## 大まかな手順

1. **Inspector.jsx の set-state-in-effect 解消**: タイトル編集リセットの useEffect を削除し、編集開始時に `setEditTitle` を呼ぶ補正を追加。
   - 対象: `src/components/features/inspector/Inspector.jsx`
   - 削除する useEffect（66-69 行）:
     ```js
     useEffect(() => {
       setIsEditingTitle(false);
       setEditTitle(node?.title || '');
     }, [selectedNodeId, node?.title]);
     ```
   - 補正: h2 タイトルの onClick（581 行）を `onClick={() => { setEditTitle(node.title); setIsEditingTitle(true); }}` に変更。これにより同一ノードのタイトル変更にも追従する。
   - 根拠: key による再マウントでノード切替時のリセットは担保される。ただし `node?.title` 依存（同一ノードのタイトル同期）は key では失われるため、編集開始時の補正で担保する。
2. **App.jsx に Inspector の key を付与**: `<Inspector key={selectedNodeId}>`。
   - 対象: `src/App.jsx` の `<Inspector ...>`（278 行付近）。
   - 変更: `<Inspector` に `key={selectedNodeId}` を追加。
   - 根拠: ノード切替時に Inspector 全体を再マウントし、内部 state（isEditingTitle 等）をリセットする。
3. **Inspector.jsx の sectionMap に InspectorTextarea の key を付与**: 各 `<InspectorTextarea key={selectedNodeId}>`。
   - 対象: `src/components/features/inspector/Inspector.jsx` の `sectionMap` 内の `InspectorTextarea`（description / intent / procedure の3箇所）。
   - 変更: 各 `<InspectorTextarea` に `key={selectedNodeId}` を追加。
   - 根拠: ノード切替時に各 textarea コンポーネントを再マウントし、`isEditing`/`isModalOpen` をリセットする。
4. **InspectorTextarea.jsx の set-state-in-effect 解消**: リセットの useEffect を削除。
   - 対象: `src/components/features/inspector/InspectorTextarea.jsx`
   - 削除する useEffect（33-36 行）:
     ```js
     useEffect(() => {
       setIsEditing(false);
       setIsModalOpen(false);
     }, [nodeId]);
     ```
   - 根拠: 親（Inspector.jsx）からの key={selectedNodeId} 付与により、ノード切替時に再マウントされ、state は初期値（false）にリセットされる。
5. **ListView.jsx の set-state-in-effect 解消**: 自動編集の useEffect を削除し、useState 初期値で判定。
   - 対象: `src/components/features/list/ListView.jsx` の `ArboristNode` コンポーネント。
   - 削除する useEffect（49-55 行）:
     ```js
     useEffect(() => {
       if (tree.props.editingNodeId === data.id) {
         setEditTitle(data.title);
         setIsEditing(true);
         setIsAutoEdit(true);
       }
     }, [tree.props.editingNodeId, data.id, data.title]);
     ```
   - 変更: `isAutoEdit` の初期値を `useState(() => tree.props.editingNodeId === data.id)` に変更。`isEditing` と `editTitle` の初期値も連動。
     ```js
     const [isEditing, setIsEditing] = useState(() => tree.props.editingNodeId === data.id);
     const [editTitle, setEditTitle] = useState(data.title);
     const [isAutoEdit, setIsAutoEdit] = useState(() => tree.props.editingNodeId === data.id);
     ```
   - 根拠: 新ノードは初回マウント時にのみ `editingNodeId === data.id` が成立するため、useState 初期値で判定できる（react-arborist は id ベースで差分マウント）。全選択用の `useEffect`（59-63 行）は依存配列が `[isEditing, isAutoEdit]` で問題ないため残す。
6. **TreeView.jsx の exhaustive-deps 解消**: 依存配列に `setEditingNodeId` を追加。
   - 対象: `src/components/features/tree/TreeView.jsx:382` の useEffect 依存配列。
   - 変更: 依存配列に `setEditingNodeId` を追加する。
   - 根拠: `setEditingNodeId` は App.jsx の `useState` setter で同一性が保証されるため、追加しても再実行は起きない。
7. **検証**: `npm run lint` で全エラー 0 件（exit 0）になったことを確認し、`npm run test:run` で既存テスト 53 件が通ることを確認する。
   - `npm run lint` 実行 → exit 0（problems 0 件）になることを確認。これで「lint が通る状態」が達成される。
   - `npm run test:run` 実行 → 既存テスト 53 件が pass することを確認（挙動非変更のため全件 green が期待値）。
   - 注意: 編集 UX（Inspector タイトル編集・InspectorTextarea 編集・ListView 自動編集）は専用の自動テストが無い可能性が高いため、lint + 既存テスト 53 件で挙動非変更を担保する。
