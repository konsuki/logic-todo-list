# 論理削除（ソフトデリート）機能仕様書

## 概要
ゴールやタスクを誤って削除した際にデータを完全に失わないよう、「物理削除」の代わりに「論理削除（ソフトデリート）」を実装する。削除されたデータは `deletedAt` タイムスタンプを持つ「ゴミ箱」状態となり、LocalStorage に保持され続ける。ブラウザのリロードに関係なく、いつでも復元可能。

---

## データモデルの変更

### 追加フィールド: `deletedAt`
- **型**: `number | undefined`
- **意味**: Unix タイムスタンプ（ミリ秒）。値が存在するノードは「ゴミ箱に入っている」状態を意味する。
- **存在しない場合**: 通常の（アクティブな）ノードとして扱われる。

```js
// 通常ノード
{ id: "...", title: "...", ... }

// 論理削除済みノード
{ id: "...", title: "...", ..., deletedAt: 1747325845123 }
```

---

## 実装の変更点

### `src/logic/treeLogic.js`

| 関数 | 変更内容 |
|---|---|
| `softDeleteNode(nodes, nodeId)` | **新規追加**: 対象ノードと全子孫に `deletedAt` を付与。親の progress を再計算。 |
| `restoreNode(nodes, nodeId)` | **新規追加**: 対象ノードと全子孫から `deletedAt` を除去。親の progress を再計算。 |
| `permanentDeleteNode(nodes, nodeId)` | **新規追加**: 物理的にノードと子孫を削除（旧 `deleteNode` と同等）。 |
| `deleteNode` | **廃止**（`permanentDeleteNode` にリネーム）。 |
| `calculateNodeProgress` | `activeChildren`（`deletedAt` を持たない子のみ）を基準に計算するよう変更。 |
| `getFlattenedFlow` | `deletedAt` ノードをトラバース時にスキップするよう変更。 |
| `getVisibleNodesList` | `deletedAt` ノードをトラバース時にスキップするよう変更。 |
| `buildArboristTree` | `deletedAt` を持つ子ノードを除外するよう変更。 |

### `src/hooks/useTodoTree.js`

| 変更 | 内容 |
|---|---|
| `handleDeleteNode` | `softDeleteNode` を呼ぶように変更（論理削除）。 |
| `handleRestoreNode` | **新規追加**: `restoreNode` を呼ぶ。 |
| `handlePermanentDeleteNode` | **新規追加**: `permanentDeleteNode` を呼ぶ。 |
| `rootNodes` | `deletedAt` を持つノードを除外するよう変更。 |
| `trashedRootNodes` | **新規追加**: `deletedAt` を持つルートノードの一覧。 |

### `src/App.jsx`

- `TrashView` コンポーネントをインポート。
- `restoreNode` / `permanentDeleteNode` / `trashedRootNodes` を `useTodoTree` から取得。
- `showTrash` 状態（`useState(false)`）を追加（現在は `SettingsPanel` から呼び出し）。
- `<TrashView>` を描画するように変更。

### `src/components/features/list/ListView.jsx`

- phaseフィルタの `checkVisibility` 関数で `deletedAt` ノードをスキップ。
- `filteredRoots` から `deletedAt` ノードを除外。

### `src/components/features/tree/TreeView.jsx`

- `buildHierarchy` 関数で `deletedAt` ノードをスキップ。
- `getDescendantIds` 関数で `deletedAt` 子ノードをフィルタリング。

---

## 新規コンポーネント

### `src/components/features/trash/TrashView.jsx`

**Props**:
| プロパティ | 型 | 説明 |
|---|---|---|
| `isOpen` | `boolean` | パネルの表示状態 |
| `onClose` | `function` | 閉じるコールバック |
| `trashedRootNodes` | `Node[]` | ゴミ箱のルートノード一覧 |
| `nodes` | `NodeMap` | 全ノードのマップ（子孫カウントに使用） |
| `onRestore` | `function(nodeId)` | 復元ハンドラ |
| `onPermanentDelete` | `function(nodeId)` | 完全削除ハンドラ |
| `t` | `function` | 翻訳関数 |

**動作**:
- 右側からスライドインするパネル形式。
- 削除されたルートノードを削除日時の降順で表示。
- 各アイテムに「復元」「完全削除」ボタンを表示。
- 完全削除には確認ダイアログを表示。
- ゴミ箱が空の場合は専用の空状態UIを表示。

---

## 制約・注意事項

- **親が削除済みの場合の子ノード**: 親ノードを論理削除すると、子孫も全て `deletedAt` が付与される。復元時は親ノード単位で復元され、全子孫が一緒に復元される。
- **ゴミ箱に表示されるのはルートノードのみ**: 子ノードが単独でゴミ箱に入ることはない（常に親ノードとセットで削除・復元される）。
- **キーボードショートカットの Delete/Backspace**: 引き続き論理削除（`deleteNode` → `softDeleteNode`）を呼ぶ。
