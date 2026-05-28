"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TEMPS = [73, 74, 75, 71, 69, 72, 76, 73];
const CELL = 44;
const GAP = 6;
const STRIDE = CELL + GAP;
const MIN_T = 65;
const MAX_T = 78;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function MonotonicStackVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <NaiveScanViz />;
  if (step === 3) return <ManualWalkViz onInteraction={onWedgeInteraction} />;
  return <DerivedViz />;
}

function barHeight(t: number): number {
  const norm = (t - MIN_T) / (MAX_T - MIN_T);
  return 32 + norm * 80;
}

function TempBar({
  t,
  i,
  state,
}: {
  t: number;
  i: number;
  state: "idle" | "active" | "waiting" | "answered" | "compare";
}) {
  const h = barHeight(t);
  const bg =
    state === "active"
      ? "color-mix(in oklab, var(--accent-sky) 28%, var(--bg-card))"
      : state === "waiting"
      ? "color-mix(in oklab, var(--diff-med) 22%, var(--bg-card))"
      : state === "answered"
      ? "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))"
      : state === "compare"
      ? "color-mix(in oklab, var(--diff-hard) 22%, var(--bg-card))"
      : "var(--bg-card)";
  const border =
    state === "active"
      ? "var(--accent-line)"
      : state === "waiting"
      ? "var(--diff-med)"
      : state === "answered"
      ? "var(--diff-easy)"
      : state === "compare"
      ? "var(--diff-hard)"
      : "var(--line)";
  return (
    <div className="flex flex-col items-center" style={{ width: CELL }}>
      <motion.div
        animate={{ height: h, backgroundColor: bg, borderColor: border }}
        transition={{ duration: 0.2 }}
        className="rounded-md border-2 flex items-end justify-center font-mono text-[10px] text-[var(--text-muted)] pb-1"
        style={{ width: CELL }}
      >
        {t}&deg;
      </motion.div>
      <span className="font-mono text-[9px] text-[var(--text-faint)] mt-1">{i}</span>
    </div>
  );
}

/* Steps 1-2 — naive nested scan */
function NaiveScanViz() {
  const [base, setBase] = useState(0);
  const [probe, setProbe] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [playing, setPlaying] = useState(false);
  const baseRef = useRef(0);
  const probeRef = useRef(0);

  const stepForward = useCallback(() => {
    const b = baseRef.current;
    const p = probeRef.current;
    if (b >= TEMPS.length) {
      setPlaying(false);
      return;
    }
    setComparisons((c) => c + 1);
    if (p < TEMPS.length && TEMPS[p] <= TEMPS[b]) {
      probeRef.current = p + 1;
      setProbe(probeRef.current);
      return;
    }
    // Found warmer or fell off end. Move base forward.
    baseRef.current = b + 1;
    probeRef.current = baseRef.current + 1;
    setBase(baseRef.current);
    setProbe(probeRef.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(stepForward, 220);
    return () => clearInterval(id);
  }, [playing, stepForward]);

  const reset = () => {
    baseRef.current = 0;
    probeRef.current = 0;
    setBase(0);
    setProbe(0);
    setComparisons(0);
    setPlaying(false);
  };

  const done = base >= TEMPS.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        naive scan · re-check every later day
      </div>
      <div className="flex items-end gap-1.5">
        {TEMPS.map((t, i) => (
          <TempBar
            key={i}
            t={t}
            i={i}
            state={
              done
                ? "idle"
                : i === base
                ? "active"
                : i === probe && !done
                ? "compare"
                : "idle"
            }
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          base = <span className="text-[var(--accent)]">{Math.min(base, TEMPS.length - 1)}</span>
          <span className="mx-3">·</span>
          probe = <span className="text-[var(--accent)]">{Math.min(probe, TEMPS.length - 1)}</span>
          <span className="mx-3">·</span>
          comparisons: <span className="text-[var(--diff-med)]">{comparisons}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={done}
            className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40"
          >
            {playing ? "Pause" : "Play through"}
          </button>
          <button
            onClick={stepForward}
            disabled={done}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

interface Snapshot {
  i: number;
  stack: number[];
  answer: (number | null)[];
  popsThisStep: number;
}

function emptyAnswer(): (number | null)[] {
  return TEMPS.map(() => null);
}

function stepOne(prev: Snapshot): Snapshot {
  const i = prev.i;
  if (i >= TEMPS.length) return prev;
  const stack = [...prev.stack];
  const answer = [...prev.answer];
  let pops = 0;
  while (stack.length && TEMPS[stack[stack.length - 1]] < TEMPS[i]) {
    const j = stack.pop()!;
    answer[j] = i - j;
    pops++;
  }
  stack.push(i);
  return { i: i + 1, stack, answer, popsThisStep: pops };
}

function StackPanel({ stack, popsThisStep }: { stack: number[]; popsThisStep: number }) {
  return (
    <div className="flex flex-col items-center gap-2 w-[260px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        stack of waiting days
      </div>
      <div className="flex flex-col-reverse items-stretch gap-1 min-h-[120px] border border-dashed border-[var(--line)] rounded-md p-2 w-full">
        {stack.length === 0 && (
          <span className="text-[10px] font-mono text-[var(--text-faint)] text-center py-3">
            empty
          </span>
        )}
        {stack.map((idx) => (
          <motion.div
            key={`${idx}-${stack.length}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-md border border-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_18%,var(--bg-card))] px-2 py-1 font-mono text-xs text-[var(--text)] flex items-center justify-between"
          >
            <span>day {idx}</span>
            <span className="text-[var(--text-muted)]">{TEMPS[idx]}&deg;</span>
          </motion.div>
        ))}
      </div>
      <div className="font-mono text-[10px] text-[var(--text-faint)]">
        pops this step: <span className="text-[var(--diff-easy)]">{popsThisStep}</span>
      </div>
    </div>
  );
}

function AnswerRow({ answer }: { answer: (number | null)[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {answer.map((a, i) => (
        <div
          key={i}
          className="rounded-md border border-[var(--line)] flex items-center justify-center font-mono text-xs"
          style={{
            width: CELL,
            height: 28,
            color: a === null ? "var(--text-faint)" : "var(--diff-easy)",
            backgroundColor:
              a === null
                ? "var(--bg-card)"
                : "color-mix(in oklab, var(--diff-easy) 14%, var(--bg-card))",
          }}
        >
          {a ?? "·"}
        </div>
      ))}
    </div>
  );
}

/* Step 3 — manual step-through */
function ManualWalkViz({ onInteraction }: { onInteraction?: () => void }) {
  const [snap, setSnap] = useState<Snapshot>({
    i: 0,
    stack: [],
    answer: emptyAnswer(),
    popsThisStep: 0,
  });

  const next = () => {
    onInteraction?.();
    setSnap((cur) => stepOne(cur));
  };
  const reset = () => {
    setSnap({ i: 0, stack: [], answer: emptyAnswer(), popsThisStep: 0 });
  };

  const activeIdx = Math.min(snap.i, TEMPS.length - 1);
  const done = snap.i >= TEMPS.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        send each day. let the stack drain.
      </div>
      <div className="flex items-end gap-1.5">
        {TEMPS.map((t, i) => {
          let state: "idle" | "active" | "waiting" | "answered" | "compare" = "idle";
          if (!done && i === activeIdx) state = "active";
          else if (snap.stack.includes(i)) state = "waiting";
          else if (snap.answer[i] !== null) state = "answered";
          return <TempBar key={i} t={t} i={i} state={state} />;
        })}
      </div>
      <AnswerRow answer={snap.answer} />
      <div className="flex flex-row gap-6 items-start">
        <StackPanel stack={snap.stack} popsThisStep={snap.popsThisStep} />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
        >
          ↺
        </button>
        <button
          onClick={next}
          disabled={done}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40"
        >
          {done ? "done" : `send day ${activeIdx}`}
        </button>
      </div>
    </div>
  );
}

/* Steps 4-7 — auto-play */
function DerivedViz() {
  const [snap, setSnap] = useState<Snapshot>({
    i: 0,
    stack: [],
    answer: emptyAnswer(),
    popsThisStep: 0,
  });
  const [playing, setPlaying] = useState(false);
  const [totalOps, setTotalOps] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setSnap((cur) => {
        if (cur.i >= TEMPS.length) {
          setPlaying(false);
          return cur;
        }
        const next = stepOne(cur);
        // count: one push always, plus pops
        setTotalOps((ops) => ops + 1 + next.popsThisStep);
        return next;
      });
    }, 550);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setSnap({ i: 0, stack: [], answer: emptyAnswer(), popsThisStep: 0 });
    setTotalOps(0);
    setPlaying(false);
  };

  const activeIdx = Math.min(snap.i, TEMPS.length - 1);
  const done = snap.i >= TEMPS.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        one pass · stack grows and drains
      </div>
      <div className="flex items-end gap-1.5">
        {TEMPS.map((t, i) => {
          let state: "idle" | "active" | "waiting" | "answered" | "compare" = "idle";
          if (!done && i === activeIdx) state = "active";
          else if (snap.stack.includes(i)) state = "waiting";
          else if (snap.answer[i] !== null) state = "answered";
          return <TempBar key={i} t={t} i={i} state={state} />;
        })}
      </div>
      <AnswerRow answer={snap.answer} />
      <StackPanel stack={snap.stack} popsThisStep={snap.popsThisStep} />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        total pushes + pops:{" "}
        <span className="text-[var(--diff-easy)]">{totalOps}</span>
        <span className="mx-3">·</span>
        cap: <span className="text-[var(--diff-easy)]">{2 * TEMPS.length}</span>
        {done && <span className="text-[var(--diff-easy)] ml-3">✓ done</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
        >
          ↺
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={done}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40"
        >
          {playing ? "Pause" : "Play through"}
        </button>
      </div>
    </div>
  );
}
