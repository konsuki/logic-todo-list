# GitHub Actions Theme Implementation Plan

## 大まかな手順
1. **テーマ定義の追加**: `src/constants/themes.js` に `github` テーマのカラーパレットを追加する。
2. **多言語対応（i18n）の更新**: `src/logic/i18n.js` に新しいテーマ名の翻訳を追加する。
3. **設定UIの更新**: `src/components/features/settings/SettingsPanel.jsx` のセレクトボックスに `github` テーマの選択肢を追加する。
4. **UIの微調整**: ノードデザインがGitHub Actions風に見えるように、グローバルCSSまたは各コンポーネントのCSS（ボーダー半径、ボーダーの太さ等）がテーマ変数で適切に機能するか確認し、必要であればCSS変数を追加・調整する。

---

## 手順の詳細化

### 1. テーマ定義の追加
- 対象ファイル: `src/constants/themes.js`
- 追加内容:
  `themes` オブジェクトに `github` キーを追加し、`dark` と `light` のモードごとのカラーパレットを定義する。
  背景色、サーフェス色（ノード色）、ボーダー色などをGitHubのUI仕様（#0d1117, #f6f8fa等）に合わせて設定する。

### 2. 多言語対応（i18n）の更新
- 対象ファイル: `src/logic/i18n.js`
- 追加内容:
  日本語（`ja`）および英語（`en`）の `settings` オブジェクト内に、`theme_github: 'GitHub Actions'` を追加する。

### 3. 設定UIの更新
- 対象ファイル: `src/components/features/settings/SettingsPanel.jsx`
- 追加内容:
  テーマを選択する `<select>` 要素内に、`<option value="github">{t('settings.theme_github') || 'GitHub Actions'}</option>` を追加する。
  `themeName` ステートが `github` を受け取れるようにする。

### 4. UIの微調整
- 対象ファイル: `src/App.css` および各コンポーネント（特にTreeViewやNodeコンポーネント）のCSS
- 追加内容:
  GitHub Actionsのノードはボーダー（1px solid）と角丸（border-radius: 6px程度）が特徴的であるため、既存のUIがこれらのCSS変数（`--border-color`, `--surface-color`）を正しく参照しているか確認する。
  特に現状のデザインが崩れない範囲で、GitHubテーマ選択時によりフラットで四角い（少し丸みのある）印象になるよう、CSS変数経由でスタイルが適用されているかチェックする。
