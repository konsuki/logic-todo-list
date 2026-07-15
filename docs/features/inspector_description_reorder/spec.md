# インスペクター：説明・メモの位置移動 仕様書

## 1. 誰の、どんな困りごとを解決するのか
- **対象者**: 説明・メモを頻繁に使うユーザー。
- **困りごと**: 説明・メモセクションがインスペクターの一番下にあるため、毎回スクロール → クリック → 入力という手順を踏む必要があり、使用のたびにストレスになる。
- **解決策**: 説明・メモセクションを `inspector-header` の直下（2番目）に移動し、スクロールなしで即アクセスできるようにする。

## 2. 画面やデータの流れ

### 変更前の並び順
1. `inspector-header`（タイトル・進捗）
2. AIInsights
3. Schedule & Phase
4. Dependency Management
5. Warning（条件付き）
6. Why?
7. How?
8. **Description（説明・メモ）**

### 変更後の並び順
1. `inspector-header`（タイトル・進捗）
2. **Description（説明・メモ）← 移動**
3. AIInsights
4. Schedule & Phase
5. Dependency Management
6. Warning（条件付き）
7. Why?
8. How?

## 3. 普通ではないケース・境界条件
- `isEditingDesc` と `node.description` による表示切り替えロジックはそのまま維持。
- `autoFocus={isEditingDesc}` は既存条件を維持（`isEditingDesc` が true の時だけ）。位置が変わっても意図せずフォーカスが当たることはない。

## 4. 変更スコープ
- **やること**: `Inspector.jsx` 内のJSXブロックの並び替えのみ。
- **やらないこと**: CSS変更、ロジック変更、データ構造変更、他セクションへの変更。
