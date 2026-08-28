# プラン: App.jsx のテーマ適用と進捗祝賀ロジックをカスタムフックへ抽出する

## 大まかな手順

1. 新規フック `src/hooks/useTheme.js` を作成し、`themeName`/`themeMode` state とテーマ適用 useEffect を移す。
2. 新規フック `src/features/todo/hooks/useCelebration.js` を作成し、`completedGoals` state と confetti の useEffect を移す。
3. `App.jsx` からテーマ適用ロジック（state ＋ useEffect）と祝賀ロジック（state ＋ useEffect）を削除し、`useTheme` / `useCelebration` を呼び出す。
4. `App.jsx` の `ListView` 呼び出しからデッド props（`expandedNodeIds` / `toggleExpand` / `folders` / `assignTaskToFolder`）を除去する。
5. `npm run lint` / `npm run test:run`（53 件）/ `npm run build` で検証する。
6. 連鎖修正（`docs/` 内の該当記述の確認）とコミット、ビジュツリーへの反映、マージ報告。

> 詳細化は次のステップから順次行う。

---

## 手順 1 の詳細（useTheme.js の作成）

**やること**

1. 新規ファイル `src/hooks/useTheme.js` を作成する。
2. `App.jsx` の 68-85 行（`themeName` / `themeMode` の state と、テーマ適用 useEffect）を **ロジックを 1 文字も変えずに** 移す。

**useTheme の実装内容**

```js
import { useState, useEffect } from 'react';
import { themes } from '../constants/themes';

export const useTheme = () => {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'classic');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

  useEffect(() => {
    const selectedTheme = themes[themeName][themeMode];
    Object.entries(selectedTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('themeName', themeName);
    localStorage.setItem('themeMode', themeMode);

    // Also update body background for seamless transitions
    document.body.style.backgroundColor = selectedTheme['--bg-color'];

    // Add theme class to body for specific CSS overrides
    document.body.className = `theme-${themeName}`;
  }, [themeName, themeMode]);

  return { themeName, setThemeName, themeMode, setThemeMode };
};
```

**変更しないもの**

- テーマ適用のロジック・値・コメントは 1 文字も変更しない。

**この手順単体での検証**

- この時点では `App.jsx` がまだ旧テーマロジックを持つため、`useTheme` は未使用。統合検証は手順 3 以降に行う。

---

## 手順 2 の詳細（useCelebration.js の作成）

**やること**

1. 新規ファイル `src/features/todo/hooks/useCelebration.js` を作成する。
2. `App.jsx` の 116-136 行（`completedGoals` の state と confetti の useEffect）を **ロジックを 1 文字も変えずに** 移す。

**useCelebration の実装内容**

```js
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export const useCelebration = (rootNodes) => {
  const [completedGoals, setCompletedGoals] = useState(new Set());

  useEffect(() => {
    rootNodes.forEach(root => {
      if (root.progress === 100 && !completedGoals.has(root.id)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#00FFAD', '#FFFFFF'],
          zIndex: 1000
        });
        setCompletedGoals(prev => new Set([...prev, root.id]));
      } else if (root.progress < 100 && completedGoals.has(root.id)) {
        setCompletedGoals(prev => {
          const next = new Set(prev);
          next.delete(root.id);
          return next;
        });
      }
    });
  }, [rootNodes, completedGoals]);

  return { completedGoals };
};
```

**変更しないもの**

- confetti のロジック・値・コメントは 1 文字も変更しない。

**この手順単体での検証**

- この時点では `App.jsx` がまだ旧祝賀ロジックを持つため、`useCelebration` は未使用。統合検証は手順 3 以降に行う。

---

## 手順 3 の詳細（App.jsx の副作用削除とフック呼び出し）

**やること**

1. `App.jsx` の import を更新する:
   - `import confetti from 'canvas-confetti';` を削除（`useCelebration` へ移る）
   - `import { themes } from '../constants/themes';` を削除（`useTheme` へ移る）
   - `import { useState, useEffect, useRef } from 'react';` から `useEffect` を削除（App 本体で useEffect が不要になるか確認。他に useEffect があれば残す）
   - 追加: `import { useTheme } from '../hooks/useTheme';` と `import { useCelebration } from '../features/todo/hooks/useCelebration';`

2. `App.jsx` からテーマ適用ロジック（68-85 行）を削除し、以下に置換:
   ```js
   const { themeName, setThemeName, themeMode, setThemeMode } = useTheme();
   ```

3. `App.jsx` から祝賀ロジック（116-136 行）を削除し、以下に置換:
   ```js
   useCelebration(rootNodes);
   ```
   （`completedGoals` は App 側では参照されていないため、返り値を受け取る必要は無い。戻り値を使わない形で呼び出す。）

4. `App.jsx` の `useState` で、テーマ・祝賀用に使っていた state（`themeName` / `themeMode` / `completedGoals`）の定義を削除する。

**注意（`completedGoals` の扱い）**

- 元コードの `completedGoals` は App 内の他箇所では参照されていない（confetti 効果内のみ）。よって `useCelebration` の返り値は使わず、副作用だけ移す。

**変更しないもの**

- テーマ・祝賀以外の App のロジック・JSX は 1 文字も変更しない。

**この手順単体での検証**

- `App.jsx` から不要な import（`confetti` / `themes` / `useEffect`）が消えたことを確認する。lint は手順 4 までに通る想定。

---

## 手順 4 の詳細（App.jsx のデッド props 除去）

**やること**

1. `App.jsx` の `ListView` 呼び出し（235-260 行）から以下 4 つの props を削除する:
   - `expandedNodeIds={expandedNodeIds}`
   - `toggleExpand={toggleExpand}`
   - `folders={folders}`
   - `assignTaskToFolder={assignTaskToFolder}`

2. ただし `TreeView` 呼び出し（262-273 行）の `expandedNodeIds` / `toggleExpand` は **削除しない**（TreeView が使用するため）。

**注意**

- `expandedNodeIds` / `toggleExpand` / `folders` / `assignTaskToFolder` は App 内で他に使用されている（`useShortcuts` に `expandedNodeIds`、`TreeView` に `expandedNodeIds` / `toggleExpand`、`Inspector` に `folders` / `assignTaskToFolder` を渡す）。よって **変数定義や import は削除しない**。ListView 呼び出しの props のみ除去する。

**変更しないもの**

- `TreeView` / `Inspector` / `useShortcuts` への props は 1 文字も変更しない。

**この手順単体での検証**

- `npm run lint` で未使用変数・未使用 import がゼロになること（デッド props 除去後、App 内の他参照が残っているため `expandedNodeIds` 等は未使用にならない）。

---

## 手順 5 の詳細（検証）

**やること**

1. `npm run lint` が exit 0 になることを確認する。
2. `npm run test:run` が 53 件 pass になることを確認する。
3. `npm run build` が成功することを確認する。

**確認項目**

- lint / test / build の 3 つが全て通ること。
- テスト件数が分割前（53 件）から増減していないこと。

---

## 手順 6 の詳細（連鎖修正・コミット・ビジュツリー反映・マージ報告）

**やること（連鎖修正）**

1. `docs/` 全体を `useTheme` / `useCelebration` / `themeName` / `confetti` で grep し、テーマ適用・祝賀ロジックが `App.jsx` 単一ファイル内にある前提の記述が残っていないか確認する。
2. 該当があれば更新する。特に:
   - `docs/refactors/readability/spec.md` の H4（App.jsx フック抽出）の記述を実装後の状態に合わせて更新する。
   - `docs/core/architecture.md` §2 の `hooks/` に `useTheme` を反映する必要があるか確認する。

**やること（コミット）**

1. 変更を 1 コミットにまとめる（`refactor:` プレフィックス）。
2. コミットメッセージ例: `refactor: App.jsx のテーマ適用と進捗祝賀ロジックをカスタムフックへ抽出`

**やること（ビジュツリー反映）**

1. ビジュツリーの子タスク「App.jsx のテーマ適用と進捗祝賀ロジックをカスタムフックへ抽出する」を DONE に更新し、祖先進捗を再計算する。
2. タスクのメモ（description）に実装時の会話セッション情報を追記する。

**やること（マージ報告）**

1. 作業ブランチ名（`refactor/app-hooks-extraction`）を報告し、承認を得てから `main` へマージする。

**この手順単体での検証**

- コミット前に `git status` で想定外のファイルが混入していないか確認する。
