# 実装プラン：代替手段（OR型分岐）表現機能

## 大まかな手順

1. 進捗計算ロジック（`src/logic/treeLogic.js` の `calculateNodeProgress`）を OR 対応に拡張する
   - **詳細手順**:
     1. **入力**: `src/logic/treeLogic.js` の `calculateNodeProgress`（現状は全アクティブ子の平均を返す）。
     2. **操作**: 関数冒頭でノードの `relation` を判定する（`node.relation === 'or'` か否か）。
     3. **AND 分岐**: `relation !== 'or'` の場合は既存ロジック（全アクティブ子の平均）をそのまま使用。
     4. **OR 分岐の実装**: `relation === 'or'` の場合、以下を実行する。
        - アクティブ子 ID リストを取得（`deletedAt` / `hidden` 除外）。
        - `node.groups`（`string[][]`）を参照し、グループごとの進捗を計算する。
        - グループ進捗 = そのグループに属するアクティブ子の progress の平均。
        - `groups` が空の場合は、各アクティブ子を「単独グループ」として扱う。
        - `groups` に含まれないアクティブ子も「単独グループ」として扱う。
        - 親の progress = 全グループ進捗の**最大値**。
        - アクティブ子が 0 個の場合は葉ノード扱い（`status === DONE ? 100 : 0`）。
     5. **出力**: 新しい `calculateNodeProgress`。
   - **補助関数**: グループ進捗の計算と、`groups` 未定義・空の場合の正規化を分離して実装する（テスト容易性のため）。
   - **注意**: `updateProgressRecursively` は `calculateNodeProgress` を呼ぶため、変更は自動的に祖先にも波及する。追加の変更は不要。
2. `useTodoTree.js` に関係種別（AND/OR）切替のハンドラを追加する
   - **詳細手順**:
     1. **入力**: `src/hooks/useTodoTree.js`（現在は `handleUpdateNode` で任意フィールドを更新できる）。
     2. **操作**: 新しいハンドラ `handleSetRelation`（`useCallback`）を追加する。
        - 引数: `(nodeId, relation)`。`relation` は `'and' | 'or'`。
        - ノードの `relation` を更新する。
        - `relation === 'and'` に切り替える場合は `groups` を `[]` にリセットする。
        - `relation === 'or'` に切り替える場合で `groups` が未定義の場合は `groups: []` を設定する（「各子＝単独グループ」のデフォルト）。
        - `updatedAt` を更新する。
     3. **出力**: 戻り値オブジェクトに `setRelation: handleSetRelation` を追加する。
   - **注意**: 既存の `handleUpdateNode` でも対応可能だが、`groups` リセットの整合性を一箇所に閉じ込めるため専用ハンドラを設ける。
3. Inspector の「How?」セクションに AND/OR トグル UI を追加する
   - **詳細手順**:
     1. **入力**: `src/components/features/inspector/Inspector.jsx` の「how」セクション（`sectionMap.how`）。
     2. **操作**:
        - `Inspector` コンポーネントの props に `setRelation` を追加する（`App.jsx` 経由で `useTodoTree` から渡す）。
        - 「How?」セクションの見出し直下に、関係種別トグルを追加する。選択中ノードが子を 2 つ以上持つ場合のみ表示。
        - トグルは `relation === 'or'` か否かで AND / OR のラベルを表示し、クリックで `setRelation(node.id, 反対の値)` を呼ぶ。
        - OR 表示時、子一覧（`children.map`）を「代替手段」として区切って表示する（区切り線・ラベルなど最小限の視覚表現）。各子が独立した代替手段であることを示す。
     3. **出力**: AND/OR トグルと、OR 時の区切り表示を持つ「How?」セクション。
   - **境界条件**:
     - 子が 0〜1 個のときはトグルを非表示（または無効化）。
     - 葉ノード（子なし）選択時は「no_subtasks」表示のまま。
   - **注意**: `App.jsx` で `useTodoTree` の `setRelation` を `Inspector` に配線する必要がある。
4. i18n に翻訳キーを追加する
   - **詳細手順**:
     1. **入力**: `src/logic/i18n.js` の `translations.ja` と `translations.en`。
     2. **操作**: `inspector` セクションに以下の翻訳キーを追加する。
        - `relation_label`: 関係種別のラベル（ja「子タスクの関係」 / en「Child relationship」）。
        - `relation_and`: AND のラベル（ja「すべて必須（AND）」 / en「All required (AND)」）。
        - `relation_or`: OR のラベル（ja「いずれかで十分（OR）」 / en「Any suffices (OR)」）。
        - `alternative_option`: 代替手段の区切りラベル（ja「代替手段」 / en「Alternative」）。
     3. **出力**: ja/en 両方にキーが揃った `i18n.js`。
   - **注意**: キー名は既存の命名規則（snake_case、inspector 配下）に合わせる。
5. テスト（`treeLogic.test.js`）を追加・更新する
   - **詳細手順**:
     1. **入力**: `src/logic/treeLogic.test.js`（Vitest 形式）。
     2. **操作**: `calculateNodeProgress` の OR 対応に関するテストケースを追加する。最低限以下を含める。
        - **OR ノードでいずれか 1 グループが全 DONE のとき 100 になる**: 例 `groups = [["B","C"],["D"]]` で B・C が DONE、D が TODO → 親 progress 100。
        - **OR ノードで部分達成のとき最大グループ進捗になる**: 例 グループ1 進捗 100、グループ2 進捗 50 → 親 progress 100。
        - **OR ノードで全グループ未達のとき 0 でない最大値**: 例 グループ1 50、グループ2 0 → 親 progress 50。
        - **AND ノードは従来どおり平均**: `relation` 未指定のノードで全子平均になることを確認。
        - **`groups` 空の OR ノードは各子を単独グループとして扱う**: 子が DONE/TODO 混在 → 最大値 100。
        - **`groups` に含まれない子も単独グループとして扱う**: 未分類子が DONE なら親 100。
     3. **出力**: テストが通る `treeLogic.test.js`。
   - **実行**: `npm test`（または `npx vitest run`）で全テストを実行し、既存テストに回帰がないことを確認する。
