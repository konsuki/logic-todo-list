# プラン: コメントの過不足を調整する

## 大まかな手順

1. 過剰・冗長なコメントを洗い出し、削除する（コードの言い換えに限定）。
2. 意図が伝わりにくい箇所に「なぜ」のコメントを追加する。
3. 主要なコンポーネント・フックに JSDoc（1 行の役割説明）を追加する。
4. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
5. 連鎖修正（`docs/` 内の該当記述の確認）とコミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（過剰・冗長コメントの削除）

**削除の判断基準**

- 「コードから自明な言い換え」で、かつドメイン知識を失わせないものに限定する。
- 「soft-deleted and hidden nodes」のようなコメントは、一見言い換えに見えるが「このフィルタの意図＝削除済み・非表示ノードを除外する」というドメイン知識を示すため**削除しない**。

**削除対象（確定）**

| ファイル | コメント | 判断理由 |
|---|---|---|
| `treeNodes.js` | `// Default phase`（`phase: PHASES.PREP` に付く） | 変数名 `PHASES.PREP` で既に「デフォルトのフェーズ」と分かる。冗長 |
| `treeNodes.js` | `// Default due date`（`dueDate: null` に付く） | `null` がデフォルトと自明。冗長 |
| `treeNodes.js` | `// Default: unclassified`（`folderId: null` に付く、3 箇所） | ただし「unclassified＝未分類」はドメイン知識。`folderId: null` の意味を補足する価値があるため**残すか検討** |

**削除しない（確定）**

- `// Skip soft-deleted and hidden nodes`（`TreeView.jsx` / `ListView.jsx` / `treeDisplay.js`）
- `// Exclude soft-deleted and hidden children`（`treeDisplay.js`）
- `// Assign sequential order`（`treeNodes.js`）: `nextOrder++` の意図を補足
- `// Will be set by parent mapping`（`treeNodes.js`）: `order: 0` が後で上書きされることを説明

**やること**

1. 上記「削除対象」のコメントを削除する。
2. 削除後に `npm run lint` が通ることを確認する（コメント削除のみなので lint への影響は無いはず）。

**この手順単体での検証**

- 削除対象のコメントが実際に消えたことを `grep` で確認する。
- 統合検証は手順 4 で行う。

---

## 手順 2 の詳細（「なぜ」のコメント追加）

**やること**

意図が伝わりにくい箇所に「なぜ」を説明するコメントを追加する。追加対象は「コードの『何をしているか』は読めるが『なぜそうするのか』が分からない」箇所に限定する。

**追加対象（候補）**

- `useTodoTree.js` の起動時優先読み込み（`/__bizyu_export` GET/POST）: なぜファイルと localStorage を比較するのか、の意図説明は既にコメントがあるため、追加不要の可能性。
- `TreeView.jsx` の D3 zoom 初期化（`currentTransform.k === 1 && ...`）: なぜ初期 transform をリセットするか、の説明が薄い。
- `ListView.jsx` のスクロール位置保持（`findScrollable`）: なぜ再帰で探索するか、の意図は既にある程度コメント済み。

**判断方針**

- 既に十分なコメントがある箇所には**追加しない**（過剰コメントを避ける）。
- 「なぜ」が本当に不足している箇所のみ、1〜2 行の簡潔なコメントを追加する。

**この手順単体での検証**

- 追加したコメントが「コードの言い換え」ではなく「なぜ」の説明になっていることを確認する。

---

## 手順 3 の詳細（JSDoc の追加）

**やること**

主要なコンポーネント・フックに JSDoc（1 行の役割説明）を追加する。対象は「役割が明確でない主要なもの」に限定する。

**追加対象（確定）**

| ファイル | 追加する JSDoc |
|---|---|
| `App.jsx` | `App` コンポーネント: アプリ全体の組み立て（状態管理・レイアウト・ビュー切替） |
| `useTodoTree.js` | `useTodoTree`: ツリー状態の管理と localStorage/MCP への永続化 |
| `TreeView.jsx` | `TreeView`: D3 によるツリー/フロー表示 |
| `ListView.jsx` | `ListView`: react-arborist によるリスト表示 |
| `SettingsPanel.jsx` | `SettingsPanel`: アプリ設定パネル |
| `useShortcuts.js` | `useShortcuts`: グローバルキーボードショートカット |

**追加しないもの**

- 既に JSDoc がある `lib/` モジュール。
- サブコンポーネント（`HowSection` / `DependencySection` 等）: 名前と構造から役割が明確なため、原則追加しない（過剰コメント回避）。

**この手順単体での検証**

- 追加した JSDoc が 1 行で役割を表していることを確認する。統合検証は手順 4 で行う。

---

## 手順 4 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 5 の詳細（連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（連鎖修正）**

1. `docs/` 全体を該当キーワードで grep し、矛盾する古い記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/refactors/readability/spec.md` の L5（コメント過不足調整）の記述を実装後の状態に合わせて更新する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`docs:` または `refactor:` プレフィックス。コメント変更のみなので `docs:` が適切な場合もあるが、コードファイルへのコメント変更なので `refactor:` に統一）。
2. コミットメッセージ例: `refactor: コメントの過不足を調整`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「コメントの過不足を調整する」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/comment-adjustment`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。
