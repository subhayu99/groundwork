"use client";

import { Tone, toneStyle } from "./tones";

export interface GraphVizNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tone?: Tone;
}

export interface GraphVizEdge {
  a: string;
  b: string;
  tone?: Tone;
  dashed?: boolean;
}

interface Props {
  nodes: GraphVizNode[];
  edges: GraphVizEdge[];
  width?: number;
  height?: number;
  /**
   * Coordinate space the node x/y are authored in. Defaults to width/height so
   * existing callers are unaffected. Pass the original (desktop) dimensions here
   * while shrinking width/height to scale the whole drawing as a unit (nodes
   * never clip) — used for mobile-responsive sizing.
   */
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  nodeRadius?: number;
  onNodeClick?: (id: string) => void;
}

/**
 * SVG renderer for node-and-edge graphs with caller-supplied positions.
 * Extracted from the bespoke GraphSVG in the graphs topic so graph algorithms
 * (BFS/DFS/Dijkstra/Union-Find, later) can share one renderer. Edges can be
 * dashed and tone-colored (e.g. "lost" tree edges shown red/dashed).
 */
export function GraphViz({
  nodes,
  edges,
  width = 480,
  height = 380,
  viewBoxWidth,
  viewBoxHeight,
  nodeRadius = 26,
  onNodeClick,
}: Props) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const vbW = viewBoxWidth ?? width;
  const vbH = viewBoxHeight ?? height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="overflow-visible"
    >
      {edges.map((e, i) => {
        const a = byId.get(e.a);
        const b = byId.get(e.b);
        if (!a || !b) return null;
        return (
          <line
            key={`e${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            style={{ stroke: e.tone ? toneStyle[e.tone].border : "var(--line)", transition: "stroke 0.2s" }}
            strokeWidth={2}
            strokeDasharray={e.dashed ? "5 4" : undefined}
          />
        );
      })}
      {nodes.map((n) => {
        const { bg, border } = toneStyle[n.tone ?? "idle"];
        const clickable = Boolean(onNodeClick);
        return (
          <g
            key={n.id}
            onClick={clickable ? () => onNodeClick?.(n.id) : undefined}
            style={{ cursor: clickable ? "pointer" : "default" }}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={nodeRadius}
              style={{ fill: bg, stroke: border, transition: "fill 0.2s, stroke 0.2s" }}
              strokeWidth={2}
            />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono pointer-events-none select-none"
              style={{ fontSize: 11, fill: "var(--text)" }}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
