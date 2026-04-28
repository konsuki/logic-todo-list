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
    
    // If progress hasn't changed, we might still need to update status
    // but if it's the same, we can potentially break early if no status change needed.
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
 * Creates a new node and attaches it to its parent.
 */
export const addNode = (nodes, parentId, type, title = 'New Task') => {
  const id = crypto.randomUUID();
  const newNode = {
    id,
    parentId,
    type,
    title,
    description: '',
    status: NODE_STATUS.TODO,
    progress: 0,
    children: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  };

  const newNodes = { ...nodes, [id]: newNode };

  if (parentId && newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      children: [...newNodes[parentId].children, id],
      // If adding a child to an ACTION, promote parent to STRATEGY
      type: newNodes[parentId].type === NODE_TYPES.ACTION ? NODE_TYPES.STRATEGY : newNodes[parentId].type
    };
  }

  return updateProgressRecursively(newNodes, parentId);
};

/**
 * Deletes a node and all its descendants.
 */
export const deleteNode = (nodes, nodeId) => {
  const newNodes = { ...nodes };
  const nodeToDelete = newNodes[nodeId];
  if (!nodeToDelete) return nodes;

  const parentId = nodeToDelete.parentId;

  // Recursive helper to get all descendant IDs
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

  const allIdsToDelete = getDescendants(nodeId);
  allIdsToDelete.forEach(id => delete newNodes[id]);

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
 */
export const toggleNodeStatus = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const newStatus = node.status === NODE_STATUS.DONE ? NODE_STATUS.TODO : NODE_STATUS.DONE;
  
  let newNodes = { ...nodes };

  // If setting to DONE, set all descendants to DONE
  // If setting to TODO, set all descendants to TODO
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

  // Then update ancestors up to the root
  return updateProgressRecursively(newNodes, node.parentId);
};
