import { useState, useEffect, useCallback } from 'react';
import * as treeLogic from '../logic/treeLogic';

const STORAGE_KEY = 'logido_tree_data';

/**
 * Custom hook to manage the Todo Tree state and persistence.
 */
export const useTodoTree = () => {
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Persist to LocalStorage whenever nodes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [nodes]);

  const handleAddNode = useCallback((parentId, type, title) => {
    setNodes(prev => treeLogic.addNode(prev, parentId, type, title));
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.deleteNode(prev, nodeId));
  }, []);

  const handleToggleStatus = useCallback((nodeId) => {
    setNodes(prev => treeLogic.toggleNodeStatus(prev, nodeId));
  }, []);

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node) return prev;
      
      const newNodes = {
        ...prev,
        [nodeId]: { ...node, ...updates, updatedAt: Date.now() }
      };
      
      // If title or description changed, no need to recalculate progress
      // but if status or other logic-heavy fields changed, we might.
      // For now, simple update.
      return newNodes;
    });
  }, []);

  /**
   * Helper to get the root nodes (those without parentId)
   */
  const rootNodes = Object.values(nodes).filter(node => !node.parentId);

  return {
    nodes,
    rootNodes,
    addNode: handleAddNode,
    deleteNode: handleDeleteNode,
    toggleStatus: handleToggleStatus,
    updateNode: handleUpdateNode
  };
};
