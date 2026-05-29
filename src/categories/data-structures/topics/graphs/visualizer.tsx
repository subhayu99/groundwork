"use client";

import { useCallback, useEffect, useState } from "react";
import { GraphViz, GraphVizNode, GraphVizEdge } from "@/shared/viz/GraphViz";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { useIsMobile } from "@/shared/layout/useIsMobile";

// GraphViz coordinate space the node x/y above are authored in.
const BASE_W = 480;
const BASE_H = 380;
// Mobile render target (~340px wide, height kept proportional). Desktop/SSR
// (useIsMobile === false) keeps the default 480×380, byte-for-byte unchanged.
const MOBILE_W = 340;
const MOBILE_H = Math.round((MOBILE_W / BASE_W) * BASE_H);

/** Responsive GraphViz sizing: scales the whole drawing via viewBox on mobile. */
function useGraphSize() {
  const isMobile = useIsMobile();
  if (!isMobile) return {};
  return {
    width: MOBILE_W,
    height: MOBILE_H,
    viewBoxWidth: BASE_W,
    viewBoxHeight: BASE_H,
  };
}

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

// @sync labels — resolved against algorithm.py (single source of truth). The
// live "active line" emits labels, never line numbers, so they track edits to
// the .py automatically. BFS and DFS use DISTINCT labels so an operation only
// ever lights up the ONE function that is actually running.
const BFS_NEIGHBORS = "bfs_neighbors"; // `for neighbor in friends[node]:` (BFS)
const BFS_SEEN = "bfs_seen";           // `seen.add(neighbor)` (BFS)
const BFS_APPEND = "bfs_append";       // `order.append(node)` (BFS)
const DFS_NEIGHBORS = "dfs_neighbors"; // `for neighbor in friends[node]:` (DFS)
const DFS_SEEN = "dfs_seen";           // `seen.add(node)` (DFS)
const DFS_APPEND = "dfs_append";       // `order.append(node)` (DFS)

function neighbors(id: string): string[] {
  const out: string[] = [];
  for (const e of EDGES) {
    if (e.a === id) out.push(e.b);
    else if (e.b === id) out.push(e.a);
  }
  return out;
}

const vizNodes = (tone?: (id: string) => GraphVizNode["tone"]): GraphVizNode[] =>
  NODES.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y, tone: tone?.(n.id) }));

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function GraphsVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <ForcedTreeViz />;
  if (step === 3) return <ClickableGraphViz onInteraction={onWedgeInteraction} onActiveLine={onActiveLine} />;
  if (step >= 4 && step <= 5) return <TraversalViz onActiveLine={onActiveLine} />;
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

  const edges: GraphVizEdge[] = [
    ...treeOnly.map((e) => ({ a: e.a, b: e.b })),
    ...lostEdges.map((e) => ({ a: e.a, b: e.b, tone: "bad" as const, dashed: true })),
  ];
  const size = useGraphSize();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        forcing a tree · lost edges shown in red, dashed
      </div>
      <GraphViz nodes={vizNodes()} edges={edges} {...size} />
      <p className="font-mono text-[10px] text-[var(--text-faint)] max-w-[400px] text-center">
        these <span className="text-[var(--diff-hard)]">{lostEdges.length}</span> friendships exist
        but the tree can&rsquo;t hold them
      </p>
    </div>
  );
}

/* Step 3 — clickable, highlight neighbors */
function ClickableGraphViz({ onInteraction, onActiveLine }: { onInteraction?: () => void; onActiveLine?: (lines: (number | string)[]) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const neighbors2 = activeId ? new Set(neighbors(activeId)) : new Set<string>();
  const highlighted = activeId ? new Set([activeId, ...neighbors2]) : null;

  const nodes = vizNodes((id) => {
    if (id === activeId) return "active";
    if (neighbors2.has(id)) return "trail";
    return "idle";
  });
  const edges: GraphVizEdge[] = EDGES.map((e) => ({
    a: e.a,
    b: e.b,
    tone: highlighted && highlighted.has(e.a) && highlighted.has(e.b) ? ("accent" as const) : undefined,
  }));
  const size = useGraphSize();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click any person · neighbors light up
      </div>
      <GraphViz
        nodes={nodes}
        edges={edges}
        {...size}
        onNodeClick={(id) => {
          const next = id === activeId ? null : id;
          setActiveId(next);
          onInteraction?.();
          // Selecting a node = iterating its adjacency list to light up
          // neighbors. The traversal that actually plays (next step) is BFS, so
          // we anchor ONLY the BFS neighbor-iteration line — not DFS's too.
          onActiveLine?.(next ? [BFS_NEIGHBORS] : []);
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
function TraversalViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);

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

  const stepForward = useCallback(() => {
    setCursor((c) => (c >= order.length ? c : c + 1));
  }, [order.length]);

  const playback = usePlayback({
    onTick: stepForward,
    isDone: () => cursor >= order.length,
  });
  const { stop } = playback;

  useEffect(() => {
    setOrder(buildOrder(mode));
    setCursor(0);
    stop();
  }, [mode, buildOrder, stop]);

  const visited = new Set(order.slice(0, cursor));
  const cur = cursor > 0 ? order[cursor - 1] : null;

  // Emit the algorithm.py labels for the current traversal step: mark visited,
  // record it in order, then iterate its neighbors. The labels are per-mode, so
  // only the ONE function that is actually animating lights up (never bfs+dfs at
  // once — that was the old WIDE-SPAN double-highlight bug).
  useEffect(() => {
    if (cur == null) { onActiveLine?.([]); return; }
    onActiveLine?.(
      mode === "bfs"
        ? [BFS_SEEN, BFS_APPEND, BFS_NEIGHBORS]
        : [DFS_SEEN, DFS_APPEND, DFS_NEIGHBORS],
    );
  }, [cur, mode, onActiveLine]);

  const nodes = vizNodes((id) => {
    if (id === cur) return "active";
    if (visited.has(id)) return "visited";
    return "idle";
  });
  const edges: GraphVizEdge[] = EDGES.map((e) => ({
    a: e.a,
    b: e.b,
    tone: visited.has(e.a) && visited.has(e.b) ? ("active" as const) : undefined,
  }));
  const size = useGraphSize();

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

      <GraphViz nodes={nodes} edges={edges} {...size} />

      <div className="flex flex-col items-center gap-3">
        <div className="font-mono text-xs text-[var(--text-muted)] max-w-[420px] text-center break-words">
          order: <span className="text-[var(--accent)]">{order.slice(0, cursor).join(" → ") || "—"}</span>
        </div>
        <PlaybackControls
          playing={playback.playing}
          onToggle={playback.toggle}
          onReset={() => { setCursor(0); playback.stop(); }}
          onStep={playback.stepOnce}
          atEnd={cursor >= order.length}
        />
      </div>
    </div>
  );
}

function SummaryGraphViz() {
  const size = useGraphSize();
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        graph · nodes + edges
      </div>
      <GraphViz nodes={vizNodes()} edges={EDGES.map((e) => ({ a: e.a, b: e.b }))} {...size} />
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>add edge</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>list neighbors of v</div><div className="text-[var(--diff-easy)]">O(deg(v))</div>
        <div>BFS / DFS</div><div className="text-[var(--diff-easy)]">O(V + E)</div>
        <div>shortest path (Dijkstra)</div><div className="text-[var(--diff-med)]">O((V + E) log V)</div>
      </div>
    </div>
  );
}
