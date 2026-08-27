import { Brain, Loader2 } from 'lucide-react';
import { useAI } from '../../../../hooks/useAI';
import './AIInsights.css';

const AIInsights = ({ node, nodes, addTreeUnderNode, t }) => {
  const { getDeductiveBreakdown, isLoading, error } = useAI();

  const handleRequestDeductiveBreakdown = async () => {
    const tasksTree = await getDeductiveBreakdown(node, nodes);
    if (tasksTree && tasksTree.length > 0) {
      addTreeUnderNode(node.id, tasksTree);
    }
  };



  return (
    <div className="ai-insights-container">
      <div className="ai-actions">
        <button 
          className="ai-btn primary" 
          onClick={handleRequestDeductiveBreakdown}
          disabled={isLoading}
          style={{ backgroundColor: 'var(--brand-accent)' }}
          title="演繹的推論に基づき、最終ゴールから逆算してタスクを自動分解します"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
          <span>演繹的タスク分解</span>
        </button>
      </div>

      {error && <div className="ai-error">{error}</div>}

      {isLoading && (
        <div className="ai-loading-state">
          <div className="ai-brain-animation">
            <Brain size={32} />
          </div>
          <p>{t('ai.thinking')}</p>
        </div>
      )}


    </div>
  );
};

export default AIInsights;
