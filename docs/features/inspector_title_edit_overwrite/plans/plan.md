# 実装プラン: インスペクターのタイトル編集後にリスト側で編集すると変更が失われる問題の修正

## 大まかな手順

1. [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` 内、`node-title` の `onClick` を修正し、編集モードに入る際に `setEditTitle(data.title)` を呼ぶ。
2. 修正内容を手動確認（ビルド／動作確認）する。

## 手順の詳細

### 手順1: `node-title` の `onClick` 修正（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` コンポーネント内、非編集時のタイトル表示部分（現行 130〜133 行目付近）。

**現行コード:**
```jsx
<span className="node-title" onClick={() => setIsEditing(true)}>
  {data.title}
</span>
```

**修正後コード:**
```jsx
<span className="node-title" onClick={() => { setEditTitle(data.title); setIsEditing(true); }}>
  {data.title}
</span>
```

**変更のポイント:**
- 編集モードに入る直前に `setEditTitle(data.title)` を呼び、`editTitle` ステートを最新の `data.title` に同期する。
- これにより、インスペクター等の別経路で更新されたタイトルが編集開始時に input へ正しく反映される。
- `setIsEditing(true)` の実行順は、同期の後（`setEditTitle` → `setIsEditing(true)`）とする。React のステート更新は非同期だが、同じイベントハンドラ内では両者がまとめて処理され、次レンダーで `isEditing === true` かつ `editTitle === data.title` となるため問題ない。
- `handleTitleSubmit`（Enter / blur 確定ロジック）や前回追加した `stopPropagation()` には変更を加えない。

**期待される結果:**
- インスペクターでタイトルを変更 → リストで同じタスクをクリックして編集 → 確定、の流れで、変更が失われない。
- リストでの編集開始時に input へ最新タイトルが表示される。

### 手順2: 手動確認（詳細）

**対象**: 修正後のアプリを起動し、インスペクター→リストのタイトル編集の挙動を確認する。

**確認項目:**
1. タスクを選択し、インスペクター（右パネル）のタイトルを編集・確定（Enter または blur）する。
2. 左側リストで同じタスクのタイトルをクリックして編集モードに入る。
3. input に **ステップ1 で変更した最新のタイトル** が表示されていることを確認する。
4. そのまま確定（Enter または blur）しても、インスペクターでの変更が保持されることを確認する。
5. リスト単体でタイトルを編集→確定した場合も従来どおり機能することを確認する。
6. 前回修正（編集中のショートカット誤発火防止）が引き続き機能することを確認する（編集中にカーソル移動キーで選択タスクが移動しない）。

**確認方法:**
- `npm run dev` で起動し、ブラウザで手動確認する。
- 必要に応じて既存のテスト（`npm test`）が通ることを確認する。
