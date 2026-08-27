# 機能 UI コンポーネントの features/todo/components/ への移動

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: 機能固有の UI コンポーネント（list/tree/inspector/search/settings/trash/import）が `src/components/features/` に置かれ、bulletproof-react の「コードの大部分を `features/` に集約する」原則に反している。機能モジュール `features/todo/components/` へ移す。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- コンポーネントの責務・データフローは不変。変更は「ファイルの配置場所」と「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **機能間の相互参照は無い**: 7 機能（list/tree/inspector/search/settings/trash/import）は互いに import していないため、独立して安全に移動できる。
- **同ディレクトリ内の `./` import・CSS import は変更不要**: `Inspector.jsx` の `./HelpIcon` や各 `./*.css` は、機能フォルダごと移動するため相対関係が保たれる。
- **共有 UI（sandbox/DesignSandbox.jsx）は移動しない**: `src/components/sandbox/` はアプリ横断の共有 UI として残す（bulletproof の共有層 `components/` に相当）。
- **共有層（logic/hooks/lib）は本タスクでは移動しない**: `treeLogic` や `useAI` 等の共有層は後続タスクで `features/todo/lib/`・`features/todo/hooks/` へ移動する。本タスクでは「現時点で正しいパス」に修正する（`../../../` → `../../../../`）。
- **テストファイルも移動する**: `Inspector.test.jsx`・`test_TreeView.test.jsx` は vitest の `*.test.jsx` パターンにマッチするため、移動後も自動的に実行対象となる。

## 4. 優先順位・本当に必要なもの

- **対応する**: `src/components/features/` 配下 7 機能の移動＋ App.jsx の import 修正＋ features 内の共有層参照修正。
- **対応しない**: logic/hooks/lib の移動（後続タスク）、DesignSandbox の移動、コンポーネント内容の変更。

## 5. 変更内容のまとめ

### 移動

`src/components/features/{list,tree,inspector,search,settings,trash,import}` → `src/features/todo/components/{同}`（git mv）

### import パス修正（2系統）

1. **App.jsx（9行）**: `'../components/features/X'` → `'../features/todo/components/X'`
2. **features 内の共有層参照（13箇所）**: `'../../../logic/...'`・`'../../../hooks/...'`・`'../../../lib/...'` → `'../../../../...'`

## 6. 完了の定義（DoD）

- `src/features/todo/components/` に 7 機能が配置されている。
- `src/components/` には共有 UI（sandbox/DesignSandbox.jsx）のみが残る。
- App.jsx と features 内の import パスが修正されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
