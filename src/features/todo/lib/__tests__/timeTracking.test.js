import { describe, it, expect } from 'vitest';
import * as timeTracking from '../timeTracking';

const makeNode = (tt) => ({ id: 'n1', timeTracking: tt });

describe('timeTracking.getElapsedMs', () => {
  it('開始していなければ 0 を返す', () => {
    const tt = timeTracking.createEmptyTimeTracking();
    expect(timeTracking.getElapsedMs(tt, 1000)).toBe(0);
  });

  it('開始 → 完了（中断なし）の実行時間を計算する', () => {
    const tt = { startAt: 0, pauses: [], completedAt: 10000 };
    expect(timeTracking.getElapsedMs(tt, 20000)).toBe(10000);
  });

  it('中断区間を差し引いて計算する', () => {
    // 0〜10000 実行、そのうち 3000〜5000 を中断
    const tt = {
      startAt: 0,
      pauses: [{ start: 3000, end: 5000 }],
      completedAt: 10000,
    };
    expect(timeTracking.getElapsedMs(tt, 20000)).toBe(8000);
  });

  it('複数回の中断をすべて合算して差し引く', () => {
    const tt = {
      startAt: 0,
      pauses: [
        { start: 1000, end: 2000 },
        { start: 4000, end: 6000 },
      ],
      completedAt: 10000,
    };
    // 中断合計 = 1000 + 2000 = 3000 → 実行 7000
    expect(timeTracking.getElapsedMs(tt, 20000)).toBe(7000);
  });

  it('中断したまま完了した場合、その区間を completedAt で閉じて計算する', () => {
    const node = makeNode({ startAt: 0, pauses: [{ start: 3000, end: null }], completedAt: null });
    const completed = timeTracking.completeTimeTracking(node, 10000);
    // 0〜10000 のうち 3000〜10000 を中断 → 実行 3000
    expect(timeTracking.getElapsedMs(completed.timeTracking, 20000)).toBe(3000);
  });
});

describe('timeTracking.startTimeTracking', () => {
  it('startAt をセットする', () => {
    const node = makeNode(null);
    const result = timeTracking.startTimeTracking(node, 5000);
    expect(result.timeTracking.startAt).toBe(5000);
  });

  it('既に開始済みなら冪等（startAt が変わらない）', () => {
    const node = makeNode({ startAt: 1000, pauses: [], completedAt: null });
    const result = timeTracking.startTimeTracking(node, 9000);
    expect(result.timeTracking.startAt).toBe(1000);
  });
});

describe('timeTracking.pauseTimeTracking', () => {
  it('中断区間を追加する', () => {
    const node = makeNode({ startAt: 0, pauses: [], completedAt: null });
    const result = timeTracking.pauseTimeTracking(node, 3000);
    expect(result.timeTracking.pauses).toEqual([{ start: 3000, end: null }]);
  });

  it('未開始なら何もしない', () => {
    const node = makeNode(null);
    const result = timeTracking.pauseTimeTracking(node, 3000);
    expect(result.timeTracking).toBeNull();
  });

  it('既に中断中なら何もしない（冪等）', () => {
    const node = makeNode({ startAt: 0, pauses: [{ start: 3000, end: null }], completedAt: null });
    const result = timeTracking.pauseTimeTracking(node, 5000);
    expect(result.timeTracking.pauses).toEqual([{ start: 3000, end: null }]);
  });
});

describe('timeTracking.resumeTimeTracking', () => {
  it('最後の中断区間の end をセットする', () => {
    const node = makeNode({ startAt: 0, pauses: [{ start: 3000, end: null }], completedAt: null });
    const result = timeTracking.resumeTimeTracking(node, 5000);
    expect(result.timeTracking.pauses).toEqual([{ start: 3000, end: 5000 }]);
  });

  it('中断中でなければ何もしない（冪等）', () => {
    const node = makeNode({ startAt: 0, pauses: [], completedAt: null });
    const result = timeTracking.resumeTimeTracking(node, 5000);
    expect(result.timeTracking.pauses).toEqual([]);
  });
});

describe('timeTracking.completeTimeTracking', () => {
  it('completedAt をセットする', () => {
    const node = makeNode({ startAt: 0, pauses: [], completedAt: null });
    const result = timeTracking.completeTimeTracking(node, 10000);
    expect(result.timeTracking.completedAt).toBe(10000);
  });

  it('既に完了済みなら上書きしない（冪等）', () => {
    const node = makeNode({ startAt: 0, pauses: [], completedAt: 8000 });
    const result = timeTracking.completeTimeTracking(node, 10000);
    expect(result.timeTracking.completedAt).toBe(8000);
  });
});

describe('timeTracking.formatDuration', () => {
  it('0 以下は "0s"', () => {
    expect(timeTracking.formatDuration(0)).toBe('0s');
    expect(timeTracking.formatDuration(-5)).toBe('0s');
  });

  it('秒のみ', () => {
    expect(timeTracking.formatDuration(45000)).toBe('45s');
  });

  it('分と秒', () => {
    expect(timeTracking.formatDuration(83000)).toBe('1m 23s');
  });

  it('時・分・秒', () => {
    expect(timeTracking.formatDuration(5025000)).toBe('1h 23m 45s');
  });
});
