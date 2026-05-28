"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const ARR = [5, 2, 4, 7, 1, 3, 8, 6];
const CARD = 38;
const GAP = 4;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function MergesortVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <NaiveSwapViz />;
  if (step === 3) return <SplitMergeViz onInteraction={onWedgeInteraction} />;
  return <AutoMergesortViz />;
}

function Card({
  value,
  state,
}: {
  value: number;
  state: "idle" | "active" | "sorted" | "compare";
}) {
  const bg =
    state === "active"
      ? "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))"
      : state === "sorted"
      ? "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))"
      : state === "compare"
      ? "color-mix(in oklab, var(--diff-med) 24%, var(--bg-card))"
      : "var(--bg-card)";
  const border =
    state === "active"
      ? "var(--accent-line)"
      : state === "sorted"
      ? "var(--diff-easy)"
      : state === "compare"
      ? "var(--diff-med)"
      : "var(--line)";
  return (
    <motion.div
      animate={{ backgroundColor: bg, borderColor: border }}
      transition={{ duration: 0.16 }}
      className="rounded-md border-2 flex items-center justify-center font-mono text-sm"
      style={{ width: CARD, height: CARD, color: "var(--text)" }}
    >
      {value}
    </motion.div>
  );
}

/* Steps 1-2 — naive bubble sort */
function NaiveSwapViz() {
  const [arr, setArr] = useState<number[]>([...ARR]);
  const [iIdx, setIIdx] = useState(-1);
  const [swaps, setSwaps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pass, setPass] = useState(0);
  const [done, setDone] = useState(false);

  const stepForward = () => {
    if (done) return;
    setArr((cur) => {
      const next = [...cur];
      let i = iIdx + 1;
      if (i >= next.length - 1 - pass) {
        // End of this pass.
        if (pass + 1 >= next.length - 1) {
          setDone(true);
          setPlaying(false);
          setIIdx(-1);
          return next;
        }
        setPass(pass + 1);
        setIIdx(-1);
        return next;
      }
      setIIdx(i);
      if (next[i] > next[i + 1]) {
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        setSwaps((s) => s + 1);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(stepForward, 120);
    return () => clearInterval(id);
  }, [playing, iIdx, pass, done]);

  const reset = () => {
    setArr([...ARR]);
    setIIdx(-1);
    setSwaps(0);
    setPlaying(false);
    setPass(0);
    setDone(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        bubble sort · swap one neighbour at a time
      </div>
      <div className="flex gap-1">
        {arr.map((v, i) => (
          <Card
            key={i}
            value={v}
            state={done ? "sorted" : i === iIdx || i === iIdx + 1 ? "compare" : "idle"}
          />
        ))}
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        swaps so far: <span className="text-[var(--diff-med)]">{swaps}</span>
        <span className="mx-3">·</span>
        pass: <span className="text-[var(--text)]">{pass}</span>
        {done && <span className="text-[var(--diff-easy)] ml-3">✓ sorted</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={done} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
          {playing ? "Pause" : "Play through"}
        </button>
      </div>
    </div>
  );
}

interface Segment {
  values: number[];
  sorted: boolean;
}

function startSegments(): Segment[] {
  return [{ values: [...ARR], sorted: false }];
}

function splitAll(segs: Segment[]): Segment[] {
  const next: Segment[] = [];
  for (const s of segs) {
    if (s.values.length <= 1) {
      next.push({ ...s, sorted: true });
      continue;
    }
    const mid = Math.floor(s.values.length / 2);
    next.push({ values: s.values.slice(0, mid), sorted: false });
    next.push({ values: s.values.slice(mid), sorted: false });
  }
  return next;
}

function mergeOneLevel(segs: Segment[]): Segment[] {
  // Pair up adjacent segments and merge them, but only if both are sorted
  // and could plausibly have come from the same original split.
  if (segs.length === 1) return segs;
  const next: Segment[] = [];
  for (let i = 0; i < segs.length; i += 2) {
    if (i + 1 >= segs.length) {
      next.push(segs[i]);
      continue;
    }
    const a = segs[i].values;
    const b = segs[i + 1].values;
    const out: number[] = [];
    let p = 0, q = 0;
    while (p < a.length && q < b.length) {
      if (a[p] <= b[q]) out.push(a[p++]);
      else out.push(b[q++]);
    }
    while (p < a.length) out.push(a[p++]);
    while (q < b.length) out.push(b[q++]);
    next.push({ values: out, sorted: true });
  }
  return next;
}

function allAtomic(segs: Segment[]): boolean {
  return segs.every((s) => s.values.length <= 1);
}

function SegmentRow({ segs }: { segs: Segment[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {segs.map((s, i) => (
        <div key={i} className="flex gap-1">
          {s.values.map((v, j) => (
            <Card key={j} value={v} state={s.sorted ? "sorted" : "idle"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Step 3 — manual split/merge */
function SplitMergeViz({ onInteraction }: { onInteraction?: () => void }) {
  const [segs, setSegs] = useState<Segment[]>(startSegments());
  const [phase, setPhase] = useState<"splitting" | "merging">("splitting");

  const doSplit = () => {
    onInteraction?.();
    setSegs((cur) => {
      const next = splitAll(cur);
      if (allAtomic(next)) setPhase("merging");
      return next;
    });
  };

  const doMerge = () => {
    onInteraction?.();
    setSegs((cur) => mergeOneLevel(cur));
  };

  const reset = () => {
    setSegs(startSegments());
    setPhase("splitting");
  };

  const fullyMerged = segs.length === 1 && segs[0].sorted;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        split until atomic · merge back up
      </div>
      <SegmentRow segs={segs} />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        segments: <span className="text-[var(--accent)]">{segs.length}</span>
        <span className="mx-3">·</span>
        phase: <span className="text-[var(--text)]">{phase}</span>
        {fullyMerged && <span className="text-[var(--diff-easy)] ml-3">✓ sorted</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        {phase === "splitting" ? (
          <button onClick={doSplit} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
            split →
          </button>
        ) : (
          <button onClick={doMerge} disabled={fullyMerged} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
            merge →
          </button>
        )}
      </div>
    </div>
  );
}

/* Steps 4-7 — autoplay split-all-the-way-down then merge-all-the-way-up */
function AutoMergesortViz() {
  const [history, setHistory] = useState<Segment[][]>([startSegments()]);
  const [phase, setPhase] = useState<"splitting" | "merging" | "done">("splitting");
  const [playing, setPlaying] = useState(false);

  const advance = () => {
    setHistory((h) => {
      const cur = h[h.length - 1];
      if (phase === "splitting") {
        const next = splitAll(cur);
        if (allAtomic(next)) setPhase("merging");
        return [...h, next];
      }
      if (phase === "merging") {
        const next = mergeOneLevel(cur);
        if (next.length === 1 && next[0].sorted) setPhase("done");
        return [...h, next];
      }
      return h;
    });
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (phase === "done") {
        setPlaying(false);
        return;
      }
      advance();
    }, 620);
    return () => clearInterval(id);
  }, [playing, phase]);

  const reset = () => {
    setHistory([startSegments()]);
    setPhase("splitting");
    setPlaying(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        each level is a snapshot · split down, merge up
      </div>
      <div className="flex flex-col gap-2 items-center max-h-[280px] overflow-auto">
        {history.map((row, idx) => (
          <div
            key={idx}
            className="opacity-100 transition-opacity"
            style={{ opacity: idx === history.length - 1 ? 1 : 0.5 }}
          >
            <SegmentRow segs={row} />
          </div>
        ))}
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        levels seen: <span className="text-[var(--accent)]">{history.length}</span>
        <span className="mx-3">·</span>
        phase: <span className="text-[var(--text)]">{phase}</span>
        {phase === "done" && <span className="text-[var(--diff-easy)] ml-3">✓ sorted</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={phase === "done"} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
          {playing ? "Pause" : "Play through"}
        </button>
        <button onClick={advance} disabled={phase === "done"} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">→</button>
      </div>
    </div>
  );
}
