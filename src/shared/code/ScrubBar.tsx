"use client";

import { useEffect, useRef } from "react";

interface Props {
  currentLine: number;
  totalLines: number;
  playing: boolean;
  onLineChange: (line: number) => void;
  onPlayToggle: () => void;
  onReset: () => void;
  /** Milliseconds between automatic line advances during Play. */
  intervalMs?: number;
}

export function ScrubBar({
  currentLine,
  totalLines,
  playing,
  onLineChange,
  onPlayToggle,
  onReset,
  intervalMs = 480,
}: Props) {
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!playing) return;
    tickRef.current = setInterval(() => {
      if (currentLine >= totalLines) {
        onPlayToggle();
        return;
      }
      onLineChange(Math.min(currentLine + 1, totalLines));
    }, intervalMs);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playing, currentLine, totalLines, onLineChange, onPlayToggle, intervalMs]);

  const atEnd = currentLine >= totalLines;
  const atStart = currentLine <= 1;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-3 sm:px-4 py-2 border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-inset)_70%,var(--bg-card))] text-[11px] font-mono text-[var(--text-muted)]">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onReset}
          aria-label="reset"
          className="min-h-[36px] min-w-[40px] inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--text)] transition-colors"
        >
          ↺
        </button>
        <button
          onClick={() => onLineChange(Math.max(1, currentLine - 1))}
          aria-label="previous line"
          disabled={atStart}
          className="min-h-[36px] min-w-[40px] inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--text)] disabled:opacity-40 transition-colors"
        >
          ←
        </button>
        <button
          onClick={onPlayToggle}
          aria-label={playing ? "pause" : "play through"}
          disabled={atEnd && !playing}
          className="min-h-[36px] inline-flex items-center justify-center px-3.5 py-1.5 rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40 transition-colors"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => onLineChange(Math.min(totalLines, currentLine + 1))}
          aria-label="next line"
          disabled={atEnd}
          className="min-h-[36px] min-w-[40px] inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--text)] disabled:opacity-40 transition-colors"
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-[140px] justify-end">
        <input
          type="range"
          min={1}
          max={totalLines}
          value={currentLine}
          onChange={(e) => onLineChange(parseInt(e.target.value, 10))}
          aria-label="scrub through code lines"
          className="flex-1 min-w-0 sm:flex-none sm:w-32 h-5 accent-[var(--accent)]"
        />
        <span className="text-[var(--text)] whitespace-nowrap">
          line <span className="text-[var(--accent)]">{currentLine}</span> / {totalLines}
        </span>
      </div>
    </div>
  );
}
