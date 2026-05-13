# GitHub Actions Theme Specification

## 概要
GitHub Actionsのワークフローにおけるノード（Job）のデザインを模倣した新しいテーマ「github」を追加する。このテーマは、GitHubライクなクリーンな外観、フラットな境界線、明確なステータスカラーを特徴とする。

## 目的
ユーザーが「github」テーマを選択した際、全体的なUIがGitHub Actionsのノードデザインに合わせたスタイルになること。

## 色仕様 (Color Palette)

### Dark Mode (GitHub Dimmed/Dark)
- `--bg-color`: `#0d1117` (GitHubのメイン背景)
- `--surface-color`: `#161b22` (ノード/カードの背景)
- `--primary-color`: `#2f81f7` (GitHubのリンク/アクティブカラー)
- `--primary-glow`: `rgba(47, 129, 247, 0.2)`
- `--success-color`: `#238636` (成功時の緑)
- `--warning-color`: `#d29922` (進行中の黄)
- `--text-main`: `#c9d1d9`
- `--text-muted`: `#8b949e`
- `--border-color`: `#30363d` (ノードの境界線)
- `--glass-bg`: `rgba(22, 27, 34, 0.7)`
- `--glass-border`: `rgba(48, 54, 61, 0.8)`

### Light Mode (GitHub Default)
- `--bg-color`: `#f6f8fa` (GitHubのメイン背景)
- `--surface-color`: `#ffffff` (ノード/カードの背景)
- `--primary-color`: `#0969da` (GitHubのリンク/アクティブカラー)
- `--primary-glow`: `rgba(9, 105, 218, 0.1)`
- `--success-color`: `#1a7f37` (成功時の緑)
- `--warning-color`: `#bf8700` (進行中の黄)
- `--text-main`: `#24292f`
- `--text-muted`: `#57606a`
- `--border-color`: `#d0d7de` (ノードの境界線)
- `--glass-bg`: `rgba(255, 255, 255, 0.7)`
- `--glass-border`: `rgba(208, 215, 222, 0.8)`

## 適用箇所
1. `src/constants/themes.js` に `github` テーマ（dark/light）を追加
2. `src/logic/i18n.js` のテーマ一覧に `github` の翻訳を追加
3. `src/components/features/settings/SettingsPanel.jsx` のセレクトボックスに `github` オプションを追加
4. Nodeコンポーネントにおけるボーダーや背景がこのテーマ変数によって適切にGitHub Actions風になることを確認（現在の `themeMode` が適用された際に違和感がないか）
