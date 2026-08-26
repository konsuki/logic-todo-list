import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Inspector from './Inspector';
import { SettingsProvider } from '../../../logic/SettingsContext';

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

    const { container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
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

    const { container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
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

    const { container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
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

    const { container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    const linkElement = container.querySelector('a.description-link');

    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe('https://example.com/search?q=test&page=1');
  });

  it('should parse obsidian:// scheme links as clickable links', () => {
    const obsidianUrl = 'obsidian://open?vault=%E6%97%A5%E5%B8%B8%E3%81%A7%E4%BD%BF%E3%81%88%E3%82%8B%E7%9F%A5%E8%AD%98&file=%E3%82%84%E3%82%8B%E3%81%93%E3%81%A8%2F%E3%83%9D%E3%83%BC%E3%83%88%E3%83%95%E3%82%A9%E3%83%BC%E3%83%AA%E3%82%AA%2F%E8%A9%95%E4%BE%A1%E3%81%95%E3%82%8C%E3%82%8B%E3%83%9D%E3%83%BC%E3%83%88%E3%83%95%E3%82%A9%E3%83%AA%E3%82%AA1';
    const props = {
      ...defaultProps,
      nodes: {
        '1': {
          ...defaultProps.nodes['1'],
          description: `[Obsidian で開く](${obsidianUrl})`,
        }
      }
    };

    const { container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    const linkElement = container.querySelector('a.description-link');

    expect(linkElement).not.toBeNull();
    expect(linkElement.getAttribute('href')).toBe(obsidianUrl);
    expect(linkElement.textContent).toContain(obsidianUrl);
  });
});

describe('Inspector title inline editing', () => {
  const defaultProps = {
    selectedNodeId: '1',
    nodes: {
      '1': {
        id: '1',
        title: 'Original Title',
        type: 'GOAL',
        children: [],
        dependsOn: [],
        description: '',
      },
      '2': {
        id: '2',
        title: 'Second Title',
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

  it('should render the original title as h2 and switch to input on click', () => {
    const { getByRole, container } = render(<SettingsProvider><Inspector {...defaultProps} /></SettingsProvider>);
    
    const h2Element = getByRole('heading', { name: 'Original Title' });
    expect(h2Element).toBeInTheDocument();
    expect(container.querySelector('.inspector-title-input')).toBeNull();

    // Click to edit
    fireEvent.click(h2Element);

    // Should render input now
    const inputElement = container.querySelector('.inspector-title-input');
    expect(inputElement).not.toBeNull();
    expect(inputElement.value).toBe('Original Title');
  });

  it('should update the node title on Enter key', () => {
    const updateNodeMock = vi.fn();
    const props = { ...defaultProps, updateNode: updateNodeMock };
    
    const { getByRole, container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    fireEvent.click(getByRole('heading', { name: 'Original Title' }));

    const inputElement = container.querySelector('.inspector-title-input');
    expect(inputElement).not.toBeNull();
    fireEvent.change(inputElement, { target: { value: 'Updated Title' } });
    fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter' });

    expect(updateNodeMock).toHaveBeenCalledWith('1', { title: 'Updated Title' });
    expect(getByRole('heading', { name: 'Original Title' })).toBeInTheDocument();
  });

  it('should update the node title on blur', () => {
    const updateNodeMock = vi.fn();
    const props = { ...defaultProps, updateNode: updateNodeMock };
    
    const { getByRole, container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    fireEvent.click(getByRole('heading', { name: 'Original Title' }));

    const inputElement = container.querySelector('.inspector-title-input');
    expect(inputElement).not.toBeNull();
    fireEvent.change(inputElement, { target: { value: 'Updated Title on Blur' } });
    fireEvent.blur(inputElement);

    expect(updateNodeMock).toHaveBeenCalledWith('1', { title: 'Updated Title on Blur' });
  });

  it('should cancel edit and restore original title on Escape', () => {
    const updateNodeMock = vi.fn();
    const props = { ...defaultProps, updateNode: updateNodeMock };
    
    const { getByRole, container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    fireEvent.click(getByRole('heading', { name: 'Original Title' }));

    const inputElement = container.querySelector('.inspector-title-input');
    expect(inputElement).not.toBeNull();
    fireEvent.change(inputElement, { target: { value: 'Discarded Title' } });
    fireEvent.keyDown(inputElement, { key: 'Escape', code: 'Escape' });

    expect(updateNodeMock).not.toHaveBeenCalled();
    expect(getByRole('heading', { name: 'Original Title' })).toBeInTheDocument();
  });

  it('should not call updateNode if the value is empty or only spaces', () => {
    const updateNodeMock = vi.fn();
    const props = { ...defaultProps, updateNode: updateNodeMock };
    
    const { getByRole, container } = render(<SettingsProvider><Inspector {...props} /></SettingsProvider>);
    fireEvent.click(getByRole('heading', { name: 'Original Title' }));

    const inputElement = container.querySelector('.inspector-title-input');
    expect(inputElement).not.toBeNull();
    fireEvent.change(inputElement, { target: { value: '   ' } });
    fireEvent.blur(inputElement);

    expect(updateNodeMock).not.toHaveBeenCalled();
  });

  it('should reset editing state when switching to another node', () => {
    const { getByRole, container, rerender } = render(<SettingsProvider><Inspector {...defaultProps} /></SettingsProvider>);
    
    fireEvent.click(getByRole('heading', { name: 'Original Title' }));
    expect(container.querySelector('.inspector-title-input')).not.toBeNull();

    // Rerender with different selectedNodeId
    const nextProps = { ...defaultProps, selectedNodeId: '2' };
    rerender(<SettingsProvider><Inspector {...nextProps} /></SettingsProvider>);

    // Should reset editing state and display the second node title
    expect(container.querySelector('.inspector-title-input')).toBeNull();
    expect(getByRole('heading', { name: 'Second Title' })).toBeInTheDocument();
  });
});
