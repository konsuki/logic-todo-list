import React, { useState, useMemo } from 'react';
import TodoItem from './TodoItem';
import { Target, Plus, Filter } from 'lucide-react';
import { NODE_TYPES } from '../../../logic/treeLogic';
import './ListView.css';

const ListView = ({ 
  nodes, 
  rootNodes, 
  addNode, 
  deleteNode, 
  toggleStatus, 
  updateNode,
  selectedNodeId,
  onSelectNode,
  t
}) => {
  const [phaseFilter, setPhaseFilter] = useState('ALL');

  // Logic to determine which nodes should be visible based on phase filter
  const visibleNodeIds = useMemo(() => {
    if (phaseFilter === 'ALL') return null; // Show everything

    const visibleSet = new Set();
    
    // Recursive helper to check if a node or any of its descendants match the filter
    const checkVisibility = (nodeId) => {
      const node = nodes[nodeId];
      if (!node) return false;

      const matchesPhase = node.phase === phaseFilter;
      
      // Check if any children match
      let childMatches = false;
      if (node.children) {
        node.children.forEach(childId => {
          if (checkVisibility(childId)) {
            childMatches = true;
          }
        });
      }

      if (matchesPhase || childMatches) {
        visibleSet.add(nodeId);
        return true;
      }
      return false;
    };

    rootNodes.forEach(root => checkVisibility(root.id));
    return visibleSet;
  }, [nodes, rootNodes, phaseFilter]);

  // Filter and sort the root nodes
  // MOVED UP to comply with Rules of Hooks
  const displayedRootNodes = useMemo(() => {
    let filtered = phaseFilter === 'ALL' 
      ? rootNodes 
      : rootNodes.filter(root => visibleNodeIds?.has(root.id));
    
    // Sort by order
    return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [rootNodes, visibleNodeIds, phaseFilter]);

  if (rootNodes.length === 0) {
    return (
      <div className="empty-state">
        <Target size={64} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h2>{t('list.welcome')}</h2>
        <p>{t('list.create_first_goal')}</p>
        <button 
          className="primary-btn"
          onClick={() => {
            const title = prompt(t('list.enter_goal'));
            if (title) addNode(null, NODE_TYPES.GOAL, title);
          }}
        >
          <Plus size={18} /> {t('list.new_goal')}
        </button>
      </div>
    );
  }

  return (
    <div className="list-view-container">
      <div className="list-view-header">
        <div className="header-left">
          <h1>{t('list.title')}</h1>
          <div className="phase-filter-bar">
            {['ALL', 'PREP', 'EXEC', 'REVIEW'].map(p => (
              <button 
                key={p}
                className={`phase-filter-btn ${phaseFilter === p ? 'active' : ''}`}
                onClick={() => setPhaseFilter(p)}
              >
                {t(`phases.${p}`)}
              </button>
            ))}
          </div>
        </div>
        <button 
          className="add-goal-btn"
          onClick={() => {
            const title = prompt(t('list.enter_goal'));
            if (title) addNode(null, NODE_TYPES.GOAL, title);
          }}
        >
          <Plus size={16} /> {t('list.new_goal')}
        </button>
      </div>

      <div className="list-view-content">
        {displayedRootNodes.length === 0 ? (
          <div className="no-results">
            <Filter size={48} color="var(--border-color)" />
            <p>{t('list.no_tasks_in_phase')}</p>
          </div>
        ) : (
          displayedRootNodes.map(root => (
            <TodoItem
              key={root.id}
              node={root}
              allNodes={nodes}
              onAddChild={(parentId) => {
                const title = prompt(t('list.enter_task'));
                if (title) addNode(parentId, NODE_TYPES.ACTION, title);
              }}
              onDelete={deleteNode}
              onToggle={toggleStatus}
              onUpdate={updateNode}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              depth={0}
              t={t}
              visibleNodeIds={visibleNodeIds} // Pass down visibility info
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ListView;
