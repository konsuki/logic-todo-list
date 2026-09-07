# Google カレンダー連携（OAuth 認証）実装 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **誰のため**: この Todo アプリ（ビジュー）のユーザー本人（開発者自身、および就活ポートフォリオを見る評価者）。
- **困りごと**: Todo アプリで記録した「タスクの実行時間帯（いつからいつまで何をやったか）」を、Google カレンダーに**手作業で転記する手間**。これを自動で同期したい。
- **本タスクの範囲**: その自動同期の**前提となる「Google アカウント連携（OAuth 認証）」を実装する**。カレンダーへの書き込み（同期処理）自体は後続タスク。

## 2. 画面やデータの流れ

### 前提となる選定（上位タスクで確定済み）

- 連携 API: **Google Calendar API v3（Events）** … 帯表示（時間帯）を実現するため。
- 認証方式: **OAuth 2.0 Authorization Code flow + PKCE**（Google Identity Services）。
- スコープ: `https://www.googleapis.com/auth/calendar.events`（最小権限）。

### データの流れ（トークン交換はバックエンド経由）

Google OAuth は「Web アプリケーション」クライアントでは、PKCE を使っていても `client_secret` がトークン交換に必須（Google 特有の挙動。RFC 7636 と異なる）。`client_secret` はブラウザに置けないため、トークン交換は既存バックエンド（FastAPI, `/api` → localhost:8000）で行う。

```
[ブラウザ]                                 [バックエンド FastAPI]        [Google]
   |  1. 認可リクエスト（client_id, redirect_uri, scope, code_challenge）----->
   |                                                                    [同意画面]
   |  <-- 2. 認可コード（redirect_uri に ?code=...）
   |  3. POST /api/oauth/google/token  { code, code_verifier }
   |        --------------------------------------------->
   |                                                     [token エンドポイント]
   |                                                    code → access_token / refresh_token
   |  <-- 4. { access_token } を返す（refresh_token はサーバに保存）
   |  5. POST /api/oauth/google/events  { access_token はサーバ管理 }
   |        --------------------------------------------->
   |                                                       [Calendar API events.insert]
```

### UI の流れ

1. ユーザーが「Google 連携」ボタンを押す → 認可リクエスト開始。
2. Google の同意画面で承認。
3. リダイレクトで戻り、認可コードをバックエンドに送ってトークン交換。
4. 成功したら「連携済み」表示。以降は自動同期が可能になる。

## 3. 「普通ではないケース」と境界条件

- 認可をユーザーが拒否した場合 → エラーを表示し、連携状態にしない。
- トークン交換失敗（認可コード期限切れ等）→ 再認可を促す。
- アクセストークン期限切れ → サーバ側で refresh_token を使って自動更新。
- refresh_token も失効 → 再認可フローへ。
- 認可済みリダイレクト URI の不一致 → Google 側でエラー。設定値と完全一致させる必要。
- 同一 Google アカウントの多重連携 → 既存レコードを上書き（単一ユーザー前提）。

## 4. 優先順位（本タスクでどこまでやるか）

| 優先度 | 項目 | 本タスクでの扱い |
|--------|------|------------------|
| 必須 | OAuth クライアント発行（GCC 手動操作） | 手動ステップとしてプラン化 |
| 必須 | 認可コード取得 UI（フロント） | 実装 |
| 必須 | トークン交換（バックエンド） | 実装 |
| 必須 | access_token / refresh_token の保存 | 実装 |
| 必須 | refresh_token による自動更新 | 実装 |
| 後回し | カレンダーへのイベント書き込み（同期処理） | **次タスク**（本タスクではスコープ外） |
| 後回し | 連携解除・アカウント切替 | 可能なら後続 |

## 5. 手動操作（Google Cloud Console）が必要な範囲

以下は `gcloud` CLI が未導入のため、**ユーザーの手動操作が必須**。詳細なクリック手順はプランに記載する。

1. Google Cloud プロジェクトの作成（または既存利用）。
2. OAuth 同意画面の設定（アプリ名、テストユーザー登録）。
3. OAuth クライアント ID の発行（「ウェブアプリケーション」、承認済みリダイレクト URI に `http://localhost:5173` を設定）。

発行された `client_id` と `client_secret` をバックエンドの環境変数（`.env`）に設定すれば、以降は Claude Code 上で完結する。
