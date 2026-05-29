"use client";

import { motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

interface WindowOverlayProps {
  /** Window start index (0-based) */
  start: number;
  /** Window size k */
  k: number;
  /** Total array length (for clamping) */
  total: number;
  /** Cell size in px (matches --cell-size) */
  cellSize?: number;
  /** Cell gap in px (matches --cell-gap) */
  cellGap?: number;
  draggable?: boolean;
  onChange?: (newStart: number) => void;
  /** Optional label content inside the overlay */
  label?: React.ReactNode;
}

export function WindowOverlay({
  start,
  k,
  total,
  cellSize = 56,
  cellGap = 8,
  draggable = false,
  onChange,
  label,
}: WindowOverlayProps) {
  const maxStart = Math.max(0, total - k);
  const stride = cellSize + cellGap;
  const x = useMotionValue(start * stride);
  const [dragging, setDragging] = useState(false);

  // Sync external `start` changes to the motion value when not actively dragging
  useEffect(() => {
    if (!dragging) x.set(start * stride);
  }, [start, dragging, stride, x]);

  // Convert the motion value's x position into a clamped start index, notify on change
  useMotionValueEvent(x, "change", (latest) => {
    if (!dragging) return;
    const newStart = Math.round(latest / stride);
    const clamped = Math.max(0, Math.min(maxStart, newStart));
    if (clamped !== start) onChange?.(clamped);
  });

  const width = k * cellSize + (k - 1) * cellGap;

  // Keyboard equivalent of dragging: when the overlay is interactive it's a
  // proper ARIA slider (arrow keys / Home / End) so keyboard and screen-reader
  // users can move the window — and clear any interaction gate the drag clears.
  // Mirrors the keyboard-operable nodes baked into the Scene primitive.
  const moveTo = (next: number) => {
    const clamped = Math.max(0, Math.min(maxStart, next));
    x.set(clamped * stride);
    if (clamped !== start) onChange?.(clamped);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        moveTo(start + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        moveTo(start - 1);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(maxStart);
        break;
    }
  };

  return (
    <motion.div
      drag={draggable ? "x" : false}
      dragConstraints={{ left: 0, right: maxStart * stride }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => {
        setDragging(true);
        // Fire on drag start (pointer down) so even a tiny drag counts toward
        // interaction gates — re-asserting the current clamped start.
        const clamped = Math.max(0, Math.min(maxStart, start));
        onChange?.(clamped);
      }}
      onDragEnd={() => {
        setDragging(false);
        // Snap to nearest cell on release
        const latest = x.get();
        const newStart = Math.round(latest / stride);
        const clamped = Math.max(0, Math.min(maxStart, newStart));
        x.set(clamped * stride);
        onChange?.(clamped);
      }}
      tabIndex={draggable ? 0 : undefined}
      role={draggable ? "slider" : undefined}
      aria-label={draggable ? "Window start position — use arrow keys to slide" : undefined}
      aria-valuemin={draggable ? 0 : undefined}
      aria-valuemax={draggable ? maxStart : undefined}
      aria-valuenow={draggable ? start : undefined}
      onKeyDown={draggable ? onKeyDown : undefined}
      style={{
        x,
        width,
        height: cellSize + 12,
        cursor: draggable ? (dragging ? "grabbing" : "grab") : "default",
      }}
      className="absolute top-[-6px] rounded-xl border-2 border-[var(--accent)] pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
    >
      {label && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[10px] font-mono text-[var(--accent-ink)]">
          {label}
        </div>
      )}
    </motion.div>
  );
}
