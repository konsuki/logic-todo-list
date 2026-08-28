/**
 * LogiDo Tree Logic — 定数
 * ツリーデータのノード種別・ステータス・グループ配色を定義する。
 * 他の tree* モジュールの最下層（依存なし）。
 */

export const NODE_TYPES = {
  GOAL: 'GOAL',
  STRATEGY: 'STRATEGY',
  ACTION: 'ACTION',
  FOLDER: 'FOLDER'
};

export const NODE_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
};

/**
 * Color palette for auto-assigning group colors.
 */
export const GROUP_COLOR_PALETTE = [
  '#4F8CFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'
];

/**
 * 実行フェーズ（Phase）。
 * ALL はフェーズフィルタの「全件」を表す特殊値で、UI の選択肢として
 * PREP/EXEC/REVIEW と同じグループを構成するため、同じ定数に含める。
 */
export const PHASES = {
  PREP: 'PREP',
  EXEC: 'EXEC',
  REVIEW: 'REVIEW',
  ALL: 'ALL',
};

/**
 * リスト表示の表示モード（ListView.jsx の displayMode）。
 */
export const DISPLAY_MODE = {
  LOGIC: 'logic',
  FOLDER: 'folder',
};
