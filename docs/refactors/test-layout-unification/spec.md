# テストファイルの配置・命名を bulletproof-react 準拠に統一する（__tests__/ サブディレクトリ化）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: テストファイルの配置・命名が bulletproof-react の慣習と一致しておらず、初見でテストの場所を迷いやすい。`__tests__/` サブディレクトリ化と命名統一により、設計方針に沿ったテスト配置にする。**挙動・テスト内容は一切変えない。**

## 2. 現状と変更内容

### テストファイルの移動と命名

| 現在 | 移動先 | 命名変更 |
|---|---|---|
| `src/features/todo/components/inspector/Inspector.test.jsx` | `.../inspector/__tests__/Inspector.test.jsx` | 変更なし |
| `src/features/todo/components/tree/test_TreeView.test.jsx` | `.../tree/__tests__/TreeView.test.jsx` | `test_` プレフィックス削除 |
| `src/features/todo/hooks/useTodoTree.test.js` | `.../hooks/__tests__/useTodoTree.test.js` | 変更なし |
| `src/features/todo/lib/treeLogic.test.js` | `.../lib/__tests__/treeLogic.test.js` | 変更なし |

### import パスの修正

各テストファイルを `__tests__/` サブディレクトリへ 1 階層下げるため、対象コード・モックへの相対 import を 1 階層分追加する。

- `Inspector.test.jsx`: `./Inspector` → `../Inspector`、`../../../../lib/SettingsProvider` → `../../../../../lib/SettingsProvider`
- `TreeView.test.jsx`: `./TreeView` → `../TreeView`
- `useTodoTree.test.js`: `./useTodoTree` → `../useTodoTree`
- `treeLogic.test.js`: `./treeNodes` 等 → `../treeNodes` 等（5 箇所）

## 3. 普通ではないケース・境界条件

- **`src/testing/setupTests.js` は移動しない**: 「テスト用ユーティリティ」であり、`testing/` に残すのが bulletproof-react 準拠。
- **テスト内容は不変**: アサーション・モックは 1 文字も変更しない。移動と import パス修正のみ。
- **vitest の検出**: 現在 `include` が明示されていないため、デフォルトの `**/*.{test,spec}.?(c|m)[jt]s?(x)` が `__tests__/` 配下の `*.test.js(x)` も検出する（変更不要）。
- **`test_` プレフィックスの撤去**: `test_TreeView.test.jsx` → `TreeView.test.jsx` にリネーム（`*.test.jsx` にマッチし続ける）。

## 4. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。テストの内容は変えず、移動と import パス修正のみ。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。

## 5. 完了の定義（DoD）

- テスト 4 件が `__tests__/` サブディレクトリに配置されている。
- 命名が `*.test.js(x)` に統一されている（`test_` プレフィックスなし）。
- import パスが移動先に合わせて修正されている。
- `npm run lint` / `npm run test:run`（53 件）/ `npm run build` が全て通る。
