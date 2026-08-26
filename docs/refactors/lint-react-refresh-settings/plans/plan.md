# プラン: react-refresh/only-export-components 対応（SettingsContext.jsx の分離）

## 大まかな手順

1. **`settings.js` の新規作成**: `SettingsContext`（createContext）と `useSettings` フックを移動。
   - 新規ファイル: `src/logic/settings.js`
   - 内容:
     ```js
     import { createContext, useContext } from 'react';

     export const SettingsContext = createContext();

     export const useSettings = () => {
       const context = useContext(SettingsContext);
       if (!context) {
         throw new Error('useSettings must be used within a SettingsProvider');
       }
       return context;
     };
     ```
   - 依存: `react` の `createContext` / `useContext` のみ。`SettingsProvider` には依存しない（循環参照なし）。
2. **`SettingsContext.jsx` の書き換え**: `SettingsProvider` のみ export し、`SettingsContext` を `settings.js` から import。
   - 修正後:
     ```js
     import { useState, useEffect } from 'react';
     import { SettingsContext } from './settings';

     export const SettingsProvider = ({ children }) => {
       const [settings, setSettings] = useState(() => {
         const savedSettings = localStorage.getItem('logido_settings');
         return savedSettings ? JSON.parse(savedSettings) : {
           showDescriptionInList: true,
           showPhaseBadges: true,
           showNodeTypeTags: true,
           showStepBadges: true,
           useFolderView: true,
           theme: 'theme-classic',
         };
       });

       useEffect(() => {
         localStorage.setItem('logido_settings', JSON.stringify(settings));
       }, [settings]);

       const updateSetting = (key, value) => {
         setSettings(prev => ({ ...prev, [key]: value }));
       };

       return (
         <SettingsContext.Provider value={{ settings, updateSetting }}>
           {children}
         </SettingsContext.Provider>
       );
     };
     ```
   - 削除するもの: `createContext`, `useContext`, `SettingsContext` の定義, `useSettings` 関数。
   - 残すもの: `SettingsProvider`（コンポーネント）のみ。import は `useState`, `useEffect` と `SettingsContext`。
3. **`useSettings` の import 元を 4 ファイル変更**: SettingsPanel.jsx, Inspector.jsx, TodoItem.jsx, ListView.jsx を `settings.js` に変更。
   - 対象（すべて import パスは `'../../../logic/SettingsContext'`）:
     - `src/components/features/list/ListView.jsx:6`: `import { useSettings } from '../../../logic/SettingsContext';` → `from '../../../logic/settings';`
     - `src/components/features/list/TodoItem.jsx:4`: 同様
     - `src/components/features/settings/SettingsPanel.jsx:3`: 同様
     - `src/components/features/inspector/Inspector.jsx:6`: 同様
   - 変更しない: `main.jsx` と `Inspector.test.jsx` の `SettingsProvider` import（`SettingsContext.jsx` のまま）。
4. **検証**: `npm run lint` で `react-refresh/only-export-components` が 0 件になったことを確認し、`npm run test:run` で既存テスト 53 件が通ることを確認する。
   - `npm run lint` 実行 → `react-refresh/only-export-components` が 0 件になることを確認。残存は:
     - `no-useless-escape` 1 件（InspectorTextarea.jsx）→ 後続
     - `no-empty` 1 件（Inspector.jsx）→ 後続
     - `react-hooks/set-state-in-effect` 3 件 → 後続
     - `react-hooks/exhaustive-deps` 1 warning → 後続
   - `npm run test:run` 実行 → 既存テスト 53 件が pass することを確認（挙動非変更のため全件 green が期待値）。
