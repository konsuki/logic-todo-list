# テスト環境（Vitest, React Testing Library）導入・セットアップ仕様書

## 概要
フロントエンド（React/Vite）プロジェクトに対する単体テスト・コンポーネントテストを実施できるようにするため、Vitest および React Testing Library の環境を構築する。

---

## 目的
- XSS修正や新規ロジックなどのコンポーネントごとの仕様・振る舞いをコードベースで保証できるようにする。
- Viteを利用したビルド環境であるため、Viteとの親和性が非常に高い（同じ設定ファイルを利用可能で高速な）Vitestを採用する。
- 仮想DOMを用いたUIコンポーネントテストを行うため、`jsdom` および `@testing-library/react` を導入する。

---

## 実装仕様

### 1. 導入パッケージ
- **vitest**: テストランナー本体。
- **@testing-library/react**: ReactコンポーネントのレンダリングやDOM操作の検証用。
- **@testing-library/jest-dom**: DOM要素に対するカスタムマッチャー（例: `.toBeInTheDocument()`, `.toHaveTextContent()` など）の提供。
- **jsdom**: Node.js環境内でブラウザのDOM APIをシミュレートするための環境。

### 2. 設定ファイル (`vite.config.js`)
- `vite.config.js` に `test` プロパティを追加し、以下の設定を行う。
  - `environment: 'jsdom'` (ブラウザ環境をモック)
  - `globals: true` (describe, it, expect などをインポート無しで利用可能にする。※必要に応じて)
  - `setupFiles: './src/setupTests.js'` (jest-dom等の初期化処理)

### 3. 初期化ファイル (`src/setupTests.js`)
- `@testing-library/jest-dom` をインポートし、テスト実行前に自動でカスタムマッチャーが読み込まれるようにする。

### 4. NPM スクリプト
- `package.json` に以下のスクリプトを追加する。
  - `"test": "vitest"`
  - `"test:run": "vitest run"`

---

## 期待される結果
- `npm run test` コマンドで、既存の `test_TreeView.test.jsx` が実行され、正しい結果（Pass または Fail）がコンソールに出力されること。
