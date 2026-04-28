import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Info, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTodoTree } from './hooks/useTodoTree';
import ListView from './components/features/list/ListView';
import TreeView from './components/features/tree/TreeView';
import Inspector from './components/features/inspector/Inspector';
import './App.css';

function App() {
  const { nodes, rootNodes, addNode, deleteNode, toggleStatus, updateNode } = useTodoTree();
  const [view, setView] = useState('list');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [completedGoals, setCompletedGoals] = useState(new Set());

  // Celebration Logic: Trigger confetti when a Goal reaches 100%
  useEffect(() => {
    rootNodes.forEach(root => {
      if (root.progress === 100 && !completedGoals.has(root.id)) {
        // Trigger Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#00FFAD', '#FFFFFF'],
          zIndex: 1000
        });
        
        setCompletedGoals(prev => new Set([...prev, root.id]));
      } else if (root.progress < 100 && completedGoals.has(root.id)) {
        // Remove from completed set if it goes back (e.g. child unchecked)
        setCompletedGoals(prev => {
          const next = new Set(prev);
          next.delete(root.id);
          return next;
        });
      }
    });
  }, [rootNodes, completedGoals]);

  const handleSelectNode = (id) => {
    setSelectedNodeId(id);
    if (!isInspectorOpen) setIsInspectorOpen(true);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo" onClick={() => setSelectedNodeId(null)} style={{ cursor: 'pointer' }}>
          <Zap size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'bottom' }} />
          LogiDo
        </div>
        
        <div className="view-switcher">
          <button 
            className={`view-btn ${view === 'tree' ? 'active' : ''}`}
            onClick={() => setView('tree')}
          >
            <LayoutGrid size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Tree View
          </button>
          <button 
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            List View
          </button>
        </div>

        <div className="header-actions">
          <button 
            className="icon-btn"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          >
            <Info size={20} color={isInspectorOpen ? 'var(--primary-color)' : 'var(--text-muted)'} />
          </button>
        </div>
      </header>

      <main className="main-content" style={{ padding: view === 'tree' ? '0' : '40px' }}>
        {view === 'list' ? (
          <ListView 
            nodes={nodes}
            rootNodes={rootNodes}
            addNode={addNode}
            deleteNode={deleteNode}
            toggleStatus={toggleStatus}
            updateNode={updateNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
          />
        ) : (
          <TreeView 
            nodes={nodes}
            rootNodes={rootNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
          />
        )}
      </main>

      <aside className={`inspector-panel ${!isInspectorOpen ? 'collapsed' : ''}`}>
        <Inspector 
          selectedNodeId={selectedNodeId}
          nodes={nodes}
          onSelectNode={handleSelectNode}
          updateNode={updateNode}
          onDeleteNode={deleteNode}
        />
      </aside>
    </div>
  );
}

export default App;
