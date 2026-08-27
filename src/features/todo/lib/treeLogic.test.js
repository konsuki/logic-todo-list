import { describe, it, expect } from 'vitest';
import * as treeLogic from './treeLogic';

describe('treeLogic.reorderNode', () => {
  it('should swap order of two siblings when moving down', () => {
    const nodes = {
      'parent': { id: 'parent', children: ['child1', 'child2'], type: 'GOAL' },
      'child1': { id: 'child1', parentId: 'parent', order: 0, title: 'Child 1' },
      'child2': { id: 'child2', parentId: 'parent', order: 1, title: 'Child 2' }
    };
    
    const result = treeLogic.reorderNode(nodes, 'child1', 'down');
    
    expect(result['child1'].order).toBe(1);
    expect(result['child2'].order).toBe(0);
    expect(result['parent'].children).toEqual(['child2', 'child1']);
  });

  it('should swap order of two siblings when moving up', () => {
    const nodes = {
      'parent': { id: 'parent', children: ['child1', 'child2'], type: 'GOAL' },
      'child1': { id: 'child1', parentId: 'parent', order: 0, title: 'Child 1' },
      'child2': { id: 'child2', parentId: 'parent', order: 1, title: 'Child 2' }
    };
    
    const result = treeLogic.reorderNode(nodes, 'child2', 'up');
    
    expect(result['child1'].order).toBe(1);
    expect(result['child2'].order).toBe(0);
  });

  it('should do nothing if moving up at the top', () => {
    const nodes = {
      'parent': { id: 'parent', children: ['child1', 'child2'], type: 'GOAL' },
      'child1': { id: 'child1', parentId: 'parent', order: 0, title: 'Child 1' },
      'child2': { id: 'child2', parentId: 'parent', order: 1, title: 'Child 2' }
    };
    
    const result = treeLogic.reorderNode(nodes, 'child1', 'up');
    
    expect(result).toEqual(nodes);
  });

  it('should do nothing if moving down at the bottom', () => {
    const nodes = {
      'parent': { id: 'parent', children: ['child1', 'child2'], type: 'GOAL' },
      'child1': { id: 'child1', parentId: 'parent', order: 0, title: 'Child 1' },
      'child2': { id: 'child2', parentId: 'parent', order: 1, title: 'Child 2' }
    };
    
    const result = treeLogic.reorderNode(nodes, 'child2', 'down');
    
    expect(result).toEqual(nodes);
  });
});

describe('treeLogic.buildArboristTree', () => {
  it('should build arborist tree with children sorted by order', () => {
    const nodes = {
      'parent': { id: 'parent', children: ['child1', 'child2'], type: 'GOAL', title: 'Parent' },
      'child1': { id: 'child1', parentId: 'parent', order: 1, title: 'Child 1' },
      'child2': { id: 'child2', parentId: 'parent', order: 0, title: 'Child 2' }
    };
    const rootNodes = [nodes['parent']];

    const tree = treeLogic.buildArboristTree(nodes, rootNodes);

    expect(tree[0].children[0].id).toBe('child2');
    expect(tree[0].children[1].id).toBe('child1');
  });
});

describe('treeLogic.normalizeGroups', () => {
  it('should normalize legacy string[] form into object form', () => {
    const groups = [['B', 'C'], ['D', 'E', 'F']];
    const result = treeLogic.normalizeGroups(groups);
    expect(result).toHaveLength(2);
    expect(result[0].children).toEqual(['B', 'C']);
    expect(result[1].children).toEqual(['D', 'E', 'F']);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('color');
  });

  it('should pass through object form unchanged (with defaults filled)', () => {
    const groups = [{ id: 'g1', name: '予算重視', color: '#4F8CFF', children: ['B', 'C'] }];
    const result = treeLogic.normalizeGroups(groups);
    expect(result[0].id).toBe('g1');
    expect(result[0].name).toBe('予算重視');
    expect(result[0].color).toBe('#4F8CFF');
    expect(result[0].children).toEqual(['B', 'C']);
  });

  it('should return empty array for undefined groups', () => {
    expect(treeLogic.normalizeGroups(undefined)).toEqual([]);
  });
});

describe('treeLogic OR group operations', () => {
  it('addGroup should append a group with name, color, and empty children', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [], children: ['B', 'C'] }
    };
    const result = treeLogic.addGroup(nodes, 'A');
    expect(result.A.groups).toHaveLength(1);
    expect(result.A.groups[0].name).toBe('グループ1');
    expect(result.A.groups[0].children).toEqual([]);
    expect(result.A.groups[0]).toHaveProperty('color');
  });

  it('removeGroup should remove the group and leave its children unassigned', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [{ id: 'g1', name: 'G1', color: '#000', children: ['B'] }], children: ['B', 'C'] }
    };
    const result = treeLogic.removeGroup(nodes, 'A', 'g1');
    expect(result.A.groups).toHaveLength(0);
  });

  it('assignChildToGroup should enforce mutual exclusion across groups', () => {
    const nodes = {
      'A': {
        id: 'A', relation: 'or',
        groups: [
          { id: 'g1', name: 'G1', color: '#000', children: ['B'] },
          { id: 'g2', name: 'G2', color: '#000', children: [] }
        ],
        children: ['B', 'C']
      }
    };
    // Move B from g1 to g2
    const result = treeLogic.assignChildToGroup(nodes, 'A', 'B', 'g2');
    const g1 = result.A.groups.find(g => g.id === 'g1');
    const g2 = result.A.groups.find(g => g.id === 'g2');
    expect(g1.children).not.toContain('B');
    expect(g2.children).toContain('B');
  });

  it('assignChildToGroup with null should unassign the child', () => {
    const nodes = {
      'A': {
        id: 'A', relation: 'or',
        groups: [{ id: 'g1', name: 'G1', color: '#000', children: ['B'] }],
        children: ['B']
      }
    };
    const result = treeLogic.assignChildToGroup(nodes, 'A', 'B', null);
    expect(result.A.groups[0].children).not.toContain('B');
  });

  it('updateGroup should update name/color', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [{ id: 'g1', name: 'G1', color: '#000', children: [] }], children: [] }
    };
    const result = treeLogic.updateGroup(nodes, 'A', 'g1', { name: '予算重視' });
    expect(result.A.groups[0].name).toBe('予算重視');
  });

  it('calculateNodeProgress should handle multi-child object-form groups', () => {
    const nodes = {
      'A': {
        id: 'A', relation: 'or',
        groups: [
          { id: 'g1', name: 'G1', color: '#000', children: ['B', 'C'] },
          { id: 'g2', name: 'G2', color: '#000', children: ['D', 'E', 'F'] }
        ],
        children: ['B', 'C', 'D', 'E', 'F'], status: 'TODO', progress: 0
      },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'DONE', progress: 100 },
      'D': { id: 'D', parentId: 'A', status: 'TODO', progress: 0 },
      'E': { id: 'E', parentId: 'A', status: 'TODO', progress: 0 },
      'F': { id: 'F', parentId: 'A', status: 'TODO', progress: 0 },
    };
    // group1 (B+C) = 100, group2 (D+E+F) = 0 → max 100
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });
});

describe('treeLogic.calculateNodeProgress (OR relation)', () => {
  it('should be 100 when any single group is fully done', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [['B', 'C'], ['D']], children: ['B', 'C', 'D'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'DONE', progress: 100 },
      'D': { id: 'D', parentId: 'A', status: 'TODO', progress: 0 },
    };
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });

  it('should use the max group progress when partially done', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [['B', 'C'], ['D']], children: ['B', 'C', 'D'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'TODO', progress: 0 },
      'D': { id: 'D', parentId: 'A', status: 'TODO', progress: 0 },
    };
    // group [B,C] = 50, group [D] = 0 → max 50
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(50);
  });

  it('should treat empty groups as each child being a single-child group', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [], children: ['B', 'C'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'TODO', progress: 0 },
    };
    // each child is its own group: [B]=100, [C]=0 → max 100
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });

  it('should treat uncovered children as single-child groups', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [['B', 'C']], children: ['B', 'C', 'D'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'TODO', progress: 0 },
      'C': { id: 'C', parentId: 'A', status: 'TODO', progress: 0 },
      'D': { id: 'D', parentId: 'A', status: 'DONE', progress: 100 },
    };
    // group [B,C]=0, uncovered [D]=100 → max 100
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });

  it('should keep AND relation as average of active children', () => {
    const nodes = {
      'A': { id: 'A', children: ['B', 'C'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'TODO', progress: 0 },
    };
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(50);
  });

  it('should exclude hidden/deleted children from OR group progress', () => {
    const nodes = {
      'A': { id: 'A', relation: 'or', groups: [['B', 'C']], children: ['B', 'C'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100 },
      'C': { id: 'C', parentId: 'A', status: 'DONE', progress: 100, hidden: true },
    };
    // C is hidden → group [B] only → 100
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });
});

describe('treeLogic folder functions', () => {
  it('addFolder creates a FOLDER node with parentId null and folderId', () => {
    const nodes = treeLogic.addFolder({}, null, 'My Folder');
    const folder = Object.values(nodes)[0];
    expect(folder.type).toBe('FOLDER');
    expect(folder.parentId).toBeNull();
    expect(folder.folderId).toBeNull();
    expect(folder.title).toBe('My Folder');
  });

  it('addFolder supports nesting under a parent folder', () => {
    const parentId = 'parent-folder';
    const nodes = treeLogic.addFolder({ [parentId]: { id: parentId, type: 'FOLDER' } }, parentId, 'Child Folder');
    const child = Object.values(nodes).find(n => n.title === 'Child Folder');
    expect(child.folderId).toBe(parentId);
  });

  it('assignTaskToFolder sets folderId on a task', () => {
    const nodes = { 'task': { id: 'task', type: 'ACTION', title: 'Task', folderId: null } };
    const result = treeLogic.assignTaskToFolder(nodes, 'task', 'folder-1');
    expect(result['task'].folderId).toBe('folder-1');
  });

  it('assignTaskToFolder with null reverts to unclassified', () => {
    const nodes = { 'task': { id: 'task', type: 'ACTION', title: 'Task', folderId: 'folder-1' } };
    const result = treeLogic.assignTaskToFolder(nodes, 'task', null);
    expect(result['task'].folderId).toBeNull();
  });

  it('assignTaskToFolder ignores folders', () => {
    const nodes = { 'folder': { id: 'folder', type: 'FOLDER', title: 'Folder', folderId: null } };
    const result = treeLogic.assignTaskToFolder(nodes, 'folder', 'some-other');
    expect(result).toEqual(nodes);
  });

  it('deleteFolder removes folder and reverts its tasks to unclassified', () => {
    const nodes = {
      'folder': { id: 'folder', type: 'FOLDER', title: 'Folder', folderId: null },
      'task': { id: 'task', type: 'ACTION', title: 'Task', folderId: 'folder' },
      'other': { id: 'other', type: 'ACTION', title: 'Other', folderId: null },
    };
    const result = treeLogic.deleteFolder(nodes, 'folder');
    expect(result['folder']).toBeUndefined();
    expect(result['task'].folderId).toBeNull();
    expect(result['other']).toBeDefined();
  });

  it('deleteFolder removes descendant folders', () => {
    const nodes = {
      'parent': { id: 'parent', type: 'FOLDER', title: 'Parent', folderId: null },
      'child': { id: 'child', type: 'FOLDER', title: 'Child', folderId: 'parent' },
    };
    const result = treeLogic.deleteFolder(nodes, 'parent');
    expect(result['parent']).toBeUndefined();
    expect(result['child']).toBeUndefined();
  });

  it('buildFolderTree groups tasks under folders and unclassified', () => {
    const nodes = {
      'folder': { id: 'folder', type: 'FOLDER', title: 'Folder A', folderId: null },
      'task1': { id: 'task1', type: 'ACTION', title: 'Task 1', folderId: 'folder', order: 0 },
      'task2': { id: 'task2', type: 'ACTION', title: 'Task 2', folderId: null, order: 0 },
    };
    const tree = treeLogic.buildFolderTree(nodes, 'Uncategorized');
    const folderNode = tree.find(n => n.id === 'folder');
    expect(folderNode.children.length).toBe(1);
    expect(folderNode.children[0].id).toBe('task1');

    const unclassified = tree.find(n => n.id === '__unclassified__');
    expect(unclassified.children.length).toBe(1);
    expect(unclassified.children[0].id).toBe('task2');
  });

  it('progress calculation ignores folderId', () => {
    const nodes = {
      'A': { id: 'A', children: ['B'], status: 'TODO', progress: 0 },
      'B': { id: 'B', parentId: 'A', status: 'DONE', progress: 100, folderId: 'some-folder' },
    };
    expect(treeLogic.calculateNodeProgress(nodes, 'A')).toBe(100);
  });
});

describe('treeLogic.searchNodes', () => {
  const nodes = {
    'goal': { id: 'goal', type: 'GOAL', title: 'Learn React' },
    'strat': { id: 'strat', type: 'STRATEGY', title: 'React Hooks' },
    'action': { id: 'action', type: 'ACTION', title: 'Practice React useEffect' },
    'folder': { id: 'folder', type: 'FOLDER', title: 'React Learning' },
    'hidden': { id: 'hidden', type: 'ACTION', title: 'React Hidden', hidden: true },
    'deleted': { id: 'deleted', type: 'ACTION', title: 'React Deleted', deletedAt: 123 },
    'virtual': { id: '__unclassified__', type: 'FOLDER', title: 'Uncategorized', isVirtual: true },
  };

  it('returns [] for empty/whitespace query', () => {
    expect(treeLogic.searchNodes(nodes, '', { mode: 'logic' })).toEqual([]);
    expect(treeLogic.searchNodes(nodes, '   ', { mode: 'folder' })).toEqual([]);
  });

  it('matches task titles case-insensitively in logic mode', () => {
    const result = treeLogic.searchNodes(nodes, 'react', { mode: 'logic' });
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual(['action', 'goal', 'strat']);
  });

  it('excludes folders in logic mode', () => {
    const result = treeLogic.searchNodes(nodes, 'react', { mode: 'logic' });
    expect(result.some(r => r.id === 'folder')).toBe(false);
  });

  it('includes folder names and task titles in folder mode', () => {
    const result = treeLogic.searchNodes(nodes, 'react', { mode: 'folder' });
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual(['action', 'folder', 'goal', 'strat']);
  });

  it('excludes hidden and deleted nodes', () => {
    const result = treeLogic.searchNodes(nodes, 'react', { mode: 'folder' });
    expect(result.some(r => r.id === 'hidden')).toBe(false);
    expect(result.some(r => r.id === 'deleted')).toBe(false);
  });

  it('excludes the virtual unclassified root in folder mode', () => {
    const result = treeLogic.searchNodes(nodes, 'uncategorized', { mode: 'folder' });
    expect(result.some(r => r.id === '__unclassified__')).toBe(false);
  });

  it('treats regex special chars as literal strings', () => {
    const specialNodes = {
      'a': { id: 'a', type: 'ACTION', title: 'Fix (bug) and .edge' },
    };
    const result = treeLogic.searchNodes(specialNodes, '(bug)', { mode: 'logic' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('a');
  });

  it('returns { id, title, type } objects', () => {
    const result = treeLogic.searchNodes(nodes, 'learn', { mode: 'logic' });
    expect(result[0]).toEqual({ id: 'goal', title: 'Learn React', type: 'GOAL' });
  });
});
