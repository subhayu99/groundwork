"use client";

import { ReactNode, useState } from "react";
import { Tone, toneStyle } from "@/shared/viz/tones";

/**
 * Map a visual tone to the algorithmic STATE it encodes, as a spoken word for
 * screen readers (so the aria-label conveys *why* a cell is highlighted, not
 * just its value). "idle" carries no state, so it returns undefined.
 */
function toneState(tone: Tone | undefined): string | undefined {
  switch (tone) {
    case "active": return "active";
    case "visited": return "visited";
    case "trail": return "on path";
    case "good": return "valid";
    case "bad": return "invalid";
    case "muted": return "out of play";
    case "wall": return "wall";
    case "start": return "start";
    case "goal": return "goal";
    case "accent": return "selected";
    default: return undefined;
  }
}

/** Join the non-empty descriptors after the base name into an aria-label. */
function withState(base: string, ...parts: (string | undefined | false)[]): string {
  const extra = parts.filter((p): p is string => Boolean(p));
  return extra.length ? `${base}, ${extra.join(", ")}` : base;
}

const FOCUS_RING_COLOR = "var(--accent-sky)";

/**
 * A focusable SVG <g> that, while focused, paints a visible focus ring overlay.
 * Native `outline` is unreliable on SVG elements inside a CSS-scaled plane, so
 * we draw the ring ourselves (3px stroke, 2px offset) and toggle it on
 * focus/blur. Children render the actual shape + labels.
 */
function FocusableGroup({
  enabled, onActivate, ariaLabel, style, ring, children,
}: {
  enabled: boolean;
  onActivate: () => void;
  ariaLabel: string;
  style?: React.CSSProperties;
  /** Geometry for the ring overlay, in canvas coordinates. */
  ring: { x: number; y: number; w: number; h: number; rx: number } | { cx: number; cy: number; r: number };
  children: ReactNode;
}): ReactNode {
  const [focused, setFocused] = useState(false);
  if (!enabled) return <g style={style}>{children}</g>;
  const offset = 2;
  return (
    <g
      style={style}
      onClick={onActivate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
    >
      {children}
      {focused && ("r" in ring ? (
        <circle cx={ring.cx} cy={ring.cy} r={ring.r + offset}
          fill="none" stroke={FOCUS_RING_COLOR} strokeWidth={3} className="pointer-events-none" />
      ) : (
        <rect x={ring.x - offset} y={ring.y - offset} width={ring.w + offset * 2} height={ring.h + offset * 2}
          rx={ring.rx + offset} fill="none" stroke={FOCUS_RING_COLOR} strokeWidth={3} className="pointer-events-none" />
      ))}
    </g>
  );
}

/**
 * Shared SVG drawing helpers for annotated-canvas lesson beats. Every beat draws
 * inside the lesson's canvas coordinate space (LessonSpec.canvas), so a topic's
 * `visual` is just SVG built from these primitives — and arrows/brackets line up
 * with elements because everything shares one coordinate system.
 */

export const LESSON_ARROW_ID = "lesson-arrow";

/** Put once at the top of the lesson <svg>. */
export function ArrowDefs() {
  return (
    <defs>
      <marker id={LESSON_ARROW_ID} markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto-start-reverse">
        <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-sky)" />
      </marker>
    </defs>
  );
}

export function Arrow({ x1, y1, x2, y2, color = "var(--accent-sky)" }: {
  x1: number; y1: number; x2: number; y2: number; color?: string;
}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} markerEnd={`url(#${LESSON_ARROW_ID})`} />;
}

/** A square bracket spanning [x1,x2] at height y, with a centered label above. */
export function Bracket({ x1, x2, y, label, color = "var(--diff-hard)" }: {
  x1: number; x2: number; y: number; label: string; color?: string;
}) {
  return (
    <g>
      <path d={`M${x1},${y + 8} L${x1},${y} L${x2},${y} L${x2},${y + 8}`} fill="none" stroke={color} strokeWidth={1.5} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: color }}>
        {label}
      </text>
    </g>
  );
}

/** A small marker pill (lo / hi / mid / ✓), centered at x with its top at y. */
export function Pill({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.max(24, text.length * 7 + 12);
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={16} rx={5} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1} />
      <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--accent-ink)" }}>
        {text}
      </text>
    </g>
  );
}

/* ── Row-of-cells (arrays / strings / windows) ─────────────────────────────── */

export interface CellRowGeom {
  x0: number;
  y: number;
  cellW: number;
  gap: number;
  cellH: number;
  stride: number;
  /** center-x of cell i */
  cx: (i: number) => number;
  /** left-x of cell i */
  left: (i: number) => number;
}

/** Compute a centered row's geometry inside a canvas of width `vw`. */
export function rowGeom(count: number, vw: number, y: number, cellW = 40, gap = 6, cellH = 40): CellRowGeom {
  const stride = cellW + gap;
  const rowW = count * cellW + (count - 1) * gap;
  const x0 = (vw - rowW) / 2;
  return {
    x0, y, cellW, gap, cellH, stride,
    cx: (i) => x0 + i * stride + cellW / 2,
    left: (i) => x0 + i * stride,
  };
}

export interface CellRowProps {
  geom: CellRowGeom;
  values: (string | number)[];
  /** per-index tone (default "idle") */
  tones?: (Tone | undefined)[];
  /** per-index dim (eliminated/out-of-play) */
  dim?: boolean[];
  /** index → pill text drawn under the cell */
  markers?: Record<number, string>;
  showIndex?: boolean;
  fontSize?: number;
  /** Make cells clickable (and keyboard-operable). */
  onCellClick?: (i: number) => void;
  /** Which cells accept a click (default: all, when onCellClick is set). */
  cellEnabled?: (i: number) => boolean;
}

/** Render a row of tone-colored cells with optional markers, in SVG. */
export function CellRow({ geom, values, tones, dim, markers, showIndex, fontSize = 14, onCellClick, cellEnabled }: CellRowProps): ReactNode {
  const { y, cellW, cellH } = geom;
  return (
    <>
      {values.map((v, i) => {
        const tone: Tone = tones?.[i] ?? "idle";
        const isDim = dim?.[i];
        const ts = toneStyle[tone];
        const enabled = onCellClick ? (cellEnabled ? cellEnabled(i) : true) : false;
        // Speak the algorithmic state the cell encodes: its role marker (lo/hi/mid/…),
        // tone (active/visited/…), or that it's been eliminated/dimmed out of play.
        const ariaLabel = withState(`cell ${i}, value ${v}`, markers?.[i], toneState(tone), isDim && "eliminated");
        return (
          <FocusableGroup
            key={i}
            enabled={enabled}
            onActivate={() => onCellClick!(i)}
            ariaLabel={ariaLabel}
            style={{ opacity: isDim ? 0.28 : 1, transition: "opacity .3s", cursor: enabled ? "pointer" : "default" }}
            ring={{ x: geom.left(i), y, w: cellW, h: cellH, rx: 8 }}
          >
            <rect x={geom.left(i)} y={y} width={cellW} height={cellH} rx={8}
              style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            <text x={geom.cx(i)} y={y + cellH / 2} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none pointer-events-none" style={{ fontSize, fill: "var(--text)" }}>
              {v}
            </text>
            {showIndex && (
              <text x={geom.cx(i)} y={y + cellH + 14} textAnchor="middle" className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
                {i}
              </text>
            )}
            {markers?.[i] && <Pill x={geom.cx(i)} y={y + cellH + 7} text={markers[i]} />}
          </FocusableGroup>
        );
      })}
    </>
  );
}

/* ── Node graph (trees / graphs) — SVG nodes + edges in canvas space ───────── */

export interface GNode { id: string; x: number; y: number; label?: ReactNode; sub?: ReactNode; tone?: Tone; shape?: "circle" | "rect"; r?: number; w?: number; h?: number; }
export interface GEdge { from: string; to: string; tone?: Tone; dashed?: boolean; directed?: boolean; label?: string; }

function nodeR(n: GNode, fallback: number) {
  if (n.shape === "rect") return Math.min(n.w ?? fallback * 2.4, n.h ?? fallback * 1.5) / 2;
  return n.r ?? fallback;
}

/** Draw positioned nodes + edges (covers trees, graphs, recursion trees). */
export function NodeGraph({ nodes, edges = [], radius = 22, onNodeClick, cellEnabled }: {
  nodes: GNode[]; edges?: GEdge[]; radius?: number; onNodeClick?: (id: string) => void; cellEnabled?: (id: string) => boolean;
}): ReactNode {
  const by = new Map(nodes.map((n) => [n.id, n]));
  return (
    <>
      {edges.map((e, i) => {
        const a = by.get(e.from), b = by.get(e.to);
        if (!a || !b) return null;
        const color = e.tone ? toneStyle[e.tone].border : "var(--line)";
        let x2 = b.x, y2 = b.y;
        if (e.directed) {
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, trim = nodeR(b, radius) + 2;
          x2 = b.x - (dx / len) * trim; y2 = b.y - (dy / len) * trim;
        }
        return (
          <g key={`e${i}`}>
            <line x1={a.x} y1={a.y} x2={x2} y2={y2} style={{ stroke: color, transition: "stroke .3s" }} strokeWidth={2}
              strokeDasharray={e.dashed ? "5 4" : undefined} markerEnd={e.directed ? `url(#${LESSON_ARROW_ID})` : undefined} />
            {e.label && <text x={(a.x + x2) / 2} y={(a.y + y2) / 2 - 4} textAnchor="middle" className="font-mono pointer-events-none select-none" style={{ fontSize: 9, fill: "var(--text-muted)" }}>{e.label}</text>}
          </g>
        );
      })}
      {nodes.map((n) => {
        const ts = toneStyle[n.tone ?? "idle"];
        const enabled = onNodeClick ? (cellEnabled ? cellEnabled(n.id) : true) : false;
        const isRect = n.shape === "rect";
        const rw = n.w ?? radius * 2.4, rh = n.h ?? radius * 1.5;
        const ring = isRect
          ? { x: n.x - rw / 2, y: n.y - rh / 2, w: rw, h: rh, rx: 6 }
          : { cx: n.x, cy: n.y, r: n.r ?? radius };
        return (
          <FocusableGroup key={n.id} enabled={enabled}
            onActivate={() => onNodeClick!(n.id)}
            ariaLabel={withState(`node ${n.id}`, toneState(n.tone))}
            style={{ cursor: enabled ? "pointer" : "default" }}
            ring={ring}>
            {isRect ? (
              <rect x={n.x - rw / 2} y={n.y - rh / 2} width={rw} height={rh} rx={6}
                style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            ) : (
              <circle cx={n.x} cy={n.y} r={n.r ?? radius} style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            )}
            {n.label != null && <text x={n.x} y={n.sub != null ? n.y - 5 : n.y} textAnchor="middle" dominantBaseline="central" className="font-mono pointer-events-none select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{n.label}</text>}
            {n.sub != null && <text x={n.x} y={n.y + 9} textAnchor="middle" dominantBaseline="central" className="font-mono pointer-events-none select-none" style={{ fontSize: 8, fill: "var(--text-muted)" }}>{n.sub}</text>}
          </FocusableGroup>
        );
      })}
    </>
  );
}

/* ── Grid (dfs / bfs / backtracking) — SVG cell matrix in canvas space ─────── */

export interface GridGeom { x0: number; y0: number; cellPx: number; gap: number; cx: (r: number, c: number) => number; cy: (r: number, c: number) => number; }
export function gridGeom(rows: number, cols: number, vw: number, y0: number, cellPx = 46, gap = 6): GridGeom {
  const w = cols * cellPx + (cols - 1) * gap;
  const x0 = (vw - w) / 2;
  return { x0, y0, cellPx, gap, cx: (_r, c) => x0 + c * (cellPx + gap) + cellPx / 2, cy: (r) => y0 + r * (cellPx + gap) + cellPx / 2 };
}
export function GridCells({ rows, cols, geom, cell, onCellClick, cellEnabled }: {
  rows: number; cols: number; geom: GridGeom;
  cell: (r: number, c: number) => { tone?: Tone; content?: ReactNode; sub?: ReactNode };
  onCellClick?: (r: number, c: number) => void; cellEnabled?: (r: number, c: number) => boolean;
}): ReactNode {
  const { x0, y0, cellPx, gap } = geom;
  return (
    <>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const spec = cell(r, c), ts = toneStyle[spec.tone ?? "idle"];
          const x = x0 + c * (cellPx + gap), y = y0 + r * (cellPx + gap);
          const enabled = onCellClick ? (cellEnabled ? cellEnabled(r, c) : true) : false;
          return (
            <FocusableGroup key={`${r}-${c}`} enabled={enabled}
              onActivate={() => onCellClick!(r, c)}
              ariaLabel={withState(`cell ${r},${c}`, toneState(spec.tone))}
              style={{ cursor: enabled ? "pointer" : "default" }}
              ring={{ x, y, w: cellPx, h: cellPx, rx: 7 }}>
              <rect x={x} y={y} width={cellPx} height={cellPx} rx={7} style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
              {spec.content != null && <text x={x + cellPx / 2} y={y + cellPx / 2} textAnchor="middle" dominantBaseline="central" className="font-mono pointer-events-none select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{spec.content}</text>}
              {spec.sub != null && <text x={x + cellPx / 2} y={y + cellPx - 8} textAnchor="middle" className="font-mono pointer-events-none select-none" style={{ fontSize: 8, fill: "var(--accent-ink)" }}>{spec.sub}</text>}
            </FocusableGroup>
          );
        }),
      )}
    </>
  );
}

/* ── Stack/queue (stacks-queues / monotonic-stack / recursion) ─────────────── */

export interface StackBox { key: string | number; label: ReactNode; sub?: ReactNode; tone?: Tone; }
export function StackBoxes({ items, cx, top, width = 150, boxH = 28, gap = 6, topOnTop = true }: {
  items: StackBox[]; cx: number; top: number; width?: number; boxH?: number; gap?: number; topOnTop?: boolean;
}): ReactNode {
  const ordered = topOnTop ? [...items].reverse() : items;
  return (
    <>
      {ordered.map((it, i) => {
        const ts = toneStyle[it.tone ?? "accent"];
        const y = top + i * (boxH + gap);
        return (
          <g key={it.key}>
            <rect x={cx - width / 2} y={y} width={width} height={boxH} rx={6} style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={1.5} />
            <text x={cx - width / 2 + 10} y={y + boxH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{it.label}</text>
            {it.sub != null && <text x={cx + width / 2 - 10} y={y + boxH / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>{it.sub}</text>}
          </g>
        );
      })}
    </>
  );
}
