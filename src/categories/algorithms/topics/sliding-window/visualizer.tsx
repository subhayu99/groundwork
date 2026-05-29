"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { WindowOverlay } from "@/shared/viz/WindowOverlay";
import { StatsPanel } from "@/shared/viz/StatsPanel";

const ARR = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const K = 3;
const CELL = 56;
const GAP = 8;

// algorithm.py @sync labels for the final (sliding) algorithm — resolved to
// real line numbers at runtime, kept in sync with codeMaps["algorithms/sliding-window"].
const LINE_SLIDE_UPDATE = "slide"; // window_sum = window_sum - arr[i - k] + arr[i]
const LINE_RECORD = "record"; // results.append(window_sum)

interface VisualizerProps {
  /** Current derivation step (1-7) controls which viz mode renders */
  step: number;
  /** Notified when user interacts with the window in Step 3 */
  onWedgeInteraction?: () => void;
  /** Emits the algorithm.py line(s) the current animation maps to (final algorithm only) */
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function SlidingWindowVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) {
    return <NaiveViz step={step} />;
  }
  if (step === 3) {
    return <WedgeViz onInteraction={onWedgeInteraction} />;
  }
  if (step >= 4 && step <= 6) {
    return <DerivedViz onActiveLine={onActiveLine} />;
  }
  return <PatternViz />;
}

/* Step 2 — naive: highlight redundant additions */
function NaiveViz({ step }: { step: number }) {
  const [start, setStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ops, setOps] = useState(K);
  const [recompFlash, setRecompFlash] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxStart = ARR.length - K;

  // Side effects live outside any state-updater callback so React StrictMode's
  // double-invocation of updaters doesn't double-apply them.
  const stepForward = useCallback(() => {
    const cur = startRef.current;
    if (cur >= maxStart) {
      setPlaying(false);
      return;
    }
    const next = cur + 1;
    startRef.current = next;
    setStart(next);
    setOps((o) => o + K);
    const flash: number[] = [];
    for (let i = next; i < next + K; i++) flash.push(i);
    setRecompFlash(flash);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setRecompFlash([]), 520);
  }, [maxStart]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 900);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    startRef.current = 0;
    setStart(0);
    setOps(K);
    setRecompFlash([]);
    setPlaying(false);
  };

  const highlighted = Array.from({ length: K }, (_, i) => start + i);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the obvious way · re-adding everything
      </div>
      {step === 2 && (
        <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
          Press play. Watch the same numbers get added over and over. Yellow flashes mark cells we&rsquo;re
          recomputing.
        </p>
      )}

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={highlighted} recomputedIndices={recompFlash} />
        <div className="absolute inset-x-0 top-6 pointer-events-none">
          <WindowOverlay start={start} k={K} total={ARR.length} cellSize={CELL} cellGap={GAP} label={`window · k=${K}`} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">sum = </span>
          <span className="text-[var(--text)]">{ARR.slice(start, start + K).join(" + ")} = </span>
          <span className="text-[var(--accent)]">{ARR.slice(start, start + K).reduce((a, b) => a + b, 0)}</span>
        </div>

        <StatsPanel
          stats={[
            { label: "Window pos", value: `${start} / ${maxStart}` },
            { label: "Total additions", value: ops, emphasis: "warning" },
            { label: "This slide", value: start === 0 ? "—" : `+${K}`, emphasis: "warning" },
          ]}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
          >
            {playing ? "Pause" : "Play through"}
          </button>
          <button
            onClick={stepForward}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 3 — wedge: draggable window */
function WedgeViz({ onInteraction }: { onInteraction?: () => void }) {
  const [start, setStart] = useState(0);
  const maxStart = ARR.length - K;
  const highlighted = Array.from({ length: K }, (_, i) => start + i);

  const handleChange = (newStart: number) => {
    const clamped = Math.max(0, Math.min(maxStart, newStart));
    setStart(clamped);
    onInteraction?.();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        drag the window
      </div>

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={highlighted} />
        <div className="absolute inset-x-0 top-6">
          <WindowOverlay
            start={start}
            k={K}
            total={ARR.length}
            cellSize={CELL}
            cellGap={GAP}
            draggable
            onChange={handleChange}
            label={`window_sum  ${ARR.slice(start, start + K).reduce((a, b) => a + b, 0)}`}
          />
        </div>
      </div>

      {/* Touch-friendly step controls — move the window one cell at a time.
          Each press routes through handleChange (same path as drag), so the
          wedge gate opens on tap as well as on drag. */}
      <div className="flex items-center gap-3 mt-12">
        <button
          type="button"
          aria-label="Slide window left"
          disabled={start <= 0}
          onClick={() => handleChange(start - 1)}
          className="min-h-[44px] min-w-[44px] rounded-md font-mono text-sm border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ◀
        </button>
        <span className="font-mono text-xs text-[var(--text-faint)] select-none">
          slide
        </span>
        <button
          type="button"
          aria-label="Slide window right"
          disabled={start >= maxStart}
          onClick={() => handleChange(start + 1)}
          className="min-h-[44px] min-w-[44px] rounded-md font-mono text-sm border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶
        </button>
      </div>

      <div className="font-mono text-sm text-[var(--text-muted)]">
        sum of cells {start}&ndash;{start + K - 1}:{" "}
        <span className="text-[var(--accent)]">
          {ARR.slice(start, start + K).reduce((a, b) => a + b, 0)}
        </span>
      </div>
    </div>
  );
}

/* Step 4-6 — derived: with naive ↔ derived toggle */
function DerivedViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const [mode, setMode] = useState<"naive" | "derived">("derived");
  const [start, setStart] = useState(0);
  const [windowSum, setWindowSum] = useState(ARR.slice(0, K).reduce((a, b) => a + b, 0));
  const [ops, setOps] = useState(K);
  const [entering, setEntering] = useState<number[]>([]);
  const [leaving, setLeaving] = useState<number[]>([]);
  const [recompFlash, setRecompFlash] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxStart = ARR.length - K;
  const isNaive = mode === "naive";

  // Side effects live outside any state-updater callback so React StrictMode's
  // double-invocation of updaters doesn't double-apply them.
  const stepForward = useCallback(() => {
    const cur = startRef.current;
    if (cur >= maxStart) {
      setPlaying(false);
      return;
    }
    const next = cur + 1;
    startRef.current = next;
    setStart(next);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    if (isNaive) {
      const flash: number[] = [];
      for (let i = next; i < next + K; i++) flash.push(i);
      setRecompFlash(flash);
      setWindowSum(ARR.slice(next, next + K).reduce((a, b) => a + b, 0));
      setOps((o) => o + K);
      flashTimeoutRef.current = setTimeout(() => setRecompFlash([]), 520);
    } else {
      const leavingIdx = cur;
      const enteringIdx = cur + K;
      setLeaving([leavingIdx]);
      setEntering([enteringIdx]);
      setWindowSum((s) => s - ARR[leavingIdx] + ARR[enteringIdx]);
      setOps((o) => o + 2);
      // Final-algorithm slide: subtract leaver + add newcomer (line 14), then record (line 15).
      onActiveLine?.([LINE_SLIDE_UPDATE, LINE_RECORD]);
      flashTimeoutRef.current = setTimeout(() => {
        setLeaving([]);
        setEntering([]);
      }, 520);
    }
  }, [maxStart, isNaive, onActiveLine]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 900);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = useCallback(() => {
    startRef.current = 0;
    setStart(0);
    setWindowSum(ARR.slice(0, K).reduce((a, b) => a + b, 0));
    setOps(K);
    setEntering([]);
    setLeaving([]);
    setRecompFlash([]);
    setPlaying(false);
  }, []);

  // Reset when switching modes so the counter comparison is clean
  const switchMode = (next: "naive" | "derived") => {
    setMode(next);
    startRef.current = 0;
    setStart(0);
    setWindowSum(ARR.slice(0, K).reduce((a, b) => a + b, 0));
    setOps(K);
    setEntering([]);
    setLeaving([]);
    setRecompFlash([]);
    setPlaying(false);
  };

  const highlighted = Array.from({ length: K }, (_, i) => start + i);
  const perSlide = start === 0 ? "—" : isNaive ? `+${K}` : "+2";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        <button
          onClick={() => switchMode("naive")}
          className={`px-2 py-1 rounded-md transition-colors ${
            isNaive
              ? "text-[var(--diff-med)] border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)]"
              : "text-[var(--text-faint)] border border-[var(--line)] hover:text-[var(--text-muted)]"
          }`}
        >
          the obvious way · re-adding everything
        </button>
        <span>↔</span>
        <button
          onClick={() => switchMode("derived")}
          className={`px-2 py-1 rounded-md transition-colors ${
            !isNaive
              ? "text-[var(--diff-easy)] border border-[color-mix(in_oklab,var(--diff-easy)_50%,transparent)] bg-[color-mix(in_oklab,var(--diff-easy)_12%,transparent)]"
              : "text-[var(--text-faint)] border border-[var(--line)] hover:text-[var(--text-muted)]"
          }`}
        >
          the wedge way · two ops per slide
        </button>
      </div>

      <div className="relative pt-6">
        <ArrayViz
          values={ARR}
          highlightedIndices={highlighted}
          enteringIndices={entering}
          leavingIndices={leaving}
          recomputedIndices={recompFlash}
        />
        <div className="absolute inset-x-0 top-6 pointer-events-none">
          <WindowOverlay start={start} k={K} total={ARR.length} cellSize={CELL} cellGap={GAP} label={`window_sum  ${windowSum}`} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <StatsPanel
          stats={[
            { label: "Window pos", value: `${start} / ${maxStart}` },
            { label: "Total ops", value: ops, emphasis: isNaive ? "warning" : "good" },
            { label: "This slide", value: perSlide, emphasis: isNaive ? "warning" : "good" },
          ]}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
          >
            {playing ? "Pause" : "Play through"}
          </button>
          <button
            onClick={stepForward}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 6-7 — pattern: static view with full array highlighted */
function PatternViz() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        pattern · sliding window
      </div>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        Open the Code panel to see the Python.
      </p>
      <ArrayViz values={ARR} />
    </div>
  );
}
