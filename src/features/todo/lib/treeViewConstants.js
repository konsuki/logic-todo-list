/**
 * TreeView（ビジューツリー表示）の定数。
 *
 * TreeView.jsx に直書きされていた「ハードコードされた文字列・マジックナンバー」を
 * 意味単位で命名した定数として集約したもの。値の意味・単位・由来を名前とコメントで
 * 明示し、変更を一箇所に集約して保守性を上げる。
 *
 * 配置方針は docs/core/architecture.md に従う：
 * - 本定数は todo 機能に閉じた「表示専用」の定数であり、feature 内の lib/ に置く。
 * - ユーザー向け表示文字列は本ファイルには置かず src/lib/i18n.js の翻訳辞書で扱う。
 */

// ---------------------------------------------------------------------------
// レイアウトモード・向き・リンク種別などの識別子
// 値＝キー名の enum パターン（treeLogic.js の NODE_TYPES と同様）
// ---------------------------------------------------------------------------

/** ツリーのレイアウトモード（樹形図 / フロー図）。 */
export const LAYOUT_MODE = {
  TREE: 'tree',
  FLOW: 'flow',
};

/** フローレイアウト時のノードの並ぶ向き。 */
export const FLOW_ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};

/** D3 で描画するリンク（辺）の種別。 */
export const LINK_TYPE = {
  HIERARCHY: 'hierarchy',
  FLOW: 'flow',
};

/** 複数のルートノードを束ねるための仮想ルート ID。 */
export const VIRTUAL_ROOT_ID = 'VIRTUAL_ROOT';

// ---------------------------------------------------------------------------
// 幾何（ジオメトリ）系マジックナンバー（px）
// ---------------------------------------------------------------------------

/** ノード矩形の横幅（px）。 */
export const NODE_WIDTH = 260;

/** ノード矩形の縦幅（px）。 */
export const NODE_HEIGHT = 65;

/**
 * d3.tree().nodeSize() に渡す間隔。
 * 配列の順序は [縦方向間隔, 横方向間隔]（d3.tree は [x, y] = [縦, 横] の順）。
 */
export const TREE_NODE_SIZE = [120, 380];

// フローレイアウトのノード間ステップ幅（baseGap に対する比率）
export const FLOW_HORIZONTAL_STEP_RATIO = 0.2; // nodeWidth + baseGap * 0.2
export const FLOW_VERTICAL_STEP_RATIO = 0.4; // nodeHeight + baseGap * 0.4

// フローレイアウトのエンクロージャ（親ノードの囲み）のパディング
export const ENCLOSURE_PADDING_BOTTOM = 24; // 24 + rank * (hierarchyGap * 0.5)
export const ENCLOSURE_PADDING_RIGHT = 32; // 32 + rank * hierarchyGap
export const HIERARCHY_GAP_BOTTOM_RATIO = 0.5; // 階層ごとの下側余白の倍率
export const HIERARCHY_GAP_TOP_RATIO = 2; // 階層ごとの上側余白の倍率

// エンクロージャ背景の塗り不透明度（0.2 が基本値、階層 rank ごとに 0.05 加算）
export const ENCLOSURE_FILL_OPACITY_BASE = 0.2;
export const ENCLOSURE_FILL_OPACITY_RANK_STEP = 0.05;

// ノード矩形の描画オフセット（<g> 基準からの相対座標）
export const NODE_RECT_OFFSET_X = -10;
export const NODE_RECT_OFFSET_Y = -30;

// ステップ番号ラベル（"Step 1" 等）の描画オフセット
export const NODE_STEP_LABEL_OFFSET_X = -5;
export const NODE_STEP_LABEL_OFFSET_Y = -35;

// ノード種別ラベル（GOAL/STRATEGY 等）の描画オフセット
export const NODE_TYPE_LABEL_DX = 10;
export const NODE_TYPE_LABEL_DY = -10;

// タイトル表示領域（foreignObject）のオフセット・寸法
export const NODE_TITLE_OFFSET_X = 0;
export const NODE_TITLE_OFFSET_Y = -5;
export const NODE_TITLE_WIDTH_PADDING = 20; // width = nodeWidth - 20
export const NODE_TITLE_HEIGHT = 35;

// エンクロージャのラベル（親タイトル）の描画オフセット・文字数上限
export const ENCLOSURE_LABEL_OFFSET_X = 20;
export const ENCLOSURE_LABEL_OFFSET_Y = 25;
export const ENCLOSURE_LABEL_MAX_LENGTH_HORIZONTAL = 50;
export const ENCLOSURE_LABEL_MAX_LENGTH_VERTICAL = 35;

// リンク（辺）の端点をノード矩形から内側へずらす量（px）
export const LINK_ENDPOINT_OFFSET = 10;

// ---------------------------------------------------------------------------
// 進捗表示（0〜100 の百分率）に関する定数
// ---------------------------------------------------------------------------

/** 進捗値の最大値（0〜100 の百分率表現）。 */
export const PROGRESS_MAX = 100;

// 進捗インジケータ（ノード矩形下部のバー）の描画オフセット・寸法
export const PROGRESS_INDICATOR_OFFSET_X = -10;
export const PROGRESS_INDICATOR_OFFSET_Y = 32;
export const PROGRESS_INDICATOR_HEIGHT = 4;
export const PROGRESS_INDICATOR_RX = 2;

// ---------------------------------------------------------------------------
// ズーム・初期ビュー
// ---------------------------------------------------------------------------

/** ズーム倍率の下限。 */
export const MIN_ZOOM = 0.05;

/** ズーム倍率の上限。 */
export const MAX_ZOOM = 4;

/** 初回描画時のズーム倍率。 */
export const INITIAL_ZOOM = 0.8;

/** フロー縦表示時の初期 X 位置のオフセット（width / 2 - 130）。 */
export const FLOW_VERTICAL_INITIAL_X_OFFSET = 130;

/** 初期 X 位置の除数（width / 4）。 */
export const INITIAL_X_DIVISOR = 4;

/** 初期 Y 位置の除数（height / 4）。 */
export const INITIAL_Y_DIVISOR = 4;

// ---------------------------------------------------------------------------
// 設定パネル（フローティング設定）のスライダー設定
// 各項目：default = useState の初期値、min/max/step = <input type="range"> の範囲
// ---------------------------------------------------------------------------

export const SPACING_V = { default: 144, min: 80, max: 400, step: 8 };
export const SPACING_H = { default: 400, min: 200, max: 800, step: 8 };
export const CONTAINER_H_PADDING = { default: 64, min: 16, max: 160, step: 8 };
export const CONTAINER_V_PADDING_TOP = { default: 80, min: 40, max: 200, step: 8 };
export const HIERARCHY_GAP = { default: 16, min: 0, max: 64, step: 8 };

// ---------------------------------------------------------------------------
// D3 セレクタ・CSS クラス名・イベントキー・SVG タグ名
// TreeView.css 側のクラス定義と「文字列で契約」しているため typo 防止のために定数化。
// JSX の静的な className 属性は過剰定数化を避けるため対象外。
// ---------------------------------------------------------------------------

/** D3 の selectAll に渡すセレクタ文字列。 */
export const SELECTOR = {
  ENCLOSURE_GROUP: '.enclosure-group',
  LINK_PATH: 'path.link-path',
  TREE_NODE: '.tree-node',
};

/** D3 で動的に付与・比較する CSS クラス名（TreeView.css と対応）。 */
export const CLASS_NAME = {
  ENCLOSURE_GROUP: 'enclosure-group',
  PARENT_ENCLOSURE: 'parent-enclosure',
  ENCLOSURE_PROGRESS_BORDER: 'enclosure-progress-border',
  ENCLOSURE_LABEL: 'enclosure-label',
  LINK_PATH: 'link-path',
  TREE_LINK: 'tree-link',
  FLOW_LINK: 'flow-link',
  TREE_NODE: 'tree-node',
  IS_SELECTED: 'is-selected',
  IS_HIGHLIGHTED: 'is-highlighted',
  NODE_RECT: 'node-rect',
  NODE_STEP_LABEL: 'node-step-label',
  NODE_PROGRESS_INDICATOR: 'node-progress-indicator',
  NODE_TYPE_LABEL: 'node-type-label',
  NODE_TITLE_FOREIGN_OBJECT: 'node-title-foreign-object',
  NODE_EDIT_INPUT: 'node-edit-input',
  NODE_TITLE_SCROLL_CONTAINER: 'node-title-scroll-container',
};

/** キーボードイベントのキー名（DOM 標準の値）。 */
export const KEY = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
};

/** D3 の append で使う SVG 名前空間付きタグ名。 */
export const SVG_NAMESPACE_TAG = {
  INPUT: 'xhtml:input',
  DIV: 'xhtml:div',
};

// ---------------------------------------------------------------------------
// テーマ CSS 変数のフォールバック値
// これらのフォールバックは「--node-radius / --enclosure-radius を定義していない
// テーマ（classic / premium）」に適用される既定値。github テーマは themes.js 側で
// --node-radius: 6px / --enclosure-radius: 12px を上書きするため、ここは使われない。
// ---------------------------------------------------------------------------

export const THEME_FALLBACK = {
  NODE_RADIUS: 'var(--node-radius, 10px)',
  ENCLOSURE_RADIUS: 'var(--enclosure-radius, 25px)',
};

// ---------------------------------------------------------------------------
// その他
// ---------------------------------------------------------------------------

/** 編集入力へのオートフォーカスを遅延させる時間（ms）。 */
export const EDIT_FOCUS_DELAY_MS = 10;
