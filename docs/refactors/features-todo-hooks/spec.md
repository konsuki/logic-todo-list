# 機能フックの features/todo/hooks/ への移動（＋ useI18n は共有 hooks/ へ）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: todo 機能固有のフック（useTodoTree / useShortcuts / useAI）が共有 `src/hooks/` に混在し、bulletproof-react の「機能にスコープされたフックは feature 内 `hooks/` に置く」原則に反している。共有フック `useI18n` のみ `src/hooks/` に残す。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- フックの責務・データフローは不変。変更は「ファイルの配置場所」と「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **todo 固有フックの内部 import 修正（3階層深くなる）**: `useTodoTree.js`・`useShortcuts.js` は `../logic/treeLogic`、`useAI.js` は `../logic/aiApi` を参照している。`src/hooks/` から `src/features/todo/hooks/` への移動で、`src/` までの階層が 1 階層 → 3 階層に増えるため、`../logic/...` → `../../../logic/...` に修正する。
- **`useTodoTree.test.js` の `./useTodoTree` は変更不要**: 同ディレクトリに移動するため相対関係が保たれる。
- **`useI18n.js` は共有 `hooks/` に残す**: `../lib/i18n` のまま変更不要。
- **一時的な中間状態**: 移動後の todo 固有フックは `../../../logic/...` を参照する。`logic/`（treeLogic / aiApi 等）は次タスクで `features/todo/lib/`・`features/todo/api/` へ移動する予定のため、本タスクでは「現時点で正しいパス」に修正する（次タスクで再度修正）。
- **参照元の修正**:
  - `App.jsx`: `../hooks/useTodoTree` → `../features/todo/hooks/useTodoTree`、`../hooks/useShortcuts` → `../features/todo/hooks/useShortcuts`。ただし `useI18n` は `../hooks/useI18n` のまま。
  - `AIInsights.jsx`: `../../../../hooks/useAI` → `../../hooks/useAI`（`features/todo/components/inspector/` から `features/todo/hooks/` へは `../../hooks/`）。

## 4. 優先順位・本当に必要なもの

- **対応する**: todo 固有フック3種（useTodoTree / useShortcuts / useAI ＋ useTodoTree.test.js）の移動、useI18n の共有 hooks 維持、参照元・内部 import の修正。
- **対応しない**: logic/ の移動（次タスク）、useI18n の実装変更。

## 5. 変更内容のまとめ

### 移動

| 移動前 | 移動後 |
|---|---|
| `src/hooks/useTodoTree.js` | `src/features/todo/hooks/useTodoTree.js` |
| `src/hooks/useTodoTree.test.js` | `src/features/todo/hooks/useTodoTree.test.js` |
| `src/hooks/useShortcuts.js` | `src/features/todo/hooks/useShortcuts.js` |
| `src/hooks/useAI.js` | `src/features/todo/hooks/useAI.js` |
| `src/hooks/useI18n.js` | 移動しない（共有 hooks/ に残す） |

### import パス修正

1. **todo 固有フックの内部 import**（3箇所）:
   - `useTodoTree.js`: `'../logic/treeLogic'` → `'../../../logic/treeLogic'`
   - `useShortcuts.js`: `'../logic/treeLogic'` → `'../../../logic/treeLogic'`
   - `useAI.js`: `'../logic/aiApi'` → `'../../../logic/aiApi'`
2. **App.jsx**（2箇所）:
   - `'../hooks/useTodoTree'` → `'../features/todo/hooks/useTodoTree'`
   - `'../hooks/useShortcuts'` → `'../features/todo/hooks/useShortcuts'`
   - （`'../hooks/useI18n'` は変更不要）
3. **AIInsights.jsx**（1箇所）:
   - `'../../../../hooks/useAI'` → `'../../hooks/useAI'`

## 6. 完了の定義（DoD）

- `src/features/todo/hooks/` に useTodoTree.js / useTodoTree.test.js / useShortcuts.js / useAI.js が配置されている。
- `src/hooks/` には useI18n.js のみが残る。
- 上記 import パスが修正されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
