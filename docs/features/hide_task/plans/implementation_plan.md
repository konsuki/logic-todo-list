# タスク一時非表示機能 - 実装プラン

## 大まかな手順

### Step 1 詳細: treeLogic.js に非表示・再表示ロジックを追加

**1-1. 新規関数 `hideNode(nodes, nodeId)`**
- `softDeleteNode` と同様の構造で、対象ノードと全子孫に `hidden: true` を再帰的に付与
- 親の progress 再計算を行う（`deletedAt` と同じく hidden ノードは activeChildren から除外されるため）
- 配置場所: `softDeleteNode` の近く（L360 付近）

**1-2. 新規関数 `unhideNode(nodes, nodeId)`**
- `restoreNode` と同様の構造で、対象ノードと全子孫から `hidden` を再帰的に除去（`const { hidden, ...rest } = node` パターン）
- 親の progress 再計算を行う
- 配置場所: `hideNode` の直後

**1-3. `calculateNodeProgress` 修正 (L28)**
```diff
- const activeChildren = (node.children || []).filter(id => !nodes[id]?.deletedAt);
+ const activeChildren = (node.children || []).filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden);
```

**1-4. `getFlattenedFlow` 修正 (L513, L519)**
```diff
- if (!node || node.deletedAt) return;
+ if (!node || node.deletedAt || node.hidden) return;
```
```diff
- .filter(id => !nodes[id]?.deletedAt)
+ .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden)
```

**1-5. `getVisibleNodesList` 修正 (L554, L561)**
```diff
- if (!node || node.deletedAt) return;
+ if (!node || node.deletedAt || node.hidden) return;
```
```diff
- .filter(id => !nodes[id]?.deletedAt)
+ .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden)
```

**1-6. `buildArboristTree` 修正 (L584)**
```diff
- .filter(id => !nodes[id]?.deletedAt)
+ .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden)
```

### Step 2 詳細: useTodoTree.js に非表示・再表示ハンドラを追加

**2-1. `handleHideNode` ハンドラを追加**
- `softDeleteNode` と同様のパターンで、`treeLogic.hideNode` を呼ぶ
- 配置場所: `handlePermanentDeleteNode` の近く（L40 付近）

**2-2. `handleUnhideNode` ハンドラを追加**
- `handleRestoreNode` と同様のパターンで、`treeLogic.unhideNode` を呼ぶ
- 配置場所: `handleHideNode` の直後

**2-3. `rootNodes` のフィルタに `hidden` 条件を追加 (L189)**
```diff
- const rootNodes = Object.values(nodes).filter(node => !node.parentId && !node.deletedAt);
+ const rootNodes = Object.values(nodes).filter(node => !node.parentId && !node.deletedAt && !node.hidden);
```

**2-4. `hiddenRootNodes` の導出を追加**
- 非表示ルートノード（`hidden: true` かつ `deletedAt` を持たないルートノード）の一覧
- `trashedRootNodes` の近くに追加 (L192 付近)

**2-5. return オブジェクトに追加**
- `hideNode: handleHideNode`, `unhideNode: handleUnhideNode`, `hiddenRootNodes` を追加


### Step 3 詳細: i18n に翻訳キーを追加

**3-1. 日本語翻訳（`translations.ja`）に追加**
```js
common: {
  // ... 既存に追加
  hide_task: '非表示にする',
  unhide_task: '表示に戻す',
},
list: {
  // ... 既存に追加
  hidden_tasks: '非表示タスク',
  hidden_tasks_count: '非表示タスク ({count})',
  no_hidden_tasks: '非表示のタスクはありません。',
},
```

**3-2. 英語翻訳（`translations.en`）に追加**
```js
common: {
  // ... 既存に追加
  hide_task: 'Hide',
  unhide_task: 'Show',
},
list: {
  // ... 既存に追加
  hidden_tasks: 'Hidden Tasks',
  hidden_tasks_count: 'Hidden Tasks ({count})',
  no_hidden_tasks: 'No hidden tasks.',
},
```

**3-3. 配置場所**: `src/logic/i18n.js` の各言語セクション内、`common` と `list` オブジェクトにそれぞれ追加

### Step 4 詳細: ListView.jsx の ArboristNode アクションに非表示ボタン追加

**4-1. インポートに `EyeOff` を追加 (L3)**
```diff
- import { Target, Plus, Filter, ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle } from 'lucide-react';
+ import { Target, Plus, Filter, ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle, EyeOff } from 'lucide-react';
```

**4-2. ArboristNode の node-actions 領域に非表示ボタンを追加 (L173-196 付近)**
- 既存の削除ボタン（Trash2）の直前に追加
- クリックで `tree.props.onHideNode?.(data.id)` を呼ぶ（確認ダイアログなし）
- ツールチップ: `t('common.hide_task')`
- アイコン: `EyeOff size={16}`

**4-3. ListView の props 受け渡しに `onHideNode` を追加**
- `onHideNode` を `Tree` コンポーネントの props として渡す（既存の `onDeleteNode` 等と同様のパターン）

**4-4. TodoItem.jsx にも同様の変更を適用**
- インポートに `EyeOff` を追加
- node-actions 領域に非表示ボタンを追加
- props 経由で `onHide` を受け取る

### Step 5 詳細: 非表示タスク一覧モーダルコンポーネントの作成

**5-1. 新規ファイル `src/components/features/list/HiddenTasksModal.jsx`**
- `DescriptionModal.jsx` の構造を参考に、中央モーダル形式で実装
- `ReactDOM.createPortal` で `document.body` に描画
- framer-motion の `AnimatePresence` + `motion.div` でアニメーション付き
- CSS ファイル `HiddenTasksModal.css` も新規作成（DescriptionModal.css のスタイルをベースに調整）

**5-2. Props**
| prop | 型 | 説明 |
|------|-----|------|
| `isOpen` | `boolean` | モーダル表示状態 |
| `onClose` | `function` | 閉じるコールバック |
| `hiddenRootNodes` | `Node[]` | 非表示ルートノード一覧 |
| `nodes` | `NodeMap` | 全ノードマップ（子孫カウント用） |
| `onUnhide` | `function(nodeId)` | 表示に戻すハンドラ |
| `t` | `function` | 翻訳関数 |

**5-3. モーダル内容**
- ヘッダー: `EyeOff` アイコン + 「非表示タスク」タイトル + 件数バッジ + 閉じるボタン
- ボディ（空の場合）: 空状態UI（Inbox アイコン + 「非表示のタスクはありません」）
- ボディ（データあり）: 非表示タスクリスト
  - 各アイテム: タイプバッジ + タイトル + 子孫数 + 非表示日時（hiddenAt がない場合は省略）
  - 各アイテムのアクション: 「表示に戻す」ボタン（Eye アイコン + テキスト）

**5-4. CSS (`HiddenTasksModal.css`)**
- `DescriptionModal.css` のスタイルを踏襲（中央モーダル、backdrop、角丸、シャドウ）
- モーダルサイズ: 幅 500px, 高さ max 70vh
- リストアイテムのスタイルは `TrashView.css` の `.trash-item` 系を流用


### Step 6 詳細: App.jsx でモーダルとハンドラを統合

**6-1. useTodoTree から新規エクスポートを取得 (L18-37)**
```diff
  const { 
    nodes, 
    rootNodes,
    trashedRootNodes,
+   hiddenRootNodes,
    addNode, 
    ...
    restoreNode,
    permanentDeleteNode,
+   hideNode,
+   unhideNode,
    ...
  } = useTodoTree();
```

**6-2. モーダル状態の追加 (L43 付近)**
- `const [isHiddenTasksOpen, setIsHiddenTasksOpen] = useState(false);` を追加

**6-3. HiddenTasksModal のインポートと描画 (L290 付近、TrashView の直後)**
```jsx
import HiddenTasksModal from './components/features/list/HiddenTasksModal';

// TrashView の後に追加:
<HiddenTasksModal
  isOpen={isHiddenTasksOpen}
  onClose={() => setIsHiddenTasksOpen(false)}
  hiddenRootNodes={hiddenRootNodes}
  nodes={nodes}
  onUnhide={unhideNode}
  t={t}
/>
```

**6-4. ListView に props 追加**
- `hideNode` と `hiddenRootNodes`、`onOpenHiddenTasks` を ListView に渡す
- ListView のヘッダーに「非表示タスク (N)」ボタンを追加
  - アイコン: `EyeOff`
  - バッジ: `hiddenRootNodes.length` が 0 より大きい場合に表示
  - クリックで `onOpenHiddenTasks` (`setIsHiddenTasksOpen(true)`) を呼ぶ

**6-5. ListView.jsx の props とヘッダー修正**
- `hideNode`, `hiddenRootNodes`, `onOpenHiddenTasks` を props として受け取る
- ヘッダーの phase-filter-bar の隣に「非表示タスク」ボタンを追加
- `EyeOff` アイコンを lucide-react からインポート




