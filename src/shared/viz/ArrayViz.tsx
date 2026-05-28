"use client";

import { motion } from "framer-motion";

interface ArrayVizProps {
  values: number[];
  /** Indices currently inside any window */
  highlightedIndices?: number[];
  /** Cell hovered by user */
  hoverIndex?: number | null;
  onHover?: (index: number | null) => void;
  /** Indices flashing as "entering" (animation cue) */
  enteringIndices?: number[];
  /** Indices flashing as "leaving" */
  leavingIndices?: number[];
  /** Indices flashing as redundantly recomputed */
  recomputedIndices?: number[];
  showIndices?: boolean;
}

export function ArrayViz({
  values,
  highlightedIndices = [],
  hoverIndex,
  onHover,
  enteringIndices = [],
  leavingIndices = [],
  recomputedIndices = [],
  showIndices = true,
}: ArrayVizProps) {
  return (
    <div className="flex items-center gap-2 select-none">
      {values.map((v, i) => {
        const inWindow = highlightedIndices.includes(i);
        const isHover = hoverIndex === i;
        const isEntering = enteringIndices.includes(i);
        const isLeaving = leavingIndices.includes(i);
        const isRecomputed = recomputedIndices.includes(i);

        return (
          <motion.div
            key={i}
            layout
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
            animate={{
              backgroundColor: isRecomputed
                ? "color-mix(in oklab, #fcd34d 30%, var(--bg-card))"
                : inWindow
                ? "color-mix(in oklab, var(--accent-sky) 16%, var(--bg-card))"
                : "var(--bg-card)",
              borderColor: isEntering
                ? "var(--accent-sky)"
                : isLeaving
                ? "var(--diff-hard)"
                : inWindow
                ? "var(--accent-line)"
                : isHover
                ? "var(--line-strong)"
                : "var(--line)",
              scale: isEntering || isLeaving ? 1.06 : 1,
            }}
            transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
            className="relative flex flex-col items-center"
            style={{
              width: "var(--cell-size)",
              height: "var(--cell-size)",
            }}
          >
            <div
              className="flex items-center justify-center w-full h-full rounded-lg border-2 font-mono text-lg text-[var(--text)]"
              style={{ borderColor: "inherit", background: "inherit" }}
            >
              {v}
            </div>
            {showIndices && (
              <span className="absolute -bottom-5 text-[10px] font-mono text-[var(--text-faint)]">
                {i}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
