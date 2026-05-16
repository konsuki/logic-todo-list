# 実装計画：Impeccable Layout ロジックの適用

## 1. 現状分析
- TreeView の間隔設定は現在 `useState` の初期値として 400 や 140 といった値が設定されている。
- これらの値を `impeccable` スキルが推奨する 8px グリッドに基づいた論理的な値に修正し、レイアウトの美しさを向上させる。

## 2. 修正手順

### 2.1 TreeView.jsx の初期値修正
- `spacingV`, `spacingH`, `containerHPadding`, `containerVPaddingTop`, `hierarchyGap` の `useState` 初期値を修正。

### 2.2 TreeView.jsx 内の定数修正
- 内部で使用されている `nodeWidth` (260) と `nodeHeight` (65) を 264 と 64 にそれぞれ変更。
- これに伴い、D3.js の座標計算（リンクの開始・終了位置など）に使用されている微調整値も 8px グリッドに合わせて見直す。

### 2.3 UI（Slider）の範囲修正
- 設定パネル内の `input type="range"` の `min`/`max`/`step` を 8px 刻みになるように調整（例: `step="8"`）。

## 3. 確認事項
- Tree 表示および Flow 表示において、ノード同士が重ならず、かつ論理的に心地よい間隔で配置されること。
- 設定パネルのスライダーが 8px 刻みで動作し、常にグリッドに沿った設定が可能になること。
