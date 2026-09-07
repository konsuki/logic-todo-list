# 実装プラン：カレンダー予定の二重作成バグ修正

## 全体方針

- 副作用（`syncCalendarEvent`）を `setNodes` の updater 関数から除去する。
- `useTodoTree` に `useEffect` を追加し、「DONE かつ timeTracking あり、calendarEventId 未設定」のノードを検出して同期する。
- 二重同期防止のため、`calendarEventId` を「同期済みマーカー」として使い、加えて in-flight ガード（同期中のノードを追跡）を追加する。

---

## 大まかな手順

### 手順 1. handleToggleStatus から副作用を除去する

- `handleToggleStatus` を「状態更新のみ」に戻す（完了打刻 `completeTimeTracking` まで）。
- `syncCalendarEvent` の呼び出しと、それに伴う description 組み立てを削除する。

### 手順 2. useEffect で同期処理を実装する

- `useTodoTree` に「DONE かつ timeTracking あり、calendarEventId 未設定」のノードを検出する `useEffect` を追加。
- 検出したノードに対して `syncCalendarEvent` を呼び、`calendarEventId` を保存。
- in-flight ガード（useRef で同期中の nodeId を追跡）を追加して二重実行を防ぐ。

### 手順 3. 検証（lint / テスト）

- `npm run lint` と `npm run test:run` で検証。

---

## 詳細手順（以下、1ステップずつ詳細化して報告する）

### 手順 1 の詳細：handleToggleStatus から副作用を除去

`src/features/todo/hooks/useTodoTree.js` の `handleToggleStatus` を、以下の形に戻す。

**修正後（状態更新のみ）**
```js
const handleToggleStatus = useCallback((nodeId) => {
  setNodes((prev) => {
    const node = prev[nodeId];
    if (!node) return prev;
    const wasDone = node.status === NODE_STATUS.DONE;
    const next = toggleNodeStatus(prev, nodeId);
    // DONE に遷移した時のみ完了時刻を打刻する（TODO に戻す時は打刻しない）
    if (!wasDone && next[nodeId]?.status === NODE_STATUS.DONE) {
      next[nodeId] = completeTimeTracking(next[nodeId], Date.now());
    }
    return next;
  });
}, []);
```

**削除するもの**
- `syncCalendarEvent(...)` の呼び出しブロック（description 組み立て、`.then` での `calendarEventId` 保存、`.catch`）をすべて削除。
- これにより `setNodes` の updater 関数は純粋（状態計算のみ）になる。

**注意**
- この時点では `syncCalendarEvent` の import は残す（手順 2 で使うため）。
- `calendarEventId` の保存処理は手順 2 の useEffect 側に移す。

### 手順 2 の詳細：useEffect で同期処理を実装

`useTodoTree` に、DONE になったノードを監視してカレンダー同期を行う `useEffect` を追加する。

**追加する ref（二重実行防止用）**
```js
const syncingRef = useRef(new Set()); // 同期中の nodeId を追跡
```

**追加する useEffect（`nodes` が変わるたびに走査）**
```js
useEffect(() => {
  for (const node of Object.values(nodes)) {
    const tt = node.timeTracking;
    // 同期対象: DONE かつ 計測済み かつ 未同期（calendarEventId なし）かつ 同期中でない
    if (
      node.status === NODE_STATUS.DONE &&
      tt?.startAt != null &&
      tt?.completedAt != null &&
      !node.calendarEventId &&
      !syncingRef.current.has(node.id)
    ) {
      syncingRef.current.add(node.id);
      const description = [
        '## 説明とメモ',
        node.description || '',
        '',
        '## 詳細意図',
        node.intent || '',
        '',
        '## 実行手順',
        node.procedure || '',
      ].join('\n');

      syncCalendarEvent({
        title: node.title,
        description,
        startAt: tt.startAt,
        completedAt: tt.completedAt,
        eventId: node.calendarEventId,
      })
        .then((eventId) => {
          setNodes((cur) => {
            const n = cur[node.id];
            if (!n) return cur;
            return { ...cur, [node.id]: { ...n, calendarEventId: eventId, updatedAt: Date.now() } };
          });
        })
        .catch((err) => {
          console.error('カレンダー同期に失敗しました:', err);
        })
        .finally(() => {
          syncingRef.current.delete(node.id);
        });
    }
  }
}, [nodes]);
```

**二重実行防止の仕組み（StrictMode 対策）**
- `calendarEventId` が無い間は「未同期」だが、`syncingRef`（同期中の Set）に入っていれば重複して開始しない。
- 同期成功で `calendarEventId` が保存され、以後は対象外になる。
- StrictMode で effect が2回走っても、2回目は `syncingRef` に既に含まれるためスキップされる。

**注意**
- `syncCalendarEvent` は `googleCalendarApi.js` から既に import 済み（手順1で残したもの）。
- ループ内で `setNodes` を呼ぶが、`finally` で `syncingRef` から削除するため、同一ノードの重複開始は起きない。

### 手順 3 の詳細：検証（lint / テスト）

- `nvm use 20` してから `npm run lint` が exit 0 になること。
- `npm run test:run` が全件 pass（既存 78 件）すること。
- 既存テストへの影響確認（`timeTracking` 等のロジックは変更しないため、テストはそのまま通る想定）。
- **動作確認（手動 E2E）**: 修正後にタスクを完了させ、カレンダーへ予定が「1つだけ」作成されることを確認する。

