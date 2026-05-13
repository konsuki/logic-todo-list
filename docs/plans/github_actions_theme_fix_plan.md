# GitHub Actions Theme Update Plan

## 大まかな手順

1. **テーマ変数の再定義**: `src/constants/themes.js` を更新し、実際の画像から抽出した色（`#f6f8fa`, `#1f883d`など）と、影の変数（`--node-shadow`）を追加・修正する。
2. **App全体のテーマクラス付与**: `App.jsx` などで、現在選択されているテーマ名を `body` のクラス名（例: `theme-github`）として付与し、テーマ固有のCSSオーバーライドを可能にする。
3. **ノードとエンクロージャのCSSオーバーライド**: `src/components/features/tree/TreeView.css` に、`.theme-github` クラスを用いたCSSオーバーライド（ノードのシャドウ、ラインの実線化とアニメーション停止、エンクロージャの白背景化など）を追加する。
4. **表示の確認・微調整**: Viteの開発サーバーでブラウザ上の見た目を確認し、画像と完全に一致するようpaddingや細かな色味を調整する。

---
*※ ここから下の「手順の詳細化」は以降のターンで段階的に追記されます。*

## 手順の詳細化

### 1. テーマ変数の再定義
- **対象ファイル**: `src/constants/themes.js`
- **作業内容**: 
  - `themes.github.light` の色味を以下のように画像に完全に一致する色へ更新する。
    - `--bg-color`: `#f6f8fa`
    - `--surface-color`: `#ffffff`
    - `--border-color`: `#d0d7de`
    - `--success-color`: `#1f883d`
    - `--text-main`: `#24292f`
    - `--text-muted`: `#57606a`
  - ノードのドロップシャドウを再現するため、新規CSS変数を追加する。
    - `--node-shadow`: `0 1px 3px rgba(27, 31, 35, 0.12)` (light用)
    - `--node-shadow`: `0 1px 3px rgba(1, 4, 9, 0.8)` (dark用)

### 2. App全体のテーマクラス付与
- **対象ファイル**: `src/App.jsx`
- **作業内容**: 
  - `useEffect` フック内でテーマ変数を設定している箇所で、現在の `themeName` を `document.body.className` に付与する。
  - 例: `document.body.className = \`theme-${themeName}\`;`
  - 目的: `.theme-github` というプレフィックスを用いて、コンポーネント個別のCSS（特にTreeViewのSVGスタイル等）を安全にオーバーライドできるようにする。

### 3. ノードとエンクロージャのCSSオーバーライド
- **対象ファイル**: `src/components/features/tree/TreeView.css`
- **作業内容**: 
  - ファイルの末尾に `.theme-github` スコープを持つCSSルールを追加する。
  - `flow-link`: 点線アニメーションを無効化（`animation: none`, `stroke-dasharray: none`）し、色を `var(--border-color)`、透明度を `1` に上書きする。
  - `node-rect`: GitHub Actionsと同様の影を付けるため `filter: drop-shadow(var(--node-shadow))` を適用する（元々の色付けロジック `.node-rect.goal` 等への影響も考慮）。
  - `parent-enclosure`: 元々は透明度を持った枠だが、GitHubの枠のように白塗り（`fill: var(--surface-color) !important`）かつ不透明度100%（`opacity: 1 !important`）に変更する。

### 4. 表示の確認・微調整と完了処理
- **対象環境**: ローカルブラウザ (`npm run dev`)
- **作業内容**: 
  - 上記実装後、ユーザーに実際のブラウザ画面で「Flowモード」および「githubテーマ」の見た目を確認してもらう。
  - 問題がなければ、TODOリストの更新、`docs/REVISIONS.md` のタスク完了移動、およびコミットを行いタスクを完了する。
