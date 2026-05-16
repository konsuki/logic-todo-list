# GitHub Actions Theme Buttons Plan

## 大まかな手順

1. **CSS変数の追加**: `src/constants/themes.js` の `github` テーマに、ボタンのアクティブ状態の背景色（`--btn-active-bg`）とテキスト色（`--btn-active-text`）を追加する。
2. **App.css の更新 (view-btn)**: `.theme-github` 下の `view-btn.active` とその内部の `.active-bg` に対し、CSS変数を用いたフラットなスタイルを適用する。
3. **TreeView.css の更新 (mode-btn)**: `.theme-github` 下の `mode-btn.active` に対し、同様にCSS変数を用いたスタイルを適用する。

---
*※ ここから下の「手順の詳細化」は以降のターンで段階的に追記されます。*

## 手順の詳細化

### 1. CSS変数の追加
- **対象ファイル**: `src/constants/themes.js`
- **作業内容**: 
  - `github.dark` テーマに `--btn-active-bg: '#21262d'` と `--btn-active-text: 'var(--text-main)'` を追加する。
  - `github.light` テーマに `--btn-active-bg: '#e6e6e6'` と `--btn-active-text: 'var(--text-main)'` を追加する。

### 2. App.css の更新 (view-btn)
- **対象ファイル**: `src/App.css`
- **作業内容**: 
  - ファイル末尾の GitHub オーバーライドセクションに以下を追加し、`view-btn` のアクティブ状態の色を上書きする。
  - `.theme-github .view-switcher button.view-btn.active` の `color` を `var(--btn-active-text) !important` に、`background-color` を `transparent !important` に設定する。
  - `.theme-github .view-switcher button.view-btn.active .active-bg` の `background-color` を `var(--btn-active-bg) !important` に設定する（シャドウは全体無効化で対応済み）。

### 3. TreeView.css の更新 (mode-btn) と完了処理
- **対象ファイル**: `src/components/features/tree/TreeView.css`
- **作業内容**: 
  - ファイル末尾の GitHub オーバーライドセクションに以下を追加する。
  - `.theme-github .control-group-glass button.mode-btn.active` の `color` を `var(--btn-active-text) !important` に、`background-color` を `var(--btn-active-bg) !important` に設定する。
  - 全ての実装完了後、画面を確認し、問題なければTODOリストの更新、コミットを行い、タスクを完了する。
