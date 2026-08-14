# リスト表示のタイトル編集時にショートカットキーが誤発火する問題の修正 仕様書

## 概要
リスト表示でタスクのタイトルをインライン編集している最中に、カーソル移動キー（←→↑↓）や Backspace、Space、文字キーを押すと、react-arborist の内蔵キーボードナビゲーションが誤って発火し、選択タスクの移動・ツリーの開閉・削除確認ダイアログの表示など、予期しない動作が起きる問題を修正する。

---

## 背景・目的

**誰の、どんな困りごとを解決するか:**
- リスト表示で各タスクのタイトルをクリックしてインライン編集するユーザーが、入力中にカーソルを移動しようとすると（例：全部入力し終わった後に、タイトルの先頭に「〇〇」を追記しようとして先頭へカーソルを戻す、など）、タスクを移動するショートカットキーが機能してしまい、予期しない動作が起きて不快に感じる。

**原因（調査結果）:**
- タイトル編集用の input は [ListView.jsx の ArboristNode 内](src/components/features/list/ListView.jsx#L119-L128) にある。
- この input の `onKeyDown`（`handleTitleSubmit`）は **Enter / blur のみ処理**し、それ以外のキーイベントを `stopPropagation()` していない。
- そのため、キーイベントが react-arborist のコンテナ（`role="tree"` div）までバブルアップし、ライブラリ内蔵のキーボード処理（`default-container.js`）が発火する。
  - ArrowUp / ArrowDown → ノードのフォーカス移動
  - ArrowLeft / ArrowRight → ツリーの開閉・親ノードへ移動
  - Backspace → ノード削除（`onDelete` 経由で確認ダイアログ）
  - Space → トグル／アクティベート
  - 文字キー → ツリー内の先頭一致検索によるフォーカス移動
- なお `useShortcuts.js` のグローバルショートカットは `INPUT` / `TEXTAREA` / `contentEditable` を正しく無視しているため、本問題は **react-arborist 固有**のもの。

---

## 修正方針

[ListView.jsx](src/components/features/list/ListView.jsx) の `ArboristNode` 内 `handleTitleSubmit` に、**keydown イベントの `stopPropagation()`** を追加する。

これにより、編集 input 内のキーイベントが react-arborist コンテナへ伝播しなくなり、以下を実現する。

- input 内の通常の編集動作（文字入力・カーソル移動・Backspace による文字削除・Space 入力）はそのまま維持される。
- Enter / blur での確定は従来どおり。

変更は **1 ファイル・1 関数のみ** の極小修正とする。

---

## 境界条件・非対応ケース

| ケース | 修正後の扱い |
| --- | --- |
| 編集中に Backspace（文字削除） | 文字削除のみ（削除 confirm ダイアログは出ない） |
| 編集中に Space | スペース文字が入力される（トグル／アクティベートは発火しない） |
| 編集中に文字キー | 文字が入力される（ツリー内検索によるフォーカス移動はしない） |
| 編集中に Tab | ブラウザ標準のフォーカス移動（コンテナ独自の Tab 処理は止まる） |
| Enter / blur | 従来どおり確定 |
| 未使用の `TodoItem.jsx`（同一パターン） | デッドコードのため本スコープでは対象外 |
| TreeView の編集 input（`node-edit-input`） | react-arborist 非使用のため問題なし（対象外） |
| Escape による編集キャンセル | 本スコープ外（必要に応じて後続拡張） |

---

## 制約・注意事項
- react-arborist の内蔵キーボード処理はライブラリ内部の実装であり、本修正ではライブラリ自体は変更しない（input 側で伝播を止める方針）。
- グローバルショートカット（`useShortcuts.js`）には変更を加えない（既に input を正しく無視しているため）。
- 修正後は、input 内の文字編集・カーソル移動・確定が従来どおり機能することを手動確認する。
