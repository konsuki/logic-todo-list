/**
 * LogiDo Tree Logic — 削除・非表示（ライフサイクル）
 * ノードのソフト削除・非表示・復元・完全削除を担う。
 */

import { updateProgressRecursively } from './treeProgress.js';

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
