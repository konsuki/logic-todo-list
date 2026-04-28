import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, CheckCircle, Circle, AlertTriangle, Lock } from 'lucide-react';
import * as treeLogic from '../../../logic/treeLogic';
import './TodoItem.css';

const TodoItem = ({ 
  node, 
  allNodes, 
  onAddChild, 
  onDelete, 
  onToggle, 
  onUpdate, 
  selectedNodeId,
  onSelectNode,
  depth = 0,
  t
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);

  const childrenCount = node.children ? node.children.length : 0;
  const hasChildren = childrenCount > 0;
  const isDone = node.status === 'DONE';
  const isSelected = selectedNodeId === node.id;
  
  // Dependency logic
  const isLocked = treeLogic.isNodeLocked(allNodes, node.id);
  const unsatisfiedDeps = (node.dependsOn || [])
    .map(id => allNodes[id])
    .filter(n => n && n.status !== 'DONE');

  const showMeceWarning = node.type === 'STRATEGY' && childrenCount === 1;

  const handleTitleSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditing(false);
      if (editTitle.trim() !== node.title) {
        onUpdate(node.id, { title: editTitle });
      }
    }
  };

  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    onSelectNode(node.id);
  };

  return (
    <div className={`todo-item-container depth-${depth} ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}>
      <div 
        className={`todo-item-row ${isDone ? 'is-done' : ''}`}
        onClick={handleRowClick}
      >
        {depth > 0 && <div className="indent-guide" style={{ left: `calc(${depth} * 24px - 12px)` }} />}

        <div className="todo-item-content" style={{ paddingLeft: `${depth * 24}px` }}>
          <button 
            className={`expand-btn ${!hasChildren ? 'invisible' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <button 
            className={`status-toggle ${isLocked ? 'disabled' : ''}`} 
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) onToggle(node.id);
            }}
            title={isLocked ? t('common.wait_for_predecessor') : ''}
          >
            {isLocked ? (
              <Lock size={18} className="icon-locked" />
            ) : isDone ? (
              <CheckCircle size={18} className="icon-success" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          <div className="node-info">
            <span className={`node-type-tag ${node.type.toLowerCase()}`}>{node.type}</span>
            {isEditing ? (
              <input
                autoFocus
                className="title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleSubmit}
                onBlur={handleTitleSubmit}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="node-title" onClick={() => setIsEditing(true)}>
                {node.title}
              </span>
            )}
            
            {showMeceWarning && (
              <div className="mece-warning-icon" title={t('inspector.logic_gap_desc')}>
                <AlertTriangle size={14} color="var(--warning-color)" />
              </div>
            )}

            {isLocked && (
              <div className="lock-badge" title={unsatisfiedDeps.map(d => d.title).join(', ')}>
                <Lock size={10} /> {unsatisfiedDeps.length}
              </div>
            )}

            {node.progress > 0 && node.progress < 100 && (
              <span className="progress-badge">{node.progress}%</span>
            )}
          </div>

          <div className="node-actions">
            <button 
              className="action-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.id);
              }} 
              title={t('list.add_child')}
            >
              <Plus size={16} />
            </button>
            <button 
              className="action-btn delete" 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(t('common.confirm_delete'))) {
                  onDelete(node.id);
                }
              }} 
              title={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="node-progress-container">
          <div 
            className="node-progress-bar" 
            style={{ 
              width: `${node.progress}%`,
              backgroundColor: node.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'
            }} 
          />
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="todo-item-children">
          {node.children.map(childId => (
            <TodoItem
              key={childId}
              node={allNodes[childId]}
              allNodes={allNodes}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onToggle={onToggle}
              onUpdate={onUpdate}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              depth={depth + 1}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoItem;
