import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Target, Zap } from 'lucide-react';
import './TreeView.css';

const TreeView = ({ nodes, rootNodes, selectedNodeId, onSelectNode }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Convert flat nodes to D3 hierarchy
  const hierarchyData = useMemo(() => {
    if (rootNodes.length === 0) return null;
    
    // We only show one tree at a time for now (the first root node)
    const root = rootNodes[0];
    
    const buildHierarchy = (nodeId) => {
      const node = nodes[nodeId];
      return {
        ...node,
        name: node.title,
        children: node.children.map(id => buildHierarchy(id))
      };
    };

    return buildHierarchy(root.id);
  }, [nodes, rootNodes]);

  useEffect(() => {
    if (!hierarchyData || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const g = svg.append('g');

    // Setup Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Tree Layout
    const treeLayout = d3.tree().nodeSize([100, 240]); // [height, width] for horizontal tree
    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes
    const nodeGroups = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `tree-node ${d.data.id === selectedNodeId ? 'is-selected' : ''}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => {
        onSelectNode(d.data.id);
      });

    // Node Rects
    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', -30)
      .attr('width', 200)
      .attr('height', 60)
      .attr('rx', 8)
      .attr('class', d => `node-rect ${d.data.type.toLowerCase()}`);

    // Node Progress (Border indicator)
    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', 26)
      .attr('width', d => (d.data.progress / 100) * 200)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('class', 'node-progress-indicator')
      .attr('fill', d => d.data.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)');

    // Node Labels
    nodeGroups.append('text')
      .attr('dy', -10)
      .attr('dx', 10)
      .attr('class', 'node-type-label')
      .text(d => d.data.type);

    nodeGroups.append('text')
      .attr('dy', 12)
      .attr('dx', 10)
      .attr('class', 'node-title-label')
      .text(d => {
        const title = d.data.title;
        return title.length > 20 ? title.substring(0, 18) + '...' : title;
      });

    // Initial center and zoom
    const initialTransform = d3.zoomIdentity
      .translate(100, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);

  }, [hierarchyData, selectedNodeId, onSelectNode]);

  if (rootNodes.length === 0) {
    return (
      <div className="empty-state">
        <Target size={64} color="var(--border-color)" />
        <h2>No Projects Found</h2>
        <p>Switch to List View to create your first goal.</p>
      </div>
    );
  }

  return (
    <div className="tree-view-container" ref={containerRef}>
      <div className="tree-controls">
        <div className="control-hint">
          <Zap size={14} /> Drag to Pan / Scroll to Zoom
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="tree-svg" />
    </div>
  );
};

export default TreeView;
