# 実装プラン：検索フィールドの折りたたみ表示（アイコントグル型）

## 大まかな手順

1. `SearchBar` 独立コンポーネントを新設（`src/components/features/search/SearchBar.jsx` ＋ CSS）
2. `displayMode`（論理ツリー／フォルダ）と `treeRef` を App へリフトアップ
3. App.jsx の `header-actions` に検索アイコン（トグル）を配置し、`SearchBar` を配線
4. ListView から既存検索ボックス（`searchQuery`/`searchOpen`/`searchResults`/`handleSearchSelect`/`.search-box`）を撤去し、props 経由で `displayMode`/`treeRef` を受け取る形に変更
5. スタイル調整（`SearchBar.css` 新設、`.search-box` 系を移設）
6. テスト・ビルドで検証

## 詳細手順

### 1. `SearchBar` 独立コンポーネントを新設

- **場所**: `src/components/features/search/SearchBar.jsx` ＋ `src/components/features/search/SearchBar.css`
- **props**: `nodes`, `displayMode`, `treeRef`, `onSelectNode`, `t`
- **内部 state**: `searchOpen`（開閉）、`searchQuery`（検索語）。いずれも永続化しない。
- **検索ロジック**: `useMemo` で `treeLogic.searchNodes(nodes, searchQuery, { mode: displayMode })` を呼び候補を算出（既存ロジックを移設）。
- **ジャンプ処理**: `handleSearchSelect(nodeId)` で `treeRef.current?.openParents(nodeId)` → `scrollTo(nodeId, 'center')` → `onSelectNode(nodeId)` → `setSearchOpen(false)` → `setSearchQuery('')`。
- **開閉トリガー**:
  - アイコンクリックでトグル（開⇄閉）。
  - Esc（input の keydown）で閉じ、フォーカスをアイコンへ戻す。
  - 候補選択後（ジャンプ）で閉じる。
  - blur で閉じる（候補一覧クリックを巻き込まないよう `onMouseDown` の `preventDefault` ＋ 150ms 遅延クローズ）。
- **ビジュアル**: `AnimatePresence` ＋ `motion.div` で `opacity`（0→1）と `y`（-8px→0）を duration 0.18s、`easeOut`。input 幅 240px、展開時に `autoFocus`。
- **aria**: アイコンボタンに `aria-expanded` / `aria-controls`、`title="Search"`。

### 2. `displayMode` と `treeRef` を App へリフトアップ

- App.jsx に `const [displayMode, setDisplayMode] = useState('logic')` を追加。
- App.jsx に `const treeRef = useRef(null)` を追加（`useRef` を import に追加）。
- ListView の `displayMode` state と `treeRef` を削除し、props として受け取る形に変更。
- ListView の `<Tree ref={treeRef}>` は props の `treeRef` を使用する。

### 3. App.jsx に検索アイコンを配置・配線

- `header-actions` 内、`Settings` ボタンの直前に `{view === 'list' && <SearchBar ... />}` を挿入。
- `SearchBar` に `nodes` / `displayMode` / `treeRef` / `onSelectNode={handleSelectNode}` / `t` を渡す。
- ListView にも `displayMode` / `setDisplayMode` / `treeRef` を props で渡す（既存の `display-mode-toggle` を動かすため）。

### 4. ListView から既存検索ボックスを撤去

- `searchQuery` / `searchOpen` / `searchResults` / `handleSearchSelect` / `treeRef`（ローカル）を削除。
- `header-right` 内の `.search-box` ブロックを削除。
- `displayMode` は props から受け取り、`setDisplayMode` も props で受け取る。
- `<Tree>` の `ref` を props の `treeRef` に変更。
- 不要になった import（`Search` 等）を整理。

### 5. スタイル調整

- `SearchBar.css` を新設し、`.search-box` / `.search-results` / `.search-result-item` 等を移設・調整。
- ListView.css から `.search-box` 系 CSS を削除。
- `icon-btn` の共通スタイル（存在しないため素の button に準拠）はそのまま。

### 6. テスト・ビルドで検証

- `npx vitest run` で全テストパスを確認。
- `npm run build` でコンパイルエラーがないことを確認。
