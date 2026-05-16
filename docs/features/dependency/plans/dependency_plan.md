# 実装計画：依存関係の導入と可視化 (Dependency Management)

## 1. 概要
ロジックツリーにタスクの実行順序（依存関係）を導入し、先行タスク未完了時のロック機能と視覚的な繋がりを実装します。

## 2. 影響範囲
- `src/logic/treeLogic.js`: ノード削除時の依存関係クリーンアップ、循環参照チェック
- `src/hooks/useTodoTree.js`: `dependsOn` の操作（追加・削除）機能の提供
- `src/components/features/list/TodoItem.jsx`: ロック状態の UI 表示とチェックボックス制御
- `src/components/features/tree/TreeView.jsx`: 依存関係を示すオレンジ色の破線矢印の描画
- `src/components/features/inspector/Inspector.jsx`: 依存関係の管理セクション（Predecessors）の追加

## 3. 実装ステップ

### ステップ 1: データ層とロジックの拡張
1.  **ブランチ作成**: `feature/dependency-management` を作成。
2.  **treeLogic.js の更新**:
    - `dependsOn` フィールドのサポート。
    - ノード削除時に他のノードの `dependsOn` から削除するロジック。
3.  **useTodoTree.js の更新**:
    - `addDependency(id, predecessorId)`
    - `removeDependency(id, predecessorId)`
    - 循環参照（A -> B -> A）を防ぐためのチェックロジック。

### ステップ 2: List View での実行制限（ロック）
1.  **TodoItem.jsx の更新**:
    - 依存タスクが全て `DONE` か判定する `isLocked` フラグの算出。
    - `isLocked` 時のスタイル（opacity, pointer-events: none）。
    - 鍵アイコンとツールチップ（「〇〇を先に完了させてください」）の追加。

### ステップ 3: Tree View での可視化
1.  **TreeView.jsx の更新**:
    - D3.js を使用して、親子関係とは別のリンクレイヤーを追加。
    - オレンジ色の細い破線で、先行から後続への矢印を描画。
    - ノードが多い場合の視認性調整。

### ステップ 4: インスペクターでの管理 UI
1.  **Inspector.jsx の更新**:
    - 既存のノードから先行タスクを選択できる検索・セレクトボックスを実装。
    - 現在の依存関係一覧の表示と解除ボタン。

## 4. リスク・留意点
- 依存関係が複雑になった際の Tree View の視認性（矢印が交差しすぎる問題）。
- 循環参照が発生しないよう、UIおよびロジックの両面でガードをかける。
