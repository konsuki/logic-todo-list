# 設定コンテキストの共有層 lib/ への移動（SettingsContext.jsx → SettingsProvider.jsx にリネーム）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: React Context 系（設定管理）である `settings.js` と `SettingsContext.jsx` が、本来「純粋ドメインロジック」を置くべき `src/logic/` に混在しており、責務分離が崩れている。bulletproof-react の `lib/`（アプリ用に事前設定された再利用可能なライブラリ）へ移し、`SettingsContext.jsx` を内容（Provider 本体）に合わせ `SettingsProvider.jsx` にリネームする。

## 2. 画面やデータの流れ

- 本タスクは実行時の見た目・挙動を変えない（挙動非変更のリファクタリング）。
- 設定値の流れ（`SettingsProvider` → `SettingsContext` → `useSettings` → 各コンポーネント）は不変。
- 変更は「ファイルの物理的な配置場所」と「import パス」のみ。

## 3. 普通ではないケース・境界条件

- **CASE-INSENSITIVE ファイルシステム（最重要）**: この macOS ファイルシステムは大文字小文字を区別しない。リネーム後の `SettingsProvider.jsx` と、同じ `lib/` に置く `settings.js` は、大文字小文字のみの違いではないため衝突しない。既存 lint-react-refresh-settings の知見（「`SettingsContext.jsx` と `settingsContext.js` の衝突回避」）を踏襲し、`git mv` でリネームを安全に追跡する。
- **`SettingsProvider.jsx` 内の内部 import は変更不要**: `import { SettingsContext } from './settings'` は、`settings.js` と `SettingsProvider.jsx` が同じ `lib/` に移動するため、相対パス `./settings` のままで成立する。
- **`index.html` の main.jsx 参照**: `index.html` は `/src/main.jsx` を参照しており、本タスクでは main.jsx 自体を移動しない（app/ 層新設は別タスク）。main.jsx 内の `SettingsProvider` import パスのみ修正する。
- **docs/ 内の古い記述（連鎖修正の範囲）**: 過去の実装計画（`docs/features/*/plans/` など）に `src/logic/SettingsContext.jsx` という旧パスが多数残るが、これらは「過去の実装時点では正しかった記録」であり、書き換えない。連鎖修正の対象は、現在の正（SSOT）である `docs/core/architecture.md` との整合に限定する。

## 4. 優先順位・本当に必要なもの

- **対応する**: 設定コンテキスト2ファイル（`settings.js`, `SettingsContext.jsx`）の移動＋リネーム＋ import パス修正（6ファイル）。
- **対応しない**: i18n.js の移動（別タスク）、app/ 層新設（別タスク）、TypeScript 化（Phase 3）。

## 5. 変更内容のまとめ

### 移動・リネーム

| 移動前 | 移動後 |
|---|---|
| `src/logic/settings.js` | `src/lib/settings.js` |
| `src/logic/SettingsContext.jsx` | `src/lib/SettingsProvider.jsx`（リネーム） |

### import パス修正（6ファイル）

1. `src/main.jsx:5`: `'./logic/SettingsContext'` → `'./lib/SettingsProvider'`
2. `src/components/features/inspector/Inspector.test.jsx:4`: `'../../../logic/SettingsContext'` → `'../../../lib/SettingsProvider'`
3. `src/components/features/settings/SettingsPanel.jsx:3`: `'../../../logic/settings'` → `'../../../lib/settings'`
4. `src/components/features/inspector/Inspector.jsx:6`: `'../../../logic/settings'` → `'../../../lib/settings'`
5. `src/components/features/list/TodoItem.jsx:4`: `'../../../logic/settings'` → `'../../../lib/settings'`
6. `src/components/features/list/ListView.jsx:6`: `'../../../logic/settings'` → `'../../../lib/settings'`

## 6. 完了の定義（DoD）

- `src/logic/settings.js` と `src/logic/SettingsContext.jsx` が `src/lib/` へ移動・リネームされている。
- 上記 6 ファイルの import パスが修正されている。
- `npm run lint` が exit 0、`npm run test:run` が 53 件 pass。
