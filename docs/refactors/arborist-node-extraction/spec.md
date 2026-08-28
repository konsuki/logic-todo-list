# ListView.jsx から ArboristNode レンダラを別ファイルへ抽出する

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `src/features/todo/components/list/ListView.jsx`（636 行）に、react-arborist のノードレンダラ `ArboristNode`（1-328 行）とビュー本体 `ListView`（330-636 行）が同居しており、見通しが悪い。`ArboristNode` を別ファイルへ抽出して単一責務にする。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「ファイルの物理的な分割」と「import 経路」のみ。
- `ArboristNode` のロジック・JSX・props は 1 文字も変更しない。
- データフロー（react-arborist の `Tree` → `ArboristNode` レンダラ）は不変。

## 3. 変更内容

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/features/todo/components/list/ArboristNode.jsx` | `ArboristNode` コンポーネント本体（1-328 行相当）をそのまま移す |

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/features/todo/components/list/ListView.jsx` | `ArboristNode` 定義を削除し、`import ArboristNode from './ArboristNode'` で参照 |

### import の移動

`ArboristNode` が使う import を `ListView.jsx` から `ArboristNode.jsx` へ移す:

- React hooks: `useState`, `useMemo`, `useRef`, `useEffect`
- lucide アイコン: `ChevronDown`, `ChevronRight`, `CheckCircle`, `Circle`, `Trash2`, `Lock`, `Clock`, `AlertTriangle`, `EyeOff`, `Folder`, `FolderPlus`, `Plus`
- `useSettings`
- CSS: `./TodoItem.css`

`ListView.jsx` 側に残す import（本体で使うもの）:

- `useState`, `useMemo`, `useRef`, `useEffect`（ListView 本体も使う）
- `Tree`（react-arborist）
- `Target`, `Filter`, `Folder`, `FolderPlus`, `EyeOff`, `Plus`（ListView 本体のヘッダー・空状態・ボタンで使う）
- `NODE_TYPES`, `buildFolderTree`, `buildArboristTree`
- `./ListView.css`, `./TodoItem.css`

## 4. 普通ではないケース・境界条件

- **barrel file の禁止（architecture.md §4.2）**: `index.js` は作らず直接 import する。
- **CSS import の扱い**: `ListView.jsx` は `ListView.css` と `TodoItem.css` を両方 import している。`ArboristNode` は `TodoItem.css` の `todo-item-*` クラスを使うため、抽出先 `ArboristNode.jsx` でも `TodoItem.css` を import する。`ListView.css` は ListView 本体のものなので `ListView.jsx` に残す。
- **props の受け渡し不変**: `ArboristNode` の props（`node` / `style` / `dragHandle` / `tree`）はそのまま。
- **`useSettings` の import 先**: `ArboristNode` が `useSettings` を使うため、抽出先で import する（`ListView.jsx` 本体も `useSettings` を使うので双方に import）。

## 5. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。`ArboristNode` のロジック・JSX は 1 文字も変えず、配置と import 経路のみ変更する。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。

## 6. 完了の定義（DoD）

- `ArboristNode.jsx` が新設され、`ArboristNode` が別ファイルに抽出されている。
- `ListView.jsx` から `ArboristNode` 定義が削除され、import で参照されている。
- barrel file が作られていない。
- `npm run lint` / `npm run test:run`（53 件）/ `npm run build` が全て通る。
