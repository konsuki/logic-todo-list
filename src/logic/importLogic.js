/**
 * LogiDo Import Logic
 * Parses JSON and Markdown (indented text) into a nested tree structure.
 */

import { NODE_TYPES } from './treeLogic';

/**
 * Detects format and parses input string.
 */
export const parseImportData = (text) => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Input is empty');

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      return normalizeJson(data);
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message);
    }
  }

  return parseMarkdown(trimmed);
};

/**
 * Normalizes JSON data into the expected nested structure.
 */
const normalizeJson = (data) => {
  const normalizeNode = (node) => {
    if (!node.title) throw new Error('Node missing title');
    
    const children = (node.children || []).map(normalizeNode);
    
    // Auto-tagging if type is missing
    let type = node.type;
    if (!type || !NODE_TYPES[type]) {
      type = children.length > 0 ? NODE_TYPES.STRATEGY : NODE_TYPES.ACTION;
    }

    return {
      title: node.title,
      type: type,
      children: children
    };
  };

  // If input is an array, wrap it in a dummy root or handle accordingly
  // For simplicity, we expect a single root or we pick the first one
  if (Array.isArray(data)) {
    return data.map(normalizeNode);
  }
  return [normalizeNode(data)];
};

/**
 * Parses indented Markdown-like text into a nested structure.
 */
const parseMarkdown = (text) => {
  const lines = text.split('\n');
  const result = [];
  const stack = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    // Count indentation (spaces or tabs)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    
    const content = line.trim();
    
    // Extract type tag if present
    const tagMatch = content.match(/^\[(GOAL|STRATEGY|ACTION)\]\s*(.*)/i);
    let type = null;
    let title = content;
    
    if (tagMatch) {
      type = tagMatch[1].toUpperCase();
      title = tagMatch[2];
    }

    const node = {
      title,
      type,
      children: [],
      indent,
      lineIndex: index
    };

    // Find parent in stack
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  // Final pass: Auto-tagging based on structure
  const finalizeNode = (node, depth) => {
    const children = node.children.map(c => finalizeNode(c, depth + 1));
    
    let type = node.type;
    if (!type) {
      if (depth === 0) {
        type = NODE_TYPES.GOAL;
      } else if (children.length > 0) {
        type = NODE_TYPES.STRATEGY;
      } else {
        type = NODE_TYPES.ACTION;
      }
    }

    return {
      title: node.title,
      type,
      children
    };
  };

  return result.map(n => finalizeNode(n, 0));
};
