import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Info, Zap, Globe, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoTree } from './hooks/useTodoTree';
import { useI18n } from './hooks/useI18n';
import { useShortcuts } from './hooks/useShortcuts';
import ListView from './components/features/list/ListView';
import TreeView from './components/features/tree/TreeView';
import Inspector from './components/features/inspector/Inspector';
import SettingsPanel from './components/features/settings/SettingsPanel';
import ImportModal from './components/features/import/ImportModal';
import TrashView from './components/features/trash/TrashView';
import DesignSandbox from './components/sandbox/DesignSandbox';
import { themes } from './constants/themes';
import './App.css';

function App() {
  const { 
    nodes, 
    rootNodes,
    trashedRootNodes,
    addNode, 
    addNodes,
    importNodes,
    deleteNode,
    restoreNode,
    permanentDeleteNode,
    toggleStatus, 
    updateNode, 
    addDependency, 
    removeDependency,
    reorderNode,
    outdentNode,
    moveNode
  } = useTodoTree();
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState('list');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [completedGoals, setCompletedGoals] = useState(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Theme Management
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'classic');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

  useEffect(() => {
    const selectedTheme = themes[themeName][themeMode];
    Object.entries(selectedTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('themeName', themeName);
    localStorage.setItem('themeMode', themeMode);
    
    // Also update body background for seamless transitions
    document.body.style.backgroundColor = selectedTheme['--bg-color'];
    
    // Add theme class to body for specific CSS overrides
    document.body.className = `theme-${themeName}`;
  }, [themeName, themeMode]);

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
    t,
    editingNodeId,
    setEditingNodeId,
    outdentNode,
    setExpandedNodeIds
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
          <svg width="22" height="26" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '9px', flexShrink: 0 }}>
            <path d="M16 3 L11 3 Q7.5 3 7.5 7 L7.5 14 Q7.5 16 5.5 16 Q7.5 16 7.5 18 L7.5 25 Q7.5 29 11 29 L16 29"
              stroke="var(--primary-color)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="21" cy="16" r="2.5" fill="var(--primary-color)" opacity="0.55"/>
          </svg>
          <span className="logo-wordmark">logi<span className="logo-accent">do</span></span>
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
          {import.meta.env.DEV && (
            <button 
              className={`icon-btn ${view === 'preview' ? 'active' : ''}`}
              onClick={() => setView(view === 'preview' ? 'list' : 'preview')}
              title="Design Preview (Alt+P)"
            >
              <Zap size={20} color={view === 'preview' ? 'var(--primary-color)' : 'var(--text-muted)'} />
            </button>
          )}
          <button 
            className="icon-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <Settings size={20} color="var(--text-muted)" />
          </button>
          <button 
            className="icon-btn"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          >
            <Info size={20} color={isInspectorOpen ? 'var(--primary-color)' : 'var(--text-muted)'} />
          </button>
        </div>
      </header>

      <main className="main-content" style={{ padding: view === 'tree' || view === 'preview' ? '0' : '40px' }}>
        {import.meta.env.DEV && view === 'preview' ? (
          <DesignSandbox />
        ) : view === 'list' ? (
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
            moveNode={moveNode}
            t={t}
          />
        ) : (
          <TreeView 
            nodes={nodes}
            rootNodes={rootNodes}
            updateNode={updateNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            expandedNodeIds={expandedNodeIds}
            toggleExpand={toggleExpand}
            t={t}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
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

      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        t={t}
        themeName={themeName}
        setThemeName={setThemeName}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        trashedCount={trashedRootNodes.length}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importNodes}
        t={t}
      />

      <TrashView
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashedRootNodes={trashedRootNodes}
        nodes={nodes}
        onRestore={restoreNode}
        onPermanentDelete={permanentDeleteNode}
        t={t}
      />
    </div>
  );
}

export default App;
