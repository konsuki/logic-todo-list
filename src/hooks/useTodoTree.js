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

    // DEV only: export tree data to filesystem for MCP server consumption
    if (import.meta.env.DEV) {
      fetch('/__bizyu_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodes),
      }).catch(err => console.error('[bizyu-export] Export failed:', err));
    }
  }, [nodes]);

  const handleAddNode = useCallback((parentId, type, title, predefinedId) => {
    setNodes(prev => treeLogic.addNode(prev, parentId, type, title, predefinedId));
  }, []);

  const handleAddNodes = useCallback((parentId, type, titles) => {
    setNodes(prev => treeLogic.addNodes(prev, parentId, type, titles));
  }, []);

  const handleAddTreeUnderNode = useCallback((parentId, treeDataArray) => {
    setNodes(prev => treeLogic.addTreeUnderNode(prev, parentId, treeDataArray));
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

  const handleHideNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.hideNode(prev, nodeId));
  }, []);

  const handleUnhideNode = useCallback((nodeId) => {
    setNodes(prev => treeLogic.unhideNode(prev, nodeId));
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

  const handleSetRelation = useCallback((nodeId, relation) => {
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node) return prev;

      const updates = { relation, updatedAt: Date.now() };
      if (relation === 'and') {
        // Switching back to AND resets groups (no longer meaningful)
        updates.groups = [];
      } else if (relation === 'or' && !Array.isArray(node.groups)) {
        // Default OR: every child is an independent single-child group
        updates.groups = [];
      }

      return {
        ...prev,
        [nodeId]: { ...node, ...updates }
      };
    });
  }, []);

  const handleAddGroup = useCallback((nodeId) => {
    setNodes(prev => treeLogic.addGroup(prev, nodeId));
  }, []);

  const handleRemoveGroup = useCallback((nodeId, groupId) => {
    setNodes(prev => treeLogic.removeGroup(prev, nodeId, groupId));
  }, []);

  const handleAssignChildToGroup = useCallback((nodeId, childId, groupId) => {
    setNodes(prev => treeLogic.assignChildToGroup(prev, nodeId, childId, groupId));
  }, []);

  const handleUpdateGroup = useCallback((nodeId, groupId, updates) => {
    setNodes(prev => treeLogic.updateGroup(prev, nodeId, groupId, updates));
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

  // Active root nodes (exclude soft-deleted and hidden)
  const rootNodes = Object.values(nodes).filter(node => !node.parentId && !node.deletedAt && !node.hidden);

  // Soft-deleted root nodes → shown in the trash view
  const trashedRootNodes = Object.values(nodes).filter(node => !node.parentId && !!node.deletedAt);

  // Hidden root nodes → shown in the hidden tasks modal
  // A "hidden root" is a hidden node whose parent is NOT hidden (i.e. the entry point of hiding)
  const hiddenRootNodes = Object.values(nodes).filter(node =>
    !node.deletedAt &&
    !!node.hidden &&
    (!node.parentId || !nodes[node.parentId]?.hidden)
  );

  return {
    nodes,
    rootNodes,
    trashedRootNodes,
    hiddenRootNodes,
    addNode: handleAddNode,
    addNodes: handleAddNodes,
    addTreeUnderNode: handleAddTreeUnderNode,
    importNodes: handleImportNodes,
    deleteNode: handleDeleteNode,
    restoreNode: handleRestoreNode,
    permanentDeleteNode: handlePermanentDeleteNode,
    hideNode: handleHideNode,
    unhideNode: handleUnhideNode,
    toggleStatus: handleToggleStatus,
    updateNode: handleUpdateNode,
    setRelation: handleSetRelation,
    addGroup: handleAddGroup,
    removeGroup: handleRemoveGroup,
    assignChildToGroup: handleAssignChildToGroup,
    updateGroup: handleUpdateGroup,
    addDependency: handleAddDependency,
    removeDependency: handleRemoveDependency,
    reorderNode: handleReorderNode,
    outdentNode: handleOutdentNode,
    moveNode: handleMoveNode,
    isNodeLocked: (nodeId) => treeLogic.isNodeLocked(nodes, nodeId)
  };
};

