"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { useIsMobile } from "@/shared/layout/useIsMobile";

const SENTENCE = "the quick brown fox";
const PATTERN = "brown";
const CELL = 32;
const GAP = 4;
const STRIDE = CELL + GAP;

// Mobile cell sizing — 19 cells + gaps must fit ~340px panel near full scale.
// 19*15 + 18*2 = 321px.
const MOBILE_CELL = 15;
const MOBILE_GAP = 2;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function StringsVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <NaiveSearchViz />;
  if (step === 3) return <SliderViz onInteraction={onWedgeInteraction} />;
  if (step >= 4 && step <= 5) return <ImmutabilityViz />;
  return <SummaryViz />;
}

function CharRow({
  text,
  highlightedIndices = [],
  matchedIndices = [],
  mismatchIndices = [],
  showIndices = false,
}: {
  text: string;
  highlightedIndices?: number[];
  matchedIndices?: number[];
  mismatchIndices?: number[];
  showIndices?: boolean;
}) {
  const isMobile = useIsMobile();
  const cell = isMobile ? MOBILE_CELL : CELL;
  const gap = isMobile ? MOBILE_GAP : GAP;
  return (
    <div className="flex items-end" style={{ gap }}>
      {Array.from(text).map((ch, i) => {
        const inHigh = highlightedIndices.includes(i);
        const matched = matchedIndices.includes(i);
        const mismatch = mismatchIndices.includes(i);
        const isSpace = ch === " ";
        return (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              animate={{
                backgroundColor: matched
                  ? "color-mix(in oklab, var(--diff-easy) 18%, var(--bg-card))"
                  : mismatch
                  ? "color-mix(in oklab, var(--diff-hard) 22%, var(--bg-card))"
                  : inHigh
                  ? "color-mix(in oklab, var(--accent-sky) 16%, var(--bg-card))"
                  : "var(--bg-card)",
                borderColor: matched
                  ? "var(--diff-easy)"
                  : mismatch
                  ? "var(--diff-hard)"
                  : inHigh
                  ? "var(--accent-line)"
                  : "var(--line)",
              }}
              transition={{ duration: 0.18 }}
              className="rounded-md border-2 flex items-center justify-center font-mono"
              style={{ width: cell, height: cell, fontSize: isMobile ? 10 : 16 }}
            >
              <span className={isSpace ? "text-[var(--text-faint)]" : "text-[var(--text)]"}>
                {isSpace ? "·" : ch}
              </span>
            </motion.div>
            {showIndices && (
              <span className="font-mono text-[9px] text-[var(--text-faint)] mt-1">{i}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Steps 1-2 — naive substring search */
function NaiveSearchViz() {
  const [start, setStart] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [found, setFound] = useState(false);
  const startRef = useRef(0);
  const foundRef = useRef(false);
  const maxStart = SENTENCE.length - PATTERN.length;

  const done = startRef.current > maxStart || found;

  const pb = usePlayback({
    onTick: () => stepForward(),
    isDone: () => startRef.current > maxStart || foundRef.current,
    intervalMs: 350,
  });

  const stepForward = useCallback(() => {
    const cur = startRef.current;
    if (cur > maxStart || foundRef.current) {
      pb.stop();
      return;
    }
    // check pattern at cur
    let matches = 0;
    for (let i = 0; i < PATTERN.length; i++) {
      matches += 1;
      if (SENTENCE[cur + i] !== PATTERN[i]) break;
    }
    setComparisons((c) => c + matches);
    if (matches === PATTERN.length) {
      foundRef.current = true;
      setFound(true);
      pb.stop();
      return;
    }
    startRef.current = cur + 1;
    setStart(startRef.current);
  }, [maxStart, pb]);

  const reset = () => {
    startRef.current = 0;
    foundRef.current = false;
    setStart(0);
    setComparisons(0);
    setFound(false);
    pb.stop();
  };

  const matched = found ? Array.from({ length: PATTERN.length }, (_, i) => start + i) : [];
  const highlighted = !found ? Array.from({ length: PATTERN.length }, (_, i) => start + i) : [];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        looking for &ldquo;{PATTERN}&rdquo;
      </div>

      <div className="flex flex-col items-center gap-4">
        <CharRow text={SENTENCE} highlightedIndices={highlighted} matchedIndices={matched} showIndices />
      </div>

      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="font-mono text-sm">
          start = <span className="text-[var(--accent)]">{start}</span>
          {found && <span className="text-[var(--diff-easy)] ml-3">✓ found at {start}</span>}
        </div>
        <div className="flex items-center gap-8 font-mono">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Comparisons</span>
            <span className="text-2xl" style={{ color: found ? "var(--diff-easy)" : "var(--diff-med)" }}>{comparisons}</span>
          </div>
        </div>
        <PlaybackControls
          playing={pb.playing}
          onToggle={pb.toggle}
          onReset={reset}
          onStep={pb.stepOnce}
          atEnd={done}
          playLabel="Play through"
        />
      </div>
    </div>
  );
}

/* Step 3 — manual slider */
function SliderViz({ onInteraction }: { onInteraction?: () => void }) {
  const [start, setStart] = useState(0);
  const maxStart = SENTENCE.length - PATTERN.length;
  const handleChange = (v: number) => {
    setStart(v);
    onInteraction?.();
  };

  const candidate = SENTENCE.slice(start, start + PATTERN.length);
  const matchesPattern = candidate === PATTERN;
  const highlighted = matchesPattern ? [] : Array.from({ length: PATTERN.length }, (_, i) => start + i);
  const matched = matchesPattern ? Array.from({ length: PATTERN.length }, (_, i) => start + i) : [];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        slide the highlight
      </div>

      <CharRow text={SENTENCE} highlightedIndices={highlighted} matchedIndices={matched} showIndices />

      <div className="flex flex-col items-center gap-4 mt-6 w-full md:max-w-[480px]">
        <div className="font-mono text-sm">
          s[<span className="text-[var(--accent)]">{start}</span>:<span className="text-[var(--accent)]">{start + PATTERN.length}</span>] = &ldquo;
          <span className={matchesPattern ? "text-[var(--diff-easy)]" : "text-[var(--text)]"}>{candidate}</span>&rdquo;
          {matchesPattern && <span className="text-[var(--diff-easy)] ml-2">= &ldquo;{PATTERN}&rdquo; ✓</span>}
        </div>
        <input
          type="range"
          min={0}
          max={maxStart}
          value={start}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="font-mono text-[10px] text-[var(--text-faint)]">
          each step is O(1) — jumping by index doesn&rsquo;t care how far you jump
        </div>
      </div>
    </div>
  );
}

/* Step 4-5 — immutability: rebuild on edit */
function ImmutabilityViz() {
  const [s, setS] = useState("hello");
  const [editing, setEditing] = useState<number[]>([]);
  const [copies, setCopies] = useState(0);

  const replaceAt = (i: number, ch: string) => {
    setEditing([i]);
    setS((cur) => cur.substring(0, i) + ch + cur.substring(i + 1));
    setCopies((c) => c + s.length);
    setTimeout(() => setEditing([]), 520);
  };

  const append = (ch: string) => {
    setEditing([s.length]);
    setS((cur) => cur + ch);
    setCopies((c) => c + s.length + 1);
    setTimeout(() => setEditing([]), 520);
  };

  const reset = () => {
    setS("hello");
    setCopies(0);
    setEditing([]);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        immutability · every edit allocates
      </div>

      <CharRow text={s} highlightedIndices={editing} showIndices />

      <div className="flex flex-col items-center gap-4">
        <div className="font-mono text-sm text-[var(--text-muted)]">
          length: <span className="text-[var(--text)]">{s.length}</span>
          <span className="mx-3">·</span>
          characters copied so far: <span className="text-[var(--diff-med)]">{copies}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => replaceAt(0, "H")} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">
            replace s[0] with &lsquo;H&rsquo;
          </button>
          <button onClick={() => append("!")} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">
            append &lsquo;!&rsquo;
          </button>
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">
            ↺ reset
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryViz() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        string · array of characters
      </div>
      <CharRow text={SENTENCE} />
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>s[i]</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>len(s)</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>s[i:j]</div><div className="text-[var(--diff-med)]">O(j − i)</div>
        <div>a + b</div><div className="text-[var(--diff-med)]">O(n + m)</div>
        <div>repeat +=</div><div className="text-[var(--diff-hard)]">way too long</div>
        <div>find substring</div><div className="text-[var(--diff-med)]">O(n)–O(n·m)</div>
      </div>
    </div>
  );
}
