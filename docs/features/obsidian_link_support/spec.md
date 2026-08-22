# 仕様書：obsidian:// スキームのリンクをクリック可能にする (obsidian_link_support)

## 1. 背景と課題
インスペクター（`InspectorTextarea.jsx`）では、ノードの `description` や `intent` に含まれる URL を検出し、自動的に `<a>` リンクタグへ変換する `renderText` 関数が実装されています。

この検出で使用している正規表現は `https?://` で始まる URL のみを対象としていたため、Obsidian ノートへのディープリンク（`obsidian://open?vault=...&file=...`）がリンクとして認識されず、プレーンテキスト表示になってクリックできないという問題がありました。

## 2. 責務分担の前提
タスクの成果物（調査結果・情報の本文）は Obsidian 側に置き、ビジュ側（本アプリ）の `description` 欄は「成果物に効率的にたどり着く手段（簡潔な説明＋リンク）」を提供する役割を担います。

このため、`description` 欄に Obsidian ノートへのリンクを貼るケースが想定され、`obsidian://` スキームのリンクをクリック可能にすることが必要になりました。

## 3. 変更内容

### 3.1 正規表現の変更 (`InspectorTextarea.jsx`)
URL スキームとして `http` / `https` に加えて `obsidian` を許容するよう、正規表現を拡張します。

- **修正前**:
  ```javascript
  const urlRegex = /(https?:\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
  ```

- **修正後**:
  ```javascript
  const urlRegex = /((?:https?|obsidian):\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
  ```

### 3.2 正規表現の動作メカニズム
1. 非キャプチャグループ `(?:https?|obsidian)` により、`http://`、`https://`、`obsidian://` のいずれかをスキームとして認識します。
2. その後に、一般的な URL 許容文字 `[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*` を貪欲にマッチさせます。
3. 最後に、URL の末尾として安全な文字種 `[a-zA-Z0-9_~/#%?&=-]`（カッコやピリオド、カンマ、セミコロンを含まない）が1文字マッチすることを要求します。
4. これにより、末尾に `)` や `.` があった場合にそれらを URL から除外する既存の挙動を維持したまま、`obsidian://` スキームもリンク化できます。

## 4. 境界条件・検証ケース
- **ケース A: obsidian:// スキーム**:
  - 入力: `[Obsidian で開く](obsidian://open?vault=...&file=...)`
  - 期待値: `obsidian://open?vault=...&file=...` 全体がクリック可能なリンクとなる。
- **ケース B（回帰確認）: https:// スキーム**:
  - 入力: `https://example.com/search?q=test&page=1`
  - 期待値: `https://example.com/search?q=test&page=1` 全体がリンクとなる（既存挙動を維持）。

## 5. 関連ファイル
- `src/components/features/inspector/InspectorTextarea.jsx`（実装）
- `src/components/features/inspector/Inspector.test.jsx`（テスト）
