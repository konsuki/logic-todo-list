# 演繹的タスク分解（AI機能A）前提条件チェックリスト

このファイルの目的は2つです。

1. **使用前の確認**: ボタンを押す前にここを読んで、すべての前提条件が満たされていることを確かめる。
2. **動かない時の原因特定**: 機能しなかった場合、どの前提条件が欠けているかをここで素早く確認する。

---

## 前提条件一覧

### 条件 1：バックエンドサーバーが起動していること

「演繹的タスク分解」ボタンを押すと、フロントエンドはローカルの FastAPI サーバー（ポート 8000）へリクエストを送ります。このサーバーが起動していないと、ボタンを押しても何も起きません（ローディングが止まらないか、エラーになります）。

**確認方法：**
```bash
curl http://localhost:8000/health
```

**正常な応答例：**
```json
{"status":"healthy","mode":"parallel_pool","max_concurrent":3,"active_count":0,"session_count":0}
```

**起動していない場合の起動コマンド：**
```bash
cd ~/Desktop/Programs/deepseek-chat-api
python main.py
```

---

### 条件 2：認証ファイルが存在すること

サーバーは `deepseek_auth.json` を使って DeepSeek Web UI にログイン済みの状態でブラウザを起動します。このファイルが存在しないと、AIへのリクエストが認証エラーになります。

**確認方法：**
```bash
ls -lh ~/Desktop/Programs/deepseek-chat-api/deepseek_auth.json
```

**正常な状態：** ファイルが存在し、サイズが数 KB 以上ある。

**ファイルが存在しない・または認証エラーが出る場合：**
```bash
cd ~/Desktop/Programs/deepseek-chat-api
python login.py   # ブラウザが開くので DeepSeek にログインする
```
ログイン後に `deepseek_auth.json` が生成される。

---

### 条件 3：フロントエンド（Vite dev server）が起動していること

ブラウザから `http://localhost:5173` でアプリを開くには Vite の開発サーバーが起動している必要があります。

> **注意：** ブラウザのキャッシュにより、Vite が落ちていても画面が表示されたままに見えることがあります。画面が見えているだけでは起動確認になりません。必ずコマンドで確認してください。

**確認方法（必ずコマンドで確認すること）：**
```bash
lsof -i :5173
```
Vite のプロセスが表示されれば起動中。何も表示されなければ停止中。

**起動していない場合の起動コマンド：**
```bash
cd ~/Desktop/Programs/logic-todo-list
npm run dev
```

---

### 条件 4：タスクノードが選択されていること

インスペクターパネルに「演繹的タスク分解」ボタンが表示されるのは、ノードを選択したときだけです。何も選択していない状態ではボタン自体が表示されません。

**確認方法：** リストビューまたはツリービューでタスクをクリックし、右側のインスペクターパネルが開いていることを確認する。

---

## 動かない時の原因特定フロー

```
ボタンを押しても反応がない、またはエラーになった
       ↓
【確認1】条件1: サーバーは起動しているか？
  └─ No → python main.py で起動する
  └─ Yes
       ↓
【確認2】条件2: deepseek_auth.json は存在するか？
  └─ No / 古い → python login.py を実行して再生成する
  └─ Yes
       ↓
【確認3】条件3: ブラウザで localhost:5173 は開けているか？
  └─ No → npm run dev で Vite を起動する
  └─ Yes
       ↓
【確認4】条件4: ノードが選択されてインスペクターパネルが開いているか？
  └─ No → タスクをクリックして選択する
  └─ Yes
       ↓
上記すべて満たしているのに動かない場合：
サーバーのログを確認する
→ ~/Desktop/Programs/deepseek-chat-api/server.log
```

---

## 正常動作の確認方法（起動後のかんたんテスト）

ボタンを押す前に、以下のコマンドでサーバーがAIへの応答まで正常に動くかを確かめられます。

```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "「テスト成功」とだけ答えてください。",
    "wait_for_response": true,
    "new_chat": true,
    "model_type": "expert",
    "timeout": 120000
  }'
```

`"status":"success"` と `"response":"テスト成功"` が返れば、ボタンを押せばそのまま機能します。
