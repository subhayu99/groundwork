"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
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

/* ── PREDICTION GATE + playback: commit to the walk's shape, THEN watch it ────
 * The gate is the traverse beat's real interaction (interaction: "wedge"): one
 * tap on a pill fires api.onInteractionDone() inside PredictGate, feedback
 * shows, and after a short reading pause the AutoBFS playback answers the
 * prediction with the actual ring-by-ring spread. HTML hosted on the SVG
 * canvas via <foreignObject> (per Predict.tsx — the panel layers are
 * pointer-events-none); data-canvas-panel opts it into the scene layout's
 * content-extent measurement. Pre-reveal the graph sits idle with only the
 * start node lit, so nothing about the visiting order is spoiled. */
const GATE = { x: 575, y: 188, w: 272, h: 264 };

function BfsOrderGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoBFS api={api} />;

  return (
    <g>
      <NodeGraph nodes={baseNodes((id) => (id === START ? "active" : undefined))} edges={baseEdges()} />
      <text x={335} y={170} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        a walk starts at alice — commit to its shape, then watch
      </text>
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="The walk starts at alice. Who gets visited, in what shape?"
            choices={[
              { id: "rings", label: "in rings — friends, then friends-of-friends", correct: true, note: "a waiting line serves the nearest people first — watch the rings spread" },
              { id: "deep", label: "one deep path, then back up", note: "that's the depth-first sibling — this walk uses a waiting line, so nearest goes first" },
              { id: "twice", label: "around the loops — some visited twice", note: "a 'seen' list remembers everyone already met, so nobody is visited twice" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1800)); }}
          />
        </div>
      </foreignObject>
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

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, forced-tree, wedge, structure, traverse,
 *                fits, name)
 *   structured : 5 — cuts `forced-tree` (slot-2 naive, folded into the wedge's
 *                connector) and `fits` (slot-6 generalization)
 *   rigorous   : 3 — `structure` (the model + invariant; opens here) +
 *                `traverse` (costs counted + edge cases, gate included) +
 *                `name` (close + stamp)
 *   refresh    : additionally trims `forced-tree` + `fits` (trimOnRefresh).   */
export const graphsLesson: LessonSpec = {
  topicTitle: "graphs · who knows whom",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: graphsPy as string,
  // standing on trees (the bridge anchor, per TRACK-NARRATIVES.md): branching
  // with one parent each and no loops — graphs drop both rules.
  bridgeFrom: reg({
    base: "A tree gave every node one parent and no loops back — now drop both rules and let anything link to anything.",
    intuitive: "In a tree every box hangs under exactly one parent and lines never loop back — this lesson frees the lines completely.",
    rigorous: "Trees: connected, acyclic, one parent each — relax acyclicity and the parent rule and you have the general structure.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 17): write the connections down
  // once — an O(V + E) ledger — and look them up instantly; the space-for-time
  // deal applied to connectivity, closing the data-structures track.
  principle: { key: "trade-space-for-time", n: 5, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: reg({
        base: "Some questions are about connections — friends, links, roads — that run any which way.",
        intuitive: "Friends, links, roads — connections run any which way; we need a shape that holds them.",
      }),
      visual: idleGraph(),
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The setup",
        title: "Who knows whom?",
        body: reg({
          base: <>Some questions are about <strong>connections</strong>: who&rsquo;s friends with whom, which web pages link to which, which roads join which towns. Here are eight people; a line means &ldquo;these two are friends.&rdquo;</>,
          intuitive: <>Eight people, and a line wherever two of them are friends. Lots of everyday questions live in pictures like this &mdash; who knows whom, which pages link where, which roads join which towns. The lines run any which way. How do you <em>store</em> that?</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Some questions aren&rsquo;t about a single value or a tidy ranking &mdash; they&rsquo;re about how things are <strong>connected</strong>. Who&rsquo;s friends with whom. Which web pages link to which. Which roads join which towns. Which bus stops a route passes through.</p>
            <p>These connections don&rsquo;t flow neatly in one direction. Friendships go both ways. Web links point sideways and in circles. Bus routes loop through the same stop twice. The relationships are <em>arbitrary</em> &mdash; they can run between any two things, in any pattern.</p>
            <p>In the diagram below are eight people, and a line between two of them means &ldquo;these two are friends.&rdquo; We need a structure that can hold connections this free-form &mdash; and let us answer questions about them.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Start with the picture below: eight people, and a line wherever two of them are friends. That&rsquo;s the whole setup &mdash; no first place, no order, just connections.</p>
            <p>And the connections are messy on purpose. Friendships go both ways. Web pages link sideways and in circles. A bus route can loop through the same stop twice. The links can run between any two things, in any pattern at all.</p>
            <p>So the question this lesson chases: what is the simplest way to <em>write down</em> something this free-form &mdash; and still answer questions about it, like &ldquo;how is alice connected to grace?&rdquo;</p>
          </>
        ),
      }),
      codeLabels: ["sig"],
    },
    {
      id: "forced-tree",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
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
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "Since no single shape can hold these links, stop fighting them — just follow one link at a time and see what the bare minimum is.",
        intuitive: "These links refuse to be a tree — so stop forcing shapes and just follow one link at a time, to see what the bare minimum is.",
        structured: "A tree can't hold these links — anything that loops back gets dropped. So stop forcing shapes: follow one link at a time and see what the bare minimum to store is.",
      }),
      actionLabel: "Nodes plus edges",
      takeaway: reg({
        base: "Each step only needs one person's list of friends — that's the bare minimum to store.",
        intuitive: "One click = one person's friend list — that's all the structure ever needs to hand over.",
      }),
      visual: (api) => <ClickNeighbors api={api} />,
      panels: [
        {
          left: 60, top: 20, width: 600, variant: "main", label: "The instinct",
          title: "Click a person. Follow their links.",
          body: reg({
            base: <>Click anyone &mdash; the people they&rsquo;re directly friends with light up. Each click just reads one person&rsquo;s list of friends, following the lines in any direction.</>,
            intuitive: <>Click anyone in the picture &mdash; their direct friends light up. Notice the price of a click: it reads <strong>one person&rsquo;s friend list</strong>, nothing more, following the lines in any direction.</>,
          }),
        },
        {
          left: 565, top: 382, width: 285, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what is the smallest amount of record-keeping needed to answer &ldquo;who&rsquo;s connected to whom?&rdquo;</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>In the diagram below is a small social network. Click any person and their <em>direct</em> friends light up. Click one of those, and <em>their</em> friends light up in turn. You&rsquo;re just walking along the lines. To start over, use the &ldquo;↺ reset&rdquo; button below the people.</p>
            <p>Notice what each click actually costs: looking up one person&rsquo;s list of friends. Nothing more. And notice the lines run in every direction &mdash; not down from a single top, but across, between, and back &mdash; which is exactly why a tree couldn&rsquo;t hold this. Here, that&rsquo;s the whole point.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> what&rsquo;s the smallest amount of record-keeping the structure needs to answer &ldquo;who&rsquo;s connected to whom?&rdquo;
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Try it on the picture: click any person and their <em>direct</em> friends light up. Click one of those, and <em>their</em> friends light up in turn. You&rsquo;re just walking along the lines, one step at a time. (The &ldquo;↺ reset&rdquo; button below the people starts you over.)</p>
            <p>Now notice what each click actually cost: the picture handed you <strong>one person&rsquo;s list of friends</strong>. Not the whole network &mdash; one short list. And the lines run every direction &mdash; across, between, back &mdash; the very thing a family chart can&rsquo;t allow is the thing you&rsquo;re happily using.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> if every step only ever asks for one person&rsquo;s friend list, what is the least the structure has to write down?
            </div>
          </>
        ),
      }),
      codeLabels: ["bfs_neighbors", "neighbors"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "If one click only ever needs one person's friend-list, that tells us exactly what to store.",
        rigorous: "",
      }),
      actionLabel: "What operations?",
      takeaway: reg({
        base: "A graph is dots (nodes) and lines (edges), stored as a lookup from each node to its neighbors.",
        intuitive: "A graph is dots and lines, stored as a table: each node maps to its list of neighbors.",
        rigorous: "Adjacency list: node → neighbors; V rows plus an entry per edge end — O(V + E) space.",
      }),
      visual: <AdjacencyList />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The structure",
        title: reg({
          base: "A graph = dots + lines.",
          rigorous: "G = (V, E), stored by neighbor.",
        }),
        body: reg({
          base: <>The answer: a <strong>graph</strong> &mdash; a set of dots (<em>nodes</em>, one per person) and lines (<em>edges</em>, one per friendship). Store it as an <em>adjacency list</em>: a lookup table from each person to the list of their friends. That&rsquo;s the whole structure.</>,
          intuitive: <>The answer: a <Term word="graph">graph</Term> &mdash; dots (<em>nodes</em>, one per person) joined by lines (<em>edges</em>, one per friendship). Store it as a table from each person to the list of their friends &mdash; every friendship written down once, looked up instantly. That table is the whole structure.</>,
          rigorous: <>A graph G = (V, E): nodes plus edges, each edge a pair of nodes. Storage: an <em>adjacency list</em> &mdash; a <Term word="hash map">hash map</Term> from node to neighbor row; an undirected edge lands in both endpoints&rsquo; rows. Count it: V rows, one entry per edge end &mdash; <Term word="O(V + E)"><code>O(V + E)</code></Term> space, and any node&rsquo;s row is one lookup.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The answer is a <strong>graph</strong>: a set of <em>nodes</em> (the dots &mdash; here, one per person; also called <em>vertices</em>) and a set of <em>edges</em> (the lines &mdash; each one connecting a pair of nodes).</p>
            <p>Edges come in a few flavours. An edge can be <em>directed</em> &mdash; a one-way arrow, like a web link or a follow on social media. Or <em>undirected</em> &mdash; symmetric, true both ways, like a friendship or a road between two towns (that&rsquo;s what we have here). An edge can also be <em>weighted</em>, carrying a number such as distance or travel time.</p>
            <p>How do you store it? An <strong>adjacency list</strong>: a lookup table (a <em>hash map</em> &mdash; the dictionary type that jumps straight to an entry by its key, no scanning) from each node to the list of its neighbors. That&rsquo;s the whole structure, and in the diagram below you can see the full graph written out as just that table.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The answer has a name: a <Term word="graph">graph</Term>. The dots are <Term word="node">nodes</Term> (one per person) and the lines are <em>edges</em> &mdash; just &ldquo;connections,&rdquo; each joining two nodes.</p>
            <p>And the storage is exactly what the clicking suggested: write down, for each person, the list of their friends. A lookup table &mdash; a <Term word="hash map">hash map</Term>, the dictionary that jumps straight to an entry by name &mdash; from each node to its list of neighbors. People call that table an <strong>adjacency list</strong> (&ldquo;adjacent&rdquo; just means &ldquo;next to&rdquo;). The panel beside the picture is our whole network written out as that table.</p>
            <p>Feel the deal it makes: every friendship is written down once (in both friends&rsquo; rows), and from then on &ldquo;who are alice&rsquo;s friends?&rdquo; is one instant lookup &mdash; never a search through the whole network.</p>
            <p>Small variations, same table: a one-way link (a follow, not a friendship) goes in only one row; a link can also carry a number, like a road&rsquo;s length.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model.</strong> G = (V, E): a node set and an edge set, each edge a pair of nodes. The adjacency list stores E grouped by endpoint &mdash; a <Term word="hash map">hash map</Term> from node to neighbor row. The invariant for the undirected case: v appears in adj[u] exactly when u appears in adj[v] &mdash; one edge, two row entries; the table <em>is</em> the edge set, grouped for lookup.</p>
            <p><strong>Count the storage:</strong> V rows, one entry per edge end &mdash; 2E entries total. That store is <Term word="O(V + E)"><code>O(V + E)</code></Term> space. Fetching adj[u] is one hash lookup; scanning u&rsquo;s neighbors costs deg(u), the row&rsquo;s length; testing a single edge u&ndash;v is O(deg(u)) on lists, O(1) expected if rows are <Term word="hash set">hash sets</Term>. The dense alternative &mdash; a V&times;V matrix &mdash; buys O(1) edge tests for O(V&sup2;) space; real graphs are sparse, so the list is the default.</p>
            <p>Directed: drop the symmetry, one row entry per edge. Weighted: rows hold (neighbor, weight) pairs. The structure does not change.</p>
          </>
        ),
      }),
      codeLabels: ["add_edge_a", "add_edge_b"],
    },
    {
      id: "traverse",
      label: "The operations",
      connector: reg({
        base: "With the graph stored as that neighbor table, the interesting part begins: what you can run on top of it.",
        rigorous: "Storage settled — the costs live in the walks you run on it. Commit to a prediction first.",
      }),
      actionLabel: reg({
        base: "When it fits",
        structured: "Name it",
        rigorous: "Name it",
      }),
      takeaway: reg({
        base: "Walk it with BFS/DFS in O(V+E); a 'seen' set stops loops and finds shortest chains.",
        intuitive: "A walk touches each person and line once — that's O(V + E); a 'seen' list stops loops.",
        rigorous: "BFS/DFS run in O(V + E); marking seen at enqueue is what kills the cycles.",
      }),
      visual: (api) => <BfsOrderGate api={api} />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The operations",
        title: "Walk it: nearest friends first.",
        body: reg({
          base: <>Watch a <em>breadth-first search</em> play out on its own: start at alice, visit her friends, then theirs, in rings. A &ldquo;seen&rdquo; set stops loops &mdash; and finds the shortest chain between people. Use the &ldquo;↺ replay&rdquo; button below to run it again.</>,
          intuitive: <>Predict the walk&rsquo;s shape, then watch: from alice, a waiting line visits her friends, then theirs &mdash; rings. A &ldquo;seen&rdquo; list stops the loops. Count as it runs: each person visited once, each line looked down once.</>,
          rigorous: <>BFS: a queue plus a seen set, marked at enqueue. Predict the visiting order, then count the playback: V dequeues, every neighbor row scanned once &mdash; 2E entries. That count, named, is <Term word="O(V + E)"><code>O(V + E)</code></Term> &mdash; and nearest-first makes hop-distances minimal.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The structure is simple; the richness is in what you run on it. Watch a <strong>breadth-first search</strong> (BFS): start at alice, visit all her direct friends, then all of <em>their</em> friends, spreading outward in rings. Because it always reaches the nearest people first, it finds the <em>shortest chain</em> between two people. Its cost is written <code>O(V + E)</code> &mdash; the work grows in step with the number of nodes (<code>V</code>) plus the number of edges (<code>E</code>); roughly, you touch each person and each line once.</p>
            <p>Its sibling is <strong>depth-first search</strong> (DFS): instead of fanning out, it dives all the way down one path, then backs up and tries the next &mdash; same <code>O(V + E)</code> cost, and handy for spotting loops or separating clusters.</p>
            <p>One piece of bookkeeping is non-negotiable for both: a <strong>&ldquo;seen&rdquo; set</strong> (a <Term word="hash set">hash set</Term> &mdash; like a dict but storing keys only, no values) marking who you&rsquo;ve already visited. Without it, the loops in the graph would send you walking the same edge forever.</p>
            <p>One honest edge: a walk only reaches people <em>connected</em> to its start. A graph can hold separate islands &mdash; covering everyone means restarting from each person not yet seen.</p>
          </>
        ),
        intuitive: (
          <>
            <p>You predicted the shape &mdash; now count what actually happened. Starting at alice, the walk kept a simple waiting line: visit the person at the front, add their not-yet-seen friends to the back. Friends first, then friends-of-friends &mdash; rings. And because nearer people always reach the front sooner, the ring someone lands in <em>is</em> their distance from alice: the walk finds the shortest chain between two people for free.</p>
            <p>The bookkeeping that makes it safe: a &ldquo;seen&rdquo; list (a <Term word="hash set">hash set</Term> &mdash; like a dict that stores only names, no values) of everyone already met. Without it, the loops in the picture would send the walk around in circles forever.</p>
            <p>Now the price, counted on the picture: 8 people, each visited once; 11 friendships, each looked down once from each end. Person-count plus line-count &mdash; nothing more. Work that grows like that is written <Term word="O(V + E)"><code>O(V + E)</code></Term> &mdash; V for the nodes, E for the edges. The walk you watched is called <strong>breadth-first search</strong> (BFS); its sibling, <strong>depth-first search</strong> (DFS), dives down one path and backs up &mdash; same count.</p>
            <p>One honest edge: a walk only finds people <em>connected</em> to the start. If someone has no chain to alice at all &mdash; a separate island &mdash; no walk from alice will ever reach them.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The mechanism.</strong> BFS: a <Term word="FIFO">FIFO</Term> queue plus a seen set; mark seen at <em>enqueue</em>, not dequeue &mdash; that keeps each node in the queue at most once. Each node is dequeued once; each adjacency row is scanned once; row lengths sum to 2E. Total: V dequeues plus 2E neighbor checks &mdash; that count, named: <Term word="O(V + E)"><code>O(V + E)</code></Term> time, O(V) extra space for queue plus seen.</p>
            <p><strong>Why distances are minimal:</strong> the queue holds nodes in nondecreasing distance from the start &mdash; distance-d nodes are enqueued only while processing distance d&minus;1 &mdash; so the first arrival at any node is via a minimum-hop path. DFS swaps the queue for a stack (or the call stack): same O(V + E) bound, no distance guarantee; its yield is structure &mdash; cycle detection, connected components, topological order on DAGs.</p>
            <p><strong>Edge cases.</strong> Disconnected graph: one traversal covers only the start&rsquo;s component &mdash; covering V means restarting from every unseen node. Single node: the walk visits exactly it. Omit the seen set and any cycle makes the walk non-terminating &mdash; the set is correctness, not an optimization. Recursive DFS reaches depth V on a path-shaped graph &mdash; an explicit stack avoids overflow.</p>
          </>
        ),
      }),
      codeLabels: ["bfs_pop", "bfs_append", "bfs_neighbors", "bfs_seen"],
      interaction: "wedge",
    },
    {
      id: "fits",
      visual: idleGraph(
        (id) => (id === "alice" || id === "harper" ? "trail" : undefined),
        (a, b) => ((a === "alice" || b === "alice" || a === "harper" || b === "harper") ? "trail" : undefined),
      ),
      label: "When it fits",
      registers: ["intuitive"],
      trimOnRefresh: true,
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
      label: "Graph",
      connector: reg({
        base: "Everything fits the same shape — so give that shape its name.",
        intuitive: "Dots, lines, a table, a walk — one shape under all of it. Give that shape its name.",
        structured: "Table stored, walks priced — the shape has earned its name.",
        rigorous: "Name it, and file it under the idea it carries.",
      }),
      takeaway: reg({
        base: "It's a Graph — a tiny neighbor table whose richness is the walks you run on it.",
        intuitive: "A graph is the write-once neighbor table: connections stored once, looked up instantly.",
        rigorous: "Graph = adjacency list: store edges once, query neighbors instantly — space for time.",
      }),
      visual: idleGraph(),
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The structure",
        title: "Graph.",
        body: reg({
          base: <>That&rsquo;s the name. The structure is tiny &mdash; a table from each node to its neighbors. The richness is in what you run on it: breadth-first or depth-first walks (dive deep down one path, then back up), shortest routes, spotting separate clusters.</>,
          intuitive: <>The name: a <Term word="graph">graph</Term> &mdash; and you derived the whole thing: dots, lines, and a table from each person to their friends. A tiny structure with endless walks on top: rings outward for shortest chains, deep dives for clusters and loops.</>,
          rigorous: <>A graph &mdash; and you hold its standard form: hash map node &rarr; neighbors, <Term word="O(V + E)"><code>O(V + E)</code></Term> space, O(V + E) traversals. Every structure in this track reappears here: the map stores it, the queue and the stack walk it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: a <strong>graph</strong>. The vocabulary around it is dense for how small the idea is &mdash; <em>vertex</em> (a node), <em>edge</em> (a connection), <em>degree</em> (how many edges a node has), <em>cycle</em> (a path that loops back to where it started), <em>path</em> (a chain of edges from one node to another), <em>connected component</em> (a clump of nodes all reachable from each other), <em>weight</em> (a cost on an edge), and <em>directed acyclic graph</em> &mdash; a DAG, meaning one-way edges with no loops, which is exactly what a build system or a Git history is.</p>
            <p>But the data structure underneath all that vocabulary is the simplest one we&rsquo;ve seen: a table from each node to a list of its neighbors. The real richness lives in the algorithms you run on top &mdash; breadth-first or depth-first walks (fan out in rings, or dive deep down one path and back up), shortest routes, spotting separate clusters.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 5 of 7 &mdash; trade space for time:</strong> write every connection down once &mdash; an <code>O(V + E)</code> table &mdash; and &ldquo;who connects to X?&rdquo; never scans the network again.
            </div>
            <p>Open the code drawer for the BFS and DFS skeletons.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The shape has a name: a <Term word="graph">graph</Term>. The word-kit around it is bigger than the structure itself &mdash; a node is also called a <em>vertex</em>; a node&rsquo;s <em>degree</em> is how many lines touch it; a <em>path</em> is a chain of lines; a <em>cycle</em> is a path that loops back to its start; a <em>connected component</em> is one island of mutually reachable people.</p>
            <p>But under all the vocabulary sits the smallest structure of this whole track: a table from each node to its list of neighbors. The richness was never in the table &mdash; it&rsquo;s in the walks you run on it: rings outward for shortest chains, deep dives for spotting clusters and loops.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 5 of 7 &mdash; trade space for time:</strong> spend a table that writes every connection down once, and &ldquo;who connects to whom?&rdquo; is never searched for again &mdash; the hash map&rsquo;s deal, now holding a whole web.
            </div>
            <p>Open the code drawer for the BFS and DFS skeletons &mdash; both walks get full lessons of their own in the algorithms track.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Graph: G = (V, E), stored as an adjacency list. Vocabulary, compressed: vertex = node; degree(u) = the size of adj[u]; path = a chain of edges; cycle = a closed path; connected component = a maximal mutually-reachable set; DAG = directed acyclic graph &mdash; one-way edges, no cycles (build systems, Git histories). Under all of it: one hash map.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 5 of 7 &mdash; trade space for time:</strong> <code>O(V + E)</code> space buys neighbor enumeration that never scans the edge set &mdash; the precomputed-lookup deal, applied to connectivity.
            </div>
            <p>BFS and DFS get their own lessons in the algorithms track; the skeletons are in the code drawer.</p>
          </>
        ),
      }),
      codeLabels: ["dfs_seen", "dfs_append"],
    },
  ],
};
