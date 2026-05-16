# R11: 階層D&D実装プラン (react-arborist)

## 大まかな手順

1. **パッケージのインストール**: `react-arborist` を npm install する。
2. **treeLogic.js の拡張**: 現在の `nodes` フラットマップを react-arborist 用ツリー配列に変換する `buildArboristTree()` 関数を追加する。
3. **useTodoTree.js の拡張**: react-arboristの `onMove` コールバックで受け取った移動情報（`dragIds`, `parentId`, `index`）をもとに `nodes` の `parentId` と `order` を更新する `handleMoveNode` を追加する。
4. **App.jsx の更新**: `moveNode` を `ListView` への prop として渡す。
5. **ListView.jsx の書き換え**: 現在の `.map()` ループを react-arborist の `<Tree>` コンポーネントに置き換え、カスタムノードとして既存の `TodoItem` ロジックを流用する。
6. **スタイリングの調整**: D&D中のドラッグカーソル・ドロップラインのCSSをテーマに合わせて調整する。

---
*※ ここから下の「手順の詳細化」は以降のターンで段階的に追記されます。*

## 手順の詳細化

### 1. パッケージのインストール
- **コマンド**: `npm install react-arborist`
- **確認事項**:
  - インストール後に `npm run dev` が正常に起動することを確認する。
  - peerDependencies の警告が出ないことを確認する（react >= 16.14 なので React 19 で問題ないはず）。
  - `package.json` の `dependencies` に `react-arborist` が追加されていることを確認する。

### 2. treeLogic.js の拡張
- **対象ファイル**: `src/logic/treeLogic.js`
- **追加する関数**: `buildArboristTree(nodes, rootNodes)`
- **処理内容**:
  - `rootNodes` を `order` でソートし、各ルートノードに対して再帰的に子ノードを `{ id, name, children }` 形式に変換する。
  - `name` には `node.title` をマッピングする。
  - `children` には `node.children` を `order` でソートし、同様に再帰変換した配列を入れる。子がない場合は空配列ではなく `undefined` を返すことでリーフノードであることを示す（react-arboristの慣例）。
  - 元の `node` データ全体もスプレッドで含め、カスタムレンダラーからアクセスできるようにする。
- **既存関数への変更**: なし（純粋な関数追加のみ）。

### 3. useTodoTree.js の拡張
- **対象ファイル**: `src/hooks/useTodoTree.js`
- **追加する関数**: `handleMoveNode(dragIds, parentId, index)`
- **処理内容**:
  - `setNodes(prev => ...)` 内で以下を実行する:
    1. ドラッグ対象ノード（`dragIds[0]`）の旧親の `children` 配列から対象IDを削除する。
    2. 新しい親（`parentId`）の `children` 配列の `index` 位置にドラッグ対象IDを挿入する（`parentId` が null の場合はルートレベル移動）。
    3. ドラッグ対象ノードの `parentId` を新しい親IDに更新する。
    4. 新しい親の `children` 全体を走査し、各兄弟の `order` をインデックス順に再割り当てする。
    5. `updateProgressRecursively` を旧親・新親の両方に対して呼び出し、進捗を再計算する。
- **return文の更新**: `moveNode: handleMoveNode` をフックの返り値オブジェクトに追加する。
- **既存関数への変更**: なし。

### 4. App.jsx の更新
- **対象ファイル**: `src/App.jsx`
- **変更内容**:
  - `useTodoTree()` の返り値から `moveNode` を分割代入で受け取る（既存の `reorderNode` 等と同列に追加）。
  - `<ListView>` コンポーネントに `moveNode={moveNode}` プロップを追加する。
- **既存のプロップ・ロジックへの変更**: なし（追加のみ）。

### 5. ListView.jsx の書き換え
- **対象ファイル**: `src/components/features/list/ListView.jsx`
- **変更内容**:
  - `import { Tree } from 'react-arborist'` を追加する。
  - `import * as treeLogic from '../../../logic/treeLogic'` を追加し、`buildArboristTree()` を使用する。
  - props に `moveNode` を追加する。
  - `useMemo` で `treeLogic.buildArboristTree(nodes, rootNodes)` を呼び出し、react-arborist用のツリーデータを生成する。
  - 現在の `displayedRootNodes.map(root => <TodoItem ...>)` ブロックを `<Tree>` コンポーネントに置き換える:
    ```jsx
    <Tree
      data={arboristData}
      onMove={({ dragIds, parentId, index }) => moveNode(dragIds, parentId, index)}
      openByDefault={true}
      width={containerWidth}
      height={containerHeight}
      indent={24}
      rowHeight={56}
    >
      {Node}  // カスタムノードレンダラー
    </Tree>
    ```
  - カスタムノードレンダラー `Node` コンポーネントを同ファイル内（または別ファイル）に作成する。このレンダラーは既存の `TodoItem` の行部分（`todo-item-row`）の描画ロジックを流用し、react-arboristから渡される `node`・`style`・`dragHandle` props を使用する。
  - 既存の `TodoItem.jsx` の再帰的な子描画ロジックは不要になる（react-arboristがツリー展開を管理するため）。ただし `TodoItem.jsx` 自体は削除せず、段階的に移行する。
- **注意点**:
  - react-arboristは仮想スクロール（`height` 指定必須）を使用するため、`list-view-content` コンテナの高さを取得する `useRef` + `useEffect` が必要になる可能性がある。
  - フェーズフィルター機能は、`buildArboristTree` の段階でフィルタリングするか、react-arboristの `searchTerm` / `searchMatch` を使って対応する。

### 6. スタイリングの調整
- **対象ファイル**: `src/components/features/list/ListView.css` および `TodoItem.css`
- **変更内容**:
  - react-arboristが生成するDOM構造（`[role="treeitem"]` 等）に合わせてCSSセレクタを調整する。
  - ドラッグ中のノードにドロップシャドウ・半透明効果を付ける（`.rs-tree-drag-preview` 等のクラスをスタイリング）。
  - ドロップ先のインジケータライン（挿入位置を示す青い線など）を `var(--primary-color)` でテーマに合わせる。
  - react-arboristのデフォルトスタイルが既存テーマと競合する場合は上書きする。
  - GitHubテーマ（`.theme-github`）用のオーバーライドも必要に応じて追加する。
- **動作確認**:
  - ノードをドラッグして別の親の下にドロップできることを確認する。
  - ドラッグして兄弟間で並び替えができることを確認する。
  - ドロップ後にプログレスバーが正しく再計算されることを確認する。
