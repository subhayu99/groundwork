"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PlaybackOptions {
  /** Advance the animation by one step. Called on each tick while playing. */
  onTick: () => void;
  /** Return true when there's nothing left to play; auto-stops playback. */
  isDone?: () => boolean;
  /** Milliseconds between ticks. */
  intervalMs?: number;
}

/**
 * The animation loop every step-by-step visualizer used to hand-roll:
 * a `playing` flag + a `setInterval` that calls a step function and stops at
 * the end. Using refs for the callbacks means the interval is set up once and
 * never sees a stale closure, so callers don't have to thread their step fn
 * through the effect deps.
 *
 * Pair with `<PlaybackControls />` for the ↺ ← Play → buttons.
 */
export function usePlayback({ onTick, isDone, intervalMs = 420 }: PlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const onTickRef = useRef(onTick);
  const isDoneRef = useRef(isDone);
  onTickRef.current = onTick;
  isDoneRef.current = isDone;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (isDoneRef.current?.()) {
        setPlaying(false);
        return;
      }
      onTickRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [playing, intervalMs]);

  // Stable identities so callers can safely list these in effect deps.
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const stop = useCallback(() => setPlaying(false), []);
  /** Run a single step now (for the → button). Respects isDone. */
  const stepOnce = useCallback(() => {
    if (isDoneRef.current?.()) return;
    onTickRef.current();
  }, []);

  return { playing, setPlaying, toggle, stop, stepOnce };
}
