import React from 'react';
import TodoItem from './TodoItem';
import { Target, Plus } from 'lucide-react';
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
        <h1>{t('list.title')}</h1>
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
        {rootNodes.map(root => (
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
          />
        ))}
      </div>
    </div>
  );
};

export default ListView;
