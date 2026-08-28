/**
 * LogiDo Tree Logic — フォルダ
 * フォルダノードの判定・作成・割当・削除・フォルダツリー構築を担う。
 */

import { NODE_TYPES, NODE_STATUS, PHASES } from './treeConstants.js';

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
    procedure: '',
    status: NODE_STATUS.TODO,
    progress: 0,
    children: [],
    dependsOn: [],
    phase: PHASES.PREP,
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
