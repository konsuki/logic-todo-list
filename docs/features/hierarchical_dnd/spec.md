# R11: react-arborist 階層D&D 実装仕様

## 概要
`react-arborist` を使い、リストビューにおいてGOAL/STRATEGY/ACTIONの階層構造全体を
ドラッグ&ドロップで並び替え・親変更できるようにする。

## 現在の実装の特性

### データ構造
- `nodes`: `{ [id]: { id, parentId, type, title, children: [id], order, ... } }` のフラットマップ
- `rootNodes`: `parentId === null` のノードの配列
- 順序管理: `node.order`（整数）で兄弟間の順序を管理

### 既存の関連ロジック（変更不要を目指す）
- `treeLogic.reorderNode(nodes, nodeId, direction)` - 上/下移動
- `treeLogic.outdentNode(nodes, nodeId)` - 親階層に移動
- `useTodoTree.js` の `reorderNode`・`updateNode` - ノード操作フック

### 現在のリストUIの構成
- `ListView.jsx` - ルートノードをループして `TodoItem` を表示
- `TodoItem.jsx` - 再帰的に子ノードを描画。展開/折畳み・選択・編集・削除・追加のUI

---

## react-arborist との統合方針

### データマッピング
react-arboristが要求する形式:
```js
{ id: string, name: string, children?: Node[] }
```

現在の `nodes` フラットマップ → react-arborist用ツリー配列への変換関数を `treeLogic.js` に追加する。

### D&D完了時の処理（onMove コールバック）
react-arboristの `onMove` は以下を提供する:
```js
onMove({ dragIds, parentId, index })
// dragIds: ドラッグしたノードのID配列
// parentId: ドロップ先の親ID（rootならnull）
// index: ドロップ先の兄弟内インデックス
```

これを受け取り `updateNode()` で `parentId` と `order` を更新する新しいハンドラ `handleMoveNode` を `useTodoTree.js` に追加する。

### ノードのカスタムレンダリング
既存の `TodoItem.jsx` の描画ロジックをそのまま流用するため、react-arboristの `children render prop` に既存コンポーネントを渡す形式にする。

---

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `package.json` | `react-arborist` を追加 |
| `src/logic/treeLogic.js` | `buildArboristTree()` 変換関数を追加 |
| `src/hooks/useTodoTree.js` | `handleMoveNode` を追加 |
| `src/components/features/list/ListView.jsx` | `Tree` コンポーネントで置き換え |
| `src/App.jsx` | `moveNode` プロップを `ListView` に渡す |
| `TodoItem.jsx` | arboristのrender propsに対応（最小限の変更）|
