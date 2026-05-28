"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { StatsPanel } from "@/shared/viz/StatsPanel";

const VALUES = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const CELL = 56;
const GAP = 8;
const STRIDE = CELL + GAP;
const TARGET_INDEX = 6;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function ArraysVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <PileViz />;
  if (step === 3) return <SliderViz onInteraction={onWedgeInteraction} />;
  if (step >= 4 && step <= 5) return <OperationsViz />;
  return <SummaryViz />;
}

/* Steps 1-2 — pile of books: linear count */
function PileViz() {
  const [scan, setScan] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanRef = useRef(0);

  const stepForward = useCallback(() => {
    if (scanRef.current >= TARGET_INDEX) {
      setPlaying(false);
      return;
    }
    scanRef.current += 1;
    setScan(scanRef.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 350);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const reset = () => {
    scanRef.current = 0;
    setScan(0);
    setPlaying(false);
  };
  const found = scan === TARGET_INDEX;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the pile · find position {TARGET_INDEX}
      </div>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        Watch the cursor crawl one book at a time. Every lift counts.
      </p>

      <div className="relative pt-6">
        <ArrayViz values={VALUES} highlightedIndices={[scan]} />
        <Cursor index={scan} found={found} />
      </div>

      <div className="flex flex-col items-center gap-4 mt-16">
        <StatsPanel
          stats={[
            { label: "Position", value: `${scan} / ${TARGET_INDEX}` },
            { label: "Lifts so far", value: scan, emphasis: "warning" },
            { label: "Status", value: found ? "found" : "scanning", emphasis: found ? "good" : "warning" },
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

/* Step 3 — slider: direct addressing */
function SliderViz({ onInteraction }: { onInteraction?: () => void }) {
  const [index, setIndex] = useState(0);
  const handleChange = (v: number) => {
    setIndex(v);
    onInteraction?.();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the shelf · drag to any position
      </div>

      <div className="relative pt-6">
        <ArrayViz values={VALUES} highlightedIndices={[index]} />
        <Cursor index={index} found />
      </div>

      <div className="flex flex-col items-center gap-4 mt-16 w-[480px]">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">arr[</span>
          <span className="text-[var(--accent)]">{index}</span>
          <span className="text-[var(--text-muted)]">] = </span>
          <span className="text-[var(--text)]">{VALUES[index]}</span>
          <span className="ml-3 text-[var(--diff-easy)]">1 jump</span>
        </div>
        <input
          type="range"
          min={0}
          max={VALUES.length - 1}
          value={index}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="font-mono text-[10px] text-[var(--text-faint)]">
          base + {index} × cellSize
        </div>
      </div>
    </div>
  );
}

/* Step 4-5 — operations: insert/delete/append */
function OperationsViz() {
  const [arr, setArr] = useState<number[]>([3, 1, 4, 1, 5, 9, 2, 6]);
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [entering, setEntering] = useState<number[]>([]);
  const [leaving, setLeaving] = useState<number[]>([]);
  const [opCount, setOpCount] = useState(0);
  const [lastOp, setLastOp] = useState<string>("—");

  const append = () => {
    const newVal = Math.floor(Math.random() * 9) + 1;
    setArr((a) => [...a, newVal]);
    setEntering([arr.length]);
    setLastOp(`append (${newVal}) — O(1)`);
    setOpCount((c) => c + 1);
    setTimeout(() => setEntering([]), 520);
  };

  const insertMid = () => {
    const mid = Math.floor(arr.length / 2);
    const newVal = Math.floor(Math.random() * 9) + 1;
    setArr((a) => [...a.slice(0, mid), newVal, ...a.slice(mid)]);
    setEntering([mid]);
    setHighlighted(Array.from({ length: arr.length - mid + 1 }, (_, i) => mid + 1 + i));
    setLastOp(`insert mid (${newVal}) — O(n): ${arr.length - mid} shifts`);
    setOpCount((c) => c + (arr.length - mid + 1));
    setTimeout(() => {
      setEntering([]);
      setHighlighted([]);
    }, 720);
  };

  const removeMid = () => {
    if (arr.length <= 1) return;
    const mid = Math.floor(arr.length / 2);
    setLeaving([mid]);
    setLastOp(`delete mid — O(n): ${arr.length - mid - 1} shifts`);
    setOpCount((c) => c + (arr.length - mid));
    setTimeout(() => {
      setArr((a) => [...a.slice(0, mid), ...a.slice(mid + 1)]);
      setLeaving([]);
    }, 520);
  };

  const reset = () => {
    setArr([3, 1, 4, 1, 5, 9, 2, 6]);
    setHighlighted([]);
    setEntering([]);
    setLeaving([]);
    setOpCount(0);
    setLastOp("—");
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        operations · cost in green or yellow
      </div>

      <div className="relative pt-6 min-h-[80px]">
        <ArrayViz
          values={arr}
          highlightedIndices={highlighted}
          enteringIndices={entering}
          leavingIndices={leaving}
        />
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          last op: <span className="text-[var(--text)]">{lastOp}</span>
        </div>
        <StatsPanel
          stats={[
            { label: "Length", value: arr.length },
            { label: "Total shifts", value: opCount, emphasis: "warning" },
          ]}
        />
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={append} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-easy)_50%,transparent)] text-[var(--diff-easy)] bg-[color-mix(in_oklab,var(--diff-easy)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--diff-easy)_22%,transparent)]">
            append · O(1)
          </button>
          <button onClick={insertMid} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--diff-med)_22%,transparent)]">
            insert mid · O(n)
          </button>
          <button onClick={removeMid} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--diff-med)_22%,transparent)]">
            delete mid · O(n)
          </button>
        </div>
      </div>
    </div>
  );
}

/* Steps 6-7 — summary */
function SummaryViz() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        array · the default sequence
      </div>
      <ArrayViz values={VALUES} />
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>read by index</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>append at end</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>insert at i</div><div className="text-[var(--diff-med)]">O(n)</div>
        <div>delete at i</div><div className="text-[var(--diff-med)]">O(n)</div>
        <div>find a value</div><div className="text-[var(--diff-med)]">O(n)</div>
      </div>
    </div>
  );
}

function Cursor({ index, found }: { index: number; found?: boolean }) {
  const x = index * STRIDE + CELL / 2;
  return (
    <motion.div
      animate={{ x }}
      transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}
      className="absolute top-full pt-2 -translate-x-1/2 pointer-events-none"
      style={{ left: 0 }}
    >
      <div className="flex flex-col items-center">
        <span className={found ? "text-[var(--diff-easy)] text-lg" : "text-[var(--diff-med)] text-lg"}>↑</span>
        <span className={`font-mono text-[10px] rounded-md px-1.5 border ${
          found
            ? "text-[var(--diff-easy)] border-[color-mix(in_oklab,var(--diff-easy)_50%,transparent)] bg-[color-mix(in_oklab,var(--diff-easy)_12%,transparent)]"
            : "text-[var(--diff-med)] border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)]"
        }`}>{index}</span>
      </div>
    </motion.div>
  );
}
