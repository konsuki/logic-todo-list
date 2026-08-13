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
