# 実装プラン：タスク完了時の Google カレンダー自動書き込み（同期処理）

## 全体方針

- スコープを `calendar.app.created` に変更（専用カレンダー自動作成のため）。
- バックエンドに `POST /api/calendar/sync` を追加（専用カレンダー検索/作成 ＋ events.insert/update）。
- フロントで `toggleStatus`（完了時）に同期処理を連動させ、`node.calendarEventId` に eventId を保存。
- 重複防止：eventId があれば update、無ければ insert。

---

## 大まかな手順

### 手順 1. バックエンドにカレンダー同期モジュールを実装する

- `google_calendar.py`（新規）: Calendar API の REST 呼び出し（専用カレンダー検索・作成、イベント作成・更新）。
- `main.py` に `POST /api/calendar/sync` を追加。

### 手順 2. スコープを calendar.app.created に変更する

- フロント `googleCalendarApi.js` の `GOOGLE_SCOPE` を変更。
- （手動操作）GCC の OAuth 同意画面にスコープ追加 → 再認可。

### 手順 3. フロントに同期処理を実装する

- `googleCalendarApi.js` に `syncCalendarEvent()` を追加。
- `useTodoTree` の `toggleStatus`（完了時）で同期処理を呼び出し、eventId を保存。

### 手順 4. 検証（lint / テスト）

- バックエンドの構文チェック・エンドポイント応答確認。
- フロントの lint とテスト。

---

## 詳細手順（以下、1ステップずつ詳細化して報告する）

### 手順 1 の詳細：バックエンドにカレンダー同期モジュールを実装

`deepseek-chat-api/google_calendar.py`（新規）に Calendar API の REST 呼び出しを実装する。標準ライブラリ（`urllib.request`）のみ。

**使用する Calendar API エンドポイント（REST）**
- カレンダー作成: `POST https://www.googleapis.com/calendar/v3/calendars`（body: `{ summary: "実行ログ" }`）→ レスポンスの `id` が calendarId
- イベント作成: `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`
- イベント更新: `PUT https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}`

**専用カレンダーの永続化（calendarList スコープ回避）**
- 作成した calendarId を `calendar_state.json`（deepseek-chat-api 直下）に保存。
- 同期時にファイルから calendarId を読み、無ければ新規作成して保存。
- これにより `calendar.calendarlist` スコープを追加せず、`calendar.app.created` のみで完結。

**実装する関数**
- `_api_request(method, url, token, body)` — Authorization ヘッダ付きで REST を叩く共通関数。401 時はトークンリフレッシュして1回リトライ。
- `get_or_create_log_calendar()` — calendar_state.json から calendarId 取得。無ければ calendars.insert で作成し保存。
- `sync_event(title, description, start_at_ms, completed_at_ms, event_id)` — event_id があれば update、無ければ insert。作成/更新した eventId を返す。
- 日時は RFC 3339（`YYYY-MM-DDTHH:MM:SS+09:00` 等）に変換（ミリ秒 epoch → ISO 8601）。

**main.py への追加**
- `POST /api/calendar/sync` — リクエスト `{ title, description, startAt, completedAt, eventId }` を受け取り `sync_event` を呼び、`{ eventId }` を返す。
- `google_calendar` を import。

### 手順 2 の詳細：スコープを calendar.app.created に変更

**フロント側（Claude Code で実装）**
- `src/features/todo/api/googleCalendarApi.js` の `GOOGLE_SCOPE` を
  `https://www.googleapis.com/auth/calendar.events` → `https://www.googleapis.com/auth/calendar.app.created` に変更。

**手動操作（ユーザー）**
- Google Cloud Console の「OAuth 同意画面」→「スコープ」で `https://www.googleapis.com/auth/calendar.app.created` を追加。
- 既に連携済みのトークンは古いスコープのため、**再認可**が必要（一度連携解除 or 再度「連携する」で同意し直す）。

**補足**
- `calendar.app.created` は「セカンダリカレンダーの作成＋そのイベント操作」が可能な専用スコープ。最小権限の原則に合致。
- スコープ変更後、バックエンドのトークンも再発行（再認可）される。

### 手順 3 の詳細：フロントに同期処理を実装

**`googleCalendarApi.js` に `syncCalendarEvent()` を追加**
- `POST /api/calendar/sync` を呼び、`{ title, description, startAt, completedAt, eventId }` を送る。
- レスポンスの `eventId` を返す。

**`useTodoTree.js` の `handleToggleStatus` を修正**
- DONE に遷移した時、`node.timeTracking` が存在し `startAt`/`completedAt` がある場合に同期処理を呼ぶ。
- 同期処理は非同期（fetch）のため、`setNodes` 内では呼ばず、以下の流れで実装する：
  1. `setNodes` 内で完了打刻（既存どおり）を行い、返り値から「完了後のノード」を取得。
  2. 完了後のノードを使って `syncCalendarEvent()` を `await` で呼ぶ。
  3. 戻ってきた `eventId` を `node.calendarEventId` に保存（`setNodes` で更新）。

**eventId の保存先**
- `node.calendarEventId` フィールドに保存（`timeTracking` とは別のトップレベルフィールド）。

**同期の失敗時の扱い**
- 同期失敗は黙って無視（`console.error` のみ）。タスク完了自体は成功させる。
- 次回完了時に再試行できるよう、`calendarEventId` が無い限り insert を試みる。

**description の組み立て**
- `node.intent` と `node.description` を改行区切りで連結して送る。
- どちらも空なら summary（タイトル）のみ。

### 手順 4 の詳細：検証（lint / テスト）

**バックエンド（deepseek-chat-api）**
- `python -m py_compile google_calendar.py main.py` で構文チェック。
- 一時起動して `GET /oauth/google/status` が応答することを確認。
- `POST /api/calendar/sync` は、連携済みでなければ 401 相当のエラーを返すこと（トークン未連携時の挙動）を確認。

**フロントエンド（logic-todo-list）**
- `nvm use 20` → `npm run lint` が exit 0。
- `npm run test:run` が全件 pass（既存 78 件）。

**手動 E2E（可能なら）**
- スコープ変更後、実際に認可 → タスク完了 → 専用カレンダー「実行ログ」にイベントが作られることを確認。

