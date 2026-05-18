# 実装プラン: 旧AI機能（タスク分解・ロジックテスト）の削除

このプランは、アプリケーションから不要になった旧AI機能（タスク分解・ロジックテスト）を削除するためのものです。

## 大まかな手順

1. **AIInsights.jsx からの不要機能の削除**
   - `suggestions`, `selectedSuggestions`, `audit` の状態（行9-11付近）を削除します。
   - `handleRequestBreakdown`, `handleRequestAudit`, `handleAddSelected`, `toggleSuggestion` の関数（行13-51付近）を削除します。
   - レンダー内の「タスク分解」ボタン（行56-64）と「ロジックテスト」ボタン（行77-86）を削除します。
   - レンダー内の suggestions リスト表示（行100-122）と audit 結果表示（行124-132）を削除します。

2. **useAI.js からの不要関数の削除**
   - `src/hooks/useAI.js` から `getBreakdownSuggestions` 関数を削除します。
   - `src/hooks/useAI.js` から `getLogicAudit` 関数を削除します。
   - `useAI` フックの返り値から、これら2つの関数を削除します。

3. **動作確認**
   - インスペクターの AI 連携セクション（AIInsights）を開きます。
   - 「演繹的タスク分解」ボタンのみが表示され、他の2つのボタンが消えていることを確認します。
   - 「演繹的タスク分解」を実行し、正常に動作することを確認します。
