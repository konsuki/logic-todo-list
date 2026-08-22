# 実装手順書：obsidian:// スキームのリンクをクリック可能にする (obsidian_link_support)

## 大まかな手順
本修正は、以下の大まかな手順に従って進めます。

1. **URL 抽出正規表現の修正**
   - **詳細仕様**: `src/components/features/inspector/InspectorTextarea.jsx` 内の `renderText` 関数にある `urlRegex` を以下のように書き換えます。
     ```javascript
     const urlRegex = /((?:https?|obsidian):\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
     ```
   - **理由**: 既存の URL 許容文字の範囲と末尾安全文字の仕組みを維持したまま、スキーム部分を `https?` から `(?:https?|obsidian)` に拡張し、`obsidian://` リンクもクリック可能にします。既存の `http` / `https` のリンク化挙動はそのまま維持されます。

2. **単体テストの追加**
   - **詳細仕様**: `src/components/features/inspector/Inspector.test.jsx` に、obsidian:// スキームのリンクが `<a class="description-link">` として描画されることを検証するテストケースを追加します。
     - **テスト環境**: React Testing Library と Vitest を使用して `Inspector` コンポーネントをマウントします。
     - **検証ケース**:
       - `obsidian://open?vault=...&file=...` を含む description が、`href` がその URL と一致するリンク要素を生成すること。

3. **テスト実行と最終確認**
   - **詳細仕様**:
     - `npx vitest run src/components/features/inspector/Inspector.test.jsx` を実行して、追加したテストを含む全テストケースが成功（グリーン）することを確認します。
     - 既存の `https://` リンクのパーステストが引き続き成功すること（回帰がないこと）もあわせて確認します。

## 注意点
- 正規表現の末尾安全文字の仕組み（カッコや句読点を除外する）は変更しないこと。これにより、`obsidian://` リンクが `)` や `.` で終わる場合でも正しくリンク化されます。
