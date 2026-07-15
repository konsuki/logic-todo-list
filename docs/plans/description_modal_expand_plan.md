# 実装プラン：テキストエリア モーダル拡張入力

## 大まかな手順

1. `DescriptionModal.jsx` と `DescriptionModal.css` を新規作成する
2. `Inspector.jsx` に `isDescModalOpen` state を追加し、useEffect でノード切替時にモーダルを閉じる
3. Description セクションに「拡大」ボタンを追加し、モーダルを開けるようにする
4. `Inspector.jsx` に `DescriptionModal` をマウントし、リアルタイム同期のロジックを接続する
