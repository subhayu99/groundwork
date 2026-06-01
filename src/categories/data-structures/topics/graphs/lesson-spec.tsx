"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge } from "@/shared/lesson/canvas";
import graphsPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* ── the social network: people (nodes) + friendships (undirected edges) ───── */
// Positions authored directly in the 860×470 canvas, kept clear of the top
// text panels (everything sits at y >= 150).
const POS: Record<string, { x: number; y: number }> = {
  alice:  { x: 335, y: 205 },
  bob:    { x: 185, y: 270 },
  cara:   { x: 505, y: 250 },
  harper: { x: 335, y: 310 },
  dan:    { x: 165, y: 360 },
  eli:    { x: 535, y: 345 },
  fawn:   { x: 325, y: 400 },
  grace:  { x: 485, y: 402 },
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
      <text x={VW / 2} y={170} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
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
    }, pace(1000));
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
      <text x={VW / 2} y={180} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
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
      <text x={VW / 2} y={170} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-hard)" }}>
        {lost} friendships (red, dashed) exist — but a tree can&rsquo;t hold them
      </text>
    </g>
  );
}

// "Adjacency list" — the graph beside its dict-of-neighbors text rows.
function AdjacencyList() {
  const rows = NAMES.map((id) => `${id}: [${neighborsOf(id).join(", ")}]`);
  const bx = 580, by = 205, lh = 22;
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
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: graphsPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I have the question",
      takeaway: "Some questions are about connections — friends, links, roads — that run any which way.",
      visual: idleGraph(),
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The setup",
        title: "Who knows whom?",
        body: <>Some questions are about <strong>connections</strong>: who&rsquo;s friends with whom, which web pages link to which, which roads join which towns. Here are eight people; a line means &ldquo;these two are friends.&rdquo;</>,
      }],
      detail: (
        <>
          <p>Some questions aren&rsquo;t about a single value or a tidy ranking &mdash; they&rsquo;re about how things are <strong>connected</strong>. Who&rsquo;s friends with whom. Which web pages link to which. Which roads join which towns. Which bus stops a route passes through.</p>
          <p>These connections don&rsquo;t flow neatly in one direction. Friendships go both ways. Web links point sideways and in circles. Bus routes loop through the same stop twice. The relationships are <em>arbitrary</em> &mdash; they can run between any two things, in any pattern.</p>
          <p>In the diagram below are eight people, and a line between two of them means &ldquo;these two are friends.&rdquo; We need a structure that can hold connections this free-form &mdash; and let us answer questions about them.</p>
        </>
      ),
      codeLabels: ["sig"],
    },
    {
      id: "forced-tree",
      label: "The obvious thing",
      connector: "Before inventing something new, try bending these connections into a shape we already know — a tree.",
      actionLabel: "Free the connections",
      takeaway: "A tree can't hold links that loop back — forcing one drops real connections.",
      visual: <ForcedTree />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The obvious thing",
        title: "Forcing it into a tree loses links.",
        body: <>A <em>tree</em> is a neat family chart: one top person, no lines ever loop back. Friendships that loop back (red, dashed) get dropped. We need something that allows any link.</>,
      }],
      detail: (
        <>
          <p>A <em>tree</em> is the neat shape we already know &mdash; like a family chart. There&rsquo;s one person at the top, each person below has exactly one parent above them, and no line ever loops back up. Everything flows in one direction.</p>
          <p>So you might try to root your friends into a tree: pick one person, hang their friends underneath as children, then their friends&rsquo; friends below that. The first couple of levels work fine.</p>
          <p>Then you reach a friend who is <em>already</em> on the chart from another branch &mdash; two people who share a friend, say. A tree has no slot for that second connection. So you either throw the link away (and lose real information), or you admit this just isn&rsquo;t a tree. In the diagram below, every link a tree must drop is drawn red and dashed.</p>
        </>
      ),
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "Since no single shape can hold these links, stop fighting them — just follow one link at a time and see what the bare minimum is.",
      actionLabel: "Nodes plus edges",
      takeaway: "Each step only needs one person's list of friends — that's the bare minimum to store.",
      visual: (api) => <ClickNeighbors api={api} />,
      panels: [
        {
          left: 60, top: 20, width: 600, variant: "main", label: "The instinct",
          title: "Click a person. Follow their links.",
          body: <>Click anyone &mdash; the people they&rsquo;re directly friends with light up. Each click just reads one person&rsquo;s list of friends, following the lines in any direction.</>,
        },
        {
          left: 565, top: 382, width: 285, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what is the smallest amount of record-keeping needed to answer &ldquo;who&rsquo;s connected to whom?&rdquo;</>,
        },
      ],
      detail: (
        <>
          <p>In the diagram below is a small social network. Click any person and their <em>direct</em> friends light up. Click one of those, and <em>their</em> friends light up in turn. You&rsquo;re just walking along the lines. To start over, use the &ldquo;↺ reset&rdquo; button below the people.</p>
          <p>Notice what each click actually costs: looking up one person&rsquo;s list of friends. Nothing more. And notice the lines run in every direction &mdash; not down from a single top, but across, between, and back &mdash; which is exactly why a tree couldn&rsquo;t hold this. Here, that&rsquo;s the whole point.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct question:</strong> what&rsquo;s the smallest amount of record-keeping the structure needs to answer &ldquo;who&rsquo;s connected to whom?&rdquo;
          </div>
        </>
      ),
      codeLabels: ["bfs_neighbors", "neighbors"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      connector: "If one click only ever needs one person's friend-list, that tells us exactly what to store.",
      actionLabel: "What operations?",
      takeaway: "A graph is dots (nodes) and lines (edges), stored as a lookup from each node to its neighbors.",
      visual: <AdjacencyList />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The structure",
        title: "A graph = dots + lines.",
        body: <>The answer: a <strong>graph</strong> &mdash; a set of dots (<em>nodes</em>, one per person) and lines (<em>edges</em>, one per friendship). Store it as an <em>adjacency list</em>: a lookup table from each person to the list of their friends. That&rsquo;s the whole structure.</>,
      }],
      detail: (
        <>
          <p>The answer is a <strong>graph</strong>: a set of <em>nodes</em> (the dots &mdash; here, one per person; also called <em>vertices</em>) and a set of <em>edges</em> (the lines &mdash; each one connecting a pair of nodes).</p>
          <p>Edges come in a few flavours. An edge can be <em>directed</em> &mdash; a one-way arrow, like a web link or a follow on social media. Or <em>undirected</em> &mdash; symmetric, true both ways, like a friendship or a road between two towns (that&rsquo;s what we have here). An edge can also be <em>weighted</em>, carrying a number such as distance or travel time.</p>
          <p>How do you store it? An <strong>adjacency list</strong>: a lookup table (a <em>hash map</em> &mdash; the dictionary type that jumps straight to an entry by its key, no scanning) from each node to the list of its neighbors. That&rsquo;s the whole structure, and in the diagram below you can see the full graph written out as just that table.</p>
        </>
      ),
      codeLabels: ["add_edge_a", "add_edge_b"],
    },
    {
      id: "traverse",
      label: "The operations",
      connector: "With the graph stored as that neighbor table, the interesting part begins: what you can run on top of it.",
      actionLabel: "When it fits",
      takeaway: "Walk it with BFS/DFS in O(V+E); a 'seen' set stops loops and finds shortest chains.",
      visual: (api) => <AutoBFS api={api} />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The operations",
        title: "Walk it: nearest friends first.",
        body: <>Watch a <em>breadth-first search</em> play out on its own: start at alice, visit her friends, then theirs, in rings. A &ldquo;seen&rdquo; set stops loops &mdash; and finds the shortest chain between people. Use the &ldquo;↺ replay&rdquo; button below to run it again.</>,
      }],
      detail: (
        <>
          <p>The structure is simple; the richness is in what you run on it. Watch a <strong>breadth-first search</strong> (BFS): start at alice, visit all her direct friends, then all of <em>their</em> friends, spreading outward in rings. Because it always reaches the nearest people first, it finds the <em>shortest chain</em> between two people. Its cost is written <code>O(V + E)</code> &mdash; the work grows in step with the number of nodes (<code>V</code>) plus the number of edges (<code>E</code>); roughly, you touch each person and each line once.</p>
          <p>Its sibling is <strong>depth-first search</strong> (DFS): instead of fanning out, it dives all the way down one path, then backs up and tries the next &mdash; same <code>O(V + E)</code> cost, and handy for spotting loops or separating clusters.</p>
          <p>One piece of bookkeeping is non-negotiable for both: a <strong>&ldquo;seen&rdquo; set</strong> (a hash map again) marking who you&rsquo;ve already visited. Without it, the loops in the graph would send you walking the same edge forever.</p>
        </>
      ),
      codeLabels: ["bfs_pop", "bfs_append", "bfs_neighbors", "bfs_seen"],
      interaction: "playback",
    },
    {
      id: "fits",
      visual: idleGraph(
        (id) => (id === "alice" || id === "harper" ? "trail" : undefined),
        (a, b) => ((a === "alice" || b === "alice" || a === "harper" || b === "harper") ? "trail" : undefined),
      ),
      label: "When it fits",
      connector: "Once you can store connections and walk them, the question becomes: which real problems are actually shaped like this?",
      actionLabel: "Name it",
      takeaway: "Reach for a graph whenever relationships matter and links can loop back.",
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "When it fits",
        title: "Anywhere you say 'the links between X.'",
        body: <>Reach for a graph whenever the <strong>relationships</strong> matter: social networks, maps and routes, web links, which software package needs which. If links only ever go one way down a hierarchy with no loops, a tree is simpler. Loops back? You&rsquo;ve got a graph.</>,
      }],
      detail: (
        <>
          <p>Reach for a graph any time the <strong>relationships</strong> are the main thing, not just the items. Social networks. Web crawlers following links. Maps and routes between places. Dependency graphs &mdash; which software package needs which, which build step needs which, which course is a prerequisite for which. State machines, knowledge graphs, recommendation systems all fit too.</p>
          <p>The dividing line is loops. If your connections are strictly hierarchical &mdash; one direction down, never circling back &mdash; a plain tree is simpler and you should use that. But the moment you keep finding links that loop back to something you&rsquo;ve already placed, you&rsquo;ve graduated to a graph.</p>
        </>
      ),
      codeLabels: ["dfs_neighbors", "dfs_recurse"],
    },
    {
      id: "name",
      label: "The structure",
      connector: "Everything fits the same shape — so give that shape its name.",
      takeaway: "It's a Graph — a tiny neighbor table whose richness is the walks you run on it.",
      visual: idleGraph(),
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The structure",
        title: "Graph.",
        body: <>That&rsquo;s the name. The structure is tiny &mdash; a table from each node to its neighbors. The richness is in what you run on it: breadth-first or depth-first walks (dive deep down one path, then back up), shortest routes, spotting separate clusters.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: a <strong>graph</strong>. The vocabulary around it is dense for how small the idea is &mdash; <em>vertex</em> (a node), <em>edge</em> (a connection), <em>degree</em> (how many edges a node has), <em>cycle</em> (a path that loops back to where it started), <em>path</em> (a chain of edges from one node to another), <em>connected component</em> (a clump of nodes all reachable from each other), <em>weight</em> (a cost on an edge), and <em>directed acyclic graph</em> &mdash; a DAG, meaning one-way edges with no loops, which is exactly what a build system or a Git history is.</p>
          <p>But the data structure underneath all that vocabulary is the simplest one we&rsquo;ve seen: a table from each node to a list of its neighbors. The real richness lives in the algorithms you run on top &mdash; breadth-first or depth-first walks (fan out in rings, or dive deep down one path and back up), shortest routes, spotting separate clusters.</p>
          <p>Open the code drawer for the BFS and DFS skeletons.</p>
        </>
      ),
      codeLabels: ["dfs_seen", "dfs_append"],
    },
  ],
};
