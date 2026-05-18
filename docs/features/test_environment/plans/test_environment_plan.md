# 実装プラン：テスト環境の導入とセットアップ

## 1. 大まかな手順
1. npm パッケージのインストール
2. `vite.config.js` の設定追加と `setupTests.js` の作成
3. `package.json` への scripts の追加
4. テスト実行による動作確認

---

## 2. 手順の詳細化

### 2-1. npm パッケージのインストール
- ターミナルで以下のコマンドを実行し、必要なパッケージを開発依存 (`-D`) としてインストールする。
  `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

### 2-2. `vite.config.js` の設定追加と `setupTests.js` の作成
- プロジェクトルートに `src/setupTests.js` を作成し、`import '@testing-library/jest-dom';` を記述する。
- `vite.config.js` を開き、`defineConfig` の引数オブジェクトに `test` プロパティを追加する。
  ```javascript
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
  ```

### 2-3. `package.json` への scripts の追加
- `package.json` の `"scripts"` セクションに以下を追記する。
  - `"test": "vitest"`
  - `"test:run": "vitest run"` (CI環境等で1度だけ実行するためのコマンド)

### 2-4. テスト実行による動作確認
- ターミナルで `npm run test` を実行する。
- 以前作成した `test_TreeView.test.jsx` が自動で検出され、PASSすることがコンソールに表示されるか確認する。
- 問題なければ終了。

---
## 3. 次のステップ
- （全ての手順の詳細化が完了しました。ユーザーの承認を得て実装を開始します。）
