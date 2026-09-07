# 実装プラン：Google カレンダー連携（OAuth 認証）

## 全体方針

- **手動操作（あなた）と Claude Code の操作を明確に区別**して記す。
- 手動操作ステップは「何を・どの画面で・何を控えるか」まで具体化し、後から追跡できるようにする。
- トークン交換は `client_secret` が必要なため、既存 FastAPI バックエンド（`/api` → localhost:8000）で行う。

---

## 大まかな手順（Phase 0）

### 【あなたの操作】ステップ A. Google Cloud で OAuth クライアントを発行する（1回のみ）

> ここが唯一の手動操作。詳細は後述の「詳細手順 A」でクリックレベルまで記載。

1. Google Cloud プロジェクトを用意（既存 or 新規）。
2. OAuth 同意画面を設定（アプリ名・テストユーザー登録）。
3. OAuth クライアント ID を発行（種別「ウェブアプリケーション」、承認済みリダイレクト URI に `http://localhost:5173` を設定）。
4. 発行された `client_id` と `client_secret` を控え、私（Claude Code）に渡す。

### 【Claude Code】ステップ B. 資格情報を環境変数に設定する

- バックエンド（`deepseek-chat-api`）に `.env`（または同等）を用意し、`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` を設定。
- `.gitignore` に `.env` を追加して、シークレットを Git にコミットしない。

### 【Claude Code】ステップ C. バックエンドにトークン交換エンドポイントを実装する

- `POST /oauth/google/token`：認可コード + code_verifier を受け取り、Google token エンドポイントで access_token / refresh_token を交換。
- refresh_token をサーバ側で安全に保存。
- `POST /oauth/google/refresh`：refresh_token で access_token を再取得（自動更新）。

### 【Claude Code】ステップ D. フロントエンドに認可フローを実装する

- GIS ライブラリを読み込み、認可リクエスト（PKCE の code_challenge 生成含む）を開始する「Google 連携」ボタン。
- リダイレクトで返る認可コードを捕捉し、ステップ C のエンドポイントへ送る。

### 【Claude Code】ステップ E. 連携状態の表示と動作確認

- 連携成功時に「連携済み」状態を表示。
- 手動テストで認可 → トークン交換まで一通り動くことを確認。

---

## 詳細手順（Phase 1〜。以下、1ステップずつ詳細化して報告する）

### 詳細手順 A（あなたの操作）: Google Cloud Console での OAuth クライアント発行

1. https://console.cloud.google.com/ にアクセスし、Google アカウントでログイン。
2. プロジェクトを新規作成（例: `bizyu-todo-calendar`）。既存のプロジェクトを使うならスキップ。
3. 左メニュー「API とサービス」→「OAuth 同意画面」。
   - ユーザータイプ: 「外部」を選択。
   - アプリ名: 任意（例: `ビジュー Todo アプリ`）。
   - ユーザーサポートメール・開発者の連絡先: 自分のメールを設定。
   - スコープ: ここでは何も追加しなくて OK（スコープはコード側で指定）。
   - 「テストユーザー」に**自分の Google アカウントのメールアドレス**を追加（外部公開しない場合、これが必須）。
4. 左メニュー「認証情報」→「認証情報を作成」→「OAuth クライアント ID を作成」。
   - アプリケーションの種類: **「ウェブアプリケーション」**。
   - 名前: 任意（例: `bizyu web client`）。
   - 「承認済みのリダイレクト URI」に `http://localhost:5173` を追加（**完全一致**であること。末尾スラッシュやポートのズレに注意）。
   - 「承認済みの JavaScript 生成元」に `http://localhost:5173` を追加。
5. 作成後、表示される「クライアント ID」と「クライアント シークレット」を控える。
   - **シークレットは公開しない**（Git に含めない）。
6. 控えた2つの値を Claude Code（私）に渡す。

### 詳細手順 B: 環境変数への設定

- バックエンド `deepseek-chat-api` に `.env` を作成し、以下を記載：
  ```
  GOOGLE_CLIENT_ID=xxx
  GOOGLE_CLIENT_SECRET=xxx
  GOOGLE_REDIRECT_URI=http://localhost:5173
  ```
- `.gitignore` に `.env` を追記（既にあれば確認）。

### 詳細手順 C: バックエンドにトークン交換エンドポイントを実装する

- 新規ファイル `google_oauth.py` を作成。標準ライブラリ（`urllib.request`）のみで Google token エンドポイントへ POST する。
  - `exchange_code(code, code_verifier)` … 認可コード → access_token / refresh_token
  - `refresh_access_token()` … refresh_token で再取得
  - `TokenStore` … 単一ユーザー前提でサーバメモリに保持
- `main.py` に `.env` 読み込み（`_load_dotenv`）を追加し、`google_oauth` を import。
- `main.py` にエンドポイントを追加：
  - `POST /oauth/google/token`
  - `POST /oauth/google/refresh`
  - `GET /oauth/google/status`
- **状態**: 実装済み（構文チェック OK）。

### 詳細手順 D: フロントエンドに認可フローを実装する

- `src/features/todo/api/googleCalendarApi.js` を新規作成：
  - PKCE の `code_verifier` 生成（`crypto.getRandomValues` + `crypto.subtle`）
  - `code_challenge`（S256）導出
  - `startGoogleAuth()` … 認可リクエスト開始（`access_type=offline` + `prompt=consent` で refresh_token 取得）
  - `extractAuthCode()` … リダイレクトから code 取得
  - `exchangeCode(code)` … バックエンドへ code + code_verifier を送る
  - `getGoogleAuthStatus()` … 連携状態取得
- `src/features/todo/hooks/useGoogleAuth.js` を新規作成：
  - マウント時にリダイレクトの認可コードを拾い、トークン交換
  - `connected` / `loading` / `error` の状態を管理
- **残作業**: 設定パネル（SettingsPanel.jsx）に「Google 連携」ボタンと連携状態表示を追加する。

### 詳細手順 E: 連携状態の表示と動作確認

- SettingsPanel に「Google 連携」セクションを追加：
  - 未連携: 「連携する」ボタン（`startGoogleAuth` を呼ぶ）
  - 連携済み: 「連携済み」表示
  - エラー時: メッセージ表示
- 手動テストで「認可 → リダイレクト → トークン交換 → 連携済み表示」を確認。
- **状態**: 未着手。

