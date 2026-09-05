# 重複コードを排除して DRY 原則を適用する

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: 同じロジックが複数ファイルにコピーされており、片方だけ修正して不整合が起きるリスクがある。進捗色分岐・期日判定などの重複ロジックを 1 箇所に集約し、将来の修正・機能追加を「1 箇所直すだけ」で済ませる。あわせて、リファクタリング過程で発生したデッドコードを削除する。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「重複ロジックの共通関数への抽出」「デッドコードの削除」「import 経路」のみ。
- 抽出した共通関数は純粋関数とし、UI コンポーネントから import して使う。
- データフロー（react-arborist の `Tree` → `ArboristNode`、`Inspector`、D3 の `TreeView`）は不変。

## 3. 変更内容

### 調査結果（description との乖離）

レビュー時点（description）の重複リストは、その後の「ディレクトリ構造整理」「可読性向上」「定数化」タスクで状況が変化している。現在の実態は以下の通り。

| 重複種別 | description 記載 | 実コード（現在） |
| --- | --- | --- |
| 進捗色分岐 | 3 箇所（ListView / TodoItem / Inspector） | **3 箇所**: ArboristNode.jsx:330 / Inspector.jsx:245 / TreeView.jsx:399（D3 fill） |
| 期日判定 | 2 箇所（ArboristNode / TodoItem） | **1 箇所**: ArboristNode.jsx（TodoItem はデッドコード） |
| MECE 警告 | 3 箇所（条件が異なる） | 2 箇所（条件が異なるため**現状維持**） |
| 説明プレビュー | 2 箇所 | 既に `DESCRIPTION_PREVIEW_MAX_LENGTH` 定数で統一済み（対応不要） |
| —（新発見） | — | `TodoItem.jsx` はどこからも import されていないデッドコード |

### 抽出する共通関数（新規ファイル）

| ファイル | 内容 |
| --- | --- |
| `src/features/todo/lib/treePresentation.js` | `getProgressColor(progress)` / `getDueStatus(dueDate, isDone, today)` の純粋関数 |

配置方針（architecture.md §4.2 / §4.4）:
- todo 機能に閉じる表示ロジックなので `features/todo/lib/` に置く。
- barrel file を作らず直接 import する。
- 依存の一方向性（shared → features → app）を守る。

### `getProgressColor(progress)`

```js
export const getProgressColor = (progress) =>
  progress === PROGRESS_MAX ? 'var(--success-color)' : 'var(--primary-color)';
```

呼び出し元を以下の 3 箇所で置換する:
- `ArboristNode.jsx:330` — `backgroundColor: data.progress === 100 ? ...` → `getProgressColor(data.progress)`
- `Inspector.jsx:245` — `backgroundColor: node.progress === 100 ? ...` → `getProgressColor(node.progress)`
- `TreeView.jsx:399` — D3 の `.attr('fill', (d) => ...)` 内で `getProgressColor(d.data.progress)` に置換

### `getDueStatus(dueDate, isDone, today)`

```js
export const getDueStatus = (dueDate, isDone, today) => {
  const overdue = dueDate && dueDate < today && !isDone;
  const dueSoon =
    dueDate && !overdue && !isDone && dueDate.getTime() - today.getTime() <= DUE_SOON_THRESHOLD_MS;
  return { overdue, dueSoon };
};
```

呼び出し元を `ArboristNode.jsx` で置換する（`isOverdue` / `isDueSoon` のローカル計算を削除）。

### デッドコード削除

| ファイル | 変更 |
| --- | --- |
| `src/features/todo/components/list/TodoItem.jsx` | 削除（どこからも import されていない） |

`TodoItem.css` は `ArboristNode.jsx` が import して使っているため**残す**。

## 4. 普通ではないケース・境界条件

- **MECE 警告は現状維持**: `ArboristNode.jsx`（`STRATEGY` のみ）と `Inspector.jsx`（`STRATEGY || GOAL`）で条件が異なるため、無理に統一しない（DRY と可読性のトレードオフ）。
- **説明プレビューは対応不要**: 既に定数 `DESCRIPTION_PREVIEW_MAX_LENGTH` で統一済み。
- **TreeView の D3 記法**: `TreeView.jsx:399` は JSX ではなく D3 の `.attr('fill', (d) => ...)` 内の式なので、`getProgressColor` を import して参照できることを確認する。
- **`today` の正規化**: `getDueStatus` に渡す `today` は呼び出し元で `setHours(0,0,0,0)` 済みの値を使う（既存挙動と同一）。
- **`PROGRESS_MAX` / `DUE_SOON_THRESHOLD_MS` の import**: どちらも既存の `treeViewConstants.js` に定義済み。`treePresentation.js` から import する。

## 5. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。ロジックは 1 文字も変えず、配置と import 経路のみ変更する。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。

## 6. 完了の定義（DoD）

- `treePresentation.js` が新設され、`getProgressColor` / `getDueStatus` が定義されている。
- 進捗色分岐 3 箇所・期日判定 1 箇所が共通関数参照に置換されている。
- `TodoItem.jsx` が削除されている（`TodoItem.css` は残存）。
- MECE 警告・説明プレビューは現状維持（無理な共通化をしない）。
- barrel file が作られていない。
- `npm run lint` / `npm run test:run`（53 件）が全て通る。
