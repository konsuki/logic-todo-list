import React from 'react';
import { Target, ChevronUp, ChevronDown, Info, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import './Inspector.css';

const Inspector = ({ selectedNodeId, nodes, onSelectNode, updateNode, onDeleteNode }) => {
  const node = nodes[selectedNodeId];

  if (!node) {
    return (
      <div className="inspector-empty">
        <Info size={48} color="var(--border-color)" />
        <p>Select a task to view its logic context</p>
      </div>
    );
  }

  // Get path to root (Why)
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
  
  // MECE Warning: If it's a Strategy/Goal and has only 1 child
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
              if (window.confirm('Are you sure you want to delete this task and all its sub-tasks?')) {
                onDeleteNode(node.id);
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h2>{node.title}</h2>
        <div className="inspector-progress">
          <div className="progress-label">Overall Progress</div>
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

      {showMeceWarning && (
        <div className="inspector-warning-card">
          <AlertTriangle size={18} color="var(--warning-color)" />
          <div>
            <h4>Logic Gap Warning</h4>
            <p>This node only has one child. A proper logic tree breakdown usually requires at least two mutually exclusive elements (MECE).</p>
          </div>
        </div>
      )}

      <section className="inspector-section">
        <h3 className="section-title">
          <ChevronUp size={14} /> Why? (Purpose)
        </h3>
        <div className="why-path">
          {pathToRoot.length === 0 ? (
            <div className="path-item root">
              <Target size={14} />
              <span>This is a top-level goal.</span>
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
      </section>

      <section className="inspector-section">
        <h3 className="section-title">
          <ChevronDown size={14} /> How? (Execution)
        </h3>
        <div className="how-list">
          {children.length === 0 ? (
            <div className="empty-how">
              <p>No sub-tasks defined yet.</p>
              <p className="hint">Break this down into smaller, actionable steps.</p>
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
        <h3 className="section-title">Description & Notes</h3>
        <textarea 
          className="description-area"
          placeholder="Add notes or detailed requirements..."
          defaultValue={node.description}
          onBlur={handleDescriptionChange}
        />
      </section>
    </div>
  );
};

export default Inspector;
