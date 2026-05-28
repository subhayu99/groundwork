"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { WindowOverlay } from "@/shared/viz/WindowOverlay";
import { StatsPanel } from "@/shared/viz/StatsPanel";

const ARR = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const K = 3;
const CELL = 56;
const GAP = 8;

interface VisualizerProps {
  /** Current derivation step (1-7) controls which viz mode renders */
  step: number;
  /** Notified when user interacts with the window in Step 3 */
  onWedgeInteraction?: () => void;
}

export function SlidingWindowVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) {
    return <NaiveViz step={step} />;
  }
  if (step === 3) {
    return <WedgeViz onInteraction={onWedgeInteraction} />;
  }
  if (step >= 4 && step <= 6) {
    return <DerivedViz />;
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
  const maxStart = ARR.length - K;

  const stepForward = useCallback(() => {
    setStart((prev) => {
      if (prev >= maxStart) {
        setPlaying(false);
        return prev;
      }
      const next = prev + 1;
      const flash: number[] = [];
      for (let i = next; i < next + K; i++) flash.push(i);
      setRecompFlash(flash);
      setOps((o) => o + K);
      setTimeout(() => setRecompFlash([]), 520);
      return next;
    });
  }, [maxStart]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 900);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    setStart(0);
    setOps(K);
    setRecompFlash([]);
    setPlaying(false);
  };

  const highlighted = Array.from({ length: K }, (_, i) => start + i);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        naive · O(n·k)
      </div>
      {step === 2 && (
        <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
          Press play. Watch the same numbers get added over and over. Yellow flashes mark cells we&rsquo;re
          recomputing.
        </p>
      )}

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={highlighted} recomputedIndices={recompFlash} />
        <div className="absolute inset-0 pointer-events-none">
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
    setStart(newStart);
    onInteraction?.();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        drag the window
      </div>

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={highlighted} />
        <div className="absolute inset-0">
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

      <div className="font-mono text-sm text-[var(--text-muted)] mt-12">
        sum of cells {start}&ndash;{start + K - 1}:{" "}
        <span className="text-[var(--accent)]">
          {ARR.slice(start, start + K).reduce((a, b) => a + b, 0)}
        </span>
      </div>
    </div>
  );
}

/* Step 4-6 — derived: with naive ↔ derived toggle */
function DerivedViz() {
  const [mode, setMode] = useState<"naive" | "derived">("derived");
  const [start, setStart] = useState(0);
  const [windowSum, setWindowSum] = useState(ARR.slice(0, K).reduce((a, b) => a + b, 0));
  const [ops, setOps] = useState(K);
  const [entering, setEntering] = useState<number[]>([]);
  const [leaving, setLeaving] = useState<number[]>([]);
  const [recompFlash, setRecompFlash] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxStart = ARR.length - K;
  const isNaive = mode === "naive";

  const stepForward = useCallback(() => {
    setStart((prev) => {
      if (prev >= maxStart) {
        setPlaying(false);
        return prev;
      }
      const next = prev + 1;
      if (isNaive) {
        const flash: number[] = [];
        for (let i = next; i < next + K; i++) flash.push(i);
        setRecompFlash(flash);
        setWindowSum(ARR.slice(next, next + K).reduce((a, b) => a + b, 0));
        setOps((o) => o + K);
        setTimeout(() => setRecompFlash([]), 520);
      } else {
        const leavingIdx = prev;
        const enteringIdx = prev + K;
        setLeaving([leavingIdx]);
        setEntering([enteringIdx]);
        setWindowSum((s) => s - ARR[leavingIdx] + ARR[enteringIdx]);
        setOps((o) => o + 2);
        setTimeout(() => {
          setLeaving([]);
          setEntering([]);
        }, 520);
      }
      return next;
    });
  }, [maxStart, isNaive]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 900);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = useCallback(() => {
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
          naive · O(n·k)
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
          derived · O(n)
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
        <div className="absolute inset-0 pointer-events-none">
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
        Open the code drawer below to see the Python.
      </p>
      <ArrayViz values={ARR} />
    </div>
  );
}
