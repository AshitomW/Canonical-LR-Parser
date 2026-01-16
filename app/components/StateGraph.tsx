"use client";

import { useEffect, useRef } from "react";
import { LR1State, isTerminal } from "../lib/clr-parser";

interface StateGraphProps {
  states: LR1State[];
  highlightedState?: number;
  highlightedTransition?: { from: number; to: number; symbol: string };
}

interface NodePosition {
  x: number;
  y: number;
}

export default function StateGraph({
  states,
  highlightedState,
  highlightedTransition,
}: StateGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate node positions in a circular/hierarchical layout
  const calculatePositions = (): Map<number, NodePosition> => {
    const positions = new Map<number, NodePosition>();
    const nodeRadius = 30;
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Use a layered approach based on distance from state 0
    const layers: number[][] = [];
    const visited = new Set<number>();
    const queue: { state: number; layer: number }[] = [{ state: 0, layer: 0 }];

    while (queue.length > 0) {
      const { state, layer } = queue.shift()!;
      if (visited.has(state)) continue;
      visited.add(state);

      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(state);

      const stateObj = states.find((s) => s.id === state);
      if (stateObj) {
        for (const [, targetState] of stateObj.transitions) {
          if (!visited.has(targetState)) {
            queue.push({ state: targetState, layer: layer + 1 });
          }
        }
      }
    }

    // Position nodes by layer
    const layerHeight = height / (layers.length + 1);
    layers.forEach((layerStates, layerIdx) => {
      const y = 60 + layerIdx * layerHeight;
      const layerWidth = width - 100;
      const nodeSpacing = layerWidth / (layerStates.length + 1);

      layerStates.forEach((stateId, nodeIdx) => {
        const x = 50 + (nodeIdx + 1) * nodeSpacing;
        positions.set(stateId, { x, y });
      });
    });

    return positions;
  };

  const positions = calculatePositions();

  // Generate edges
  const edges: {
    from: number;
    to: number;
    symbol: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }[] = [];
  const selfLoops: { state: number; symbol: string }[] = [];

  states.forEach((state) => {
    state.transitions.forEach((targetState, symbol) => {
      const fromPos = positions.get(state.id);
      const toPos = positions.get(targetState);

      if (fromPos && toPos) {
        if (state.id === targetState) {
          selfLoops.push({ state: state.id, symbol });
        } else {
          edges.push({
            from: state.id,
            to: targetState,
            symbol,
            x1: fromPos.x,
            y1: fromPos.y,
            x2: toPos.x,
            y2: toPos.y,
          });
        }
      }
    });
  });

  // Calculate arrow endpoints (offset from node center)
  const getArrowPoints = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    nodeRadius: number
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;

    return {
      startX: x1 + unitX * nodeRadius,
      startY: y1 + unitY * nodeRadius,
      endX: x2 - unitX * (nodeRadius + 8),
      endY: y2 - unitY * (nodeRadius + 8),
    };
  };

  const nodeRadius = 25;

  // Helper to convert numbers to Unicode subscript
  function toSubscript(num: number): string {
    const subDigits = "₀₁₂₃₄₅₆₇₈₉";
    return num
      .toString()
      .split("")
      .map((d) => subDigits[parseInt(d, 10)] || d)
      .join("");
  }

  return (
    <div className="state-graph">
      <h3 className="section-title">
        <span className="title-icon">[S]</span>
        State Transition Diagram
      </h3>

      <div className="graph-container">
        <svg
          ref={svgRef}
          viewBox="0 0 900 600"
          className="state-graph-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#8080a0" />
            </marker>
            <marker
              id="arrowhead-highlighted"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#cccc80" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const { startX, startY, endX, endY } = getArrowPoints(
              edge.x1,
              edge.y1,
              edge.x2,
              edge.y2,
              nodeRadius
            );

            const isHighlighted =
              highlightedTransition?.from === edge.from &&
              highlightedTransition?.symbol === edge.symbol;

            // Calculate control point for curved edges
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            // Offset for multiple edges between same nodes
            const sameEdges = edges.filter(
              (e) =>
                (e.from === edge.from && e.to === edge.to) ||
                (e.from === edge.to && e.to === edge.from)
            );
            const edgeIndex = sameEdges.indexOf(edge);
            const offset = (edgeIndex - (sameEdges.length - 1) / 2) * 30;

            const perpX = -(endY - startY);
            const perpY = endX - startX;
            const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
            const normPerpX = (perpX / perpLength) * offset;
            const normPerpY = (perpY / perpLength) * offset;

            const ctrlX = midX + normPerpX;
            const ctrlY = midY + normPerpY;

            return (
              <g
                key={idx}
                className={`edge ${isHighlighted ? "highlighted" : ""}`}
              >
                <path
                  d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
                  fill="none"
                  stroke={isHighlighted ? "#cccc80" : "#8080a0"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  markerEnd={
                    isHighlighted
                      ? "url(#arrowhead-highlighted)"
                      : "url(#arrowhead)"
                  }
                  className="edge-path"
                />
                <text
                  x={ctrlX}
                  y={ctrlY - 8}
                  textAnchor="middle"
                  className={`edge-label ${
                    isTerminal(edge.symbol) ? "terminal" : "non-terminal"
                  }`}
                  fill={isTerminal(edge.symbol) ? "#cccc80" : "#a3a3ff"}
                >
                  {edge.symbol}
                </text>
              </g>
            );
          })}

          {/* Self loops */}
          {selfLoops.map((loop, idx) => {
            const pos = positions.get(loop.state);
            if (!pos) return null;

            const isHighlighted =
              highlightedTransition?.from === loop.state &&
              highlightedTransition?.symbol === loop.symbol;

            return (
              <g
                key={`loop-${idx}`}
                className={`edge ${isHighlighted ? "highlighted" : ""}`}
              >
                <path
                  d={`M ${pos.x + nodeRadius * 0.7} ${pos.y - nodeRadius * 0.7} 
                      C ${pos.x + 60} ${pos.y - 60}, ${pos.x + 60} ${
                    pos.y + 60
                  }, 
                      ${pos.x + nodeRadius * 0.7} ${pos.y + nodeRadius * 0.7}`}
                  fill="none"
                  stroke={isHighlighted ? "#cccc80" : "#8080a0"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  markerEnd={
                    isHighlighted
                      ? "url(#arrowhead-highlighted)"
                      : "url(#arrowhead)"
                  }
                />
                <text
                  x={pos.x + 70}
                  y={pos.y}
                  textAnchor="start"
                  className={`edge-label ${
                    isTerminal(loop.symbol) ? "terminal" : "non-terminal"
                  }`}
                  fill={isTerminal(loop.symbol) ? "#cccc80" : "#a3a3ff"}
                >
                  {loop.symbol}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {states.map((state) => {
            const pos = positions.get(state.id);
            if (!pos) return null;

            const isHighlighted = highlightedState === state.id;
            const isInitial = state.id === 0;
            const hasAccept = state.items.some(
              (item) =>
                item.productionId === 0 &&
                item.dotPosition === 1 &&
                item.lookahead === "$"
            );

            return (
              <g
                key={state.id}
                className={`node ${isHighlighted ? "highlighted" : ""}`}
                filter={isHighlighted ? "url(#glow)" : undefined}
              >
                {/* Initial state indicator */}
                {isInitial && (
                  <>
                    <line
                      x1={pos.x - 50}
                      y1={pos.y}
                      x2={pos.x - nodeRadius - 5}
                      y2={pos.y}
                      stroke="#80cc80"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={pos.x - 60}
                      y={pos.y - 10}
                      className="start-label"
                      fill="#80cc80"
                    >
                      start
                    </text>
                  </>
                )}

                {/* Accept state double circle */}
                {hasAccept && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeRadius + 5}
                    fill="none"
                    stroke="#cccc80"
                    strokeWidth={2}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  className={`node-circle ${
                    isHighlighted ? "highlighted" : ""
                  } ${hasAccept ? "accept" : ""}`}
                />

                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  className="node-label"
                >
                  {"I" + toSubscript(state.id)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-node initial"></div>
          <span>Initial State</span>
        </div>
        <div className="legend-item">
          <div className="legend-node accept"></div>
          <span>Accept State</span>
        </div>
        <div className="legend-item">
          <div className="legend-edge terminal"></div>
          <span>Terminal Transition</span>
        </div>
        <div className="legend-item">
          <div className="legend-edge non-terminal"></div>
          <span>Non-terminal Transition</span>
        </div>
      </div>
    </div>
  );
}
