# setupTests.js の testing/ への移動

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `docs/core/architecture.md` の目標形（§1）は `testing/setupTests.js` と記述しているが、実際は `src/setupTests.js` のまま残っており、ドキュメントと実装が乖離している。bulletproof-react の `testing/`（テスト用ユーティリティ）に準拠して移動し、乖離を解消する。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- テストセットアップ（`@testing-library/jest-dom` の import）の流れは不変。変更は「ファイルの配置場所」と「vite.config.js の参照パス」のみ。

## 3. 普通ではないケース・境界条件

- **参照は vite.config.js の 1 箇所のみ**: `setupFiles: './src/setupTests.js'`。他に `setupTests.js` を参照するファイルはない。
- **setupTests.js の中身は 1 行のみ**（`import '@testing-library/jest-dom';`）で、内部 import はないため変更不要。
- **vite.config.js のパス修正は必須**: 修正しないとテスト実行時にセットアップファイルが見つからず失敗する。

## 4. 優先順位・本当に必要なもの

- **対応する**: setupTests.js の移動＋ vite.config.js のパス修正。
- **対応しない**: setupTests.js の内容変更、他のテスト設定の変更。

## 5. 変更内容のまとめ

### 移動

| 移動前 | 移動後 |
|---|---|
| `src/setupTests.js` | `src/testing/setupTests.js` |

### 参照パス修正

1. `vite.config.js:83`: `setupFiles: './src/setupTests.js'` → `'./src/testing/setupTests.js'`

## 6. 完了の定義（DoD）

- `src/testing/setupTests.js` が配置されている。
- `vite.config.js` の setupFiles パスが更新されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
