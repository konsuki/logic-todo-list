# LogiDo (Logic + Todo) - 開発仕様書

## 1. コンセプト
「なぜやるのか（目的）」と「どうやるのか（手段）」を論理的なツリー構造で管理し、タスクの迷子を防ぐTODOアプリ。

## 2. コア機能

### 2.1 階層型タスク管理 (Logic Tree Structure)
- **Goal (Root)**: 最終目標。
- **Strategy/Logic (Branch)**: 目標を達成するための戦略や中間目標。
- **Action (Leaf)**: 実行可能な最小単位のタスク。
- **無限階層対応**: 必要に応じてどこまでも深く分解可能。

### 2.2 進捗管理 (Progress Roll-up)
- 下位タスク（Action）の完了状態に基づき、上位タスクの進捗率（%）を自動計算。
- 視覚的なプログレスバー表示。

### 2.3 ビュー切り替え (Dual View)
- **Tree View**: SVGまたはCanvasを用いたグラフィカルなツリー表示。全体像の把握用。
- **List View**: 階層構造を維持したインデント形式のリスト表示。日々の実行用。

### 2.4 インテリジェント機能 (Why/How Inspector)
- **詳細仕様**: [inspector_spec.md](./inspector_spec.md)
- **概要**: 選択したタスクに対して、「なぜ必要なのか（親）」と「どう実現するか（子）」を強調表示。

### 2.5 多言語対応 (Multi-language Support)
- **詳細仕様**: [i18n_spec.md](./i18n_spec.md)
- **概要**: 日本語・英語の切り替え機能。LocalStorageによる設定保持。

### 2.6 AIロジック支援 (AI Logic Assistant)
- **詳細仕様**: [ai_feature_spec.md](./ai_feature_spec.md)
- **概要**: DeepSeek API を用いた分解案の自動生成、ロジックチェック機能。

## 3. UI/UX デザイン方針
- **詳細仕様**: [ui_ux_design_spec.md](./ui_ux_design_spec.md)
- **Aesthetics**: モダンなダークモード。HSLを用いた洗練されたカラーパレット。
- **Transitions**: ノードの展開・折りたたみ時のスムーズなアニメーション。
- **Interactive**: ドラッグ＆ドロップによる構造の組み換え、ショートカットによる高速な操作。

## 4. 技術スタック（推奨）
- **Core**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Storage**: Browser LocalStorage (初期段階)
- **Icons**: Lucide Icons または Google Fonts
- **Framework**: Vite + React / Vue.js (推奨)

## 5. 詳細仕様ファイル一覧
- [tree_management_spec.md](./tree_management_spec.md) - ① ツリー型階層管理
- [progress_sync_spec.md](./progress_sync_spec.md) - ② 進捗の自動同期
- [view_switching_spec.md](./view_switching_spec.md) - ③ 2つのビュー切り替え
- [inspector_spec.md](./inspector_spec.md) - ④ Why/How インスペクター
- [i18n_spec.md](./i18n_spec.md) - 多言語対応 (i18n)
- [ai_feature_spec.md](./ai_feature_spec.md) - AIロジック支援機能
- [dependency_spec.md](./dependency_spec.md) - 依存関係管理機能
- [timeline_spec.md](./timeline_spec.md) - 実行フェーズ・期限管理
- [execution_order_spec.md](./execution_order_spec.md) - 実行順序の設定
- [ui_ux_design_spec.md](./ui_ux_design_spec.md) - デザイン・ユーザー体験
- [architecture.md](./architecture.md) - 開発・ディレクトリ構造ルール
- [git_workflow.md](./git_workflow.md) - Git 運用ガイドライン
- [test_checklist.md](./test_checklist.md) - 品質確認チェックリスト

## 6. ロードマップ
1. **MVP**: 基本的なツリー構造の入力とリスト表示、LocalStorage保存。
2. **Phase 2**: グラフィカルなツリー表示 (Tree View) の実装。
3. **Phase 3**: 進捗の自動計算、ドラッグ＆ドロップ機能の追加。
