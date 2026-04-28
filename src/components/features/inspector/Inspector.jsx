import React from 'react';
import { Target, ChevronUp, ChevronDown, Info, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import AIInsights from './AIInsights';
import './Inspector.css';

const Inspector = ({ 
  selectedNodeId, 
  nodes, 
  addNode, 
  onSelectNode, 
  updateNode, 
  onDeleteNode, 
  t, 
  lang 
}) => {
  const node = nodes[selectedNodeId];

  if (!node) {
    return (
      <div className="inspector-empty">
        <Info size={48} color="var(--border-color)" />
        <p>{t('inspector.empty')}</p>
      </div>
    );
  }

  const getPathToRoot = (id) => {
    const path = [];
    let currentId = nodes[id]?.parentId;
    while (currentId && nodes[currentId]) {
      path.unshift(nodes[currentId]);
      currentId = nodes[currentId].parentId;
    }
    return path;
  };

  const pathToRoot = getPathToRoot(selectedNodeId);
  const children = node.children.map(id => nodes[id]).filter(Boolean);
  
  const showMeceWarning = (node.type === 'STRATEGY' || node.type === 'GOAL') && children.length === 1;

  const handleDescriptionChange = (e) => {
    updateNode(selectedNodeId, { description: e.target.value });
  };

  return (
    <div className="inspector-container">
      <header className="inspector-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className={`node-type-tag ${node.type.toLowerCase()}`}>{node.type}</span>
          <button 
            className="delete-btn-subtle" 
            onClick={() => {
              if (window.confirm(t('common.confirm_delete'))) {
                onDeleteNode(node.id);
              }
            }}
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h2>{node.title}</h2>
        <div className="inspector-progress">
          <div className="progress-label">{t('inspector.progress')}</div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${node.progress}%`,
                backgroundColor: node.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'
              }} 
            />
          </div>
          <span className="progress-value">{node.progress}%</span>
        </div>
      </header>

      {/* AI Assistance Section */}
      <AIInsights 
        node={node} 
        nodes={nodes} 
        addNode={addNode} 
        lang={lang} 
        t={t} 
      />

      {showMeceWarning && (
        <div className="inspector-warning-card">
          <AlertTriangle size={18} color="var(--warning-color)" />
          <div>
            <h4>{t('inspector.logic_gap_title')}</h4>
            <p>{t('inspector.logic_gap_desc')}</p>
          </div>
        </div>
      )}

      <section className="inspector-section">
        <h3 className="section-title">
          <ChevronUp size={14} /> {t('inspector.why')}
        </h3>
        <div className="why-path">
          {pathToRoot.length === 0 ? (
            <div className="path-item root">
              <Target size={14} />
              <span>{t('inspector.root_goal')}</span>
            </div>
          ) : (
            pathToRoot.map((n, i) => (
              <div 
                key={n.id} 
                className="path-item linkable" 
                onClick={() => onSelectNode(n.id)}
              >
                <div className="path-dot" />
                <span className="path-title">{n.title}</span>
                <ExternalLink size={12} className="link-icon" />
              </div>
            ))
          )}
          <div className="path-item active">
            <div className="path-dot active" />
            <span className="path-title current">{node.title}</span>
          </div>
        </div>
        <p className="logic-guide">
          {pathToRoot.length > 0 
            ? t('inspector.achieve_context', { parent: pathToRoot[pathToRoot.length - 1].title })
            : t('inspector.focus_objective')}
        </p>
      </section>

      <section className="inspector-section">
        <h3 className="section-title">
          <ChevronDown size={14} /> {t('inspector.how')}
        </h3>
        <div className="how-list">
          {children.length === 0 ? (
            <div className="empty-how">
              <p>{t('inspector.no_subtasks')}</p>
              <p className="hint">{t('inspector.breakdown_hint')}</p>
            </div>
          ) : (
            children.map(child => (
              <div 
                key={child.id} 
                className="how-item"
                onClick={() => onSelectNode(child.id)}
              >
                <span className={`status-dot ${child.status.toLowerCase()}`} />
                <span className="how-title">{child.title}</span>
                <span className="how-percent">{child.progress}%</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="inspector-section">
        <h3 className="section-title">{t('inspector.description')}</h3>
        <textarea 
          className="description-area"
          placeholder={t('inspector.placeholder_desc')}
          defaultValue={node.description}
          onBlur={handleDescriptionChange}
        />
      </section>
    </div>
  );
};

export default Inspector;
