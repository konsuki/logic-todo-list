# Inspector.jsx をセクション単位のサブコンポーネントに分割する

## 1. 誰の、どんな困りごとを解決するのか

- **誰**: 本アプリを就職活動のポートフォリオとして提示する開発者。およびコードレビューする評価者。
- **困りごと**: `src/features/todo/components/inspector/Inspector.jsx`（634 行）に 9 セクション（description/intent/procedure/folder/ai/schedule/dependency/why/how）の JSX が単一コンポーネントに内包されており、見通しが悪い。セクション単位のサブコンポーネントへ分割して単一責務にする。**実行時の挙動は一切変えない。**

## 2. 画面やデータの流れ

- 本タスクは挙動非変更のリファクタリング。変更は「ファイルの物理的な分割」と「props の受け渡し」のみ。
- 各セクションの JSX・ロジックは 1 文字も変更しない（配置と props 渡しのみ変更）。
- `sectionMap`（セクションの並び替え・DnD の仕組み）は維持する。

## 3. 分割粒度と新規ファイル

`components/inspector/` 配下に **6 ファイル**を新規作成する。`ai` セクションは既に `AIInsights.jsx` に分離済みのため対象外。

| 新ファイル | 担当セクション | 根拠 |
|---|---|---|
| `HowSection.jsx` | `how`（OR グループ編集） | 約 140 行で最複雑。単独分割の価値が最大 |
| `DependencySection.jsx` | `dependency` | `searchQuery` という独自 state を持つ |
| `ScheduleSection.jsx` | `schedule` | フェーズ/期限/実行順序で比較的独立 |
| `WhySection.jsx` | `why` | `isWhyOpen` という独自 state を持つ |
| `FolderSection.jsx` | `folder` | フォルダ割り当てで独立 |
| `TextareaSection.jsx` | `description` / `intent` / `procedure` | 3 セクションが同一パターン（`InspectorTextarea`）のため 1 共通コンポーネントに統一 |

## 4. 変更内容

- 上記 6 ファイルを新規作成し、対応する JSX を **ロジック・JSX を変えずに** 移す。
- `Inspector.jsx` の `sectionMap` は維持し、各値（インライン JSX）を `<XxxSection />` 呼び出しに置換する。
- 各サブコンポーネントは必要な値・コールバックを props で受け取る。
- セクション固有の state は子コンポーネント内にカプセル化する:
  - `DependencySection` → `searchQuery`
  - `WhySection` → `isWhyOpen`
  - `HowSection` → `isHowOpen` / `collapsedGroups` / `editingGroupId` / `editingGroupName`

## 5. 普通ではないケース・境界条件

- **`sectionMap` と DnD の維持**: `sectionOrder` によるセクション並び替え（DnD）のため、`sectionMap` パターンは維持する。`SortableSection` は key で識別されるため、並び替えても子の state は保持される想定。
- **barrel file の禁止（architecture.md §4.2）**: `index.js` は作らず直接 import する。
- **props の受け渡し不変**: 各セクションが受け取る値・コールバックの意味は変えない。
- **`sectionMap` 内で `key`（`selectedNodeId`）を使う箇所**: `InspectorTextarea` は `key={selectedNodeId}` でリマウントしている。`TextareaSection` へ移す際もこの `key` の意味を保つ。

## 6. 優先順位・本当に必要なもの

- **最優先**: 挙動非変更。JSX・ロジックは変えず、配置と props 渡しのみ変更する。
- **DoD**: `npm run lint` が exit 0、`npm run test:run` が 53 件 pass、`npm run build` が成功する。

## 7. 完了の定義（DoD）

- 6 つのサブコンポーネントファイルが新設され、対応するセクション JSX が抽出されている。
- `Inspector.jsx` の `sectionMap` が `<XxxSection />` 呼び出しに置換されている。
- barrel file が作られていない。
- `npm run lint` / `npm run test:run`（53 件）/ `npm run build` が全て通る。
