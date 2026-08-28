import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { calculateGroupProgress } from '../../lib/treeGroups';

const HowSection = ({
  node,
  children,
  nodes,
  normalizedGroups,
  setRelation,
  addGroup,
  removeGroup,
  assignChildToGroup,
  updateGroup,
  onSelectNode,
  t
}) => {
  const [isHowOpen, setIsHowOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');

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

  return (
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
                const groupProgress = calculateGroupProgress(nodes, group);
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
  );
};

export default HowSection;
