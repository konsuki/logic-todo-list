# 実装計画: ツリー復旧のためのゴミ箱を設定パネル内に配置

## 手順
1. **App.jsx の修正**
   - `SettingsPanel` コンポーネントに `onOpenTrash={() => setIsTrashOpen(true)}` と `trashedCount={trashedRootNodes.length}` を Props として渡すように追加。
   - ヘッダー内のゴミ箱ボタン (`<button className="icon-btn trash-icon-btn" ...>`) を削除する。
2. **SettingsPanel.jsx の修正**
   - Props に `onOpenTrash`, `trashedCount` を追加。
   - `lucide-react` のインポートに `Trash2` を追加。
   - 「View Preferences」セクションの下部に、ゴミ箱へアクセスするための `setting-item` を追加。
