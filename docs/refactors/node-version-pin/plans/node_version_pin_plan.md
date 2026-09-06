# 実装手順（Node のバージョン固定）

## 大まかな手順

1. 作業ブランチ `refactor/node-version-pin` を作成する。
2. `.nvmrc` をプロジェクト直下に追加し `20.19.6` と記載する。
3. `package.json` に `engines` フィールドを追加し `"node": ">=20.19.0"` を宣言する（`version` の直後、`"type": "module"` の前）。
4. Node 20.19.6 で `npm run lint`（exit 0）と `npm run test:run`（全件 pass）を確認する。
5. `docs/REVISIONS.md` に完了エントリを追加し、コミットする。

## 手順の詳細

### 手順 2: `.nvmrc` の追加
- ファイル: `.nvmrc`（プロジェクト直下）
- 内容: `20.19.6`（末尾改行のみ。余計な文字を入れない）

### 手順 3: `package.json` の `engines` 追加
- 追加位置: `"version": "0.0.0",` の直後
- 追加内容:
  ```json
  "engines": {
    "node": ">=20.19.0"
  },
  ```
- 既存の `"type": "module"` はそのまま残す。

### 手順 4: 検証
- `export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"` で Node を切り替えてから実行する。
- `npm run lint` → exit 0
- `npm run test:run` → 全件 pass（現状 60 件）

### 手順 5: 記録とコミット
- `docs/REVISIONS.md` の「完了済み」セクション先頭に `[106] 09-06: [Node のバージョンを v20+ に固定する](refactors/node-version-pin/spec.md)` を追加。
- コミットメッセージは `chore:` または `docs:` プレフィックス（設定ファイル追加のため `chore:` が適切）。
