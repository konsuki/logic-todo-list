# 実装計画：ノード内文字列表示の最適化 (Scrollable Single-Line)

## 1. 概要
TreeView の各ノードにおいて、タイトルの表示を「1行固定・横スクロール可能・スクロールバー非表示」に改善します。

## 2. 影響範囲
- `src/components/features/tree/TreeView.jsx`: レンダリング方式の変更（`text` → `foreignObject`）
- `src/components/features/tree/TreeView.css`: 横スクロールおよびスクロールバー非表示のスタイル定義

## 3. 実装ステップ

### ステップ 1: foreignObject の導入
1.  **TreeView.jsx の更新**:
    - `.node-title-label`（SVG text）を削除。
    - `.node-title-container` を持つ `foreignObject` と `div` を追加。
    - ノードのクリックイベントが `foreignObject` 内の HTML 要素でも正しく動作するように調整。

### ステップ 2: スクロール制御のスタイリング
1.  **TreeView.css の更新**:
    - `.node-title-scroll-container` クラスを作成。
    - `white-space: nowrap`, `overflow-x: auto` を設定。
    - スクロールバーを非表示にするための Webkit 擬似要素等の設定を追加。

### ステップ 3: 操作性の向上
1.  スクロール時にノード自体のドラッグ（Pan）と干渉しないよう、イベントの伝播（Propagation）を確認。

## 4. テスト項目
- 長いタイトルが1行で収まり、マウスやトラックパッドで横にスクロールできるか。
- スクロールバーが表示されていないか。
- テキスト以外の部分（ノードの背景など）をクリックして正しくノードが選択されるか。
