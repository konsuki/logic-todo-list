# 実装プラン：OR分岐の「複数子ずつのグループ分け」UI

## 大まかな手順

1. `treeLogic.js` のグループ正規化・進捗計算を、オブジェクト形式の `groups` に対応させる
   - **詳細手順**:
     1. **入力**: `src/logic/treeLogic.js` の `normalizeOrGroups` と `calculateNodeProgress`。
     2. **操作**:
        - `normalizeOrGroups` をリファクタリングし、各 `groups` 要素が「オブジェクト形式（`children` を持つ）」か「旧形式（`string[]`）」かを判定して、いずれも子ID配列に正規化する。
        - オブジェクト形式の場合は `group.children` を、旧形式の場合はその配列自体を子ID配列として扱う。
        - 正規化結果は、既存の `calculateNodeProgress` が使う「子ID配列のリスト」に揃える（進捗計算の互換性を維持）。
     3. **出力**: オブジェクト形式・旧形式の双方を扱える `normalizeOrGroups`。
   - **注意**: 進捗計算ロジック（各グループの平均の最大値）は変更しない。正規化レイヤだけを拡張する。
2. `treeLogic.js` にグループ操作関数（追加・削除・子の割り当て・名前/色更新）を追加する
   - **詳細手順**:
     1. **入力**: `src/logic/treeLogic.js`。
     2. **操作**: 以下の純関数を追加する。いずれも `nodes` と対象ノード ID を受け取り、新しい `nodes` を返す（既存関数と同スタイル）。
        - `addGroup(nodes, nodeId)`: 対象ノードの `groups` に新しいグループを追加。名前は「グループN」（N = 既存グループ数+1）、色はパレット（後述）から自動割り当て、`children: []`。
        - `removeGroup(nodes, nodeId, groupId)`: 対象グループを削除。所属子は未分類に戻る（`groups` から除去するだけ）。
        - `assignChildToGroup(nodes, nodeId, childId, groupId)`: 子を指定グループに割り当てる。`groupId` が `null` なら未分類へ。相互排他を担保するため、**割り当て先以外の全グループから該当 `childId` を除去**する。
        - `updateGroup(nodes, nodeId, groupId, updates)`: グループの `name` / `color` を更新する。
     3. **出力**: 上記 4 関数。
   - **色パレット**: 定数 `GROUP_COLOR_PALETTE` を定義（例: `['#4F8CFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA']`）。`addGroup` は `(既存グループ数) % palette.length` で循環的に割り当てる。
   - **注意**: 各関数は進捗に影響しうる場合は `updateProgressRecursively` を呼ぶ（子割り当て変更時）。ただしグループのメタ（name/color）変更は進捗に影響しないため再計算不要。
3. `useTodoTree.js` にグループ操作ハンドラを追加・配線する
   - **詳細手順**:
     1. **入力**: `src/hooks/useTodoTree.js`。
     2. **操作**: 以下 4 ハンドラを `useCallback` で追加し、戻り値に含める。
        - `addGroup(nodeId)` → `treeLogic.addGroup`
        - `removeGroup(nodeId, groupId)` → `treeLogic.removeGroup`
        - `assignChildToGroup(nodeId, childId, groupId)` → `treeLogic.assignChildToGroup`
        - `updateGroup(nodeId, groupId, updates)` → `treeLogic.updateGroup`
     3. **出力**: 4 ハンドラを追加した `useTodoTree`。
4. Inspector にグループ編集 UI を実装する（追加・削除・単一選択セレクト・色分け・名前編集・進捗・折りたたみ）
   - **詳細手順**:
     1. **入力**: `src/components/features/inspector/Inspector.jsx` と `Inspector.css`。props に `addGroup` / `removeGroup` / `assignChildToGroup` / `updateGroup` を追加（`App.jsx` 経由で `useTodoTree` から渡す）。
     2. **操作**:
        - OR モード（`node.relation === 'or'`）かつ子 2 つ以上のとき、「＋グループを追加」ボタンを表示し、`addGroup(node.id)` を呼ぶ。
        - `node.groups` を正規化した表示用リストを構築する（オブジェクト形式と旧形式を吸収。正規化は `treeLogic.normalizeGroups` を新設して利用）。
        - 各グループをカードとして描画。カードには以下を含める：
          - 色インジケータ（`group.color`）
          - グループ名（インライン編集。`updateGroup(node.id, group.id, { name })`）
          - 進捗率（`treeLogic.calculateGroupProgress(nodes, node, group)` を新設して利用）
          - 折りたたみボタン（各カードの開閉 state をローカル管理）
          - 削除ボタン（`removeGroup(node.id, group.id)`）
        - 各子タスクの「所属グループ」単一選択セレクトを描画。選択肢は「なし」＋各グループ名。選択で `assignChildToGroup(node.id, child.id, groupId | null)` を呼ぶ。
     3. **出力**: グループ編集 UI を備えた「How?」セクション。
   - **App.jsx の配線**: `useTodoTree` の 4 ハンドラを `Inspector` に props として渡す。
   - **CSS**: グループカード、色インジケータ、所属セレクト、折りたたみ、進捗表示のスタイルを `Inspector.css` に追加。
5. i18n に翻訳キーを追加する
   - **詳細手順**:
     1. **入力**: `src/logic/i18n.js` の `translations.ja` / `translations.en` の `inspector` セクション。
     2. **操作**: 以下を追加する。
        - `add_group`: ja「グループを追加」 / en「Add group」
        - `group_name`: ja「グループ名」 / en「Group name」
        - `group_progress`: ja「進捗」 / en「Progress」
        - `assign_to_group`: ja「所属グループ」 / en「Group」
        - `no_group`: ja「なし」 / en「None」
        - `remove_group`: ja「グループを削除」 / en「Remove group」
     3. **出力**: ja/en 両方にキーが揃った `i18n.js`。
6. テストを追加・更新する
   - **詳細手順**:
     1. **入力**: `src/logic/treeLogic.test.js`（Vitest）。
     2. **操作**: 以下を追加する。
        - `normalizeOrGroups` がオブジェクト形式・旧形式の両方を正しく正規化すること。
        - `addGroup` がグループを追加し、名前・色・空 children を付与すること。
        - `removeGroup` がグループを削除し、所属子を未分類に戻すこと。
        - `assignChildToGroup` が子を指定グループへ割り当て、**他のグループから同子 ID を除去（相互排他）**すること。
        - `assignChildToGroup` で `groupId: null` を渡すと未分類に戻ること。
        - `updateGroup` が name/color を更新すること。
        - オブジェクト形式の `groups` を使った `calculateNodeProgress` が「複数子ずつのグループ OR」を正しく計算すること（例: B+C か D+E+F で、B+C 完了なら 100）。
     3. **出力**: テストが通る `treeLogic.test.js`。
   - **実行**: `npx vitest run` で全テスト実行し、既存テストに回帰がないことを確認。
