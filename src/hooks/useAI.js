import { useState, useCallback } from 'react';
import { sendChatMessage } from '../logic/aiApi';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getBreakdownSuggestions = useCallback(async (nodeTitle, parentTitle, type, lang = 'ja') => {
    setIsLoading(true);
    setError(null);

    const systemPrompt = lang === 'ja' 
      ? "あなたはMECE（漏れなくダブりなく）に精通した戦略コンサルタントです。論理ツリーの分解を支援してください。"
      : "You are a strategic consultant expert in MECE. Help with logic tree decomposition.";
    
    const userMessage = lang === 'ja'
      ? `目標「${nodeTitle}」（親の文脈: ${parentTitle || 'なし'}）を達成するための、具体的でMECEな${type === 'GOAL' ? '戦略' : 'アクション'}を3〜5つ提案してください。
         回答は以下の形式で、各提案を[SUGGESTION]で始めてください。
         例:
         [SUGGESTION] 具体的な提案1
         [SUGGESTION] 具体的な提案2`
      : `Provide 3-5 specific, MECE ${type === 'GOAL' ? 'strategies' : 'actions'} to achieve "${nodeTitle}" (Context: ${parentTitle || 'None'}).
         Format your response by starting each suggestion with [SUGGESTION].
         Example:
         [SUGGESTION] Specific suggestion 1
         [SUGGESTION] Specific suggestion 2`;

    try {
      const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
      const response = await sendChatMessage(fullPrompt);
      
      // Parse suggestions
      const suggestions = response
        .split('\n')
        .filter(line => line.includes('[SUGGESTION]'))
        .map(line => line.replace(/.*\[SUGGESTION\]\s*/, '').trim())
        .filter(Boolean);

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
