"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";
import { useIsMobile } from "@/shared/layout/useIsMobile";

const S = "abracadabra";
const CELL = 38;
const GAP = 4;

/* @sync labels — resolved against algorithm.py (single source of truth).
 * Grouped by the operation a frame performs so consecutive frames emit
 * DIFFERENT label sets and the live highlight marches per-op. */
const LINE_EXPAND = ["expand"]; // for right, ch in enumerate(s) — right edge advances
const LINE_SHRINK = ["check", "contract"]; // repeat inside window → jump left past it
const LINE_BEST = ["record", "update"]; // last_seen[ch] = right; best = max(...)

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function SlidingWindowVariableVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <NaiveScanViz />;
  if (step === 3) return <ManualWindowViz onInteraction={onWedgeInteraction} />;
  return <DerivedViz onActiveLine={onActiveLine} />;
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
  const isMobile = useIsMobile();
  const cell = isMobile ? 24 : CELL;
  const gap = isMobile ? 3 : GAP;
  const stride = cell + gap;
  return (
    <div className="relative" style={{ width: s.length * stride }}>
      <div className="flex items-center select-none" style={{ gap }}>
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
              className="rounded-md border-2 flex items-center justify-center font-mono text-[var(--text)]"
              style={{ width: cell, height: cell, fontSize: Math.round(cell * 0.42) }}
            >
              {ch}
            </motion.div>
          );
        })}
      </div>
      <motion.div animate={{ x: l * stride + cell / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
        <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">L</span>
      </motion.div>
      <motion.div animate={{ x: r * stride + cell / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
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
        pb.stop();
        return;
      }
      setStart(startRef.current);
      setEnd(endRef.current);
    }
  }, []);

  const pb = usePlayback({ onTick: () => stepForward(), intervalMs: 150 });

  const reset = () => {
    startRef.current = 0;
    endRef.current = 0;
    setStart(0);
    setEnd(0);
    setChecks(0);
    pb.stop();
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
        <PlaybackControls playing={pb.playing} onToggle={pb.toggle} onReset={reset} playLabel="Play through" />
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
interface SWState {
  l: number;
  r: number;
  seen: Record<string, number>;
  best: number;
  bestRange: [number, number];
}

function DerivedViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const initial = (): SWState => ({ l: 0, r: -1, seen: {}, best: 0, bestRange: [0, 0] });

  // Pure reducer: advance the right pointer one char per frame. The `active`
  // labels it returns depend on the operation taken this frame (expand vs
  // contract vs record/update), so consecutive frames emit DIFFERENT labels
  // and the live highlight marches (fixes the frozen trio).
  const step = (s: SWState): AlgoFrame<SWState> => {
    const nextR = s.r + 1;
    if (nextR >= S.length) return { state: s, done: true };

    const ch = S[nextR];
    const prev = s.seen[ch];

    // Repeat inside the window → contract: jump left past the previous occurrence.
    if (prev !== undefined && prev >= s.l) {
      return {
        state: { ...s, l: prev + 1 },
        active: LINE_SHRINK,
      };
    }

    // No contraction needed this frame → expand the right edge,
    // record last_seen, and update best.
    const seen = { ...s.seen, [ch]: nextR };
    const len = nextR - s.l + 1;
    if (len > s.best) {
      return {
        state: { ...s, r: nextR, seen, best: len, bestRange: [s.l, nextR] },
        active: LINE_BEST,
      };
    }
    return {
      state: { ...s, r: nextR, seen },
      active: LINE_EXPAND,
    };
  };

  return (
    <AnimatedAlgorithmView<SWState>
      initial={initial}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={LINE_EXPAND}
      intervalMs={650}
      playLabel="Play through"
      render={({ l, r, seen, best, bestRange }, { done }) => {
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

              <div className="font-mono text-[11px] text-[var(--text-muted)] max-w-full md:max-w-[420px] text-center break-all md:break-normal">
                last_seen: {Object.keys(seen).length === 0 ? "{}" : `{${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(", ")}}`}
              </div>

              {done && <div className="font-mono text-xs text-[var(--diff-easy)]">done · longest = {best}</div>}
            </div>
          </div>
        );
      }}
    />
  );
}
