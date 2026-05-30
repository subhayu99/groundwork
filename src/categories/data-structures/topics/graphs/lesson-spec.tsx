"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge } from "@/shared/lesson/canvas";
import graphsPy from "./algorithm.py";

const VW = 860, VH = 470;

/* ── the social network: people (nodes) + friendships (undirected edges) ───── */
// Positions authored directly in the 860×470 canvas, kept clear of the top
// text panels (everything sits at y >= 150).
const POS: Record<string, { x: number; y: number }> = {
  alice:  { x: 430, y: 200 },
  bob:    { x: 270, y: 260 },
  cara:   { x: 590, y: 260 },
  harper: { x: 430, y: 320 },
  dan:    { x: 200, y: 380 },
  eli:    { x: 660, y: 380 },
  fawn:   { x: 330, y: 420 },
  grace:  { x: 540, y: 420 },
};
const NAMES = Object.keys(POS);

// Each pair is one friendship. Undirected: it counts both ways.
const PAIRS: [string, string][] = [
  ["alice", "bob"],
  ["alice", "cara"],
  ["alice", "harper"],
  ["bob", "dan"],
  ["bob", "harper"],
  ["cara", "eli"],
  ["cara", "harper"],
  ["dan", "fawn"],
  ["eli", "grace"],
  ["harper", "fawn"],
  ["harper", "grace"],
];

// The friendships a tree CAN keep (one root, no loops back) vs. the ones it
// must drop — used by the "force it into a tree" beat.
const TREE_PAIRS: [string, string][] = [
  ["alice", "bob"],
  ["alice", "cara"],
  ["alice", "harper"],
  ["bob", "dan"],
  ["cara", "eli"],
  ["dan", "fawn"],
  ["eli", "grace"],
];
const isTreePair = (a: string, b: string) =>
  TREE_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

function neighborsOf(id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of PAIRS) {
    if (a === id) out.push(b);
    else if (b === id) out.push(a);
  }
  return out;
}

const baseNodes = (tone?: (id: string) => Tone | undefined): GNode[] =>
  NAMES.map((id) => ({ id, x: POS[id].x, y: POS[id].y, label: id, tone: tone?.(id) }));

const baseEdges = (tone?: (a: string, b: string) => Tone | undefined): GEdge[] =>
  PAIRS.map(([a, b]) => ({ from: a, to: b, tone: tone?.(a, b) }));

/* ── wedge: click a person, their direct friends light up ──────────────────── */
function ClickNeighbors({ api }: { api: BeatVisualApi }) {
  const [picked, setPicked] = useState<string | null>(null);

  const click = (id: string) => {
    api.onInteractionDone();
    const next = id === picked ? null : id;
    setPicked(next);
    // Looking up one person's friends = reading one row of the adjacency list,
    // the same line the traversal will run next.
    api.onActiveLine(next ? ["bfs_neighbors"] : []);
  };

  const nbrs = picked ? new Set(neighborsOf(picked)) : new Set<string>();
  const lit = picked ? new Set([picked, ...nbrs]) : null;

  const nodes = baseNodes((id) =>
    id === picked ? "active" : nbrs.has(id) ? "trail" : undefined,
  );
  const edges = baseEdges((a, b) => (lit && lit.has(a) && lit.has(b) ? "trail" : undefined));

  const reset = () => { setPicked(null); api.onActiveLine([]); };

  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} onNodeClick={click} />
      <text x={VW / 2} y={158} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {picked === null
          ? "click any person — their direct friends light up"
          : `${picked} has ${nbrs.size} direct friend${nbrs.size === 1 ? "" : "s"} — one lookup`}
      </text>
      <g onClick={reset} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 - 28} y={VH - 34} width={56} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={VH - 22} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── playback: BFS spreads outward from alice, one person per beat ─────────── */
interface BfsState { frontier: string[]; seen: Set<string>; order: string[]; current: string | null; done: boolean; }
const START = "alice";
function AutoBFS({ api }: { api: BeatVisualApi }) {
  const init = (): BfsState => ({ frontier: [START], seen: new Set([START]), order: [], current: null, done: false });
  const [s, setS] = useState<BfsState>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.frontier.length === 0) { setS({ ...c, current: null, done: true }); return; }
      const frontier = [...c.frontier];
      const node = frontier.shift()!;            // take the person waiting longest
      const seen = new Set(c.seen);
      api.onActiveLine(["bfs_pop", "bfs_append", "bfs_neighbors", "bfs_seen"]);
      for (const nb of neighborsOf(node)) {
        if (!seen.has(nb)) { seen.add(nb); frontier.push(nb); }
      }
      const order = [...c.order, node];
      setS({ frontier, seen, order, current: node, done: frontier.length === 0 });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { order, current, done } = s;
  const visited = new Set(order);
  const nodes = baseNodes((id) =>
    id === current ? "active" : visited.has(id) ? "visited" : undefined,
  );
  const edges = baseEdges((a, b) => (visited.has(a) && visited.has(b) ? "visited" : undefined));

  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} />
      <text x={VW / 2} y={158} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? `visited all in order: ${order.join(" → ")}` : current === null ? "starting from alice…" : `now visiting ${current} — its friends join the line`}
      </text>
      <g onClick={() => { setS(init()); api.onActiveLine([]); }} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); api.onActiveLine([]); } }}>
        <rect x={VW / 2 - 30} y={VH - 34} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={VH - 22} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visuals ────────────────────────────────────────────────────────── */
const idleGraph = (
  tone?: (id: string) => Tone | undefined,
  edgeTone?: (a: string, b: string) => Tone | undefined,
) => <NodeGraph nodes={baseNodes(tone)} edges={baseEdges(edgeTone)} />;

// "Force it into a tree" — keep the tree edges, show the rest as dropped (red, dashed).
function ForcedTree() {
  const nodes = baseNodes();
  const edges: GEdge[] = PAIRS.map(([a, b]) =>
    isTreePair(a, b)
      ? { from: a, to: b }
      : { from: a, to: b, tone: "bad" as Tone, dashed: true },
  );
  const lost = PAIRS.filter(([a, b]) => !isTreePair(a, b)).length;
  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} />
      <text x={VW / 2} y={158} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-hard)" }}>
        {lost} friendships (red, dashed) exist — but a tree can&rsquo;t hold them
      </text>
    </g>
  );
}

// "Adjacency list" — the graph beside its dict-of-neighbors text rows.
function AdjacencyList() {
  const rows = NAMES.map((id) => `${id}: [${neighborsOf(id).join(", ")}]`);
  const bx = 600, by = 200, lh = 22;
  return (
    <g>
      <NodeGraph nodes={baseNodes((id) => (id === "alice" ? "active" : undefined))}
        edges={baseEdges((a, b) => ((a === "alice" || b === "alice") ? "trail" : undefined))} />
      <rect x={bx - 12} y={by - 24} width={250} height={NAMES.length * lh + 36} rx={10} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={bx} y={by - 8} className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>friends = &#123;</text>
      {rows.map((r, i) => (
        <text key={i} x={bx + 8} y={by + 14 + i * lh} className="font-mono"
          style={{ fontSize: 10, fill: r.startsWith("alice") ? "var(--accent-ink)" : "var(--text-muted)" }}>{r}</text>
      ))}
      <text x={bx} y={by + 16 + NAMES.length * lh} className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>&#125;</text>
    </g>
  );
}

export const graphsLesson: LessonSpec = {
  topicTitle: "graphs · who knows whom",
  canvas: { width: VW, height: VH },
  codeSource: graphsPy as string,
  beats: [
    {
      id: "setup",
      visual: idleGraph(),
      panels: [{
        left: 20, top: 18, width: 300, variant: "main", label: "The setup",
        title: "Who knows whom?",
        body: <>Some questions are about <strong>connections</strong>: who&rsquo;s friends with whom, which web pages link to which, which roads join which towns. Here are eight people; a line means &ldquo;these two are friends.&rdquo;</>,
      }],
      codeLabels: ["sig"],
    },
    {
      id: "forced-tree",
      visual: <ForcedTree />,
      panels: [{
        left: 20, top: 18, width: 300, variant: "main", label: "The obvious thing",
        title: "Forcing it into a tree loses links.",
        body: <>A <em>tree</em> is a neat family chart: one top person, each below has exactly one parent, and lines never loop back. Try it here and friendships that loop back (red, dashed) get thrown away. We need something that allows any link.</>,
      }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <ClickNeighbors api={api} />,
      panels: [
        {
          left: 20, top: 18, width: 300, variant: "main", label: "The wedge",
          title: "Click a person. Follow their links.",
          body: <>Click anyone. The people they&rsquo;re directly friends with light up. Click one of those and <em>their</em> friends light up. Each click is just reading one person&rsquo;s list of friends &mdash; following the lines, in any direction.</>,
        },
        {
          left: 560, top: 18, width: 280, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> what is the smallest amount of record-keeping needed to answer &ldquo;who&rsquo;s connected to whom?&rdquo;</>,
        },
      ],
      codeLabels: ["bfs_neighbors", "neighbors"],
      interaction: "wedge",
    },
    {
      id: "structure",
      visual: <AdjacencyList />,
      panels: [{
        left: 20, top: 18, width: 300, variant: "main", label: "The structure",
        title: "A graph = dots + lines.",
        body: <>The answer: a <strong>graph</strong> &mdash; a set of dots (<em>nodes</em>, one per person) and lines (<em>edges</em>, one per friendship). Store it as an <em>adjacency list</em>: a lookup table from each person to the list of their friends. That&rsquo;s the whole structure.</>,
      }],
      codeLabels: ["add_edge_a", "add_edge_b"],
    },
    {
      id: "traverse",
      visual: (api) => <AutoBFS api={api} />,
      panels: [{
        left: 20, top: 18, width: 300, variant: "main", label: "The operations",
        title: "Walk it: nearest friends first.",
        body: <>Watch a <em>breadth-first search</em>: start at alice, visit her friends, then their friends, spreading outward in rings. A &ldquo;seen&rdquo; set (the same lookup table idea) stops us re-walking a line and looping forever. This finds the shortest chain between people.</>,
      }],
      codeLabels: ["bfs_pop", "bfs_append", "bfs_neighbors", "bfs_seen"],
      interaction: "playback",
    },
    {
      id: "fits",
      visual: idleGraph(
        (id) => (id === "alice" || id === "harper" ? "trail" : undefined),
        (a, b) => ((a === "alice" || b === "alice" || a === "harper" || b === "harper") ? "trail" : undefined),
      ),
      panels: [{
        left: 20, top: 18, width: 300, variant: "main", label: "When it fits",
        title: "Anywhere you say 'the links between X.'",
        body: <>Reach for a graph whenever the <strong>relationships</strong> matter: social networks, maps and routes, web links, which software package needs which. If links only ever go one way down a hierarchy with no loops, a tree is simpler. Loops back? You&rsquo;ve got a graph.</>,
      }],
      codeLabels: ["dfs_neighbors", "dfs_recurse"],
    },
    {
      id: "name",
      visual: idleGraph(),
      panels: [{
        left: 20, top: 18, width: 320, variant: "main", label: "The structure",
        title: "Graph.",
        body: <>That&rsquo;s the name. The structure is tiny &mdash; a table from each node to its neighbors. The richness is in what you run on it: breadth-first or depth-first walks (dive deep down one path, then back up), shortest routes, spotting separate clusters.</>,
      }],
      codeLabels: ["dfs_seen", "dfs_append"],
    },
  ],
};
