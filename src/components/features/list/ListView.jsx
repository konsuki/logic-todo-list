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
  onSelectNode
}) => {
  if (rootNodes.length === 0) {
    return (
      <div className="empty-state">
        <Target size={64} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h2>Welcome to LogiDo</h2>
        <p>Start by defining your main goal.</p>
        <button 
          className="primary-btn"
          onClick={() => {
            const title = prompt('Enter your main goal:');
            if (title) addNode(null, NODE_TYPES.GOAL, title);
          }}
        >
          <Plus size={18} /> Create New Goal
        </button>
      </div>
    );
  }

  return (
    <div className="list-view-container">
      <div className="list-view-header">
        <h1>Projects & Logic Trees</h1>
        <button 
          className="add-goal-btn"
          onClick={() => {
            const title = prompt('Enter your main goal:');
            if (title) addNode(null, NODE_TYPES.GOAL, title);
          }}
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      <div className="list-view-content">
        {rootNodes.map(root => (
          <TodoItem
            key={root.id}
            node={root}
            allNodes={nodes}
            onAddChild={(parentId) => {
              const title = prompt('Enter task name:');
              if (title) addNode(parentId, NODE_TYPES.ACTION, title);
            }}
            onDelete={deleteNode}
            onToggle={toggleStatus}
            onUpdate={updateNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};

export default ListView;
