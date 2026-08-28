import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Info, Trash2, AlertTriangle, GripVertical } from 'lucide-react';
import { normalizeGroups } from '../../lib/treeGroups';
import { NODE_TYPES } from '../../lib/treeConstants';
import { useSettings } from '../../../../lib/settings';
import AIInsights from './AIInsights';
import SortableSection from './SortableSection';
import HowSection from './HowSection';
import DependencySection from './DependencySection';
import ScheduleSection from './ScheduleSection';
import WhySection from './WhySection';
import FolderSection from './FolderSection';
import TextareaSection from './TextareaSection';
import './Inspector.css';

const DEFAULT_SECTION_ORDER = ['description', 'intent', 'procedure', 'folder', 'ai', 'schedule', 'dependency', 'why', 'how'];
const STORAGE_KEY = 'logido_section_order';

const Inspector = ({
  selectedNodeId,
  nodes,
  addTreeUnderNode,
  onSelectNode,
  updateNode,
  onDeleteNode,
  addDependency,
  removeDependency,
  reorderNode,
  setRelation,
  addGroup,
  removeGroup,
  assignChildToGroup,
  updateGroup,
  folders,
  addFolder,
  assignTaskToFolder,
  t
}) => {
  const node = nodes[selectedNodeId];
  const { settings } = useSettings();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(node?.title || '');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter(k => DEFAULT_SECTION_ORDER.includes(k));
        const missing = DEFAULT_SECTION_ORDER.filter(k => !valid.includes(k));
        return [...valid, ...missing];
      }
    } catch {
      // localStorage の sectionOrder が壊れていた場合はデフォルト順序へフォールバック
    }
    return DEFAULT_SECTION_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!node) {
    return (
      <div className="inspector-empty">
        <Info size={48} color="var(--border-color)" />
        <p>{t('inspector.empty')}</p>
      </div>
    );
  }

  const getPathToRoot = (id) => {
    const path = [];
    let currentId = nodes[id]?.parentId;
    while (currentId && nodes[currentId]) {
      path.unshift(nodes[currentId]);
      currentId = nodes[currentId].parentId;
    }
    return path;
  };

  const pathToRoot = getPathToRoot(selectedNodeId);
  const children = node.children.map(id => nodes[id]).filter(Boolean);

  // OR group editing: normalized group objects (object + legacy form compatible)
  const normalizedGroups = node.relation === 'or'
    ? normalizeGroups(node.groups)
    : [];

  const predecessors = (node.dependsOn || []).map(id => nodes[id]).filter(Boolean);

  const showMeceWarning = (node.type === NODE_TYPES.STRATEGY || node.type === NODE_TYPES.GOAL) && children.length === 1;

  const handleSectionReorder = (newOrder) => {
    setSectionOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id);
    const newIndex = sectionOrder.indexOf(over.id);
    handleSectionReorder(arrayMove(sectionOrder, oldIndex, newIndex));
  };

  const sectionMap = {
    description: (
      <TextareaSection
        nodeId={selectedNodeId}
        node={node}
        field="description"
        updateNode={updateNode}
        t={t}
      />
    ),

    intent: (
      <TextareaSection
        nodeId={selectedNodeId}
        node={node}
        field="intent"
        updateNode={updateNode}
        t={t}
      />
    ),

    procedure: (
      <TextareaSection
        nodeId={selectedNodeId}
        node={node}
        field="procedure"
        updateNode={updateNode}
        t={t}
      />
    ),

    folder: (
      <FolderSection
        node={node}
        folders={folders}
        useFolderView={settings.useFolderView}
        assignTaskToFolder={assignTaskToFolder}
        addFolder={addFolder}
        t={t}
      />
    ),

    ai: (
      <AIInsights
        node={node}
        nodes={nodes}
        addTreeUnderNode={addTreeUnderNode}
        t={t}
      />
    ),

    schedule: (
      <ScheduleSection
        node={node}
        reorderNode={reorderNode}
        updateNode={updateNode}
        t={t}
      />
    ),

    dependency: (
      <DependencySection
        node={node}
        predecessors={predecessors}
        nodes={nodes}
        onSelectNode={onSelectNode}
        addDependency={addDependency}
        removeDependency={removeDependency}
        t={t}
      />
    ),

    why: (
      <WhySection
        node={node}
        pathToRoot={pathToRoot}
        onSelectNode={onSelectNode}
        t={t}
      />
    ),

    how: (
      <HowSection
        node={node}
        children={children}
        nodes={nodes}
        normalizedGroups={normalizedGroups}
        setRelation={setRelation}
        addGroup={addGroup}
        removeGroup={removeGroup}
        assignChildToGroup={assignChildToGroup}
        updateGroup={updateGroup}
        onSelectNode={onSelectNode}
        t={t}
      />
    ),
  };

  return (
    <div className={`inspector-container${isReorderMode ? ' reorder-mode' : ''}`}>
      <header className="inspector-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className={`node-type-tag ${node.type.toLowerCase()}`}>{node.type}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className={`reorder-toggle-btn${isReorderMode ? ' active' : ''}`}
              onClick={() => setIsReorderMode(v => !v)}
              title="セクションを並び替え"
            >
              <GripVertical size={16} />
            </button>
            <button
              className="delete-btn-subtle"
              onClick={() => {
                if (window.confirm(t('common.confirm_delete'))) {
                  onDeleteNode(node.id);
                }
              }}
              title={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isEditingTitle ? (
          <input
            type="text"
            className="inspector-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              const trimmed = editTitle.trim();
              if (trimmed && trimmed !== node.title) {
                updateNode(node.id, { title: trimmed });
              } else {
                setEditTitle(node.title);
              }
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const trimmed = editTitle.trim();
                if (trimmed && trimmed !== node.title) {
                  updateNode(node.id, { title: trimmed });
                } else {
                  setEditTitle(node.title);
                }
                setIsEditingTitle(false);
              } else if (e.key === 'Escape') {
                setEditTitle(node.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
          />
        ) : (
          <h2
            className="inspector-title"
            onClick={() => {
              setEditTitle(node.title);
              setIsEditingTitle(true);
            }}
            title={t('inspector.click_to_edit') || 'Click to edit'}
          >
            {node.title}
          </h2>
        )}
        <div className="inspector-progress">
          <div className="progress-label">{t('inspector.progress')}</div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${node.progress}%`,
                backgroundColor: node.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'
              }}
            />
          </div>
          <span className="progress-value">{node.progress}%</span>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map(key => {
            if (sectionMap[key] == null) return null;
            if (key === 'how' && showMeceWarning) {
              return (
                <SortableSection key={key} id={key} isReorderMode={isReorderMode}>
                  <div className="inspector-warning-card">
                    <AlertTriangle size={18} color="var(--warning-color)" />
                    <div>
                      <h4>{t('inspector.logic_gap_title')}</h4>
                      <p>{t('inspector.logic_gap_desc')}</p>
                    </div>
                  </div>
                  {sectionMap[key]}
                </SortableSection>
              );
            }
            return (
              <SortableSection key={key} id={key} isReorderMode={isReorderMode}>
                {sectionMap[key]}
              </SortableSection>
            );
          })}
        </SortableContext>
      </DndContext>

    </div>
  );
};

export default Inspector;
