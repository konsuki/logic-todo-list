# 実装プラン：フェーズバッジの表示・非表示設定 (R14)

## 大まかな手順

1. **SettingsContext の更新**: `src/logic/SettingsContext.jsx` に `showPhaseBadges` 設定を追加する。
    - `useState` の初期値オブジェクトに `showPhaseBadges: true` を追加。
2. **i18n の更新**: `src/logic/i18n.js` に新しい設定項目の翻訳テキストを追加する。
    - `ja` と `en` の `settings` セクションに `show_phase_badges` と `show_phase_badges_desc` を追加。
3. **SettingsPanel の更新**: `src/components/features/settings/SettingsPanel.jsx` に切り替え用のトグルスイッチを追加する。
    - 「表示設定」セクション（`SettingsPanel.jsx` 内の該当箇所）に、他の設定項目（`showDescriptionInList` 等）と同様の構造で `showPhaseBadges` 用の UI を追加。
    - `lucide-react` から適切なアイコン（例: `Tag`）をインポートして使用。
4. **ListView の更新**: `src/components/features/list/ListView.jsx` で `settings.showPhaseBadges` を参照し、バッジの表示を制御する。
    - `ArboristNode` コンポーネント内のフェーズバッジ描画部分を `{settings.showPhaseBadges && data.phase && (...)}` のようにラップする。

---
*※ 以降のターンで各手順を詳細化します。*
