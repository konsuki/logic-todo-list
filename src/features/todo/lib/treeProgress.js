/**
 * LogiDo Tree Logic — 進捗・状態・依存
 * ノードの進捗計算・再帰更新・ロック判定・循環依存チェック・状態トグルを担う。
 */

import { NODE_STATUS } from './treeConstants.js';
import { normalizeOrGroups } from './treeGroups.js';

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
