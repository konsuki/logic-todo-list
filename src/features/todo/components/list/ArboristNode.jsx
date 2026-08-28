import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, Trash2, Lock, Clock, AlertTriangle, EyeOff, Folder, FolderPlus, Plus } from 'lucide-react';
import { useSettings } from '../../../../lib/settings';
import { NODE_TYPES, NODE_STATUS } from '../../lib/treeConstants';
import { DUE_SOON_THRESHOLD_MS, DESCRIPTION_PREVIEW_MAX_LENGTH } from '../../lib/treeViewConstants';
import './TodoItem.css';

/**
 * Custom node renderer for react-arborist.
 * Reuses the visual design from the original TodoItem.
 */
const ArboristNode = ({ node, style, dragHandle, tree }) => {
  const data = node.data;
  const { settings } = useSettings();
  const [isEditing, setIsEditing] = useState(() => tree.props.editingNodeId === data.id);
  const [editTitle, setEditTitle] = useState(data.title);
  const [isAutoEdit, setIsAutoEdit] = useState(() => tree.props.editingNodeId === data.id);
  const inputRef = useRef(null);

  const isDone = data.status === NODE_STATUS.DONE;
  const isFolder = data.type === NODE_TYPES.FOLDER;
  const isLocked = (data.dependsOn || []).some(depId => {
    const dep = tree.props.allNodes?.[depId];
    return !dep || dep.status !== NODE_STATUS.DONE;
  });

  const childrenCount = data.children ? data.children.length : 0;
  const showMeceWarning = data.type === NODE_TYPES.STRATEGY && childrenCount === 1;

  // Timeline logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  const isOverdue = dueDate && dueDate < today && !isDone;
  const isDueSoon = dueDate && !isOverdue && !isDone && (dueDate.getTime() - today.getTime()) <= DUE_SOON_THRESHOLD_MS;

  // Step number
  const stepNumber = useMemo(() => {
    const siblings = node.parent ? node.parent.children : tree.root.children;
    if (!siblings) return null;
    const index = siblings.findIndex(s => s.id === node.id);
    return index !== -1 ? index + 1 : null;
  }, [node, tree]);

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
                {data.description.length > DESCRIPTION_PREVIEW_MAX_LENGTH ? data.description.substring(0, DESCRIPTION_PREVIEW_MAX_LENGTH) + '...' : data.description}
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

export default ArboristNode;
