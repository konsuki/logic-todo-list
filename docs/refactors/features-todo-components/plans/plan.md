# プラン: 機能 UI コンポーネントの features/todo/components/ への移動

## 大まかな手順

1. `src/features/todo/components/` ディレクトリを新設し、`src/components/features/` 配下の 7 機能（list/tree/inspector/search/settings/trash/import）を移動（`git mv`）。
2. `src/app/App.jsx` の import パスを修正する（9行）: `'../components/features/X'` → `'../features/todo/components/X'`。
3. 移動後の features 内の共有層参照を修正する（13箇所）: `'../../../logic/...'`・`'../../../hooks/...'`・`'../../../lib/...'` → `'../../../../...'`。
4. `src/components/features/` が空になったことを確認する（`src/components/` には sandbox/ のみ残る）。
5. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
6. REVISIONS.md に子タスク完了を別エントリ（`[92]`）として追記する。
7. コミットする。
