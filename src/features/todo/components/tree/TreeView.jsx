import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Zap, Share2, GitCommit, MoveRight, MoveDown, Settings2, X } from 'lucide-react';
import * as treeLogic from '../../lib/treeLogic';
import {
  LAYOUT_MODE,
  FLOW_ORIENTATION,
  LINK_TYPE,
  VIRTUAL_ROOT_ID,
  NODE_WIDTH,
  NODE_HEIGHT,
  TREE_NODE_SIZE,
  FLOW_HORIZONTAL_STEP_RATIO,
  FLOW_VERTICAL_STEP_RATIO,
  ENCLOSURE_PADDING_BOTTOM,
  ENCLOSURE_PADDING_RIGHT,
  HIERARCHY_GAP_BOTTOM_RATIO,
  HIERARCHY_GAP_TOP_RATIO,
  ENCLOSURE_FILL_OPACITY_BASE,
  ENCLOSURE_FILL_OPACITY_RANK_STEP,
  NODE_RECT_OFFSET_X,
  NODE_RECT_OFFSET_Y,
  NODE_STEP_LABEL_OFFSET_X,
  NODE_STEP_LABEL_OFFSET_Y,
  NODE_TYPE_LABEL_DX,
  NODE_TYPE_LABEL_DY,
  NODE_TITLE_OFFSET_X,
  NODE_TITLE_OFFSET_Y,
  NODE_TITLE_WIDTH_PADDING,
  NODE_TITLE_HEIGHT,
  ENCLOSURE_LABEL_OFFSET_X,
  ENCLOSURE_LABEL_OFFSET_Y,
  ENCLOSURE_LABEL_MAX_LENGTH_HORIZONTAL,
  ENCLOSURE_LABEL_MAX_LENGTH_VERTICAL,
  LINK_ENDPOINT_OFFSET,
  PROGRESS_MAX,
  PROGRESS_INDICATOR_OFFSET_X,
  PROGRESS_INDICATOR_OFFSET_Y,
  PROGRESS_INDICATOR_HEIGHT,
  PROGRESS_INDICATOR_RX,
  MIN_ZOOM,
  MAX_ZOOM,
  INITIAL_ZOOM,
  FLOW_VERTICAL_INITIAL_X_OFFSET,
  INITIAL_X_DIVISOR,
  INITIAL_Y_DIVISOR,
  SPACING_V,
  SPACING_H,
  CONTAINER_H_PADDING,
  CONTAINER_V_PADDING_TOP,
  HIERARCHY_GAP,
  SELECTOR,
  CLASS_NAME,
  KEY,
  SVG_NAMESPACE_TAG,
  THEME_FALLBACK,
  EDIT_FOCUS_DELAY_MS,
} from '../../lib/treeViewConstants';
import './TreeView.css';

const TreeView = ({ nodes, rootNodes, updateNode, selectedNodeId, onSelectNode, t, editingNodeId, setEditingNodeId }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState(LAYOUT_MODE.TREE);
  const [flowOrientation, setFlowOrientation] = useState(FLOW_ORIENTATION.HORIZONTAL);
  const prevLayoutRef = useRef(layoutMode);
  const prevOrientationRef = useRef(flowOrientation);

  // Confirmed Default Values from User
  const [spacingH, setSpacingH] = useState(SPACING_H.default);
  const [spacingV, setSpacingV] = useState(SPACING_V.default);
  const [containerHPadding, setContainerHPadding] = useState(CONTAINER_H_PADDING.default);
  const [containerVPaddingTop, setContainerVPaddingTop] = useState(CONTAINER_V_PADDING_TOP.default);
  const [hierarchyGap, setHierarchyGap] = useState(HIERARCHY_GAP.default);
  const [showSettings, setShowSettings] = useState(false);

  const hierarchyData = useMemo(() => {
    if (rootNodes.length === 0) return null;
    const buildHierarchy = (nodeId) => {
      const node = nodes[nodeId];
      if (!node || node.deletedAt || node.hidden) return null; // Skip soft-deleted and hidden nodes
      return {
        ...node,
        name: node.title,
        children: node.children
          ? node.children.filter(id => !nodes[id]?.deletedAt && !nodes[id]?.hidden).map(id => buildHierarchy(id)).filter(Boolean)
          : []
      };
    };

    // Create a virtual root to hold all actual root nodes
    return {
      id: VIRTUAL_ROOT_ID,
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
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    let displayNodes = [];
    let displayLinks = [];
    let enclosures = [];

    if (layoutMode === LAYOUT_MODE.TREE) {
      const treeLayout = d3.tree().nodeSize(TREE_NODE_SIZE);
      const root = d3.hierarchy(hierarchyData);
      treeLayout(root);
      displayNodes = root.descendants().filter(d => !d.data.isVirtual);
      displayLinks = root.links()
        .filter(l => !l.source.data.isVirtual)
        .map(l => ({
          source: l.source,
          target: l.target,
          type: LINK_TYPE.HIERARCHY
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
      const baseGap = (flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? spacingH : spacingV) || SPACING_V.default;
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
          const vPaddingBottom = ENCLOSURE_PADDING_BOTTOM + (rank * (hierarchyGap * HIERARCHY_GAP_BOTTOM_RATIO));
          const hPaddingRight = ENCLOSURE_PADDING_RIGHT + (rank * hierarchyGap);
          currentOffset += (flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? hPaddingRight : vPaddingBottom);
        });

        // Add padding for enclosures starting at this node
        startingAncestors.forEach(id => {
          const depth = depthMap.get(id) || 0;
          const rank = maxDepth - depth;
          const vPaddingTop = containerVPaddingTop + (rank * (hierarchyGap * HIERARCHY_GAP_TOP_RATIO));
          const hPaddingLeft = containerHPadding + (rank * hierarchyGap);
          currentOffset += (flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? hPaddingLeft : vPaddingTop);
        });

        const pos = flowOrientation === FLOW_ORIENTATION.HORIZONTAL
          ? { x: currentOffset, y: 0 }
          : { x: 0, y: currentOffset };

        displayNodes.push({ data: node, pos });

        // Advance offset for next node
        const step = flowOrientation === FLOW_ORIENTATION.HORIZONTAL
          ? (NODE_WIDTH + baseGap * FLOW_HORIZONTAL_STEP_RATIO)
          : (NODE_HEIGHT + baseGap * FLOW_VERTICAL_STEP_RATIO);

        currentOffset += step;
      }

      for (let i = 0; i < displayNodes.length - 1; i++) {
        displayLinks.push({
          source: displayNodes[i],
          target: displayNodes[i+1],
          type: LINK_TYPE.FLOW
        });
      }

      // Enclosures

      allParents.forEach(parentNode => {
        const getDescendantIds = (id) => {
          const node = nodes[id];
          if (!node || node.deletedAt || node.hidden) return []; // Skip soft-deleted and hidden nodes
          if (!node.children || node.children.length === 0) return [id];
          return node.children
            .filter(cid => !nodes[cid]?.deletedAt && !nodes[cid]?.hidden)
            .flatMap(cid => getDescendantIds(cid));
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
          const vPaddingTop = containerVPaddingTop + (rank * (hierarchyGap * HIERARCHY_GAP_TOP_RATIO));
          const vPaddingBottom = ENCLOSURE_PADDING_BOTTOM + (rank * (hierarchyGap * HIERARCHY_GAP_BOTTOM_RATIO));

          enclosures.push({
            id: parentNode.id,
            x: minX - hPadding,
            y: minY - vPaddingTop,
            width: flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? (maxX - minX) + NODE_WIDTH + (hPadding * 2) : NODE_WIDTH + (hPadding * 2),
            height: flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? NODE_HEIGHT + (vPaddingTop + vPaddingBottom) : (maxY - minY) + NODE_HEIGHT + (vPaddingTop + vPaddingBottom),
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
    if (layoutMode === LAYOUT_MODE.FLOW) {
      const enclosureGroups = g.selectAll(SELECTOR.ENCLOSURE_GROUP)
        .data(enclosures)
        .enter()
        .append('g')
        .attr('class', CLASS_NAME.ENCLOSURE_GROUP);

      enclosureGroups.append('rect')
        .attr('class', CLASS_NAME.PARENT_ENCLOSURE)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .style('rx', THEME_FALLBACK.ENCLOSURE_RADIUS)
        .style('fill', () => `var(--border-color)`)
        .style('opacity', d => ENCLOSURE_FILL_OPACITY_BASE + (d.rank * ENCLOSURE_FILL_OPACITY_RANK_STEP));

      enclosureGroups.append('rect')
        .attr('class', CLASS_NAME.ENCLOSURE_PROGRESS_BORDER)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .style('rx', THEME_FALLBACK.ENCLOSURE_RADIUS)
        .style('stroke-dasharray', d => {
          const perimeter = 2 * (d.width + d.height);
          return `${(d.progress / PROGRESS_MAX) * perimeter}, ${perimeter}`;
        });

      enclosureGroups.append('text')
        .attr('x', d => d.x + ENCLOSURE_LABEL_OFFSET_X)
        .attr('y', d => d.y + ENCLOSURE_LABEL_OFFSET_Y)
        .attr('class', CLASS_NAME.ENCLOSURE_LABEL)
        .text(d => {
          const maxLength = flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? ENCLOSURE_LABEL_MAX_LENGTH_HORIZONTAL : ENCLOSURE_LABEL_MAX_LENGTH_VERTICAL;
          return d.title.length > maxLength ? d.title.substring(0, maxLength) + '...' : d.title.toUpperCase();
        });
    }

    // Links
    const allLinks = g.selectAll(SELECTOR.LINK_PATH)
      .data(displayLinks)
      .enter()
      .append('path')
      .attr('class', d => `${CLASS_NAME.LINK_PATH} ${d.type === LINK_TYPE.FLOW ? CLASS_NAME.FLOW_LINK : CLASS_NAME.TREE_LINK}`)
      .attr('d', d => {
        if (layoutMode === LAYOUT_MODE.TREE) {
          return d3.linkHorizontal()
            .source(l => [l.source.y + (NODE_WIDTH - LINK_ENDPOINT_OFFSET), l.source.x])
            .target(l => [l.target.y - LINK_ENDPOINT_OFFSET, l.target.x])(d);
        } else {
          const s = d.source.pos;
          const t = d.target.pos;
          if (flowOrientation === FLOW_ORIENTATION.HORIZONTAL) {
            return `M${s.x + (NODE_WIDTH - LINK_ENDPOINT_OFFSET)},${s.y} L${t.x - LINK_ENDPOINT_OFFSET},${t.y}`;
          } else {
            return `M${s.x + (NODE_WIDTH / 2)},${s.y + (NODE_HEIGHT / 2)} L${t.x + (NODE_WIDTH / 2)},${t.y - (NODE_HEIGHT / 2)}`;
          }
        }
      });

    // Nodes
    const nodeGroups = g.selectAll(SELECTOR.TREE_NODE)
      .data(displayNodes)
      .enter()
      .append('g')
      .attr('class', d => `${CLASS_NAME.TREE_NODE} ${d.data.id === selectedNodeId ? CLASS_NAME.IS_SELECTED : ''}`)
      .attr('transform', d => {
        if (layoutMode === LAYOUT_MODE.TREE) return `translate(${d.y},${d.x})`;
        return `translate(${d.pos.x},${d.pos.y})`;
      })
      .on('click', (event, d) => {
        onSelectNode(d.data.id);
      })
      .on('mouseenter', (event, d) => {
        allLinks.filter(l => l.source.data.id === d.data.id || l.target.data.id === d.data.id)
          .classed(CLASS_NAME.IS_HIGHLIGHTED, true);
      })
      .on('mouseleave', () => {
        allLinks.classed(CLASS_NAME.IS_HIGHLIGHTED, false);
      });

    nodeGroups.append('rect')
      .attr('x', NODE_RECT_OFFSET_X)
      .attr('y', NODE_RECT_OFFSET_Y)
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .style('rx', THEME_FALLBACK.NODE_RADIUS)
      .attr('class', d => `${CLASS_NAME.NODE_RECT} ${d.data.type.toLowerCase()}`);

    nodeGroups.append('text')
      .attr('x', NODE_STEP_LABEL_OFFSET_X)
      .attr('y', NODE_STEP_LABEL_OFFSET_Y)
      .attr('class', CLASS_NAME.NODE_STEP_LABEL)
      .text((d, i) => {
        if (layoutMode === LAYOUT_MODE.FLOW) return `Step ${i + 1}`;
        const siblings = d.parent?.children || [];
        const index = siblings.findIndex(c => c.data.id === d.data.id);
        return index !== -1 ? `Step ${index + 1}` : '';
      });

    nodeGroups.append('rect')
      .attr('x', PROGRESS_INDICATOR_OFFSET_X)
      .attr('y', PROGRESS_INDICATOR_OFFSET_Y)
      .attr('width', d => (d.data.progress / PROGRESS_MAX) * NODE_WIDTH)
      .attr('height', PROGRESS_INDICATOR_HEIGHT)
      .attr('rx', PROGRESS_INDICATOR_RX)
      .attr('class', CLASS_NAME.NODE_PROGRESS_INDICATOR)
      .attr('fill', d => d.data.progress === PROGRESS_MAX ? 'var(--success-color)' : 'var(--primary-color)');

    nodeGroups.append('text')
      .attr('dy', NODE_TYPE_LABEL_DY)
      .attr('dx', NODE_TYPE_LABEL_DX)
      .attr('class', CLASS_NAME.NODE_TYPE_LABEL)
      .text(d => d.data.type);

    const titleContainer = nodeGroups.append('foreignObject')
      .attr('x', NODE_TITLE_OFFSET_X)
      .attr('y', NODE_TITLE_OFFSET_Y)
      .attr('width', NODE_WIDTH - NODE_TITLE_WIDTH_PADDING)
      .attr('height', NODE_TITLE_HEIGHT)
      .attr('class', CLASS_NAME.NODE_TITLE_FOREIGN_OBJECT);

    titleContainer.each(function(d) {
      const container = d3.select(this);
      const isEditing = d.data.id === editingNodeId;

      if (isEditing) {
        const input = container.append(SVG_NAMESPACE_TAG.INPUT)
          .attr('class', CLASS_NAME.NODE_EDIT_INPUT)
          .attr('value', d.data.title)
          .style('width', '100%')
          .style('height', '100%')
          .on('keydown', (event) => {
            if (event.key === KEY.ENTER) {
              updateNode(d.data.id, { title: event.target.value });
              setEditingNodeId(null);
            } else if (event.key === KEY.ESCAPE) {
              setEditingNodeId(null);
            }
          })
          .on('blur', (event) => {
            updateNode(d.data.id, { title: event.target.value });
            setEditingNodeId(null);
          })
          .on('click', (event) => event.stopPropagation());

        // Auto-focus the input
        setTimeout(() => input.node()?.focus(), EDIT_FOCUS_DELAY_MS);
      } else {
        container.append(SVG_NAMESPACE_TAG.DIV)
          .attr('class', CLASS_NAME.NODE_TITLE_SCROLL_CONTAINER)
          .attr('title', d.data.title)
          .style('width', '100%')
          .style('height', '100%')
          .on('dblclick', (event) => {
            event.stopPropagation();
            setEditingNodeId(d.data.id);
          })
          .text(d.data.title);
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
        .translate(flowOrientation === FLOW_ORIENTATION.VERTICAL && layoutMode === LAYOUT_MODE.FLOW ? width / 2 - FLOW_VERTICAL_INITIAL_X_OFFSET : width / INITIAL_X_DIVISOR, height / INITIAL_Y_DIVISOR)
        .scale(INITIAL_ZOOM);
      svg.call(zoom.transform, initialTransform);
    } else {
      // Re-apply the existing transform (maintains drag/zoom state on node click)
      svg.call(zoom.transform, currentTransform);
    }

  }, [hierarchyData, flattenedFlow, layoutMode, flowOrientation, selectedNodeId, onSelectNode, nodes, spacingH, spacingV, containerHPadding, containerVPaddingTop, hierarchyGap, editingNodeId, updateNode, setEditingNodeId]);

  if (rootNodes.length === 0) return null;

  return (
    <div className="tree-view-container" ref={containerRef}>
      <div className="tree-controls">
        <div className="control-group-glass">
          <button className={`mode-btn ${layoutMode === LAYOUT_MODE.TREE ? 'active' : ''}`} onClick={() => setLayoutMode(LAYOUT_MODE.TREE)}>
            <Share2 size={14} /> {t('tree.modeTree')}
          </button>
          <button className={`mode-btn ${layoutMode === LAYOUT_MODE.FLOW ? 'active' : ''}`} onClick={() => setLayoutMode(LAYOUT_MODE.FLOW)}>
            <GitCommit size={14} /> {t('tree.modeFlow')}
          </button>
        </div>

        <div className={`orientation-controls-wrapper ${layoutMode === LAYOUT_MODE.FLOW ? 'is-visible' : ''}`}>
          <div className="control-group-glass">
            <button className={`mode-btn ${flowOrientation === FLOW_ORIENTATION.HORIZONTAL ? 'active' : ''}`} onClick={() => setFlowOrientation(FLOW_ORIENTATION.HORIZONTAL)}>
              <MoveRight size={14} /> {t('tree.orientationHorizontal')}
            </button>
            <button className={`mode-btn ${flowOrientation === FLOW_ORIENTATION.VERTICAL ? 'active' : ''}`} onClick={() => setFlowOrientation(FLOW_ORIENTATION.VERTICAL)}>
              <MoveDown size={14} /> {t('tree.orientationVertical')}
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
                <label>{t('tree.spacingV')}: {spacingV}</label>
                <input type="range" min={SPACING_V.min} max={SPACING_V.max} step={SPACING_V.step} value={spacingV} onChange={(e) => setSpacingV(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>{t('tree.spacingH')}: {spacingH}</label>
                <input type="range" min={SPACING_H.min} max={SPACING_H.max} step={SPACING_H.step} value={spacingH} onChange={(e) => setSpacingH(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>{t('tree.containerWidth')}: {containerHPadding}</label>
                <input type="range" min={CONTAINER_H_PADDING.min} max={CONTAINER_H_PADDING.max} step={CONTAINER_H_PADDING.step} value={containerHPadding} onChange={(e) => setContainerHPadding(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>{t('tree.labelGapV')}: {containerVPaddingTop}</label>
                <input type="range" min={CONTAINER_V_PADDING_TOP.min} max={CONTAINER_V_PADDING_TOP.max} step={CONTAINER_V_PADDING_TOP.step} value={containerVPaddingTop} onChange={(e) => setContainerVPaddingTop(parseInt(e.target.value))} />
              </div>
              <div className="tree-setting-item">
                <label>{t('tree.hierarchyGap')}: {hierarchyGap}</label>
                <input type="range" min={HIERARCHY_GAP.min} max={HIERARCHY_GAP.max} step={HIERARCHY_GAP.step} value={hierarchyGap} onChange={(e) => setHierarchyGap(parseInt(e.target.value))} />
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
