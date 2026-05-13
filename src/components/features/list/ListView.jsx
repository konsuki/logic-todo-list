import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tree } from 'react-arborist';
import { Target, Plus, Filter, ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle } from 'lucide-react';
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

  const isDone = data.status === 'DONE';
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

  const handleTitleSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditing(false);
      if (editTitle.trim() !== data.title) {
        tree.props.onUpdateNode?.(data.id, { title: editTitle });
      }
    }
  };

  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    tree.props.onSelectNode?.(data.id);
  };

  const isSelected = tree.props.selectedNodeId === data.id;
  const t = tree.props.t || ((k) => k);

  return (
    <div
      className={`todo-item-container ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}
      style={style}
      ref={dragHandle}
      onClick={handleRowClick}
    >
      <div className={`todo-item-row ${isDone ? 'is-done' : ''}`}>
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
            <span className={`node-type-tag ${data.type.toLowerCase()}`}>{data.type}</span>

            {stepNumber !== null && (
              <span className="step-badge">Step {stepNumber}</span>
            )}

            {isEditing ? (
              <input
                autoFocus
                className="title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleSubmit}
                onBlur={handleTitleSubmit}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="node-title" onClick={() => setIsEditing(true)}>
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
  toggleStatus, 
  updateNode,
  selectedNodeId,
  onSelectNode,
  expandedNodeIds,
  toggleExpand,
  moveNode,
  t
}) => {
  const [phaseFilter, setPhaseFilter] = useState('ALL');
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

  // Build arborist tree data
  const arboristData = useMemo(() => {
    const filteredNodes = phaseFilter === 'ALL' ? nodes : (() => {
      // Filter logic: keep nodes matching phase and their ancestors
      const visibleSet = new Set();
      const checkVisibility = (nodeId) => {
        const node = nodes[nodeId];
        if (!node) return false;
        const matchesPhase = node.phase === phaseFilter;
        let childMatches = false;
        if (node.children) {
          node.children.forEach(childId => {
            if (checkVisibility(childId)) childMatches = true;
          });
        }
        if (matchesPhase || childMatches) {
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

    const filteredRoots = Object.values(filteredNodes).filter(n => !n.parentId);
    return treeLogic.buildArboristTree(filteredNodes, filteredRoots);
  }, [nodes, rootNodes, phaseFilter]);

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

      <div className="list-view-content" ref={containerRef}>
        {arboristData.length === 0 ? (
          <div className="no-results">
            <Filter size={48} color="var(--border-color)" />
            <p>{t('list.no_tasks_in_phase')}</p>
          </div>
        ) : (
          <Tree
            data={arboristData}
            onMove={({ dragIds, parentId, index }) => moveNode(dragIds, parentId, index)}
            openByDefault={true}
            width={containerSize.width}
            height={containerSize.height}
            indent={24}
            rowHeight={56}
            overscanCount={5}
            allNodes={nodes}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
            onToggleStatus={toggleStatus}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
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
