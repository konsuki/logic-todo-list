# App.jsx のテーマ適用と進捗祝賀ロジックをカスタムフックへ抽出する

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `src/app/App.jsx`（347 行）にテーマ適用・進捗祝賀（confetti）の 2 つの副作用ロジックが App 本体に混在しており、状態管理と副作用が分離されていない。カスタムフックへ抽出して App を薄くする。加えて、ListView へのデッド props（react-arborist 移行の残骸）を除去する。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「ロジックのフックへの抽出」と「import 経路」のみ。
- テーマ適用・confetti のロジック・値は 1 文字も変更しない。
- デッド props の除去は「未使用 props を渡さなくなる」だけで、ListView の挙動は不変（そもそも未受領のため）。

## 3. 変更内容

### 新規フック

| 新規フック | 配置先 | 返り値 | 内容 |
|---|---|---|---|
| `useTheme` | `src/hooks/useTheme.js` | `{ themeName, setThemeName, themeMode, setThemeMode }` | `themeName`/`themeMode` state ＋ テーマ適用 useEffect（App.jsx 68-85 行） |
| `useCelebration` | `src/features/todo/hooks/useCelebration.js` | `{ completedGoals }` | `completedGoals` state ＋ confetti の useEffect（App.jsx 116-136 行） |

### デッド props 除去

- `App.jsx` の `ListView` 呼び出し（235-260 行）から以下を除去:
  - `expandedNodeIds`, `toggleExpand`, `folders`, `assignTaskToFolder`
- `TreeView` 呼び出し（262-273 行）は `expandedNodeIds`/`toggleExpand` を使うため**変更しない**。

## 4. 普通ではないケース・境界条件

- **`useTheme` の配置**: bulletproof-react の `hooks/`（アプリ横断の共有フック）に該当するテーマ管理は `src/hooks/` に置く。既存の `useI18n.js` と同じ層。
- **`useCelebration` の配置**: todo 機能固有のため `src/features/todo/hooks/` に置く。
- **挙動不変**: テーマ適用・confetti のロジック・値は 1 文字も変更しない。
- **`useTheme` は `src/constants/themes.js` を import**: テーマ定数は共有層 `src/constants/` の既存ファイルから import する。
- **`useCelebration` は `canvas-confetti` を import**: `rootNodes` を受け取って祝賀を発火する。
- **barrel file の禁止（architecture.md §4.2）**: `index.js` は作らず直接 import する。

## 5. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。ロジック・値は変えず、フックへの抽出と import 経路のみ変更する。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。

## 6. 完了の定義（DoD）

- `src/hooks/useTheme.js` と `src/features/todo/hooks/useCelebration.js` が新設されている。
- `App.jsx` が `useTheme` / `useCelebration` を呼び出し、テーマ・祝賀の副作用が除去されている。
- `App.jsx` の `ListView` 呼び出しからデッド props（`expandedNodeIds` / `toggleExpand` / `folders` / `assignTaskToFolder`）が除去されている。
- barrel file が作られていない。
- `npm run lint` / `npm run test:run`（53 件）/ `npm run build` が全て通る。
