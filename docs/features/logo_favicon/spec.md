# ロゴ・ファビコン 仕様書

## 概要

アプリケーションのロゴ（ヘッダー）およびファビコン（ブラウザタブアイコン）の定義。

---

## 現在の実装

### アプリ名
- **ブランド名**: ビジュー
- **ページタイトル** (`<title>`): `ビジュー`

### ロゴ（ヘッダー左）
- **構成**: 画像アイコン ＋ テキストワードマーク（横並び）
- **アイコン画像**: `src/assets/hold_smartphone_color.png`（スマートフォンを持つ手のイラスト）
  - 表示サイズ: `height: 32px`
- **ワードマーク**: 「ビジュー」
  - フォント: `'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`
  - ウェイト: `800`（ExtraBold）
  - サイズ: `18px`
  - 色: `var(--text-main)`（テーマ追従）

### ファビコン
- **ファイル**: `public/favicon.png`
- **元画像**: `src/assets/hold_smartphone_color.png` のコピー
- **index.html 参照**:
  ```html
  <link rel="icon" type="image/png" href="/favicon.png" />
  ```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v1 | 2026-05-16 | Bolt.new デフォルト（稲妻SVG + `Zap` アイコン）から変更 |
| v2 | 2026-05-16 | A-2ブラケットSVG + DM Mono「logido」ワードマーク |
| v3 | 2026-05-16 | スマートフォン画像アイコン + 「ビジュー」ゴシック太字 |

---

## 関連ファイル

- `index.html` — `<title>` および `<link rel="icon">` の定義
- `src/App.jsx` — ロゴ JSX（ヘッダー内）
- `src/App.css` — `.logo`, `.logo-wordmark`, `.logo-accent` スタイル
- `public/favicon.png` — ブラウザタブアイコン
- `src/assets/hold_smartphone_color.png` — ロゴ元画像
