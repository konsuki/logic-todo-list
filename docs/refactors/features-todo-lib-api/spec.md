# ドメインロジック・API の features/todo/lib/ と api/ への移動

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: 純粋ドメインロジック（treeLogic / importLogic）と API 通信（aiApi）が `src/logic/` に残っており、bulletproof-react の「機能にスコープされたロジック・API は feature 内に置く」原則に反している。feature 内 `lib/` と `api/` へ移し、`logic/` 層を完全に解消する。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- ロジック・API の責務・データフローは不変。変更は「ファイルの配置場所」と「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **同ディレクトリ参照は変更不要**: `importLogic.js` の `'./treeLogic'` と `treeLogic.test.js` の `'./treeLogic'` は、両者とも `features/todo/lib/` に移動するため相対関係が保たれる。
- **todo 固有フックからの参照（3箇所）**: `useTodoTree.js`・`useShortcuts.js` の `'../../../logic/treeLogic'` → `'../lib/treeLogic'`、`useAI.js` の `'../../../logic/aiApi'` → `'../api/aiApi'`（`features/todo/hooks/` から同 `features/todo/` 配下へ）。
- **components からの参照（6箇所）**: `Inspector.jsx`・`ListView.jsx`（2箇所）・`TodoItem.jsx`・`SearchBar.jsx`・`TreeView.jsx` の `'../../../../logic/treeLogic'` → `'../../lib/treeLogic'`、`ImportModal.jsx` の `'../../../../logic/importLogic'` → `'../../lib/importLogic'`。
- **`src/logic/` の削除**: 移動後に空になるため `rmdir src/logic` で削除する。これで `logic/` 層が完全に消え、責務分離タスク全体の「logic 混在の解消」が完成する。

## 4. 優先順位・本当に必要なもの

- **対応する**: treeLogic / importLogic（＋ test）の `lib/` 移動、aiApi の `api/` 移動、参照パス修正、`src/logic/` 削除。
- **対応しない**: ロジック内容の変更、TypeScript 化。

## 5. 変更内容のまとめ

### 移動

| 移動前 | 移動後 |
|---|---|
| `src/logic/treeLogic.js` | `src/features/todo/lib/treeLogic.js` |
| `src/logic/treeLogic.test.js` | `src/features/todo/lib/treeLogic.test.js` |
| `src/logic/importLogic.js` | `src/features/todo/lib/importLogic.js` |
| `src/logic/aiApi.js` | `src/features/todo/api/aiApi.js` |

### import パス修正

1. **todo 固有フック（3箇所）**:
   - `useTodoTree.js`: `'../../../logic/treeLogic'` → `'../lib/treeLogic'`
   - `useShortcuts.js`: `'../../../logic/treeLogic'` → `'../lib/treeLogic'`
   - `useAI.js`: `'../../../logic/aiApi'` → `'../api/aiApi'`
2. **components（6箇所）**:
   - `inspector/Inspector.jsx`: `'../../../../logic/treeLogic'` → `'../../lib/treeLogic'`
   - `list/ListView.jsx`（2箇所）: 同様
   - `list/TodoItem.jsx`: 同様
   - `search/SearchBar.jsx`: 同様
   - `tree/TreeView.jsx`: 同様
   - `import/ImportModal.jsx`: `'../../../../logic/importLogic'` → `'../../lib/importLogic'`

## 6. 完了の定義（DoD）

- `src/features/todo/lib/` に treeLogic.js / treeLogic.test.js / importLogic.js が配置されている。
- `src/features/todo/api/` に aiApi.js が配置されている。
- `src/logic/` が削除されている。
- 上記 import パスが修正されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
