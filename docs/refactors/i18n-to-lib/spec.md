# i18n.js（翻訳データ）の共有層 lib/ への移動

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: 翻訳データである `i18n.js` が、本来「純粋ドメインロジック」を置くべき `src/logic/` に混在しており、責務分離が崩れている。bulletproof-react の共有層 `lib/`（アプリ用に事前設定された再利用可能なライブラリ）へ移す。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- 翻訳データの流れ（`i18n.js`（translations）→ `useI18n.js`（t 関数）→ 各コンポーネント）は不変。
- 変更は「ファイルの物理的な配置場所」と「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **i18n.js は独立モジュール**: `translations` のみを export し、`useI18n.js` からのみ参照される。相互参照はないため単独で安全に移動できる。
- **`useI18n.js` 自体は移動しない**: useI18n.js の移動は別タスク（「features/todo/hooks/ へ移動（＋ useI18n は共有 hooks/ へ）」）の範囲。本タスクでは useI18n.js 内の import パスのみ修正する。
- **docs の連鎖修正（Cascading Update Protocol）**: `docs/features/i18n/spec.md` の `3.1 翻訳リソース (src/logic/i18n.js)` という記述は、移動後に古くなるため `src/lib/i18n.js` へ更新する。一方、過去の `docs/features/*/plans/` に多数残る `src/logic/i18n.js` は「過去の実装時点では正しかった記録」のため書き換えない。

## 4. 優先順位・本当に必要なもの

- **対応する**: i18n.js の移動＋ useI18n.js の import パス修正（1ファイル）＋ `docs/features/i18n/spec.md` の連鎖修正。
- **対応しない**: useI18n.js の移動（別タスク）、app/ 層新設（別タスク）、翻訳内容の変更。

## 5. 変更内容のまとめ

### 移動

| 移動前 | 移動後 |
|---|---|
| `src/logic/i18n.js` | `src/lib/i18n.js` |

### import パス修正（1ファイル）

1. `src/hooks/useI18n.js:2`: `'../logic/i18n'` → `'../lib/i18n'`

### docs 連鎖修正（1ファイル）

2. `docs/features/i18n/spec.md:24`: `src/logic/i18n.js` → `src/lib/i18n.js`

## 6. 完了の定義（DoD）

- `src/logic/i18n.js` が `src/lib/` へ移動されている。
- `src/hooks/useI18n.js` の import パスが修正されている。
- `docs/features/i18n/spec.md` の翻訳リソースパスが更新されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
