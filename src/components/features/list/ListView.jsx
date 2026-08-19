import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tree } from 'react-arborist';
import { Target, Plus, Filter, ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle, EyeOff, Folder, FolderPlus } from 'lucide-react';
import { NODE_TYPES } from '../../../logic/treeLogic';
import * as treeLogic from '../../../logic/treeLogic';
import { useSettings } from '../../../logic/SettingsContext';
import './ListView.css';
import './TodoItem.css';

/**
 * Custom node renderer for react-arborist.
 * Reuses the visual design from the original TodoItem.
 */
const ArboristNode = ({ node, style, dragHandle, tree }) => {
  const data = node.data;
  const { settings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [isAutoEdit, setIsAutoEdit] = useState(false);
  const inputRef = useRef(null);

  const isDone = data.status === 'DONE';
  const isFolder = data.type === 'FOLDER';
  const isLocked = (data.dependsOn || []).some(depId => {
    const dep = tree.props.allNodes?.[depId];
    return !dep || dep.status !== 'DONE';
  });

  const childrenCount = data.children ? data.children.length : 0;
  const showMeceWarning = data.type === 'STRATEGY' && childrenCount === 1;

  // Timeline logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  const isOverdue = dueDate && dueDate < today && !isDone;
  const isDueSoon = dueDate && !isOverdue && !isDone && (dueDate.getTime() - today.getTime()) <= (3 * 24 * 60 * 60 * 1000);

  // Step number
  const stepNumber = useMemo(() => {
    const siblings = node.parent ? node.parent.children : tree.root.children;
    if (!siblings) return null;
    const index = siblings.findIndex(s => s.id === node.id);
    return index !== -1 ? index + 1 : null;
  }, [node, tree]);

  // ショートカット（Enter/Tab）で追加された新タスクは、editingNodeId が
  // その id と一致するため、自動でタイトル編集モードに入る。
  useEffect(() => {
    if (tree.props.editingNodeId === data.id) {
      setEditTitle(data.title);
      setIsEditing(true);
      setIsAutoEdit(true);
    }
  }, [tree.props.editingNodeId, data.id, data.title]);

  // 追加直後の自動編集時のみ、input のテキストを全選択して、
  // そのまま文字入力で "New Task" を置換できるようにする。
  useEffect(() => {
    if (isEditing && isAutoEdit) {
      inputRef.current?.select();
    }
  }, [isEditing, isAutoEdit]);

  const handleTitleSubmit = (e) => {
    // 編集 input 内のキーイベントを react-arborist コンテナへ伝播させない。
    // これがないと、カーソル移動キー（←→↑↓）や Backspace / Space などが
    // ライブラリ内蔵のキーボードナビゲーションとして誤発火してしまう。
    if (e.type === 'keydown') {
      e.stopPropagation();
    }

    // Escape: 変更せずに編集を終了（タイトルは "New Task" のまま維持、選択は解除しない）
    if (e.key === 'Escape') {
      setEditTitle(data.title);
      setIsEditing(false);
      setIsAutoEdit(false);
      tree.props.setEditingNodeId?.(null);
      return;
    }

    if (e.key === 'Enter' || e.type === 'blur') {
      const trimmed = editTitle.trim();
      setIsEditing(false);
      setIsAutoEdit(false);
      tree.props.setEditingNodeId?.(null);
      if (trimmed && trimmed !== data.title) {
        tree.props.onUpdateNode?.(data.id, { title: trimmed });
      } else if (!trimmed) {
        // 空文字のまま確定しても "New Task" を消さない
        setEditTitle(data.title);
      }
    }
  };

  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    // Folders are not selectable in the inspector; clicking toggles expand instead.
    if (isFolder) {
      node.toggle();
      return;
    }
    tree.props.onSelectNode?.(data.id);
  };

  const isSelected = tree.props.selectedNodeId === data.id;
  const t = tree.props.t || ((k) => k);

  const { paddingLeft, ...restStyle } = style;
  const level = node.level;

  // Folder rows: directory-style display (no status toggle / progress).
  if (isFolder) {
    const isVirtual = data.isVirtual;
    return (
      <div
        className={`todo-item-container folder-row ${isVirtual ? 'folder-row--virtual' : ''}`}
        style={restStyle}
        ref={dragHandle}
        onClick={handleRowClick}
      >
        <div className="indent-guides-wrapper" style={{ width: paddingLeft }}>
          {Array.from({ length: level }).map((_, i) => (
            <div key={i} className="indent-guide" />
          ))}
        </div>

        <div className="todo-item-row" style={{ marginLeft: paddingLeft }}>
          <div className="todo-item-content">
            <button
              className={`expand-btn ${node.isLeaf ? 'invisible' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                node.toggle();
              }}
            >
              {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <Folder size={16} className="folder-icon" />
            <span className="node-title folder-title">{data.name}</span>
            {isVirtual && (
              <span className="folder-count-badge">{node.children?.length ?? 0}</span>
            )}
          </div>

          <div className="node-actions">
            {!isVirtual && (
              <>
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const title = prompt(t('list.enter_folder'));
                    if (title) tree.props.onAddSubfolder?.(data.id, title);
                  }}
                  title={t('list.add_subfolder')}
                >
                  <FolderPlus size={16} />
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(t('common.confirm_delete'))) {
                      tree.props.onDeleteFolder?.(data.id);
                    }
                  }}
                  title={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`todo-item-container ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}
      style={restStyle}
      ref={dragHandle}
      onClick={handleRowClick}
    >
      {/* Indentation Guides */}
      <div className="indent-guides-wrapper" style={{ width: paddingLeft }}>
        {Array.from({ length: level }).map((_, i) => (
          <div key={i} className="indent-guide" />
        ))}
      </div>

      <div 
        className={`todo-item-row ${isDone ? 'is-done' : ''}`}
        style={{ marginLeft: paddingLeft }}
      >
        <div className="todo-item-content">
          <button
            className={`expand-btn ${node.isLeaf ? 'invisible' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
          >
            {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <button
            className={`status-toggle ${isLocked ? 'disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) tree.props.onToggleStatus?.(data.id);
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
            {settings.showNodeTypeTags && (
              <span className={`node-type-tag ${data.type.toLowerCase()}`}>{data.type}</span>
            )}

            {settings.showStepBadges && stepNumber !== null && (
              <span className="step-badge">Step {stepNumber}</span>
            )}

            {isEditing ? (
              <input
                autoFocus
                ref={inputRef}
                className="title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleSubmit}
                onBlur={handleTitleSubmit}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="node-title" onClick={() => { setEditTitle(data.title); setIsAutoEdit(false); setIsEditing(true); }}>
                {data.title}
              </span>
            )}

            {/* Timeline Badges */}
            <div className="timeline-meta">
              {settings.showPhaseBadges && data.phase && (
                <span className={`phase-badge ${data.phase.toLowerCase()}`}>
                  {t(`phases.${data.phase}`)}
                </span>
              )}
              {data.dueDate && (
                <span className={`due-date-badge ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                  <Clock size={10} />
                  {data.dueDate}
                </span>
              )}
            </div>

            {showMeceWarning && (
              <div className="mece-warning-icon" title={t('inspector.logic_gap_desc')}>
                <AlertTriangle size={14} color="var(--warning-color)" />
              </div>
            )}

            {isLocked && (
              <div className="lock-badge">
                <Lock size={10} /> {(data.dependsOn || []).length}
              </div>
            )}

            {data.progress > 0 && data.progress < 100 && (
              <span className="progress-badge">{data.progress}%</span>
            )}

            {data.description && settings.showDescriptionInList && (
              <div className="node-description-preview" title={data.description}>
                {data.description.length > 50 ? data.description.substring(0, 50) + '...' : data.description}
              </div>
            )}
          </div>

          <div className="node-actions">
            <button
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                tree.props.onAddChild?.(data.id);
              }}
              title={t('list.add_child')}
            >
              <Plus size={16} />
            </button>
            <button
              className="action-btn hide"
              onClick={(e) => {
                e.stopPropagation();
                tree.props.onHideNode?.(data.id);
              }}
              title={t('common.hide_task')}
            >
              <EyeOff size={16} />
            </button>
            <button
              className="action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(t('common.confirm_delete'))) {
                  tree.props.onDeleteNode?.(data.id);
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
              width: `${data.progress}%`,
              backgroundColor: data.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

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
  expandedNodeIds,
  toggleExpand,
  moveNode,
  hiddenRootNodes,
  onOpenHiddenTasks,
  editingNodeId,
  setEditingNodeId,
  folders,
  addFolder,
  deleteFolder,
  assignTaskToFolder,
  t
}) => {
  const { settings } = useSettings();
  const [displayMode, setDisplayMode] = useState('logic'); // 'logic' | 'folder'
  const [phaseFilter, setPhaseFilter] = useState(() => {
    const saved = localStorage.getItem('logido_list_phase_filter');
    return saved || 'ALL';
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
    if (displayMode === 'folder') {
      return treeLogic.buildFolderTree(nodes, t('list.uncategorized'));
    }

    const filteredNodes = phaseFilter === 'ALL' ? nodes : (() => {
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

    const filteredRoots = Object.values(filteredNodes).filter(n => !n.parentId && !n.deletedAt && !n.hidden);
    return treeLogic.buildArboristTree(filteredNodes, filteredRoots);
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
          <h1>{t('list.title')}</h1>
          {settings.useFolderView !== false && (
            <div className="display-mode-toggle">
              <button
                className={`display-mode-btn ${displayMode === 'logic' ? 'active' : ''}`}
                onClick={() => setDisplayMode('logic')}
              >
                {t('list.logic_tree_mode')}
              </button>
              <button
                className={`display-mode-btn ${displayMode === 'folder' ? 'active' : ''}`}
                onClick={() => setDisplayMode('folder')}
              >
                <Folder size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {t('list.folder_mode')}
              </button>
            </div>
          )}
          {displayMode === 'logic' && (
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
          )}
        </div>
        <div className="header-right">
          {displayMode === 'folder' && (
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
            data={arboristData}
            onMove={displayMode === 'logic'
              ? ({ dragIds, parentId, index }) => moveNode(dragIds, parentId, index)
              : null}
            disableDrag={displayMode === 'folder'}
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
