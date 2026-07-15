# インスペクター専用テキストエリア コンポーネント化 仕様書

## 1. 誰の、どんな困りごとを解決するのか

- **対象者**: 今後「詳細意図」など専用テキストエリアを追加したい開発者（自分自身）。
- **困りごと**: 専用テキストエリアを追加するたびに `isEditingXxx` state・onBlur 保存・URL解析表示・Expand ボタン・DescriptionModal 連携ロジックを毎回ゼロから書き直す必要がある。
- **解決策**: これらを `InspectorTextarea` コンポーネントとして切り出す。追加時は `<InspectorTextarea>` を置くだけで全ロジックが付いてくる。共通部分の修正も1箇所で全専用テキストエリアに反映される。

## 2. コンポーネント設計

### コンポーネント名
`InspectorTextarea`（`src/components/features/inspector/InspectorTextarea.jsx`）

### Props

| prop | 型 | 説明 |
|------|----|------|
| `nodeId` | string | ノード切り替え検知用（useEffect の依存配列に使用） |
| `value` | string | 現在の文字列（親から渡す） |
| `onChange(text)` | function | onBlur 時に呼ばれるコールバック（保存） |
| `onModalChange(text)` | function | モーダル内リアルタイム変更時のコールバック |
| `label` | string | セクションタイトル文字列（例: t('inspector.description')）。モーダルタイトル・expand ボタン tooltip にも使用される |
| `placeholder` | string | textarea のプレースホルダー |
| `t` | function | 翻訳関数（モーダル内の共通文言に使用） |

### 内部 state

| state | 初期値 | 説明 |
|-------|--------|------|
| `isEditing` | `false` | 編集中かどうか |
| `isModalOpen` | `false` | 拡大モーダルの開閉 |

### 内部ロジック

- `nodeId` 変更時に `isEditing`・`isModalOpen` を `false` にリセット（useEffect）
- `value` が空 または `isEditing === true` → `<textarea>` を表示（`defaultValue` + `onBlur`）
- `value` あり + `isEditing === false` → `<div className="description-display">` を表示（URL解析済み）
- onBlur → `onChange(e.target.value)` を呼ぶ
- モーダルの onChange → `onModalChange(text)` を呼ぶ（リアルタイム）
- Expand ボタン → `isModalOpen = true`
- Edit ボタン → `isEditing = true`

## 3. 境界条件

| ケース | 挙動 |
|--------|------|
| `value` が空 | 常に textarea 表示（編集モードと同じ） |
| ノード切り替え（`nodeId` 変化） | `isEditing`・`isModalOpen` をリセット |
| タイトルだけ異なる複数テキストエリア | `label` prop で制御 |
| モーダルを開いて何も変えず閉じる | 元の value が維持される |

## 4. 変更スコープ

### やること
- `InspectorTextarea.jsx` を新規作成
- `Inspector.jsx` の `sectionMap.description` を `<InspectorTextarea>` に置き換え
- `isEditingDesc`・`handleDescriptionChange`・`handleDescModalChange` を Inspector.jsx から削除（コンポーネント内に移動）

### やらないこと
- `DescriptionModal.jsx` 自体の変更
- CSS クラス名の変更（既存クラスを流用）
- T6（詳細意図テキストエリア）の追加（別タスク）
