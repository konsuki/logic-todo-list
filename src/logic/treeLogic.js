/**
 * LogiDo Tree Logic Engine
 * Handles recursive calculations and structural changes.
 */

export const NODE_TYPES = {
  GOAL: 'GOAL',
  STRATEGY: 'STRATEGY',
  ACTION: 'ACTION',
  FOLDER: 'FOLDER'
};

export const NODE_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
};

/**
 * Color palette for auto-assigning group colors.
 */
export const GROUP_COLOR_PALETTE = [
  '#4F8CFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'
];

/**
 * Normalizes a node's `groups` into a list of group objects, accepting both:
 * - object form: `{ id, name, color, children: [...] }`
 * - legacy form: `["childId", ...]` (a plain array of child IDs)
 *
 * Legacy entries are upgraded to object form with a generated id, default name
 * ("グループN" is applied by callers; here we keep name empty and let UI decide),
 * no color, and `children` = the array itself.
 */
export const normalizeGroups = (groups) => {
  if (!Array.isArray(groups)) return [];
  return groups.map((group, index) => {
    if (Array.isArray(group)) {
      // Legacy form: array of child IDs
      return {
        id: `group-${index}`,
        name: '',
        color: GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
        children: [...group]
      };
    }
    return {
      id: group.id || `group-${index}`,
      name: group.name || '',
      color: group.color || GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
      children: Array.isArray(group.children) ? [...group.children] : []
    };
  });
};

/**
 * Normalizes a node's `groups` into a list of child-ID groups, so that every
 * active child belongs to exactly one group. Used only for OR-relation nodes.
 *
 * - If `groups` is defined, each entry is treated as one group.
 * - Any active child not covered by `groups` becomes a single-child group.
 * - If `groups` is empty/undefined, every active child becomes a single-child group.
 */
export const normalizeOrGroups = (node, activeChildIds) => {
  const groups = normalizeGroups(node.groups);
  const covered = new Set();
  const result = [];

  groups.forEach(group => {
    const activeMembers = group.children.filter(id => activeChildIds.includes(id));
    if (activeMembers.length > 0) {
      result.push(activeMembers);
      activeMembers.forEach(id => covered.add(id));
    }
  });

  // Any active child not covered by an explicit group becomes its own group.
  activeChildIds.forEach(id => {
    if (!covered.has(id)) {
      result.push([id]);
    }
  });

  return result;
};

/**
 * Calculates progress for a single OR group (average of its active children's progress).
 * Used by the group editor UI to display per-group progress.
 */
export const calculateGroupProgress = (nodes, group) => {
  const children = group.children || [];
  if (children.length === 0) return 0;
  const total = children.reduce((acc, childId) => acc + (nodes[childId]?.progress || 0), 0);
  return Math.round(total / children.length);
};

/**
 * [OR Groups] Adds a new group to the node's `groups` (object form).
 * Name defaults to "グループN" (N = next sequential number), color is auto-assigned
 * from the palette, children starts empty.
 */
export const addGroup = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const groups = normalizeGroups(node.groups);
  const nextIndex = groups.length;
  const newGroup = {
    id: crypto.randomUUID(),
    name: `グループ${nextIndex + 1}`,
    color: GROUP_COLOR_PALETTE[nextIndex % GROUP_COLOR_PALETTE.length],
    children: []
  };

  return {
    ...nodes,
    [nodeId]: { ...node, groups: [...groups, newGroup] }
  };
};

/**
 * [OR Groups] Removes a group by id. Its children become unassigned (unclassified).
 */
export const removeGroup = (nodes, nodeId, groupId) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const groups = normalizeGroups(node.groups).filter(g => g.id !== groupId);
  return {
    ...nodes,
    [nodeId]: { ...node, groups }
  };
};

/**
 * [OR Groups] Assigns a child to a group (or null = unassigned).
 * Enforces mutual exclusion: the child is removed from every group except the target.
 */
export const assignChildToGroup = (nodes, nodeId, childId, groupId) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const groups = normalizeGroups(node.groups).map(group => {
    const children = group.children.filter(id => id !== childId);
    if (groupId && group.id === groupId) {
      children.push(childId);
    }
    return { ...group, children };
  });

  return {
    ...nodes,
    [nodeId]: { ...node, groups }
  };
};

/**
 * [OR Groups] Updates a group's metadata (name, color).
 */
export const updateGroup = (nodes, nodeId, groupId, updates) => {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const groups = normalizeGroups(node.groups).map(group =>
    group.id === groupId ? { ...group, ...updates } : group
  );

  return {
    ...nodes,
    [nodeId]: { ...node, groups }
  };
};

/**
 * Calculates progress for a single node based on its children.
 * If leaf (Action), progress is 0 or 100 based on status.
 * If branch with AND relation, progress is the average of children's progress.
 * If branch with OR relation, progress is the max of each group's average progress
 * (best-group strategy), where a group is an alternative way to achieve the node.
 */
export const calculateNodeProgress = (nodes, nodeId) => {
  const node = nodes[nodeId];
  if (!node) return 0;

  // Active children only (exclude soft-deleted and hidden)
  const activeChildren = (node.children || []).filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden);

  // Leaf node (Action) - Simplified binary progress for MVP
  if (activeChildren.length === 0) {
    return node.status === NODE_STATUS.DONE ? 100 : 0;
  }

  // OR relation: progress is the max group progress (best-group strategy)
  if (node.relation === 'or') {
    const groups = normalizeOrGroups(node, activeChildren);
    const groupProgresses = groups.map(group => {
      const total = group.reduce((acc, childId) => acc + (nodes[childId]?.progress || 0), 0);
      return Math.round(total / group.length);
    });
    return groupProgresses.length > 0 ? Math.max(...groupProgresses) : 0;
  }

  // Branch/Root node (AND relation) - Average of active children
  const totalProgress = activeChildren.reduce((acc, childId) => {
    return acc + (nodes[childId]?.progress || 0);
  }, 0);

  return Math.round(totalProgress / activeChildren.length);
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
      intent: '',
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
 * [Soft Delete] Marks a node and all its descendants as deleted by setting `deletedAt`.
 * Data is preserved in localStorage and can be restored from the trash.
 */
export const softDeleteNode = (nodes, nodeId) => {
  let newNodes = { ...nodes };
  const nodeToDelete = newNodes[nodeId];
  if (!nodeToDelete) return nodes;

  const now = Date.now();

  const markDeleted = (id) => {
    const node = newNodes[id];
    if (!node) return;
    newNodes[id] = { ...node, deletedAt: now };
    (node.children || []).forEach(childId => markDeleted(childId));
  };

  markDeleted(nodeId);

  // Recalculate progress for the parent (active children changed)
  const parentId = nodeToDelete.parentId;
  if (parentId && newNodes[parentId]) {
    return updateProgressRecursively(newNodes, parentId);
  }

  return newNodes;
};

/**
 * [Hide] Marks a node and all its descendants as hidden by setting `hidden: true`.
 * Hidden nodes are excluded from list/tree displays but not moved to trash.
 * Unlike soft-delete, this is a lightweight toggle — no confirmation needed.
 */
export const hideNode = (nodes, nodeId) => {
  let newNodes = { ...nodes };
  const nodeToHide = newNodes[nodeId];
  if (!nodeToHide) return nodes;

  const markHidden = (id) => {
    const node = newNodes[id];
    if (!node) return;
    newNodes[id] = { ...node, hidden: true };
    (node.children || []).forEach(childId => markHidden(childId));
  };

  markHidden(nodeId);

  // Recalculate progress for the parent (active children changed)
  const parentId = nodeToHide.parentId;
  if (parentId && newNodes[parentId]) {
    return updateProgressRecursively(newNodes, parentId);
  }

  return newNodes;
};

/**
 * [Unhide] Removes the `hidden` flag from a node and all its descendants.
 * Restores the entire sub-tree back to visible state.
 */
export const unhideNode = (nodes, nodeId) => {
  let newNodes = { ...nodes };
  const nodeToUnhide = newNodes[nodeId];
  if (!nodeToUnhide) return nodes;

  const markUnhidden = (id) => {
    const node = newNodes[id];
    if (!node) return;
    const { hidden, ...rest } = node;
    newNodes[id] = rest;
    (node.children || []).forEach(childId => markUnhidden(childId));
  };

  markUnhidden(nodeId);

  // Recalculate progress for the parent
  const parentId = nodeToUnhide.parentId;
  if (parentId && newNodes[parentId]) {
    return updateProgressRecursively(newNodes, parentId);
  }

  return newNodes;
};

/**
 * [Restore] Removes the `deletedAt` flag from a node and all its descendants.
 * Restores the entire sub-tree from the trash.
 */
export const restoreNode = (nodes, nodeId) => {
  let newNodes = { ...nodes };
  const nodeToRestore = newNodes[nodeId];
  if (!nodeToRestore) return nodes;

  const markRestored = (id) => {
    const node = newNodes[id];
    if (!node) return;
    const { deletedAt, ...rest } = node;
    newNodes[id] = rest;
    (node.children || []).forEach(childId => markRestored(childId));
  };

  markRestored(nodeId);

  // Recalculate progress for the parent
  const parentId = nodeToRestore.parentId;
  if (parentId && newNodes[parentId]) {
    return updateProgressRecursively(newNodes, parentId);
  }

  return newNodes;
};

/**
 * [Permanent Delete] Physically removes a node and all its descendants.
 * Used for "empty trash" / "delete permanently" actions.
 * Also cleans up dependencies pointing to deleted nodes.
 */
export const permanentDeleteNode = (nodes, nodeId) => {
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

  // 1. Remove nodes physically
  Object.keys(newNodes).forEach(id => {
    if (allIdsToDelete.has(id)) {
      delete newNodes[id];
    } else {
      // 2. Clean up dangling dependencies
      if (newNodes[id].dependsOn) {
        newNodes[id].dependsOn = newNodes[id].dependsOn.filter(depId => !allIdsToDelete.has(depId));
      }
      // 3. Clean up parent's children array
      if (newNodes[id].children) {
        newNodes[id].children = newNodes[id].children.filter(cid => !allIdsToDelete.has(cid));
      }
    }
  });

  if (parentId && newNodes[parentId]) {
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
    if (!node || node.deletedAt || node.hidden) return; // Skip soft-deleted and hidden nodes

    visited.add(nodeId);

    if (node.children && node.children.length > 0) {
      const sortedChildren = [...node.children]
        .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden) // Exclude soft-deleted and hidden children
        .sort((a, b) => {
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
      groupParentId: node.parentId
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
    if (!node || node.deletedAt || node.hidden) return; // Skip soft-deleted and hidden nodes

    result.push(node);

    // Only traverse children if this node is expanded
    if (expandedNodeIds.has(nodeId) && node.children && node.children.length > 0) {
      const sortedChildren = [...node.children]
        .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden) // Exclude soft-deleted and hidden children
        .sort((a, b) => (nodes[a]?.order || 0) - (nodes[b]?.order || 0));
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

    // Exclude soft-deleted and hidden children from the tree view
    const activeChildIds = (node.children || [])
      .filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden)
      .sort((a, b) => (nodes[a]?.order || 0) - (nodes[b]?.order || 0));

    const children = activeChildIds.length > 0
      ? activeChildIds.map(buildNode).filter(Boolean)
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

/**
 * [Folder] Returns true if a node is a folder (independent of the causal tree).
 */
export const isFolderNode = (node) => !!node && node.type === NODE_TYPES.FOLDER;

/**
 * [Folder] Creates a folder node.
 * Folders live in the same `nodes` map but are NOT part of the causal tree
 * (`parentId: null` is intentional; they are organized via `folderId`).
 */
export const addFolder = (nodes, parentFolderId = null, title = 'New Folder') => {
  const id = crypto.randomUUID();

  // Circular reference guard: a folder cannot be nested under itself.
  if (parentFolderId && parentFolderId === id) return nodes;

  const folder = {
    id,
    parentId: null,
    type: NODE_TYPES.FOLDER,
    title,
    description: '',
    intent: '',
    status: NODE_STATUS.TODO,
    progress: 0,
    children: [],
    dependsOn: [],
    phase: 'PREP',
    dueDate: null,
    order: 0,
    folderId: parentFolderId,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  };

  return { ...nodes, [id]: folder };
};

/**
 * [Folder] Assigns a task to a folder (or `null` to mark it as unclassified).
 * Only applies to non-folder nodes.
 */
export const assignTaskToFolder = (nodes, taskId, folderId = null) => {
  const node = nodes[taskId];
  if (!node || node.type === NODE_TYPES.FOLDER) return nodes;

  return {
    ...nodes,
    [taskId]: { ...node, folderId }
  };
};

/**
 * [Folder] Physically removes a folder and its descendant folders.
 * Tasks that belonged to the removed folders are reverted to `folderId: null`
 * (unclassified) rather than being deleted.
 */
export const deleteFolder = (nodes, folderId) => {
  const folder = nodes[folderId];
  if (!folder || folder.type !== NODE_TYPES.FOLDER) return nodes;

  // Collect the folder and all descendant folder IDs.
  const folderIdsToDelete = new Set([folderId]);
  const collectDescendantFolders = (parentId) => {
    Object.values(nodes).forEach((n) => {
      if (n.type === NODE_TYPES.FOLDER && n.folderId === parentId && !folderIdsToDelete.has(n.id)) {
        folderIdsToDelete.add(n.id);
        collectDescendantFolders(n.id);
      }
    });
  };
  collectDescendantFolders(folderId);

  const newNodes = { ...nodes };

  // Revert tasks under any removed folder to unclassified, and remove the folder nodes.
  Object.keys(newNodes).forEach((id) => {
    if (folderIdsToDelete.has(id)) {
      delete newNodes[id];
    } else if (newNodes[id].folderId && folderIdsToDelete.has(newNodes[id].folderId)) {
      newNodes[id] = { ...newNodes[id], folderId: null };
    }
  });

  return newNodes;
};

/**
 * [Folder] Builds a tree structure for react-arborist based on the folder
 * hierarchy (`folderId`) instead of the causal `parentId`.
 *
 * Returns a list of root nodes. Folders become branch nodes; tasks are leaves.
 * Tasks with `folderId: null` are grouped under a virtual "unclassified" root.
 */
export const buildFolderTree = (nodes, unclassifiedLabel = 'Uncategorized') => {
  const activeFolders = Object.values(nodes).filter(
    (n) => n.type === NODE_TYPES.FOLDER && !n.deletedAt && !n.hidden
  );
  const activeTasks = Object.values(nodes).filter(
    (n) => n.type !== NODE_TYPES.FOLDER && !n.deletedAt && !n.hidden
  );

  const folderById = new Map(activeFolders.map((f) => [f.id, f]));
  const childFoldersByFolderId = new Map(); // folderId -> array of folder nodes
  const tasksByFolderId = new Map(); // folderId -> array of task nodes
  const unclassified = [];

  const buildArboristNode = (node) => ({
    ...node,
    name: node.title,
    children: undefined
  });

  activeFolders.forEach((folder) => {
    const parentId = folder.folderId;
    if (!childFoldersByFolderId.has(parentId)) childFoldersByFolderId.set(parentId, []);
    childFoldersByFolderId.get(parentId).push(folder);
  });

  activeTasks.forEach((task) => {
    if (task.folderId && folderById.has(task.folderId)) {
      if (!tasksByFolderId.has(task.folderId)) tasksByFolderId.set(task.folderId, []);
      tasksByFolderId.get(task.folderId).push(task);
    } else {
      unclassified.push(task);
    }
  });

  // Recursively build a folder node: its children are child folders + tasks.
  const buildFolder = (folder) => {
    const childFolders = (childFoldersByFolderId.get(folder.id) || [])
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      .map(buildFolder);
    const childTasks = (tasksByFolderId.get(folder.id) || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(buildArboristNode);
    const children = [...childFolders, ...childTasks];
    return {
      ...folder,
      name: folder.title,
      children: children.length > 0 ? children : undefined
    };
  };

  // Root folders are those whose folderId is null (or points to a missing folder).
  const rootFolders = (childFoldersByFolderId.get(null) || [])
    .filter((f) => !f.folderId || !folderById.has(f.folderId))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(buildFolder);

  // Virtual "unclassified" root holding tasks without a folder.
  const unclassifiedRoot = unclassified.length > 0
    ? {
        id: '__unclassified__',
        name: unclassifiedLabel,
        type: NODE_TYPES.FOLDER,
        isVirtual: true,
        children: unclassified.map(buildArboristNode)
      }
    : null;

  return unclassifiedRoot ? [...rootFolders, unclassifiedRoot] : rootFolders;
};

/**
 * [Search] Returns nodes whose title matches `query` (case-insensitive substring).
 * The `mode` option restricts which node types are searched:
 *   - 'logic'  → tasks only (GOAL/STRATEGY/ACTION), folders excluded.
 *   - 'folder' → folders + tasks, excluding the virtual "unclassified" root.
 * Soft-deleted and hidden nodes are always excluded.
 *
 * Returns an array of `{ id, title, type }` for the UI candidate list.
 * An empty/whitespace `query` returns `[]`.
 */
export const searchNodes = (nodes, query, { mode = 'logic' } = {}) => {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  // Escape regex special chars so the query is treated as a literal string.
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'i');

  return Object.values(nodes).filter((node) => {
    if (!node || node.deletedAt || node.hidden) return false;
    if (node.id === '__unclassified__') return false;

    const isFolder = node.type === NODE_TYPES.FOLDER;
    if (mode === 'logic' && isFolder) return false;

    return matcher.test(node.title || '');
  }).map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type
  }));
};
