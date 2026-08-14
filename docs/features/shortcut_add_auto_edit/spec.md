# ショートカットでのタスク追加後に自動でタイトル入力に入る（リスト表示） 仕様書

## 概要
リスト表示でタスクを選択し、Enter（兄弟追加）や Tab（子追加）のショートカットでタスクを追加した際、追加されたタスクのタイトル入力を始めるために手動でクリックする手間がかかり、複数連続で追加する場合にスムーズに進められない問題を解決する。追加直後にそのままタイトル入力を始められるようにする。

---

## 背景・目的

**誰の、どんな困りごとを解決するか:**
- リスト表示でタスクを選択し、Enter（兄弟追加）や Tab（子追加）で関連タスクを追加するユーザーが、追加後に新タスクのタイトル入力を始めるために、手動でそのタスクをクリックしなければならず、複数連続でタスク追加を行う際にスムーズに進められずストレスを感じる問題を解決する。

**原因（調査結果）:**
- ショートカット処理は `src/hooks/useShortcuts.js` で行われ、Enter（兄弟追加）と Tab（子追加）は追加後に `setSelectedNodeId(newId)` と `setEditingNodeId(newId)` を呼んでいる（追加→自動編集の意図は既にある）。
- しかし `editingNodeId` は `src/App.jsx` で **TreeView にのみ渡され、ListView には渡されていない**。
- TreeView は `editingNodeId` を使って D3 の input を描画し、追加→自動編集が機能する。
- 一方 ListView（react-arborist）は各ノードがローカル state `isEditing` / `editTitle` を持ち、追加時にそれを立てる仕組みが無いため、手動クリックが必要になっている。

---

## 修正方針

ListView に `editingNodeId` / `setEditingNodeId` を渡し、`ArboristNode` が「自分が `editingNodeId` と一致したら自動で編集モードに入る」ようにする。

1. `src/App.jsx` で ListView に `editingNodeId` と `setEditingNodeId` を渡す。
2. `src/components/features/list/ListView.jsx` で props を受け取り、`tree.props` 経由（既存の `onUpdateNode` 等と同様）で `ArboristNode` へ渡す。
3. `ArboristNode` 内に `useEffect` を追加し、`tree.props.editingNodeId === data.id` になったら `setEditTitle(data.title)` と `setIsEditing(true)` を実行する。編集確定（blur / Enter）時に `setEditingNodeId(null)` を呼ぶ。

これにより、Enter / Tab 追加直後に入力状態になり、連続入力がスムーズになる。

---

## 境界条件・非対応ケース

| ケース | 扱い |
| --- | --- |
| Enter（兄弟追加）直後 | 新ノードが選択＆編集モードになる |
| Tab（子追加）直後 | 新ノードが選択＆編集モードになる（親は展開済み） |
| 追加後に別ノードをクリック | `editingNodeId` をクリアし、通常の選択動作に戻る |
| 編集中に Escape でキャンセル | リスト側は現状 Escape 未対応のため本スコープでは**対象外**（既存の Enter / blur 確定のみ維持） |
| 空文字のまま確定 | 既存ロジックどおり（空なら更新しない） |
| TreeView | 既に機能しているため変更しない |
| 未使用の `TodoItem.jsx` | 対象外 |

---

## 優先順位
- **必須**: リスト表示で Enter / Tab 追加直後に自動編集モードに入る。
- **軽微（同時に対応）**: `editingNodeId` のクリア処理（確定時・別選択時）を整合的にする。
- **対象外**: リスト側の Escape キャンセル対応、TreeView 側の変更。

---

## 制約・注意事項
- 前回修正（`inspector_title_edit_overwrite`）で `node-title` の `onClick` に追加した `setEditTitle(data.title)` の同期処理は維持する（本件の `useEffect` による自動編集とも整合する）。
- `editingNodeId` は TreeView / ListView の両方で共有されるが、ListView 側は確定時に `setEditingNodeId(null)` を呼ぶことで、TreeView 側の挙動に影響を与えない。
- 修正後は、リスト表示で Enter / Tab 追加 → そのまま入力 → 確定、の一連の流れを手動確認する。
