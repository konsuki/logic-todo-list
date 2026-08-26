# プラン: i18n.js（翻訳データ）の共有層 lib/ への移動

## 大まかな手順

1. `src/logic/i18n.js` を `src/lib/i18n.js` へ移動（`git mv`）。
2. `src/hooks/useI18n.js` の import パスを修正する（`'../logic/i18n'` → `'../lib/i18n'`）。
3. `docs/features/i18n/spec.md` の翻訳リソースパスを更新する（`src/logic/i18n.js` → `src/lib/i18n.js`）。
4. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
5. REVISIONS.md に子タスク完了を別エントリ（`[90]`）として追記する。
6. コミットする。
