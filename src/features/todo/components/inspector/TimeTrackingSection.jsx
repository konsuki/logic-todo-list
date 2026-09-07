import { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { getTimeTracking, getElapsedMs, formatDuration } from '../../lib/timeTracking';

/**
 * タスク消化時間の計測エリア。
 * 「開始 → 一時停止 → 再開」の操作と、経過時間・実行時間の表示を担う。
 * 完了タイムスタンプは useTodoTree の toggleStatus 側で打刻されるため、
 * ここでは計測中の操作のみ扱う。
 */
const TimeTrackingSection = ({ node, startTimeTracking, pauseTimeTracking, resumeTimeTracking, t }) => {
  const tt = getTimeTracking(node);
  const [now, setNow] = useState(() => Date.now());

  const isStarted = tt.startAt != null;
  const isCompleted = tt.completedAt != null;
  const isPaused = isStarted && !isCompleted && tt.pauses.some((p) => p.end == null);

  // 計測中・一時停止中は 1 秒ごとに経過時間を更新する
  useEffect(() => {
    if (!isStarted || isCompleted) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isStarted, isCompleted]);

  const elapsedMs = isCompleted ? getElapsedMs(tt, tt.completedAt) : getElapsedMs(tt, now);

  const renderControls = () => {
    if (isCompleted) {
      return (
        <div className="time-tracking-completed">
          <CheckCircle2 size={16} color="var(--success-color, #34C759)" />
          <span className="time-tracking-total">{formatDuration(elapsedMs)}</span>
        </div>
      );
    }

    if (!isStarted) {
      return (
        <button className="time-tracking-btn start" onClick={() => startTimeTracking(node.id)}>
          <Play size={14} /> {t('inspector.start_tracking')}
        </button>
      );
    }

    if (isPaused) {
      return (
        <div className="time-tracking-row">
          <button className="time-tracking-btn resume" onClick={() => resumeTimeTracking(node.id)}>
            <RotateCcw size={14} /> {t('inspector.resume_tracking')}
          </button>
          <span className="time-tracking-elapsed">{formatDuration(elapsedMs)}</span>
        </div>
      );
    }

    return (
      <div className="time-tracking-row">
        <button className="time-tracking-btn pause" onClick={() => pauseTimeTracking(node.id)}>
          <Pause size={14} /> {t('inspector.pause_tracking')}
        </button>
        <span className="time-tracking-elapsed">{formatDuration(elapsedMs)}</span>
      </div>
    );
  };

  return (
    <section className="inspector-section">
      <h3 className="section-title">
        <Timer size={14} /> {t('inspector.time_tracking')}
      </h3>
      <div className="time-tracking-controls">{renderControls()}</div>
    </section>
  );
};

export default TimeTrackingSection;
