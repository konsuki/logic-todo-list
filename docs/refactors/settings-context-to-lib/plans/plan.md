# プラン: 設定コンテキストの共有層 lib/ への移動（SettingsContext.jsx → SettingsProvider.jsx にリネーム）

## 大まかな手順

1. `src/lib/` ディレクトリを新設し、`src/logic/settings.js` を `src/lib/settings.js` へ移動（`git mv`）。
2. `src/logic/SettingsContext.jsx` を `src/lib/SettingsProvider.jsx` へリネーム移動（`git mv`）。
3. import パスを修正する（6ファイル）:
   - `src/main.jsx`: `./logic/SettingsContext` → `./lib/SettingsProvider`
   - `src/components/features/inspector/Inspector.test.jsx`: `../../../logic/SettingsContext` → `../../../lib/SettingsProvider`
   - `src/components/features/settings/SettingsPanel.jsx`: `../../../logic/settings` → `../../../lib/settings`
   - `src/components/features/inspector/Inspector.jsx`: `../../../logic/settings` → `../../../lib/settings`
   - `src/components/features/list/TodoItem.jsx`: `../../../logic/settings` → `../../../lib/settings`
   - `src/components/features/list/ListView.jsx`: `../../../logic/settings` → `../../../lib/settings`
4. `src/logic/` ディレクトリが空になったら削除を検討（ただし後続タスクで残りファイルも移動するため、本タスクでは削除しない）。
5. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
6. docs の整合確認（`docs/core/architecture.md` の記述と実態が一致しているか）と REVISIONS.md 更新。
7. コミットする。
