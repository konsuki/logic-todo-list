# インスペクターのタイトル編集後にリスト側で編集すると変更が失われる問題の修正 仕様書

## 概要
インスペクター（右パネル）でタスクのタイトルを編集・確定した後、左側のリストで同じタスクをクリックしてタイトル編集モードに入ると、input に古いタイトルが表示され、そのまま確定するとインスペクターで行った変更が「無かったこと」になってしまう問題を修正する。

---

## 背景・目的

**誰の、どんな困りごとを解決するか:**
- インスペクターでタスクのタイトルを編集・確定したユーザーが、その後にリスト側で同じタスクをクリックしてタイトル編集モードに入ると、input に古いタイトルが表示され、確定するとインスペクターの変更が上書き・消失してしまう、という困りごとを解決する。

**原因（調査結果）:**
- Inspector 側（`src/components/features/inspector/Inspector.jsx` の `onBlur` / `Enter` 処理）は `updateNode(node.id, { title })` を呼び、`nodes` 状態を正しく更新する（この時点ではデータは正しい）。
- リスト側（`src/components/features/list/ListView.jsx` の `ArboristNode`）は `const [editTitle, setEditTitle] = useState(data.title)` で初期化するが、**編集モードに入るとき（`node-title` の `onClick`）に `editTitle` を最新の `data.title` へ再同期していない**。
- そのため、インスペクター変更後のタスクをリストでクリックすると、input に古い値が入り、そのまま確定すると `editTitle.trim() !== data.title` の条件が成立して古いタイトルで `onUpdateNode` を呼び、変更が上書き・消失する。

---

## 修正方針

`src/components/features/list/ListView.jsx` の `ArboristNode` で、**編集モードに入るとき（`node-title` の `onClick`）に `setEditTitle(data.title)` を呼び、input を最新のタイトルで初期化する**。

現行コード:
```jsx
<span className="node-title" onClick={() => setIsEditing(true)}>
  {data.title}
</span>
```

修正後コード:
```jsx
<span className="node-title" onClick={() => { setEditTitle(data.title); setIsEditing(true); }}>
  {data.title}
</span>
```

これにより編集開始時に常に最新のタイトルが input に反映され、インスペクター等で別経路から変更された内容が保持される。

変更は **1 ファイル・1 行のみ** の極小修正とする。

---

## 境界条件・非対応ケース

| ケース | 修正後の扱い |
| --- | --- |
| インスペクターで変更 → リストで編集 | 最新タイトルが input に反映され、変更が失われない |
| リストで変更 → 再度リストで編集 | 従来どおり（自身の確定で `data.title` は更新済み） |
| 編集中に外部から同じタスクが更新された場合 | 本スコープ外（編集開始時点の同期のみ。編集中のリアルタイム同期は対象としない） |
| 未使用の `TodoItem.jsx`（同一パターン） | デッドコードのため対象外 |
| Inspector の `editTitle`（`useEffect` 同期あり） | 既に `selectedNodeId` / `node.title` で同期されているため変更不要 |

---

## 制約・注意事項
- リスト側の `editTitle` 初期化のみを修正し、Inspector 側や `updateNode` のロジックには変更を加えない。
- 前回修正（`title_edit_shortcut_conflict`）で追加した `handleTitleSubmit` の `stopPropagation()` とは独立した修正であり、互いに干渉しない。
- 修正後は、インスペクターで変更 → リストで編集 → 確定、の一連の流れで変更が保持されることを手動確認する。
