import { useEffect } from 'react';
import * as treeLogic from '../logic/treeLogic';

/**
 * Hook to handle global keyboard shortcuts.
 */
export const useShortcuts = ({
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
  t
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const visibleNodes = treeLogic.getVisibleNodesList(nodes, rootNodes, expandedNodeIds);
          if (visibleNodes.length === 0) return;

          const currentIndex = visibleNodes.findIndex(n => n.id === selectedNodeId);
          let nextIndex = 0;

          if (e.key === 'ArrowUp') {
            nextIndex = currentIndex <= 0 ? visibleNodes.length - 1 : currentIndex - 1;
          } else {
            nextIndex = currentIndex >= visibleNodes.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1;
          }

          setSelectedNodeId(visibleNodes[nextIndex].id);
          break;
        }

        case 'Enter': {
          e.preventDefault();
          if (!selectedNodeId) return;
          const node = nodes[selectedNodeId];
          if (!node) return;

          const title = prompt(t('list.enter_task'));
          if (title) {
            addNode(node.parentId, node.type, title);
          }
          break;
        }

        case ' ': { // Space
          e.preventDefault();
          if (selectedNodeId) {
            toggleStatus(selectedNodeId);
          }
          break;
        }

        case 'Delete':
        case 'Backspace': {
          if (!selectedNodeId) return;
          if (window.confirm(t('common.confirm_delete'))) {
            deleteNode(selectedNodeId);
            setSelectedNodeId(null);
          }
          break;
        }

        case 'v':
        case 'V': {
          setView(view === 'list' ? 'tree' : 'list');
          break;
        }

        case 'i':
        case 'I': {
          setIsInspectorOpen(!isInspectorOpen);
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
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
    t
  ]);
};
