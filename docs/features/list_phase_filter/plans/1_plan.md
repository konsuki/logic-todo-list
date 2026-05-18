# 実装プラン: リスト表示切替時のフェーズフィルター保持

このプランは、リストビューにおけるフェーズフィルターの選択状態を保持・復元するためのものです。

## 大まかな手順

1. **ListView内でのフィルター変更時の保存ロジックの実装**
   - `ListView` コンポーネント内で `phaseFilter` を監視する `useEffect` を追加する。
   - `phaseFilter` が変更された際、その値を `localStorage` に `logido_list_phase_filter` というキーで保存する。

2. **ListViewマウント時のフィルター状態の復元ロジックの実装**
   - `ListView` の `useState('ALL')` を、`localStorage` からの読み込みを伴う初期化関数に変更する。
   - `localStorage.getItem('logido_list_phase_filter')` を取得し、値が存在すればそれを初期値とする。
   - 値が存在しない、または無効な値の場合はデフォルトの `'ALL'` とする。

3. **動作確認**
   - リストビューで「実行期」などの特定のフィルターを選択する。
   - ツリー表示に切り替えて全体像を確認する。
   - 再びリストビューに戻り、選択したフィルター（例：「実行期」）が維持されていることを確認する。
   - ブラウザのデベロッパーツールで、`localStorage` の `logido_list_phase_filter` に正しい値が保存されているか確認する。
