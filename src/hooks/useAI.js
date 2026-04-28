import { useState, useCallback } from 'react';
import { sendChatMessage } from '../logic/aiApi';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getBreakdownSuggestions = useCallback(async (nodeTitle, parentTitle, type, lang = 'ja') => {
    setIsLoading(true);
    setError(null);

    const systemPrompt = lang === 'ja' 
      ? "あなたはMECE（漏れなくダブりなく）に精通した戦略コンサルタントです。論理ツリーの分解と、実行順序の最適化を支援してください。"
      : "You are a strategic consultant expert in MECE and project planning. Help with logic tree decomposition and execution ordering.";
    
    const userMessage = lang === 'ja'
      ? `目標「${nodeTitle}」（親の文脈: ${parentTitle || 'なし'}）を達成するための、具体的でMECEな${type === 'GOAL' ? '戦略' : 'アクション'}を3〜5つ提案してください。
         【ルール】
         1. タイトルは15文字以内で簡潔に。
         2. 詳細は「説明」として具体的に記述。
         3. 実行すべき順番（時系列順）に並べてください。

         回答は以下の形式で、各提案を[SUGGESTION]で始め、タイトルと説明を「|」で区切ってください。
         例:
         [SUGGESTION] 市場調査 | 競合他社のサービス内容と価格帯を調査し、自社の立ち位置を明確にする。
         [SUGGESTION] コンテンツ作成 | 調査結果に基づき、ターゲットに刺さるランディングページのコピーを作成する。`
      : `Provide 3-5 specific, MECE ${type === 'GOAL' ? 'strategies' : 'actions'} to achieve "${nodeTitle}" (Context: ${parentTitle || 'None'}).
         [RULES]
         1. Titles MUST be concise (under 5 words).
         2. Put all details in the "Description".
         3. List them in chronological order.

         Format: Start each suggestion with [SUGGESTION], separating title and description with "|".
         Example:
         [SUGGESTION] Market Research | Research competitor services and pricing to define our positioning.
         [SUGGESTION] Content Creation | Create high-converting landing page copy based on research.`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
      const response = await sendChatMessage(fullPrompt);
      
      // Parse suggestions into { title, description } objects
      const suggestions = response
        .split('\n')
        .filter(line => line.includes('[SUGGESTION]'))
        .map(line => {
          const content = line.replace(/.*\[SUGGESTION\]\s*/, '').trim();
          const [title, ...descParts] = content.split('|');
          return {
            title: title.trim(),
            description: descParts.join('|').trim() || ''
          };
        })
        .filter(s => s.title);

      return suggestions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLogicAudit = useCallback(async (nodeTitle, childrenTitles, lang = 'ja') => {
    setIsLoading(true);
    setError(null);

    const systemPrompt = lang === 'ja'
      ? "あなたは論理的思考のコーチです。論理ツリーの整合性をチェックし、短く的確なアドバイスをください。"
      : "You are a logical thinking coach. Check the consistency of the logic tree and provide brief, accurate advice.";

    const userMessage = lang === 'ja'
      ? `「${nodeTitle}」を以下の要素に分解しました：\n${childrenTitles.map(t => `- ${t}`).join('\n')}
         この分解に漏れや重複がないか、または論理的な飛躍がないかチェックし、100文字程度でアドバイスをください。`
      : `I broke down "${nodeTitle}" into:\n${childrenTitles.map(t => `- ${t}`).join('\n')}
         Check for gaps, overlaps, or logical leaps, and provide advice in about 20 words.`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
      const response = await sendChatMessage(fullPrompt);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getBreakdownSuggestions, getLogicAudit, isLoading, error };
};
