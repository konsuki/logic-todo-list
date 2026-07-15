# 実装プラン：Why?/How? アコーディオン化

## 大まかな手順

1. `Inspector.jsx` に `isWhyOpen`・`isHowOpen` の state を追加する
2. Why? セクションの見出しをクリック可能にし、アイコンと本体を開閉状態に応じて切り替える
3. How? セクションの見出しをクリック可能にし、アイコンと本体を開閉状態に応じて切り替える
4. `Inspector.css` に見出しのクリック用スタイルを追加する

---

## 詳細手順

### 手順1：state の追加
**対象：** `src/components/features/inspector/Inspector.jsx`

既存の `useState` 宣言群の末尾に追加する。

```jsx
const [isWhyOpen, setIsWhyOpen] = useState(true);
const [isHowOpen, setIsHowOpen] = useState(true);
```

- 初期値は `true`（既存の全表示状態を維持）
- ノード切替時にリセットされない（Inspector はアンマウントされないため）
- `isWhyOpen` と `isHowOpen` は独立して管理（片方だけ閉じたいニーズに対応）

---

### 手順2：Why? セクションの開閉実装
**対象：** `src/components/features/inspector/Inspector.jsx`（Why? セクション）

```jsx
<section className="inspector-section">
  <h3 className="section-title section-title--clickable" onClick={() => setIsWhyOpen(v => !v)}>
    {isWhyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    {t('inspector.why')}
  </h3>
  {isWhyOpen && (
    <>
      <div className="why-path">
        ...（既存の中身をそのまま）
      </div>
      <p className="logic-guide">
        ...（既存の中身をそのまま）
      </p>
    </>
  )}
</section>
```

- `section-title--clickable` modifier クラスで CSS を分離
- `why-path` と `logic-guide` の両方を `<>...</>` でまとめて条件レンダリング（`logic-guide` だけ残る状態を防ぐ）

---

### 手順3：How? セクションの開閉実装
**対象：** `src/components/features/inspector/Inspector.jsx`（How? セクション）

```jsx
<section className="inspector-section">
  <h3 className="section-title section-title--clickable" onClick={() => setIsHowOpen(v => !v)}>
    {isHowOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    {t('inspector.how')}
  </h3>
  {isHowOpen && (
    <div className="how-list">
      ...（既存の中身をそのまま）
    </div>
  )}
</section>
```

- Why? と同じく `section-title--clickable` クラスを付与（CSS 共通）
- `how-list` 全体を `isHowOpen &&` で条件レンダリング

---

### 手順4：CSS の追加
**対象：** `src/components/features/inspector/Inspector.css`（`.section-title` の直後）

```css
.section-title--clickable {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
}

.section-title--clickable:hover {
  opacity: 0.75;
}
```

- `cursor: pointer`：クリック可能であることをユーザーに伝える
- `user-select: none`：ダブルクリック時にテキストが選択されるのを防ぐ
- `hover` 時に `opacity` を落として「押せる要素」であることを視覚的に示す
- 既存の `.section-title` はそのまま維持（他のセクション見出しに影響なし）
