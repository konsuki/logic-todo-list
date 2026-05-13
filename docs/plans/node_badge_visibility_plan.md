# 実装プラン：各種バッジ・タグの表示・非表示設定 (R15)

## 大まかな手順

1. **SettingsContext の更新**: `showNodeTypeTags` と `showStepBadges` を追加する。
    - `SettingsContext.jsx` のデフォルト値に `showNodeTypeTags: true`, `showStepBadges: true` を追加。
2. **i18n の更新**: 新しい設定項目の翻訳テキストを追加する。
    - `ja` と `en` の `settings` セクションに `show_node_type_tags` と `show_step_badges` 関連のキーを追加。
3. **SettingsPanel の更新**: 設定パネルに2つのトグルスイッチを追加する。
    - 「ノードタイプタグ」用には `Layers` または `Tag` アイコンを使用。
    - 「ステップバッジ」用には `ListOrdered` または `Hash` アイコンを使用。
    - 既存の項目と同様の `setting-item` 構造を複製する。
4. **ListView の更新**: `ArboristNode` 内で、設定に基づきタグとステップバッジのレンダリングを制御する。
    - `node-type-tag` を `{settings.showNodeTypeTags && ...}` でラップ。
    - `step-badge` を `{settings.showStepBadges && ...}` でラップ。

---
*※ 以降のターンで各手順を詳細化します。*
