import { useState, useMemo, useRef, useEffect } from 'react';
import { Tree } from 'react-arborist';
import { Target, Plus, Filter, EyeOff, Folder, FolderPlus } from 'lucide-react';
import { NODE_TYPES, PHASES, DISPLAY_MODE } from '../../lib/treeConstants';
import { buildFolderTree } from '../../lib/treeFolders';
import { buildArboristTree } from '../../lib/treeDisplay';
import { useSettings } from '../../../../lib/settings';
import ArboristNode from './ArboristNode';
import './ListView.css';
import './TodoItem.css';

const ListView = ({
  nodes,
  rootNodes,
  addNode,
  deleteNode,
  hideNode,
  toggleStatus,
  updateNode,
  selectedNodeId,
  onSelectNode,
  moveNode,
  hiddenRootNodes,
  onOpenHiddenTasks,
  editingNodeId,
  setEditingNodeId,
  addFolder,
  deleteFolder,
  displayMode,
  setDisplayMode,
  treeRef,
  t
}) => {
  const { settings } = useSettings();
  const [phaseFilter, setPhaseFilter] = useState(() => {
    const saved = localStorage.getItem('logido_list_phase_filter');
    return saved || PHASES.ALL;
  });

  useEffect(() => {
    localStorage.setItem('logido_list_phase_filter', phaseFilter);
  }, [phaseFilter]);
  const [openState, setOpenState] = useState(() => {
    const saved = localStorage.getItem('logido_list_open_state');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse open state:', e);
      return {};
    }
  });
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Measure container for react-arborist's virtual scroll
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  // Scroll position retention
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // スクロール可能な要素を探索するヘルパー関数
    const findScrollable = (element) => {
      if (!element) return null;
      const style = window.getComputedStyle(element);
      const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
      const hasOverflow = element.scrollHeight > element.offsetHeight;
      
      if (isScrollable && hasOverflow) {
        return element;
      }
      
      for (let i = 0; i < element.children.length; i++) {
        const found = findScrollable(element.children[i]);
        if (found) return found;
      }
      return null;
    };

    // 1. 復元処理（見つかるまでリトライ）
    const saved = localStorage.getItem('logido_list_scroll_top');
    if (saved) {
      const restore = () => {
        const scrollableElement = findScrollable(container);
        if (scrollableElement) {
          scrollableElement.scrollTop = parseFloat(saved);
        } else {
          requestAnimationFrame(restore); // レンダリングを待つ
        }
      };
      requestAnimationFrame(restore);
    }

    // 2. 保存処理（親要素でキャッチして、発火元から値を取る）
    let timeoutId;
    const handleScroll = (e) => {
      // e.target は実際にスクロールした要素そのもの
      if (e.target && e.target.scrollTop !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const currentPos = e.target.scrollTop;
          localStorage.setItem('logido_list_scroll_top', currentPos.toString());
          console.log('Saved scroll pos:', currentPos);
        }, 200);
      }
    };

    // キャプチャフェーズで監視することで、内部要素が再生成されても漏らさない
    container.addEventListener('scroll', handleScroll, true);
    return () => {
      container.removeEventListener('scroll', handleScroll, true);
      clearTimeout(timeoutId);
    };
  }, []);

  // Build arborist tree data
  const arboristData = useMemo(() => {
    // Folder mode: build a hierarchy from folderId, independent of causal parentId.
    if (displayMode === DISPLAY_MODE.FOLDER) {
      return buildFolderTree(nodes, t('list.uncategorized'));
    }

    const filteredNodes = phaseFilter === PHASES.ALL ? nodes : (() => {
      // Filter logic: keep nodes matching phase and their ancestors
      const visibleSet = new Set();
      const checkVisibility = (nodeId, forceVisible = false) => {
        const node = nodes[nodeId];
        if (!node || node.deletedAt || node.hidden) return false; // Skip soft-deleted and hidden nodes
        const matchesPhase = node.phase === phaseFilter;
        const isVisible = forceVisible || matchesPhase;
        
        let childMatches = false;
        if (node.children) {
          node.children.forEach(childId => {
            if (checkVisibility(childId, isVisible)) childMatches = true;
          });
        }
        
        if (isVisible || childMatches) {
          visibleSet.add(nodeId);
          return true;
        }
        return false;
      };
      rootNodes.forEach(root => checkVisibility(root.id));
      
      // Create filtered nodes object
      const filtered = {};
      Object.entries(nodes).forEach(([id, node]) => {
        if (visibleSet.has(id)) {
          filtered[id] = {
            ...node,
            children: (node.children || []).filter(cid => visibleSet.has(cid))
          };
        }
      });
      return filtered;
    })();

    const filteredRoots = Object.values(filteredNodes).filter(n => !n.parentId && !n.deletedAt && !n.hidden && n.type !== NODE_TYPES.FOLDER);
    return buildArboristTree(filteredNodes, filteredRoots);
  }, [nodes, rootNodes, phaseFilter, displayMode, t]);

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
          {settings.useFolderView !== false && (
            <div className="display-mode-toggle">
              <button
                className={`display-mode-btn ${displayMode === DISPLAY_MODE.LOGIC ? 'active' : ''}`}
                onClick={() => setDisplayMode(DISPLAY_MODE.LOGIC)}
              >
                {t('list.logic_tree_mode')}
              </button>
              <button
                className={`display-mode-btn ${displayMode === DISPLAY_MODE.FOLDER ? 'active' : ''}`}
                onClick={() => setDisplayMode(DISPLAY_MODE.FOLDER)}
              >
                <Folder size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {t('list.folder_mode')}
              </button>
            </div>
          )}
          {displayMode === DISPLAY_MODE.LOGIC && (
            <div className="phase-filter-bar">
              {[PHASES.ALL, PHASES.PREP, PHASES.EXEC, PHASES.REVIEW].map(p => (
                <button
                  key={p}
                  className={`phase-filter-btn ${phaseFilter === p ? 'active' : ''}`}
                  onClick={() => setPhaseFilter(p)}
                >
                  {t(`phases.${p}`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="header-right">
          {displayMode === DISPLAY_MODE.FOLDER && (
            <button
              className="add-goal-btn"
              onClick={() => {
                const title = prompt(t('list.enter_folder'));
                if (title) addFolder(null, title);
              }}
            >
              <FolderPlus size={16} /> {t('list.new_folder')}
            </button>
          )}
          {hiddenRootNodes && hiddenRootNodes.length > 0 && (
            <button
              className="hidden-tasks-btn"
              onClick={onOpenHiddenTasks}
              title={t('list.hidden_tasks')}
            >
              <EyeOff size={16} />
              <span>{t('list.hidden_tasks_count', { count: hiddenRootNodes.length })}</span>
            </button>
          )}
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
      </div>

      <div className="list-view-content" ref={containerRef}>
        {arboristData.length === 0 ? (
          <div className="no-results">
            <Filter size={48} color="var(--border-color)" />
            <p>{t('list.no_tasks_in_phase')}</p>
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={arboristData}
            onMove={displayMode === DISPLAY_MODE.LOGIC
              ? ({ dragIds, parentId, index }) => moveNode(dragIds, parentId, index)
              : null}
            disableDrag={displayMode === DISPLAY_MODE.FOLDER}
            openByDefault={true}
            initialOpenState={openState}
            onToggle={(id) => {
              setOpenState(prev => {
                const isCurrentlyOpen = prev[id] !== undefined ? prev[id] : true;
                const newState = { ...prev, [id]: !isCurrentlyOpen };
                localStorage.setItem('logido_list_open_state', JSON.stringify(newState));
                return newState;
              });
            }}
            width={containerSize.width}
            height={containerSize.height}
            indent={24}
            rowHeight={50}
            overscanCount={5}
            allNodes={nodes}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
            onToggleStatus={toggleStatus}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
            onHideNode={hideNode}
            onDeleteFolder={deleteFolder}
            onAddSubfolder={(parentFolderId, title) => addFolder(parentFolderId, title)}
            onAddChild={(parentId) => {
              const title = prompt(t('list.enter_task'));
              if (title) addNode(parentId, NODE_TYPES.ACTION, title);
            }}
            t={t}
          >
            {ArboristNode}
          </Tree>
        )}
      </div>
    </div>
  );
};

export default ListView;
