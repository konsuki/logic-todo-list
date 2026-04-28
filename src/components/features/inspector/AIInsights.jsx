import React, { useState } from 'react';
import { Sparkles, Brain, Plus, Loader2, Check } from 'lucide-react';
import { useAI } from '../../../hooks/useAI';
import { NODE_TYPES } from '../../../logic/treeLogic';
import './AIInsights.css';

const AIInsights = ({ node, nodes, addNode, lang, t }) => {
  const { getBreakdownSuggestions, getLogicAudit, isLoading, error } = useAI();
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [audit, setAudit] = useState(null);

  const handleRequestBreakdown = async () => {
    const parentNode = node.parentId ? nodes[node.parentId] : null;
    const results = await getBreakdownSuggestions(node.title, parentNode?.title, node.type, lang);
    setSuggestions(results);
    setSelectedSuggestions(new Set(results)); // Default all selected
  };

  const handleRequestAudit = async () => {
    const childrenTitles = node.children.map(id => nodes[id]?.title).filter(Boolean);
    if (childrenTitles.length === 0) return;
    const result = await getLogicAudit(node.title, childrenTitles, lang);
    setAudit(result);
  };

  const handleAddSelected = () => {
    const nextType = node.type === NODE_TYPES.GOAL ? NODE_TYPES.STRATEGY : NODE_TYPES.ACTION;
    selectedSuggestions.forEach(title => {
      addNode(node.id, nextType, title);
    });
    setSuggestions([]);
    setSelectedSuggestions(new Set());
  };

  const toggleSuggestion = (title) => {
    const next = new Set(selectedSuggestions);
    if (next.has(title)) next.delete(title);
    else next.add(title);
    setSelectedSuggestions(next);
  };

  return (
    <div className="ai-insights-container">
      <div className="ai-actions">
        <button 
          className="ai-btn primary" 
          onClick={handleRequestBreakdown}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          <span>{t('ai.request_breakdown')}</span>
        </button>
        
        {node.children.length > 0 && (
          <button 
            className="ai-btn secondary" 
            onClick={handleRequestAudit}
            disabled={isLoading}
          >
            <Brain size={16} />
            <span>{t('ai.request_audit')}</span>
          </button>
        )}
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

      {!isLoading && suggestions.length > 0 && (
        <div className="ai-suggestions-list">
          <h4>{t('ai.suggestions_title')}</h4>
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className={`suggestion-item ${selectedSuggestions.has(s) ? 'selected' : ''}`}
              onClick={() => toggleSuggestion(s)}
            >
              <div className="checkbox">
                {selectedSuggestions.has(s) && <Check size={12} />}
              </div>
              <span>{s}</span>
            </div>
          ))}
          <button className="add-selected-btn" onClick={handleAddSelected}>
            <Plus size={14} /> {t('ai.add_to_tree')}
          </button>
        </div>
      )}

      {!isLoading && audit && (
        <div className="ai-audit-result">
          <div className="audit-header">
            <Brain size={14} />
            <span>AI Advice</span>
          </div>
          <p>{audit}</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
