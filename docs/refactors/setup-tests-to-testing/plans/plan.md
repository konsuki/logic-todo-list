# プラン: setupTests.js の testing/ への移動

## 大まかな手順

1. `src/testing/` ディレクトリを新設し、`src/setupTests.js` を移動（`git mv`）。
2. `vite.config.js` の `setupFiles` パスを修正する（`./src/setupTests.js` → `./src/testing/setupTests.js`）。
3. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
4. REVISIONS.md に子タスク完了を別エントリ（`[95]`）として追記する。
5. コミットする。
