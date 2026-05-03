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
  t,
  editingNodeId,
  setEditingNodeId,
  outdentNode,
  setExpandedNodeIds
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const visibleNodes = treeLogic.getVisibleNodesList(nodes, rootNodes, expandedNodeIds);
          if (visibleNodes.length === 0) return;

          const currentIndex = visibleNodes.findIndex(n => n.id === selectedNodeId);
          let nextIndex = 0;

          if (e.code === 'ArrowUp') {
            nextIndex = currentIndex <= 0 ? visibleNodes.length - 1 : currentIndex - 1;
          } else {
            nextIndex = currentIndex >= visibleNodes.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1;
          }

          setSelectedNodeId(visibleNodes[nextIndex].id);
          break;
        }

        case 'Enter':
        case 'NumpadEnter': {
          e.preventDefault();
          if (!selectedNodeId) return;
          const node = nodes[selectedNodeId];
          if (!node) return;

          const newId = crypto.randomUUID();
          addNode(node.parentId, node.type, 'New Task', newId);
          setSelectedNodeId(newId);
          setEditingNodeId(newId);
          break;
        }

        case 'Tab': {
          e.preventDefault();
          if (!selectedNodeId) return;
          const node = nodes[selectedNodeId];
          if (!node) return;

          if (e.shiftKey) {
            // Shift + Tab: Outdent
            outdentNode(selectedNodeId);
          } else {
            // Tab: Add Child
            const newId = crypto.randomUUID();
            // Default new child type based on parent logic will be handled by treeLogic, but we pass 'ACTION' as default
            addNode(selectedNodeId, 'ACTION', 'New Task', newId);
            
            // Expand parent so we can see the new child safely
            setExpandedNodeIds(prev => {
              const next = new Set(prev);
              next.add(selectedNodeId);
              return next;
            });
            
            setSelectedNodeId(newId);
            setEditingNodeId(newId);
          }
          break;
        }

        case 'Space': { // Space
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

        case 'KeyV': {
          setView(view === 'list' ? 'tree' : 'list');
          break;
        }

        case 'KeyI': {
          setIsInspectorOpen(!isInspectorOpen);
          break;
        }

        case 'KeyP': {
          if (e.altKey) {
            e.preventDefault();
            setView(prev => prev === 'preview' ? 'list' : 'preview');
          }
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
    t,
    editingNodeId,
    setEditingNodeId,
    outdentNode,
    setExpandedNodeIds
  ]);
};
