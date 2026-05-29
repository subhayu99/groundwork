"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TreeViz } from "@/shared/viz/TreeViz";
import type { Tone } from "@/shared/viz/tones";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";

const N = 8;

// @sync labels — resolved against algorithm.py (single source of truth).
const LINE_TABLE_INIT = "init_table"; // a, b = 1, 1  (dp base values)
const LINE_LOOP = "loop"; // for _ in range(2, n + 1)  (boundary of the iteration)
const LINE_RECURRENCE = "recurrence"; // a, b = b, a + b  (dp[i] = dp[i-1] + dp[i-2])
const LINE_READ_ANSWER = "answer"; // return b

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function Dp1dVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <StaircaseViz />;
  if (step === 3) return <RecursionTreeViz onInteraction={onWedgeInteraction} />;
  return <TabulationViz onActiveLine={onActiveLine} />;
}

function waysTrue(n: number): number {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return n === 0 ? 1 : b;
}

/* Steps 1-2 — staircase + naive call counter */
function StaircaseViz() {
  const stairs = useMemo(() => Array.from({ length: N }, (_, i) => i), []);
  const total = waysTrue(N);

  // For naive recursion the call count = naiveCalls(n)
  function naiveCalls(n: number): number {
    if (n <= 1) return 1;
    return 1 + naiveCalls(n - 1) + naiveCalls(n - 2);
  }
  const naive = naiveCalls(N);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        {N} steps · 1 or 2 at a time
      </div>
      <div className="relative" style={{ height: N * 20 + 36, width: N * 28 + 40 }}>
        {stairs.map((s) => {
          const tread = s + 1;
          return (
            <div
              key={s}
              className="absolute border border-[var(--line)] bg-[var(--bg-card)] rounded-sm flex items-center justify-center font-mono text-[10px] text-[var(--text-muted)]"
              style={{
                left: 18 + s * 16,
                bottom: s * 20,
                width: (N - s) * 16 + 18,
                height: 18,
              }}
            >
              step {tread}
            </div>
          );
        })}
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)] text-center max-w-[360px]">
        actual answer for {N} stairs:{" "}
        <span className="text-[var(--diff-easy)]">{total}</span> distinct routes
        <br />
        naive recursive calls to count them:{" "}
        <span className="text-[var(--diff-hard)]">{naive}</span> &mdash; most of which compute
        the same sub-answer over and over.
      </div>
    </div>
  );
}

interface TreeNode {
  n: number;
  id: string;
  children: TreeNode[];
  isReused: boolean;
}

function buildTree(n: number, memo?: Set<number>, idPrefix = "r"): TreeNode {
  const id = `${idPrefix}-${n}`;
  if (n <= 1) {
    return { n, id, children: [], isReused: false };
  }
  if (memo) {
    if (memo.has(n)) {
      return { n, id, children: [], isReused: true };
    }
    memo.add(n);
  }
  const left = buildTree(n - 1, memo, `${idPrefix}L`);
  const right = buildTree(n - 2, memo, `${idPrefix}R`);
  return { n, id, children: [left, right], isReused: false };
}

function flattenTree(node: TreeNode, depth = 0, acc: Array<{ node: TreeNode; depth: number; col: number }> = [], col = { v: 0 }): Array<{ node: TreeNode; depth: number; col: number }> {
  if (node.children.length === 0) {
    acc.push({ node, depth, col: col.v });
    col.v += 1;
    return acc;
  }
  const start = col.v;
  node.children.forEach((c) => flattenTree(c, depth + 1, acc, col));
  const end = col.v - 1;
  acc.push({ node, depth, col: (start + end) / 2 });
  return acc;
}

/* Step 3 — recursion tree, toggleable memoization */
function RecursionTreeViz({ onInteraction }: { onInteraction?: () => void }) {
  const [memoize, setMemoize] = useState(false);

  const tree = useMemo(() => buildTree(6, memoize ? new Set() : undefined), [memoize]);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  const maxDepth = flat.reduce((m, n) => Math.max(m, n.depth), 0);
  const maxCol = flat.reduce((m, n) => Math.max(m, n.col), 0);
  const W = (maxCol + 1) * 56 + 40;
  const H = (maxDepth + 1) * 64 + 30;
  const nodeCount = flat.length;

  // Node center positions (the old absolute layout placed 40px circles at
  // left/top = col*56+20 / depth*64+20, so centers are +20 from there).
  const cx = (col: number) => col * 56 + 40;
  const cy = (depth: number) => depth * 64 + 40;

  const vizNodes = flat.map(({ node, depth, col }) => ({
    id: node.id,
    x: cx(col),
    y: cy(depth),
    label: node.n,
    tone: (node.isReused ? "good" : "idle") as Tone,
  }));

  const vizEdges = flat.flatMap(({ node }) =>
    node.children.map((c) => ({ from: node.id, to: c.id })),
  );

  const toggle = () => {
    onInteraction?.();
    setMemoize((m) => !m);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        recursion tree for ways(6)
      </div>
      <div className="relative" style={{ width: W, height: H }}>
        <TreeViz nodes={vizNodes} edges={vizEdges} width={W} height={H} radius={20} />
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        nodes computed:{" "}
        <span style={{ color: memoize ? "var(--diff-easy)" : "var(--diff-hard)" }}>
          {nodeCount}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
        >
          {memoize ? "naive" : "remember answers"}
        </button>
      </div>
    </div>
  );
}

/* Steps 4-7 — bottom-up tabulation */
// Precompute the full dp table once: only ever need dp[0..N].
const DP_VALUES = (() => {
  const arr = [1, 1];
  for (let i = 2; i <= N; i++) arr[i] = arr[i - 1] + arr[i - 2];
  return arr;
})();

// One frame = how far the dp table is filled. dp[0] and dp[1] are the base
// values, so we start at filledTo = 1 (both base cells shown).
interface TabState {
  filledTo: number;
}

function TabulationViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const initial = (): TabState => ({ filledTo: 1 });

  // Pure reducer: fill exactly one table cell per frame (a, b = b, a + b). The
  // `active` labels make the highlighted code line march from the loop boundary
  // through the recurrence and land on the read-answer line as the table fills.
  const step = (s: TabState): AlgoFrame<TabState> => {
    const filledTo = Math.min(s.filledTo + 1, N);
    const done = filledTo >= N;
    const active = done
      ? [LINE_READ_ANSWER]
      : filledTo <= 1
      ? [LINE_TABLE_INIT, LINE_LOOP]
      : [LINE_RECURRENCE];
    return { state: { filledTo }, active, done };
  };

  return (
    <AnimatedAlgorithmView<TabState>
      initial={initial}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={[LINE_TABLE_INIT]}
      intervalMs={480}
      playLabel="Play through"
      render={({ filledTo }, { done }) => (
        <div className="flex flex-col items-center gap-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            bottom-up · fill dp[i] = dp[i-1] + dp[i-2]
          </div>
          <div className="flex items-end gap-1.5">
            {Array.from({ length: N + 1 }, (_, i) => {
              const filled = i <= filledTo;
              const isJust = i === filledTo;
              return (
                <div key={i} className="flex flex-col items-center" style={{ width: 48 }}>
                  <motion.div
                    animate={{
                      backgroundColor: isJust
                        ? "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))"
                        : filled
                        ? "color-mix(in oklab, var(--diff-easy) 16%, var(--bg-card))"
                        : "var(--bg-card)",
                      borderColor: isJust
                        ? "var(--accent-line)"
                        : filled
                        ? "var(--diff-easy)"
                        : "var(--line)",
                    }}
                    transition={{ duration: 0.2 }}
                    className="rounded-md border-2 flex items-center justify-center font-mono text-sm"
                    style={{ width: 48, height: 48, color: "var(--text)" }}
                  >
                    {filled ? DP_VALUES[i] : "·"}
                  </motion.div>
                  <span className="font-mono text-[10px] text-[var(--text-faint)] mt-1">
                    dp[{i}]
                  </span>
                </div>
              );
            })}
          </div>
          <div className="font-mono text-xs text-[var(--text-muted)]">
            ways to climb <span className="text-[var(--text)]">{filledTo}</span> stairs ={" "}
            <span className="text-[var(--diff-easy)]">{DP_VALUES[filledTo]}</span>
            {done && <span className="text-[var(--diff-easy)] ml-3">✓</span>}
          </div>
        </div>
      )}
    />
  );
}
