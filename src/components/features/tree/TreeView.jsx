import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Target, Zap } from 'lucide-react';
import './TreeView.css';

const TreeView = ({ nodes, rootNodes, selectedNodeId, onSelectNode, t }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const hierarchyData = useMemo(() => {
    if (rootNodes.length === 0) return null;
    const root = rootNodes[0];
    const buildHierarchy = (nodeId) => {
      const node = nodes[nodeId];
      if (!node) return null;
      return {
        ...node,
        name: node.title,
        children: node.children ? node.children.map(id => buildHierarchy(id)).filter(Boolean) : []
      };
    };
    return buildHierarchy(root.id);
  }, [nodes, rootNodes]);

  useEffect(() => {
    if (!hierarchyData || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define Defs for Markers and Glows
    const defs = svg.append('defs');
    
    // Arrow Marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-4 L 8 ,0 L 0,4')
      .attr('fill', 'var(--warning-color)');

    // Link Glow Filter
    const filter = defs.append('filter').attr('id', 'link-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Tree Layout Configuration
    const nodeWidth = 200;
    const nodeHeight = 60;
    const treeLayout = d3.tree().nodeSize([100, 320]); // Vertical spacing, Horizontal spacing
    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);

    // 1. Regular Hierarchy Links
    const links = g.selectAll('.tree-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', d3.linkHorizontal()
        .source(d => [d.source.y + 190, d.source.x])
        .target(d => [d.target.y - 10, d.target.x])
      );

    // 2. Dependency Links
    const nodesById = new Map(root.descendants().map(d => [d.data.id, d]));
    const dependencyLinks = [];
    
    root.descendants().forEach(targetNode => {
      if (targetNode.data.dependsOn) {
        targetNode.data.dependsOn.forEach(sourceId => {
          const sourceNode = nodesById.get(sourceId);
          if (sourceNode) {
            dependencyLinks.push({ 
              source: sourceNode, 
              target: targetNode,
              id: `dep-${sourceNode.data.id}-${targetNode.data.id}` 
            });
          }
        });
      }
    });

    const depPaths = g.selectAll('.dependency-link')
      .data(dependencyLinks)
      .enter()
      .append('path')
      .attr('class', 'dependency-link')
      .attr('d', d => {
        const startX = d.source.y + 190;
        const startY = d.source.x;
        const endX = d.target.y - 10;
        const endY = d.target.x;
        const midX = (startX + endX) / 2;
        return `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
      })
      .attr('marker-end', 'url(#arrowhead)');

    // 3. Nodes
    const nodeGroups = g.selectAll('.tree-node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `tree-node ${d.data.id === selectedNodeId ? 'is-selected' : ''}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => {
        onSelectNode(d.data.id);
      })
      .on('mouseenter', (event, d) => {
        links.filter(l => l.source.data.id === d.data.id || l.target.data.id === d.data.id)
          .classed('is-highlighted', true);
        depPaths.filter(l => l.source.data.id === d.data.id || l.target.data.id === d.data.id)
          .classed('is-highlighted', true);
      })
      .on('mouseleave', () => {
        links.classed('is-highlighted', false);
        depPaths.classed('is-highlighted', false);
      });

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', -30)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('class', d => `node-rect ${d.data.type.toLowerCase()}`);

    // Execution Order Step Badge
    nodeGroups.filter(d => d.data.order !== undefined)
      .append('text')
      .attr('x', -5)
      .attr('y', -35)
      .attr('class', 'node-step-label')
      .text(d => `Step ${ (d.parent?.children.findIndex(c => c.data.id === d.data.id) ?? 0) + 1 }`);

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', 26)
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

    // Improved Title with Horizontal Scrolling
    const titleContainer = nodeGroups.append('foreignObject')
      .attr('x', 0)
      .attr('y', -5)
      .attr('width', nodeWidth - 20)
      .attr('height', 30)
      .attr('class', 'node-title-foreign-object');

    titleContainer.append('xhtml:div')
      .attr('class', 'node-title-scroll-container')
      .attr('title', d => d.data.title)
      .style('width', '100%')
      .style('height', '100%')
      .html(d => d.data.title);

    // Center the tree initially
    const initialTransform = d3.zoomIdentity
      .translate(width / 4, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);

  }, [hierarchyData, selectedNodeId, onSelectNode]);

  if (rootNodes.length === 0) {
    return (
      <div className="empty-state">
        <Target size={64} color="var(--border-color)" />
        <h2>{t('tree.empty')}</h2>
        <p>{t('tree.switch_to_list')}</p>
      </div>
    );
  }

  return (
    <div className="tree-view-container" ref={containerRef}>
      <div className="tree-controls">
        <div className="control-hint">
          <Zap size={14} /> {t('tree.hint')}
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="tree-svg" />
    </div>
  );
};

export default TreeView;
