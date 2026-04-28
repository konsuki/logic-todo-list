import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Info, Zap, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoTree } from './hooks/useTodoTree';
import { useI18n } from './hooks/useI18n';
import { useShortcuts } from './hooks/useShortcuts';
import ListView from './components/features/list/ListView';
import TreeView from './components/features/tree/TreeView';
import Inspector from './components/features/inspector/Inspector';
import './App.css';

function App() {
  const { 
    nodes, 
    rootNodes, 
    addNode, 
    addNodes,
    deleteNode, 
    toggleStatus, 
    updateNode, 
    addDependency, 
    removeDependency,
    reorderNode
  } = useTodoTree();
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState('list');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [completedGoals, setCompletedGoals] = useState(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Auto-expand new nodes or roots
  useEffect(() => {
    if (Object.keys(nodes).length > 0 && expandedNodeIds.size === 0) {
      setExpandedNodeIds(new Set(Object.keys(nodes)));
    }
  }, [nodes]);

  const toggleExpand = (nodeId) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  useShortcuts({
    nodes,
    rootNodes,
    selectedNodeId,
    setSelectedNodeId,
    expandedNodeIds,
    addNode,
    deleteNode,
    toggleStatus,
    view,
    setView,
    isInspectorOpen,
    setIsInspectorOpen,
    t
  });

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
            {view === 'tree' && (
              <motion.div 
                layoutId="activeView"
                className="active-bg"
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1.2 }}
                style={{ position: 'absolute', inset: 0 }}
              />
            )}
            <LayoutGrid size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom', position: 'relative', zIndex: 2 }} />
            <span style={{ position: 'relative', zIndex: 2 }}>{t('header.tree_view')}</span>
          </button>
          <button 
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            {view === 'list' && (
              <motion.div 
                layoutId="activeView"
                className="active-bg"
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1.2 }}
                style={{ position: 'absolute', inset: 0 }}
              />
            )}
            <List size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom', position: 'relative', zIndex: 2 }} />
            <span style={{ position: 'relative', zIndex: 2 }}>{t('header.list_view')}</span>
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
            expandedNodeIds={expandedNodeIds}
            toggleExpand={toggleExpand}
            t={t}
          />
        ) : (
          <TreeView 
            nodes={nodes}
            rootNodes={rootNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            expandedNodeIds={expandedNodeIds}
            toggleExpand={toggleExpand}
            t={t}
          />
        )}
      </main>

      <aside className={`inspector-panel ${!isInspectorOpen ? 'collapsed' : ''}`}>
        <Inspector 
          selectedNodeId={selectedNodeId}
          nodes={nodes}
          addNode={addNode}
          addNodes={addNodes}
          onSelectNode={handleSelectNode}
          updateNode={updateNode}
          onDeleteNode={deleteNode}
          addDependency={addDependency}
          removeDependency={removeDependency}
          reorderNode={reorderNode}
          t={t}
          lang={lang}
        />
      </aside>
    </div>
  );
}

export default App;
