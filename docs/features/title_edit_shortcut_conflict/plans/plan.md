# 実装プラン: リスト表示のタイトル編集時にショートカットキーが誤発火する問題の修正

## 大まかな手順

1. [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` 内 `handleTitleSubmit` を修正し、keydown イベントの `stopPropagation()` を追加する。
2. 修正内容を手動確認（ビルド／動作確認）する。

## 手順の詳細

### 手順1: `handleTitleSubmit` の修正（詳細）

**対象**: [ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` コンポーネント内、`handleTitleSubmit`（現行 44〜51 行目付近）。

**現行コード:**
```jsx
const handleTitleSubmit = (e) => {
  if (e.key === 'Enter' || e.type === 'blur') {
    setIsEditing(false);
    if (editTitle.trim() !== data.title) {
      tree.props.onUpdateNode?.(data.id, { title: editTitle });
    }
  }
};
```

**修正後コード:**
```jsx
const handleTitleSubmit = (e) => {
  // 編集 input 内のキーイベントを react-arborist コンテナへ伝播させない。
  // これがないと、カーソル移動キー（←→↑↓）や Backspace / Space などが
  // ライブラリ内蔵のキーボードナビゲーションとして誤発火してしまう。
  if (e.type === 'keydown') {
    e.stopPropagation();
  }
  if (e.key === 'Enter' || e.type === 'blur') {
    setIsEditing(false);
    if (editTitle.trim() !== data.title) {
      tree.props.onUpdateNode?.(data.id, { title: editTitle });
    }
  }
};
```

**変更のポイント:**
- keydown イベント（`e.type === 'keydown'`）のときのみ `stopPropagation()` を呼ぶ。
- blur イベント時は `stopPropagation()` しない（blur の伝播を止めても意味がなく、無用な副作用を避ける）。
- Enter 確定・blur 確定のロジックはそのまま維持する。
- グローバルショートカット（`useShortcuts.js`）や react-arborist 本体には手を入れない。

**期待される結果:**
- 編集中の input 内で押したキー（カーソル移動・Backspace・Space・文字・Tab）が react-arborist コンテナに伝播しなくなる。
- input 内の通常の文字編集・カーソル移動・確定が従来どおり機能する。

### 手順2: 手動確認（詳細）

**対象**: 修正後のアプリを起動し、リスト表示でタイトル編集の挙動を確認する。

**確認項目:**
1. タイトルをクリックして編集モードに入り、文字を入力できること。
2. 編集モード中に **← → ↑ ↓ キー** を押しても、選択タスクが移動しないこと（カーソルが input 内で移動するだけ）。
3. 編集モード中に **Backspace** を押しても、削除確認ダイアログが出ず、文字が削除されるだけであること。
4. 編集モード中に **Space** を押すとスペースが入力され、トグル／アクティベートが発火しないこと。
5. 編集モード中に **文字キー** を押すと文字が入力され、ツリー内検索によるフォーカス移動が起きないこと。
6. **Enter** で確定できること（タイトルが更新される）。
7. **blur（フォーカスを外す）** で確定できること。
8. 編集モード外では、従来どおりショートカット（カーソル移動・Enter で兄弟追加・Tab で子追加など）が機能すること。

**確認方法:**
- `npm run dev` で起動し、ブラウザで手動確認する。
- 必要に応じて既存のテスト（`npm test`）が通ることを確認する。
