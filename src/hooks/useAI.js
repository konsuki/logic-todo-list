import { useState, useCallback } from 'react';
import { sendChatMessage } from '../logic/aiApi';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);



  const getDeductiveBreakdown = useCallback(async (node, nodes, lang = 'ja') => {
    setIsLoading(true);
    setError(null);

    // 1. 文脈収集処理（ルートからの経路）
    const path = [];
    let current = node;
    while (current) {
      path.unshift(current.title);
      current = current.parentId ? nodes[current.parentId] : null;
    }
    const contextPath = path.join(' > ');
    const finalGoal = path[0] || '';

    // 2. プロンプト作成
    const systemPrompt = `あなたは論理的思考に優れた戦略コンサルタントAIです。
以下の【基本定義】と【ワークフロー】に厳格に従い、与えられたタスクを達成するための手順を考え、必ず指定されたJSONフォーマットのみを出力してください。

## 基本定義
- 目標 Q : これから実現したい状態を表す命題。
- 真なる規則前提 : 「もし P ならば必ず Q である」という、反例のない絶対的因果関係。
- 検証プロトコル : 未知の外部リソースやAIの主観的選択を「真なる規則」として扱う前に、その属性を客観的に確定させるプロセス。

## ワークフロー
1. 目標を、簡潔な命題 Q に整形する。
2. Q を「後件（結果）」に持つ真なる規則前提を検索し、収集する。規則は必ず「もし P ならば Q」の形で記述する。
3. 【検証の組み込み】 条件部 P に「外部アセットの取得」や「非決定的な選択」が含まれる場合、まず「検証プロトコル」を実行し、その結果を新たな事実前提として固定する手順を下位目標に加える。
4. 各規則前提の条件部 P を下位目標とみなし、以下を評価する。
   - すでに P が真なら、その規則で Q は達成済みとなる。
   - P が未達成なら、P を新たな目標 Q’ として手順 2～4 を再帰的に適用する。
5. 条件部が「ユーザーが直接実行できる操作」に到達するまで分解を続ける。
6. 導出された操作手順が、不都合な別の規則前提を発動させないことを検証する。問題があれば、条件を無害化する保護を加える。
7. 最終的なアクションプランを導出する。

【出力フォーマット制限】
回答は以下の形式の再帰的なJSONのみを出力してください。マークダウンや説明テキストは一切含めないでください。最大階層（深さ）は3階層までとしてください。
\`\`\`json
{
  "tasks": [
    {
      "title": "タスク名（15文字以内）",
      "description": "具体的な手順や検証すべき事項",
      "children": [ /* さらに下位のタスクがあれば同様のオブジェクトをネスト */ ]
    }
  ]
}
\`\`\`
`;

    const userMessage = `最終ゴール: 「${finalGoal}」
現在の文脈（ルートからの経路）: ${contextPath}
今回達成すべき目標タスク: 「${node.title}」

上記のタスクを達成するための手順を考え、JSONで出力してください。`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
      const response = await sendChatMessage(fullPrompt);
      
      // JSONパース（マークダウンブロックを除去する安全装置）
      const jsonStrMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonStrMatch ? (jsonStrMatch[1] || jsonStrMatch[0]) : response;
      
      const parsed = JSON.parse(jsonStr);
      return parsed.tasks || [];
    } catch (err) {
      console.error("Failed to parse AI response as JSON", err);
      setError("AIの応答形式が正しくありませんでした。もう一度お試しください。");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getDeductiveBreakdown, isLoading, error };
};
