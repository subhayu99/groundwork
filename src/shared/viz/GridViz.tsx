"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Tone, toneStyle } from "./tones";

export interface CellSpec {
  tone?: Tone;
  /** Main glyph/number in the cell (e.g. "S", "G", "♛", a distance). */
  content?: ReactNode;
  /** Small secondary line under the content. */
  sub?: ReactNode;
}

interface Props {
  rows: number;
  cols: number;
  /** Describe each cell. Called for every (r, c). */
  cell: (r: number, c: number) => CellSpec;
  cellPx?: number;
  gap?: number;
  /** If provided, cells become buttons. Return value ignored. */
  onCellClick?: (r: number, c: number) => void;
  /** Disable a cell's click (greys nothing — just blocks the handler). */
  cellDisabled?: (r: number, c: number) => boolean;
}

/**
 * Renders an N×M grid of tone-colored cells. Replaces the hand-rolled grids in
 * dfs / bfs / backtracking (and any future grid-DP / sudoku). Topic-specific
 * overlays (pointers, "free at N" lines) are layered by the caller around this.
 */
export function GridViz({
  rows,
  cols,
  cell,
  cellPx = 48,
  gap = 6,
  onCellClick,
  cellDisabled,
}: Props) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex" style={{ gap }}>
          {Array.from({ length: cols }, (_, c) => {
            const spec = cell(r, c);
            const { bg, border } = toneStyle[spec.tone ?? "idle"];
            const clickable = Boolean(onCellClick) && !cellDisabled?.(r, c);
            const inner = (
              <motion.div
                animate={{ backgroundColor: bg, borderColor: border }}
                transition={{ duration: 0.18 }}
                className="rounded-md border-2 flex flex-col items-center justify-center font-mono text-sm"
                style={{ width: cellPx, height: cellPx, color: "var(--text)" }}
              >
                {spec.content}
                {spec.sub != null && (
                  <span className="text-[10px] text-[var(--accent-ink)] leading-none mt-0.5">
                    {spec.sub}
                  </span>
                )}
              </motion.div>
            );
            return clickable ? (
              <button
                key={c}
                onClick={() => onCellClick?.(r, c)}
                aria-label={`cell ${r},${c}`}
                className="p-0 bg-transparent border-0"
                style={{ cursor: "pointer" }}
              >
                {inner}
              </button>
            ) : (
              <div key={c}>{inner}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
