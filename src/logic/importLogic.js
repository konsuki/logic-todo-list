import { NODE_TYPES } from './treeLogic';

/**
 * Main entry point for parsing import data.
 * Supports JSON and Indented Text (Markdown-like).
 */
export const parseImportData = (text) => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Input is empty');

  // Detection logic with fallback
  if (trimmed.startsWith('{') || (trimmed.startsWith('[') && !trimmed.startsWith('[GOAL') && !trimmed.startsWith('[STRATEGY') && !trimmed.startsWith('[ACTION'))) {
    try {
      const data = JSON.parse(trimmed);
      return normalizeJson(data);
    } catch (e) {
      // If it looks like JSON but fails to parse, it might be Markdown with [tags]
      // Fall through to parseMarkdown
    }
  }

  return parseMarkdown(trimmed);
};

/**
 * Normalizes JSON data into a nested node structure.
 */
const normalizeJson = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => processJsonNode(item));
  }
  return [processJsonNode(data)];
};

const processJsonNode = (node) => {
  if (!node.title) throw new Error('Each node must have a title');
  
  return {
    title: node.title,
    type: node.type || detectType(node),
    children: (node.children || []).map(child => processJsonNode(child))
  };
};

const detectType = (node) => {
  if (node.children && node.children.length > 0) return NODE_TYPES.STRATEGY;
  return NODE_TYPES.ACTION;
};

/**
 * Parses indented text into a nested node structure.
 */
const parseMarkdown = (text) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const rootNodes = [];
  const stack = [];

  lines.forEach(line => {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const content = line.trim();

    // Parse type tags if present
    const tagMatch = content.match(/^\[(GOAL|STRATEGY|ACTION)\]\s*(.*)/i);
    let type = null;
    let title = content;

    if (tagMatch) {
      type = tagMatch[1].toUpperCase();
      title = tagMatch[2];
    }

    const newNode = {
      title,
      type,
      indent,
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(newNode);
    } else {
      stack[stack.length - 1].children.push(newNode);
    }

    stack.push(newNode);
  });

  // Second pass: Finalize types and clean up
  return rootNodes.map(node => finalizeMarkdownNode(node, null));
};

const finalizeMarkdownNode = (node, parentType) => {
  let type = node.type;
  
  if (!type) {
    if (!parentType) {
      type = NODE_TYPES.GOAL;
    } else if (node.children.length > 0) {
      type = NODE_TYPES.STRATEGY;
    } else {
      type = NODE_TYPES.ACTION;
    }
  }

  return {
    title: node.title,
    type,
    children: node.children.map(child => finalizeMarkdownNode(child, type))
  };
};
