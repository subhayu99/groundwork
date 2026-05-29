"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Tone, toneStyle } from "./tones";

export interface TreeVizNode {
  id: string;
  x: number;
  y: number;
  label: ReactNode;
  tone?: Tone;
}

export interface TreeVizEdge {
  from: string;
  to: string;
  tone?: Tone;
}

interface Props {
  nodes: TreeVizNode[];
  edges: TreeVizEdge[];
  width: number;
  height: number;
  radius?: number;
}

/**
 * SVG renderer for node-and-edge trees where the caller supplies positions
 * (x, y per node). Replaces the bespoke tree SVGs in trees (org chart) and
 * dp-1d (recursion tree). Layout is the caller's job — keeps this primitive
 * simple and lets each topic position nodes however its story needs.
 */
export function TreeViz({ nodes, edges, width, height, radius = 20 }: Props) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg width={width} height={height} className="overflow-visible">
      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        return (
          <line
            key={`e${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={e.tone ? toneStyle[e.tone].border : "var(--line)"}
            strokeWidth={1.5}
          />
        );
      })}
      {nodes.map((n) => {
        const { bg, border } = toneStyle[n.tone ?? "idle"];
        return (
          <motion.g key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={radius}
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
          </motion.g>
        );
      })}
    </svg>
  );
}
