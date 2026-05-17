# 実装プラン：リストビュー階層ガイド線

## 1. 大まかな手順
1. `TodoItem.css` にガイド線のスタイルを追加する。
2. `ListView.jsx` の `ArboristNode` を修正し、`node.level` に基づいてガイド要素を描画するようにする。
3. レンダリング結果を確認し、位置や色の微調整を行う。

---

## 2. 手順の詳細化

### 2-1. `TodoItem.css` へのスタイル追加
- `.indent-guides-wrapper` : ノードの左端に配置されるインデントガイドのコンテナ。`display: flex`, `height: 100%` を持つ。
- `.indent-guide` : 個別の垂直線。`width: 24px` (indent幅), `border-right: 1px solid var(--border-color)` を持つ。
- 最後のガイドだけ少し色を変える、または特定の条件下で強調するなどの装飾も検討するが、まずはシンプルな一律の線とする。

### 2-2. `ListView.jsx` の `ArboristNode` 修正
- `react-arborist` から渡される `style` オブジェクトから `paddingLeft` を分離する。
- `style.paddingLeft` は、インデント線（ガイド）を表示するための領域として使用する。
- ノードの左側に、`level` 回のループで生成した `.indent-guide` 要素を配置する。
- これにより、ノードが深くなるほど左側に縦棒が増え、最終的にそれらが上下で繋がって一本の線に見えるようになる。

---
## 3. 次のステップ
1. レンダリング結果を確認し、位置や色の微調整を行う。
