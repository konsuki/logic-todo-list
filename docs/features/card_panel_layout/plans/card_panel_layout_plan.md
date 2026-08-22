# 実装プラン：カード型フローティングパネルレイアウト

> 段階的・ターン制で進める。各ステップ完了ごとに報告する。

## 大まかな手順

1. **App.css の `.app-container` をカード型グリッドに変更**（ヘッダーを含む2行2列、gap/padding 16px、ベース背景維持。折りたたみ時の gap デグレ対策として `.inspector-collapsed` に `column-gap:0` を追加）
2. **App.css の `.app-header` をカード化**（絶対配置を解除、サーフェス色＋角丸＋border、z-index削除）
3. **App.css の `.main-content` をカード化**（角丸・サーフェス色・border・shadow、ヘッダー分の上padding削除、overflow:hidden維持。DesignSandbox の `minHeight` を `100%` に変更）
4. **App.css の `.inspector-panel` をカード化**（ガラスblur除去、サーフェス色＋角丸＋border、上paddingを調整、`.collapsed`維持）
5. **TreeView.css の `.tree-controls` の top を調整**（ヘッダー非重なりに対応）
6. **リスト表示の `<h1>` 削除と関連整理**（ListView.jsx の h1、i18n の `list.title`、ListView.css の `.list-view-header h1`）
7. **動作確認と整合性チェック**（ビルド/リント、テーマ別表示、インスペクター折りたたみ、ツリー/リスト/プレビュー各ビュー）

---

## 手順の詳細

### ステップ1：`.app-container` をカード型グリッドに変更

**対象**: `src/App.css` の `.app-container`（1〜11行目付近）

**変更内容**:
- 現在の `grid-template-areas: "main side"`（1行2列）を、ヘッダーを含む2行2列へ変更。
- `grid-template-rows: var(--header-height) 1fr` を追加。
- `grid-template-columns: 1fr var(--sidebar-width)` は維持。
- `gap: 16px` と `padding: 16px` を追加。
- `height: 100vh; width: 100vw; background-color: var(--bg-color); position: relative;` は維持（ベース背景）。
- `transition: grid-template-columns ...` は維持（インスペクター開閉アニメーションのため）。

**具体的な CSS**:
```css
.app-container {
  display: grid;
  grid-template-areas:
    "header header"
    "main   side";
  grid-template-rows: var(--header-height) 1fr;
  grid-template-columns: 1fr var(--sidebar-width);
  gap: 16px;
  padding: 16px;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-color);
  transition: grid-template-columns 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-sizing: border-box;
}
```

**留意点**:
- `box-sizing: border-box` を明示（グローバルの `* { box-sizing: border-box }` が index.css にあるため必須ではないが、grid + padding のサイズ計算を明示）。
- `.app-container.inspector-collapsed`（13〜15行目）の `grid-template-columns: 1fr 0` はそのまま維持するが、**`gap:16px` 追加により折りたたみ時に side 列との間へ空き gap（16px）が残り、メインカードが右端まで広がらなくなるデグレが発生する**。→ 対応として `.inspector-collapsed` に `column-gap: 0` を追加する（縦 gap は 16px 維持）。既存機能 `ui_alignment`（「インスペクター閉時に main-content が画面いっぱいに広がる」）を守るため必須。

### ステップ2：`.app-header` をカード化

**対象**: `src/App.css` の `.app-header`（46〜59行目付近）

**変更内容**:
- `position: absolute; top: 0; left: 0; right: 0;` を削除（グリッドの `header` エリアへ収める）。
- `z-index: 100` を削除（重なりが不要になる）。
- カード化: `background-color: var(--surface-color)`、`border: 1px solid var(--border-color)`、`border-radius: 12px`、`box-shadow: 0 1px 3px rgba(0,0,0,0.05)` を追加。
- `height: var(--header-height)` は削除（グリッド行 `var(--header-height)` が高さを担うため。ただし内部 flex で縦中央揃えを維持）。
- `display: flex; align-items: center; justify-content: space-between; padding: 0 40px;` は維持。

**具体的な CSS**:
```css
.app-header {
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

**留意点**:
- `grid-area: header` を明示（`grid-template-areas` の `header` と対応）。
- ヘッダー内部（`.logo` / `.view-switcher` / `.header-actions`）は変更しない。`header-actions` がインスペクターに重ならないようになる。
- `background-color: transparent` → `var(--surface-color)` への変更で、`view-switcher` の `background-color: var(--bg-color)`（85行目）がカード内で浮きすぎないか後で確認（ステップ7）。

### ステップ3：`.main-content` をカード化

**対象**: `src/App.css` の `.main-content`（121〜127行目付近）

**変更内容**:
- `grid-area: main` は維持。
- `padding: var(--header-height) 0 0 0` を削除（ヘッダー非重なりのため上余白が不要になる）。
- カード化: `background-color: var(--surface-color)`、`border: 1px solid var(--border-color)`、`border-radius: 12px`、`box-shadow: 0 1px 3px rgba(0,0,0,0.05)` を追加。
- `position: relative; overflow: hidden; height: 100%;` は維持。

**具体的な CSS**:
```css
.main-content {
  grid-area: main;
  position: relative;
  overflow: hidden;
  height: 100%;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

**留意点**:
- リスト表示時の `style={{ padding: '40px' }}`（App.jsx:231）は維持するため、リストはカード内に 40px の内側余白を持つ。
- ツリー/プレビューは `padding: 0` のため、内部コンテンツ（svg 等）がカードいっぱいに広がる。`overflow:hidden`＋`border-radius` で角丸を維持。
- `.tree-view-container`（TreeView.css）の `background-color: var(--bg-color)` がカード内で「ベース背景色」のまま残ると、カード（`--surface-color`）との色差が出る。→ **ステップ5 で `.tree-view-container` の背景を `transparent` にするか検討**（`.main-content` カードの色を透かす）。これはプランに追記する。
- **プレビュー表示（DesignSandbox）の切れ**: `DesignSandbox.jsx` の `minHeight: '100vh'`（21行目）が、カード化で縮んだ `.main-content` 内で `overflow:hidden` により上下が切れる。→ **対応として `minHeight: '100vh'` → `'100%'` に変更**（`.main-content` カード高さに追従）。DEV 限定（`import.meta.env.DEV`）の軽微な影響だが、見た目の崩れを防ぐ。

### ステップ4：`.inspector-panel` をカード化

**対象**: `src/App.css` の `.inspector-panel`（129〜143行目付近）と `.inspector-panel.collapsed`（145〜150行目）

**変更内容**:
- `grid-area: side` は維持。
- ガラス背景をやめる: `background-color: var(--glass-bg)` と `backdrop-filter: blur(20px)` を削除。
- カード化: `background-color: var(--surface-color)`、`border: 1px solid var(--border-color)`、`border-radius: 12px`、`box-shadow: 0 1px 3px rgba(0,0,0,0.05)` を追加。
- `border-left: 1px solid var(--glass-border)` を削除（カード共通 border に置換）。
- `box-shadow: -10px 0 40px rgba(0,0,0,0.2)` を削除（カード共通 shadow に置換）。
- `padding: calc(var(--header-height) + 20px) 24px 32px` を `padding: 20px 24px 32px` に変更（ヘッダー重なり分を除去）。
- `overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 32px;` は維持。
- `transition` は維持（開閉アニメーション）。

**具体的な CSS**:
```css
.inspector-panel {
  grid-area: side;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 20px 24px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 32px;
  transition: padding 0.45s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**留意点**:
- `.inspector-panel.collapsed`（145〜150行目）は `padding:0; opacity:0; pointer-events:none; border-left:none;` を維持。ただし `border-left: none` はカード共通 border と競合するため、`border: none` に変更する（折りたたみ時にカードの枠線も消す）。
- GitHub テーマの `.theme-github * { box-shadow: none !important }` により shadow は打ち消されるが、border でカード境界は担保される（許容）。

### ステップ5：TreeView 関連の位置・背景調整

**対象**: `src/components/features/tree/TreeView.css`

**5-a. `.tree-controls` の top 調整（156行目付近）**

- `top: calc(var(--header-height) + 12px)` → `top: 12px` に変更（ヘッダーが重ならなくなるため、`.main-content` カード内基準で左上に配置）。
- これによりツリー表示の操作コントロール（レイアウト切替・方向切替）がカード内の左上に収まる。

**5-b. `.tree-view-container` の背景を transparent に変更（4行目付近）**

- `background-color: var(--bg-color)` → `background-color: transparent` に変更。
- 理由: `.main-content` カード（`--surface-color`）の背景を透かし、カード内で一貫した見た目にする。ベース背景との色差をなくす。
- `overflow: hidden; position: relative; cursor: grab;` は維持。

**留意点**:
- フロー表示・ツリー表示の svg やノードは背景透過で問題なく描画される（ノードは `var(--surface-color)` の fill を持つが、カード背景と同系色になるため、ノード境界は stroke で見える）。
- プレビュー表示（DesignSandbox）は `main-content` 直下に描画されるため、このステップの影響はない。

### ステップ6：リスト表示の `<h1>` 削除と関連整理

**対象**: `src/components/features/list/ListView.jsx`、`src/logic/i18n.js`、`src/components/features/list/ListView.css`

**6-a. ListView.jsx の `<h1>` 削除（530行目付近）**

- `<h1>{t('list.title')}</h1>` を削除する。
- `header-left` 内の `display-mode-toggle` と `phase-filter-bar` は残す（`header-left` の flex column 構造は維持）。
- 削除後、`header-left` の直下が `display-mode-toggle` になる。見た目の整理上、`header-left` の `gap:12px` は維持（toggle と phase-filter の間隔）。

**6-b. i18n.js の `list.title` 削除**

- `src/logic/i18n.js` の ja（26行目 `title: 'プロジェクトと論理ツリー'`）と en（159行目 `title: 'Projects & Logic Trees'`）を削除。
- まず `grep -rn "list.title\|\.title"` で他に `t('list.title')` を使う箇所がないか確認してから削除する。

**6-c. ListView.css の `.list-view-header h1` 削除（28〜31行目付近）**

- `.list-view-header h1 { font-size: 28px; letter-spacing: -0.5px; }` を削除。
- `.list-view-header` 自体（15〜20行目）は維持（`header-left` / `header-right` の横並び）。

**留意点**:
- `<h1>` を消すことで、リスト表示のヘッダーは「モード切替（論理ツリー/フォルダ）＋フェーズフィルター（左）」「新規ボタン群（右）」だけになり、シンプルになる。
- `header-left` が空にならない（`display-mode-toggle` は `settings.useFolderView !== false` のときだけ表示、`phase-filter-bar` は `displayMode === 'logic'` のとき表示）。両方非表示のケースは実質ないため問題なし。

### ステップ7：動作確認と整合性チェック

**7-a. ビルド・リント・テスト**
- `npm run build` が成功すること。
- `npm run lint` が通ること（既存警告は除く）。
- `npm run test:run`（既存テスト）が通ること。特に `Inspector.test.jsx` や `test_TreeView.test.jsx` が今回の CSS 変更で壊れないことを確認。

**7-b. 表示確認（dev サーバ or スクリーンショット）**
- ライト/ダーク各テーマで以下を確認:
  - ヘッダー・メイン・インスペクターが各カードとして浮いて見えるか（gap 16px・角丸・border）。
  - `header-actions` がインスペクターに重ならないか。
  - リスト表示で `<h1>` が消えているか。
  - ツリー表示で `.tree-controls` がカード左上に収まり、`.tree-view-container` 背景がカードと同系色か。
- インスペクター折りたたみ（`inspector-collapsed`）で `grid-template-columns: 1fr 0`＋`column-gap:0` によりメインカードが右端まで広がるか（デグレ①の確認）。
- DEV 限定のプレビュー表示（Alt+P）で、DesignSandbox がカード内に収まり上下が切れないか（デグレ②の確認）。

**7-c. ドキュメント整合性（連鎖修正プロトコル）**
- `docs/` 全体を `grep` し、旧レイアウト（絶対配置ヘッダー・ガラス背景インスペクター等）を前提にした古い記述がないか確認し、あれば更新。
- `docs/REVISIONS.md` に今回のタスクを「未完了」→「完了」へ移動（完了フェーズで実施）。
- `docs/features/card_panel_layout/spec.md` に実装反映結果を反映。
