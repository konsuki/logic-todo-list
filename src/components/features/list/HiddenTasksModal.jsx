import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Inbox } from 'lucide-react';
import './HiddenTasksModal.css';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.25 }
  }),
};

const HiddenTasksModal = ({ isOpen, onClose, hiddenRootNodes, nodes, onUnhide, t }) => {
  const countDescendants = (nodeId) => {
    const node = nodes[nodeId];
    if (!node || !node.children || node.children.length === 0) return 0;
    return node.children.reduce((acc, childId) => {
      return acc + 1 + countDescendants(childId);
    }, 0);
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="hidden-modal-backdrop-container">
          <motion.div
            className="hidden-modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            className="hidden-tasks-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="modal-header">
              <div className="header-title">
                <EyeOff size={18} className="header-icon" />
                <h2>{t('list.hidden_tasks')}</h2>
                {hiddenRootNodes.length > 0 && (
                  <span className="hidden-count-badge">{hiddenRootNodes.length}</span>
                )}
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="hidden-modal-body">
              {hiddenRootNodes.length === 0 ? (
                <div className="hidden-empty">
                  <Inbox size={48} strokeWidth={1.2} />
                  <p>{t('list.no_hidden_tasks')}</p>
                </div>
              ) : (
                <ul className="hidden-list">
                  {hiddenRootNodes.map((node, i) => {
                    const childCount = countDescendants(node.id);
                    return (
                      <motion.li
                        key={node.id}
                        className="hidden-item"
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <div className="hidden-item-info">
                          <div className="hidden-item-type-badge" data-type={node.type}>
                            {node.type}
                          </div>
                          <div className="hidden-item-title">{node.title}</div>
                          <div className="hidden-item-meta">
                            {childCount > 0 && (
                              <span className="hidden-item-children">子タスク {childCount} 件</span>
                            )}
                          </div>
                        </div>
                        <div className="hidden-item-actions">
                          <button
                            className="hidden-btn restore"
                            onClick={() => onUnhide(node.id)}
                            title={t('common.unhide_task')}
                          >
                            <Eye size={14} />
                            <span>{t('common.unhide_task')}</span>
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HiddenTasksModal;
