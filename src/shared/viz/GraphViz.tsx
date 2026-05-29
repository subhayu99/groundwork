"use client";

import { motion } from "framer-motion";
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
  nodeRadius = 26,
  onNodeClick,
}: Props) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg width={width} height={height} className="overflow-visible">
      {edges.map((e, i) => {
        const a = byId.get(e.a);
        const b = byId.get(e.b);
        if (!a || !b) return null;
        return (
          <motion.line
            key={`e${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            animate={{ stroke: e.tone ? toneStyle[e.tone].border : "var(--line)" }}
            transition={{ duration: 0.18 }}
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
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={nodeRadius}
              animate={{ fill: bg, stroke: border }}
              transition={{ duration: 0.18 }}
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
