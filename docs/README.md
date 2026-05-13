# LogiDo Documentation Index

このディレクトリは、LogiDo プロジェクトの仕様、設計、および実装の記録を管理しています。AI（Antigravity）が参照しやすいように整理されています。

## 📁 構造概要

### 1. [REVISIONS.md](./REVISIONS.md)
- **役割**: 進行管理・タスクリスト。
- **内容**: 過去のリクエスト履歴、現在の TODO、完了ステータス。

### 2. [core/](./core/) - 基本原則
- プロジェクト全体の共通ルール。
- [architecture.md](./core/architecture.md): 全体設計、データ構造。
- [ui_ux_design_spec.md](./core/ui_ux_design_spec.md): UI デザインと言語の基準。
- [tree_management_spec.md](./core/tree_management_spec.md): ツリー管理の基本仕様。

### 3. [specs/](./specs/) - 機能仕様書
- 各機能の「現在の正しい仕様」。
- [ai_feature_spec.md](./specs/ai_feature_spec.md): AI 提案機能。
- [flow_view_spec.md](./specs/flow_view_spec.md): 一直線フロー表示。
- [node_relationship_spec.md](./specs/node_relationship_spec.md): ノード間の順序と論理的関係の定義。
- [dependency_spec.md](./specs/dependency_spec.md): 依存関係。
- [timeline_spec.md](./specs/timeline_spec.md): フェーズと期限。
- [i18n_spec.md](./specs/i18n_spec.md): 多言語対応。
- [bulk_import_spec.md](./specs/bulk_import_spec.md): タスクツリーの一括インポート。

### 4. [plans/](./plans/) - 実実装の記録
- 過去のタスクにおける具体的な実装手順と結果のアーカイブ。
- 類似の機能を実装する際の参考資料。

### 5. [archives/](./archives/) - 過去資料
- 古い下書きや完了済みのチェックリスト。

---

## 🤖 AI への指示
タスクを開始する際は、まず `REVISIONS.md` を読み、現在のコンテキストを確認してください。必要に応じて関連する `specs/` 内の仕様書を参照してください。
