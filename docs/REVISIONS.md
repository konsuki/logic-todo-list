# LogiDo 修正・機能追加リクエスト (REVISIONS)

## テンプレ
- [RX] 05-02: 内容

## 🚀 未完了 (Incomplete)

## ✅ 完了済み (Completed)
- [R17] 05-16: 不要な実験用ディレクトリ（scratch/）の削除 (docs/plans/remove_scratch_plan.md)
- [R16] 05-15: 論理削除（ソフトデリート）とゴミ箱機能の実装 (specs/soft_delete_spec.md)
- [R15] 05-14: ノードタイプタグとステップバッジの表示・非表示設定の実装 (@node_badge_visibility_spec.md)
- [R14] 05-14: リストビューでのフェーズバッジ（実行フェーズ）の表示・非表示設定の実装 (@phase_badge_visibility_spec.md)
- [R13] 05-14: JSON/Markdown形式によるタスクツリーの一括インポート機能の実装 (@bulk_import_spec.md)
- [x] 05-13: [R11] react-arboristを使ってリストビューでの階層構造D&Dを実装する (@hierarchical_dnd_spec.md)
- [x] 05-13: [R9] GitHub Actionsテーマの色味とスタイルを実際の画像に完全に一致させる (@github_actions_theme_spec.md)
- [x] 05-03: [R7] Viteの開発モードの時だけプレビュー機能を有効にする (@dev_only_preview_spec.md)
- [x] 05-03: [R5] テーマシステムの実装（ライト/ダークモード、クラシック/プレミアム配色） (@theme_system_spec.md)
- [x] 05-03: [R6] デザインプレビュー機能（Sandbox）のデベロッパー向け永続化
- [x] 05-02: [R4] GOALが複数存在している時、TreeViewのtreeモードで1つ目のGOAL以外のツリーが表示されない問題の修正
- [x] 05-02: [R3] キーボードショートカットの実装 (Enter: 兄弟追加, Tab: 子追加, Shift+Tab: アウトデント) (@node_shortcuts_spec.md)
- [x] 05-02: [R2] Flow モードへの論理的レイアウトロジック（8pxグリッド）の適用 (@impeccable_layout_spec.md)
- [x] 05-02: [R1] TreeView内の設定モーダルのUI崩れ修正 (@settings_modal_fix_spec.md)
- [x] 05-02: 設定UIの実装とリストビューの説明表示切り替え機能 (@global_settings_spec.md)

- 05-02: description部分にリンクを書いた場合、リンクとして認識できるようにする
- 05-02: description部分が個別にデータを保持できるようにする。
- 04-28: ツリー表示時にノードをクリックすると内容を変更できるようにする
- 04-28: ツリー表示とリスト表示のスイッチング部分をもっちりアニメーションさせる
- 04-28: ツリー表示時にノードをダブルクリックしてタイトルを直接編集できる機能を追加
- 04-28: 表示切替ボタンに「もっちり」アニメーションを実装 (Framer Motion)
- 04-28: 表示切替ショートカットの実装 (V: View切替, I: Inspector開閉) (@shortcuts_spec.md)
- 04-28: 基本ショートカットの実装 (Arrows: 移動, Enter: 追加, Del: 削除, Space: 完了切替) (@shortcuts_spec.md)
- 04-28: Flowモード時のノードクリックによる表示リセットバグを修正
- 04-28: AIタイトル簡潔化・詳細分離 (@ai_feature_spec.md)
- 04-28: フロー表示の視覚的階層化（包含型モデル） (@flow_hierarchy_spec.md)
- 04-28: UIコントロールパネルのレイアウト修正 (@ui_alignment_fix_spec.md)
- 04-28: ツリー表示時のスクロール可能ノード実装
- 04-28: ノード接続箇所の位置調整（右中央）
- 04-28: 実行順序（Order）の設定・反映機能
- 04-28: AI分解提案機能の導入 (@ai_feature_spec.md)
- 04-28: 多言語対応 (i18n) (@i18n_spec.md)
- 04-28: 線形フロー表示モード (Flow View) (@flow_view_spec.md)
- 04-28: 実行フェーズ・期限管理 (Timeline) (@timeline_spec.md)
- 04-28: 依存関係 (Dependency) の導入 (@dependency_spec.md)

---
*タスクを追加する際は、「未完了」セクションの最上部に `MM-DD: 内容` の形式で追記してください。完了したタスクは「完了済み」セクションへ移動してください。*