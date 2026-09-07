# カレンダー予定の二重作成バグ修正 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **誰のため**: カレンダーを見返すユーザー本人。
- **困りごと**: タスク完了時に、Google カレンダーへ「全く同じ予定」が2つ同時に作成されてしまい、実行実績の記録として紛らわしい。
- **本タスクの価値**: 予定が必ず1つだけ作成されるようにする。

## 2. 原因とデータの流れ

### 原因（特定済み）

React の `StrictMode`（開発モード）が `setNodes` の updater 関数を2回実行する。その updater 関数の中に副作用（`syncCalendarEvent` の fetch）が書かれているため、同期処理が2回呼ばれてイベントが重複作成される。

- 該当箇所: `useTodoTree.js` の `handleToggleStatus` 内。
- `StrictMode` は `src/app/main.jsx` で有効。
- 2回目の呼び出し時点で `calendarEventId` が未保存のため、両方 `events.insert`（新規作成）になる。

### 修正方針（確定：方式A = useEffect 監視）

副作用（`syncCalendarEvent`）を updater 関数の外に出す。

- `handleToggleStatus` は「状態更新のみ」にし、副作用を除去する。
- `useTodoTree` 内に `useEffect` を追加し、「DONE かつ `timeTracking` があり、`calendarEventId` が未設定」のノードを検出して同期する。
- 同期が完了したら `calendarEventId` を保存する（これが二重同期防止のマーカーにもなる）。

## 3. 境界条件・例外ケース

- **StrictMode の effect 二重実行**: 開発モードでは `useEffect` も2回実行されるため、`calendarEventId` が「同期済みマーカー」として機能し、二重同期を防ぐ必要がある。
  - ただし、effect 内で同期を開始してから `calendarEventId` が保存されるまでに時間差があるため、**in-flight（同期中）ガード**を追加して、同一ノードの同期が並行して走らないようにする。
- 計測していないタスク（`timeTracking.startAt` なし）→ 同期対象外。
- 連携していない → 同期せず、`calendarEventId` も保存しない（再試行はしない）。
- TODO に戻したタスク → `calendarEventId` を保持（再完了時に update する）。同期対象にはしない（DONE のみ対象）。

## 4. 優先順位

| 優先度 | 項目 | 扱い |
|--------|------|------|
| 必須 | 副作用を updater 関数から除去 | 実装 |
| 必須 | useEffect で DONE ノードを監視して同期 | 実装 |
| 必須 | 二重同期防止（calendarEventId マーカー + in-flight ガード） | 実装 |

## 5. スコープ外

- 既に重複作成されてしまった既存イベントのクリーンアップ。
- 手動同期ボタン。
- 完了取り消し時のイベント削除。
