import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Target, Zap, Share2, GitCommit, MoveRight, MoveDown } from 'lucide-react';
import * as treeLogic from '../../../logic/treeLogic';
import './TreeView.css';

const TreeView = ({ nodes, rootNodes, selectedNodeId, onSelectNode, t }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('tree'); // 'tree' or 'flow'
  const [flowOrientation, setFlowOrientation] = useState('horizontal'); // 'horizontal' or 'vertical'

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

  const flattenedFlow = useMemo(() => {
    return treeLogic.getFlattenedFlow(nodes, rootNodes);
  }, [nodes, rootNodes]);

  useEffect(() => {
    if (!hierarchyData || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define Defs
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

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.05, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const nodeWidth = 200;
    const nodeHeight = 60;
    const spacingH = 350;
    const spacingV = 150;

    let displayNodes = [];
    let displayLinks = [];

    if (layoutMode === 'tree') {
      const treeLayout = d3.tree().nodeSize([120, 350]);
      const root = d3.hierarchy(hierarchyData);
      treeLayout(root);
      displayNodes = root.descendants();
      displayLinks = root.links().map(l => ({
        source: l.source,
        target: l.target,
        type: 'hierarchy'
      }));
    } else {
      displayNodes = flattenedFlow.map((node, index) => ({
        data: node,
        pos: flowOrientation === 'horizontal' 
          ? { x: index * spacingH, y: 0 }
          : { x: 0, y: index * spacingV }
      }));
      
      for (let i = 0; i < displayNodes.length - 1; i++) {
        displayLinks.push({
          source: displayNodes[i],
          target: displayNodes[i+1],
          type: 'flow'
        });
      }
    }

    // 1. Links
    const allLinks = g.selectAll('path.link-path')
      .data(displayLinks)
      .enter()
      .append('path')
      .attr('class', d => `link-path ${d.type === 'flow' ? 'flow-link' : 'tree-link'}`)
      .attr('d', d => {
        if (layoutMode === 'tree') {
          return d3.linkHorizontal()
            .source(l => [l.source.y + 190, l.source.x])
            .target(l => [l.target.y - 10, l.target.x])(d);
        } else {
          const s = d.source.pos;
          const t = d.target.pos;
          if (flowOrientation === 'horizontal') {
            return `M${s.x + 190},${s.y} L${t.x - 10},${t.y}`;
          } else {
            return `M${s.x + 90},${s.y + 30} L${t.x + 90},${t.y - 30}`;
          }
        }
      });

    // 2. Dependency Links
    if (layoutMode === 'tree') {
      const nodesById = new Map(displayNodes.map(d => [d.data.id, d]));
      const dependencyLinks = [];
      displayNodes.forEach(targetNode => {
        if (targetNode.data.dependsOn) {
          targetNode.data.dependsOn.forEach(sourceId => {
            const sourceNode = nodesById.get(sourceId);
            if (sourceNode) {
              dependencyLinks.push({ source: sourceNode, target: targetNode });
            }
          });
        }
      });

      g.selectAll('.dependency-link')
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
    }

    // 3. Nodes
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

    const initialTransform = d3.zoomIdentity
      .translate(flowOrientation === 'vertical' && layoutMode === 'flow' ? width / 2 - 90 : width / 4, height / 4)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);

  }, [hierarchyData, flattenedFlow, layoutMode, flowOrientation, selectedNodeId, onSelectNode]);

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
        <div className="control-group-glass">
          <button 
            className={`mode-btn ${layoutMode === 'tree' ? 'active' : ''}`}
            onClick={() => setLayoutMode('tree')}
          >
            <Share2 size={14} /> Tree
          </button>
          <button 
            className={`mode-btn ${layoutMode === 'flow' ? 'active' : ''}`}
            onClick={() => setLayoutMode('flow')}
          >
            <GitCommit size={14} /> Flow
          </button>
        </div>

        <div className={`orientation-controls-wrapper ${layoutMode === 'flow' ? 'is-visible' : ''}`}>
          <div className="control-group-glass">
            <button 
              className={`mode-btn ${flowOrientation === 'horizontal' ? 'active' : ''}`}
              onClick={() => setFlowOrientation('horizontal')}
            >
              <MoveRight size={14} /> Horizontal
            </button>
            <button 
              className={`mode-btn ${flowOrientation === 'vertical' ? 'active' : ''}`}
              onClick={() => setFlowOrientation('vertical')}
            >
              <MoveDown size={14} /> Vertical
            </button>
          </div>
        </div>

        <div className="control-hint">
          <Zap size={14} /> {t('tree.hint')}
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="tree-svg" />
    </div>
  );
};

export default TreeView;
