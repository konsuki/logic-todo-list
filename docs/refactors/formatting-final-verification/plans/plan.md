# プラン: 整形と最終検証を行う

## 大まかな手順

1. `prettier` と `eslint-config-prettier` を導入し、`.prettierrc` / `.prettierignore` を作成する。
2. `eslint.config.js` に `eslintConfigPrettier` を追加し、`package.json` に `format` スクリプトを追加する。
3. `npx prettier --write .` で全対象ファイルを整形する。
4. 軽微な可読性改善（インライン style → CSS、日本語タイトル i18n 化、連続空行除去）を行う。
5. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
6. `architecture.md` との整合確認と、連鎖修正、コミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（Prettier 導入と設定ファイル作成）

**やること**

1. devDependencies に以下を追加する（最新バージョン）:
   - `prettier`（3.9.6）
   - `eslint-config-prettier`（10.1.8）
   - インストールコマンド: `npm install --save-dev prettier@^3.9.6 eslint-config-prettier@^10.1.8`

2. `.prettierrc` を作成し、既存スタイルに合わせて明示する:

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 120
}
```

**各設定の意図**:

- `singleQuote: true` — 既存コードがシングルクォート（`import ... from 'react'`）のため。
- `semi: true` — 既存コードがセミコロン有りのため。
- `tabWidth: 2` / `useTabs: false` — 既存コードが 2 スペースインデントのため。
- `trailingComma: "es5"` — 既存コードが配列・オブジェクト末尾カンマを使っているため（`GROUP_COLOR_PALETTE` 等）。
- `printWidth: 120` — 既存コードの行幅に合わせ、過度な折り返しを避ける。

3. `.prettierignore` を作成する:

```
node_modules
dist
package-lock.json
```

**変更しないもの**

- 既存の ESLint 設定・ルールはこの手順では変更しない（手順 2 で `eslintConfigPrettier` を追加）。

**この手順単体での検証**

- `npx prettier --version` で導入を確認する。
- この時点ではまだ整形しない（手順 3 で実施）。

---

## 手順 3 の詳細（prettier --write で全ファイル整形）

**やること**

1. `npx prettier --write .` を実行し、全対象ファイル（`src/` と `docs/` の md）を整形する。
   - `.prettierignore` により `node_modules` / `dist` / `package-lock.json` は除外される。

2. 整形後に `git diff --stat` で変更範囲を確認する。

**変更しないもの**

- 整形はコードの見た目（空白・改行・引用符）のみ。ロジック・値は不変。

**注意**

- 整形後の差分が大きい（全ファイルに及ぶ）が、これは「Prettier 導入」という目的に沿った意図的な変更である。
- 整形後に `npm run lint` が通るかは手順 5 で確認する（eslintConfigPrettier で競合を防いでいるはず）。

**この手順単体での検証**

- `git diff --stat` で、想定外のファイル（node_modules 等）が整形されていないことを確認する。

---

## 手順 4 の詳細（軽微な可読性改善 3 件）

**やること**

1. **インライン style → CSS（2 箇所）**: `Inspector.jsx` の 209 行・211 行の flex レイアウトを、`Inspector.css` の新しいクラスへ移す。
   - 209 行: `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>` → `className="inspector-header-top"`
   - 211 行: `<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>` → `className="inspector-header-actions"`
   - `Inspector.css` に以下を追加:
     ```css
     .inspector-header-top {
       display: flex;
       justify-content: space-between;
       align-items: flex-start;
     }
     .inspector-header-actions {
       display: flex;
       align-items: center;
       gap: 4px;
     }
     ```
   - 進捗バーの `width`（280 行）は動的なため対象外。

2. **日本語タイトル i18n 化（1 箇所）**: `Inspector.jsx` の `title="セクションを並び替え"` → `title={t('inspector.reorder_sections')}`。
   - `i18n.js` の `inspector` セクションにキーを追加（ja: `セクションを並び替え` / en: `Reorder sections`）。

3. **連続空行除去（1 箇所）**: `useAI.js` の 26-28 行の連続空行 3 行 → 1 行に。

**変更しないもの**

- 見た目・動作は一切変えない（CSS クラス化・i18n 化は同一見た目の範囲）。

**この手順単体での検証**

- 見た目の回帰が無いことを確認（手順 5 の test/build で担保）。

---

## 手順 5 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 6 の詳細（整合確認・連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（整合確認）**

1. `docs/core/architecture.md` §2 に、前段の分割タスクで導入したファイル（treeConstants 等）が反映済みかを確認する。不足があれば追記する。
2. `docs/` 全体を `Prettier` / `eslint-config-prettier` 等で grep し、矛盾する古い記述が無いか確認する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`chore:` または `style:` プレフィックス。Prettier 導入は設定変更なので `chore:`、整形は `style:`。まとめて `style:` が適切）。
2. コミットメッセージ例: `style: Prettier を導入し全ファイルを整形`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「整形と最終検証を行う」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/formatting-final-verification`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。

**やること**

1. `eslint.config.js` の先頭に import を追加する:

```js
import eslintConfigPrettier from 'eslint-config-prettier/flat';
```

2. `defineConfig([...])` の配列の**最後**に `eslintConfigPrettier` を追加する:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  eslintConfigPrettier, // 必ず最後に置く（Prettier と衝突するスタイル系ルールを無効化）
]);
```

**意図**: `eslintConfigPrettier` を最後に置くことで、ESLint のスタイル系ルール（インデント・引用符・セミコロン等）が Prettier と衝突しないよう無効化する。ESLint はコード品質（未使用変数・フック規則）だけに専念する。

3. `package.json` の `scripts` に `format` を追加する:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "format": "prettier --write .",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run"
}
```

**変更しないもの**

- 既存の ESLint ルール（`no-unused-vars` 等）はそのまま。

**この手順単体での検証**

- `npm run lint` が exit 0 のままであることを確認する（eslintConfigPrettier 追加で既存ルールが壊れていないこと）。
- この時点ではまだ整形しない（手順 3 で実施）。
