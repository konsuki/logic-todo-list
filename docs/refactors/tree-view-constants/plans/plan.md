# プラン: TreeView のハードコードされた文字列・マジックナンバーの定数化

## 大まかな手順

1. 対象範囲を確定する（`TreeView.jsx` 単独。`TreeView.css` のスタイル値・`treeLogic.js` の残存リテラルは対象外）。
2. `TreeView.jsx` 内のリテラルを 6 カテゴリ（幾何・識別子・動作系・設定パネル・表示文字列・セレクタ/クラス名）に分類する。
3. 配置先を確定する（機能固有定数は `features/todo/lib/treeViewConstants.js`、表示文字列は `i18n.js`）。
4. `src/features/todo/lib/treeViewConstants.js` を新設し、各カテゴリの定数を定義する。
5. `src/lib/i18n.js` の `tree` セクションに表示文字列キーを ja/en 双方に追加する（未定義だった `tree.layoutSettings` も追加）。
6. `TreeView.jsx` のリテラルを定数参照・`t()` 参照へ置換する。
7. `docs/core/architecture.md` §2 に `treeViewConstants.js` を反映する。
8. `npm run lint` / `npm run test:run` / `npm run build` で検証する。
9. `docs/REVISIONS.md` に完了エントリを追加する。
10. コミットし、main へマージする。
