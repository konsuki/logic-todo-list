# 詳細仕様：カード型フローティングパネルレイアウト

## 1. 目的

現在の画面レイアウトは、`app-header`（絶対配置・透明背景）が `main-content` と `inspector-panel` の上に重なる「オーバーレイ型」で、特に `header-actions` がインスペクターに上から重なって見える状態になっている。

本機能では、これを「ベース背景の上に、角丸のカード型パネルをグリッドで浮かせて配置する」**Card-based Floating UI** へ変更する。パネル同士・画面外枠にすき間（gap / padding）を設け、各領域の境界を視覚的に明確にして、モダンで整理されたデスクトップアプリのような質感を与える。

### 1.1 解決する困りごと

- ヘッダーの `header-actions`（検索・設定・インスペクター開閉ボタン群）がインスペクターに重なり、操作・視認の邪魔になっている。
- 領域の境界が曖昧で、どこからどこまでが操作対象か分かりにくい。

## 2. 方針（合意済み）

- **カード色**: `var(--surface-color)` を使用し、ライトテーマ＝白、ダークテーマ＝やや明るいグレーへテーマ追従させる（常時白固定にはしない）。
- **余白サイズ**: カード同士・画面外枠のすき間は **16px**（`gap:16px` / `padding:16px`）。
- **パネル共通スタイル**: 角丸（`border-radius:12px`）＋ `border:1px solid var(--border-color)` ＋ 軽い `box-shadow`。

## 3. 変更対象

### 3.1 `.app-container`（App.css）

現在の「1行×2列」のグリッドを、ヘッダーを含む「2行×2列」のグリッドに変更する。

```
変更前: grid-template-areas: "main side"（1行2列）
変更後:
  grid-template-areas:
    "header header"
    "main   side";
  grid-template-rows: var(--header-height) 1fr;
  grid-template-columns: 1fr var(--sidebar-width);
  gap: 16px;
  padding: 16px;
```

- ベース背景（`var(--bg-color)`）はそのまま維持（薄グレーの外枠役割）。
- `box-sizing: border-box` を維持し、`100vw/100vh` のグリッドに gap/padding を含める。

### 3.2 `.app-header`（App.css）

- `position: absolute` と `top/left/right: 0` を削除し、グリッドの `header` エリアに収める。
- カード化（`background-color: var(--surface-color)`、`border`、`border-radius:12px`、軽い `box-shadow`）。
- `padding: 0 40px` は維持（内部レイアウトは現状のまま。左:logo / 中央:view-switcher / 右:header-actions）。
- これにより `header-actions` がインスペクターに重ならなくなる。
- `z-index:100` は削除（重なりが不要になる）。

### 3.3 `.main-content`（App.css）

- `grid-area: main` を維持し、角丸カード化（`background-color: var(--surface-color)`、`border`、`border-radius:12px`、軽い `box-shadow`）。
- `padding: var(--header-height) 0 0 0` を削除（ヘッダーが重ならなくなるため）。代わりにグリッドの gap がすき間を担う。
- `overflow: hidden` は維持（ツリー/プレビューは内側いっぱい、リストは既存の `40px` padding を維持）。
- カード内側の padding はビューごとに以下を維持:
  - リスト: `main` の `style={{ padding: '40px' }}`（App.jsx の既存記述）をそのまま。
  - ツリー/プレビュー: `0`。

### 3.4 `.inspector-panel`（App.css）

- ガラス背景（`var(--glass-bg)` + `backdrop-filter`）をやめ、角丸カード化（`background-color: var(--surface-color)`、`border`、`border-radius:12px`、軽い `box-shadow`）。
- `border-left: 1px solid ...` と `box-shadow: -10px 0 40px ...` を削除（カード共通の border/shadow に置換）。
- `padding: calc(var(--header-height) + 20px) 24px 32px` を、ヘッダー重なり分を除いた `padding: 20px 24px 32px` 程度へ変更。
- 縦スクロール（`overflow-y:auto`）と flex column は維持。
- `.collapsed` 時の挙動は維持。

### 3.5 `.tree-controls`（TreeView.css）

- `top: calc(var(--header-height) + 12px)` を、ヘッダーが重ならなくなるため `top: 12px` 程度へ変更（`.main-content` カード内基準で左上に浮かせる）。

### 3.6 リスト表示の `<h1>` 削除（ListView.jsx / i18n / ListView.css）

- [ListView.jsx:530](ListView.jsx#L530) の `<h1>{t('list.title')}</h1>` を削除する。
- 目的: 操作に不要なものをなくしシンプルにする（「プロジェクトと論理ツリー」という見出しはユーザーの操作に寄与しないため）。
- 併せて:
  - i18n の `list.title`（ja: `プロジェクトと論理ツリー` / en: `Projects & Logic Trees`）を削除。
  - `ListView.css` の `.list-view-header h1`（28px ルール）を削除。
  - `.list-view-header` の構造は維持（`header-left` / `header-right` の並びと、`display-mode-toggle`・`phase-filter-bar` はそのまま残す）。

## 4. 対象外（変更しないもの）

- テーマシステム（`themes.js` / CSS 変数定義）は変更しない（`--surface-color` を流用するのみ）。
- ヘッダー内部のボタン構成・挙動、ビュー切替、検索、インスペクターのコンテンツは変更しない。
- GitHub テーマ用のオーバーライド（`.theme-github *` 等）は原則変更しないが、box-shadow の扱いに整合性を持たせる。

## 5. 境界条件・留意点

- **ライト/ダーク両テーマ**: `var(--surface-color)` はライト＝白・ダーク＝グレーへ追従するため、両方でカードと背景の境界が視認できることを確認する。
- **インスペクター折りたたみ時**: `gap:16px` 追加により、`grid-template-columns: 1fr 0` の side 列との間に空き gap が残り、メインカードが右端まで広がらなくなるデグレが発生する。→ **`.inspector-collapsed` に `column-gap: 0` を追加して対応**（既存機能 `ui_alignment` を維持）。
- **GitHub テーマ**: `.theme-github * { box-shadow: none !important }` があるため、カード共通の `box-shadow` はこのテーマでは打ち消される。これは許容（カード境界は border で担保される）。
- **ツリー/プレビュー表示**: `main-content` の padding が `0` のため、カードの角丸が内部コンテンツ（svg 等）で塞がれないよう `overflow:hidden` で角丸を維持する。
- **プレビュー表示（DesignSandbox）の切れ**: `minHeight: '100vh'` がカード化で縮んだ `.main-content` 内で上下に切れるため、`minHeight: '100%'` へ変更してカード高さに追従させる。
- **`.tree-controls` の位置**: ヘッダー非重なり後、`top:12px` が `.main-content` カード内基準で適切か確認する（必要なら微調整）。
