# 詳細仕様：スイッチボタンの配置最適化 (UI Alignment & Balance)

## 1. 目的
TreeView 上の操作パネルにおいて、ボタンの配置、サイズ、および出現時の挙動を最適化し、ユーザーに精密で安定した操作感を提供する。

## 2. デザイン・ガイドライン

### 2.1 垂直軸の統一 (Axis Alignment)
- **現状**: 要素ごとに幅が異なり、左端の整列が不安定。
- **改善**: `tree-controls` コンテナ内の全ての要素の左端を 24px で厳密に固定。

### 2.2 ボタン・グループの規格化
- **最小幅**: モード切り替えボタンの最小幅を `100px` に設定し、文字数による幅の変動を抑える。
- **配置**: `justify-content: flex-start` を徹底し、要素が常に左から順に並ぶようにする。

### 2.3 レイアウトの動的安定性 (Layout Stability)
- **展開アニメーション**: 方向切り替えパネル（Horizontal/Vertical）が表示される際、`opacity` だけでなく `max-height` を用いたスライドアニメーションを適用し、下の要素（Hint）が滑らかに押し下げられるようにする。
- **一貫性**: `control-group-glass` クラスのパディングを `6px` で統一。

### 2.4 視認性の向上
- **ボーダー**: `1px solid hsla(0, 0%, 100%, 0.1)` の枠線を追加し、ガラス質感の輪郭を際立たせる。
- **アクティブ状態**: `active` クラス適用時の `box-shadow` をより繊細な拡散に変更。

## 3. 実装の技術的アプローチ
- **Flexbox の活用**: `display: flex` と `flex-direction: column` を基盤に、`align-items: flex-start` で整列を制御。
- **CSS Transition**: レイアウト変更時のジャンプを防ぐための `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` を適用。
