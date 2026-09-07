import { useState, useEffect, useCallback, useRef } from 'react';
import { NODE_TYPES, NODE_STATUS } from '../lib/treeConstants';
import { addNode, addNodes, addTreeUnderNode, importTreeToNodes, reorderNode, outdentNode } from '../lib/treeNodes';
import {
  toggleNodeStatus,
  isNodeLocked,
  checkCircularDependency,
  updateProgressRecursively,
} from '../lib/treeProgress';
import { addGroup, removeGroup, assignChildToGroup, updateGroup } from '../lib/treeGroups';
import { softDeleteNode, restoreNode, permanentDeleteNode, hideNode, unhideNode } from '../lib/treeLifecycle';
import { addFolder, deleteFolder, assignTaskToFolder } from '../lib/treeFolders';
import { startTimeTracking, pauseTimeTracking, resumeTimeTracking, completeTimeTracking } from '../lib/timeTracking';
import { syncCalendarEvent } from '../api/googleCalendarApi';

const STORAGE_KEY = 'logido_tree_data';

/**
 * ノード群の最新 updatedAt を返す（起動時優先読み込みの比較に使用）。
 * metadata を持たないノードは 0 扱い。
 */
const getLatestUpdatedAt = (nodes) => {
  if (!nodes || typeof nodes !== 'object') return 0;
  return Object.values(nodes).reduce((max, node) => {
    const ts = node?.metadata?.updatedAt || 0;
    return ts > max ? ts : max;
  }, 0);
};

/**
 * Custom hook to manage the Todo Tree state and persistence.
 */
export const useTodoTree = () => {
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // 起動時優先読み込みの完了フラグ（MCP 書き込みを反映する前にユーザー操作で上書きされるのを防ぐ）
  const initialLoadDone = useRef(false);

  // DEV 時のみ: 起動時に tree_data.json（MCP 書き込みの結果）と localStorage を比較し、
  // ファイルの方が新しければファイルを優先して初期 state に反映する。
  useEffect(() => {
    if (!import.meta.env.DEV) {
      initialLoadDone.current = true;
      return;
    }

    let cancelled = false;

    const exportToFile = (data) => {
      fetch('/__bizyu_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch((err) => console.error('[bizyu-export] Export failed:', err));
    };

    fetch('/__bizyu_export', { method: 'GET' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((fileData) => {
        if (cancelled) return;

        const localData = (() => {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) return {};
          try {
            return JSON.parse(saved);
          } catch {
            return {};
          }
        })();

        // ファイルが無効（null や配列）なら localStorage が正。ファイルを生成して MCP が読める状態にする。
        if (!fileData || typeof fileData !== 'object' || Array.isArray(fileData)) {
          initialLoadDone.current = true;
          exportToFile(localData);
          return;
        }

        const fileUpdated = getLatestUpdatedAt(fileData);
        const localUpdated = getLatestUpdatedAt(localData);

        if (fileUpdated > localUpdated) {
          // ファイル（MCP 書き込み）が新しい → ファイル内容を採用。
          // setNodes により後続の export エフェクトが発火し、localStorage とファイルを同期する。
          initialLoadDone.current = true;
          setNodes(fileData);
        } else {
          // localStorage が正 → そのまま維持し、ファイルを localStorage で再同期する。
          initialLoadDone.current = true;
          if (fileUpdated < localUpdated) {
            exportToFile(localData);
          }
        }
      })
      .catch((err) => {
        console.error('[bizyu-export] 起動時読み込み失敗:', err);
        initialLoadDone.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to LocalStorage whenever nodes change.
  // 初回マウント時は起動時優先読み込み（上記）が完了するまで POST を抑制し、
  // MCP が書き込んだファイルを古い localStorage で上書きする競合を防ぐ。
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));

    // DEV only: export tree data to filesystem for MCP server consumption
    if (import.meta.env.DEV && initialLoadDone.current) {
      fetch('/__bizyu_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodes),
      }).catch((err) => console.error('[bizyu-export] Export failed:', err));
    }
  }, [nodes]);

  const handleAddNode = useCallback((parentId, type, title, predefinedId) => {
    setNodes((prev) => addNode(prev, parentId, type, title, predefinedId));
  }, []);

  const handleAddNodes = useCallback((parentId, type, titles) => {
    setNodes((prev) => addNodes(prev, parentId, type, titles));
  }, []);

  const handleAddTreeUnderNode = useCallback((parentId, treeDataArray) => {
    setNodes((prev) => addTreeUnderNode(prev, parentId, treeDataArray));
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => softDeleteNode(prev, nodeId));
  }, []);

  const handleRestoreNode = useCallback((nodeId) => {
    setNodes((prev) => restoreNode(prev, nodeId));
  }, []);

  const handlePermanentDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => permanentDeleteNode(prev, nodeId));
  }, []);

  const handleHideNode = useCallback((nodeId) => {
    setNodes((prev) => hideNode(prev, nodeId));
  }, []);

  const handleUnhideNode = useCallback((nodeId) => {
    setNodes((prev) => unhideNode(prev, nodeId));
  }, []);

  const handleToggleStatus = useCallback((nodeId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;
      const wasDone = node.status === NODE_STATUS.DONE;
      const next = toggleNodeStatus(prev, nodeId);
      // DONE に遷移した時のみ完了時刻を打刻する（TODO に戻す時は打刻しない）
      if (!wasDone && next[nodeId]?.status === NODE_STATUS.DONE) {
        next[nodeId] = completeTimeTracking(next[nodeId], Date.now());

        // 完了後、計測データがあればカレンダーへ同期する（非同期・失敗は無視）
        const completedNode = next[nodeId];
        const tt = completedNode.timeTracking;
        if (tt?.startAt != null && tt?.completedAt != null) {
          const description = [completedNode.intent, completedNode.description].filter(Boolean).join('\n');
          syncCalendarEvent({
            title: completedNode.title,
            description,
            startAt: tt.startAt,
            completedAt: tt.completedAt,
            eventId: completedNode.calendarEventId,
          })
            .then((eventId) => {
              setNodes((cur) => {
                const n = cur[nodeId];
                if (!n) return cur;
                return { ...cur, [nodeId]: { ...n, calendarEventId: eventId, updatedAt: Date.now() } };
              });
            })
            .catch((err) => {
              console.error('カレンダー同期に失敗しました:', err);
            });
        }
      }
      return next;
    });
  }, []);

  const handleStartTimeTracking = useCallback((nodeId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;
      const updated = startTimeTracking(node, Date.now());
      return { ...prev, [nodeId]: { ...updated, updatedAt: Date.now() } };
    });
  }, []);

  const handlePauseTimeTracking = useCallback((nodeId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;
      const updated = pauseTimeTracking(node, Date.now());
      return { ...prev, [nodeId]: { ...updated, updatedAt: Date.now() } };
    });
  }, []);

  const handleResumeTimeTracking = useCallback((nodeId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;
      const updated = resumeTimeTracking(node, Date.now());
      return { ...prev, [nodeId]: { ...updated, updatedAt: Date.now() } };
    });
  }, []);

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;

      return {
        ...prev,
        [nodeId]: { ...node, ...updates, updatedAt: Date.now() },
      };
    });
  }, []);

  const handleSetRelation = useCallback((nodeId, relation) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;

      const updates = { relation, updatedAt: Date.now() };
      if (relation === 'and') {
        // Switching back to AND resets groups (no longer meaningful)
        updates.groups = [];
      } else if (relation === 'or' && !Array.isArray(node.groups)) {
        // Default OR: every child is an independent single-child group
        updates.groups = [];
      }

      return {
        ...prev,
        [nodeId]: { ...node, ...updates },
      };
    });
  }, []);

  const handleAddGroup = useCallback((nodeId) => {
    setNodes((prev) => addGroup(prev, nodeId));
  }, []);

  const handleRemoveGroup = useCallback((nodeId, groupId) => {
    setNodes((prev) => removeGroup(prev, nodeId, groupId));
  }, []);

  const handleAssignChildToGroup = useCallback((nodeId, childId, groupId) => {
    setNodes((prev) => assignChildToGroup(prev, nodeId, childId, groupId));
  }, []);

  const handleUpdateGroup = useCallback((nodeId, groupId, updates) => {
    setNodes((prev) => updateGroup(prev, nodeId, groupId, updates));
  }, []);

  const handleAddDependency = useCallback((nodeId, predecessorId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node || !prev[predecessorId]) return prev;

      // Check for circular dependency
      if (checkCircularDependency(prev, nodeId, predecessorId)) {
        alert('Circular dependency detected!');
        return prev;
      }

      const currentDeps = node.dependsOn || [];
      if (currentDeps.includes(predecessorId)) return prev;

      return {
        ...prev,
        [nodeId]: {
          ...node,
          dependsOn: [...currentDeps, predecessorId],
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  const handleRemoveDependency = useCallback((nodeId, predecessorId) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node || !node.dependsOn) return prev;

      return {
        ...prev,
        [nodeId]: {
          ...node,
          dependsOn: node.dependsOn.filter((id) => id !== predecessorId),
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  const handleReorderNode = useCallback((nodeId, direction) => {
    setNodes((prev) => reorderNode(prev, nodeId, direction));
  }, []);

  const handleOutdentNode = useCallback((nodeId) => {
    setNodes((prev) => outdentNode(prev, nodeId));
  }, []);

  const handleMoveNode = useCallback((dragIds, newParentId, index) => {
    setNodes((prev) => {
      const nodeId = dragIds[0];
      const node = prev[nodeId];
      if (!node) return prev;

      let newNodes = { ...prev };
      const oldParentId = node.parentId;

      // 1. Remove from old parent's children
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId] = {
          ...newNodes[oldParentId],
          children: newNodes[oldParentId].children.filter((id) => id !== nodeId),
        };
      }

      // 2. Insert into new parent's children at index
      if (newParentId && newNodes[newParentId]) {
        const parentChildren = [...(newNodes[newParentId].children || [])];
        parentChildren.splice(index, 0, nodeId);
        newNodes[newParentId] = {
          ...newNodes[newParentId],
          children: parentChildren,
        };
      }

      // 3. Update the moved node's parentId
      newNodes[nodeId] = {
        ...newNodes[nodeId],
        parentId: newParentId || null,
      };

      // 4. Re-assign order for all siblings in the new parent
      const newSiblingIds =
        newParentId && newNodes[newParentId]
          ? newNodes[newParentId].children
          : Object.values(newNodes)
              .filter((n) => !n.parentId)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((n) => n.id);

      // For root-level drops without a parent, insert at index
      if (!newParentId) {
        const rootIds = Object.values(newNodes)
          .filter((n) => !n.parentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((n) => n.id);
        // Re-order: remove nodeId then insert at index
        const filtered = rootIds.filter((id) => id !== nodeId);
        filtered.splice(index, 0, nodeId);
        filtered.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      } else {
        newSiblingIds.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      }

      // 5. Also re-assign order for old parent's remaining children
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId].children.forEach((id, i) => {
          newNodes[id] = { ...newNodes[id], order: i };
        });
      }

      // 6. Recalculate progress for both old and new parents
      if (oldParentId) {
        newNodes = updateProgressRecursively(newNodes, oldParentId);
      }
      if (newParentId) {
        newNodes = updateProgressRecursively(newNodes, newParentId);
      }

      return newNodes;
    });
  }, []);

  const handleImportNodes = useCallback((importedData) => {
    setNodes((prev) => importTreeToNodes(prev, importedData));
  }, []);

  const handleAddFolder = useCallback((parentFolderId, title) => {
    setNodes((prev) => addFolder(prev, parentFolderId, title));
  }, []);

  const handleDeleteFolder = useCallback((folderId) => {
    setNodes((prev) => deleteFolder(prev, folderId));
  }, []);

  const handleAssignTaskToFolder = useCallback((taskId, folderId) => {
    setNodes((prev) => assignTaskToFolder(prev, taskId, folderId));
  }, []);

  // Active root nodes (exclude soft-deleted, hidden, and folders)
  const rootNodes = Object.values(nodes).filter(
    (node) => !node.parentId && !node.deletedAt && !node.hidden && node.type !== NODE_TYPES.FOLDER
  );

  // Folder nodes (independent of the causal tree)
  const folders = Object.values(nodes).filter(
    (node) => node.type === NODE_TYPES.FOLDER && !node.deletedAt && !node.hidden
  );

  // Soft-deleted root nodes → shown in the trash view
  const trashedRootNodes = Object.values(nodes).filter(
    (node) => !node.parentId && !!node.deletedAt && node.type !== NODE_TYPES.FOLDER
  );

  // Hidden root nodes → shown in the hidden tasks modal
  // A "hidden root" is a hidden node whose parent is NOT hidden (i.e. the entry point of hiding)
  const hiddenRootNodes = Object.values(nodes).filter(
    (node) =>
      !node.deletedAt &&
      !!node.hidden &&
      node.type !== NODE_TYPES.FOLDER &&
      (!node.parentId || !nodes[node.parentId]?.hidden)
  );

  return {
    nodes,
    rootNodes,
    trashedRootNodes,
    hiddenRootNodes,
    folders,
    addNode: handleAddNode,
    addNodes: handleAddNodes,
    addTreeUnderNode: handleAddTreeUnderNode,
    importNodes: handleImportNodes,
    deleteNode: handleDeleteNode,
    restoreNode: handleRestoreNode,
    permanentDeleteNode: handlePermanentDeleteNode,
    hideNode: handleHideNode,
    unhideNode: handleUnhideNode,
    toggleStatus: handleToggleStatus,
    startTimeTracking: handleStartTimeTracking,
    pauseTimeTracking: handlePauseTimeTracking,
    resumeTimeTracking: handleResumeTimeTracking,
    updateNode: handleUpdateNode,
    setRelation: handleSetRelation,
    addGroup: handleAddGroup,
    removeGroup: handleRemoveGroup,
    assignChildToGroup: handleAssignChildToGroup,
    updateGroup: handleUpdateGroup,
    addDependency: handleAddDependency,
    removeDependency: handleRemoveDependency,
    reorderNode: handleReorderNode,
    outdentNode: handleOutdentNode,
    moveNode: handleMoveNode,
    addFolder: handleAddFolder,
    deleteFolder: handleDeleteFolder,
    assignTaskToFolder: handleAssignTaskToFolder,
    isNodeLocked: (nodeId) => isNodeLocked(nodes, nodeId),
  };
};
