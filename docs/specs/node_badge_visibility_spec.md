# 機能仕様：各種バッジ・タグの表示・非表示設定

## 1. 目的
リストビューにおいて、タスクに付随する「ノードタイプ（GOAL等）」「ステップ番号（Step 1等）」「フェーズ（準備期等）」の表示・非表示を個別に切り替えられるようにし、ユーザーが情報の密度を自由に調整できるようにする。

## 2. 変更内容

### 2.1 設定項目
- `showPhaseBadges`: フェーズバッジ（準備期、実行期等）の表示 (デフォルト: `true`)
- `showNodeTypeTags`: ノードタイプタグ（GOAL, STRATEGY, ACTION）の表示 (デフォルト: `true`)
- `showStepBadges`: ステップ番号（Step 1, Step 2等）の表示 (デフォルト: `true`)

### 2.2 UI/UX
- **設定パネル**: 「表示設定」セクションに、上記3項目のトグルスイッチを配置する。
- **リストビュー**: 各設定値に基づき、該当する要素のレンダリングを制御する。
    - `showNodeTypeTags` -> `.node-type-tag`
    - `showStepBadges` -> `.step-badge`
    - `showPhaseBadges` -> `.phase-badge`

### 2.3 多言語対応 (i18n)
- `settings.show_node_type_tags`: 「ノードタイプを表示」 / "Show Node Types"
- `settings.show_node_type_tags_desc`: 「タスクの種類（GOAL, STRATEGY等）を示すタグを表示します。」 / "Show tags indicating task types."
- `settings.show_step_badges`: 「ステップ番号を表示」 / "Show Step Numbers"
- `settings.show_step_badges_desc`: 「階層内での順番（Step 1, Step 2等）を表示します。」 / "Show sequence numbers within each level."
- (既存) `settings.show_phase_badges`: 「フェーズバッジを表示」
