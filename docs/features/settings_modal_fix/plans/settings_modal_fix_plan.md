# 実装計画：TreeView設定パネルのUI崩れ修正

## 1. 現状分析
- **問題点**: グローバルな設定パネル（`SettingsPanel.jsx`）を導入した際、CSSクラス名 `.settings-panel` を使用した。
- **原因**: `TreeView.jsx` 内のフローティング設定パネルでも同じ `.settings-panel` というクラス名が使用されており、グローバルのスタイル（`position: fixed` や `right: 0` など）が適用されてレイアウトが崩れている。
- **解決策**: TreeView 内のローカルなクラス名をユニークな名称（例: `tree-settings-content`）に変更し、衝突を解消する。

## 2. 修正内容

### 2.1 TreeView.jsx の修正
- `className="settings-panel"` を `className="tree-settings-content"` に変更。
- `className="settings-floating-panel"` を `className="tree-settings-floating-wrapper"` に変更。
- `className="setting-item"` を `className="tree-setting-item"` に変更。
- `className="panel-header"` を `className="tree-panel-header"` に変更。
- `className="close-panel-btn"` を `className="tree-close-panel-btn"` に変更。

### 2.2 TreeView.css の修正
- 各クラスセレクタを上記の改称後の名称に変更。

## 3. 確認事項
- 修正後、TreeView 右下の歯車アイコンをクリックした際に、設定パネルが元の位置（ボタンの上）に正しく表示されることを確認する。
- グローバルな設定パネル（ヘッダーの歯車から開くもの）には影響がないことを確認する。
