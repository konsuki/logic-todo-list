import React, { useState } from 'react';
import { Target, ChevronUp, ChevronDown, Info, ExternalLink, Trash2, AlertTriangle, Link, X, Plus, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import AIInsights from './AIInsights';
import './Inspector.css';

const Inspector = ({ 
  selectedNodeId, 
  nodes, 
  addNode, 
  addNodes,
  onSelectNode, 
  updateNode, 
  onDeleteNode,
  addDependency,
  removeDependency,
  reorderNode,
  t, 
  lang 
}) => {
  const node = nodes[selectedNodeId];
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

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
  
  // Dependency data
  const predecessors = (node.dependsOn || []).map(id => nodes[id]).filter(Boolean);
  const searchResults = searchQuery.trim() 
    ? Object.values(nodes).filter(n => 
        n.id !== node.id && 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(node.dependsOn || []).includes(n.id)
      ).slice(0, 5)
    : [];

  const showMeceWarning = (node.type === 'STRATEGY' || node.type === 'GOAL') && children.length === 1;

  const handleDescriptionChange = (e) => {
    updateNode(selectedNodeId, { description: e.target.value });
  };

  const handlePhaseChange = (e) => {
    updateNode(selectedNodeId, { phase: e.target.value });
  };

  const handleDueDateChange = (e) => {
    updateNode(selectedNodeId, { dueDate: e.target.value });
  };

  const renderDescription = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s\n]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="description-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part} <ExternalLink size={10} style={{ marginLeft: '2px', verticalAlign: 'middle' }} />
          </a>
        );
      }
      return part;
    });
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
        addNodes={addNodes}
        lang={lang} 
        t={t} 
      />

      {/* Schedule & Phase Section */}
      <section className="inspector-section">
        <h3 className="section-title">
          <Calendar size={14} /> {t('inspector.schedule')}
        </h3>
        <div className="schedule-controls">
          <div className="control-group">
            <label>{t('inspector.phase')}</label>
            <select 
              value={node.phase || 'PREP'} 
              onChange={handlePhaseChange}
              className="phase-select"
            >
              <option value="PREP">{t('phases.PREP')}</option>
              <option value="EXEC">{t('phases.EXEC')}</option>
              <option value="REVIEW">{t('phases.REVIEW')}</option>
            </select>
          </div>
          <div className="control-group">
            <label>{t('inspector.due_date')}</label>
            <input 
              type="date" 
              value={node.dueDate || ''} 
              onChange={handleDueDateChange}
              className="date-input"
            />
          </div>
        </div>

        <div className="order-controls">
          <label className="section-subtitle">{t('inspector.order_section')}</label>
          <div className="order-buttons">
            <button 
              className="order-btn" 
              onClick={() => reorderNode(node.id, 'up')}
              title={t('inspector.move_up')}
            >
              <ArrowUp size={14} /> {t('inspector.move_up')}
            </button>
            <button 
              className="order-btn" 
              onClick={() => reorderNode(node.id, 'down')}
              title={t('inspector.move_down')}
            >
              <ArrowDown size={14} /> {t('inspector.move_down')}
            </button>
          </div>
        </div>
      </section>

      {/* Dependency Management Section */}
      <section className="inspector-section">
        <h3 className="section-title">
          <Link size={14} /> {t('inspector.predecessors')}
        </h3>
        <div className="dependency-manager">
          <div className="current-dependencies">
            {predecessors.length === 0 ? (
              <p className="empty-text">{t('inspector.no_predecessors')}</p>
            ) : (
              predecessors.map(p => (
                <div key={p.id} className="dependency-tag">
                  <span onClick={() => onSelectNode(p.id)}>{p.title}</span>
                  <button onClick={() => removeDependency(node.id, p.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="dependency-search">
            <input 
              type="text" 
              placeholder={t('inspector.search_to_link')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(r => (
                  <div 
                    key={r.id} 
                    className="search-result-item"
                    onClick={() => {
                      addDependency(node.id, r.id);
                      setSearchQuery('');
                    }}
                  >
                    <span>{r.title}</span>
                    <Plus size={12} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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
        <div className="section-header-with-action">
          <h3 className="section-title">{t('inspector.description')}</h3>
          {!isEditingDesc && node.description && (
            <button className="edit-subtle-btn" onClick={() => setIsEditingDesc(true)}>
              {t('common.edit') || 'Edit'}
            </button>
          )}
        </div>
        
        {isEditingDesc || !node.description ? (
          <textarea 
            key={node.id}
            autoFocus={isEditingDesc}
            className="description-area"
            placeholder={t('inspector.placeholder_desc')}
            defaultValue={node.description || ''}
            onBlur={(e) => {
              handleDescriptionChange(e);
              setIsEditingDesc(false);
            }}
          />
        ) : (
          <div 
            className="description-display" 
            onClick={() => setIsEditingDesc(true)}
            title="Click to edit"
          >
            {renderDescription(node.description)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Inspector;
