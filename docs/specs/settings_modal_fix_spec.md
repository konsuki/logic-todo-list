# 修正仕様：TreeView 設定パネルの表示修正

## 1. 背景
グローバル設定 UI（`SettingsPanel`）の導入に伴い、既存の TreeView 内の設定パネルと CSS クラス名（`.settings-panel`）が衝突。これにより、TreeView のフローティングパネルがグローバルのスタイル（固定配置、サイドバー幅など）を継承してしまい、表示が崩れる問題が発生した。

## 2. 修正仕様

### 2.1 クラス名の改称
衝突を避けるため、TreeView 固有の設定パネル関連クラスを以下の通り改称する。

| 変更前 | 変更後 | 説明 |
| :--- | :--- | :--- |
| `.settings-panel` | `.tree-settings-content` | 設定項目のリストを包むコンテナ |
| `.settings-floating-panel` | `.tree-settings-floating-wrapper` | フローティング表示されるパネル全体のラッパー |
| `.setting-item` | `.tree-setting-item` | 個々の設定項目 |
| `.panel-header` | `.tree-panel-header` | パネルのヘッダー |
| `.close-panel-btn` | `.tree-close-panel-btn` | パネルを閉じるボタン |

### 2.2 デザインの維持
- 既存の D3.js 連携によるパラメータ調整機能（Spacing V/H 等）はそのまま維持する。
- グラスモフィズムの外観を維持しつつ、グローバルな `.settings-panel` の干渉を受けないようにする。

## 3. 影響範囲
- `src/components/features/tree/TreeView.jsx`
- `src/components/features/tree/TreeView.css`

## 4. 期待される結果
- TreeView 右下の歯車アイコンをクリックした際、以前と同じようにボタンの上に設定パネルが表示される。
- ヘッダーの設定ボタンから開く「グローバル設定パネル」は、引き続き画面右側のサイドバーとして正しく機能する。
