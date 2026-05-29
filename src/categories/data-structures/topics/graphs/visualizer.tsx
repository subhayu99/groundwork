"use client";

import { useState } from "react";
import { GraphViz, GraphVizNode, GraphVizEdge } from "@/shared/viz/GraphViz";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";
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
const START = "alice";

type Mode = "bfs" | "dfs";

// One frame of the traversal. The `mode` lives in state so the pure reducer can
// branch on it (BFS dequeues the FRONT of `frontier`, DFS pops the BACK) and
// emit the matching @sync labels — never the other function's.
interface TraversalState {
  mode: Mode;
  /** Pending nodes: a queue (BFS) or stack (DFS) — same array, different end. */
  frontier: string[];
  visited: string[];
  /** Visit order so far (what lights up + the "order:" trail). */
  order: string[];
  /** Node visited on the frame that produced this state (null = start frame). */
  current: string | null;
}

// Per-mode @sync labels. A frame emits ONLY the running mode's labels, so the
// code viewer lights up the ONE function that is actually animating (never
// bfs+dfs at once — that was the old WIDE-SPAN double-highlight bug).
const BFS_LABELS = [BFS_SEEN, BFS_APPEND, BFS_NEIGHBORS];
const DFS_LABELS = [DFS_SEEN, DFS_APPEND, DFS_NEIGHBORS];

function initialFor(mode: Mode): TraversalState {
  // BFS marks the start as seen up front (it's enqueued before the loop, .py
  // mirrors this). DFS marks on pop, so its `visited` starts empty — matching
  // the recursive pre-order the .py shows.
  return {
    mode,
    frontier: [START],
    visited: mode === "bfs" ? [START] : [],
    order: [],
    current: null,
  };
}

// PURE reducer: one VISIT per frame. No setState / no emit — the wrapper
// reports `active` post-commit.
//
//   BFS: dequeue the FRONT; neighbors are marked-seen on discovery and enqueued.
//   DFS: pop the BACK (mark-on-pop, push neighbors reversed) so the order is the
//        exact recursive pre-order the .py walks; dead pops (already seen) are
//        skipped within the same frame so every frame is a real visit.
function step(s: TraversalState): AlgoFrame<TraversalState> {
  const labels = s.mode === "bfs" ? BFS_LABELS : DFS_LABELS;
  const frontier = [...s.frontier];
  const visited = new Set(s.visited);

  if (s.mode === "bfs") {
    if (frontier.length === 0) return { state: { ...s, current: null }, active: labels, done: true };
    const node = frontier.shift()!;
    for (const nb of neighbors(node)) {
      if (!visited.has(nb)) {
        visited.add(nb);
        frontier.push(nb);
      }
    }
    return {
      state: { mode: "bfs", frontier, visited: [...visited], order: [...s.order, node], current: node },
      active: labels,
      done: frontier.length === 0,
    };
  }

  // DFS: pop until we find an unvisited node (skip stale duplicates).
  let node: string | undefined;
  while (frontier.length > 0) {
    const top = frontier.pop()!;
    if (!visited.has(top)) { node = top; break; }
  }
  if (node === undefined) return { state: { ...s, frontier, current: null }, active: labels, done: true };
  visited.add(node);
  const ns = neighbors(node);
  for (let i = ns.length - 1; i >= 0; i--) frontier.push(ns[i]);
  // Done once nothing unvisited remains in the stack.
  const more = frontier.some((id) => !visited.has(id));
  return {
    state: { mode: "dfs", frontier, visited: [...visited], order: [...s.order, node], current: node },
    active: labels,
    done: !more,
  };
}

// Thin wrapper: holds `mode` and re-mounts AnimatedAlgorithmView via `key={mode}`
// so toggling the mode restarts the animation cleanly in the chosen mode.
function TraversalViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const [mode, setMode] = useState<Mode>("bfs");

  const toggle = (
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
      <span className="text-[var(--text-faint)] ml-2">starting from {START}</span>
    </div>
  );

  return (
    <AnimatedAlgorithmView<TraversalState>
      key={mode}
      initial={() => initialFor(mode)}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={mode === "bfs" ? BFS_LABELS : DFS_LABELS}
      aside={toggle}
      render={(s) => <TraversalFrame state={s} />}
    />
  );
}

function TraversalFrame({ state }: { state: TraversalState }) {
  // `order` = nodes actually emitted so far. Matches the old `visited` set
  // (order.slice(0, cursor)) used for both node + edge highlighting — the
  // frontier/discovery set is intentionally NOT lit yet.
  const traversed = new Set(state.order);
  const cur = state.current;
  const size = useGraphSize();

  const nodes = vizNodes((id) => {
    if (id === cur) return "active";
    if (traversed.has(id)) return "visited";
    return "idle";
  });
  const edges: GraphVizEdge[] = EDGES.map((e) => ({
    a: e.a,
    b: e.b,
    tone: traversed.has(e.a) && traversed.has(e.b) ? ("active" as const) : undefined,
  }));

  return (
    <div className="flex flex-col items-center gap-6">
      <GraphViz nodes={nodes} edges={edges} {...size} />
      <div className="font-mono text-xs text-[var(--text-muted)] max-w-[420px] text-center break-words">
        order: <span className="text-[var(--accent)]">{state.order.join(" → ") || "—"}</span>
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
