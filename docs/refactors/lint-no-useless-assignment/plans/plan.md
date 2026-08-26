# プラン: no-useless-assignment の解消

## 大まかな手順

1. **`useShortcuts.js` の `nextIndex` 修正**: `let nextIndex = 0;` → `let nextIndex;` に変更。
   - 対象: `src/hooks/useShortcuts.js:48`。
   - 現状コード:
     ```js
     let nextIndex = 0;

     if (e.key === 'ArrowUp') {
       nextIndex = currentIndex <= 0 ? visibleNodes.length - 1 : currentIndex - 1;
     } else {
       nextIndex = currentIndex >= visibleNodes.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1;
     }
     ```
   - 修正: `let nextIndex = 0;` → `let nextIndex;`（初期化子 `= 0` を削除）。
   - 根拠: if/else の両分岐で必ず代入されるため、初期値 `0` は参照されない（no-useless-assignment の指摘どおり）。
2. **`TodoItem.jsx` の `siblings` 修正**: `let siblings = [];` → `let siblings;` に変更。
   - 対象: `src/components/features/list/TodoItem.jsx:72`。
   - 現状コード:
     ```js
     let siblings = [];
     if (parent) {
       siblings = parent.children.map(id => allNodes[id]).filter(Boolean);
     } else {
       siblings = Object.values(allNodes).filter(n => !n.parentId);
     }
     ```
   - 修正: `let siblings = [];` → `let siblings;`（初期化子 `= []` を削除）。
   - 根拠: if/else の両分岐で必ず代入されるため、初期値 `[]` は参照されない。
3. **検証**: `npm run lint` で `no-useless-assignment` が 0 件になったことを確認し、`npm run test:run` で既存テスト 53 件が通ることを確認する。
   - `npm run lint` 実行 → `no-useless-assignment` が 0 件になることを確認。残存は:
     - `react-refresh/only-export-components` 1 件（SettingsContext.jsx）→ 手順4
     - `no-useless-escape` 1 件、`no-empty` 1 件、`react-hooks/set-state-in-effect` 3 件、`exhaustive-deps` 1 warning → 後続
   - `npm run test:run` 実行 → 既存テスト 53 件が pass することを確認（挙動非変更のため全件 green が期待値）。
   - 期待する結果: lint は exit 1 のまま（未解消エラーが残る）だが、`no-useless-assignment` が 0 件に減る。
