# 実装計画書：説明・メモ部分のURLパース処理の修正 (description_url_fix)

## 大まかな手順
本機能の修正は、以下の大まかな手順に従って進めます。

1. **URL抽出正規表現の修正**
   - **詳細仕様**: `src/components/features/inspector/Inspector.jsx` 内の `renderDescription` 関数にある `urlRegex` を以下のように書き換えます。
     ```javascript
     const urlRegex = /(https?:\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
     ```
   - **理由**: URLを標準的なASCII文字群に制限し、バックトラッキングにより末尾の `)` や `.` などを適切に除外して、日本語がリンクに巻き込まれるのを防ぎます。
   - **余分な空白の除去**: JSX 内の `{part} <ExternalLink ... />` に含まれていた不要な半角スペースを排除し、`{part}<ExternalLink ... />` に書き換えて、リンクテキスト内の不要な余白を完全に排除します。


2. **単体テストによる動作検証**
   - **詳細仕様**: `src/components/features/inspector/Inspector.test.jsx` を新規作成し、以下のテストケースを定義します。
     - **テスト環境**: React Testing Library と Vitest を使用して `Inspector` コンポーネントをマウントします。
     - **検証ケース**:
       - 1. カッコで囲まれた URL: `(https://example.com/foo)` -> リンク先が `https://example.com/foo` となり、前後にカッコ文字が分離されていること。
       - 2. 日本語が後続する URL: `申込サイト(https://example.com/bosyu)にアクセスする。` -> リンク先が `https://example.com/bosyu` となり、`)にアクセスする。` がプレーンテキストであること。
       - 3. 文末ピリオド: `Go to https://example.com.` -> リンク先が `https://example.com` であり、末尾の `.` がプレーンテキストであること。
       - 4. クエリパラメータ付き URL: `https://example.com/search?q=test&page=1` -> リンク先がクエリパラメータ全体を含むこと。

3. **テスト実行と最終確認**
   - **詳細仕様**:
     - `npm run test:run` コマンドを実行して、作成した `Inspector.test.jsx` を含むすべてのテストスイートを動作させます。
     - すべてのテストケース（既存・新規含む）が成功（グリーン）で終了することを確認します。これにより、URL パースバグの解消とデグレーションがないことを客観的に確定します。
