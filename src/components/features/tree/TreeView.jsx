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
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const treeLayout = d3.tree().nodeSize([100, 240]);
    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);

    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      );

    const nodeGroups = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `tree-node ${d.data.id === selectedNodeId ? 'is-selected' : ''}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => {
        onSelectNode(d.data.id);
      });

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', -30)
      .attr('width', 200)
      .attr('height', 60)
      .attr('rx', 8)
      .attr('class', d => `node-rect ${d.data.type.toLowerCase()}`);

    nodeGroups.append('rect')
      .attr('x', -10)
      .attr('y', 26)
      .attr('width', d => (d.data.progress / 100) * 200)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('class', 'node-progress-indicator')
      .attr('fill', d => d.data.progress === 100 ? 'var(--success-color)' : 'var(--primary-color)');

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

    const initialTransform = d3.zoomIdentity
      .translate(100, height / 2)
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
