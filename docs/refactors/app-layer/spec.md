# app/ 層の新設（main.jsx / App.jsx / App.css / provider.jsx）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: アプリの組み立て（エントリ `main.jsx`・`App.jsx`）が `src/` 直下に散在し、bulletproof-react の `app/` 層（アプリケーション層）に集約されていない。またグローバルプロバイダ（`SettingsProvider`）が `main.jsx` に直接書かれており、責務が混在している。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- アプリの起動フローは不変：`index.html` → `main.jsx` → `AppProvider`（SettingsProvider を内包）→ `App`。
- 変更は「ファイルの配置場所」「グローバルプロバイダの分離」「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **`provider.jsx` の新規作成（グローバルプロバイダの分離）**: bulletproof-react の `app/provider.tsx` は `AppProvider` を export し、アプリ全体をラップするグローバルプロバイダ群を束ねる。本アプリは React Query 等を持たないため、`AppProvider` は `SettingsProvider` で children をラップする形にする。
- **`index.html` の参照更新（唯一の html 修正）**: `index.html` は `/src/main.jsx` を参照しているため、`/src/app/main.jsx` に更新する。
- **`App.jsx` 内の相対 import の一括修正**: `App.jsx` は `./hooks/...`・`./components/...`・`./constants/...`・`./App.css` を参照している。`src/` → `src/app/` への移動で 1 階層深くなるため、これらはすべて `../` に修正する。外部ライブラリ（react, lucide-react, canvas-confetti, framer-motion）の import は変更不要。
- **`index.css` の扱い**: `main.jsx` が `./index.css` を import しているが、`index.css` は `src/` 直下に残す（グローバルスタイル）。移動後の `main.jsx` は `../index.css` に修正する。
- **`App.css` は App.jsx と一緒に移動**: `App.css` は `App.jsx` に付随するスタイルのため、`src/app/App.css` へ一緒に移動する。App.jsx 内の `import './App.css'` は同ディレクトリのまま成立。

## 4. 優先順位・本当に必要なもの

- **対応する**: app/ 層新設（main.jsx, App.jsx, App.css, provider.jsx）、index.html 参照更新、関連 import 修正。
- **対応しない**: App.jsx 内のロジック変更、App.css の内容変更、他の層の移動（後続タスク）。

## 5. 変更内容のまとめ

### 移動・新規

| 操作 | 内容 |
|---|---|
| 移動 | `src/main.jsx` → `src/app/main.jsx` |
| 移動 | `src/App.jsx` → `src/app/App.jsx` |
| 移動 | `src/App.css` → `src/app/App.css` |
| 新規 | `src/app/provider.jsx`（`AppProvider` を export） |

### import パス修正

1. `index.html`: `/src/main.jsx` → `/src/app/main.jsx`
2. `src/app/main.jsx`（移動後）:
   - `./index.css` → `../index.css`
   - `./App.jsx` → `./App.jsx`（同ディレクトリのため変更不要）
   - `./lib/SettingsProvider` → `../lib/SettingsProvider`
   - `SettingsProvider` のラップを `AppProvider` のラップに変更
3. `src/app/App.jsx`（移動後）: 以下の 13 行の `./` → `../`
   - `./hooks/useTodoTree` → `../hooks/useTodoTree`
   - `./hooks/useI18n` → `../hooks/useI18n`
   - `./hooks/useShortcuts` → `../hooks/useShortcuts`
   - `./components/features/list/ListView` → `../components/features/list/ListView`
   - `./components/features/tree/TreeView` → `../components/features/tree/TreeView`
   - `./components/features/inspector/Inspector` → `../components/features/inspector/Inspector`
   - `./components/features/settings/SettingsPanel` → `../components/features/settings/SettingsPanel`
   - `./components/features/import/ImportModal` → `../components/features/import/ImportModal`
   - `./components/features/trash/TrashView` → `../components/features/trash/TrashView`
   - `./components/features/list/HiddenTasksModal` → `../components/features/list/HiddenTasksModal`
   - `./components/sandbox/DesignSandbox` → `../components/sandbox/DesignSandbox`
   - `./components/features/search/SearchBar` → `../components/features/search/SearchBar`
   - `./constants/themes` → `../constants/themes`
   - （`./App.css` は同ディレクトリのため変更不要）

## 6. 完了の定義（DoD）

- `src/app/` に main.jsx / App.jsx / App.css / provider.jsx が配置されている。
- `index.html` が `/src/app/main.jsx` を参照している。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
