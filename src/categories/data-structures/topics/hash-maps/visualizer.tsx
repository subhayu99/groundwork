"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { phasedVisualizer } from "@/shared/viz/phasedVisualizer";

// Deliberately unsorted (a real phone book you haven't organized), with the
// person we search for — "alice" — near the very end, so the Step 1-2 linear
// scan visibly grinds through everyone else before finding her. Sorting it is
// exactly the binary-search alternative the Step 2 card mentions.
const PHONE_BOOK: { name: string; number: string }[] = [
  { name: "harper",  number: "+1-555-0194" },
  { name: "dan",     number: "+1-555-0150" },
  { name: "maya",    number: "+1-555-0241" },
  { name: "cara",    number: "+1-555-0144" },
  { name: "leo",     number: "+1-555-0233" },
  { name: "bob",     number: "+1-555-0118" },
  { name: "ivy",     number: "+1-555-0201" },
  { name: "fawn",    number: "+1-555-0173" },
  { name: "kai",     number: "+1-555-0229" },
  { name: "grace",   number: "+1-555-0189" },
  { name: "eli",     number: "+1-555-0167" },
  { name: "june",    number: "+1-555-0215" },
  { name: "alice",   number: "+1-555-0102" },
];

// Simple hash: sum of char codes mod buckets
function hash(s: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % buckets;
}

export const HashMapsVisualizer = phasedVisualizer([
  { until: 2, render: () => <LinearScanViz /> },
  { until: 3, render: (p) => <HashLookupViz onInteraction={p.onWedgeInteraction} onActiveLine={p.onActiveLine} /> },
  { until: 5, render: () => <BucketsViz /> },
  { render: () => <SummaryViz /> },
]);

/* Step 1-2 — linear scan animation */
function LinearScanViz() {
  const TARGET = "alice";
  const [cursor, setCursor] = useState(-1);
  const [comparisons, setComparisons] = useState(0);
  const [found, setFound] = useState(false);
  const cursorRef = useRef(-1);
  const foundRef = useRef(false);

  const stepForward = useCallback(() => {
    const next = cursorRef.current + 1;
    if (next >= PHONE_BOOK.length) return;
    cursorRef.current = next;
    setCursor(next);
    setComparisons((c) => c + 1);
    if (PHONE_BOOK[next].name === TARGET) {
      foundRef.current = true;
      setFound(true);
    }
  }, []);

  const end = cursor >= PHONE_BOOK.length - 1;

  const pb = usePlayback({
    onTick: () => stepForward(),
    isDone: () => foundRef.current || cursorRef.current >= PHONE_BOOK.length - 1,
    intervalMs: 180,
  });

  const reset = () => {
    pb.stop();
    cursorRef.current = -1;
    foundRef.current = false;
    setCursor(-1);
    setComparisons(0);
    setFound(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-[600px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        the phone book · find &ldquo;{TARGET}&rdquo;
      </div>

      <div className="grid grid-cols-2 gap-1 font-mono text-xs max-h-[260px] overflow-hidden">
        {PHONE_BOOK.map((p, i) => (
          <div
            key={p.name}
            style={{
              backgroundColor:
                found && i === cursor
                  ? "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))"
                  : i === cursor
                  ? "color-mix(in oklab, var(--accent-sky) 18%, var(--bg-card))"
                  : i < cursor
                  ? "color-mix(in oklab, var(--diff-med) 10%, var(--bg-card))"
                  : "var(--bg-card)",
              borderColor: i === cursor ? "var(--accent-line)" : "var(--line)",
            }}
            className="rounded-md border px-3 py-1.5 flex items-center justify-between gap-3 transition-[background-color,border-color] duration-200"
          >
            <span className="text-[var(--text)] truncate">{p.name}</span>
            <span className="text-[var(--text-faint)]">{p.number}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="font-mono text-sm">
          <span className="text-[var(--text-muted)]">comparisons: </span>
          <span className={found ? "text-[var(--diff-easy)]" : "text-[var(--diff-med)]"}>{comparisons}</span>
          {found && <span className="text-[var(--diff-easy)] ml-3">✓ found</span>}
        </div>
        <PlaybackControls
          playing={pb.playing}
          onToggle={pb.toggle}
          onReset={reset}
          onStep={pb.stepOnce}
          atEnd={found || end}
          playLabel="Play through"
        />
      </div>
    </div>
  );
}

/* Step 3 — type a name, see the hash function spit out a slot */
// The "hash into a bucket" concept lives only as pseudo-code COMMENTS in
// algorithm.py, so we anchor the real lookup line instead — typing a name and
// resolving it to a slot IS the dict lookup (`alices_number = phone["alice"]`).
const LOOKUP_LABEL = "lookup";

function HashLookupViz({ onInteraction, onActiveLine }: { onInteraction?: () => void; onActiveLine?: (lines: (number | string)[]) => void }) {
  const BUCKETS = 16;
  const [input, setInput] = useState("");

  const slot = hash(input, BUCKETS);
  const inBook = PHONE_BOOK.find((p) => p.name === input.toLowerCase());

  const handle = (v: string) => {
    setInput(v);
    onInteraction?.();
    onActiveLine?.([LOOKUP_LABEL]);
  };

  return (
    <div className="flex flex-col items-center gap-8 max-w-[600px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        hash(name) → slot
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <input
          value={input}
          onChange={(e) => handle(e.target.value)}
          placeholder="type a name"
          className="w-full px-4 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-card)] text-[var(--text)] font-mono"
        />
        <div className="font-mono text-sm text-[var(--text-muted)]">
          hash(<span className="text-[var(--text)]">&ldquo;{input}&rdquo;</span>) mod {BUCKETS} = {" "}
          <span className="text-[var(--accent)] text-lg">{slot}</span>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1.5 w-full">
        {Array.from({ length: BUCKETS }, (_, i) => (
          <div
            key={i}
            style={{
              borderColor: i === slot ? "var(--accent-sky)" : "var(--line-faint)",
              backgroundColor: i === slot
                ? "color-mix(in oklab, var(--accent-sky) 18%, var(--bg-card))"
                : "var(--bg-card)",
            }}
            className="aspect-square rounded-md border-2 flex flex-col items-center justify-center font-mono text-xs transition-[background-color,border-color] duration-200"
          >
            <span className="text-[var(--text-faint)] text-[10px]">{i}</span>
            {i === slot && <span className="text-[var(--accent-ink)] text-[10px] mt-1 truncate w-full text-center px-1">{input}</span>}
          </div>
        ))}
      </div>

      <div className="font-mono text-xs text-[var(--text-muted)]">
        {inBook ? (
          <span><span className="text-[var(--diff-easy)]">found:</span> {inBook.number}</span>
        ) : (
          <span className="text-[var(--text-faint)]">name not in the book</span>
        )}
        <span className="ml-3 text-[var(--diff-easy)]">1 hop</span>
      </div>
    </div>
  );
}

/* Step 4-5 — buckets with the actual phone book, show collisions */
function BucketsViz() {
  const BUCKETS = 16;
  const grouped: { name: string; number: string }[][] = Array.from({ length: BUCKETS }, () => []);
  for (const p of PHONE_BOOK) grouped[hash(p.name, BUCKETS)].push(p);
  const collisions = grouped.reduce((acc, b) => acc + Math.max(0, b.length - 1), 0);

  return (
    <div className="flex flex-col items-center gap-6 max-w-[640px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        bucket array · phone book hashed into 16 slots
      </div>

      <div className="grid grid-cols-4 gap-2 w-full">
        {grouped.map((bucket, i) => (
          <div key={i} className="rounded-md border-2 border-[var(--line-faint)] bg-[var(--bg-card)] p-2 min-h-[64px] flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[var(--text-faint)]">slot {i}</span>
            <AnimatePresence>
              {bucket.map((p) => (
                <motion.span
                  key={p.name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`font-mono text-[11px] rounded px-1.5 py-0.5 ${
                    bucket.length > 1
                      ? "text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_15%,transparent)]"
                      : "text-[var(--text)] bg-[var(--bg-card-hi)]"
                  }`}
                >
                  {p.name}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="font-mono text-xs text-[var(--text-muted)]">
        13 names in 16 buckets · {" "}
        <span className={collisions === 0 ? "text-[var(--diff-easy)]" : "text-[var(--diff-med)]"}>
          {collisions} collision{collisions === 1 ? "" : "s"}
        </span>
        <span className="ml-3 text-[var(--text-faint)]">(yellow = two names share a slot — chain them)</span>
      </div>
    </div>
  );
}

function SummaryViz() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        hash map · the workhorse
      </div>
      <div className="font-mono text-base text-[var(--text-muted)]">
        <span className="text-[var(--text)]">phone[</span>
        <span className="text-[var(--accent)]">&ldquo;alice&rdquo;</span>
        <span className="text-[var(--text)]">]</span>
        <span className="mx-2 text-[var(--text-faint)]">→</span>
        <span className="text-[var(--diff-easy)]">+1-555-0102</span>
        <span className="ml-4 text-[var(--text-faint)]">in 1 hop</span>
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>insert</div><div className="text-[var(--diff-easy)]">O(1) average</div>
        <div>lookup by key</div><div className="text-[var(--diff-easy)]">O(1) average</div>
        <div>delete by key</div><div className="text-[var(--diff-easy)]">O(1) average</div>
        <div>membership (`in`)</div><div className="text-[var(--diff-easy)]">O(1) average</div>
        <div>iterate all</div><div className="text-[var(--diff-med)]">O(n)</div>
        <div>order / range query</div><div className="text-[var(--diff-hard)]">use a tree</div>
      </div>
    </div>
  );
}
