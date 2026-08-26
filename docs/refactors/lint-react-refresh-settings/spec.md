# react-refresh/only-export-components 対応（SettingsContext.jsx の分離）

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `npm run lint` で `react-refresh/only-export-components` エラーが出る。`SettingsContext.jsx` が React コンポーネント（`SettingsProvider`）と非コンポーネント（`useSettings` フック）を同一ファイルで export しており、Fast Refresh（HMR）が正しく機能しない。

## 2. 画面やデータの流れ

- 本タスクは UI 変更・データフロー変更を伴わない純粋な構造整理（リファクタリング）。
- `SettingsProvider`（コンポーネント）と `useSettings`（フック）を別ファイルに分離する。
- 実行時の挙動・Provider/Consumer の関係は一切変わらない。

## 3. 普通ではないケース・境界条件

- **ファイル名の衝突（最重要）**: この macOS ファイルシステムは大文字小文字を区別しない（`CASE-INSENSITIVE`）。既存の `SettingsContext.jsx` と大文字小文字のみ異なるファイル名（例: `settingsContext.js`）を同じディレクトリに置くと衝突・混乱の恐れがある。→ **`settings.js` という別名**を採用して回避する。
- **export の責務分離**: `react-refresh/only-export-components` は「コンポーネントのみを export するファイル」を要求する。したがって:
  - `SettingsContext.jsx` → `SettingsProvider`（コンポーネント）のみを export。
  - `settings.js` → `SettingsContext`（createContext オブジェクト）と `useSettings`（フック）を export。
- **`SettingsContext` オブジェクトの共有**: `SettingsProvider` は `SettingsContext.Provider` を使うため、`SettingsContext` を `settings.js` から import する必要がある（循環参照は発生しない。`settings.js` は React の `createContext`/`useContext` のみ依存し、`SettingsProvider` には依存しない）。
- **テストファイルへの影響**: `Inspector.test.jsx` は `SettingsProvider` のみ import しており、import 元は `SettingsContext.jsx` のまま変更不要。`useSettings` を使う 4 ファイル（SettingsPanel, Inspector, TodoItem, ListView）の import 元を `settings.js` に変更する。

## 4. 優先順位・本当に必要なもの

- **対応する**: `react-refresh/only-export-components` 1 件。
- **方針（案B・ユーザー合意済み）**: 一時的な修正の楽さより責務分離を徹底する。`useSettings` の import 元を 4 ファイルとも `settings.js` に変更する（re-export はしない）。
- **対応しない**: 残りの lint エラー（no-useless-escape・no-empty・set-state-in-effect・exhaustive-deps）は後続タスク。

## 5. 変更内容のまとめ

1. `src/logic/settings.js` を新規作成し、`SettingsContext`（createContext）と `useSettings` フックを移動。
2. `src/logic/SettingsContext.jsx` は `SettingsProvider`（コンポーネント）のみを export し、`SettingsContext` を `settings.js` から import。
3. `useSettings` の import 元を 4 ファイル（SettingsPanel.jsx, Inspector.jsx, TodoItem.jsx, ListView.jsx）で `settings.js` に変更。
4. `SettingsProvider` の import 元（main.jsx, Inspector.test.jsx）は `SettingsContext.jsx` のまま維持。
