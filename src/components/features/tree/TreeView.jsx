import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Target, Zap, Share2, GitCommit, MoveRight, MoveDown, Settings2, X } from 'lucide-react';
import * as treeLogic from '../../../logic/treeLogic';
import './TreeView.css';

const TreeView = ({ nodes, rootNodes, updateNode, selectedNodeId, onSelectNode, expandedNodeIds, toggleExpand, t, editingNodeId, setEditingNodeId }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('tree'); // 'tree' or 'flow'
  const [flowOrientation, setFlowOrientation] = useState('horizontal'); // 'horizontal' or 'vertical'
  const prevLayoutRef = useRef(layoutMode);
  const prevOrientationRef = useRef(flowOrientation);
  
  // Confirmed Default Values from User
  const [spacingH, setSpacingH] = useState(400);
  const [spacingV, setSpacingV] = useState(144);
  const [containerHPadding, setContainerHPadding] = useState(64);
  const [containerVPaddingTop, setContainerVPaddingTop] = useState(80);
  const [hierarchyGap, setHierarchyGap] = useState(16);
  const [showSettings, setShowSettings] = useState(false);

  const hierarchyData = useMemo(() => {
    if (rootNodes.length === 0) return null;
    const buildHierarchy = (nodeId) => {
      const node = nodes[nodeId];
      if (!node) return null;
      return {
        ...node,
        name: node.title,
        children: node.children ? node.children.map(id => buildHierarchy(id)).filter(Boolean) : []
      };
    };
    
    // Create a virtual root to hold all actual root nodes
    return {
      id: 'VIRTUAL_ROOT',
      isVirtual: true,
      children: rootNodes.map(root => buildHierarchy(root.id)).filter(Boolean)
    };
  }, [nodes, rootNodes]);

  const flattenedFlow = useMemo(() => {
    return treeLogic.getFlattenedFlow(nodes, rootNodes);
  }, [nodes, rootNodes]);

  useEffect(() => {
    if (!hierarchyData || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.05, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const nodeWidth = 260;
    const nodeHeight = 65;

    let displayNodes = [];
    let displayLinks = [];
    let enclosures = [];

    if (layoutMode === 'tree') {
      const treeLayout = d3.tree().nodeSize([120, 380]);
      const root = d3.hierarchy(hierarchyData);
      treeLayout(root);
      displayNodes = root.descendants().filter(d => !d.data.isVirtual);
      displayLinks = root.links()
        .filter(l => !l.source.data.isVirtual)
        .map(l => ({
          source: l.source,
          target: l.target,
          type: 'hierarchy'
        }));
    } else {
      // Flow Layout: Dynamic Spacing Logic (Robust Sequence)
      const leafNodes = flattenedFlow.filter(n => !n.children || n.children.length === 0);
      const depthMap = new Map(flattenedFlow.map(n => [n.id, n.depth]));
      
      const getAncestors = (nodeId) => {
        const path = [];
        let curr = nodes[nodeId];
        while (curr && curr.parentId) {
          path.push(curr.parentId);
          curr = nodes[curr.parentId];
        }
        return path;
      };

      const allParents = flattenedFlow.filter(n => n.children && n.children.length > 0);
      const maxDepth = d3.max(allParents, d => d.depth) || 0;
      
      let currentOffset = 0;
      const baseGap = (flowOrientation === 'horizontal' ? spacingH : spacingV) || 144;
      displayNodes = [];

      for (let i = 0; i < leafNodes.length; i++) {
        const node = leafNodes[i];
        const prevNode = leafNodes[i - 1];
        const currentAncestors = getAncestors(node.id);
        const prevAncestors = prevNode ? getAncestors(prevNode.id) : [];

        const startingAncestors = currentAncestors.filter(id => !prevAncestors.includes(id));
        const endingAncestors = prevAncestors.filter(id => !currentAncestors.includes(id));

        // Add padding for enclosures ending at the previous node
        endingAncestors.forEach(id => {
          const depth = depthMap.get(id) || 0;
          const rank = maxDepth - depth;
          const vPaddingBottom = 24 + (rank * (hierarchyGap * 0.5));
          const hPaddingRight = 32 + (rank * hierarchyGap);
          currentOffset += (flowOrientation === 'horizontal' ? hPaddingRight : vPaddingBottom);
        });

        // Add padding for enclosures starting at this node
        startingAncestors.forEach(id => {
          const depth = depthMap.get(id) || 0;
          const rank = maxDepth - depth;
          const vPaddingTop = containerVPaddingTop + (rank * (hierarchyGap * 2));
          const hPaddingLeft = containerHPadding + (rank * hierarchyGap);
          currentOffset += (flowOrientation === 'horizontal' ? hPaddingLeft : vPaddingTop);
        });

        const pos = flowOrientation === 'horizontal' 
          ? { x: currentOffset, y: 0 }
          : { x: 0, y: currentOffset };
        
        displayNodes.push({ data: node, pos });

        // Advance offset for next node
        const step = flowOrientation === 'horizontal' 
          ? (nodeWidth + baseGap * 0.2) 
          : (nodeHeight + baseGap * 0.4);
        
        currentOffset += step;
      }

      for (let i = 0; i < displayNodes.length - 1; i++) {
        displayLinks.push({
          source: displayNodes[i],
          target: displayNodes[i+1],
          type: 'flow'
        });
      }

      // Enclosures

      allParents.forEach(parentNode => {
        const getDescendantIds = (id) => {
          const node = nodes[id];
          if (!node) return [];
          if (!node.children || node.children.length === 0) return [id];
          return node.children.flatMap(cid => getDescendantIds(cid));
        };
        const leafIds = getDescendantIds(parentNode.id);
        const groupLeaves = displayNodes.filter(dn => leafIds.includes(dn.data.id));

        if (groupLeaves.length > 0) {
          const minX = d3.min(groupLeaves, d => d.pos.x);
          const maxX = d3.max(groupLeaves, d => d.pos.x);
          const minY = d3.min(groupLeaves, d => d.pos.y);
          const maxY = d3.max(groupLeaves, d => d.pos.y);

          const rank = maxDepth - parentNode.depth;
          const hPadding = containerHPadding + (rank * hierarchyGap);
          const vPaddingTop = containerVPaddingTop + (rank * (hierarchyGap * 2));
          const vPaddingBottom = 24 + (rank * (hierarchyGap * 0.5));

          enclosures.push({
            id: parentNode.id,
            x: minX - hPadding,
            y: minY - vPaddingTop,
            width: flowOrientation === 'horizontal' ? (maxX - minX) + nodeWidth + (hPadding * 2) : nodeWidth + (hPadding * 2),
            height: flowOrientation === 'horizontal' ? nodeHeight + (vPaddingTop + vPaddingBottom) : (maxY - minY) + nodeHeight + (vPaddingTop + vPaddingBottom),
            progress: parentNode.progress,
            title: parentNode.title,
            depth: parentNode.depth,
            rank: rank
          });
        }
      });

      enclosures.sort((a, b) => a.depth - b.depth);
    }

    // Enclosures
    if (layoutMode === 'flow') {
      const enclosureGroups = g.selectAll('.enclosure-group')
        .data(enclosures)
        .enter()
        .append('g')
        .attr('class', 'enclosure-group');

      enclosureGroups.append('rect')
        .attr('class', 'parent-enclosure')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 25)
        .style('fill', d => `var(--border-color)`)
        .style('opacity', d => 0.2 + (d.rank * 0.05));

      enclosureGroups.append('rect')
        .attr('class', 'enclosure-progress-border')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 25)
        .style('stroke-dasharray', d => {
          const perimeter = 2 * (d.width + d.height);
          return `${(d.progress / 100) * perimeter}, ${perimeter}`;
        });
        
      enclosureGroups.append('text')
        .attr('x', d => d.x + 20)
        .attr('y', d => d.y + 25)
        .attr('class', 'enclosure-label')
        .text(d => {
          const maxLength = flowOrientation === 'horizontal' ? 50 : 35;
          return d.title.length > maxLength ? d.title.substring(0, maxLength) + '...' : d.title.toUpperCase();
        });
    }

    // Links
    const allLinks = g.selectAll('path.link-path')
      .data(displayLinks)
      .enter()
      .append('path')
      .attr('class', d => `link-path ${d.type === 'flow' ? 'flow-link' : 'tree-link'}`)
      .attr('d', d => {
        if (layoutMode === 'tree') {
          return d3.linkHorizontal()
            .source(l => [l.source.y + (nodeWidth - 10), l.source.x])
            .target(l => [l.target.y - 10, l.target.x])(d);
        } else {
          const s = d.source.pos;
          const t = d.target.pos;
          if (flowOrientation === 'horizontal') {
            return `M${s.x + (nodeWidth - 10)},${s.y} L${t.x - 10},${t.y}`;
          } else {
            return `M${s.x + (nodeWidth / 2)},${s.y + (nodeHeight / 2)} L${t.x + (nodeWidth / 2)},${t.y - (nodeHeight / 2)}`;
          }
        }
      });

    // Nodes
    const nodeGroups = g.selectAll('.tree-node')
      .data(displayNodes)
      .enter()
      .append('g')
      .attr('class', d => `tree-node ${d.data.id === selectedNodeId ? 'is-selected' : ''}`)
      .attr('transform', d => {
        if (layoutMode === 'tree') return `translate(${d.y},${d.x})`;
        return `translate(${d.pos.x},${d.pos.y})`;
      })
      .on('click', (event, d) => {
        onSelectNode(d.data.id);
      })
      .on('mouseenter', (event, d) => {
        allLinks.filter(l => l.source.data.id === d.data.id || l.target.data.id === d.data.id)
          .classed('is-highlighted', true);
      })
      .on('mouseleave', () => {
        allLinks.classed('is-highlighted', false);
      });

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', -30)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('class', d => `node-rect ${d.data.type.toLowerCase()}`);

    nodeGroups.append('text')
      .attr('x', -5)
      .attr('y', -35)
      .attr('class', 'node-step-label')
      .text((d, i) => {
        if (layoutMode === 'flow') return `Step ${i + 1}`;
        const siblings = d.parent?.children || [];
        const index = siblings.findIndex(c => c.data.id === d.data.id);
        return index !== -1 ? `Step ${index + 1}` : '';
      });

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', 32)
      .attr('width', d => (d.data.progress / 100) * nodeWidth)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('class', 'node-progress-indicator')
      .attr('fill', d => d.data.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)');

    nodeGroups.append('text')
      .attr('dy', -10)
      .attr('dx', 10)
      .attr('class', 'node-type-label')
      .text(d => d.data.type);

    const titleContainer = nodeGroups.append('foreignObject')
      .attr('x', 0)
      .attr('y', -5)
      .attr('width', nodeWidth - 20)
      .attr('height', 35)
      .attr('class', 'node-title-foreign-object');

    titleContainer.each(function(d) {
      const container = d3.select(this);
      const isEditing = d.data.id === editingNodeId;

      if (isEditing) {
        const input = container.append('xhtml:input')
          .attr('class', 'node-edit-input')
          .attr('value', d.data.title)
          .style('width', '100%')
          .style('height', '100%')
          .on('keydown', (event) => {
            if (event.key === 'Enter') {
              updateNode(d.data.id, { title: event.target.value });
              setEditingNodeId(null);
            } else if (event.key === 'Escape') {
              setEditingNodeId(null);
            }
          })
          .on('blur', (event) => {
            updateNode(d.data.id, { title: event.target.value });
            setEditingNodeId(null);
          })
          .on('click', (event) => event.stopPropagation());
        
        // Auto-focus the input
        setTimeout(() => input.node()?.focus(), 10);
      } else {
        container.append('xhtml:div')
          .attr('class', 'node-title-scroll-container')
          .attr('title', d.data.title)
          .style('width', '100%')
          .style('height', '100%')
          .on('dblclick', (event) => {
            event.stopPropagation();
            setEditingNodeId(d.data.id);
          })
          .html(d.data.title);
      }
    });

    // Persist or initialize transform
    const currentTransform = d3.zoomTransform(svgRef.current);
    const layoutChanged = prevLayoutRef.current !== layoutMode || prevOrientationRef.current !== flowOrientation;
    
    // Update refs for next render
    prevLayoutRef.current = layoutMode;
    prevOrientationRef.current = flowOrientation;
    
    // Reset to initial if first render, or if the layout mode/orientation just changed
    if ((currentTransform.k === 1 && currentTransform.x === 0 && currentTransform.y === 0) || layoutChanged) {
      const initialTransform = d3.zoomIdentity
        .translate(flowOrientation === 'vertical' && layoutMode === 'flow' ? width / 2 - 130 : width / 4, height / 4)
        .scale(0.8);
      svg.call(zoom.transform, initialTransform);
    } else {
      // Re-apply the existing transform (maintains drag/zoom state on node click)
      svg.call(zoom.transform, currentTransform);
    }

  }, [hierarchyData, flattenedFlow, layoutMode, flowOrientation, selectedNodeId, onSelectNode, nodes, spacingH, spacingV, containerHPadding, containerVPaddingTop, hierarchyGap, editingNodeId, updateNode]);

  if (rootNodes.length === 0) return null;

  return (
    <div className="tree-view-container" ref={containerRef}>
      <div className="tree-controls">
        <div className="control-group-glass">
          <button className={`mode-btn ${layoutMode === 'tree' ? 'active' : ''}`} onClick={() => setLayoutMode('tree')}>
            <Share2 size={14} /> Tree
          </button>
          <button className={`mode-btn ${layoutMode === 'flow' ? 'active' : ''}`} onClick={() => setLayoutMode('flow')}>
            <GitCommit size={14} /> Flow
          </button>
        </div>

        <div className={`orientation-controls-wrapper ${layoutMode === 'flow' ? 'is-visible' : ''}`}>
          <div className="control-group-glass">
            <button className={`mode-btn ${flowOrientation === 'horizontal' ? 'active' : ''}`} onClick={() => setFlowOrientation('horizontal')}>
              <MoveRight size={14} /> Horizontal
            </button>
            <button className={`mode-btn ${flowOrientation === 'vertical' ? 'active' : ''}`} onClick={() => setFlowOrientation('vertical')}>
              <MoveDown size={14} /> Vertical
            </button>
          </div>
        </div>

        <div className="control-hint">
          <Zap size={14} /> {t('tree.hint')}
        </div>
      </div>

      {/* Floating Settings Button & Panel (Bottom Right) */}
      <div className="floating-settings-container">
        {showSettings && (
          <div className="control-group-glass tree-settings-floating-wrapper">
            <div className="tree-panel-header">
              <Settings2 size={14} /> <span>{t('tree.layoutSettings')}</span>
              <button className="tree-close-panel-btn" onClick={() => setShowSettings(false)}><X size={14} /></button>
            </div>
            <div className="tree-settings-content">
              <div className="tree-setting-item">
                <label>Spacing (V): {spacingV}</label>
                <input type="range" min="80" max="400" step="8" value={spacingV} onChange={(e) => setSpacingV(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>Spacing (H): {spacingH}</label>
                <input type="range" min="200" max="800" step="8" value={spacingH} onChange={(e) => setSpacingH(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>Container Width: {containerHPadding}</label>
                <input type="range" min="16" max="160" step="8" value={containerHPadding} onChange={(e) => setContainerHPadding(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>Label Gap (V): {containerVPaddingTop}</label>
                <input type="range" min="40" max="200" step="8" value={containerVPaddingTop} onChange={(e) => setContainerVPaddingTop(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>Hierarchy Gap: {hierarchyGap}</label>
                <input type="range" min="0" max="64" step="8" value={hierarchyGap} onChange={(e) => setHierarchyGap(parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        )}
        <button className={`floating-settings-btn ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>
          <Settings2 size={18} />
        </button>
      </div>

      <svg ref={svgRef} width="100%" height="100%" className="tree-svg" />
    </div>
  );
};

export default TreeView;
