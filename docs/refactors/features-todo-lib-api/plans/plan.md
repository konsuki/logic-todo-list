# プラン: ドメインロジック・API の features/todo/lib/ と api/ への移動

## 大まかな手順

1. `src/features/todo/lib/` と `src/features/todo/api/` を新設し、ドメインロジック（treeLogic.js / treeLogic.test.js / importLogic.js）と API（aiApi.js）を移動（`git mv`）。
2. 移動した todo 固有フックの内部 import を修正する（3箇所）: `'../../../logic/...'` → `'../lib/...'`・`'../api/...'`。
3. components 内の参照を修正する（6箇所）: `'../../../../logic/treeLogic'` → `'../../lib/treeLogic'`、`'../../../../logic/importLogic'` → `'../../lib/importLogic'`。
4. 空になった `src/logic/` を削除する（`rmdir src/logic`）。
5. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
6. REVISIONS.md に子タスク完了を別エントリ（`[94]`）として追記する。
7. コミットする。
