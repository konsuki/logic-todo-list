/**
 * LogiDo Tree Logic — OR グループ操作
 * OR 関係ノードのグループ正規化・編集・進捗計算を担う。
 */

import { GROUP_COLOR_PALETTE } from './treeConstants.js';

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
