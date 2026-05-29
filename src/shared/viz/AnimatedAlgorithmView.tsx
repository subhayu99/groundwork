"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePlayback } from "./usePlayback";
import { PlaybackControls } from "./PlaybackControls";

/**
 * The shared "final-algorithm" animated view. Every step-by-step visualizer used
 * to hand-roll its own `useState` + `usePlayback`/`setInterval` + a Play/↺/→
 * button row + an `onActiveLine` emit — and several emitted from inside a
 * `setState` updater (the setState-in-render bug). This wrapper owns all of it:
 *
 *   - You give a pure reducer `step(state) → { state, active, done }`.
 *   - It drives playback, renders `<PlaybackControls/>`, and on every frame
 *     emits the frame's `active` code labels — from a `useEffect` (post-render),
 *     so a child can NEVER update the parent during render.
 *
 * Because `active` comes from the reducer per frame, the highlighted code line
 * marches in lockstep with the animation (fixes the "frozen highlight" class)
 * instead of being a single fixed set for the whole step.
 *
 * Pure, domain-agnostic: `S` is whatever state your algorithm needs, `render`
 * draws it. Reused across DSA today and any future domain (systems-design, DB…).
 */
export interface AlgoFrame<S> {
  state: S;
  /** Code labels (or legacy line numbers) the operation just performed maps to. */
  active?: (number | string)[];
  /** True when the algorithm has finished; playback auto-stops. */
  done?: boolean;
}

interface Props<S> {
  /** Build the starting state (also used by ↺ reset). Called lazily. */
  initial: () => S;
  /** Advance one operation. MUST be pure (no setState/emit side-effects). */
  step: (state: S) => AlgoFrame<S>;
  /** Draw the current state. `done` lets you show a finished badge. */
  render: (state: S, meta: { done: boolean }) => ReactNode;
  /** Emit the active code labels for live highlighting (wired by the topic). */
  onActiveLine?: (lines: (number | string)[]) => void;
  /** Code labels to highlight at the initial/reset frame (e.g. the signature). */
  initialActive?: (number | string)[];
  /** First time the user plays/steps, fire this (satisfies a step-3 wedge). */
  onInteraction?: () => void;
  intervalMs?: number;
  playLabel?: string;
  pauseLabel?: string;
  /** Extra controls/legend rendered next to the playback bar. */
  aside?: ReactNode;
}

export function AnimatedAlgorithmView<S>({
  initial,
  step,
  render,
  onActiveLine,
  initialActive = [],
  onInteraction,
  intervalMs = 420,
  playLabel,
  pauseLabel,
  aside,
}: Props<S>) {
  const [frame, setFrame] = useState<AlgoFrame<S>>(() => ({
    state: initial(),
    active: initialActive,
    done: false,
  }));
  // Keep step/initial in refs so the tick closure never goes stale and callers
  // can pass inline functions without re-subscribing the interval.
  const stepRef = useRef(step);
  stepRef.current = step;
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const tick = useCallback(() => {
    setFrame((f) => {
      if (f.done) return f;
      const next = stepRef.current(f.state);
      return { state: next.state, active: next.active ?? [], done: next.done ?? false };
    });
  }, []);

  const playback = usePlayback({
    onTick: tick,
    isDone: () => frameRef.current.done === true,
    intervalMs,
  });

  // Emit AFTER commit (never during render) — this is the single place the
  // active line is reported, so no visualizer can re-introduce setState-in-render.
  const activeKey = (frame.active ?? []).join(",");
  useEffect(() => {
    if (frame.active && frame.active.length > 0) onActiveLine?.(frame.active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const interacted = useRef(false);
  const fireInteraction = () => {
    if (!interacted.current) {
      interacted.current = true;
      onInteraction?.();
    }
  };

  const reset = () => {
    playback.stop();
    setFrame({ state: initial(), active: initialActive, done: false });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {render(frame.state, { done: frame.done === true })}
      <div className="flex flex-col items-center gap-3">
        {aside}
        <PlaybackControls
          playing={playback.playing}
          onToggle={() => {
            fireInteraction();
            playback.toggle();
          }}
          onStep={() => {
            fireInteraction();
            playback.stepOnce();
          }}
          onReset={reset}
          atEnd={frame.done === true}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
        />
      </div>
    </div>
  );
}
