# 実行手順専用テキストエリア 実装プラン

## 大まかな手順

1. **treeLogic.js にフィールド追加** — `addNodes` と `addFolder` の新規ノード生成時に `procedure: ''` を追加
   - `addNodes` 内のノードオブジェクト生成部分（`intent: ''` の直後）に `procedure: ''` を追加
   - `addFolder` 内のフォルダオブジェクト生成部分（`intent: ''` の直後）に `procedure: ''` を追加
   - 既存ノードは `node.procedure || ''` で空文字扱いになるためマイグレーション不要

   **詳細**:
   - `src/logic/treeLogic.js` の `addNodes`（titles.forEach 内の newNode 生成部分、約 318〜337 行）で、`intent: '',` の直下に `procedure: '',` を追加する。
   - 同ファイルの `addFolder`（folder オブジェクト生成部分、約 921〜940 行）で、`intent: '',` の直下に `procedure: '',` を追加する。
   - いずれも既存の `intent: ''` と同じ初期化パターンに揃える。
   - 修正後、`grep -rn "intent: ''" src/logic/treeLogic.js` で 2 箇所あることを確認し、それぞれの直下に `procedure: ''` が追加されていることを目視確認する。

2. **i18n.js にキー追加** — `inspector.procedure` / `inspector.placeholder_procedure` を日英両方に追加
   - ja: `procedure: '実行手順'`, `placeholder_procedure: 'このタスクを実行する具体的な手順を書く...'`
   - en: `procedure: 'Procedure'`, `placeholder_procedure: 'Describe the concrete steps to carry out this task...'`
   - 追加位置は既存の `intent` / `placeholder_intent` の直下

   **詳細**:
   - `src/logic/i18n.js` の ja 側 inspector オブジェクト（約 46〜69 行）で、`intent: '詳細意図',` の直下に `procedure: '実行手順',` を、`placeholder_intent: '...'` の直下に `placeholder_procedure: 'このタスクを実行する具体的な手順を書く...'` を追加する。
   - 同様に en 側 inspector オブジェクト（約 180〜183 行）で、`intent: 'Detailed Intent',` の直下に `procedure: 'Procedure',` を、`placeholder_intent: '...'` の直下に `placeholder_procedure: 'Describe the concrete steps to carry out this task...'` を追加する。
   - ラベルキーとプレースホルダーキーはそれぞれ隣接配置（`intent` 直後・`placeholder_intent` 直後）とし、既存の並び順の規約に合わせる。

3. **Inspector.jsx を更新** — `DEFAULT_SECTION_ORDER` に `'procedure'` を追加し、`sectionMap` に `procedure` エントリを追加
   - `DEFAULT_SECTION_ORDER`: `intent` の直後に `'procedure'` を追加（3番目）
   - `sectionMap`: `intent` と同様に `<InspectorTextarea>` を使うエントリを追加（`value={node.procedure || ''}`）

   **詳細**:
   - `src/components/features/inspector/Inspector.jsx` の 12 行目 `DEFAULT_SECTION_ORDER` を `['description', 'intent', 'procedure', 'folder', 'ai', 'schedule', 'dependency', 'why', 'how']` に変更する（`intent` の直後に `'procedure'` を挿入）。
   - 同ファイルの `sectionMap`（約 152〜507 行）で、`intent` エントリ（165〜175 行）の直後に `procedure` エントリを追加する。内容は `intent` を雛形にし、以下とする:
     - `nodeId={selectedNodeId}`
     - `value={node.procedure || ''}`
     - `onChange={(text) => updateNode(selectedNodeId, { procedure: text })}`
     - `onModalChange={(text) => updateNode(node.id, { procedure: text })}`
     - `label={t('inspector.procedure')}`
     - `placeholder={t('inspector.placeholder_procedure')}`
     - `t={t}`
   - `InspectorTextarea` コンポーネント自体の変更は行わない（既存の description / intent と同じ挙動をそのまま流用）。

4. **整合性チェックとコミット** — `docs/` を grep で検索し不整合がないか確認、REVISIONS.md を完了へ移動、コミット

   **詳細**:
   - 連鎖修正プロトコル: `procedure` / `実行手順` / `inspector.procedure` をキーワードに `docs/` ディレクトリ全体を `grep -rn` し、古い記述との矛盾がないか確認する。今回新規フィールドのため、矛盾する既存記述は無い想定だが念のため確認する。
   - `src/` 全体を `grep -rn "procedure"` し、追加した 3 ファイル（treeLogic.js / i18n.js / Inspector.jsx）以外に意図しない参照漏れがないか確認する。
   - `docs/REVISIONS.md` の「未完了」セクションから `[79]` を削除し「完了済み」へ移動する（日付 08-22、リンク先 features/inspector_procedure_textarea/spec.md）。
   - `git add` して `feat: インスペクターに実行手順（procedure）テキストエリアを追加` でコミットする。
   - 作業ブランチ名（feature/inspector-procedure-textarea）をユーザーに報告し、マージの承認を求める。

---

各手順の詳細は以下に順次追記する。
