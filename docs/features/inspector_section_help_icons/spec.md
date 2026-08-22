# インスペクター項目の説明アイコン（ヘルプツールチップ） 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **対象者**: ビジューでタスクを管理するユーザー。
- **困りごと**: 「実行手順」と「実行順序 (ステップ)」は名前が似ており、どちらに何を書けば／設定すればいいのか区別がつきにくい。
  - **実行手順（procedure）**: そのタスクを「どういう順番で実行するのか」という、純粋な実行手順の詳細を自由記述する場所。
  - **実行順序 (ステップ)（order）**: 親タスク直下の子タスクに位置するこのタスクにおいて、他の兄弟タスクがある中で「どの順番に実行される予定なのか」を意味する設定。
- **解決策**: 両項目の名前の右隣に説明アイコン（ℹ）を配置し、**ホバーすると**その設定項目の意味を説明するカスタムツールチップを表示する。

## 2. 画面・データの流れ

### 共通の仕組み
- lucide-react の `Info` アイコン（既に `Inspector.jsx` で import 済み）を使用。
- 共通 CSS クラス `.help-icon` と `data-tooltip` 属性でツールチップを実装（HTML の title 属性は使わない）。
- ツールチップは `::after`（吹き出し本体）と `::before`（矢印）で CSS 描画し、`:hover` / `:focus-visible` で表示。

### 「実行手順」セクション
- `InspectorTextarea` コンポーネントに任意 prop `helpText` を追加。
- `helpText` が指定された場合のみ、ラベル（`<h3 className="section-title">`）の右隣に `.help-icon` を表示。
- `Inspector.jsx` の `procedure` エントリのみ `helpText={t('inspector.procedure_help')}` を渡す。`description` / `intent` は対象外（アイコン非表示）。

### 「実行順序 (ステップ)」セクション
- `Inspector.jsx` の `schedule` セクション内、`order-controls` の `section-subtitle` ラベル右隣に `.help-icon` を直接配置し、`data-tooltip={t('inspector.order_section_help')}` を設定。

### i18n キー

| キー | ja | en |
|------|----|----|
| `inspector.procedure_help` | このタスクを実行するための具体的な手順・段取りを書く場所です。実行の順番や詳細なステップを自由に記述できます。 | A place to describe the concrete steps and process to carry out this task. Write the order and detailed steps freely. |
| `inspector.order_section_help` | 親タスク直下の兄弟タスクの中で、このタスクが実行される予定の順番を表す設定です。上下ボタンで変更できます。 | The planned execution order of this task among its sibling tasks under the parent. Adjust with the up/down buttons. |

## 3. 境界条件

| ケース | 挙動 |
|--------|------|
| `helpText` 未指定（description / intent） | アイコンを表示しない（既存挙動を維持） |
| ホバー | カスタムツールチップを表示（opacity / visibility を切り替え） |
| キーボードフォーカス | `:focus-visible` でも表示（アクセシビリティ） |
| インスペクター幅の制約 | ツールチップはアイコン直下に表示し、`.inspector-container` に `overflow: hidden` が無いためクリップされない |
| ライト／ダークテーマ | 既存 CSS 変数（`--surface-color` / `--text-main` / `--border-color` / `--primary-glow`）を利用し両テーマに追従 |

## 4. 変更スコープ

### やること
- `i18n.js` に `inspector.procedure_help` / `inspector.order_section_help` を日英追加
- `InspectorTextarea.jsx` に `helpText` prop 追加（指定時のみ Info アイコン表示）
- `Inspector.jsx` の `procedure` エントリに `helpText` を渡す
- `Inspector.jsx` の `order-controls` ラベル右隣に説明アイコンを追加
- `Inspector.css` に `.help-icon` とツールチップ（`::after` / `::before`）スタイルを追加

### やらないこと
- `description` / `intent` へのアイコン追加
- HTML ネイティブ `title` 属性の使用（カスタムツールチップで実装）
- 既存 `InspectorTextarea` の編集・モーダル拡大機能への変更
