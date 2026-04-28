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
      
      return {
        ...prev,
        [nodeId]: { ...node, ...updates, updatedAt: Date.now() }
      };
    });
  }, []);

  const handleAddDependency = useCallback((nodeId, predecessorId) => {
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node || !prev[predecessorId]) return prev;
      
      // Check for circular dependency
      if (treeLogic.checkCircularDependency(prev, nodeId, predecessorId)) {
        alert('Circular dependency detected!');
        return prev;
      }
      
      const currentDeps = node.dependsOn || [];
      if (currentDeps.includes(predecessorId)) return prev;
      
      return {
        ...prev,
        [nodeId]: {
          ...node,
          dependsOn: [...currentDeps, predecessorId],
          updatedAt: Date.now()
        }
      };
    });
  }, []);

  const handleRemoveDependency = useCallback((nodeId, predecessorId) => {
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node || !node.dependsOn) return prev;
      
      return {
        ...prev,
        [nodeId]: {
          ...node,
          dependsOn: node.dependsOn.filter(id => id !== predecessorId),
          updatedAt: Date.now()
        }
      };
    });
  }, []);

  const handleReorderNode = useCallback((nodeId, direction) => {
    setNodes(prev => treeLogic.reorderNode(prev, nodeId, direction));
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
    updateNode: handleUpdateNode,
    addDependency: handleAddDependency,
    removeDependency: handleRemoveDependency,
    reorderNode: handleReorderNode,
    isNodeLocked: (nodeId) => treeLogic.isNodeLocked(nodes, nodeId)
  };
};
