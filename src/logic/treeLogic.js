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
    dependsOn: [], // New dependency field
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
      type: newNodes[parentId].type === NODE_TYPES.ACTION ? NODE_TYPES.STRATEGY : newNodes[parentId].type
    };
  }

  return updateProgressRecursively(newNodes, parentId);
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
