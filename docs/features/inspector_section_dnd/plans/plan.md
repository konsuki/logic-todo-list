# T2 インスペクター並び替えDnD 実装プラン

## 大まかな手順

1. **依存ライブラリのインストール** — `@dnd-kit/core` と `@dnd-kit/sortable` を追加
   - インストール: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - `@dnd-kit/core`: DragContext・センサー・イベント管理
   - `@dnd-kit/sortable`: useSortable フック・SortableContext・verticalListSortingStrategy
   - `@dnd-kit/utilities`: CSS.Transform.toString ユーティリティ
2. **セクション順序の状態管理** — localStorage との連携込みで Inspector に `sectionOrder` state を追加
   - `DEFAULT_SECTION_ORDER = ['description', 'ai', 'schedule', 'dependency', 'why', 'how']` を定数定義
   - `useState` 初期化を関数形式にし、localStorage から読み込み（なければデフォルト順）
   - 読み込み時にデフォルトにない要素を除外・足りない要素を末尾追加するマージ処理を入れる
   - `handleSectionReorder(newOrder)` 関数: setSectionOrder + localStorage 書き込みをまとめる
3. **並び替えモードのトグル** — `inspector-header` 右端にボタンを追加、`isReorderMode` state で切替
   - `isReorderMode` state を追加
   - `inspector-header` 右端（削除ボタンの隣）に GripVertical アイコンのトグルボタンを追加
   - `active` クラスで ON 時にハイライト（primary-color）
   - Inspector.css に `.reorder-toggle-btn` / `.reorder-toggle-btn.active` を追加
4. **SortableSection ラッパーコンポーネントの作成** — dnd-kit の useSortable を使い、ハンドル付きでセクションを包む
   - `src/components/features/inspector/SortableSection.jsx` を新規作成
   - `listeners` をハンドル `<div>` にのみ付与（ハンドル限定ドラッグ）
   - `isDragging` 時に `opacity: 0.4` で半透明化
   - `isReorderMode` が false の時はハンドルを非表示
   - Inspector.css に `.drag-handle` / `.sortable-section.is-dragging` を追加
5. **Inspector.jsx のセクション配置リファクタ** — 6つのセクションを `sectionOrder` に従い動的にレンダリング
   - 各セクション JSX を `sectionMap` オブジェクトにまとめる
   - `DndContext` + `SortableContext` で全セクションを包む
   - `useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))` でクリックとの誤判定防止
   - `handleDragEnd` で `arrayMove` を使って `sectionOrder` を更新
   - `showMeceWarning` カードは `sectionMap` の外で `how` セクション直前に固定配置
6. **スタイル調整** — ハンドル・ドラッグ中フィードバック・トグルボタンの CSS を追加
   - `.reorder-toggle-btn` / `.reorder-toggle-btn.active`
   - `.sortable-section` / `.sortable-section.is-dragging`
   - `.drag-handle` / `.drag-handle:active`
   - `.inspector-container.reorder-mode` (padding-left: 28px)

---

各手順の詳細は以下に順次追記する。
