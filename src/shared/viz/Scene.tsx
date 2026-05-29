"use client";

import { ReactNode, useId } from "react";
import { motion } from "framer-motion";
import { Tone, toneStyle } from "./tones";

/**
 * Scene — the domain-agnostic node-and-edge primitive.
 *
 * Every "boxes connected by lines" picture is a Scene: a binary tree, a graph,
 * a recursion tree — and, crucially, the diagrams the platform grows into:
 * client → load-balancer → servers, a key-range sharded across nodes, an
 * OLTP store feeding an OLAP warehouse. Rather than each of those forking a new
 * bespoke SVG, they all describe positioned nodes + labeled edges + annotations
 * and let this one engine draw them.
 *
 * `TreeViz` and `GraphViz` are now thin wrappers over `Scene` (their public APIs
 * are unchanged) — so there is ONE node/edge renderer, not three.
 *
 * What Scene adds beyond the old tree/graph renderers, for the new domains:
 *   - `shape: "rect"` nodes (services, stores, queues — not just circles).
 *   - directed edges with arrowheads (flows/requests), and edge `label`s.
 *   - an annotation layer (free-floating captions: "shard key 0–9", "replica").
 *   - keyboard-operable clickable nodes (role/tabindex/Enter/Space) for free —
 *     so the cross-cutting a11y goal lands once, here, for every topic.
 *
 * Layout is the caller's job (x/y per node) — keeps the primitive simple and
 * lets each story position its own nodes. `AnimatedAlgorithmView` drives the
 * frames; Scene just renders the current one.
 */

export type NodeShape = "circle" | "rect";

export interface SceneNode {
  id: string;
  x: number;
  y: number;
  /** Main glyph/number/text centered in the node. */
  label?: ReactNode;
  /** Small secondary line under the label (e.g. a role, a count). */
  sub?: ReactNode;
  tone?: Tone;
  /** "circle" (default) or "rect" (services/stores in systems diagrams). */
  shape?: NodeShape;
  /** Circle radius override (defaults to the Scene `nodeRadius`). */
  r?: number;
  /** Rect size override (defaults derived from `nodeRadius`). */
  w?: number;
  h?: number;
  /** Click handler — when set the node is a keyboard-operable button. */
  onClick?: () => void;
  /** Accessible name for the node (falls back to its text label / id). */
  ariaLabel?: string;
}

export interface SceneEdge {
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  tone?: Tone;
  dashed?: boolean;
  /** Draw an arrowhead at the target (a flow/request rather than a link). */
  directed?: boolean;
  /** Short caption rendered at the edge midpoint. */
  label?: ReactNode;
}

export interface SceneAnnotation {
  x: number;
  y: number;
  text: ReactNode;
  anchor?: "start" | "middle" | "end";
}

interface SceneProps {
  nodes: SceneNode[];
  edges?: SceneEdge[];
  annotations?: SceneAnnotation[];
  width?: number;
  height?: number;
  /**
   * Coordinate space the node x/y are authored in. Defaults to width/height.
   * Pass the original (desktop) dimensions here while shrinking width/height to
   * scale the whole drawing as a unit (nodes never clip) — mobile-responsive.
   */
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  /** Default circle radius / rect half-size when a node omits its own. */
  nodeRadius?: number;
  /** Fade nodes in on mount (the old TreeViz behavior). Default false. */
  appear?: boolean;
  /** Accessible description of the whole picture for screen-reader users. */
  ariaLabel?: string;
  className?: string;
}

/** The on-screen bounding radius of a node (for trimming directed edges). */
function nodeRadiusOf(n: SceneNode, fallback: number): number {
  if (n.shape === "rect") {
    const w = n.w ?? fallback * 2.4;
    const h = n.h ?? fallback * 1.5;
    return Math.min(w, h) / 2;
  }
  return n.r ?? fallback;
}

export function Scene({
  nodes,
  edges = [],
  annotations = [],
  width = 480,
  height = 380,
  viewBoxWidth,
  viewBoxHeight,
  nodeRadius = 24,
  appear = false,
  ariaLabel,
  className = "overflow-visible",
}: SceneProps) {
  const uid = useId();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const vbW = viewBoxWidth ?? width;
  const vbH = viewBoxHeight ?? height;

  // One arrowhead marker per distinct stroke color used by a directed edge.
  // (SVG markers don't reliably inherit the line's stroke across browsers, so
  // we mint a colored marker per color and reference it.)
  const arrowColors = Array.from(
    new Set(
      edges
        .filter((e) => e.directed)
        .map((e) => (e.tone ? toneStyle[e.tone].border : "var(--line)")),
    ),
  );
  const markerId = (color: string) =>
    `${uid}-arrow-${arrowColors.indexOf(color)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {arrowColors.length > 0 && (
        <defs>
          {arrowColors.map((color) => (
            <marker
              key={color}
              id={markerId(color)}
              markerWidth={8}
              markerHeight={8}
              refX={6}
              refY={3}
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L6,3 L0,6 Z" style={{ fill: color }} />
            </marker>
          ))}
        </defs>
      )}

      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const color = e.tone ? toneStyle[e.tone].border : "var(--line)";
        // Directed edges stop at the target's boundary so the arrowhead sits
        // beside the node, not buried under it. Plain links go center→center
        // (matching the old tree/graph renderers exactly).
        let x2 = b.x;
        let y2 = b.y;
        if (e.directed) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const trim = nodeRadiusOf(b, nodeRadius) + 2;
          x2 = b.x - (dx / len) * trim;
          y2 = b.y - (dy / len) * trim;
        }
        const mx = (a.x + x2) / 2;
        const my = (a.y + y2) / 2;
        return (
          <g key={`e${i}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={x2}
              y2={y2}
              style={{ stroke: color, transition: "stroke 0.2s" }}
              strokeWidth={2}
              strokeDasharray={e.dashed ? "5 4" : undefined}
              markerEnd={e.directed ? `url(#${markerId(color)})` : undefined}
            />
            {e.label != null && (
              <text
                x={mx}
                y={my - 4}
                textAnchor="middle"
                className="font-mono pointer-events-none select-none"
                style={{ fontSize: 9, fill: "var(--text-muted)" }}
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const { bg, border } = toneStyle[n.tone ?? "idle"];
        const clickable = Boolean(n.onClick);
        const name =
          n.ariaLabel ?? (typeof n.label === "string" ? n.label : n.id);
        const Group = appear ? motion.g : "g";
        const groupProps = appear
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.18 } }
          : {};
        return (
          <Group
            key={n.id}
            {...groupProps}
            onClick={clickable ? () => n.onClick?.() : undefined}
            onKeyDown={
              clickable
                ? (ev: React.KeyboardEvent) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      n.onClick?.();
                    }
                  }
                : undefined
            }
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? "button" : undefined}
            aria-label={clickable ? name : undefined}
            style={{ cursor: clickable ? "pointer" : "default", outline: "none" }}
          >
            {n.shape === "rect" ? (
              <rect
                x={n.x - (n.w ?? nodeRadius * 2.4) / 2}
                y={n.y - (n.h ?? nodeRadius * 1.5) / 2}
                width={n.w ?? nodeRadius * 2.4}
                height={n.h ?? nodeRadius * 1.5}
                rx={6}
                style={{ fill: bg, stroke: border, transition: "fill 0.2s, stroke 0.2s" }}
                strokeWidth={2}
              />
            ) : (
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r ?? nodeRadius}
                style={{ fill: bg, stroke: border, transition: "fill 0.2s, stroke 0.2s" }}
                strokeWidth={2}
              />
            )}
            {n.label != null && (
              <text
                x={n.x}
                y={n.sub != null ? n.y - 5 : n.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono pointer-events-none select-none"
                style={{ fontSize: 11, fill: "var(--text)" }}
              >
                {n.label}
              </text>
            )}
            {n.sub != null && (
              <text
                x={n.x}
                y={n.y + 9}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono pointer-events-none select-none"
                style={{ fontSize: 8, fill: "var(--text-muted)" }}
              >
                {n.sub}
              </text>
            )}
          </Group>
        );
      })}

      {annotations.map((an, i) => (
        <text
          key={`a${i}`}
          x={an.x}
          y={an.y}
          textAnchor={an.anchor ?? "middle"}
          className="font-mono pointer-events-none select-none"
          style={{ fontSize: 9, fill: "var(--text-faint)" }}
        >
          {an.text}
        </text>
      ))}
    </svg>
  );
}
