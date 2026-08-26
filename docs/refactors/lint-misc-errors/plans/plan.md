# プラン: その他の lint エラー解消（no-useless-escape・no-empty）

## 大まかな手順

1. **`InspectorTextarea.jsx` の `no-useless-escape` 修正**: URL 正規表現の `\[\]` → `[\]`。
   - 対象: `src/components/features/inspector/InspectorTextarea.jsx:8`
   - 現状:
     ```js
     const urlRegex = /((?:https?|obsidian):\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
     ```
   - 修正: 文字クラス内の `\[` のエスケープを外す（`\]` は残す）:
     ```js
     const urlRegex = /((?:https?|obsidian):\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
     ```
   - 根拠: 文字クラス内では `[` はリテラルとして扱われるため、`\[` と `[` は等価。正規表現の意味は不変。
   - 検証: 既存テスト「Inspector description link parsing」（Inspector.test.jsx）が URL パースをカバーする。
2. **`Inspector.jsx` の `no-empty` 修正**: `catch {}` にフォールバック意図のコメントを追加。
   - 対象: `src/components/features/inspector/Inspector.jsx:56`
   - 現状:
     ```js
     } catch {}
     ```
   - 修正:
     ```js
     } catch {
       // localStorage の sectionOrder が壊れていた場合はデフォルト順序へフォールバック
     }
     ```
   - 根拠: ESLint の `no-empty` はコメントを含むブロックを「空」とみなさない。握りつぶしの意図を明示できる。
3. **検証**: `npm run lint` で `no-useless-escape` / `no-empty` が 0 件になったことを確認し、`npm run test:run` で既存テスト 53 件が通ることを確認する。
   - `npm run lint` 実行 → `no-useless-escape` / `no-empty` が 0 件になることを確認。残存は:
     - `react-hooks/set-state-in-effect` 3 件 → 後続
     - `react-hooks/exhaustive-deps` 1 warning → 後続
   - `npm run test:run` 実行 → 既存テスト 53 件が pass することを確認（挙動非変更のため全件 green が期待値）。
