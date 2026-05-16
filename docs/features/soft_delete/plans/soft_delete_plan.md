# 実装プラン：論理削除（ソフトデリート）機能

## 背景
「都営住宅に移住する」ツリーを誤って削除し、`localStorage`への即時上書きとブラウザリロードにより復旧不能になった問題への対策。

## 大まかな手順

- [ ] **Step 1**: `treeLogic.js` の `deleteNode` を「物理削除→論理削除」に変更する
- [ ] **Step 2**: `useTodoTree.js` に「ゴミ箱（削除済みノード）」関連のロジックを追加する
- [ ] **Step 3**: `App.jsx` でゴミ箱ビューへのルーティング・状態を追加する
- [ ] **Step 4**: ゴミ箱UIコンポーネント `TrashView` を新規作成する
- [ ] **Step 5**: 既存の各ビュー（TreeView/ListView/FlowView）で削除済みノードをフィルタリングする
- [ ] **Step 6**: 仕様書の作成・REVISIONS.md の更新・コミット

---

## 詳細手順

### Step 1: `treeLogic.js` の `deleteNode` を論理削除に変更

**変更方針**: `deleteNode` を廃止し、代わりに `softDeleteNode` を作成する。
- `nodeId` および全子孫ノードに `deletedAt: Date.now()` を付与するだけ。
- 親ノードの `children` 配列からは**除かない**（依存関係を温存するため）。
  - ただし表示上は `deletedAt` を持つノードを除外する。
- 依存関係（`dependsOn`）のクリーニングも**行わない**（復元したとき依存関係も戻るため）。

**追加する関数**:
```js
// 論理削除: 対象ノードと子孫全てに deletedAt タイムスタンプを付与
export const softDeleteNode = (nodes, nodeId) => { ... }

// 論理削除から復元: 対象ノードと子孫全ての deletedAt を削除
export const restoreNode = (nodes, nodeId) => { ... }

// 完全削除: ゴミ箱からも永久削除（従来の deleteNode と同等）
export const permanentDeleteNode = (nodes, nodeId) => { ... }  // 旧 deleteNode をリネーム
```

---

### Step 2: `useTodoTree.js` にゴミ箱ロジックを追加

**追加するハンドラ**:
```js
handleSoftDeleteNode(nodeId)   // → treeLogic.softDeleteNode を呼ぶ
handleRestoreNode(nodeId)      // → treeLogic.restoreNode を呼ぶ
handlePermanentDeleteNode(nodeId) // → treeLogic.permanentDeleteNode を呼ぶ
```

**追加する算出値**:
```js
// 論理削除されたルートノード一覧（ゴミ箱の中身表示用）
const trashedRootNodes = Object.values(nodes).filter(n => n.deletedAt && !n.parentId);
// ※ 子孫は parentId を辿って判定するため、ルートのみ抽出すれば十分
```

**既存の `rootNodes` の変更**:
```js
// 現在: const rootNodes = Object.values(nodes).filter(node => !node.parentId);
// 変更後: deletedAt を持つものを除外
const rootNodes = Object.values(nodes).filter(n => !n.parentId && !n.deletedAt);
```

---

### Step 3: `App.jsx` にゴミ箱ビューの状態を追加

- `showTrash` という `useState(false)` を追加。
- ヘッダーかサイドバーに「🗑 ゴミ箱」ボタンを追加し、`showTrash` をトグルする。
- `showTrash` が `true` のとき `<TrashView>` を表示する。

---

### Step 4: `TrashView` コンポーネントを新規作成

**ファイル**: `src/components/features/trash/TrashView.jsx`

**表示内容**:
- `trashedRootNodes` の一覧をカード形式で表示。
- 各カードに「復元」ボタン → `restoreNode(nodeId)` を呼ぶ。
- 各カードに「完全削除」ボタン → `permanentDeleteNode(nodeId)` を呼ぶ（確認ダイアログ付き）。
- ゴミ箱が空の場合は「ゴミ箱は空です」メッセージを表示。

---

### Step 5: 各ビューで `deletedAt` ノードをフィルタリング

- `TreeView.jsx` / `ListView` / `FlowView` は全て `rootNodes` を受け取って表示している。
- Step 2 で `rootNodes` から `deletedAt` を持つノードを除外しているため、**ビュー側の変更は最小限**。
- ただし `treeLogic` の各関数（`buildArboristTree`, `getFlattenedFlow`, `calculateNodeProgress` など）が削除済みの子ノードを参照する可能性があるため、以下を追加する:
  ```js
  // 各ロジック関数内で children を参照する際に削除済みを除外
  const activeChildren = node.children.filter(id => !nodes[id]?.deletedAt);
  ```

---

### Step 6: ドキュメント・コミット

- `docs/specs/soft_delete_spec.md` を作成。
- `docs/REVISIONS.md` を更新（未完了→完了済みへ移動）。
- `git commit -m "feat: implement soft delete (logical deletion) with trash view"`
