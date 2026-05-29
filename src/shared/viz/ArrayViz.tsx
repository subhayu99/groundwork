"use client";

import { motion } from "framer-motion";
import { useIsMobile } from "@/shared/layout/useIsMobile";

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
  const isMobile = useIsMobile();
  const n = values.length;
  // On mobile, size cells to fit the ~340px visual panel regardless of array
  // length (so a 15-cell array doesn't get scaled down to an illegible strip),
  // with a legible floor. Desktop keeps the original 56px / 8px-gap / 18px-font.
  const gapPx = isMobile ? 4 : 8;
  const cellPx = isMobile ? Math.max(20, Math.min(40, Math.floor((338 - gapPx * (n - 1)) / n))) : 56;
  const fontPx = isMobile ? Math.round(cellPx * 0.44) : 18;

  return (
    <div className="flex items-center select-none" style={{ gap: gapPx }}>
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
            animate={{ scale: isEntering || isLeaving ? 1.06 : 1 }}
            transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
            className="relative flex flex-col items-center transition-[background-color,border-color] duration-300"
            // Colors via CSS (OKLCH color-mix isn't Motion-animatable); scale via Motion.
            style={{
              width: cellPx,
              height: cellPx,
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
            }}
          >
            <div
              className="flex items-center justify-center w-full h-full rounded-lg border-2 font-mono text-[var(--text)]"
              style={{ borderColor: "inherit", background: "inherit", fontSize: fontPx }}
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
