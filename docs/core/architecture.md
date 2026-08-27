# LogiDo ディレクトリ構造ルール

> **前提となる原本（SSOT）**
> 本ドキュメントの構造方針は、bulletproof-react の
> [docs/project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
> を唯一の前提とする。本アプリ独自のディレクトリ方針は持たない。
>
> **原本との突き合わせ方（重要）**
> 実装計画を立てる際、各判断の詳細が不確かになった場合は「適当に決めず」、
> 下記の各見出しに付した **行番号リンクから原本を開いて原文を確認する**こと。
> 本ドキュメントは「本アプリへの適用結果」を記すものであり、原文の完全な代替ではない。

---

## 0. 原本のどこをどう適用したか（対応表）

原本（project-structure.md）のキーとなる記述と、本アプリへの適用結果の対応は以下の通り。

| 原本の記述 | 原文の場所 | 本アプリへの適用 |
|---|---|---|
| src 配下のトップレベル構成（app/assets/components/config/features/hooks/lib/stores/testing/types/utils） | [L6–32](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L6-L32) | §1 に記載（本アプリは `config`/`stores`/`types`/`utils` をまだ持たないため §1 の構造に含めない） |
| 「コードの大部分を features フォルダにまとめる」 | [L35](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L35) | 単一機能の本アプリは `features/todo/` に集約（§2） |
| feature 内のサブ構成（api/assets/components/hooks/stores/types/utils） | [L40–54](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L40-L54) | §2 に記載 |
| 「全フォルダを毎回作る必要はない。必要なものだけ置く」 | [L57](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L57) | §2 の注記に反映 |
| 「API 呼び出しを feature 外の専用 `api` フォルダに置くのが実用的な場合がある（feature 間で共有する API が多い場合）」 | [L59](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L59) | 本アプリは API が 1 つ（aiApi）のため feature 内 `api/` を採用。複数 feature が増えたら専用 `api/` への移行を再検討（§3.2） |
| 「barrel file は Vite のツリーシェイキングに問題を起こすため、直接 import する」 | [L61](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L61) | §4.2 に反映（barrel file 禁止） |
| 「feature 間の import は避け、アプリレベルで合成する」 | [L63](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L63) | §4.3 に反映 |
| 「一方向依存（shared → features → app）を強制する」 | [L106](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L106) | §4.4 に反映 |
| 一方向依存の ESLint 強制例 | [L112–139](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L112-L139) | 本アプリは feature が 1 つのため実装必須ではない（§4.4 参照） |

---

## 1. ディレクトリ構造（目標形）

```text
src/
├── app/                  # アプリ層（bulletproof の app 相当）
│   ├── main.jsx          # エントリポイント
│   ├── provider.jsx      # グローバルプロバイダを束ねる（SettingsProvider をここでラップ）
│   ├── App.jsx           # メインのアプリコンポーネント
│   └── App.css
├── assets/               # 静的ファイル（画像・SVG）
├── components/           # アプリ横断の共有 UI（sandbox/DesignSandbox.jsx など）
├── constants/            # 共有定数（themes.js など。定数の集約は別タスク）
├── features/             # 機能ベースのモジュール
│   └── todo/             # 本アプリ唯一の機能モジュール（詳細は §2）
├── hooks/                # アプリ横断の共有フック（useI18n.js など）
├── lib/                  # アプリ横断の共有ライブラリ（React Context 系・i18n データ）
├── testing/              # テスト用ユーティリティ（setupTests.js）
└── index.css             # グローバルスタイル
```

### 各層の責務（原本の定義に基づく）

| ディレクトリ | 責務 | 原本の定義 |
|---|---|---|
| `app/` | アプリの組み立て（エントリ・プロバイダ・ルート） | [L8–13](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L8-L13) |
| `assets/` | 画像・フォントなどの静的ファイル | [L14](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L14) |
| `components/` | アプリ全体で使う共有コンポーネント | [L16](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L16) |
| `features/` | 機能ベースのモジュール | [L20](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L20) |
| `hooks/` | アプリ全体で使う共有フック | [L22](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L22) |
| `lib/` | アプリ用に事前設定された再利用可能なライブラリ | [L24](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L24) |
| `testing/` | テスト用ユーティリティとモック | [L28](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L28) |

> 原本には `config`/`stores`/`types`/`utils` も存在する（[L18](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L18)・[L26](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L26)・[L30](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L30)・[L32](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L32)）が、本アプリは現在該当するコードを持たないため §1 の構造に含めない。必要になった時点で原本に従い追加する。

---

## 2. features/todo/ の内部構造

```text
src/features/todo/
├── api/                  # todo 機能固有の API リクエスト（ai-api.js）
├── components/           # todo 機能にスコープされた UI
│   ├── list/             # List View 関連
│   ├── tree/             # Tree View 関連
│   ├── inspector/        # Why/How インスペクター関連
│   ├── search/
│   ├── settings/
│   ├── trash/
│   └── import/
├── hooks/                # todo 機能にスコープされたフック
│   ├── useTodoTree.js
│   ├── useShortcuts.js
│   └── useAI.js
└── lib/                  # todo 機能の純粋ドメインロジック・定数（React 非依存）
    ├── treeConstants.js      # ノード種別・ステータス・グループ配色（定数）
    ├── treeNodes.js          # ノード CRUD・構造
    ├── treeProgress.js       # 進捗・状態・依存
    ├── treeGroups.js         # OR グループ操作
    ├── treeLifecycle.js      # 削除・非表示（ソフト削除/復元/完全削除）
    ├── treeFolders.js        # フォルダ
    ├── treeDisplay.js        # 検索・表示（フロー平坦化/arborist ツリー構築）
    ├── importLogic.js        # インポート解析
    └── treeViewConstants.js  # TreeView 表示専用の定数
```

- 上記のサブ構成は原本の feature 例（[L40–54](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L40-L54)）に従う。
- 原本の NOTE「全フォルダを毎回作る必要はない」（[L57](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L57)）に従い、本アプリは `assets`/`stores`/`types`/`utils` を feature 内に持たない。
- **純粋ドメインロジック（treeConstants / treeNodes / treeProgress / treeGroups / treeLifecycle / treeFolders / treeDisplay / importLogic）の配置**：原本に `domain/` や `logic/` というディレクトリは存在しない。feature 内の再利用ライブラリは原本では `utils`（[L54](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L54)）が担うが、本アプリでは「機能に閉じた純粋ロジック」を `lib/` と命名して明示する。実装計画時にこの命名が不適切と判断した場合は、**原本 L54 の `utils` 定義を確認した上で再決定する**こと。

---

## 3. 配置判断の基準

### 3.1 基本原則

- **コードの大部分は `features/` に集約する**（[L35](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L35)）。
- 機能固有のコードは機能フォルダに入れ、共有コンポーネントと混ぜない。

### 3.2 API 呼び出しの配置

- 本アプリは feature が 1 つで API も 1 つ（`aiApi`）のため、feature 内 `api/` に置く。
- 将来 feature が増えて「feature 間で共有する API 呼び出しが多い」状況になったら、原本 [L59](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L59) に従い、feature 外の専用 `api/` フォルダへ移すことを再検討する。

### 3.3 共有層の境界

- 共有層（`components/`・`hooks/`・`lib/` トップレベル）はアプリ全体から使える。
- 現時点で共有層に置くもの：
  - `lib/`：`settings.js`（Context + useSettings）、`SettingsProvider.jsx`（Provider）、`i18n.js`（翻訳データ）
  - `hooks/`：`useI18n.js`
  - `components/`：`sandbox/DesignSandbox.jsx`
- これらは「アプリ横断で 1 箇所で提供すべきもの」であり、特定の feature に属さないため共有層に置く。

---

## 4. 運用ルール

### 4.1 命名コンベンション

- **コンポーネント**: パスカルケース（`TodoItem.jsx`）
- **フック**: キャメルケース（`useTodoTree.js`）
- **ロジック・ユーティリティ**: キャメルケース（`treeConstants.js` / `treeNodes.js` / `treeProgress.js` / `treeGroups.js` / `treeLifecycle.js` / `treeFolders.js` / `treeDisplay.js` / `importLogic.js` / `treeViewConstants.js`）
- **CSS クラス名**: ケバブケース（`todo-item-container`）

### 4.2 Barrel file の禁止

- barrel file（`index.js` で一括 re-export する）は Vite のツリーシェイキングを阻害するため、**直接 import する**（原本 [L61](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L61)）。
- 例：`import { addNode } from '@/features/todo/lib/treeLogic'` のようにファイルを直接指定する。

### 4.3 feature 間 import の禁止

- feature 同士の import は避け、アプリレベルで合成する（原本 [L63](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L63)）。
- 本アプリは feature が 1 つ（`todo`）のため現状は実害が少ないが、将来 feature を増やす際はこのルールに従う。

### 4.4 一方向依存（shared → features → app）

- 依存の流れを一方向に保つ：共有層はどこからでも import でき、feature は共有層からのみ import でき、app は feature と共有層から import できる（原本 [L106](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L106)）。
- 原本では ESLint `import/no-restricted-paths` で強制する例が示されている（[L112–139](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md#L112-L139)）が、本アプリは feature が 1 つのため現段階では実装必須としない。**feature を追加するタスクでは、この強制ルールの導入を検討する。**

---

## 5. AI アシスタント向けガイドライン

コード生成・修正時に以下を遵守する。

1. **新規ファイルの配置**: 上記 §1〜§3 の基準に従う。判断に迷ったら本ドキュメントのリンクから原本（project-structure.md）の該当箇所を確認する。
2. **原本優先**: 本ドキュメントと原本が矛盾する場合は原本を正とし、本ドキュメントを修正する（`docs/core/architecture.md` は常に原本・実装と一致させる）。
3. **barrel file を作らない**（§4.2）。
4. **仕様・構造変更を伴う修正は、コード修正前に本ドキュメントを更新する**（Specification-First）。
