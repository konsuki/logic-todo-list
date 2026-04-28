import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Info, Zap, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTodoTree } from './hooks/useTodoTree';
import { useI18n } from './hooks/useI18n';
import ListView from './components/features/list/ListView';
import TreeView from './components/features/tree/TreeView';
import Inspector from './components/features/inspector/Inspector';
import './App.css';

function App() {
  const { nodes, rootNodes, addNode, deleteNode, toggleStatus, updateNode } = useTodoTree();
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState('list');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [completedGoals, setCompletedGoals] = useState(new Set());

  // Celebration Logic
  useEffect(() => {
    rootNodes.forEach(root => {
      if (root.progress === 100 && !completedGoals.has(root.id)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#00FFAD', '#FFFFFF'],
          zIndex: 1000
        });
        setCompletedGoals(prev => new Set([...prev, root.id]));
      } else if (root.progress < 100 && completedGoals.has(root.id)) {
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
            {t('header.tree_view')}
          </button>
          <button 
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('header.list_view')}
          </button>
        </div>

        <div className="header-actions">
          <button 
            className="lang-switcher"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            title="Switch Language"
          >
            <Globe size={18} style={{ marginRight: '6px' }} />
            <span className="lang-label">{lang.toUpperCase()}</span>
          </button>
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
            t={t}
          />
        ) : (
          <TreeView 
            nodes={nodes}
            rootNodes={rootNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            t={t}
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
          t={t}
        />
      </aside>
    </div>
  );
}

export default App;
