# no-useless-assignment の解消（useShortcuts.js の nextIndex、TodoItem.jsx の siblings）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `npm run lint` で報告される `no-useless-assignment` 2 件。`let` 変数に代入した初期化子が直後の if/else で必ず上書きされるため、初期値が無意味でコードの意図が読み取りにくい。

## 2. 画面やデータの流れ

- 本タスクは UI 変更・データフロー変更を伴わない純粋なコード整理（リファクタリング）。
- 対象は `let` 宣言の初期化子削除のみ。実行時の挙動は一切変わらない。

## 3. 普通ではないケース・境界条件

- **代入経路の網羅性**: 両方とも `if` / `else` の両分岐で必ず代入されるため、`undefined` のまま参照されることはない。
  - `useShortcuts.js`: `if (ArrowUp) { ... } else { ... }` の両分岐で `nextIndex` に代入。
  - `TodoItem.jsx`: `if (parent) { ... } else { ... }` の両分岐で `siblings` に代入。
- **最小変更の方針**: 三項演算子による `const` 化も可能だが、既存コードの可読性・差分の最小化を優先し、初期化子の削除のみ行う。

## 4. 優先順位・本当に必要なもの

- **対応する（2 件）**: `no-useless-assignment` 由来の 2 件。
  - `src/hooks/useShortcuts.js:48` の `let nextIndex = 0;` → `let nextIndex;`
  - `src/components/features/list/TodoItem.jsx:72` の `let siblings = [];` → `let siblings;`
- **対応しない（後続タスク）**: no-useless-escape（1件）、no-empty（1件）、react-hooks/set-state-in-effect（3件）、react-hooks/exhaustive-deps（1 warning）、react-refresh/only-export-components（手順4で対応）。

## 5. 方針（ユーザー合意済み）

- `no-useless-assignment` 2 件のみに対応し、`let` 宣言の初期化子を削除する。
- 挙動は非変更（初期化子が常に上書きされることを確認済み）。
