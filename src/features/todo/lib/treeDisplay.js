/**
 * LogiDo Tree Logic — 検索・表示
 * フロービュー用の平坦化・キーボードナビ用の可視ノード列挙・
 * react-arborist 用ツリー構築・ノード検索を担う。
 */

import { NODE_TYPES } from './treeConstants.js';

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
    const isMilestone = node.type === NODE_TYPES.GOAL || node.type === NODE_TYPES.STRATEGY;
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
