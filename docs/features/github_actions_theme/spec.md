# GitHub Actions Theme Specification

## 概要
ユーザーから提供された実際のGitHub Actionsの画像に基づき、ノードのデザイン、背景色、ラインのスタイルを完全に一致させる修正を行う。

## 追加・修正する仕様詳細
画像分析から以下のCSS詳細を適用する。

### Color Palette (Light Mode を基準とするがDarkも追従)
- `--bg-color`: `#f6f8fa` (全体の背景)
- `--surface-color`: `#ffffff` (ノード・エンクロージャの背景)
- `--border-color`: `#d0d7de` (ノード・ライン・エンクロージャの枠線)
- `--success-color`: `#1f883d` (緑のチェックアイコン等)
- `--text-main`: `#24292f`
- `--text-muted`: `#57606a`
- `--btn-active-bg`: `#e6e6e6` (light) / `#21262d` (dark) - アクティブボタンの背景色
- `--btn-active-text`: `var(--text-main)` - アクティブボタンのテキスト色
- `--node-shadow`: `0 1px 3px rgba(27,31,35,0.12)` (ノードのドロップシャドウ)

### UIの振る舞い（CSSオーバーライド）
GitHub Actionsのワークフロー表示に近づけるため、テーマが `github` の場合（`body.theme-github` 等）に以下のスタイルを強制する。
1. **Flow Link (コネクタ線)**
   - アニメーション(`dashFlow`)や破線(`stroke-dasharray`)を無効化。
   - `stroke` を `var(--border-color)` にし、透明度を1にする。
2. **Node Rect (ノード自体)**
   - 背景色は `#ffffff` (var(--surface-color))。
   - ボーダーは `#d0d7de`。
   - シャドウ (`drop-shadow` または `box-shadow`) を付与。
3. **Enclosure (親要素の枠)**
   - 背景を白色(`var(--surface-color)`)に。
   - `opacity` は 1。
   - 枠線を `#d0d7de` とする。
4. **Active Buttons (トグル・ビュー切り替えボタン)**
   - `mode-btn.active` および `view-btn.active .active-bg` に対し、`--btn-active-bg` を背景色として適用する。
   - テキスト色は `--btn-active-text` とする。
   - 背景専用要素(`active-bg`)に対するデフォルトのシャドウを無効化する。
