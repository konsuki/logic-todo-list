import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, X, Inbox } from 'lucide-react';
import './TrashView.css';

const TrashView = ({ isOpen, onClose, trashedRootNodes, nodes, onRestore, onPermanentDelete, t }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const countDescendants = (nodeId) => {
    const node = nodes[nodeId];
    if (!node || !node.children || node.children.length === 0) return 0;
    return node.children.reduce((acc, childId) => {
      return acc + 1 + countDescendants(childId);
    }, 0);
  };

  const handlePermanentDelete = (nodeId, title) => {
    if (window.confirm(`「${title}」とその子タスクをすべて完全に削除しますか？\nこの操作は取り消せません。`)) {
      onPermanentDelete(nodeId);
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 220 } },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.06, duration: 0.25 }
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="trash-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="trash-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="trash-header">
              <div className="trash-header-title">
                <Trash2 size={18} />
                <span>ゴミ箱</span>
                {trashedRootNodes.length > 0 && (
                  <span className="trash-count-badge">{trashedRootNodes.length}</span>
                )}
              </div>
              <button className="trash-close-btn" onClick={onClose} aria-label="閉じる">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="trash-body">
              {trashedRootNodes.length === 0 ? (
                <div className="trash-empty">
                  <Inbox size={48} strokeWidth={1.2} />
                  <p>ゴミ箱は空です</p>
                  <span>削除したタスクはここに保存されます</span>
                </div>
              ) : (
                <ul className="trash-list">
                  {trashedRootNodes
                    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
                    .map((node, i) => {
                      const childCount = countDescendants(node.id);
                      return (
                        <motion.li
                          key={node.id}
                          className="trash-item"
                          custom={i}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className="trash-item-info">
                            <div className="trash-item-type-badge" data-type={node.type}>
                              {node.type}
                            </div>
                            <div className="trash-item-title">{node.title}</div>
                            <div className="trash-item-meta">
                              {childCount > 0 && (
                                <span className="trash-item-children">子タスク {childCount} 件</span>
                              )}
                              <span className="trash-item-date">
                                削除日時: {formatDate(node.deletedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="trash-item-actions">
                            <button
                              className="trash-btn restore"
                              onClick={() => onRestore(node.id)}
                              title="復元する"
                            >
                              <RotateCcw size={14} />
                              <span>復元</span>
                            </button>
                            <button
                              className="trash-btn permanent"
                              onClick={() => handlePermanentDelete(node.id, node.title)}
                              title="完全に削除する"
                            >
                              <Trash2 size={14} />
                              <span>完全削除</span>
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TrashView;
