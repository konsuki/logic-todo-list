# 実装計画：スイッチボタンの配置最適化 (UI Alignment & Balance)

## 1. 概要
TreeView の操作パネル（Tree/Flow、方向切り替え）の配置バランスを修正し、一貫性のあるレイアウトとスムーズな表示アニメーションを実装します。

## 2. 影響範囲
- `src/components/features/tree/TreeView.css`: コントロールパネルの整列、ボタン幅、アニメーション定義の更新。
- `src/components/features/tree/TreeView.jsx`: コントロールエリアのマークアップ微調整。

## 3. 実装ステップ

### ステップ 1: コンテナの整列強化
1.  **ブランチ作成**: `feature/fix-ui-alignment` を作成。
2.  `tree-controls` のパディングと位置を `top: 24px, left: 24px` に調整。
3.  `align-items: flex-start` を適用し、全ての要素が左端に揃うようにする。

### ステップ 2: ボタン・スタイルの規格化
1.  `mode-btn` に `min-width: 90px` と `justify-content: center` を追加。
2.  アイコンとテキストの間隔を `gap: 8px` で統一。

### ステップ 3: スムーズな展開アニメーション
1.  垂直方向の展開（Orientation パネル出現時）に `transition: all 0.3s ease` を適用。
2.  出現時に他の要素を急激に弾かないよう、マージンの推移を調整。

### ステップ 4: ガラス質感の磨き上げ
1.  `control-group-glass` のボーダーとシャドウを微調整し、より立体感のあるデザインへ。

## 4. テスト項目
- モードを切り替えた際に、左端のラインが一切ズレないか。
- Orientation ボタンが出現する際に、ヒントテキストが滑らかに移動するか。
- 様々な画面サイズにおいて、ボタンの配置が崩れないか。
