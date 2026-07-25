# タスク一時非表示機能 仕様書
## 概要
リストに表示されているタスクを「視覚ノイズ」として認識した場合、削除せずに一時的に非表示にできる機能を追加する。非表示にしたタスクは専用の一覧からいつでも元の位置に再表示できる。

---

## 背景・目的
**誰の、どんな困りごとを解決するか:**
- ユーザーが過去に作成したタスク（完了済み・未完了を問わず）がリストに表示され続けることで情報量が増え、現在注力すべきタスクを見つけるのにストレスがかかる
- 削除するほどの判断はできないが「今は表示しないでほしい」タスク（＝視覚ノイズタスク）を気軽に隠せるようにする

---

## データモデルの変更

### 追加フィールド: `hidden`
- **型**: `boolean | undefined`
- **意味**: `true` の場合、そのノードはリストから非表示になる。`undefined` または `false` の場合は通常表示。
- **`deletedAt` との違い**: `hidden` は「一時的に隠す」概念であり、ゴミ箱には移動しない。`deletedAt` は「削除（ゴミ箱入り）」の概念。

---

## 機能要件

### 1. 非表示操作
- 各タスク行のアクションボタン領域に「非表示」ボタン（EyeOff アイコン）を追加
- クリックで**確認ダイアログなし**で即座に対象ノードと全子孫に `hidden: true` を付与
- 非表示になったノードはリストから即座に消える
- 削除とは異なり気軽に操作できることを重視

### 2. 非表示タスク一覧（モーダル）
- リストビューヘッダーに「非表示タスク (N)」ボタンを配置
- クリックでモーダルが開き、`hidden: true` かつ `deletedAt` を持たないルートノードを一覧表示
- 各アイテムに「表示に戻す」ボタン（EyeOff 解除 / Eye アイコン）を表示
- 「表示に戻す」操作で対象ノードと全子孫の `hidden` を除去し、元の位置に再表示

### 3. フィルタリング
- `treeLogic.js` の既存の表示系関数で、`deletedAt` と同様に `hidden` ノードを除外する
- 影響を受ける関数: `buildArboristTree`, `getVisibleNodesList`, `getFlattenedFlow`, `calculateNodeProgress`
- 加えて、各ビューコンポーネント側のフィルタリングロジックでも `hidden` ノードを除外する必要がある:
  - **ListView.jsx**: `filteredRoots`（ルートノード抽出時）、`checkVisibility`（フェーズフィルタ時）
  - **TreeView.jsx**: `buildHierarchy`（ツリー構築時）、`getDescendantIds`（子孫走査時）
  - ※ `useTodoTree.js` の `rootNodes` は既に `hidden` フィルタ済みだが、上記コンポーネント内の追加フィルタリングロジックがこれを見落とすと非表示にならない

### 4. 親子関係
- 親ノードを非表示にすると、子孫すべてに再帰的に `hidden: true` が付与される
- 親ノードを表示に戻すと、子孫すべての `hidden` が再帰的に除去される
- 非表示タスク一覧にはルートノード（`hidden` かつ `!parentId` または親が非表示でないもの）のみ表示

---

## UI 仕様

### タスク行の非表示ボタン
- 位置: 既存のアクションボタン（Plus, Trash2）と同じ領域
- アイコン: `EyeOff` (lucide-react)
- ツールチップ: 「非表示にする」

### 非表示タスク一覧モーダル
- トリガー: リストビューヘッダーのボタン（`EyeOff` アイコン + バッジで件数表示）
- 内容: 非表示ルートノードのリスト（タイトル、タイプ、非表示日時）
- 各アイテムのアクション: 「表示に戻す」ボタン（`Eye` アイコン）

---

## 境界条件・非対応ケース
- `deletedAt` を持つノード（既にゴミ箱入り）は、たとえ `hidden: true` でも非表示タスク一覧には表示しない（ゴミ箱側で管理）
- 非表示にしたタスクの progress は親の進捗計算から除外する（`deletedAt` と同様の扱い）
- 非表示ノードは `buildArboristTree` でツリー構築時に除外されるため、D&D の対象にもならない

---

## 制約・注意事項
- `hidden` フィールドは新規ノード作成時には付与されない（デフォルトで表示状態）
- 非表示/再表示の操作は取り消し（Undo）機能を持たない（気軽に再表示できるため）
- ローカライズ（i18n）対応: 日本語・英語の両方で翻訳キーを追加すること

## このタスクを実装した会話セッション
Version:             2.1.216
Session name:        /rename to add a name
Session ID:          0b8bddad-bf4c-44ef-8b8b-93076ce9f9f3
cwd:                 /Users/konnsuki/Desktop/Programs/logic-todo-list
Auth token:          ANTHROPIC_AUTH_TOKEN
API key:             ANTHROPIC_API_KEY
Anthropic base URL:  https://127.0.0.1:8317

Model:               sonnet (pool-deepseek-v4-pro)
IDE:                 Installed VS Code extension
MCP servers:         2 connected · /mcp
Setting sources:     User settings, Shared project settings, Project local settings