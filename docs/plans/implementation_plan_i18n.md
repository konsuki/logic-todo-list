# 実装計画：多言語対応 (i18n)

## 1. 概要
アプリケーション内の全ての静的テキストを多言語化し、日本語と英語を切り替えられるようにします。

## 2. 影響範囲
- `src/logic/i18n.js` (新規): 翻訳辞書
- `src/hooks/useI18n.js` (新規): 言語管理フック
- `src/App.jsx`: 言語スイッチャーの追加、コンテキスト提供
- `src/components/features/list/ListView.jsx`: テキスト置換
- `src/components/features/list/TodoItem.jsx`: テキスト置換
- `src/components/features/inspector/Inspector.jsx`: テキスト置換
- `src/components/features/tree/TreeView.jsx`: テキスト置換

## 3. 実装ステップ

### ステップ 1: 基盤の実装
1.  **ブランチ作成**: `feature/i18n-support` を作成。
2.  **翻訳リソースの作成**: `src/logic/i18n.js` を作成し、JA/EN の辞書を定義。
3.  **i18n フックの作成**: `src/hooks/useI18n.js` を作成。
    - 現在の言語状態管理。
    - `t(key)` 関数の提供。
    - 言語切り替え機能。

### ステップ 2: UI の多言語化
1.  **App.jsx の更新**:
    - 言語スイッチャー（JA/EN）をヘッダーに追加。
    - スタイルの調整。
2.  **ListView / TodoItem の更新**:
    - "New Goal", "Enter task name", "MECE Warning" 等のテキストを `t()` に置換。
3.  **Inspector の更新**:
    - "Why?", "How?", "Progress", "Delete" 等のテキストを `t()` に置換。
4.  **TreeView の更新**:
    - ヘルプテキスト等を `t()` に置換。

### ステップ 3: 仕上げ
1.  **動作確認**: 言語を切り替えて全ての箇所の表示が変わるか確認。
2.  **永続化テスト**: リロードしても設定が保持されるか確認。

## 4. リスク・留意点
- プレースホルダー（`prompt` で表示されるテキストなど）の翻訳漏れに注意。
- 言語切り替え時にレイアウトが崩れないか（英語の方が長くなる傾向があるため）の確認。
