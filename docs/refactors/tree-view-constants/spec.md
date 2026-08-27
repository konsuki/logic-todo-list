# TreeView のハードコードされた文字列・マジックナンバーの定数化

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: ビジューツリー（`src/features/todo/components/tree/TreeView.jsx`）に、ノード寸法・間隔・ズーム倍率などのマジックナンバーと、レイアウトモード識別子（`'tree'` / `'flow'` 等）・表示ラベル（`'Tree'` / `'Flow'` 等）のハードコード文字列が約 100 箇所散在していた。値の意味が読み取れず、変更時に複数箇所を同時に直す必要があり、typo による「静かに分岐が外れる」不具合を生む。定数に集約して単一の出所（Single Source of Truth）を作り、変更に強い構造にする。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- 変更は「リテラル → 定数参照 / i18n キー参照」への置換のみ。
- 表示文字列は `src/lib/i18n.js` の翻訳辞書、それ以外の定数は `src/features/todo/lib/treeViewConstants.js` に集約する。

## 3. 普通ではないケース・境界条件

- **定数の配置先**: `docs/core/architecture.md` により、アプリ横断で共有する定数は `src/constants/`、todo 機能に閉じた定数は `features/todo/lib/` に置く。TreeView の定数は「ビジューツリー表示専用」で todo 機能に閉じるため、`src/constants/` ではなく `features/todo/lib/treeViewConstants.js` に置く。
- **barrel file 禁止**: `architecture.md` §4.2 により、`index.js` での一括 re-export はしない。`TreeView.jsx` は定数を個別 import する。
- **表示文字列は i18n キー化**: `'Tree'` / `'Flow'` 等のユーザー向け文言は「定数ファイル」ではなく `i18n.js` の翻訳辞書に追加する（ja/en 両対応）。単純なローカル定数化はしない。
- **既存参照のみで未定義だった `tree.layoutSettings`**: 元コードで `t('tree.layoutSettings')` が参照されていたが辞書にキーが存在せず、`useI18n` の fallback で生キー名が表示されていた。本タスクで `ja` / `en` 双方に追加した。
- **テーマ変数フォールバック**: `var(--node-radius, 10px)` の `10px` 等は、テーマ定義（`src/constants/themes.js`）の値と乖離しないよう定数化し、由来をコメントで明記した。

## 4. 優先順位・本当に必要なもの

- **対応する**: `TreeView.jsx` 内のリテラル定数化、`i18n.js` へのキー追加、`architecture.md` §2 への反映。
- **対応しない**: `TreeView.css` のスタイル値（`1.5px` 等）、`treeLogic.js` の残存リテラル（`'PREP'` / `'New Task'` 等）— いずれも性質が異なるため別タスクとする。

## 5. 変更内容のまとめ

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/features/todo/lib/treeViewConstants.js` | 幾何・識別子・動作系・設定パネル・セレクタ/クラス名・テーマフォールバックの定数 |

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/features/todo/components/tree/TreeView.jsx` | リテラルを定数参照・`t()` 参照へ置換 |
| `src/lib/i18n.js` | `tree` セクションに表示文字列キー追加（ja/en）、未定義だった `tree.layoutSettings` を追加 |
| `docs/core/architecture.md` | §2 の構造図に `treeViewConstants.js` を反映 |

## 6. 完了の定義（DoD）

- `TreeView.jsx` のリテラルが定数参照 / `t()` 参照に置換されている。
- `src/features/todo/lib/treeViewConstants.js` が新設されている。
- `src/lib/i18n.js` の `tree` セクションに表示文字列キーが ja/en 双方に追加されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。
