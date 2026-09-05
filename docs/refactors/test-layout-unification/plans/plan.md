# プラン: テストファイルの配置・命名を bulletproof-react 準拠に統一する

## 大まかな手順

1. 4 つのテストファイルを、対象コード近くの `__tests__/` サブディレクトリへ移動する（`test_TreeView.test.jsx` は `TreeView.test.jsx` にリネーム）。
2. 移動後の import パスを修正する（対象コード・モックへの相対パスを 1 階層分追加）。
3. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
4. 連鎖修正（`docs/` 内のテスト配置・命名に関する記述の確認）とコミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（テストファイルの移動と命名統一）

**やること**

4 つのテストファイルを、対象コードの近くの `__tests__/` サブディレクトリへ `git mv` で移動する。

| 現在 | 移動先 |
|---|---|
| `src/features/todo/components/inspector/Inspector.test.jsx` | `src/features/todo/components/inspector/__tests__/Inspector.test.jsx` |
| `src/features/todo/components/tree/test_TreeView.test.jsx` | `src/features/todo/components/tree/__tests__/TreeView.test.jsx`（リネーム） |
| `src/features/todo/hooks/useTodoTree.test.js` | `src/features/todo/hooks/__tests__/useTodoTree.test.js` |
| `src/features/todo/lib/treeLogic.test.js` | `src/features/todo/lib/__tests__/treeLogic.test.js` |

**コマンド例（git mv で移動＋リネーム）**

```bash
mkdir -p src/features/todo/components/inspector/__tests__
git mv src/features/todo/components/inspector/Inspector.test.jsx src/features/todo/components/inspector/__tests__/Inspector.test.jsx

mkdir -p src/features/todo/components/tree/__tests__
git mv src/features/todo/components/tree/test_TreeView.test.jsx src/features/todo/components/tree/__tests__/TreeView.test.jsx

mkdir -p src/features/todo/hooks/__tests__
git mv src/features/todo/hooks/useTodoTree.test.js src/features/todo/hooks/__tests__/useTodoTree.test.js

mkdir -p src/features/todo/lib/__tests__
git mv src/features/todo/lib/treeLogic.test.js src/features/todo/lib/__tests__/treeLogic.test.js
```

**変更しないもの**

- テストファイルの内容（アサーション・モック・describe/it 構成）は 1 文字も変更しない。移動・リネームのみ。

**この手順単体での検証**

- 移動・リネーム後のファイルが `__tests__/` に存在することを確認する。
- import パスはまだ修正していないため、この時点では test は失敗する（手順 2 で修正）。

---

## 手順 2 の詳細（import パスの修正）

**やること**

各テストファイルの import パスを、`__tests__/` サブディレクトリ（1 階層下）から見た相対パスに修正する。

| ファイル | 修正内容 |
|---|---|
| `inspector/__tests__/Inspector.test.jsx` | `./Inspector` → `../Inspector`、`../../../../lib/SettingsProvider` → `../../../../../lib/SettingsProvider` |
| `tree/__tests__/TreeView.test.jsx` | `./TreeView` → `../TreeView` |
| `hooks/__tests__/useTodoTree.test.js` | `./useTodoTree` → `../useTodoTree` |
| `lib/__tests__/treeLogic.test.js` | `./treeNodes` → `../treeNodes`、`./treeProgress` → `../treeProgress`、`./treeGroups` → `../treeGroups`、`./treeFolders` → `../treeFolders`、`./treeDisplay` → `../treeDisplay` |

**注意（相対パスの階層）**

- `__tests__/` が対象コードの親ディレクトリの子として置かれるため、対象コードへは「1 階層上がって参照する」形になる（`./` → `../`）。
- `Inspector.test.jsx` の `SettingsProvider` は深い階層の共有層への参照のため、階層数が 1 増える点に注意。

**変更しないもの**

- テスト内容・アサーション・モックは 1 文字も変更しない。

**この手順単体での検証**

- import パス修正後、`npm run test:run` が 53 件 pass することを確認する（手順 3 の統合検証に含めてもよい）。

---

## 手順 3 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が移動前（53 件）から増減していないこと（移動・リネームでテストが消えていないこと）。

---

## 手順 4 の詳細（連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（連鎖修正）**

1. `docs/` 全体を `test_TreeView` / `treeLogic.test.js` / `useTodoTree.test.js` / `Inspector.test.jsx` で grep し、旧パス・旧命名を前提とした記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/core/architecture.md` §2 の `testing/` の記述に、テストファイルの `__tests__/` 配置方針を反映する必要があるか確認する。
   - `docs/refactors/readability/spec.md` にテスト配置に関する記述があれば更新する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`refactor:` プレフィックス）。
2. コミットメッセージ例: `refactor: テストファイルを __tests__/ サブディレクトリへ移動し命名を統一`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「テストファイルの配置・命名を bulletproof-react 準拠に統一する」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/test-layout-unification`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。
