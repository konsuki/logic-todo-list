# 実装プラン：タスク消化時間計測機能

## 全体方針

- タイムスタンプはノードに `timeTracking` フィールドを追加して保存。
- 計算ロジックは純粋関数として `features/todo/lib/` に分離（テスト可能にする）。
- 完了タイムスタンプは既存の完了操作（`toggleStatus`）と連動。
- 改善点エリアは今回スコープ外。

---

## 大まかな手順

### 手順 1. 純粋ロジック（timeTracking）を実装する

- `features/todo/lib/timeTracking.js` を新規作成。
- 開始・一時停止・再開・完了の各操作が `timeTracking` をどう変化させるか、実行時間をどう計算するかを純粋関数で実装。

### 手順 2. 純粋ロジックのユニットテストを追加する

- `timeTracking.js` のテストを作成し、境界条件（開始なし・複数中断・中断中の完了等）を検証。

### 手順 3. useTodoTree に計測操作を追加する

- `startTimeTracking` / `pauseTimeTracking` / `resumeTimeTracking` をフックに追加。
- `toggleStatus`（完了時）に `completedAt` 打刻を連動させる。

### 手順 4. インスペクターに計測エリア UI を追加する

- 新しい `TimeTrackingSection.jsx` を作成。
- 開始・一時停止・再開ボタンと、経過時間・合計実行時間の表示。
- `Inspector.jsx` のセクション順序に `timeTracking` を追加。

### 手順 5. i18n キーを追加し、lint / テストで検証する

- 計測エリアに使う文言を日英両方に追加。
- `npm run lint` と `npm run test:run` で検証。

---

## 詳細手順（以下、1ステップずつ詳細化して報告する）

### 手順 1 の詳細：timeTracking.js の設計（純粋関数）

`src/features/todo/lib/timeTracking.js` に以下の純粋関数を実装する。既存の `treeProgress.js` と同じスタイル（JSDoc + `export const`）。

**データ構造（`node.timeTracking`）**
```js
{
  startAt: null | number,    // 開始時刻 (epoch ms)
  pauses: Array<{start: number, end: number|null}>,  // 中断区間（end null = 中断中）
  completedAt: null | number // 完了時刻 (epoch ms)
}
```

**実装する関数**
- `startTimeTracking(node, now)` — `startAt` をセット。既に開始済みなら何もしない（冪等）。
- `pauseTimeTracking(node, now)` — `pauses` に `{start: now, end: null}` を追加。未開始・既に中断中なら何もしない。
- `resumeTimeTracking(node, now)` — 最後の `end: null` の pause に `end: now` をセット。
- `completeTimeTracking(node, now)` — `completedAt` をセット。中断中ならその区間を閉じる。既に完了済みなら上書きしない。
- `getElapsedMs(timeTracking, now)` — 実行時間を計算。開始〜現在（or 完了）から中断区間を差し引く。
- `formatDuration(ms)` — ms を `1h 23m 45s` 形式に整形（表示用）。

**設計のポイント**
- 冪等性（同じ操作を繰り返しても壊れない）。
- 中断中の完了：中断中区間があれば `end = completedAt` で閉じる。
- 純粋関数（副作用なし、引数で完結）。

### 手順 2 の詳細：ユニットテスト

`src/features/todo/lib/__tests__/timeTracking.test.js` を作成し、既存 `treeLogic.test.js` と同じ Vitest スタイルで書く。

**テストする境界条件**
- 開始 → 完了（中断なし）: 実行時間 = 完了 − 開始
- 開始 → 一時停止 → 再開 → 完了: 実行時間 = (完了−開始) − 中断区間
- 複数回の中断: 全中断区間を合算して差し引く
- 開始せずに完了: `startAt` は null のまま、実行時間 0
- 中断したまま完了: 中断区間を `completedAt` で閉じて計算
- 開始済みで再度開始: 冪等（startAt 変わらず）
- 未開始で一時停止: 冪等（何も起きない）
- 完了済みで再度完了: completedAt 上書きしない

### 手順 3 の詳細：useTodoTree への計測操作追加

`src/features/todo/hooks/useTodoTree.js` に計測操作用のコールバックを追加する。

**追加する3つのコールバック**
- `handleStartTimeTracking(nodeId)` — `setNodes` 内で `startTimeTracking(prev[nodeId], Date.now())` を適用し、`updatedAt` を更新。
- `handlePauseTimeTracking(nodeId)` — 同様に `pauseTimeTracking` を適用。
- `handleResumeTimeTracking(nodeId)` — 同様に `resumeTimeTracking` を適用。

既存の `handleUpdateNode` と同じパターン（`setNodes` 内で対象ノードを書き換え）で実装する。

**`handleToggleStatus` の修正（完了打刻の連動）**
- DONE にした時だけ `completeTimeTracking(next[nodeId], Date.now())` を適用する。
- TODO に戻す時は打刻しない。

**公開**
- 戻り値に `startTimeTracking` / `pauseTimeTracking` / `resumeTimeTracking` を追加。

### 手順 4 の詳細：インスペクターに計測エリア UI を追加

`src/features/todo/components/inspector/TimeTrackingSection.jsx` を新規作成する。既存 `ScheduleSection.jsx` と同じ構造（`<section className="inspector-section">` ＋ `<h3 className="section-title">` ＋ lucide アイコン）に合わせる。

**props**
- `node`（計測データと状態を参照）
- `startTimeTracking` / `pauseTimeTracking` / `resumeTimeTracking`（useTodoTree から）
- `t`（i18n）

**表示パターン（node.timeTracking の状態に応じて分岐）**
- 未開始（`startAt == null`）: 「開始」ボタンのみ。
- 計測中（`startAt` あり、`completedAt` なし、中断中でない）: 「一時停止」ボタン ＋ 現在の経過時間（`getElapsedMs` をライブ表示）。
- 一時停止中（最後の pause が `end: null`）: 「再開」ボタン ＋ 経過時間。
- 完了後（`completedAt` あり）: 合計実行時間（`formatDuration` で `1h 23m 45s` 形式）。

**Inspector.jsx への組み込み**
- `DEFAULT_SECTION_ORDER` の `schedule` の後ろ、`dependency` の前に `timeTracking` を追加。
- `sectionMap` に `timeTracking` のエントリを追加（`SortableSection` でラップ）。

**経過時間のライブ更新**
- 計測中・一時停止中は `setInterval`（1秒ごと）で再レンダリングし、経過時間を更新。
- コンポーネントのアンマウント時に `clearInterval`。

### 手順 5 の詳細：i18n キー追加と lint / テスト検証

`src/lib/i18n.js` の `inspector` セクション（ja と en 両方）に、計測関連キーを追加する。

**追加するキー（inspector 配下）**
- `time_tracking`: セクションタイトル（ja: 計測, en: Time Tracking）
- `start_tracking`: 開始（ja: 開始, en: Start）
- `pause_tracking`: 一時停止（ja: 一時停止, en: Pause）
- `resume_tracking`: 再開（ja: 再開, en: Resume）
- `tracking_in_progress`: 計測中（ja: 計測中, en: In progress）
- `tracking_paused`: 一時停止中（ja: 一時停止中, en: Paused）
- `elapsed_time`: 経過時間（ja: 経過時間, en: Elapsed Time）
- `total_time`: 実行時間（ja: 実行時間, en: Total Time）

**検証**
- `nvm use 20` してから `npm run lint` が exit 0 になること。
- `npm run test:run` が全件 pass（既存 60 件 ＋ 追加分）すること。

