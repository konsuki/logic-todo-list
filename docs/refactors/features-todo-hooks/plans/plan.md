# プラン: 機能フックの features/todo/hooks/ への移動（＋ useI18n は共有 hooks/ へ）

## 大まかな手順

1. `src/features/todo/hooks/` ディレクトリを新設し、todo 固有フック（useTodoTree.js / useTodoTree.test.js / useShortcuts.js / useAI.js）を移動（`git mv`）。useI18n.js は共有 `src/hooks/` に残す。
2. 移動した todo 固有フックの内部 import を修正する（3箇所）: `'../logic/...'` → `'../../../logic/...'`。
3. `src/app/App.jsx` の import を修正する（2箇所）: useTodoTree / useShortcuts を `../features/todo/hooks/...` に変更（useI18n は変更不要）。
4. `src/features/todo/components/inspector/AIInsights.jsx` の import を修正する（1箇所）: `'../../../../hooks/useAI'` → `'../../hooks/useAI'`。
5. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
6. REVISIONS.md に子タスク完了を別エントリ（`[93]`）として追記する。
7. コミットする。
