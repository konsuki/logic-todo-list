# プラン: Inspector.jsx をセクション単位のサブコンポーネントに分割する

## 大まかな手順

1. `HowSection.jsx` を作成し、`how` セクション（OR グループ編集）の JSX を移す（セクション固有 state も移す）。
2. `DependencySection.jsx` を作成し、`dependency` セクションの JSX を移す（`searchQuery` state も移す）。
3. `ScheduleSection.jsx` を作成し、`schedule` セクションの JSX を移す。
4. `WhySection.jsx` を作成し、`why` セクションの JSX を移す（`isWhyOpen` state も移す）。
5. `FolderSection.jsx` を作成し、`folder` セクションの JSX を移す。
6. `TextareaSection.jsx` を作成し、`description` / `intent` / `procedure` の 3 セクションを 1 共通コンポーネントに統一する。
7. `Inspector.jsx` の `sectionMap` を `<XxxSection />` 呼び出しに置換し、不要になった state・import を整理する。
8. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
9. 連鎖修正（`docs/` 内の該当記述の確認）とコミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（HowSection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/HowSection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap.how`（376〜516 行）の JSX を **ロジック・JSX を 1 文字も変えずに** 移す。

**props 設計（HowSection が受け取るもの）**

```js
const HowSection = ({
  node,             // 対象ノード（id / relation / title）
  children,         // 直下の子ノード配列（node.children から解決済み）
  nodes,            // 全体ノードマップ（calculateGroupProgress 用）
  normalizedGroups, // OR グループ正規化済み配列
  setRelation,
  addGroup,
  removeGroup,
  assignChildToGroup,
  updateGroup,
  onSelectNode,
  t
}) => { ... }
```

**HowSection 内にカプセル化するもの**

- state: `isHowOpen`（初期 true）、`collapsedGroups`（Set）、`editingGroupId`（null）、`editingGroupName`（''）
- 関数: `groupIdOfChild`（`normalizedGroups` から導出）、`toggleGroupCollapse`、`commitGroupName`（`updateGroup` を呼ぶ）
- import: `calculateGroupProgress`（`../lib/treeGroups`）、lucide アイコン（`ChevronUp` / `ChevronDown` / `Plus` / `X`）

**Inspector.jsx 側の変更**

- `sectionMap.how` を `<HowSection node={node} children={children} nodes={nodes} normalizedGroups={normalizedGroups} setRelation={setRelation} addGroup={addGroup} removeGroup={removeGroup} assignChildToGroup={assignChildToGroup} updateGroup={updateGroup} onSelectNode={onSelectNode} t={t} />` に置換。
- この手順では `Inspector.jsx` の不要 state（`isHowOpen` / `collapsedGroups` / `editingGroupId` / `editingGroupName`）と、`groupIdOfChild` / `toggleGroupCollapse` / `commitGroupName` / `calculateGroupProgress` import の削除は **まだ行わない**（手順 7 で一括整理）。

**変更しないもの**

- `how` セクションの JSX・条件分岐・コメントは 1 文字も変更しない。

**この手順単体での検証**

- この時点では `Inspector.jsx` に未使用の state/import が残るため lint は通らない可能性がある。統合検証は手順 7 以降に行う。

---

## 手順 2 の詳細（DependencySection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/DependencySection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap.dependency`（284〜332 行）の JSX を **ロジック・JSX を 1 文字も変えずに** 移す。

**props 設計（DependencySection が受け取るもの）**

```js
const DependencySection = ({
  node,          // 対象ノード（id / dependsOn）
  predecessors,  // 依存先ノード配列（node.dependsOn から解決済み）
  nodes,         // 全体ノードマップ（検索候補抽出用）
  onSelectNode,
  addDependency,
  removeDependency,
  t
}) => { ... }
```

**DependencySection 内にカプセル化するもの**

- state: `searchQuery`（初期 ''）
- 導出値: `searchResults`（`searchQuery` から `Object.values(nodes)` をフィルタして先頭 5 件。元のロジックをそのまま移す）
- import: lucide アイコン（`Link` / `X` / `Plus`）

**Inspector.jsx 側の変更**

- `sectionMap.dependency` を `<DependencySection node={node} predecessors={predecessors} nodes={nodes} onSelectNode={onSelectNode} addDependency={addDependency} removeDependency={removeDependency} t={t} />` に置換。
- `Inspector.jsx` の `searchQuery` / `searchResults` の削除は手順 7 で行う。

**変更しないもの**

- `dependency` セクションの JSX・検索ロジック・コメントは 1 文字も変更しない。

**この手順単体での検証**

- 手順 1 と同様、`Inspector.jsx` に未使用 state が残るため lint は通らない可能性。統合検証は手順 7 以降。

---

## 手順 3 の詳細（ScheduleSection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/ScheduleSection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap.schedule`（230〜282 行）の JSX を **ロジック・JSX を 1 文字も変えずに** 移す。

**props 設計（ScheduleSection が受け取るもの）**

```js
const ScheduleSection = ({
  node,        // 対象ノード（id / phase / dueDate）
  reorderNode,
  updateNode,
  t
}) => { ... }
```

**ScheduleSection 内に定義するもの**

- ハンドラ: `handlePhaseChange`（`updateNode(node.id, { phase: ... })`）、`handleDueDateChange`（`updateNode(node.id, { dueDate: ... })`）
- import: lucide アイコン（`Calendar` / `ArrowUp` / `ArrowDown`）、`HelpIcon`（`./HelpIcon`）

**Inspector.jsx 側の変更**

- `sectionMap.schedule` を `<ScheduleSection node={node} reorderNode={reorderNode} updateNode={updateNode} t={t} />` に置換。
- `Inspector.jsx` の `handlePhaseChange` / `handleDueDateChange` の削除は手順 7 で行う。

**変更しないもの**

- `schedule` セクションの JSX・ハンドラ・コメントは 1 文字も変更しない。

**この手順単体での検証**

- 同上。統合検証は手順 7 以降。

---

## 手順 4 の詳細（WhySection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/WhySection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap.why`（334〜374 行）の JSX を **ロジック・JSX を 1 文字も変えずに** 移す。

**props 設計（WhySection が受け取るもの）**

```js
const WhySection = ({
  node,        // 対象ノード（title）
  pathToRoot,  // ルートまでの祖先パス（Inspector で解決済み）
  onSelectNode,
  t
}) => { ... }
```

**WhySection 内にカプセル化するもの**

- state: `isWhyOpen`（初期 true）
- import: lucide アイコン（`ChevronUp` / `ChevronDown` / `Target` / `ExternalLink`）

**Inspector.jsx 側の変更**

- `sectionMap.why` を `<WhySection node={node} pathToRoot={pathToRoot} onSelectNode={onSelectNode} t={t} />` に置換。
- `Inspector.jsx` の `isWhyOpen` の削除は手順 7 で行う。

**変更しないもの**

- `why` セクションの JSX・条件分岐・コメントは 1 文字も変更しない。

**この手順単体での検証**

- 同上。統合検証は手順 7 以降。

---

## 手順 5 の詳細（FolderSection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/FolderSection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap.folder`（187〜219 行）の JSX を **ロジック・JSX を 1 文字も変えずに** 移す。

**props 設計（FolderSection が受け取るもの）**

```js
const FolderSection = ({
  node,               // 対象ノード（id / type / folderId）
  folders,            // フォルダノード配列
  useFolderView,      // settings.useFolderView
  assignTaskToFolder,
  addFolder,
  t
}) => { ... }
```

**FolderSection 内に定義するもの**

- 条件: `node.type === 'FOLDER' || useFolderView === false` の場合は `null` を返す（元の三項演算を維持）。
- import: lucide アイコン（`Folder` / `FolderPlus`）

**Inspector.jsx 側の変更**

- `sectionMap.folder` を `<FolderSection node={node} folders={folders} useFolderView={settings.useFolderView} assignTaskToFolder={assignTaskToFolder} addFolder={addFolder} t={t} />` に置換。

**変更しないもの**

- `folder` セクションの JSX・条件・コメントは 1 文字も変更しない。

**この手順単体での検証**

- 同上。統合検証は手順 7 以降。

---

## 手順 6 の詳細（TextareaSection.jsx の作成）

**やること**

1. 新規ファイル `src/features/todo/components/inspector/TextareaSection.jsx` を作成する。
2. `Inspector.jsx` の `sectionMap` の `description`（147〜158 行）・`intent`（160〜171 行）・`procedure`（173〜185 行）の JSX を **1 つの共通コンポーネント**に統一する。

**props 設計（TextareaSection が受け取るもの）**

```js
const TextareaSection = ({
  nodeId,       // selectedNodeId（key と nodeId に使用）
  node,         // 対象ノード（description / intent / procedure）
  field,        // 'description' | 'intent' | 'procedure'
  updateNode,
  t
}) => { ... }
```

**TextareaSection 内に定義するもの**

- フィールド名から値を選ぶロジック（`node[field] || ''`）。
- ラベル・プレースホルダ・helpText の i18n キーを `field` に応じて切り替える:
  - `description` → label=`inspector.description`, placeholder=`inspector.placeholder_desc`
  - `intent` → label=`inspector.intent`, placeholder=`inspector.placeholder_intent`
  - `procedure` → label=`inspector.procedure`, placeholder=`inspector.placeholder_procedure`, helpText=`inspector.procedure_help`
- `InspectorTextarea` に渡す `key={nodeId}` を維持（リマウント制御）。

**Inspector.jsx 側の変更**

- `sectionMap.description` → `<TextareaSection nodeId={selectedNodeId} node={node} field="description" updateNode={updateNode} t={t} />`
- `sectionMap.intent` → `<TextareaSection nodeId={selectedNodeId} node={node} field="intent" updateNode={updateNode} t={t} />`
- `sectionMap.procedure` → `<TextareaSection nodeId={selectedNodeId} node={node} field="procedure" updateNode={updateNode} t={t} />`

**変更しないもの**

- 各 `InspectorTextarea` に渡していた `onChange` / `onModalChange` の内容（`updateNode(nodeId, { field: text })`）は維持する。

**この手順単体での検証**

- 同上。統合検証は手順 7 以降。

---

## 手順 7 の詳細（Inspector.jsx の sectionMap 置換と state/import 整理）

**やること**

1. `Inspector.jsx` に 6 ファイルの import を追加する:
   ```js
   import HowSection from './HowSection';
   import DependencySection from './DependencySection';
   import ScheduleSection from './ScheduleSection';
   import WhySection from './WhySection';
   import FolderSection from './FolderSection';
   import TextareaSection from './TextareaSection';
   ```
2. `sectionMap` の各値を `<XxxSection />` 呼び出しに置換する（各手順で確定済みの props で）。
3. 不要になった state・関数・import を削除する:
   - state: `searchQuery`, `isWhyOpen`, `isHowOpen`, `collapsedGroups`, `editingGroupId`, `editingGroupName`
   - 関数: `groupIdOfChild`, `toggleGroupCollapse`, `commitGroupName`, `handlePhaseChange`, `handleDueDateChange`
   - 導出値: `searchResults`
   - import: `calculateGroupProgress`（`../lib/treeGroups` から）、lucide アイコンのうち Inspector 本体で使わなくなったもの（`ChevronUp` / `ChevronDown` / `Target` / `ExternalLink` / `Link` / `X` / `Plus` / `Calendar` / `ArrowUp` / `ArrowDown` / `Folder` / `FolderPlus` のうち、本体ヘッダーで使うもの以外）
   - `InspectorTextarea` の import が不要になるか確認（`TextareaSection` へ移るため）

**Inspector.jsx 本体が残すもの**

- `useState`（`isEditingTitle` / `editTitle` / `isReorderMode` / `sectionOrder` 用）
- `DndContext` / `closestCenter` / `PointerSensor` / `useSensor` / `useSensors`、`SortableContext` / `verticalListSortingStrategy` / `arrayMove`
- `normalizeGroups`（`normalizedGroups` の計算用）
- `useSettings`
- `AIInsights`, `SortableSection`, `HelpIcon`（ヘッダーで使う）
- lucide のうち本体ヘッダーで使うもの（`Info` / `GripVertical` / `Trash2` / `AlertTriangle`）
- `handleSectionReorder`, `handleDragEnd`

**この手順単体での検証**

- `npm run lint` で未使用 import・変数がゼロになること。ここまでが実装の完了地点。

---

## 手順 8 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 9 の詳細（連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（連鎖修正）**

1. `docs/` 全体を `Inspector.jsx` / `sectionMap` / `WhySection` 等で grep し、セクションが `Inspector.jsx` 単一ファイル内にある前提の記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/refactors/readability/spec.md` の H3（Inspector 分割）の記述を実装後の状態に合わせて更新する。
   - `docs/core/architecture.md` §2 の `components/inspector/` に新規サブコンポーネントを反映する必要があるか確認する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`refactor:` プレフィックス）。
2. コミットメッセージ例: `refactor: Inspector.jsx をセクション単位のサブコンポーネントに分割`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「Inspector.jsx をセクション単位のサブコンポーネントに分割する」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/inspector-section-split`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。
