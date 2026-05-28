"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { StatsPanel } from "@/shared/viz/StatsPanel";

const ARR = [1, 3, 5, 7, 9, 10, 12, 15, 18, 20];
const TARGET = 17;
const CELL = 56;
const GAP = 8;
const STRIDE = CELL + GAP;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function TwoPointersVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <NaiveViz />;
  if (step === 3) return <WedgeViz onInteraction={onWedgeInteraction} />;
  return <DerivedViz />;
}

/* Step 2 — naive: show every pair being checked */
function NaiveViz() {
  const [i, setI] = useState(0);
  const [j, setJ] = useState(1);
  const [comparisons, setComparisons] = useState(0);
  const [found, setFound] = useState<{ i: number; j: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iRef = useRef(0);
  const jRef = useRef(1);

  const stepForward = useCallback(() => {
    if (found) return;
    const ci = iRef.current;
    const cj = jRef.current;
    if (ci >= ARR.length - 1) {
      setPlaying(false);
      return;
    }
    const sum = ARR[ci] + ARR[cj];
    setComparisons((c) => c + 1);
    if (sum === TARGET) {
      setFound({ i: ci, j: cj });
      setPlaying(false);
      return;
    }
    // advance j; when j reaches end, reset to i+2
    if (cj + 1 >= ARR.length) {
      iRef.current = ci + 1;
      jRef.current = ci + 2;
    } else {
      jRef.current = cj + 1;
    }
    setI(iRef.current);
    setJ(jRef.current);
  }, [found]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 300);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    iRef.current = 0;
    jRef.current = 1;
    setI(0);
    setJ(1);
    setComparisons(0);
    setFound(null);
    setPlaying(false);
  };

  const highlighted = found ? [found.i, found.j] : [i, j];
  const sum = found ? ARR[found.i] + ARR[found.j] : ARR[i] + ARR[j];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        naive · O(n²)
      </div>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        Target: <span className="text-[var(--accent)] font-mono">{TARGET}</span>. Watch every pair
        get checked one by one.
      </p>

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={highlighted} />
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">{ARR[i]} + {ARR[j]} = </span>
          <span
            className={
              found
                ? "text-[var(--diff-easy)]"
                : sum < TARGET
                ? "text-[var(--text)]"
                : "text-[var(--diff-hard)]"
            }
          >
            {sum}
          </span>
          {found && <span className="text-[var(--diff-easy)] ml-2">✓ found</span>}
        </div>

        <StatsPanel
          stats={[
            { label: "Pair", value: `(${i}, ${j})` },
            { label: "Comparisons", value: comparisons, emphasis: "warning" },
          ]}
        />

        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={() => setPlaying((p) => !p)} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
            {playing ? "Pause" : "Play through"}
          </button>
          <button onClick={stepForward} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">→</button>
        </div>
      </div>
    </div>
  );
}

/* Step 3 — wedge: interactive two pointers */
function WedgeViz({ onInteraction }: { onInteraction?: () => void }) {
  const [l, setL] = useState(0);
  const [r, setR] = useState(ARR.length - 1);

  const moveL = (dir: 1 | -1) => {
    setL((cur) => {
      const next = Math.max(0, Math.min(r - 1, cur + dir));
      onInteraction?.();
      return next;
    });
  };
  const moveR = (dir: 1 | -1) => {
    setR((cur) => {
      const next = Math.min(ARR.length - 1, Math.max(l + 1, cur + dir));
      onInteraction?.();
      return next;
    });
  };

  const sum = ARR[l] + ARR[r];
  const verdict =
    sum === TARGET ? "match" : sum < TARGET ? "too small" : "too big";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        move the pointers · target {TARGET}
      </div>

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={[l, r]} />
        <Pointer index={l} label="L" />
        <Pointer index={r} label="R" />
      </div>

      <div className="flex flex-col items-center gap-4 mt-16">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">arr[L] + arr[R] = </span>
          <span className="text-[var(--text)]">{ARR[l]} + {ARR[r]} = </span>
          <span
            className={
              sum === TARGET
                ? "text-[var(--diff-easy)]"
                : sum < TARGET
                ? "text-[var(--accent-sky)]"
                : "text-[var(--diff-hard)]"
            }
          >
            {sum}
          </span>
          <span className="ml-2 text-[var(--text-faint)]">({verdict})</span>
        </div>

        <div className="flex items-center gap-6">
          <PointerControls label="L" onLeft={() => moveL(-1)} onRight={() => moveL(1)} disabledLeft={l === 0} disabledRight={l + 1 >= r} />
          <PointerControls label="R" onLeft={() => moveR(-1)} onRight={() => moveR(1)} disabledLeft={r - 1 <= l} disabledRight={r === ARR.length - 1} />
        </div>
      </div>
    </div>
  );
}

/* Step 4-7 — derived: run the algorithm */
function DerivedViz() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(ARR.length - 1);
  const [comparisons, setComparisons] = useState(0);
  const [found, setFound] = useState(false);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lRef = useRef(0);
  const rRef = useRef(ARR.length - 1);

  const stepForward = useCallback(() => {
    if (found) return;
    const cl = lRef.current;
    const cr = rRef.current;
    if (cl >= cr) {
      setPlaying(false);
      return;
    }
    const sum = ARR[cl] + ARR[cr];
    setComparisons((c) => c + 1);
    if (sum === TARGET) {
      setFound(true);
      setPlaying(false);
      return;
    }
    if (sum < TARGET) {
      lRef.current = cl + 1;
    } else {
      rRef.current = cr - 1;
    }
    setL(lRef.current);
    setR(rRef.current);
  }, [found]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 700);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    lRef.current = 0;
    rRef.current = ARR.length - 1;
    setL(0);
    setR(ARR.length - 1);
    setComparisons(0);
    setFound(false);
    setPlaying(false);
  };

  const sum = ARR[l] + ARR[r];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        derived · O(n) · target {TARGET}
      </div>

      <div className="relative pt-6">
        <ArrayViz values={ARR} highlightedIndices={[l, r]} />
        <Pointer index={l} label="L" />
        <Pointer index={r} label="R" />
      </div>

      <div className="flex flex-col items-center gap-4 mt-16">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">{ARR[l]} + {ARR[r]} = </span>
          <span
            className={
              found || sum === TARGET
                ? "text-[var(--diff-easy)]"
                : sum < TARGET
                ? "text-[var(--accent-sky)]"
                : "text-[var(--diff-hard)]"
            }
          >
            {sum}
          </span>
          {found && <span className="text-[var(--diff-easy)] ml-2">✓ found</span>}
        </div>

        <StatsPanel
          stats={[
            { label: "L / R", value: `${l} / ${r}` },
            { label: "Comparisons", value: comparisons, emphasis: "good" },
          ]}
        />

        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={() => setPlaying((p) => !p)} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
            {playing ? "Pause" : "Play through"}
          </button>
          <button onClick={stepForward} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">→</button>
        </div>
      </div>
    </div>
  );
}

function Pointer({ index, label }: { index: number; label: string }) {
  const x = index * STRIDE + CELL / 2;
  return (
    <motion.div
      animate={{ x }}
      transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
      className="absolute top-full pt-2 -translate-x-1/2 pointer-events-none"
      style={{ left: 0 }}
    >
      <div className="flex flex-col items-center">
        <span className="text-[var(--accent)] text-lg">↑</span>
        <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">{label}</span>
      </div>
    </motion.div>
  );
}

function PointerControls({
  label,
  onLeft,
  onRight,
  disabledLeft,
  disabledRight,
}: {
  label: string;
  onLeft: () => void;
  onRight: () => void;
  disabledLeft: boolean;
  disabledRight: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-[var(--text-muted)] mr-1">{label}</span>
      <button onClick={onLeft} disabled={disabledLeft} className="px-2 py-1 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed">←</button>
      <button onClick={onRight} disabled={disabledRight} className="px-2 py-1 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed">→</button>
    </div>
  );
}
