import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Inspector from './Inspector';

describe('Inspector description link parsing', () => {
  const defaultProps = {
    selectedNodeId: '1',
    nodes: {
      '1': {
        id: '1',
        title: 'Test Node',
        type: 'GOAL',
        children: [],
        dependsOn: [],
        description: '',
      }
    },
    addNode: vi.fn(),
    addNodes: vi.fn(),
    addTreeUnderNode: vi.fn(),
    onSelectNode: vi.fn(),
    updateNode: vi.fn(),
    onDeleteNode: vi.fn(),
    addDependency: vi.fn(),
    removeDependency: vi.fn(),
    reorderNode: vi.fn(),
    t: (k) => k,
    lang: 'ja',
  };

  it('should parse URL surrounded by brackets correctly (brackets excluded from link)', () => {
    const props = {
      ...defaultProps,
      nodes: {
        '1': {
          ...defaultProps.nodes['1'],
          description: '(https://example.com/foo)',
        }
      }
    };

    const { container } = render(<Inspector {...props} />);
    const linkElement = container.querySelector('a.description-link');
    
    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe('https://example.com/foo');
    expect(linkElement.textContent.trim()).toBe('https://example.com/foo');
    
    // Check that parentheses are rendered outside the link
    const displayContainer = container.querySelector('.description-display');
    expect(displayContainer.textContent).toContain('(https://example.com/foo)');
  });

  it('should parse Japanese context ending in parentheses correctly', () => {
    const props = {
      ...defaultProps,
      nodes: {
        '1': {
          ...defaultProps.nodes['1'],
          description: '申込サイト(https://example.com/bosyu)にアクセスする。',
        }
      }
    };

    const { container } = render(<Inspector {...props} />);
    const linkElement = container.querySelector('a.description-link');
    
    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe('https://example.com/bosyu');
    
    const displayContainer = container.querySelector('.description-display');
    expect(displayContainer.textContent).toContain('申込サイト(https://example.com/bosyu)にアクセスする。');
  });

  it('should parse URL followed by a period correctly', () => {
    const props = {
      ...defaultProps,
      nodes: {
        '1': {
          ...defaultProps.nodes['1'],
          description: 'Go to https://example.com.',
        }
      }
    };

    const { container } = render(<Inspector {...props} />);
    const linkElement = container.querySelector('a.description-link');
    
    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe('https://example.com');
    
    const displayContainer = container.querySelector('.description-display');
    expect(displayContainer.textContent).toContain('Go to https://example.com.');
  });

  it('should support URL query parameters fully', () => {
    const props = {
      ...defaultProps,
      nodes: {
        '1': {
          ...defaultProps.nodes['1'],
          description: 'https://example.com/search?q=test&page=1',
        }
      }
    };

    const { container } = render(<Inspector {...props} />);
    const linkElement = container.querySelector('a.description-link');
    
    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe('https://example.com/search?q=test&page=1');
  });
});
