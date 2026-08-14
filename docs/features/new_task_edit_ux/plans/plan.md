# 実装プラン: New Task 追加時の編集 UX 改善（全選択・Escキャンセル）

## 大まかな手順

1. [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` に、追加直後の自動編集時のみ input を全選択する仕組みを追加する。
2. `handleTitleSubmit` に Escape キーでのキャンセルと、空文字ガードを追加する。
3. 修正内容を手動確認（ビルド／動作確認）する。

## 手順の詳細

### 手順1: 追加直後の自動編集時のみ input を全選択（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` コンポーネント。

**変更内容:**
1. 「自動編集（追加直後）かどうか」を判定するためのフラグ `isAutoEdit` を state として追加する（初期値 `false`）。
2. 既存の自動編集 `useEffect`（`editingNodeId === data.id` のとき）で、`setIsAutoEdit(true)` を呼ぶ。
3. 通常クリック編集（`node-title` の `onClick`）では `setIsAutoEdit(false)` を呼ぶ。
4. input に `ref` を追加し、`isAutoEdit` が true のときに `ref.current.select()` で全選択する（`useEffect` で `isEditing` になった後に行う）。
5. 編集確定・キャンセル時に `setIsAutoEdit(false)` に戻す。

**修正後イメージ（主要部）:**
```jsx
const [isAutoEdit, setIsAutoEdit] = useState(false);
const inputRef = useRef(null);

useEffect(() => {
  if (tree.props.editingNodeId === data.id) {
    setEditTitle(data.title);
    setIsEditing(true);
    setIsAutoEdit(true);
  }
}, [tree.props.editingNodeId, data.id, data.title]);

useEffect(() => {
  if (isEditing && isAutoEdit) {
    inputRef.current?.select();
  }
}, [isEditing, isAutoEdit]);

// input へ ref={inputRef} を付与
// node-title の onClick は setIsAutoEdit(false) を追加
```

**期待される結果:**
- 追加直後（`editingNodeId` 一致で編集モードに入った）は input が全選択され、文字入力で "New Task" を置換できる。
- 通常クリック編集では全選択されない（従来どおり）。

### 手順2: `handleTitleSubmit` に Escape キャンセルと空文字ガードを追加（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` 内、`handleTitleSubmit`。

**変更内容:**

1. **Escape キーでキャンセル**:
   - `e.key === 'Escape'` の場合、`setEditTitle(data.title)` で入力値を元の値に戻し、`setIsEditing(false)`・`setIsAutoEdit(false)`・`tree.props.setEditingNodeId?.(null)` を呼んで編集を終了する。タイトル更新（`onUpdateNode`）は行わない。
   - 選択は解除しない（`setSelectedNodeId` は触らない）。
2. **空文字ガード**:
   - Enter / blur 確定時、`editTitle.trim()` が空文字の場合は `onUpdateNode` を呼ばず、`setEditTitle(data.title)`（＝ "New Task"）に戻して編集を終了する。タイトルを削除しない。

**修正後イメージ:**
```jsx
const handleTitleSubmit = (e) => {
  if (e.type === 'keydown') {
    e.stopPropagation();
  }

  if (e.key === 'Escape') {
    setEditTitle(data.title);
    setIsEditing(false);
    setIsAutoEdit(false);
    tree.props.setEditingNodeId?.(null);
    return;
  }

  if (e.key === 'Enter' || e.type === 'blur') {
    const trimmed = editTitle.trim();
    setIsEditing(false);
    setIsAutoEdit(false);
    tree.props.setEditingNodeId?.(null);
    if (trimmed && trimmed !== data.title) {
      tree.props.onUpdateNode?.(data.id, { title: trimmed });
    } else if (!trimmed) {
      setEditTitle(data.title);
    }
  }
};
```

**期待される結果:**
- 編集中に Esc を押すと、タイトルを変更せずに編集を終了し、"New Task" のまま残る（選択維持）。
- 空文字のまま Enter / blur しても、"New Task" が削除されない。

### 手順3: 手動確認（詳細）

**対象**: 修正後のアプリを起動し、リスト表示で New Task 追加の挙動を確認する。

**確認項目:**
1. 親タスクを選択 → **Tab** で子 "New Task" が追加され、**"New Task" が全選択された状態**で編集モードになる。
2. そのまま文字を入力すると "New Task" が置換される。
3. **Esc** を押すと編集が終了し、"New Task" のまま残る（選択は解除されない）。
4. Esc 後に **Enter** を押すと、直前の子タスクの**兄弟**として "New Task" が追加され、全選択状態になる。
5. Esc → Enter を繰り返して "New Task" を量産できる。
6. 後から各 "New Task" を個別クリックしてタイトル編集できる（このときは全選択されない）。
7. 空文字のまま Enter / blur しても "New Task" が消えない。
8. 前回までの修正（編集中のショートカット誤発火防止、自動編集、インスペクター→リスト編集の保持）が引き続き機能することを確認する。

**確認方法:**
- `npm run dev` で起動し、ブラウザで手動確認する。
- 必要に応じて既存のテスト（`npm test`）が通ることを確認する。

