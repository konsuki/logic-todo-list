import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTodoTree } from './useTodoTree';

/**
 * 起動時優先読み込み（MCP 書き込み反映）の検証。
 *
 * 対象: useTodoTree の初期 state 生成ロジック。
 *   - 初回マウント時に GET /__bizyu_export を呼び、
 *   - ファイル（MCP 書き込み）と localStorage の metadata.updatedAt を比較し、
 *   - ファイルの方が新しければファイルを採用する。
 *
 * import.meta.env.DEV は vitest では true 扱い（vite の test.environment で DEV 相当）。
 * 念のため fetch / localStorage をモックして、決定的に検証する。
 */

// DEV 判定を常に true に固定（テスト環境では import.meta.env.DEV が false になる場合があるため）
vi.stubEnv('DEV', true);

const STORAGE_KEY = 'logido_tree_data';

// ノード生成ヘルパー（updatedAt を明示指定）
const makeNode = (id, updatedAt, extra = {}) => ({
  id,
  parentId: null,
  type: 'GOAL',
  title: `title-${id}`,
  status: 'TODO',
  progress: 0,
  children: [],
  metadata: { createdAt: 1, updatedAt },
  ...extra,
});

describe('useTodoTree 起動時優先読み込み', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('ファイルが新しい場合、ファイル内容を初期 state に採用する', async () => {
    // localStorage は古い（updatedAt=100）
    const localNode = makeNode('local-node', 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'local-node': localNode }));

    // ファイル（MCP 書き込み）は新しい（updatedAt=200）
    const fileNode = makeNode('file-node', 200);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'file-node': fileNode }),
    }));

    const { result } = renderHook(() => useTodoTree());

    await waitFor(() => {
      expect(result.current.nodes['file-node']).toBeDefined();
    });

    // ファイル内容が採用され、localStorage の古いノードは消える
    expect(result.current.nodes['file-node']).toBeDefined();
    expect(result.current.nodes['local-node']).toBeUndefined();
  });

  it('localStorage が新しい場合、localStorage を維持する', async () => {
    const localNode = makeNode('local-node', 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'local-node': localNode }));

    const fileNode = makeNode('file-node', 100);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'file-node': fileNode }),
    }));

    const { result } = renderHook(() => useTodoTree());

    await waitFor(() => {
      expect(result.current.nodes['local-node']).toBeDefined();
    });

    // localStorage が維持され、ファイルのノードは現れない
    expect(result.current.nodes['local-node']).toBeDefined();
    expect(result.current.nodes['file-node']).toBeUndefined();
  });

  it('ファイルが無効（null）の場合、localStorage を維持する', async () => {
    const localNode = makeNode('local-node', 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'local-node': localNode }));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    }));

    const { result } = renderHook(() => useTodoTree());

    await waitFor(() => {
      expect(result.current.nodes['local-node']).toBeDefined();
    });

    expect(result.current.nodes['local-node']).toBeDefined();
  });

  it('localStorage が空でファイルがある場合、ファイルを採用する', async () => {
    localStorage.clear();

    const fileNode = makeNode('file-node', 200);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'file-node': fileNode }),
    }));

    const { result } = renderHook(() => useTodoTree());

    await waitFor(() => {
      expect(result.current.nodes['file-node']).toBeDefined();
    });

    expect(result.current.nodes['file-node']).toBeDefined();
  });
});
