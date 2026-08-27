# プラン: app/ 層の新設（main.jsx / App.jsx / App.css / provider.jsx）

## 大まかな手順

1. `src/app/` ディレクトリを新設し、`main.jsx` / `App.jsx` / `App.css` を移動（`git mv`）。
2. `src/app/provider.jsx` を新規作成し、`AppProvider`（SettingsProvider を内包）を定義する。
3. `src/app/main.jsx` を書き換え、`AppProvider` でラップする形に変更し、import パスを修正する。
4. `src/app/App.jsx` の相対 import（`./` → `../`）を一括修正する。
5. `index.html` の `/src/main.jsx` を `/src/app/main.jsx` に更新する。
6. `npm run lint`（exit 0）と `npm run test:run`（53 件 pass）で検証する。
7. REVISIONS.md に子タスク完了を別エントリ（`[91]`）として追記する。
8. コミットする。
