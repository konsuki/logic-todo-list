# 実装計画：実行順序の設定 (Execution Order)

## 1. 概要
同一階層内のタスクに対して明示的な順序 (`order`) を持たせ、リスト表示でのソートとナンバリング表示を実装します。

## 2. 影響範囲
- `src/logic/treeLogic.js`: `order` フィールドの追加、ノード追加・削除時の順序維持、順序入れ替えロジック
- `src/logic/i18n.js`: 順序調整ボタン用のラベル追加
- `src/components/features/list/ListView.jsx`: `order` に基づくソート処理
- `src/components/features/list/TodoItem.jsx`: ステップ番号の表示
- `src/components/features/inspector/Inspector.jsx`: 順序調整ボタン（上へ/下へ）の追加

## 3. 実装ステップ

### ステップ 1: データ拡張と初期値
1.  **ブランチ作成**: `feature/execution-order` を作成。
2.  **treeLogic.js の更新**: 
    - `addNode` 時に、兄弟ノードの最大 `order` + 1 を設定。
    - 既存の全ノードに対して `order` がない場合に初期値を割り振るマイグレーション処理。

### ステップ 2: 順序入れ替えロジックの実装
1.  **treeLogic.js に新機能追加**:
    - `reorderNode(nodeId, direction)` 関数を作成。
    - 対象ノードと、隣接するノードの `order` をスワップする。

### ステップ 3: UI への統合 (Inspector)
1.  **i18n.js の更新**: 「順序を上げる」「順序を下げる」等のラベルを追加。
2.  **Inspector.jsx の更新**: 
    - 順序調整用のボタンを設置。
    - `reorderNode` を呼び出すイベントハンドラを実装。

### ステップ 4: 表示への反映 (List/Item)
1.  **ListView.jsx の更新**: `children` を描画する前に `order` でソートするロジックを追加。
2.  **TodoItem.jsx の更新**: タスク名の横に `Step 1` などのバッジを表示。

## 4. テスト項目
- 新しいタスクを追加した際、末尾の番号が割り振られるか。
- 「上へ」ボタンを押して順番が入れ替わり、リストの並び順も変わるか。
- タスクを削除した際、他のタスクの順序に矛盾が生じないか。
