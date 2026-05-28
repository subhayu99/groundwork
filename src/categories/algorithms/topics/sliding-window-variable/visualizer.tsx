"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const S = "abracadabra";
const CELL = 38;
const GAP = 4;
const STRIDE = CELL + GAP;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function SlidingWindowVariableVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <NaiveScanViz />;
  if (step === 3) return <ManualWindowViz onInteraction={onWedgeInteraction} />;
  return <DerivedViz />;
}

function CharCells({
  s,
  inWindow,
  l,
  r,
}: {
  s: string;
  inWindow: Set<number>;
  l: number;
  r: number;
}) {
  return (
    <div className="relative" style={{ width: s.length * STRIDE }}>
      <div className="flex items-center gap-1 select-none">
        {Array.from(s).map((ch, i) => {
          const isIn = inWindow.has(i);
          return (
            <motion.div
              key={i}
              animate={{
                backgroundColor: isIn
                  ? "color-mix(in oklab, var(--accent-sky) 18%, var(--bg-card))"
                  : "var(--bg-card)",
                borderColor: isIn ? "var(--accent-line)" : "var(--line)",
                opacity: isIn ? 1 : 0.5,
              }}
              transition={{ duration: 0.22 }}
              className="rounded-md border-2 flex items-center justify-center font-mono text-base text-[var(--text)]"
              style={{ width: CELL, height: CELL }}
            >
              {ch}
            </motion.div>
          );
        })}
      </div>
      <motion.div animate={{ x: l * STRIDE + CELL / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
        <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">L</span>
      </motion.div>
      <motion.div animate={{ x: r * STRIDE + CELL / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
        <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">R</span>
      </motion.div>
    </div>
  );
}

/* Step 1-2 — naive enumeration of substrings */
function NaiveScanViz() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [checks, setChecks] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);
  const endRef = useRef(0);

  const stepForward = useCallback(() => {
    setChecks((c) => c + 1);
    const cs = startRef.current;
    const ce = endRef.current;
    if (ce + 1 < S.length) {
      endRef.current = ce + 1;
      setEnd(endRef.current);
    } else {
      startRef.current = cs + 1;
      endRef.current = startRef.current;
      if (startRef.current >= S.length) {
        setPlaying(false);
        return;
      }
      setStart(startRef.current);
      setEnd(endRef.current);
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 150);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    startRef.current = 0;
    endRef.current = 0;
    setStart(0);
    setEnd(0);
    setChecks(0);
    setPlaying(false);
  };

  const inWindow = new Set<number>();
  for (let i = start; i <= end; i++) inWindow.add(i);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the obvious way · every starting spot
      </div>
      <CharCells s={S} inWindow={inWindow} l={start} r={end} />
      <div className="flex flex-col items-center gap-3 mt-6">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          substring: <span className="text-[var(--text)]">&ldquo;{S.slice(start, end + 1)}&rdquo;</span>
          <span className="mx-3">·</span>
          checks: <span className="text-[var(--diff-med)]">{checks}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={() => setPlaying((p) => !p)} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
            {playing ? "Pause" : "Play through"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 3 — manual expand/contract */
function ManualWindowViz({ onInteraction }: { onInteraction?: () => void }) {
  const [l, setL] = useState(0);
  const [r, setR] = useState(0);

  const inWindow = new Set<number>();
  for (let i = l; i <= r; i++) inWindow.add(i);
  const substring = S.slice(l, r + 1);
  const isUnique = new Set(substring).size === substring.length;

  const expand = () => {
    onInteraction?.();
    setR((cur) => Math.min(S.length - 1, cur + 1));
  };
  const contract = () => {
    onInteraction?.();
    setL((cur) => Math.min(r, cur + 1));
  };
  const reset = () => {
    setL(0);
    setR(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        grow R · shrink L · keep it unique
      </div>
      <CharCells s={S} inWindow={inWindow} l={l} r={r} />
      <div className="flex flex-col items-center gap-3 mt-6">
        <div className="font-mono text-sm">
          &ldquo;<span className={isUnique ? "text-[var(--diff-easy)]" : "text-[var(--diff-hard)]"}>{substring}</span>&rdquo;
          <span className="mx-3 text-[var(--text-muted)]">·</span>
          length <span className="text-[var(--text)]">{r - l + 1}</span>
          <span className="ml-3 font-mono text-[10px]">
            {isUnique ? (
              <span className="text-[var(--diff-easy)]">unique ✓</span>
            ) : (
              <span className="text-[var(--diff-hard)]">has repeat ✗</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={contract} disabled={l >= r} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">
            contract L →
          </button>
          <button onClick={expand} disabled={r >= S.length - 1} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
            expand R →
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 4-7 — animated derived algorithm */
function DerivedViz() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(-1);
  const [best, setBest] = useState(0);
  const [bestRange, setBestRange] = useState<[number, number]>([0, 0]);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lRef = useRef(0);
  const rRef = useRef(-1);
  const seenRef = useRef<Record<string, number>>({});
  const bestRef = useRef(0);

  const stepForward = useCallback(() => {
    const nextR = rRef.current + 1;
    if (nextR >= S.length) {
      setDone(true);
      setPlaying(false);
      return;
    }
    const ch = S[nextR];
    const prev = seenRef.current[ch];
    if (prev !== undefined && prev >= lRef.current) {
      lRef.current = prev + 1;
      setL(lRef.current);
    }
    seenRef.current = { ...seenRef.current, [ch]: nextR };
    rRef.current = nextR;
    setR(nextR);
    setSeen({ ...seenRef.current });
    const len = nextR - lRef.current + 1;
    if (len > bestRef.current) {
      bestRef.current = len;
      setBest(len);
      setBestRange([lRef.current, nextR]);
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 650);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    lRef.current = 0;
    rRef.current = -1;
    seenRef.current = {};
    bestRef.current = 0;
    setL(0);
    setR(-1);
    setSeen({});
    setBest(0);
    setBestRange([0, 0]);
    setPlaying(false);
    setDone(false);
  };

  const inWindow = new Set<number>();
  if (r >= l) for (let i = l; i <= r; i++) inWindow.add(i);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the breathing window · longest stretch with no repeats
      </div>
      <CharCells s={S} inWindow={inWindow} l={l} r={Math.max(0, r)} />

      <div className="flex flex-col items-center gap-3 mt-6">
        <div className="font-mono text-sm flex items-center gap-3">
          <span>
            window: &ldquo;<span className="text-[var(--accent)]">{r >= l ? S.slice(l, r + 1) : ""}</span>&rdquo;
          </span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>
            best so far: <span className="text-[var(--diff-easy)]">{best}</span>
            {best > 0 && <span className="text-[var(--text-muted)]"> (&ldquo;{S.slice(bestRange[0], bestRange[1] + 1)}&rdquo;)</span>}
          </span>
        </div>

        <div className="font-mono text-[11px] text-[var(--text-muted)] max-w-[420px] text-center">
          last_seen: {Object.keys(seen).length === 0 ? "{}" : `{${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(", ")}}`}
        </div>

        {done && <div className="font-mono text-xs text-[var(--diff-easy)]">done · longest = {best}</div>}

        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={() => setPlaying((p) => !p)} disabled={done} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
            {playing ? "Pause" : "Play through"}
          </button>
          <button onClick={stepForward} disabled={done} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">→</button>
        </div>
      </div>
    </div>
  );
}
