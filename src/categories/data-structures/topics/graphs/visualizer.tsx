"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface GNode { id: string; label: string; x: number; y: number }
interface GEdge { a: string; b: string }

const NODES: GNode[] = [
  { id: "alice",  label: "alice",  x: 240, y: 60 },
  { id: "bob",    label: "bob",    x: 100, y: 140 },
  { id: "cara",   label: "cara",   x: 380, y: 140 },
  { id: "dan",    label: "dan",    x: 60,  y: 240 },
  { id: "eli",    label: "eli",    x: 420, y: 240 },
  { id: "fawn",   label: "fawn",   x: 150, y: 320 },
  { id: "grace",  label: "grace",  x: 340, y: 320 },
  { id: "harper", label: "harper", x: 240, y: 220 },
];

const EDGES: GEdge[] = [
  { a: "alice",  b: "bob" },
  { a: "alice",  b: "cara" },
  { a: "alice",  b: "harper" },
  { a: "bob",    b: "dan" },
  { a: "bob",    b: "harper" },
  { a: "cara",   b: "eli" },
  { a: "cara",   b: "harper" },
  { a: "dan",    b: "fawn" },
  { a: "eli",    b: "grace" },
  { a: "harper", b: "fawn" },
  { a: "harper", b: "grace" },
];

function neighbors(id: string): string[] {
  const out: string[] = [];
  for (const e of EDGES) {
    if (e.a === id) out.push(e.b);
    else if (e.b === id) out.push(e.a);
  }
  return out;
}

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function GraphsVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <ForcedTreeViz />;
  if (step === 3) return <ClickableGraphViz onInteraction={onWedgeInteraction} />;
  if (step >= 4 && step <= 5) return <TraversalViz />;
  return <SummaryGraphViz />;
}

/* Step 1-2 — try to force into a tree, lose edges */
function ForcedTreeViz() {
  // Tree-only subset: omit the back-edges
  const treeOnly: GEdge[] = [
    { a: "alice", b: "bob" },
    { a: "alice", b: "cara" },
    { a: "alice", b: "harper" },
    { a: "bob",   b: "dan" },
    { a: "cara",  b: "eli" },
    { a: "dan",   b: "fawn" },
    { a: "eli",   b: "grace" },
  ];
  const lostEdges: GEdge[] = EDGES.filter((e) => !treeOnly.some((t) => (t.a === e.a && t.b === e.b)));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        forcing a tree · lost edges shown in red, dashed
      </div>
      <GraphSVG nodes={NODES} edges={treeOnly} lostEdges={lostEdges} />
      <p className="font-mono text-[10px] text-[var(--text-faint)] max-w-[400px] text-center">
        these <span className="text-[var(--diff-hard)]">{lostEdges.length}</span> friendships exist
        but the tree can&rsquo;t hold them
      </p>
    </div>
  );
}

/* Step 3 — clickable, highlight neighbors */
function ClickableGraphViz({ onInteraction }: { onInteraction?: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const neighbors2 = activeId ? new Set(neighbors(activeId)) : new Set<string>();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click any person · neighbors light up
      </div>
      <GraphSVG
        nodes={NODES}
        edges={EDGES}
        highlightedNodes={
          activeId ? new Set([activeId, ...neighbors2]) : undefined
        }
        primaryNode={activeId ?? undefined}
        onClickNode={(id) => {
          setActiveId(id === activeId ? null : id);
          onInteraction?.();
        }}
      />
      <p className="font-mono text-[10px] text-[var(--text-faint)] max-w-[440px] text-center">
        {activeId
          ? `${activeId} has ${neighbors2.size} direct connection${neighbors2.size === 1 ? "" : "s"} — one adjacency-list lookup`
          : "click anyone — see how the graph routes around itself"}
      </p>
    </div>
  );
}

/* Step 4-5 — BFS / DFS traversal animation */
function TraversalViz() {
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = "alice";

  const buildOrder = useCallback((m: "bfs" | "dfs"): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    if (m === "bfs") {
      const q: string[] = [start];
      seen.add(start);
      while (q.length) {
        const n = q.shift()!;
        out.push(n);
        for (const nb of neighbors(n)) {
          if (!seen.has(nb)) {
            seen.add(nb);
            q.push(nb);
          }
        }
      }
    } else {
      const visit = (n: string) => {
        if (seen.has(n)) return;
        seen.add(n);
        out.push(n);
        for (const nb of neighbors(n)) visit(nb);
      };
      visit(start);
    }
    return out;
  }, []);

  useEffect(() => {
    setOrder(buildOrder(mode));
    setCursor(0);
    setPlaying(false);
  }, [mode, buildOrder]);

  const stepForward = useCallback(() => {
    setCursor((c) => {
      if (c >= order.length) {
        setPlaying(false);
        return c;
      }
      return c + 1;
    });
  }, [order.length]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(stepForward, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, stepForward]);

  const visited = new Set(order.slice(0, cursor));
  const cur = cursor > 0 ? order[cursor - 1] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        <button
          onClick={() => setMode("bfs")}
          className={`px-2 py-1 rounded-md transition-colors ${
            mode === "bfs"
              ? "text-[var(--accent-ink)] border border-[var(--accent-line)] bg-[var(--accent-soft)]"
              : "text-[var(--text-faint)] border border-[var(--line)]"
          }`}
        >
          bfs
        </button>
        <span>↔</span>
        <button
          onClick={() => setMode("dfs")}
          className={`px-2 py-1 rounded-md transition-colors ${
            mode === "dfs"
              ? "text-[var(--accent-ink)] border border-[var(--accent-line)] bg-[var(--accent-soft)]"
              : "text-[var(--text-faint)] border border-[var(--line)]"
          }`}
        >
          dfs
        </button>
        <span className="text-[var(--text-faint)] ml-2">starting from {start}</span>
      </div>

      <GraphSVG
        nodes={NODES}
        edges={EDGES}
        highlightedNodes={visited}
        primaryNode={cur ?? undefined}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="font-mono text-xs text-[var(--text-muted)] max-w-[420px] text-center break-words">
          order: <span className="text-[var(--accent)]">{order.slice(0, cursor).join(" → ") || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCursor(0); setPlaying(false); }}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
          >
            {playing ? "Pause" : "Play through"}
          </button>
          <button
            onClick={stepForward}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryGraphViz() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        graph · nodes + edges
      </div>
      <GraphSVG nodes={NODES} edges={EDGES} />
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>add edge</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>list neighbors of v</div><div className="text-[var(--diff-easy)]">O(deg(v))</div>
        <div>BFS / DFS</div><div className="text-[var(--diff-easy)]">O(V + E)</div>
        <div>shortest path (Dijkstra)</div><div className="text-[var(--diff-med)]">O((V + E) log V)</div>
      </div>
    </div>
  );
}

/* ===== Reusable graph SVG ===== */

function GraphSVG({
  nodes,
  edges,
  lostEdges,
  highlightedNodes,
  primaryNode,
  onClickNode,
}: {
  nodes: GNode[];
  edges: GEdge[];
  lostEdges?: GEdge[];
  highlightedNodes?: Set<string>;
  primaryNode?: string;
  onClickNode?: (id: string) => void;
}) {
  const NODE_R = 24;
  const W = 480, H = 400;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n] as const));

  return (
    <svg width={W} height={H} className="overflow-visible">
      {edges.map((e, i) => {
        const a = byId[e.a], b = byId[e.b];
        if (!a || !b) return null;
        const isHi = highlightedNodes?.has(a.id) && highlightedNodes?.has(b.id);
        return (
          <line
            key={`e${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={isHi ? "var(--accent)" : "var(--line)"}
            strokeWidth={isHi ? 2 : 1.2}
          />
        );
      })}
      {(lostEdges ?? []).map((e, i) => {
        const a = byId[e.a], b = byId[e.b];
        if (!a || !b) return null;
        return (
          <line
            key={`lost${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="var(--diff-hard)"
            strokeWidth={1.4}
            strokeDasharray="6 4"
            opacity={0.85}
          />
        );
      })}
      {nodes.map((n) => {
        const isHi = highlightedNodes?.has(n.id);
        const isPrimary = primaryNode === n.id;
        return (
          <motion.g
            key={n.id}
            animate={{ opacity: highlightedNodes && highlightedNodes.size > 0 && !isHi && !isPrimary ? 0.45 : 1 }}
            transition={{ duration: 0.2 }}
            style={{ cursor: onClickNode ? "pointer" : "default" }}
            onClick={() => onClickNode?.(n.id)}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_R}
              fill={
                isPrimary
                  ? "color-mix(in oklab, var(--diff-easy) 26%, var(--bg-card))"
                  : isHi
                  ? "color-mix(in oklab, var(--accent-sky) 22%, var(--bg-card))"
                  : "var(--bg-card)"
              }
              stroke={isPrimary ? "var(--diff-easy)" : isHi ? "var(--accent)" : "var(--line-strong)"}
              strokeWidth={isPrimary || isHi ? 2 : 1.2}
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              className="font-mono text-[10px] pointer-events-none select-none"
              fill={isPrimary || isHi ? "var(--accent-ink)" : "var(--text)"}
            >
              {n.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
