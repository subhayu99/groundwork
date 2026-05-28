"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const N = 8;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function Dp1dVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <StaircaseViz />;
  if (step === 3) return <RecursionTreeViz onInteraction={onWedgeInteraction} />;
  return <TabulationViz />;
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
        {/* edges first */}
        <svg className="absolute inset-0 pointer-events-none" width={W} height={H}>
          {flat.map(({ node, depth, col }) =>
            node.children.map((c) => {
              const cFlat = flat.find((x) => x.node === c);
              if (!cFlat) return null;
              return (
                <line
                  key={`${node.id}-${c.id}`}
                  x1={col * 56 + 26 + 20}
                  y1={depth * 64 + 26 + 20}
                  x2={cFlat.col * 56 + 26 + 20}
                  y2={cFlat.depth * 64 + 26 + 20}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
              );
            }),
          )}
        </svg>
        {flat.map(({ node, depth, col }) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="absolute rounded-full border-2 flex items-center justify-center font-mono text-[10px]"
            style={{
              left: col * 56 + 20,
              top: depth * 64 + 20,
              width: 40,
              height: 40,
              backgroundColor: node.isReused
                ? "color-mix(in oklab, var(--diff-easy) 18%, var(--bg-card))"
                : "var(--bg-card)",
              borderColor: node.isReused ? "var(--diff-easy)" : "var(--line)",
              color: "var(--text)",
            }}
          >
            {node.n}
          </motion.div>
        ))}
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
function TabulationViz() {
  const [filledTo, setFilledTo] = useState(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFilledTo((cur) => {
        if (cur >= N) {
          setPlaying(false);
          return cur;
        }
        return cur + 1;
      });
    }, 480);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setFilledTo(1);
    setPlaying(false);
  };
  const stepOnce = () => setFilledTo((c) => Math.min(c + 1, N));

  const values = useMemo(() => {
    const arr = [1, 1];
    for (let i = 2; i <= N; i++) arr[i] = arr[i - 1] + arr[i - 2];
    return arr;
  }, []);

  return (
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
                {filled ? values[i] : "·"}
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
        <span className="text-[var(--diff-easy)]">{values[filledTo]}</span>
        {filledTo === N && <span className="text-[var(--diff-easy)] ml-3">✓</span>}
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
          disabled={filledTo >= N}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40"
        >
          {playing ? "Pause" : "Play through"}
        </button>
        <button
          onClick={stepOnce}
          disabled={filledTo >= N}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}
