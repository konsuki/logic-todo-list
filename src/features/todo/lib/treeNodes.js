/**
 * LogiDo Tree Logic — ノード CRUD・構造
 * ノードの追加・一括追加・木構造追加・インポート・並び替え・アウトデントを担う。
 */

import { NODE_TYPES, NODE_STATUS } from './treeConstants.js';
import { updateProgressRecursively } from './treeProgress.js';

/**
 * Creates a new node and attaches it to its parent.
 */
export const addNode = (nodes, parentId, type, title = 'New Task', predefinedId = null) => {
  const item = predefinedId ? { title, id: predefinedId } : title;
  return addNodes(nodes, parentId, type, [item]);
};

/**
 * Creates multiple nodes and attaches them to their parent in sequence.
 */
export const addNodes = (nodes, parentId, type, titles) => {
  if (!titles || titles.length === 0) return nodes;

  let newNodes = { ...nodes };

  // Calculate starting order based on existing siblings
  let nextOrder = 0;
  if (parentId && nodes[parentId]) {
    const siblingIds = nodes[parentId].children || [];
    const maxOrder = siblingIds.reduce((max, sid) => {
      return Math.max(max, nodes[sid]?.order || 0);
    }, -1);
    nextOrder = maxOrder + 1;
  } else {
    // Root level order
    const rootIds = Object.values(nodes).filter(n => !n.parentId).map(n => n.id);
    const maxOrder = rootIds.reduce((max, rid) => {
      return Math.max(max, nodes[rid]?.order || 0);
    }, -1);
    nextOrder = maxOrder + 1;
  }

  const newChildIds = [];

  titles.forEach(item => {
    // Handle both simple strings and { title, description } objects
    const title = typeof item === 'string' ? item : item.title;
    const description = typeof item === 'object' ? (item.description || '') : '';

    const id = (typeof item === 'object' && item.id) ? item.id : crypto.randomUUID();
    const newNode = {
      id,
      parentId,
      type,
      title,
      description,
      intent: '',
      procedure: '',
      status: NODE_STATUS.TODO,
      progress: 0,
      children: [],
      dependsOn: [],
      phase: 'PREP', // Default phase
      dueDate: null, // Default due date
      order: nextOrder++, // Assign sequential order
      folderId: null, // Default: unclassified
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    newNodes[id] = newNode;
    newChildIds.push(id);
  });

  if (parentId && newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      children: [...(newNodes[parentId].children || []), ...newChildIds],
      // If parent was ACTION, it becomes STRATEGY when children are added
      type: newNodes[parentId].type === NODE_TYPES.ACTION ? NODE_TYPES.STRATEGY : newNodes[parentId].type
    };
  }

  return updateProgressRecursively(newNodes, parentId);
};

/**
 * Creates multiple nodes from a nested tree structure (like AI JSON) under a specific parent.
 * It recurses through treeDataArray (which contains {title, description, children[]})
 */
export const addTreeUnderNode = (nodes, parentId, treeDataArray) => {
  if (!treeDataArray || treeDataArray.length === 0) return nodes;

  let currentNodes = { ...nodes };
  const parentNode = currentNodes[parentId];

  // Calculate starting order
  let nextOrder = 0;
  if (parentNode) {
    const siblingIds = parentNode.children || [];
    const maxOrder = siblingIds.reduce((max, sid) => {
      return Math.max(max, currentNodes[sid]?.order || 0);
    }, -1);
    nextOrder = maxOrder + 1;
  }

  const addRecursive = (pid, pType, nodeData) => {
    const id = crypto.randomUUID();
    const type = pType === NODE_TYPES.GOAL ? NODE_TYPES.STRATEGY : NODE_TYPES.ACTION;

    const newNode = {
      id,
      parentId: pid,
      type,
      title: nodeData.title || "無題",
      description: nodeData.description || "",
      status: NODE_STATUS.TODO,
      progress: 0,
      children: [],
      dependsOn: [],
      phase: 'PREP',
      dueDate: null,
      order: 0, // Will be set by parent mapping
      folderId: null, // Default: unclassified
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    currentNodes[id] = newNode;

    if (nodeData.children && nodeData.children.length > 0) {
      const childIds = nodeData.children.map((child, idx) => {
        const cid = addRecursive(id, type, child);
        currentNodes[cid].order = idx;
        return cid;
      });
      currentNodes[id].children = childIds;
      if (currentNodes[id].type === NODE_TYPES.ACTION) {
        currentNodes[id].type = NODE_TYPES.STRATEGY; // upgrade type if it has children
      }
    }
    return id;
  };

  const parentType = parentNode ? parentNode.type : NODE_TYPES.GOAL;
  const newChildIds = treeDataArray.map((childData, idx) => {
    const cid = addRecursive(parentId, parentType, childData);
    currentNodes[cid].order = nextOrder + idx;
    return cid;
  });

  if (parentNode) {
    currentNodes[parentId] = {
      ...parentNode,
      children: [...(parentNode.children || []), ...newChildIds],
      type: parentNode.type === NODE_TYPES.ACTION && newChildIds.length > 0 ? NODE_TYPES.STRATEGY : parentNode.type
    };
    return updateProgressRecursively(currentNodes, parentId);
  }

  return currentNodes;
};

/**
 * Reorders a node relative to its siblings.
 * direction: 'up' | 'down'
 */
export const reorderNode = (nodes, nodeId, direction) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const parentId = node.parentId;

  // Get all siblings and ensure they have valid unique orders
  let siblings = Object.values(nodes)
    .filter(n => n.parentId === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.metadata?.createdAt || 0) - (b.metadata?.createdAt || 0));

  const newNodes = { ...nodes };

  // Repair step: Re-assign orders if there's any ambiguity or missing values
  siblings.forEach((s, idx) => {
    newNodes[s.id] = { ...newNodes[s.id], order: idx };
  });

  // Re-fetch sorted siblings with repaired orders
  const repairedSiblings = siblings.map(s => newNodes[s.id]);

  const currentIndex = repairedSiblings.findIndex(n => n.id === nodeId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= repairedSiblings.length) return nodes;

  const targetNode = repairedSiblings[targetIndex];
  const currentNode = newNodes[nodeId];

  // Swap orders
  const tempOrder = currentNode.order;
  newNodes[nodeId] = { ...currentNode, order: targetNode.order };
  newNodes[targetNode.id] = { ...targetNode, order: tempOrder };

  // Sync children array order in parent node to match new orders
  if (parentId && newNodes[parentId]) {
    const sortedChildIds = [...newNodes[parentId].children].sort((a, b) => (newNodes[a]?.order || 0) - (newNodes[b]?.order || 0));
    newNodes[parentId] = { ...newNodes[parentId], children: sortedChildIds };
  }

  return newNodes;
};

/**
 * Outdents a node (moves it to become a sibling of its parent).
 */
export const outdentNode = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node || !node.parentId) return nodes;

  const parent = nodes[node.parentId];
  if (!parent) return nodes;

  const newParentId = parent.parentId; // The grandparent
  let newNodes = { ...nodes };

  // Remove from old parent
  newNodes[parent.id] = {
    ...parent,
    children: parent.children.filter(id => id !== nodeId)
  };

  // Add to new parent (or root)
  if (newParentId && newNodes[newParentId]) {
    const newParent = newNodes[newParentId];
    // Insert after the old parent
    const parentIndex = newParent.children.indexOf(parent.id);
    const newChildren = [...newParent.children];
    if (parentIndex !== -1) {
      newChildren.splice(parentIndex + 1, 0, nodeId);
    } else {
      newChildren.push(nodeId);
    }

    newNodes[newParentId] = {
      ...newParent,
      children: newChildren
    };
  }

  // Update node
  newNodes[nodeId] = {
    ...node,
    parentId: newParentId || null
  };

  // Update progress for both old and new paths
  newNodes = updateProgressRecursively(newNodes, parent.id);
  if (newParentId) {
    newNodes = updateProgressRecursively(newNodes, newParentId);
  }

  return newNodes;
};

/**
 * Imports a nested tree structure into the existing nodes map.
 * Each root in importedData will be added as a new GOAL.
 */
export const importTreeToNodes = (nodes, importedData) => {
  let currentNodes = { ...nodes };

  const addRecursive = (parentId, nodeData) => {
    const id = crypto.randomUUID();
    const newNode = {
      id,
      parentId,
      type: nodeData.type,
      title: nodeData.title,
      description: '',
      status: NODE_STATUS.TODO,
      progress: 0,
      children: [],
      dependsOn: [],
      phase: 'PREP',
      order: 0,
      folderId: null, // Default: unclassified
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };

    currentNodes[id] = newNode;

    if (nodeData.children && nodeData.children.length > 0) {
      const childIds = nodeData.children.map((child, idx) => {
        const cid = addRecursive(id, child);
        currentNodes[cid].order = idx;
        return cid;
      });
      currentNodes[id].children = childIds;
      // If it has children but was marked as ACTION, upgrade it
      if (currentNodes[id].type === NODE_TYPES.ACTION) {
        currentNodes[id].type = NODE_TYPES.STRATEGY;
      }
    }

    return id;
  };

  const newRootIds = importedData.map(rootData => addRecursive(null, rootData));

  // Fix root orders
  const allRootNodes = Object.values(currentNodes).filter(n => !n.parentId);
  // Sort by existing order or createdAt
  const sortedRoots = allRootNodes.sort((a, b) => (a.order || 0) - (b.order || 0));
  sortedRoots.forEach((n, idx) => {
    currentNodes[n.id].order = idx;
  });

  // Re-calculate progress for all new nodes (starting from leaves)
  // A simple way is to just call updateProgressRecursively on every new node
  let finalNodes = currentNodes;
  const allNewIds = [];
  const collectIds = (id) => {
    allNewIds.push(id);
    if (finalNodes[id].children) finalNodes[id].children.forEach(collectIds);
  };
  newRootIds.forEach(collectIds);

  // Update from bottom to top by sorting by depth (leaf nodes first)
  // But updateProgressRecursively already handles parent updates, so just calling it on leaves is enough.
  allNewIds.forEach(id => {
    if (!finalNodes[id].children || finalNodes[id].children.length === 0) {
      finalNodes = updateProgressRecursively(finalNodes, id);
    }
  });

  return finalNodes;
};
