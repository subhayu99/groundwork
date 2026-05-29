"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Tone, toneStyle } from "./tones";

export interface StackItem {
  key: string | number;
  label: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}

interface Props {
  title?: string;
  items: StackItem[];
  emptyLabel?: string;
  /** Line under the box (e.g. "pops this step: 2"). */
  footer?: ReactNode;
  widthPx?: number;
  minHeightPx?: number;
  /** Render with the last item on top (LIFO call-stack look). Default true. */
  topOnTop?: boolean;
}

/**
 * A vertical stack of labelled items in a dashed box. Replaces the hand-rolled
 * stack panels in monotonic-stack and recursion (call stack). For a FIFO queue
 * look, pass topOnTop={false}.
 */
export function StackPanel({
  title,
  items,
  emptyLabel = "empty",
  footer,
  widthPx = 220,
  minHeightPx = 130,
  topOnTop = true,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2" style={{ width: widthPx }}>
      {title && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          {title}
        </div>
      )}
      <div
        className={`flex ${topOnTop ? "flex-col-reverse" : "flex-col"} items-stretch gap-1 border border-dashed border-[var(--line)] rounded-md p-2 w-full`}
        style={{ minHeight: minHeightPx }}
      >
        {items.length === 0 ? (
          <span className="text-[10px] font-mono text-[var(--text-faint)] text-center py-3">
            {emptyLabel}
          </span>
        ) : (
          items.map((it) => {
            const { bg, border } = toneStyle[it.tone ?? "accent"];
            return (
              <motion.div
                key={it.key}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, backgroundColor: bg, borderColor: border }}
                transition={{ duration: 0.18 }}
                className="rounded-md border px-2 py-1 font-mono text-xs text-[var(--text)] flex items-center justify-between gap-2"
              >
                <span className="truncate">{it.label}</span>
                {it.sub != null && (
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">{it.sub}</span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
      {footer != null && (
        <div className="font-mono text-[10px] text-[var(--text-faint)]">{footer}</div>
      )}
    </div>
  );
}
