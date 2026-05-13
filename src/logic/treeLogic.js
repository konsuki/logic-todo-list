/**
 * LogiDo Tree Logic Engine
 * Handles recursive calculations and structural changes.
 */

export const NODE_TYPES = {
  GOAL: 'GOAL',
  STRATEGY: 'STRATEGY',
  ACTION: 'ACTION'
};

export const NODE_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
};

/**
 * Calculates progress for a single node based on its children.
 * If leaf (Action), progress is 0 or 100 based on status.
 * If branch, progress is the average of children's progress.
 */
export const calculateNodeProgress = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node) return 0;

  // Leaf node (Action) - Simplified binary progress for MVP
  if (!node.children || node.children.length === 0) {
    return node.status === NODE_STATUS.DONE ? 100 : 0;
  }

  // Branch/Root node - Average of children
  const totalProgress = node.children.reduce((acc, childId) => {
    return acc + (nodes[childId]?.progress || 0);
  }, 0);

  return Math.round(totalProgress / node.children.length);
};

/**
 * Recursively updates progress for a node and all its ancestors.
 */
export const updateProgressRecursively = (nodes, nodeId) => {
  const newNodes = { ...nodes };
  let currentId = nodeId;

  while (currentId) {
    const node = newNodes[currentId];
    if (!node) break;

    const newProgress = calculateNodeProgress(newNodes, currentId);
    
    newNodes[currentId] = { 
      ...node, 
      progress: newProgress,
      status: newProgress === 100 ? NODE_STATUS.DONE : 
              newProgress > 0 ? NODE_STATUS.IN_PROGRESS : NODE_STATUS.TODO
    };

    currentId = node.parentId;
  }

  return newNodes;
};

/**
 * Checks if a node is locked due to unsatisfied dependencies.
 */
export const isNodeLocked = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node || !node.dependsOn || node.dependsOn.length === 0) return false;

  // If any dependency is NOT DONE, the node is locked
  return node.dependsOn.some(depId => {
    const depNode = nodes[depId];
    return !depNode || depNode.status !== NODE_STATUS.DONE;
  });
};

/**
 * Checks for circular dependencies.
 */
export const checkCircularDependency = (nodes, nodeId, dependencyId) => {
  if (nodeId === dependencyId) return true;
  
  const visited = new Set();
  const queue = [dependencyId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === nodeId) return true;
    
    if (!visited.has(currentId)) {
      visited.add(currentId);
      const currentNode = nodes[currentId];
      if (currentNode && currentNode.dependsOn) {
        queue.push(...currentNode.dependsOn);
      }
    }
  }
  
  return false;
};

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
      status: NODE_STATUS.TODO,
      progress: 0,
      children: [],
      dependsOn: [],
      phase: 'PREP', // Default phase
      dueDate: null, // Default due date
      order: nextOrder++, // Assign sequential order
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
 * Deletes a node and all its descendants.
 * Also cleans up dependencies pointing to deleted nodes.
 */
export const deleteNode = (nodes, nodeId) => {
  let newNodes = { ...nodes };
  const nodeToDelete = newNodes[nodeId];
  if (!nodeToDelete) return nodes;

  const parentId = nodeToDelete.parentId;

  const getDescendants = (id) => {
    let ids = [id];
    const node = newNodes[id];
    if (node && node.children) {
      node.children.forEach(childId => {
        ids = [...ids, ...getDescendants(childId)];
      });
    }
    return ids;
  };

  const allIdsToDelete = new Set(getDescendants(nodeId));
  
  // 1. Delete nodes
  Object.keys(newNodes).forEach(id => {
    if (allIdsToDelete.has(id)) {
      delete newNodes[id];
    } else {
      // 2. Clean up dependencies
      if (newNodes[id].dependsOn) {
        newNodes[id].dependsOn = newNodes[id].dependsOn.filter(depId => !allIdsToDelete.has(depId));
      }
    }
  });

  if (parentId && newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      children: newNodes[parentId].children.filter(id => id !== nodeId)
    };
    return updateProgressRecursively(newNodes, parentId);
  }

  return newNodes;
};

/**
 * Toggles a node's status (TODO <-> DONE).
 * Prevents setting to DONE if locked.
 */
export const toggleNodeStatus = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const isCurrentDone = node.status === NODE_STATUS.DONE;
  
  // If trying to mark as DONE but locked, do nothing
  if (!isCurrentDone && isNodeLocked(nodes, nodeId)) {
    return nodes;
  }

  const newStatus = isCurrentDone ? NODE_STATUS.TODO : NODE_STATUS.DONE;
  let newNodes = { ...nodes };

  const setStatusRecursively = (id, status) => {
    const n = newNodes[id];
    if (!n) return;
    
    newNodes[id] = { 
      ...n, 
      status, 
      progress: status === NODE_STATUS.DONE ? 100 : 0 
    };
    
    if (n.children) {
      n.children.forEach(childId => setStatusRecursively(childId, status));
    }
  };

  setStatusRecursively(nodeId, newStatus);
  return updateProgressRecursively(newNodes, node.parentId);
};

/**
 * Flattens the tree into a linear sequence for Flow View.
 * Visits nodes in pre-order, sorting siblings by their 'order' property.
 */
export const getFlattenedFlow = (nodes, rootNodes) => {
  const result = [];
  const visited = new Set();

  const traverse = (nodeId, depth = 0) => {
    if (!nodeId || visited.has(nodeId)) return;
    const node = nodes[nodeId];
    if (!node) return;

    visited.add(nodeId);

    if (node.children && node.children.length > 0) {
      const sortedChildren = [...node.children].sort((a, b) => {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        return (nodeA?.order || 0) - (nodeB?.order || 0);
      });

      sortedChildren.forEach(childId => traverse(childId, depth + 1));
    }

    // Push node with extra metadata
    const isMilestone = node.type === 'GOAL' || node.type === 'STRATEGY';
    result.push({
      ...node,
      depth,
      isMilestone,
      groupParentId: node.parentId // Children of this node will have this node's ID as groupParentId
    });
  };

  const sortedRoots = [...rootNodes].sort((a, b) => (a.order || 0) - (b.order || 0));
  sortedRoots.forEach(root => traverse(root.id, 0));

  return result;
};

/**
 * Returns a flattened list of nodes that are currently visible (not hidden by collapsed parents).
 * Used for keyboard navigation.
 */
export const getVisibleNodesList = (nodes, rootNodes, expandedNodeIds) => {
  const result = [];
  
  const traverse = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return;
    
    result.push(node);
    
    // Only traverse children if this node is expanded
    if (expandedNodeIds.has(nodeId) && node.children && node.children.length > 0) {
      const sortedChildren = [...node.children].sort((a, b) => {
        return (nodes[a]?.order || 0) - (nodes[b]?.order || 0);
      });
      sortedChildren.forEach(childId => traverse(childId));
    }
  };

  const sortedRoots = [...rootNodes].sort((a, b) => (a.order || 0) - (b.order || 0));
  sortedRoots.forEach(root => traverse(root.id));

  return result;
};

/**
 * Converts the flat nodes map into a nested tree structure for react-arborist.
 * Each node becomes: { id, name, children?, ...originalNodeData }
 */
export const buildArboristTree = (nodes, rootNodes) => {
  const buildNode = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const sortedChildIds = node.children && node.children.length > 0
      ? [...node.children].sort((a, b) => (nodes[a]?.order || 0) - (nodes[b]?.order || 0))
      : [];

    const children = sortedChildIds.length > 0
      ? sortedChildIds.map(buildNode).filter(Boolean)
      : undefined; // undefined = leaf node in react-arborist

    return {
      ...node,
      name: node.title,
      children,
    };
  };

  const sortedRoots = [...rootNodes].sort((a, b) => (a.order || 0) - (b.order || 0));
  return sortedRoots.map(root => buildNode(root.id)).filter(Boolean);
};
