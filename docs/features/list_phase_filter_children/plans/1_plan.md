# 実装プラン: フェーズフィルター時の子タスク表示

このプランは、フェーズフィルターで絞り込んだ際に、該当タスクの配下にある子タスクも表示されるようにするためのものです。

## 大まかな手順

1. **ListView内のフィルタリングロジック（checkVisibility）の修正**
   - `ListView.jsx` の `useMemo`（行320付近）内にある `checkVisibility` 関数を修正する。
   - 引数に `forceVisible = false` を追加する。
   - ノードの表示判定を `const isVisible = forceVisible || (node.phase === phaseFilter);` とする。
   - 子ノードを走査する際、`checkVisibility(childId, isVisible)` と呼び出し、親が表示対象なら子も強制的に表示対象とする。
   - `if (isVisible || childMatches)` の場合に `visibleSet.add(nodeId)` を行い、`true` を返す。

2. **動作確認**
   - リストビューで「実行期」などの特定のフィルターを選択する。
   - ヒットしたタスクを展開し、その配下にある子タスク（フェーズが「実行期」以外であっても）が表示されていることを確認する。
   - フィルタリング中もツリーの親子関係が正しく保持されていることを確認する。
