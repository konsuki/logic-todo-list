# インスペクター項目の説明アイコン 実装プラン

## 大まかな手順

1. **i18n.js に説明文キー追加** — `inspector.procedure_help` / `inspector.order_section_help` を日英両方に追加
   - ja: 実行手順・実行順序それぞれの意味を説明する文章
   - en: 対応する英文
   - 追加位置は既存の `procedure` / `order_section` の直下

   **詳細**:
   - `src/logic/i18n.js` の ja 側 inspector オブジェクトで、`procedure: '実行手順',`（約 53 行）の直下に `procedure_help: '...'` を追加する。
   - 同様に ja 側 `order_section: '実行順序 (ステップ)',`（約 71 行）の直下に `order_section_help: '...'` を追加する。
   - en 側 inspector オブジェクトでも、`procedure: 'Procedure',`（約 184 行）直下と `order_section: 'Execution Order (Steps)',`（約 202 行）直下にそれぞれ対応する英文を追加する。
   - 説明文の内容（spec の i18n 表と一致させる）:
     - `procedure_help` ja: `このタスクを実行するための具体的な手順・段取りを書く場所です。実行の順番や詳細なステップを自由に記述できます。`
     - `procedure_help` en: `A place to describe the concrete steps and process to carry out this task. Write the order and detailed steps freely.`
     - `order_section_help` ja: `親タスク直下の兄弟タスクの中で、このタスクが実行される予定の順番を表す設定です。上下ボタンで変更できます。`
     - `order_section_help` en: `The planned execution order of this task among its sibling tasks under the parent. Adjust with the up/down buttons.`

2. **InspectorTextarea.jsx に helpText prop 追加** — 指定時のみラベル右隣に説明アイコンを表示
   - `Info` アイコンを import
   - `helpText` が指定された場合のみ `.help-icon`（`data-tooltip` 付き）を表示

   **詳細**:
   - `src/components/features/inspector/InspectorTextarea.jsx` の import 行（1 行目）に `Info` を追加する。現在 `import { ExternalLink, Maximize2 } from 'lucide-react';` なので `import { ExternalLink, Maximize2, Info } from 'lucide-react';` に変更する。
   - コンポーネントの引数（28 行目）`({ nodeId, value, onChange, onModalChange, label, placeholder, t })` に `helpText` を追加する。
   - `<h3 className="section-title">{label}</h3>`（40 行目）を、`helpText` 指定時にアイコンが右隣に来るよう変更する。例:
     ```
     <h3 className="section-title">
       {label}
       {helpText && (
         <span className="help-icon" data-tooltip={helpText} tabIndex={0} aria-label={helpText}>
           <Info size={13} />
         </span>
       )}
     </h3>
     ```
   - `helpText` 未指定の場合は従来どおり `{label}` のみ表示（description / intent はアイコンなしのまま）。
   - `span` に `tabIndex={0}` と `aria-label` を付け、キーボードフォーカスでツールチップを出せるようにする。

3. **Inspector.jsx を更新** — `procedure` エントリに `helpText` を渡し、`order_section` ラベル右隣に説明アイコンを追加
   - `procedure` エントリ: `<InspectorTextarea ... helpText={t('inspector.procedure_help')} />`
   - `schedule` セクションの `order-controls`: ラベル右隣に `.help-icon` を配置

   **詳細**:
   - `src/components/features/inspector/Inspector.jsx` の `procedure` エントリ（`sectionMap` 内、約 177〜187 行）の `<InspectorTextarea>` に `helpText={t('inspector.procedure_help')}` を追加する。
   - 同ファイルの `schedule` セクション内 `order-controls`（約 264〜265 行）の `<label className="section-subtitle">{t('inspector.order_section')}</label>` を、ラベル右隣にアイコンが来るように変更する。例:
     ```
     <div className="section-subtitle-row">
       <label className="section-subtitle">{t('inspector.order_section')}</label>
       <span className="help-icon" data-tooltip={t('inspector.order_section_help')} tabIndex={0} aria-label={t('inspector.order_section_help')}>
         <Info size={13} />
       </span>
     </div>
     ```
   - 既存の `.section-subtitle` は `display: block` のため、横並びにするための `.section-subtitle-row`（flex）を新設する（詳細は手順 4 の CSS で定義）。
   - `Info` アイコンは既に `Inspector.jsx` 4 行目で import 済みのため追加不要。

4. **Inspector.css にツールチップスタイル追加** — `.help-icon` と `::after` / `::before` によるカスタムツールチップを実装
   - 既存 CSS 変数を使用し、glass デザインに合わせる
   - `:hover` / `:focus-visible` で表示

   **詳細**:
   - `src/components/features/inspector/Inspector.css` の末尾に以下のスタイルを追加する。
   - `.help-icon`:
     - `display: inline-flex; align-items: center; justify-content: center;`
     - `position: relative; cursor: help; color: var(--text-muted);`
     - `transition: color 0.2s;`
     - hover / focus 時 `color: var(--primary-color);`
   - `.section-subtitle-row`: `display: flex; align-items: center; gap: 6px;` でラベルとアイコンを横並びにする。
   - ツールチップ（`.help-icon::after` が吹き出し本体、`.help-icon::before` が矢印）:
     - `position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(4px);`
     - `content: attr(data-tooltip);` で説明文を表示
     - 本体: `background: var(--surface-color); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 12px; line-height: 1.5; width: max-content; max-width: 260px; white-space: normal; text-transform: none; letter-spacing: normal; box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--primary-glow);`
     - 矢印: `border: 5px solid transparent; border-top-color: var(--surface-color); bottom: calc(100% + 3px);`
     - 既定は `opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;`
     - `.help-icon:hover::after` / `.help-icon:focus-visible::after`（および `::before`）で `opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);`
   - 注意: `.section-title` / `.section-subtitle` は `text-transform: uppercase` が効いているが、ツールチップ内は `text-transform: none` を明示して説明文が大文字化されないようにする。
   - `.inspector-container` に `overflow: hidden` は無いため、ツールチップはクリップされない（確認済み）。

5. **整合性チェックとコミット** — grep で不整合確認、REVISIONS.md を完了へ移動、コミット

   **詳細**:
   - 連鎖修正プロトコル: `help-icon` / `procedure_help` / `order_section_help` / `data-tooltip` をキーワードに `docs/` と `src/` を `grep -rn` し、追加した参照以外に矛盾や漏れがないか確認する。
   - `src/` で `help-icon` / `helpText` / `procedure_help` / `order_section_help` を grep し、想定したファイル（i18n.js / InspectorTextarea.jsx / Inspector.jsx / Inspector.css）にのみ変更が及んでいることを確認する。
   - `docs/REVISIONS.md` の「未完了」セクションから `[80]` を削除し「完了済み」へ移動する（日付 08-22、リンク先 features/inspector_section_help_icons/spec.md）。
   - `git add` して `feat: インスペクターの項目に説明アイコン（ヘルプツールチップ）を追加` でコミットする。
   - 作業ブランチ名（feature/inspector-section-help-icons）をユーザーに報告し、マージの承認を求める。

---

各手順の詳細は以下に順次追記する。
