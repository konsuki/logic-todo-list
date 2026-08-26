# プラン: 未使用 import・未使用変数の削除（no-unused-vars 解消）

## 大まかな手順

1. **ESLint 設定の更新**: `eslint.config.js` の `no-unused-vars` に `ignoreRestSiblings: true` を追加し、`treeLogic.js` の rest パターン（`hidden` / `deletedAt`）を lint 対象外にする。
   - 現状の eslint.config.js は `js.configs.recommended` を extends しており、`no-unused-vars` は recommended のデフォルト（`ignoreRestSiblings: false`）で動作している。
   - 修正: `rules` ブロックを追加し `{ 'no-unused-vars': ['error', { ignoreRestSiblings: true }] }` を設定する。これにより `const { hidden, ...rest } = node` と `const { deletedAt, ...rest } = node` が正当な rest パターンとして許容される。
   - 挿入位置: `languageOptions` の後（`files` ブロック内）に `rules: { ... }` を追加する。
   - 確認: この変更で `treeLogic.js:601` と `treeLogic.js:629` の 2 エラーが解消される。
2. **未使用 `React` 既定 import の削除**: `import React from 'react'` を削除（named import があるファイルは `import { useState } from 'react'` 等へ書き換え）。
   - 対象ファイルと書き換え内容（lint の `'React' is defined but never used` 対象のみ）:
     - `ImportModal.jsx`: `import React, { useState } from 'react';` → `import { useState } from 'react';`
     - `AIInsights.jsx`: `import React, { useState } from 'react';` → `import { useState } from 'react';`（ただし `useState` 自体も未使用のため手順3で併せて削除予定。ここではまず `React,` を除去）
     - `DescriptionModal.jsx`: `import React from 'react';` を削除（`ReactDOM` の import は残す）
     - `Inspector.test.jsx`: `import React from 'react';` を削除
     - `InspectorTextarea.jsx`: `import React, { useState, useEffect } from 'react';` → `import { useState, useEffect } from 'react';`
     - `SortableSection.jsx`: `import React from 'react';` を削除
     - `HiddenTasksModal.jsx`: `import React from 'react';` を削除（`ReactDOM` は残す）
     - `ListView.jsx`: `import React, { useState, useMemo, useRef, useEffect } from 'react';` → `import { useState, useMemo, useRef, useEffect } from 'react';`
     - `TodoItem.jsx`: `import React, { useState, useMemo } from 'react';` → `import { useState, useMemo } from 'react';`
     - `SettingsPanel.jsx`: `import React from 'react';` を削除
     - `TrashView.jsx`: `import React from 'react';` を削除
     - `TreeView.jsx`: `import React, { useEffect, useRef, useMemo, useState } from 'react';` → `import { useEffect, useRef, useMemo, useState } from 'react';`
     - `test_TreeView.test.jsx`: `import React from 'react';` を削除
     - `DesignSandbox.jsx`: `import React, { useState } from 'react';` → `import { useState } from 'react';`
     - `SettingsContext.jsx`: `import React, { createContext, useContext, useState, useEffect } from 'react';` → `import { createContext, useContext, useState, useEffect } from 'react';`
   - 注意: `ReactDOM`（`import ReactDOM from 'react-dom'`）は `ReactDOM.createPortal` 等で使用中のため削除しない。
3. **未使用 named import の削除**: `AnimatePresence`, `X`, `Calendar`, `Target`, `NODE_TYPES`, `act`, `useState`(AIInsights) 等を削除。
   - 対象（lint が `no-unused-vars` で報告したものに限定）:
     - `DesignSandbox.jsx`:
       - `import { motion, AnimatePresence } from 'framer-motion';` → `import { motion } from 'framer-motion';`（`AnimatePresence` 未使用）
       - `import { Check, X, Calendar, Clock, Zap, Sun, Moon } from 'lucide-react';` → `X` と `Calendar` を除去（`Check, Clock, Zap, Sun, Moon` は使用中）
     - `TreeView.jsx`: `import { Target, Zap, Share2, GitCommit, MoveRight, MoveDown, Settings2, X } from 'lucide-react';` → `Target` を除去（他は使用中）
     - `AIInsights.jsx`: `import { Brain, Loader2 } from 'lucide-react';` は使用中。`import { useState } from 'react'`（手順2で React 除去後）の `useState` は未使用のため、この import 自体を削除（AIInsights は `useState` を使っていない）。`import { NODE_TYPES } from '../../../logic/treeLogic';` も未使用のため削除。
     - `useTodoTree.test.js`: `import { renderHook, waitFor, act } from '@testing-library/react';` → `act` を除去（`renderHook`, `waitFor` は使用中）
   - 注意: `ListView.jsx` の `NODE_TYPES` は `NODE_TYPES.FOLDER` / `NODE_TYPES.GOAL` / `NODE_TYPES.ACTION` として使用中のため削除しない。`SearchBar.jsx` 等の `AnimatePresence` は lint 未報告（使用中）のため触らない。
4. **未使用の関数・props 引数の削除**: `addNode`, `addNodes`, `deleteFolder`, `expandedNodeIds`, `toggleExpand`, `folders`, `assignTaskToFolder`, `t`(TrashView), `lang`(useAI) 等。
   - 対象（lint が `no-unused-vars` で報告したものに限定）:
     - `AIInsights.jsx`:
       - コンポーネント引数から `addNode`, `addNodes` を削除（`node`, `nodes`, `addTreeUnderNode`, `lang`, `t` は使用中）。
       - `const { getBreakdownSuggestions, getLogicAudit, getDeductiveBreakdown, isLoading, error } = useAI();` → `getBreakdownSuggestions`, `getLogicAudit` を除去（`getDeductiveBreakdown`, `isLoading`, `error` は使用中）。
       - 呼び出し元 `Inspector.jsx` の `<AIInsights addNode={addNode} addNodes={addNodes} ...>` から `addNode` / `addNodes` props を削除（連鎖修正）。
     - `Inspector.jsx`: 引数から `deleteFolder` を削除（`folders`, `addFolder`, `assignTaskToFolder` は使用中）。
     - `ListView.jsx`: 引数から `expandedNodeIds`, `toggleExpand`, `folders`, `assignTaskToFolder` を削除（`addFolder`, `deleteFolder`, `displayMode`, `setDisplayMode` 等は使用中）。
     - `TreeView.jsx`: 引数から `expandedNodeIds`, `toggleExpand` を削除（`nodes`, `rootNodes`, `updateNode`, `selectedNodeId`, `onSelectNode`, `t`, `editingNodeId`, `setEditingNodeId` は使用中）。
     - `TrashView.jsx`: 引数から `t` を削除（`isOpen`, `onClose`, `trashedRootNodes`, `nodes`, `onRestore`, `onPermanentDelete` は使用中）。
     - `useAI.js`: `getDeductiveBreakdown` の第3引数 `lang = 'ja'` を削除（デフォルト引数ごと）。呼び出し元 `AIInsights.jsx` の `getDeductiveBreakdown(node, nodes, lang)` を `getDeductiveBreakdown(node, nodes)` へ変更（連鎖修正）。`AIInsights` の `lang` props は `t` と共に使用中か確認（`lang` が他で使われなければ `lang` props も削除）。
   - 注意: 引数の削除は「呼び出し元からの props 受け渡し」も同時に更新する（Cascading Update）。特に `AIInsights` は `Inspector.jsx` から props を受け取っている。
5. **未使用 map/catch 引数・catch 節の修正**: `i`(Inspector), `d`(TreeView), `_`(Inspector), `e`(importLogic) を削除（catch 節は optional catch binding 化）。
   - `Inspector.jsx:356`: `pathToRoot.map((n, i) => (` → `pathToRoot.map((n) => (`（`i` 未使用）。
   - `TreeView.jsx:214`: `.style('fill', d => \`var(--border-color)\`)` → `.style('fill', () => \`var(--border-color)\`)`（`d` 未使用。ただし d3 の chained `.style()` コールバックで index/引数を使わないため `() =>` に変更）。
   - `Inspector.jsx:60`: `} catch (_) {}` → `} catch {`（optional catch binding 化。`_` 未使用かつ空ブロック `no-empty` との二重抵触。ただし `no-empty` は本タスク範囲外のため、`catch {` にすると空ブロックが残り `no-empty` が残る点に注意。→ ここは `_` 削除のみ行い、`no-empty` は後続タスクに残す）。※実装時に再判断: `catch {}` は ES2019+ の optional catch binding で有効。空ブロック警告 `no-empty` は残るが、それは本タスク対象外。
   - `importLogic.js:16`: `} catch (e) {` → `} catch {`（`e` 未使用、optional catch binding 化）。
6. **未使用 middleware 引数の削除**: `vite.config.js` の `next` を削除。
   - `vite.config.js:13`: `server.middlewares.use('/__bizyu_export', (req, res, next) => {` → `(req, res) => {`（`next` 未使用。Express 系ミドルウェアでは通常 3 引数シグネチャを保つが、このハンドラは `next` を一切呼ばず、かつ lint が未使用を報告するため削除する）。
7. **検証**: `npm run lint` を実行し、`no-unused-vars` 由来のエラーが 0 件になったことを確認（残るのは no-useless-assignment / no-useless-escape / no-empty / react-hooks 系のみ）。あわせて `npm run test:run` で既存テスト 53 件が通ることを確認する。
   - `npm run lint` 実行 → `no-unused-vars` が 0 件になったことを確認。残存エラーは:
     - `no-useless-assignment` 2 件（TodoItem.jsx `siblings`, useShortcuts.js `nextIndex`）→ 手順3 タスク
     - `no-useless-escape` 1 件（InspectorTextarea.jsx）→ 後続
     - `no-empty` 1 件（Inspector.jsx）→ 後続
     - `react-hooks/set-state-in-effect` 3 件 → 後続
     - `react-hooks/exhaustive-deps` 1 warning → 後続
     - `react-refresh/only-export-components` 1 件（SettingsContext.jsx）→ 手順4 タスク
   - `npm run test:run` 実行 → 既存テスト 53 件すべてが pass することを確認（リファクタリングは挙動非変更のため、全件 green が期待値）。
   - 期待する結果: lint は exit 1 のまま（未解消エラーが残るため）だが、`no-unused-vars` が 0 件に減っていること。exit 0 達成は手順4 完了後の最終検証タスクで行う。
