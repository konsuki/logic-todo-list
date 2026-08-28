# プラン: ListView.jsx から ArboristNode レンダラを別ファイルへ抽出する

## 大まかな手順

1. 新規ファイル `src/features/todo/components/list/ArboristNode.jsx` を作成し、`ArboristNode` コンポーネント（ロジック・JSX はそのまま）と必要な import を移す。
2. `ListView.jsx` から `ArboristNode` 定義を削除し、`import ArboristNode from './ArboristNode'` を追加する。
3. `ListView.jsx` の import を整理する（`ArboristNode` 専用の import を削除し、`ListView` 本体が使うものだけ残す）。
4. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
5. 連鎖修正（`docs/` 内の該当記述の確認）とコミット、ビジュツリーへの反映。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（ArboristNode.jsx の新規作成）

**やること**

1. 新規ファイル `src/features/todo/components/list/ArboristNode.jsx` を作成する。
2. `ListView.jsx` の `ArboristNode` コンポーネント本体（現在 15〜328 行、`const ArboristNode = ({ node, style, dragHandle, tree }) => { ... };`）を **1 文字も変えず** 移す。
3. ファイル末尾に `export default ArboristNode;` を付ける。
4. import を以下に設定する:
   ```js
   import { useState, useMemo, useRef, useEffect } from 'react';
   import { ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle, EyeOff, Folder, FolderPlus, Plus } from 'lucide-react';
   import { useSettings } from '../../../../lib/settings';
   import './TodoItem.css';
   ```

**変更しないもの**

- `ArboristNode` のロジック・JSX・props・コメントは 1 文字も変更しない。

**この手順単体での検証**

- この時点では `ListView.jsx` がまだ旧 `ArboristNode` を持っており、新規ファイルはどこからも import されないため、lint は通る（未使用ファイル・未使用 import は ESLint の `no-unused-vars` の対象外だが、ファイル全体が未使用でも問題ない）。
- 統合検証は手順 2〜3 の後に行う。

---

## 手順 2 の詳細（ListView.jsx から ArboristNode 定義を削除し import を追加）

**やること**

1. `ListView.jsx` の先頭 import 部に、`ArboristNode` の import を追加する:
   ```js
   import ArboristNode from './ArboristNode';
   ```
   - 追加位置は既存 import 群の直後（`import './TodoItem.css';` の後）とする。
2. `ListView.jsx` から `ArboristNode` コンポーネント定義（`/** Custom node renderer ... */` の JSDoc から `};` まで）を削除する。

**変更しないもの**

- `ListView` 本体（330 行以降）のロジック・JSX は 1 文字も変更しない。
- この時点では `ListView.jsx` の import はまだ整理しない（手順 3 で行う）。つまり、`ArboristNode` 専用の import（`ChevronDown` など）が残っていても、この手順では触らない。

**この手順単体での検証**

- この時点では `ListView.jsx` に不要な import が残るため、`npm run lint` は `no-unused-vars` エラーを出す可能性がある。よって **lint は手順 3（import 整理）の後に確認する**。

---

## 手順 3 の詳細（ListView.jsx の import 整理）

**やること**

`ListView.jsx` の import を、`ListView` 本体（330 行以降）が実際に使うものだけに整理する。`ArboristNode` 抽出後に残る import を、本体の使用箇所から確定する。

### 本体が使うもの（残す）

- React hooks: `useState`, `useMemo`, `useRef`, `useEffect`
  - `useState`（phaseFilter / openState / containerSize）、`useMemo`（arboristData）、`useRef`（containerRef）、`useEffect`（phaseFilter 永続化・containerSize 計測・スクロール位置保持）
- react-arborist: `Tree`
- lucide アイコン（本体ヘッダー・空状態・ボタンで使用）: `Target`, `Plus`, `Filter`, `ChevronDown`, `ChevronRight`, `CheckCircle`, `Circle`, `Trash2`, `Lock`, `Clock`, `AlertTriangle`, `EyeOff`, `Folder`, `FolderPlus`
- `NODE_TYPES`（`../lib/treeConstants`）
- `buildFolderTree`（`../lib/treeFolders`）
- `buildArboristTree`（`../lib/treeDisplay`）
- `useSettings`
- `./ListView.css`, `./TodoItem.css`

### 本体が使わないもの（削除）

- `ChevronDown`, `ChevronRight`, `CheckCircle`, `Circle`, `Trash2`, `Lock`, `Clock`, `AlertTriangle`, `EyeOff`, `Folder`, `FolderPlus`, `Plus` のうち、`ListView` 本体が本当に使っていないものがあれば削除する。

**重要: import の精査**

- 正確には「ListView 本体が実際に使っているか」を、330 行以降の JSX を精査して確定する。ヘッダーの表示切替（`Folder`）、新規ボタン（`Plus`/`FolderPlus`）、非表示ボタン（`EyeOff`）、空状態（`Target`/`Filter`）などが使うアイコンを残す。
- `ChevronDown`/`ChevronRight`/`CheckCircle`/`Circle`/`Trash2`/`Lock`/`Clock`/`AlertTriangle` は `ArboristNode` 専用の可能性が高いため、`ListView` 本体で使っていなければ削除する。

**この手順単体での検証**

- `npm run lint` で未使用 import が残っていないか確認する。`no-unused-vars` エラーがゼロになること。

---

## 手順 4 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 5 の詳細（連鎖修正・コミット・ビジュツリー反映）

**やること（連鎖修正）**

1. `docs/` 全体を `ArboristNode` / `ListView.jsx` で grep し、`ArboristNode` が `ListView.jsx` 内にある前提の記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/refactors/readability/spec.md` の H2（ArboristNode 抽出）の記述を、実装後（別ファイル抽出済み）の状態に合わせて更新する。
   - `docs/core/architecture.md` §2 の `components/list/` の記述に `ArboristNode.jsx` を反映する必要があるか確認する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`refactor:` プレフィックス）。
2. コミットメッセージ例: `refactor: ListView.jsx から ArboristNode レンダラを別ファイルへ抽出`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「ListView.jsx から ArboristNode レンダラを別ファイルへ抽出する」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。
