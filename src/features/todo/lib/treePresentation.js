/**
 * LogiDo Tree Logic — 表示補助（プレゼンテーション）
 * 進捗色・期日状態など、表示に閉じた純粋関数を集約する。
 *
 * リスト表示（ArboristNode）・インスペクター（Inspector）・ツリー表示（TreeView）で
 * 同じ判定が重複していたため、1 箇所に集約して DRY 原則を適用する。
 *
 * 配置方針は docs/core/architecture.md に従う：
 * - todo 機能に閉じた「表示専用」の純粋関数であり、feature 内の lib/ に置く。
 * - barrel file を作らず、呼び出し元から直接 import する。
 */

import { PROGRESS_MAX, DUE_SOON_THRESHOLD_MS } from './treeViewConstants.js';

/**
 * 進捗値に応じた色を返す。100% なら成功色、それ以外は主要色。
 */
export const getProgressColor = (progress) =>
  progress === PROGRESS_MAX ? 'var(--success-color)' : 'var(--primary-color)';

/**
 * 期日（dueDate）の状態を判定する。
 * @param {Date|null} dueDate 期日（未設定なら null）
 * @param {boolean} isDone 完了済みか
 * @param {Date} today 当日 0 時（呼び出し元で正規化済み）
 * @returns {{ overdue: boolean, dueSoon: boolean }}
 */
export const getDueStatus = (dueDate, isDone, today) => {
  const overdue = Boolean(dueDate && dueDate < today && !isDone);
  const dueSoon = Boolean(
    dueDate && !overdue && !isDone && dueDate.getTime() - today.getTime() <= DUE_SOON_THRESHOLD_MS,
  );
  return { overdue, dueSoon };
};
