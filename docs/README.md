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

### 3. [features/](./features/) - 機能別の仕様と実装計画
- 各機能ごとの「現在の正しい仕様 (spec)」と「過去の実装手順のアーカイブ (plans/)」を集約。
- [ai_feature](./features/ai_feature/spec.md): AI 提案機能。
- [flow_view](./features/flow_view/spec.md): 一直線フロー表示。
- [node_relationship](./features/node_relationship/spec.md): ノード間の順序と論理的関係の定義。
- [dependency](./features/dependency/spec.md): 依存関係。
- [timeline](./features/timeline/spec.md): フェーズと期限。
- [i18n](./features/i18n/spec.md): 多言語対応。
- [bulk_import](./features/bulk_import/spec.md): タスクツリーの一括インポート。
- [node_badge_visibility](./features/node_badge_visibility/spec.md): 各種バッジ・タグの表示制御。

### 4. [archives/](./archives/) - 過去資料
- 古い下書きや完了済みのチェックリスト。

---

## 🤖 AI への指示
タスクを開始する際は、まず `REVISIONS.md` を読み、現在のコンテキストを確認してください。必要に応じて関連する `features/` 内の仕様書（spec.md）を参照してください。
