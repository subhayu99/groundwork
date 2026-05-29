"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { StatsPanel } from "@/shared/viz/StatsPanel";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";
import { useIsMobile } from "@/shared/layout/useIsMobile";

const ARR = [3, 7, 11, 14, 19, 23, 27, 32, 38, 44, 51, 59, 68, 74, 81];
const TARGET = 27;

/* @sync labels — resolved against algorithm.py (single source of truth) */
const LINE_MID = "mid";
const LINE_COMPARE_RETURN = ["compare", "found"];
const LINE_LO_UPDATE = ["less", "lo_update"];
const LINE_HI_UPDATE = ["greater", "hi_update"];

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function BinarySearchVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <LinearScanViz />;
  if (step === 3) return <ClickToHalveViz onInteraction={onWedgeInteraction} onActiveLine={onActiveLine} />;
  return <BinarySearchAnimatedViz onActiveLine={onActiveLine} />;
}

/* Step 1-2 — linear scan animation */
function LinearScanViz() {
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef(-1);

  const stepForward = useCallback(() => {
    const next = cursorRef.current + 1;
    if (next >= ARR.length || ARR[next] === TARGET) {
      cursorRef.current = next;
      setCursor(next);
      setPlaying(false);
      return;
    }
    cursorRef.current = next;
    setCursor(next);
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    cursorRef.current = -1;
    setCursor(-1);
    setPlaying(false);
  };

  const found = cursor >= 0 && ARR[cursor] === TARGET;

  return (
    <div className="flex flex-col items-center gap-8 max-w-[720px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        page numbers · find page {TARGET}
      </div>

      <div className="overflow-x-auto max-w-full">
        <ArrayViz values={ARR} highlightedIndices={cursor >= 0 ? [cursor] : []} showIndices={false} />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="font-mono text-sm">
          arr[<span className="text-[var(--accent)]">{Math.max(0, cursor)}</span>] = {ARR[Math.max(0, cursor)]}
          {found && <span className="text-[var(--diff-easy)] ml-2">✓ found at {cursor}</span>}
        </div>
        <StatsPanel
          stats={[
            { label: "Comparisons", value: Math.max(0, cursor + 1), emphasis: found ? "good" : "warning" },
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

/* Step 3 — click any cell, half the array goes dark */
function ClickToHalveViz({ onInteraction, onActiveLine }: { onInteraction?: () => void; onActiveLine?: (lines: (number | string)[]) => void }) {
  const isMobile = useIsMobile();
  const cell = isMobile ? 22 : 40;
  const gap = isMobile ? 3 : 6;
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(ARR.length - 1);
  const [last, setLast] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const click = (idx: number) => {
    onInteraction?.();
    if (idx < lo || idx > hi) return;
    setLast(idx);
    if (ARR[idx] === TARGET) {
      onActiveLine?.(LINE_COMPARE_RETURN);
      setDone(true);
      return;
    }
    if (ARR[idx] < TARGET) {
      onActiveLine?.(LINE_LO_UPDATE);
      setLo(idx + 1);
    } else {
      onActiveLine?.(LINE_HI_UPDATE);
      setHi(idx - 1);
    }
  };

  const reset = () => {
    setLo(0);
    setHi(ARR.length - 1);
    setLast(null);
    setDone(false);
  };

  const remaining = Math.max(0, hi - lo + 1);

  return (
    <div className="flex flex-col items-center gap-8 max-w-[720px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click any page · find {TARGET}
      </div>

      <div className="overflow-x-auto max-w-full">
        <div className="flex items-center select-none" style={{ gap }}>
          {ARR.map((v, i) => {
            const inRange = i >= lo && i <= hi;
            const isLast = i === last;
            const isFound = done && isLast;
            return (
              <motion.button
                key={i}
                onClick={() => click(i)}
                animate={{
                  opacity: inRange ? 1 : 0.18,
                  backgroundColor: isFound
                    ? "color-mix(in oklab, var(--diff-easy) 28%, var(--bg-card))"
                    : isLast
                    ? "color-mix(in oklab, var(--accent-sky) 18%, var(--bg-card))"
                    : "var(--bg-card)",
                  borderColor: isFound ? "var(--diff-easy)" : isLast ? "var(--accent)" : inRange ? "var(--line-strong)" : "var(--line)",
                }}
                transition={{ duration: 0.22 }}
                disabled={!inRange}
                className={`rounded-md border-2 font-mono ${isMobile ? "text-[11px]" : "text-sm"} text-[var(--text)] flex items-center justify-center disabled:cursor-not-allowed`}
                style={{ width: cell, height: cell }}
              >
                {v}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="font-mono text-xs text-[var(--text-muted)] text-center">
          {last !== null ? (
            done ? (
              <span className="text-[var(--diff-easy)]">arr[{last}] = {ARR[last]} ✓ found</span>
            ) : ARR[last] < TARGET ? (
              <span>arr[<span className="text-[var(--accent)]">{last}</span>] = {ARR[last]} <span className="text-[var(--accent-sky)]">&lt; {TARGET}</span> · left half discarded</span>
            ) : (
              <span>arr[<span className="text-[var(--accent)]">{last}</span>] = {ARR[last]} <span className="text-[var(--diff-hard)]">&gt; {TARGET}</span> · right half discarded</span>
            )
          ) : (
            <span className="text-[var(--text-faint)]">click anywhere to start</span>
          )}
        </div>
        <StatsPanel
          stats={[
            { label: "Range", value: `[${lo}, ${hi}]` },
            { label: "Cells in play", value: remaining, emphasis: remaining <= 4 ? "good" : undefined },
          ]}
        />
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺ reset</button>
      </div>
    </div>
  );
}

/* Step 4-7 — animated binary search */
interface BSState {
  lo: number;
  hi: number;
  mid: number | null;
  comparisons: number;
  found: boolean;
}

function BinarySearchAnimatedViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const isMobile = useIsMobile();
  const cell = isMobile ? 22 : 40;
  const gap = isMobile ? 3 : 6;
  const stride = cell + gap;

  const initial = (): BSState => ({ lo: 0, hi: ARR.length - 1, mid: null, comparisons: 0, found: false });

  // Pure reducer: one comparison per frame. The `active` labels it returns make
  // the highlighted code line march mid → branch as the search narrows.
  const step = (s: BSState): AlgoFrame<BSState> => {
    if (s.lo > s.hi) return { state: { ...s, mid: null }, active: ["notfound"], done: true };
    const m = Math.floor((s.lo + s.hi) / 2);
    const comparisons = s.comparisons + 1;
    if (ARR[m] === TARGET) return { state: { ...s, mid: m, comparisons, found: true }, active: LINE_COMPARE_RETURN, done: true };
    if (ARR[m] < TARGET) return { state: { ...s, mid: m, comparisons, lo: m + 1 }, active: LINE_LO_UPDATE };
    return { state: { ...s, mid: m, comparisons, hi: m - 1 }, active: LINE_HI_UPDATE };
  };

  return (
    <AnimatedAlgorithmView<BSState>
      initial={initial}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={[LINE_MID]}
      intervalMs={720}
      render={({ lo, hi, mid, comparisons, found }) => (
        <div className="flex flex-col items-center gap-8 max-w-[760px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            halve and halve again · find page {TARGET}
          </div>

          <div className="overflow-x-auto max-w-full">
            <div className="relative" style={{ width: ARR.length * stride }}>
              <div className="flex items-center select-none" style={{ gap }}>
                {ARR.map((v, i) => {
                  const inRange = i >= lo && i <= hi;
                  const isMid = i === mid;
                  const isFoundAt = found && isMid;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: inRange ? 1 : 0.16,
                        backgroundColor: isFoundAt
                          ? "color-mix(in oklab, var(--diff-easy) 28%, var(--bg-card))"
                          : isMid
                          ? "color-mix(in oklab, var(--accent-sky) 18%, var(--bg-card))"
                          : "var(--bg-card)",
                        borderColor: isFoundAt ? "var(--diff-easy)" : isMid ? "var(--accent)" : "var(--line)",
                      }}
                      transition={{ duration: 0.28 }}
                      className={`rounded-md border-2 font-mono ${isMobile ? "text-[11px]" : "text-sm"} text-[var(--text)] flex items-center justify-center`}
                      style={{ width: cell, height: cell }}
                    >
                      {v}
                    </motion.div>
                  );
                })}
              </div>
              {/* lo/hi markers */}
              {lo <= hi && (
                <>
                  <motion.div animate={{ x: lo * stride + cell / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
                    <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">lo</span>
                  </motion.div>
                  <motion.div animate={{ x: hi * stride + cell / 2 }} transition={{ duration: 0.28 }} className="absolute top-full pt-1 -translate-x-1/2 pointer-events-none">
                    <span className="font-mono text-[10px] text-[var(--accent-ink)] bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-md px-1.5">hi</span>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="font-mono text-sm">
              {mid !== null ? (
                <>
                  arr[<span className="text-[var(--accent)]">{mid}</span>] = {ARR[mid]}
                  {ARR[mid] === TARGET ? (
                    <span className="text-[var(--diff-easy)] ml-2">= {TARGET} ✓</span>
                  ) : ARR[mid] < TARGET ? (
                    <span className="text-[var(--accent-sky)] ml-2">&lt; {TARGET}, lo = mid + 1</span>
                  ) : (
                    <span className="text-[var(--diff-hard)] ml-2">&gt; {TARGET}, hi = mid − 1</span>
                  )}
                </>
              ) : (
                <span className="text-[var(--text-faint)]">press play</span>
              )}
            </div>
            <StatsPanel
              stats={[
                { label: "Range", value: `[${lo}, ${hi}]` },
                { label: "Comparisons", value: comparisons, emphasis: "good" },
              ]}
            />
          </div>
        </div>
      )}
    />
  );
}
