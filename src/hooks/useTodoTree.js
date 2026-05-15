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

  const handleAddNode = useCallback((parentId, type, title, predefinedId) => {
    setNodes(prev => treeLogic.addNode(prev, parentId, type, title, predefinedId));
  }, []);

  const handleAddNodes = useCallback((parentId, type, titles) => {
    setNodes(prev => treeLogic.addNodes(prev, parentId, type, titles));
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.softDeleteNode(prev, nodeId));
  }, []);

  const handleRestoreNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.restoreNode(prev, nodeId));
  }, []);

  const handlePermanentDeleteNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.permanentDeleteNode(prev, nodeId));
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

  const handleOutdentNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.outdentNode(prev, nodeId));
  }, []);

  const handleMoveNode = useCallback((dragIds, newParentId, index) => {
    setNodes(prev => {
      const nodeId = dragIds[0];
      const node = prev[nodeId];
      if (!node) return prev;

      let newNodes = { ...prev };
      const oldParentId = node.parentId;

      // 1. Remove from old parent's children
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId] = {
          ...newNodes[oldParentId],
          children: newNodes[oldParentId].children.filter(id => id !== nodeId),
        };
      }

      // 2. Insert into new parent's children at index
      if (newParentId && newNodes[newParentId]) {
        const parentChildren = [...(newNodes[newParentId].children || [])];
        parentChildren.splice(index, 0, nodeId);
        newNodes[newParentId] = {
          ...newNodes[newParentId],
          children: parentChildren,
        };
      }

      // 3. Update the moved node's parentId
      newNodes[nodeId] = {
        ...newNodes[nodeId],
        parentId: newParentId || null,
      };

      // 4. Re-assign order for all siblings in the new parent
      const newSiblingIds = newParentId && newNodes[newParentId]
        ? newNodes[newParentId].children
        : Object.values(newNodes).filter(n => !n.parentId).sort((a, b) => (a.order || 0) - (b.order || 0)).map(n => n.id);

      // For root-level drops without a parent, insert at index
      if (!newParentId) {
        const rootIds = Object.values(newNodes)
          .filter(n => !n.parentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(n => n.id);
        // Re-order: remove nodeId then insert at index
        const filtered = rootIds.filter(id => id !== nodeId);
        filtered.splice(index, 0, nodeId);
        filtered.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      } else {
        newSiblingIds.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      }

      // 5. Also re-assign order for old parent's remaining children
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId].children.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      }

      // 6. Recalculate progress for both old and new parents
      if (oldParentId) {
        newNodes = treeLogic.updateProgressRecursively(newNodes, oldParentId);
      }
      if (newParentId) {
        newNodes = treeLogic.updateProgressRecursively(newNodes, newParentId);
      }

      return newNodes;
    });
  }, []);

  const handleImportNodes = useCallback((importedData) => {
    setNodes(prev => treeLogic.importTreeToNodes(prev, importedData));
  }, []);

  // Active root nodes (exclude soft-deleted)
  const rootNodes = Object.values(nodes).filter(node => !node.parentId && !node.deletedAt);

  // Soft-deleted root nodes → shown in the trash view
  const trashedRootNodes = Object.values(nodes).filter(node => !node.parentId && !!node.deletedAt);

  return {
    nodes,
    rootNodes,
    trashedRootNodes,
    addNode: handleAddNode,
    addNodes: handleAddNodes,
    importNodes: handleImportNodes,
    deleteNode: handleDeleteNode,
    restoreNode: handleRestoreNode,
    permanentDeleteNode: handlePermanentDeleteNode,
    toggleStatus: handleToggleStatus,
    updateNode: handleUpdateNode,
    addDependency: handleAddDependency,
    removeDependency: handleRemoveDependency,
    reorderNode: handleReorderNode,
    outdentNode: handleOutdentNode,
    moveNode: handleMoveNode,
    isNodeLocked: (nodeId) => treeLogic.isNodeLocked(nodes, nodeId)
  };
};

