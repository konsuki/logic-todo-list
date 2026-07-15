# T5 インスペクター専用テキストエリア コンポーネント化 実装プラン

## 大まかな手順

1. **InspectorTextarea.jsx の新規作成** — isEditing / isModalOpen 内部 state・onBlur 保存・URL解析表示・Expand ボタン・DescriptionModal を内包したコンポーネントを作成
   - `src/components/features/inspector/InspectorTextarea.jsx` を新規作成
   - Props: `nodeId`, `value`, `onChange`, `onModalChange`, `label`, `placeholder`, `t`
   - 内部 state: `isEditing`, `isModalOpen`（nodeId 変化時に useEffect でリセット）
   - `renderText` に Inspector.jsx の URL解析ロジック（renderDescription）を移植
   - `key={nodeId}` を textarea に付けてノード切替時の defaultValue 再反映を保証
   - CSS クラスはすべて既存のものを流用（変更なし）
2. **Inspector.jsx のリファクタ** — sectionMap.description を `<InspectorTextarea>` に置き換え、不要になった state・ハンドラを削除
   - `InspectorTextarea` を import
   - `isEditingDesc`・`isDescModalOpen` state を削除
   - useEffect 内の `setIsEditingDesc(false)`・`setIsDescModalOpen(false)` を削除
   - `handleDescriptionChange`・`handleDescModalChange`・`renderDescription` 関数を削除
   - `DescriptionModal` の import と JSX 末尾マウントを削除
   - `sectionMap.description` を `<InspectorTextarea nodeId=... value=... onChange=... onModalChange=... label=... placeholder=... t=... />` に置き換え
3. **REVISIONS.md の更新とコミット**

---

各手順の詳細は以下に順次追記する。
