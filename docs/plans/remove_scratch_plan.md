# 実験用ディレクトリの削除プラン

## 目的
不要となったテーマ実装用のプレビュー実験環境ディレクトリ（`scratch/`）をプロジェクトから完全に削除し、リポジトリを整理する。

## 大まかな手順

### Step 1: scratchディレクトリの削除
- 以下のコマンドを実行して、Git管理下から削除しつつ物理ファイルも削除する。
  ```bash
  git rm -r scratch/
  ```

### Step 2: 完了処理とコミット
- `docs/REVISIONS.md` のタスクを「未完了」から「完了済み」セクションへ移動する。
- 以下のコマンドを実行して変更をコミットする。
  ```bash
  git add .
  git commit -m "chore: remove temporary scratch directory"
  ```
