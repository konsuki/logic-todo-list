import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Target, ChevronUp, ChevronDown, Info, ExternalLink, Trash2, AlertTriangle, Link, X, Plus, Calendar, ArrowUp, ArrowDown, GripVertical, Folder, FolderPlus } from 'lucide-react';
import * as treeLogic from '../../../logic/treeLogic';
import { useSettings } from '../../../logic/SettingsContext';
import AIInsights from './AIInsights';
import InspectorTextarea from './InspectorTextarea';
import SortableSection from './SortableSection';
import './Inspector.css';

const DEFAULT_SECTION_ORDER = ['description', 'intent', 'procedure', 'folder', 'ai', 'schedule', 'dependency', 'why', 'how'];
const STORAGE_KEY = 'logido_section_order';

const Inspector = ({
  selectedNodeId,
  nodes,
  addNode,
  addNodes,
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
  deleteFolder,
  assignTaskToFolder,
  t,
  lang
}) => {
  const node = nodes[selectedNodeId];
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(node?.title || '');
  const [isWhyOpen, setIsWhyOpen] = useState(true);
  const [isHowOpen, setIsHowOpen] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter(k => DEFAULT_SECTION_ORDER.includes(k));
        const missing = DEFAULT_SECTION_ORDER.filter(k => !valid.includes(k));
        return [...valid, ...missing];
      }
    } catch (_) {}
    return DEFAULT_SECTION_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    setIsEditingTitle(false);
    setEditTitle(node?.title || '');
  }, [selectedNodeId, node?.title]);

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
    ? treeLogic.normalizeGroups(node.groups)
    : [];
  const groupIdOfChild = (childId) => {
    const group = normalizedGroups.find(g => g.children.includes(childId));
    return group ? group.id : null;
  };

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const commitGroupName = (groupId) => {
    const trimmed = editingGroupName.trim();
    if (trimmed && editingGroupId === groupId) {
      updateGroup(node.id, groupId, { name: trimmed });
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const predecessors = (node.dependsOn || []).map(id => nodes[id]).filter(Boolean);
  const searchResults = searchQuery.trim()
    ? Object.values(nodes).filter(n =>
        n.id !== node.id &&
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(node.dependsOn || []).includes(n.id)
      ).slice(0, 5)
    : [];

  const showMeceWarning = (node.type === 'STRATEGY' || node.type === 'GOAL') && children.length === 1;

  const handlePhaseChange = (e) => {
    updateNode(selectedNodeId, { phase: e.target.value });
  };

  const handleDueDateChange = (e) => {
    updateNode(selectedNodeId, { dueDate: e.target.value });
  };

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
      <InspectorTextarea
        nodeId={selectedNodeId}
        value={node.description || ''}
        onChange={(text) => updateNode(selectedNodeId, { description: text })}
        onModalChange={(text) => updateNode(node.id, { description: text })}
        label={t('inspector.description')}
        placeholder={t('inspector.placeholder_desc')}
        t={t}
      />
    ),

    intent: (
      <InspectorTextarea
        nodeId={selectedNodeId}
        value={node.intent || ''}
        onChange={(text) => updateNode(selectedNodeId, { intent: text })}
        onModalChange={(text) => updateNode(node.id, { intent: text })}
        label={t('inspector.intent')}
        placeholder={t('inspector.placeholder_intent')}
        t={t}
      />
    ),

    procedure: (
      <InspectorTextarea
        nodeId={selectedNodeId}
        value={node.procedure || ''}
        onChange={(text) => updateNode(selectedNodeId, { procedure: text })}
        onModalChange={(text) => updateNode(node.id, { procedure: text })}
        label={t('inspector.procedure')}
        placeholder={t('inspector.placeholder_procedure')}
        t={t}
      />
    ),

    folder: (
      node.type === 'FOLDER' || settings.useFolderView === false ? null : (
        <section className="inspector-section">
          <h3 className="section-title">
            <Folder size={14} /> {t('inspector.folder')}
          </h3>
          <div className="folder-assign-controls">
            <select
              className="folder-select"
              value={node.folderId || ''}
              onChange={(e) => assignTaskToFolder(node.id, e.target.value || null)}
            >
              <option value="">{t('inspector.no_folder')}</option>
              {(folders || []).map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
            <button
              className="add-folder-btn"
              onClick={() => {
                const title = prompt(t('list.enter_folder'));
                if (title) {
                  addFolder(null, title);
                }
              }}
              title={t('list.new_folder')}
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </section>
      )
    ),

    ai: (
      <AIInsights
        node={node}
        nodes={nodes}
        addNode={addNode}
        addNodes={addNodes}
        addTreeUnderNode={addTreeUnderNode}
        lang={lang}
        t={t}
      />
    ),

    schedule: (
      <section className="inspector-section">
        <h3 className="section-title">
          <Calendar size={14} /> {t('inspector.schedule')}
        </h3>
        <div className="schedule-controls">
          <div className="control-group">
            <label>{t('inspector.phase')}</label>
            <select
              value={node.phase || 'PREP'}
              onChange={handlePhaseChange}
              className="phase-select"
            >
              <option value="PREP">{t('phases.PREP')}</option>
              <option value="EXEC">{t('phases.EXEC')}</option>
              <option value="REVIEW">{t('phases.REVIEW')}</option>
            </select>
          </div>
          <div className="control-group">
            <label>{t('inspector.due_date')}</label>
            <input
              type="date"
              value={node.dueDate || ''}
              onChange={handleDueDateChange}
              className="date-input"
            />
          </div>
        </div>

        <div className="order-controls">
          <label className="section-subtitle">{t('inspector.order_section')}</label>
          <div className="order-buttons">
            <button
              className="order-btn"
              onClick={() => reorderNode(node.id, 'up')}
              title={t('inspector.move_up')}
            >
              <ArrowUp size={14} /> {t('inspector.move_up')}
            </button>
            <button
              className="order-btn"
              onClick={() => reorderNode(node.id, 'down')}
              title={t('inspector.move_down')}
            >
              <ArrowDown size={14} /> {t('inspector.move_down')}
            </button>
          </div>
        </div>
      </section>
    ),

    dependency: (
      <section className="inspector-section">
        <h3 className="section-title">
          <Link size={14} /> {t('inspector.predecessors')}
        </h3>
        <div className="dependency-manager">
          <div className="current-dependencies">
            {predecessors.length === 0 ? (
              <p className="empty-text">{t('inspector.no_predecessors')}</p>
            ) : (
              predecessors.map(p => (
                <div key={p.id} className="dependency-tag">
                  <span onClick={() => onSelectNode(p.id)}>{p.title}</span>
                  <button onClick={() => removeDependency(node.id, p.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="dependency-search">
            <input
              type="text"
              placeholder={t('inspector.search_to_link')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(r => (
                  <div
                    key={r.id}
                    className="search-result-item"
                    onClick={() => {
                      addDependency(node.id, r.id);
                      setSearchQuery('');
                    }}
                  >
                    <span>{r.title}</span>
                    <Plus size={12} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    why: (
      <section className="inspector-section">
        <h3 className="section-title section-title--clickable" onClick={() => setIsWhyOpen(v => !v)}>
          {isWhyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {t('inspector.why')}
        </h3>
        {isWhyOpen && (
          <>
            <div className="why-path">
              {pathToRoot.length === 0 ? (
                <div className="path-item root">
                  <Target size={14} />
                  <span>{t('inspector.root_goal')}</span>
                </div>
              ) : (
                pathToRoot.map((n, i) => (
                  <div
                    key={n.id}
                    className="path-item linkable"
                    onClick={() => onSelectNode(n.id)}
                  >
                    <div className="path-dot" />
                    <span className="path-title">{n.title}</span>
                    <ExternalLink size={12} className="link-icon" />
                  </div>
                ))
              )}
              <div className="path-item active">
                <div className="path-dot active" />
                <span className="path-title current">{node.title}</span>
              </div>
            </div>
            <p className="logic-guide">
              {pathToRoot.length > 0
                ? t('inspector.achieve_context', { parent: pathToRoot[pathToRoot.length - 1].title })
                : t('inspector.focus_objective')}
            </p>
          </>
        )}
      </section>
    ),

    how: (
      <section className="inspector-section">
        <h3 className="section-title section-title--clickable" onClick={() => setIsHowOpen(v => !v)}>
          {isHowOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {t('inspector.how')}
        </h3>
        {isHowOpen && (
          <>
            {children.length >= 2 && (
              <div className="relation-toggle">
                <span className="relation-label">{t('inspector.relation_label')}</span>
                <div className="relation-toggle-group">
                  <button
                    className={`relation-btn ${node.relation !== 'or' ? 'active' : ''}`}
                    onClick={() => setRelation(node.id, 'and')}
                  >
                    {t('inspector.relation_and')}
                  </button>
                  <button
                    className={`relation-btn ${node.relation === 'or' ? 'active' : ''}`}
                    onClick={() => setRelation(node.id, 'or')}
                  >
                    {t('inspector.relation_or')}
                  </button>
                </div>
              </div>
            )}

            {node.relation === 'or' && children.length >= 2 && (
              <div className="or-group-editor">
                <button className="add-group-btn" onClick={() => addGroup(node.id)}>
                  <Plus size={14} /> {t('inspector.add_group')}
                </button>

                {normalizedGroups.map(group => {
                  const isCollapsed = collapsedGroups.has(group.id);
                  const groupProgress = treeLogic.calculateGroupProgress(nodes, group);
                  const isEditingName = editingGroupId === group.id;
                  return (
                    <div key={group.id} className="group-card" style={{ borderLeftColor: group.color }}>
                      <div className="group-card-header">
                        <span className="group-color-dot" style={{ backgroundColor: group.color }} />
                        {isEditingName ? (
                          <input
                            className="group-name-input"
                            value={editingGroupName}
                            autoFocus
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onBlur={() => commitGroupName(group.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitGroupName(group.id);
                              else if (e.key === 'Escape') {
                                setEditingGroupId(null);
                                setEditingGroupName('');
                              }
                            }}
                          />
                        ) : (
                          <span
                            className="group-name"
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name || '');
                            }}
                            title={t('inspector.click_to_edit')}
                          >
                            {group.name || `グループ${normalizedGroups.indexOf(group) + 1}`}
                          </span>
                        )}
                        <span className="group-progress">{t('inspector.group_progress')}: {groupProgress}%</span>
                        <button className="group-collapse-btn" onClick={() => toggleGroupCollapse(group.id)}>
                          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                        <button className="group-remove-btn" onClick={() => removeGroup(node.id, group.id)}>
                          <X size={14} />
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="group-assign-list">
                          {children.length === 0 ? (
                            <p className="empty-text">{t('inspector.no_subtasks')}</p>
                          ) : (
                            children.map(child => (
                              <div key={child.id} className="group-assign-item">
                                <span className="how-title">{child.title}</span>
                                <select
                                  className="group-assign-select"
                                  value={groupIdOfChild(child.id) || ''}
                                  onChange={(e) =>
                                    assignChildToGroup(node.id, child.id, e.target.value || null)
                                  }
                                >
                                  <option value="">{t('inspector.no_group')}</option>
                                  {normalizedGroups.map(g => (
                                    <option key={g.id} value={g.id}>
                                      {g.name || `グループ${normalizedGroups.indexOf(g) + 1}`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {normalizedGroups.length === 0 && (
                  <p className="hint">{t('inspector.add_group')} → {t('inspector.alternative_option')}</p>
                )}
              </div>
            )}

            {(node.relation !== 'or' || children.length < 2) && (
              <div className="how-list">
                {children.length === 0 ? (
                  <div className="empty-how">
                    <p>{t('inspector.no_subtasks')}</p>
                    <p className="hint">{t('inspector.breakdown_hint')}</p>
                  </div>
                ) : (
                  children.map(child => (
                    <div
                      key={child.id}
                      className="how-item"
                      onClick={() => onSelectNode(child.id)}
                    >
                      <span className={`status-dot ${child.status.toLowerCase()}`} />
                      <span className="how-title">{child.title}</span>
                      <span className="how-percent">{child.progress}%</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>
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
            onClick={() => setIsEditingTitle(true)}
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
