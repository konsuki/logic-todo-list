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
