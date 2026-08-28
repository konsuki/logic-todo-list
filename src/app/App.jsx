import { useState, useRef } from 'react';
import { LayoutGrid, List, Info, Zap, Globe, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTodoTree } from '../features/todo/hooks/useTodoTree';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { useShortcuts } from '../features/todo/hooks/useShortcuts';
import { useCelebration } from '../features/todo/hooks/useCelebration';
import { VIEW_MODE } from '../constants/views';
import { DISPLAY_MODE } from '../features/todo/lib/treeConstants';
import ListView from '../features/todo/components/list/ListView';
import TreeView from '../features/todo/components/tree/TreeView';
import Inspector from '../features/todo/components/inspector/Inspector';
import SettingsPanel from '../features/todo/components/settings/SettingsPanel';
import ImportModal from '../features/todo/components/import/ImportModal';
import TrashView from '../features/todo/components/trash/TrashView';
import HiddenTasksModal from '../features/todo/components/list/HiddenTasksModal';
import DesignSandbox from '../components/sandbox/DesignSandbox';
import SearchBar from '../features/todo/components/search/SearchBar';
import './App.css';

function App() {
  const {
    nodes,
    rootNodes,
    trashedRootNodes,
    hiddenRootNodes,
    addNode,
    addNodes,
    addTreeUnderNode,
    importNodes,
    deleteNode,
    restoreNode,
    permanentDeleteNode,
    hideNode,
    unhideNode,
    toggleStatus,
    updateNode,
    addDependency,
    removeDependency,
    reorderNode,
    outdentNode,
    moveNode,
    setRelation,
    addGroup,
    removeGroup,
    assignChildToGroup,
    updateGroup,
    folders,
    addFolder,
    deleteFolder,
    assignTaskToFolder
  } = useTodoTree();
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState(VIEW_MODE.LIST);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isHiddenTasksOpen, setIsHiddenTasksOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [displayMode, setDisplayMode] = useState(DISPLAY_MODE.LOGIC); // 'logic' | 'folder'
  const treeRef = useRef(null);
  // Auto-expand all nodes on initial load (nodes are loaded synchronously from
  // localStorage via useTodoTree before this state is initialized).
  const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set(Object.keys(nodes)));

  const { themeName, setThemeName, themeMode, setThemeMode } = useTheme();

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

  useCelebration(rootNodes);

  const handleSelectNode = (id) => {
    setSelectedNodeId(id);
    if (!isInspectorOpen) setIsInspectorOpen(true);
  };

  return (
    <div className={`app-container${!isInspectorOpen ? ' inspector-collapsed' : ''}`}>
      <header className="app-header">
        <div className="logo" onClick={() => setSelectedNodeId(null)} style={{ cursor: 'pointer' }}>
          <img
            src="/src/assets/bizyu-logo-icon.png"
            alt="LogiDo icon"
            style={{ height: '32px', width: 'auto', display: 'inline', verticalAlign: 'middle', marginRight: '10px', flexShrink: 0 }}
          />
          <span className="logo-wordmark" style={{ fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN','Meiryo',sans-serif", fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', color: 'var(--text-main)', WebkitTextFillColor: 'var(--text-main)' }}>ビジュー</span>
        </div>
        
        <div className="view-switcher">
          <button 
            className={`view-btn ${view === VIEW_MODE.TREE ? 'active' : ''}`}
            onClick={() => setView(VIEW_MODE.TREE)}
          >
            {view === VIEW_MODE.TREE && (
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
            className={`view-btn ${view === VIEW_MODE.LIST ? 'active' : ''}`}
            onClick={() => setView(VIEW_MODE.LIST)}
          >
            {view === VIEW_MODE.LIST && (
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
              className={`icon-btn ${view === VIEW_MODE.PREVIEW ? 'active' : ''}`}
              onClick={() => setView(view === VIEW_MODE.PREVIEW ? VIEW_MODE.LIST : VIEW_MODE.PREVIEW)}
              title="Design Preview (Alt+P)"
            >
              <Zap size={20} color={view === VIEW_MODE.PREVIEW ? 'var(--primary-color)' : 'var(--text-muted)'} />
            </button>
          )}
          {view === VIEW_MODE.LIST && (
            <SearchBar
              nodes={nodes}
              displayMode={displayMode}
              treeRef={treeRef}
              onSelectNode={handleSelectNode}
              t={t}
            />
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

      <main className="main-content" style={{ padding: view === VIEW_MODE.TREE || view === VIEW_MODE.PREVIEW ? '0' : '40px' }}>
        {import.meta.env.DEV && view === VIEW_MODE.PREVIEW ? (
          <DesignSandbox />
        ) : view === VIEW_MODE.LIST ? (
          <ListView
            nodes={nodes}
            rootNodes={rootNodes}
            addNode={addNode}
            deleteNode={deleteNode}
            hideNode={hideNode}
            toggleStatus={toggleStatus}
            updateNode={updateNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            moveNode={moveNode}
            hiddenRootNodes={hiddenRootNodes}
            onOpenHiddenTasks={() => setIsHiddenTasksOpen(true)}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
            addFolder={addFolder}
            deleteFolder={deleteFolder}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            treeRef={treeRef}
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
          key={selectedNodeId}
          selectedNodeId={selectedNodeId}
          nodes={nodes}
          addNode={addNode}
          addNodes={addNodes}
          addTreeUnderNode={addTreeUnderNode}
          onSelectNode={handleSelectNode}
          updateNode={updateNode}
          onDeleteNode={deleteNode}
          addDependency={addDependency}
          removeDependency={removeDependency}
          reorderNode={reorderNode}
          setRelation={setRelation}
          addGroup={addGroup}
          removeGroup={removeGroup}
          assignChildToGroup={assignChildToGroup}
          updateGroup={updateGroup}
          folders={folders}
          addFolder={addFolder}
          deleteFolder={deleteFolder}
          assignTaskToFolder={assignTaskToFolder}
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

      <HiddenTasksModal
        isOpen={isHiddenTasksOpen}
        onClose={() => setIsHiddenTasksOpen(false)}
        hiddenRootNodes={hiddenRootNodes}
        nodes={nodes}
        onUnhide={unhideNode}
        t={t}
      />
    </div>
  );
}

export default App;
