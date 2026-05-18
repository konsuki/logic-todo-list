# 実装計画書：インスペクターからのタイトル編集機能の追加 (inspector_title_edit)

## 大まかな手順
本機能の実装は、以下の大まかな手順に従って進めます。

1. **多言語化用辞書ファイルの更新**
   - **詳細仕様**: `src/logic/i18n.js` の `inspector` オブジェクトに新キー `click_to_edit` を追加します。
     - **日本語 (`ja.inspector`)**: `"click_to_edit": "クリックして編集"` を追加。
     - **英語 (`en.inspector`)**: `"click_to_edit": "Click to edit"` を追加。
   - **理由**: インスペクター上のタイトルホバー時に「クリックして編集可能」であることを伝えるツールチップの表記を多言語対応させるため。


2. **`Inspector.jsx` への編集機能の追加**
   - **詳細仕様**:
     - `import React, { useState, useEffect } from 'react';` として `useEffect` をインポートします。
     - コンポーネント内に以下のステートおよびエフェクトを追加します。
       ```javascript
       const [isEditingTitle, setIsEditingTitle] = useState(false);
       const [editTitle, setEditTitle] = useState(node?.title || '');

       useEffect(() => {
         setIsEditingTitle(false);
         setIsEditingDesc(false);
         setEditTitle(node?.title || '');
       }, [selectedNodeId, node?.title]);
       ```
     - ヘッダー内の `<h2>{node.title}</h2>` 部分を、`isEditingTitle` が `true` の時は `<input>` 要素、`false` の時はホバー効果付きの `<h2>`（クラス名: `inspector-title`）をレンダリングする三項演算子に置き換えます。
     - インプット要素の `onBlur`・`onKeyDown` ハンドラーで、`Enter`・フォーカス消失時に既存の `updateNode` 関数で値を確定保存し、`Escape` キー押下で変更を破棄して編集モードを終了する処理を実装します（値がトリムして空の場合は保存をスキップして元の状態に戻します）。

3. **`Inspector.css` へのスタイリング追加**
   - **詳細仕様**: `src/components/features/inspector/Inspector.css` に以下のCSSクラスを追加します。
     - **`.inspector-title`**:
       - `cursor: pointer;`
       - `border-bottom: 1px dashed transparent;`
       - `display: inline-block;`
       - `max-width: 100%;`
       - `word-break: break-word;`
       - `transition: border-bottom-color var(--transition-speed);`
       - **ホバー時 (`:hover`)**: `border-bottom-color: var(--text-muted);` とし、編集可能であることを知らせます。
     - **`.inspector-title-input`**:
       - `font-size: 24px;`
       - `font-weight: bold;`
       - `margin: 12px 0 16px;`
       - `line-height: 1.2;`
       - `width: 100%;`
       - `background: var(--surface-color);`
       - `border: 1px solid var(--border-color);`
       - `color: var(--text-main);`
       - `border-radius: 6px;`
       - `padding: 4px 8px;`
       - `box-sizing: border-box;`
       - `font-family: var(--font-display);`
       - `outline: none;`
       - `transition: border-color 0.2s, box-shadow 0.2s;`
       - **フォーカス時 (`:focus`)**: ボーダー色を `--primary-color` にし、`box-shadow: 0 0 0 2px var(--primary-glow)` を付与してプレミアムなフォーカス感を表現します。

4. **単体テストの追加と実行検証**
   - **詳細仕様**: `src/components/features/inspector/Inspector.test.jsx` にインライン編集機能を検証するテストケースを追加します。
     - **検証ケース**:
       - 1. **初期表示とクリック遷移**: 通常表示で `h2.inspector-title` にタイトルが表示され、クリックした際に入力用 `<input className="inspector-title-input">` が描画されること。
       - 2. **Enterキー保存**: 入力欄に新しいタイトルを入力し、`Enter` キーを押下した際、正しく `updateNode` が正しい引数（`selectedNodeId`, `{ title: "New Title" }`）で呼び出され、編集モードが終了すること。
       - 3. **Blur保存**: 入力欄のフォーカスが外れた（`onBlur`）際、自動的に `updateNode` が呼び出され保存されること。
       - 4. **Escapeキャンセル**: `Escape` キーを押下した際、`updateNode` は呼び出されず、入力前の元の値に戻って編集モードが終了すること。
       - 5. **空文字の制限**: トリムした入力値が空文字（`""`）の状態で確定した場合、`updateNode` による更新を実行しないこと。
       - 6. **ノード切り替え同期**: 編集中の状態で `selectedNodeId` プロップが変更された際、編集モードが自動的に `false` にリセットされ、新しいノードのタイトルが表示されること。
   - **テストの実行**: `npm run test:run` コマンドで全テストを動作させ、すべて正常にパス（グリーン）することを確認します。
