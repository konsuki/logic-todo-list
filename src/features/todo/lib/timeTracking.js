/**
 * LogiDo Tree Logic — タスク消化時間の計測
 * 「開始・一時停止・再開・完了」のタイムスタンプ記録と実行時間の計算を担う。
 *
 * すべて純粋関数（副作用なし、引数で完結）とし、
 * useTodoTree の setNodes 内で安全に使えるようにする。
 *
 * データ構造（node.timeTracking）:
 *   {
 *     startAt: null | number,    // 開始時刻 (epoch ms)
 *     pauses: Array<{start: number, end: number|null}>,  // 中断区間（end null = 中断中）
 *     completedAt: null | number // 完了時刻 (epoch ms)
 *   }
 */

/** 空の timeTracking を返す。ノードにフィールドが無い場合の初期値。 */
export const createEmptyTimeTracking = () => ({
  startAt: null,
  pauses: [],
  completedAt: null,
});

/** node.timeTracking を安全に取り出す（無ければ空を生成）。 */
export const getTimeTracking = (node) => node?.timeTracking || createEmptyTimeTracking();

/**
 * 開始時刻をセットする。既に開始済みなら何もしない（冪等）。
 */
export const startTimeTracking = (node, now) => {
  const tt = getTimeTracking(node);
  if (tt.startAt != null) return node;
  return {
    ...node,
    timeTracking: { ...tt, startAt: now },
  };
};

/**
 * 一時停止する。pauses に { start: now, end: null } を追加する。
 * 未開始・既に中断中の場合は何もしない（冪等）。
 */
export const pauseTimeTracking = (node, now) => {
  const tt = getTimeTracking(node);
  if (tt.startAt == null || tt.completedAt != null) return node;

  const last = tt.pauses[tt.pauses.length - 1];
  if (last && last.end == null) return node; // 既に中断中

  return {
    ...node,
    timeTracking: { ...tt, pauses: [...tt.pauses, { start: now, end: null }] },
  };
};

/**
 * 再開する。最後の中断区間（end: null）に end をセットする。
 * 中断中でなければ何もしない（冪等）。
 */
export const resumeTimeTracking = (node, now) => {
  const tt = getTimeTracking(node);
  if (tt.startAt == null || tt.completedAt != null) return node;

  const pauses = [...tt.pauses];
  const last = pauses[pauses.length - 1];
  if (!last || last.end != null) return node; // 中断中でない

  pauses[pauses.length - 1] = { ...last, end: now };
  return {
    ...node,
    timeTracking: { ...tt, pauses },
  };
};

/**
 * 完了時刻をセットする。中断中の区間があれば完了時刻で閉じる。
 * 既に完了済みなら上書きしない（冪等）。
 */
export const completeTimeTracking = (node, now) => {
  const tt = getTimeTracking(node);
  if (tt.completedAt != null) return node;

  // 中断中の区間を完了時刻で閉じる
  const pauses = tt.pauses.map((p) => (p.end == null ? { ...p, end: now } : p));

  return {
    ...node,
    timeTracking: { ...tt, pauses, completedAt: now },
  };
};

/**
 * 実行時間（ミリ秒）を計算する。
 * 開始〜現在（または完了）から、中断区間（確定分）を差し引く。
 *
 * @param {Object} timeTracking
 * @param {number} now - 現在時刻。完了済みなら completedAt を優先。
 * @returns {number} 実行時間（ms）。開始していなければ 0。
 */
export const getElapsedMs = (timeTracking, now) => {
  const tt = timeTracking || createEmptyTimeTracking();
  if (tt.startAt == null) return 0;

  const end = tt.completedAt != null ? tt.completedAt : now;

  let pausedMs = 0;
  for (const p of tt.pauses) {
    if (p.end != null) {
      pausedMs += p.end - p.start;
    }
  }

  return Math.max(0, end - tt.startAt - pausedMs);
};

/**
 * ミリ秒を「1h 23m 45s」形式に整形する（表示用）。
 */
export const formatDuration = (ms) => {
  if (ms == null || ms <= 0) return '0s';

  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};
