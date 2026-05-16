# 実装計画：ノード追加用キーボードショートカット

## 1. 概要
ユーザーからのリクエストにより、ツリーノード選択時のキーボードショートカット（`Enter` で兄弟追加、`Tab` で子追加、`Shift + Tab` でアウトデント）を実装する。
これにより、思考を妨げずに素早くツリー構造を構築できる UX を提供する。

## 2. 修正対象ファイルと変更内容

### 2.1 `src/logic/treeLogic.js`
アウトデント（`Shift + Tab`）機能のためのロジックを追加する。
- **追加関数**: `outdentNode(nodes, nodeId)`
  - 対象ノードの `parentId` を取得。
  - 親ノードが存在する場合、親ノードの `parentId`（祖父）を取得し、自身の新しい `parentId` として設定。
  - 元の親の `children` 配列から自身を削除し、新しい親の `children` 配列に自身を追加。

### 2.2 `src/App.jsx`
アプリケーション全体でのショートカット管理ロジックを拡張する。
- 既存のグローバルキーイベントハンドラ（`useEffect` 内の `keydown`）に分岐を追加。
- ノードが選択されている（`selectedNodeId !== null`）かつ、入力フィールド（`INPUT`, `TEXTAREA`）にフォーカスがない状態で以下のキーを捕捉：
  - `Enter`: 選択中ノードの親IDを取得し、`addNode` を呼び出して兄弟要素を追加。追加した新ノードのIDを選択＆編集モードへ移行。
  - `Tab`: `event.preventDefault()` を実行。`addNode` を呼び出して子要素を追加し、展開ステート（`expandedNodeIds`）を更新、新ノードを選択＆編集モードへ。
  - `Shift + Tab`: `event.preventDefault()` を実行。新設する `outdentNode` を呼び出す。

### 2.3 `src/components/features/tree/TreeView.jsx` & `src/components/features/list/ListView.jsx`
- 追加直後に新ノードを自動的に編集状態（インライン入力モード）にするためのステート（`editingNodeId` 等）が外部からトリガーできるように調整するか、App.jsx 側で編集開始のシグナルを送る仕組みを検討する。
- （現状、`TreeView.jsx` 内にローカルな `editingNodeId` ステートがある場合、App.jsx へのリフトアップ（持ち上げ）が必要になる可能性があるか確認する）

## 3. 実装上の留意点
- ブラウザのデフォルトのフォーカス移動（`Tab` キーによる操作）を確実に防ぐため、`keydown` イベント内で `preventDefault` を適切に呼ぶこと。
- 新規追加したノードの ID を即座に取得して選択状態にする必要があるため、`addNode` ロジックの戻り値等から新ノードIDを特定できるか確認する。
