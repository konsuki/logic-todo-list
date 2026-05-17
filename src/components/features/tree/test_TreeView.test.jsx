import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TreeView from './TreeView';

// D3の描画時に必要なコンテナのサイズをモックする
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 });

describe('TreeView', () => {
  it('should render node titles as plain text to prevent XSS (XSS対策のテスト)', () => {
    // 悪意のあるスクリプトやHTMLタグを含むタイトル
    const maliciousTitle = '<h1>Malicious</h1><script>alert("XSS")</script>';
    
    const nodes = {
      'node-1': { 
        id: 'node-1', 
        title: maliciousTitle, 
        type: 'goal', 
        progress: 0 
      }
    };
    const rootNodes = [{ id: 'node-1' }];
    
    // コンポーネントを描画
    const { container } = render(
      <TreeView 
        nodes={nodes} 
        rootNodes={rootNodes} 
        updateNode={vi.fn()} 
        selectedNodeId={null} 
        onSelectNode={vi.fn()} 
        expandedNodeIds={[]} 
        toggleExpand={vi.fn()} 
        t={(k) => k} 
        editingNodeId={null} 
        setEditingNodeId={vi.fn()} 
      />
    );

    // タイトルが表示される要素を取得
    const titleContainer = container.querySelector('.node-title-scroll-container');
    
    // 要素が存在することを確認
    expect(titleContainer).not.toBeNull();
    
    // textContent がエスケープされずに入力文字列と完全に一致するか（つまりHTMLタグとして評価されていないか）
    expect(titleContainer.textContent).toBe(maliciousTitle);
    
    // コンテナ内に <h1> などの実際のHTML要素が生成されていないことを確認
    const h1Element = titleContainer.querySelector('h1');
    expect(h1Element).toBeNull();
  });
});
