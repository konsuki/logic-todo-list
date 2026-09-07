# タスク完了時の Google カレンダー自動書き込み（同期処理）仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **誰のため**: Todo アプリ（ビジュー）のユーザー本人。
- **困りごと**: タスクを完了しても、その実行時間帯（いつからいつまで何をやったか）は Todo アプリ内にしか無く、Google カレンダーへ**手作業で転記する手間**が発生する。
- **本タスクの価値**: タスク完了をトリガーに、計測した実行時間帯を専用カレンダーへ**自動で書き込む**。手動転記を不要にする。

## 2. データの流れ

### 2-1. 前提（上位タスクで確定済み）

- 連携 API: Google Calendar API v3（Events）。
- 「予定ではない」という当初の意図は、**実行実績専用カレンダー「実行ログ」**への書き込みで代替する。
- 実行時間帯は、前タスク「タスク消化時間計測機能」の `node.timeTracking`（startAt → completedAt）を利用する。

### 2-2. 書き込みフロー

```
タスク完了（toggleStatus で DONE）
  → node.timeTracking（startAt / pauses / completedAt）を取得
  → バックエンド POST /api/calendar/sync
      { taskId, title, description, startAt, completedAt, eventId? }
  → バックエンド:
      1. 専用カレンダー「実行ログ」を検索 → 無ければ自動作成（calendarId をメモリ保持）
      2. eventId があれば events.update、無ければ events.insert
      3. 作成した eventId をレスポンスで返す
  → フロント: node.calendarEventId に eventId を保存
```

### 2-3. イベント内容

- `summary`: タスク名
- `description`: 詳細意図（intent）＋ 説明・メモ（description）を連結
- `start.dateTime` / `end.dateTime`: `timeTracking.startAt` / `completedAt`

## 3. 境界条件・例外ケース

- 計測していないタスク（`startAt` なし）→ 書き込みスキップ（完了してもカレンダーへ送らない）。
- 連携していない（トークンなし）→ 黙ってスキップ（エラー表示はしない）。
- 専用カレンダーが既にある → 再利用（2つ目を作らない）。
- 同じタスクを再完了（DONE→TODO→DONE）→ `eventId` があれば update し、二重作成しない。
- `completedAt` と `startAt` が同時刻（実行時間 0）→ 最小イベント（1分）として扱うか、スキップ。
- タスクを TODO に戻した場合 → 書き込み済みイベントは**削除しない**（今回スコープ外）。

## 4. 優先順位

| 優先度 | 項目 | 本タスクでの扱い |
|--------|------|------------------|
| 必須 | スコープを `calendar.app.created` に変更（フロント＋GCC 同意画面） | 実装 |
| 必須 | バックエンド `POST /api/calendar/sync`（専用カレンダー作成＋イベント作成/更新） | 実装 |
| 必須 | フロントで完了時に同期処理を呼び出し、eventId を保存 | 実装 |
| 必須 | 重複防止（eventId による update） | 実装 |
| 次回 | 完了取り消し時のイベント削除 | スコープ外 |

## 5. スコープ外（今回やらない）

- 完了取り消し（DONE→TODO）時のイベント削除。
- 手動同期ボタン（完了時のみ自動）。
- カレンダー書き込みのUIフィードバック（トースト等）。

## 6. 必要な手動操作（GCC）

スコープを `calendar.events` から `calendar.app.created` に変更するため、以下が必要：

1. Google Cloud Console の「OAuth 同意画面」で、スコープ `https://www.googleapis.com/auth/calendar.app.created` を追加。
2. フロント側の認可リクエスト（`googleCalendarApi.js` の `GOOGLE_SCOPE`）を同スコープに変更。
3. 既に連携済みのトークンは古いスコープのため、再認可（一度連携解除して再連携）が必要になる可能性が高い。
