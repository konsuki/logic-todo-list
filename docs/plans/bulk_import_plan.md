# 実装プラン：タスクツリーの一括インポート機能 (R13)

## 大まかな手順

1. **インポート用ロジックの実装**: `src/logic/importLogic.js` を作成し、JSONとMarkdownのパーサーを実装する。
    - **Markdownパーサー**:
        - 各行のインデント（スペース/タブ）の数を数える。
        - プレフィックス（`[GOAL]` 等）があれば抽出し、なければ深さと子供の有無で自動判別するロジック。
        - スタックを使用して、インデントの深さに応じて親子関係を構築する。
    - **JSONパーサー**:
        - 再帰的に `children` を辿り、正規化された構造に変換する。
    - **統合エントリーポイント**: 文字列を受け取り、形式を判別して統一された中間形式（Nested Object）を返す関数を作成。
2. **既存ロジックとの統合**: `src/logic/treeLogic.js` にインポートされたデータを既存のノード群に結合する機能を追加する。
    - `importTreeToNodes(existingNodes, importedData)` 関数を実装。
    - 中間形式（Nested Object）を再帰的に走査し、`crypto.randomUUID()` でIDを発行しながら、`addNode` 的なロジックで `existingNodes` を更新する。
    - インポートされたツリーはルートレベル（`parentId: null`）として追加する。
3. **UIコンポーネントの作成**: `src/components/features/import/ImportModal.jsx` を作成する。
    - `framer-motion` を使用して、ふわっと表示されるモーダルを作成。
    - 大きなテキストエリアを配置。
    - バリデーションエラーがあれば赤字で表示するエリア。
    - 「Import」ボタンと「Cancel」ボタン。
4. **アプリ本体への組み込み**: `App.jsx` または `SettingsPanel.jsx` からインポートモーダルを開けるようにし、インポート処理を紐付ける。
    - `SettingsPanel.jsx` に「一括インポート」ボタンを追加。
    - `App.jsx` にインポートモーダルの開閉状態を管理するステートを追加。
    - インポート成功時に `addNodes` (一括追加用新関数) を呼び出し、ステートを更新する。
5. **i18n の更新**: インポート機能に関する翻訳テキストを追加する。
    - `ja.settings.bulk_import`, `en.settings.bulk_import` 等。
    - モーダル内のタイトル、説明文、プレースホルダー。

---
*※ 以降のターンで各手順を詳細化します。*
