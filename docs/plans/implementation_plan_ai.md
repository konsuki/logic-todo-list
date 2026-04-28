# 実装計画：AIロジック支援機能 (AI Logic Assistant)

## 1. 概要
DeepSeek API と連携し、ツリーの分解案提示とロジックチェック機能を実装します。

## 2. 影響範囲
- `src/logic/aiApi.js` (新規): API 通信クライアント
- `src/hooks/useAI.js` (新規): リクエスト管理フック
- `src/components/features/inspector/AIInsights.jsx` (新規): AI 提案表示用
- `src/components/features/inspector/Inspector.jsx`: AI パネルの統合
- `src/logic/i18n.js`: AI 関連の翻訳テキスト追加

## 3. 実装ステップ

### ステップ 1: API 通信基盤の構築
1.  **ブランチ作成**: `feature/ai-assistant` を作成。
2.  **API クライアントの実装**: `src/logic/aiApi.js` を作成。
    - `POST /chat` へのリクエスト処理。
    - タイムアウト、エラーハンドリング。
3.  **カスタムフックの実装**: `src/hooks/useAI.js` を作成。
    - `isLoading`, `error`, `data` の状態管理。
    - プロンプト構築ロジック（文脈に応じた指示出し）。

### ステップ 2: AI 提案 UI の実装
1.  **AI パネルの作成**: `src/components/features/inspector/AIInsights.jsx` を作成。
    - 「AIに分解案を聞く」ボタン。
    - 提案された項目のリスト表示とチェックボックス。
    - 「ツリーに追加」アクション。
2.  **インスペクターへの統合**: `Inspector.jsx` に AIInsights を配置。

### ステップ 3: ロジック・レビュー機能
1.  **レビュー用プロンプトの追加**: 現在の階層構造を文字列化してAIに送り、アドバイスを求めるロジックを実装。
2.  **UI 表示**: インスペクター内にアドバイスを表示するエリアを確保。

### ステップ 4: 仕上げ
1.  **多言語対応**: AI 関連のメッセージを `i18n.js` に追加。
2.  **動作確認**: ローカル API サーバーを起動した状態での疎通確認。

## 4. リスク・留意点
- API サーバーが起動していない場合のフォールバック（ユーザーへの通知）。
- 応答時間が長くなる（最大120秒）ため、UX が損なわれないようローディング演出を工夫する。
