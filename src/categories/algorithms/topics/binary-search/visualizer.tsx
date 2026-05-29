"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { StatsPanel } from "@/shared/viz/StatsPanel";
import { useIsMobile } from "@/shared/layout/useIsMobile";

const ARR = [3, 7, 11, 14, 19, 23, 27, 32, 38, 44, 51, 59, 68, 74, 81];
const TARGET = 27;

/* algorithm.py line numbers (1-indexed) */
const LINE_MID = 10; // mid = (lo + hi) // 2
const LINE_COMPARE_RETURN = [11, 12]; // if arr[mid] == target: return mid
const LINE_LO_UPDATE = [13, 14]; // if arr[mid] < target: lo = mid + 1
const LINE_HI_UPDATE = [15, 16]; // else: hi = mid - 1

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: number[]) => void;
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
function ClickToHalveViz({ onInteraction, onActiveLine }: { onInteraction?: () => void; onActiveLine?: (lines: number[]) => void }) {
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
function BinarySearchAnimatedViz({ onActiveLine }: { onActiveLine?: (lines: number[]) => void }) {
  const isMobile = useIsMobile();
  const cell = isMobile ? 22 : 40;
  const gap = isMobile ? 3 : 6;
  const stride = cell + gap;
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(ARR.length - 1);
  const [mid, setMid] = useState<number | null>(null);
  const [comparisons, setComparisons] = useState(0);
  const [found, setFound] = useState(false);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loRef = useRef(0);
  const hiRef = useRef(ARR.length - 1);

  const stepForward = useCallback(() => {
    if (done) {
      setPlaying(false);
      return;
    }
    if (loRef.current > hiRef.current) {
      setDone(true);
      setPlaying(false);
      return;
    }
    const m = Math.floor((loRef.current + hiRef.current) / 2);
    setMid(m);
    onActiveLine?.([LINE_MID]);
    setComparisons((c) => c + 1);
    if (ARR[m] === TARGET) {
      onActiveLine?.(LINE_COMPARE_RETURN);
      setFound(true);
      setDone(true);
      setPlaying(false);
      return;
    }
    if (ARR[m] < TARGET) {
      onActiveLine?.(LINE_LO_UPDATE);
      loRef.current = m + 1;
      setLo(loRef.current);
    } else {
      onActiveLine?.(LINE_HI_UPDATE);
      hiRef.current = m - 1;
      setHi(hiRef.current);
    }
  }, [done, onActiveLine]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 720);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    loRef.current = 0;
    hiRef.current = ARR.length - 1;
    setLo(0);
    setHi(ARR.length - 1);
    setMid(null);
    setComparisons(0);
    setFound(false);
    setDone(false);
    setPlaying(false);
  };

  return (
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
          {/* lo/hi/mid markers */}
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
