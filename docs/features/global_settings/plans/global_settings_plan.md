# 実装プラン：グローバル設定UIと説明表示切り替え

## 1. 現状分析
- 現在、`description` のプレビュー表示は `TodoItem`（リストビュー内）等で固定的に実装されている。
- アプリ全体の設定を保持する仕組み（Context等）がまだ存在しないため、新規導入が必要。

## 2. 修正・追加内容

### 2.1 状態管理の導入
- `src/logic/SettingsContext.jsx` を作成。
- `showDescriptionInList` (boolean) などのフラグを管理する。
- `localStorage` と同期し、永続化を行う。

### 2.2 設定UIコンポーネントの作成
- `src/components/features/settings/SettingsPanel.jsx` を作成。
- グラスモフィズムを用いたリッチなサイドバーまたはモーダルとして実装。
- `showDescriptionInList` を切り替えるトグルスイッチを配置。

### 2.3 リストビューへの反映
- `src/components/features/list/TodoItem.jsx`（または該当コンポーネント）で `SettingsContext` を参照。
- フラグが `false` の場合、`description` プレビューを非表示にする。

### 2.4 エントリポイントの更新
- `App.jsx` を `SettingsProvider` でラップする。
- メイン画面のどこか（ヘッダー等）に設定パネルを開くボタンを追加。

## 3. 実装手順

1. [ ] **State**: `SettingsContext` の作成と `localStorage` 同期の実装。
2. [ ] **Provider**: `App.jsx` への `SettingsProvider` の組み込み。
3. [ ] **UI**: `SettingsPanel` コンポーネントの作成（デザイン重視）。
4. [ ] **Trigger**: 設定パネルを開くためのボタンをUIに追加。
5. [ ] **List Integration**: `TodoItem` での設定参照と条件付きレンダリング。

## 4. 懸念点・確認事項
- 設定パネルの表示形式（サイドバー、モーダル、ドロップダウン）について、既存のUIバランスを考慮して決定する。今回は操作性の高いサイドバー（またはフローティングパネル）を想定。
