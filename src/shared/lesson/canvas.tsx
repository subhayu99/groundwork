"use client";

import { ReactNode } from "react";
import { Tone, toneStyle } from "@/shared/viz/tones";

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
}

/** Render a row of tone-colored cells with optional markers, in SVG. */
export function CellRow({ geom, values, tones, dim, markers, showIndex, fontSize = 14 }: CellRowProps): ReactNode {
  const { y, cellW, cellH } = geom;
  return (
    <>
      {values.map((v, i) => {
        const tone: Tone = tones?.[i] ?? "idle";
        const isDim = dim?.[i];
        const ts = toneStyle[tone];
        return (
          <g key={i} style={{ opacity: isDim ? 0.28 : 1, transition: "opacity .3s" }}>
            <rect x={geom.left(i)} y={y} width={cellW} height={cellH} rx={8}
              style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            <text x={geom.cx(i)} y={y + cellH / 2} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none" style={{ fontSize, fill: "var(--text)" }}>
              {v}
            </text>
            {showIndex && (
              <text x={geom.cx(i)} y={y + cellH + 14} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
                {i}
              </text>
            )}
            {markers?.[i] && <Pill x={geom.cx(i)} y={y + cellH + 7} text={markers[i]} />}
          </g>
        );
      })}
    </>
  );
}
