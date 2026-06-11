"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import {
  GridCells,
  gridGeom,
  NodeGraph,
  StackBoxes,
  type GNode,
  type GEdge,
  type StackBox,
} from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import bfsPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860,
  VH = 470;

/* The maze, identical to the topic's visualizer. 0 = open, 1 = wall. */
const GRID: number[][] = [
  [0, 0, 0, 0, 1],
  [1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
];
const ROWS = GRID.length;
const COLS = GRID[0].length;
const START: [number, number] = [0, 0];
const GOAL: [number, number] = [ROWS - 1, COLS - 1];

/* Centered grid geometry. cellPx 44 keeps all 5 rows in the MIDDLE band
   (y0 200 → bottom 452), so it sits clear below the top panel band and leaves
   no big bottom dead-space. x0 = 304, centered in the 860 canvas. */
const GG = gridGeom(ROWS, COLS, VW, 208, 44, 8);
/* The queue beats pair the maze with a queue column. Using vw=678 puts the grid
   at x0=213 so grid (213→465) + a queue column to its right are CENTERED as a
   unit in the 860 canvas — no left-stranding, no overlap. */
const GGq = gridGeom(ROWS, COLS, 678, 208, 44, 8);

const key = (r: number, c: number) => `${r},${c}`;
const isStart = (r: number, c: number) => r === START[0] && c === START[1];
const isGoal = (r: number, c: number) => r === GOAL[0] && c === GOAL[1];

/* BFS neighbour order — mirrors algorithm.py: up, down, left, right. */
const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function openUnseen(r: number, c: number, seen: Set<string>) {
  return (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    GRID[r][c] === 0 &&
    !seen.has(key(r, c))
  );
}

/* Tone for a maze cell. Rings are toned by distance so closer cells read
   warmer/brighter than far ones — the "closest first" story, visually. */
function ringTone(
  r: number,
  c: number,
  current: [number, number] | null,
  distances: Record<string, number>,
  maxRing: number,
): Tone {
  if (GRID[r][c] === 1) return "wall";
  if (current && current[0] === r && current[1] === c) return "active";
  const d = distances[key(r, c)];
  if (typeof d === "number") {
    if (isGoal(r, c)) return "good";
    if (isStart(r, c)) return "start";
    // ring 0..maxRing: nearest rings glow as "trail", farther as "visited".
    return d <= Math.max(1, Math.ceil(maxRing / 2)) ? "trail" : "visited";
  }
  if (isStart(r, c)) return "start";
  if (isGoal(r, c)) return "goal";
  return "idle";
}

function content(r: number, c: number): string | undefined {
  if (isStart(r, c)) return "S";
  if (isGoal(r, c)) return "G";
  return undefined;
}

/* A maze drawing keyed off a distance map (used by ripple + playback beats). */
function flood(
  geom: typeof GG,
  current: [number, number] | null,
  distances: Record<string, number>,
  showDist: boolean,
) {
  const maxRing = Object.values(distances).reduce((m, d) => Math.max(m, d), 0);
  return (
    <GridCells
      rows={ROWS}
      cols={COLS}
      geom={geom}
      cell={(r, c) => {
        const d = distances[key(r, c)];
        return {
          tone: ringTone(r, c, current, distances, maxRing),
          content: content(r, c),
          sub:
            showDist && typeof d === "number" && GRID[r][c] === 0 ? d : undefined,
        };
      }}
    />
  );
}

const emptyDist: Record<string, number> = {};
const seedDist: Record<string, number> = { [key(START[0], START[1])]: 0 };

/* ── Ring math: spread one ring outward, like the visualizer's nextRing ─────── */
interface Ripple {
  distances: Record<string, number>;
  ring: number;
  goalAt: number | null;
}
const initRipple = (): Ripple => ({ distances: { ...seedDist }, ring: 0, goalAt: null });

function nextRing(s: Ripple): Ripple {
  const frontier: [number, number][] = [];
  Object.entries(s.distances).forEach(([k, d]) => {
    if (d === s.ring) {
      const [r, c] = k.split(",").map(Number);
      frontier.push([r, c]);
    }
  });
  const distances = { ...s.distances };
  let goalAt = s.goalAt;
  for (const [r, c] of frontier) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr,
        nc = c + dc;
      if (openUnseen(nr, nc, new Set(Object.keys(distances)))) {
        distances[key(nr, nc)] = s.ring + 1;
        if (isGoal(nr, nc) && goalAt === null) goalAt = s.ring + 1;
      }
    }
  }
  return { distances, ring: s.ring + 1, goalAt };
}

/* ── Beat 3 WEDGE: press play / step the ripple until it touches G ──────────── */
function Ripples({ api }: { api: BeatVisualApi }) {
  const [s, setS] = useState<Ripple>(initRipple);
  const ref = useRef(s);
  ref.current = s;
  const playing = useRef(false);

  const stepOnce = () => {
    api.onInteractionDone();
    setS((c) => (c.goalAt !== null ? c : nextRing(c)));
  };

  const play = () => {
    api.onInteractionDone();
    if (playing.current) return;
    playing.current = true;
    const id = setInterval(() => {
      const c = ref.current;
      if (c.goalAt !== null) {
        playing.current = false;
        clearInterval(id);
        return;
      }
      setS(nextRing(c));
    }, pace(480));
  };

  const reset = () => {
    playing.current = false;
    setS(initRipple());
  };

  const cellsReached = Object.keys(s.distances).length;
  const gx = GG.x0 + COLS * (GG.cellPx + GG.gap) + 18;
  const gy = GG.cy(2, 0);

  const btn = (
    y: number,
    label: string,
    onClick: () => void,
    aria: string,
    color = "var(--text-muted)",
  ) => (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={aria}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <rect x={gx} y={y} width={96} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={gx + 48} y={y + 13} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: color }}>
        {label}
      </text>
    </g>
  );

  return (
    <g>
      {flood(GG, null, s.distances, true)}
      <text
        x={gx}
        y={gy - 40}
        textAnchor="start"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: s.goalAt !== null ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {s.goalAt !== null ? `reached G at distance ${s.goalAt}` : `ring ${s.ring} · reached ${cellsReached}`}
      </text>
      {btn(gy - 26, "▶ play", play, "play", "var(--accent-ink)")}
      {btn(gy, "step ring", stepOnce, "step ring")}
      {btn(gy + 26, "↺ reset", reset, "reset")}
    </g>
  );
}

/* ── Beats 4-5 PLAYBACK: BFS with a live queue beside the maze ──────────────── */
interface BfsState {
  queue: { cell: [number, number]; d: number }[];
  seen: Set<string>;
  distances: Record<string, number>;
  active: [number, number] | null;
  goalAt: number | null;
  done: boolean;
}
const initBfs = (): BfsState => ({
  queue: [{ cell: [...START] as [number, number], d: 0 }],
  seen: new Set([key(START[0], START[1])]),
  distances: { ...seedDist },
  active: null,
  goalAt: null,
  done: false,
});

function bfsStep(s: BfsState): { next: BfsState; line: string[] } {
  if (s.done) return { next: s, line: [] };
  if (s.queue.length === 0) return { next: { ...s, done: true, active: null }, line: ["loop"] };
  const [head, ...rest] = s.queue;
  const [r, c] = head.cell;
  if (isGoal(r, c)) {
    return {
      next: { ...s, active: head.cell, goalAt: head.d, done: true },
      line: ["visit", "found"],
    };
  }
  const queue = [...rest];
  const seen = new Set(s.seen);
  const distances = { ...s.distances };
  const line: string[] = ["dequeue"];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr,
      nc = c + dc;
    if (openUnseen(nr, nc, seen)) {
      seen.add(key(nr, nc));
      line.push("mark");
      distances[key(nr, nc)] = head.d + 1;
      queue.push({ cell: [nr, nc], d: head.d + 1 });
      line.push("enqueue");
    }
  }
  return {
    next: { ...s, queue, seen, distances, active: head.cell, done: false },
    line: [...new Set(line)],
  };
}

function AutoBfs({ api, frozen }: { api: BeatVisualApi; frozen?: boolean }) {
  const [s, setS] = useState<BfsState>(initBfs);
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    if (frozen) return;
    api.onActiveLine(["init_queue"]);
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const { next, line } = bfsStep(c);
      if (line.length) api.onActiveLine(line);
      setS(next);
    }, pace(460));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* For the frozen Beat-5 panel, fast-forward to the solved maze once. */
  const display: BfsState = frozen ? solvedBfs : s;

  const qx = GGq.x0 + COLS * (GGq.cellPx + GGq.gap) + 36; // queue column, right gutter
  const qTop = GGq.y0 + 16;
  const QMAX = 6; // queue rows that fit cleanly in the middle band
  const QBOX = 25, QGAP = 5, QSTRIDE = QBOX + QGAP;
  const shown = display.queue.slice(0, QMAX);
  const items: StackBox[] = shown.map((q, i) => ({
    key: `${key(q.cell[0], q.cell[1])}-${i}`,
    label: `(${q.cell[0]},${q.cell[1]})`,
    sub: `d=${q.d}`,
    tone: "accent" as Tone,
  }));
  const qEnd = qTop + QMAX * QSTRIDE; // y just below the last queue box

  return (
    <g>
      {flood(GGq, display.active, display.distances, true)}
      {/* queue column header */}
      <text x={qx} y={qTop - 10} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
        queue · front on top
      </text>
      {items.length > 0 ? (
        <StackBoxes items={items} cx={qx} top={qTop} width={132} boxH={QBOX} gap={QGAP} topOnTop={false} />
      ) : (
        <text x={qx} y={qTop + 16} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
          empty
        </text>
      )}
      {display.queue.length > QMAX && (
        <text x={qx} y={qEnd + 4} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
          +{display.queue.length - QMAX} more
        </text>
      )}
      {/* status — bottom-left gutter, clear of the top panel band and the grid */}
      <text
        x={70}
        y={430}
        textAnchor="start"
        className="font-mono select-none"
        style={{ fontSize: 12, fill: display.goalAt !== null ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {display.goalAt !== null
          ? `✓ shortest distance ${display.goalAt}`
          : `seen ${display.seen.size}`}
      </text>
      {!frozen && (
        <g
          onClick={() => setS(initBfs())}
          style={{ cursor: "pointer" }}
          tabIndex={0}
          role="button"
          aria-label="replay"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setS(initBfs());
            }
          }}
        >
          <rect x={qx - 36} y={qEnd + 14} width={72} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
          <text x={qx} y={qEnd + 27} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
            ↺ replay
          </text>
        </g>
      )}
    </g>
  );
}

/* Precompute the fully-flooded maze for the frozen Beat-5 frame. */
const solvedBfs: BfsState = (() => {
  let s = initBfs();
  for (let i = 0; i < 200 && !s.done; i++) s = bfsStep(s).next;
  // keep flooding all reachable cells (ignore early goal stop) for the frozen view
  let r = initRipple();
  while (r.ring < ROWS + COLS && Object.keys(r.distances).length < ROWS * COLS) {
    const before = Object.keys(r.distances).length;
    r = nextRing(r);
    if (Object.keys(r.distances).length === before) break;
  }
  return { ...s, distances: r.distances, queue: [], active: null, goalAt: s.goalAt };
})();

/* ── Beat 4 PREDICTION GATE + playback: commit to the queue's discipline, THEN
 * watch BFS run it. The ripple (beat 3) showed the ORDER we want; the one open
 * design question is where newcomers join the waiting line so that order holds.
 * One tap on a pill is the real interaction (interaction: "wedge"; PredictGate
 * fires api.onInteractionDone()), then after a short reading pause the AutoBfs
 * playback answers the prediction — the queue column appears exactly where the
 * gate sat, and rings come off the front in distance order. The gate is HTML
 * hosted on the SVG canvas via <foreignObject>; data-canvas-panel opts it into
 * the scene layout's content-extent measurement. */
function QueueOrderGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoBfs api={api} />;

  return (
    <g>
      {flood(GGq, null, seedDist, true)}
      <text x={70} y={430} textAnchor="start" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        S waits in the line at distance 0
      </text>
      <foreignObject x={486} y={200} width={356} height={256} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Discovered cells wait in a line; we always serve the front. Where must newcomers join so the closest is always served first?"
            choices={[
              { id: "back", label: "at the back — first found, first served", correct: true, note: "first in, first out — the rings come off the line in distance order" },
              { id: "front", label: "at the front — newest first", note: "newest-first turns the line into a stack — that's the deep dive again, not rings" },
              { id: "any", label: "anywhere — order won't matter", note: "it does: served out of order, a cell can be reached the long way round first and get too big a number" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── Beat 2 static: DFS finds a path — not necessarily the shortest ─────────── */
const DFS_TRAIL: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 4],
  [4, 4],
];
function DfsContrast() {
  const trail = new Set(DFS_TRAIL.map(([r, c]) => key(r, c)));
  return (
    <g>
      <GridCells
        rows={ROWS}
        cols={COLS}
        geom={GG}
        cell={(r, c) => {
          let tone: Tone = "idle";
          if (GRID[r][c] === 1) tone = "wall";
          else if (trail.has(key(r, c))) tone = "trail";
          return { tone, content: content(r, c) };
        }}
      />
      <text x={GG.x0 + COLS * (GG.cellPx + GG.gap)} y={GG.y0 - 14} textAnchor="end" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        depth-first · 8 steps
      </text>
    </g>
  );
}

/* ── Beat 6 static: equal-cost network, distances rippling outward ──────────── */
function NetworkRipple() {
  /* Laid out in the right two-thirds + lower band so the left panel never
     covers a node: every node is below y265 or right of x500. */
  const nodes: GNode[] = [
    { id: "me", x: 250, y: 360, label: "me", sub: "0", tone: "start" },
    { id: "a", x: 375, y: 300, label: "A", sub: "1", tone: "trail" },
    { id: "b", x: 375, y: 418, label: "B", sub: "1", tone: "trail" },
    { id: "c", x: 510, y: 278, label: "C", sub: "2", tone: "visited" },
    { id: "d", x: 510, y: 360, label: "D", sub: "2", tone: "visited" },
    { id: "e", x: 510, y: 430, label: "E", sub: "2", tone: "visited" },
    { id: "f", x: 645, y: 312, label: "F", sub: "3", tone: "idle" },
    { id: "g", x: 645, y: 392, label: "G", sub: "3", tone: "idle" },
  ];
  const edges: GEdge[] = [
    { from: "me", to: "a", tone: "trail" },
    { from: "me", to: "b", tone: "trail" },
    { from: "a", to: "c", tone: "visited" },
    { from: "a", to: "d", tone: "visited" },
    { from: "b", to: "e", tone: "visited" },
    { from: "c", to: "f" },
    { from: "d", to: "g" },
  ];
  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} radius={21} />
      <text x={560} y={262} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>
        sub-number = rings from &ldquo;me&rdquo; · closest first
      </text>
      <text x={440} y={458} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        same walk: friends-of-friends &middot; word ladders &middot; equal-cost routing &middot; tree levels
      </text>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, derive, operations,
 *                general, name)
 *   structured : 5 — cuts `obvious` (folded into the wedge's structured
 *                connector) and `general` (its triggers live on in `name`).
 *   rigorous   : 3 — derive (invariant + the queue-order gate) + operations
 *                (exact costs + edge cases) + name; the rigorous bridgeFrom
 *                line recalls dfs so derive's cold open lands.
 *   refresh    : additionally trims `obvious` + `general` (trimOnRefresh).    */
export const bfsLesson: LessonSpec = {
  topicTitle: "breadth-first search · the fewest steps out",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: bfsPy as string,
  // standing on dfs (the track-contrast anchor, per TRACK-NARRATIVES.md): dfs
  // walks everything by diving deep and backing up; same walk with a queue
  // (← stacks-queues) instead of a stack, and depth becomes distance. The
  // rigorous line deliberately does NOT name FIFO — that's the derive gate.
  bridgeFrom: reg({
    base: "Depth-first found a way out by diving deep — swap its stack for a queue, and the same walk finds the fewest steps.",
    intuitive: "You escaped the maze by diving deep and backing up — explore nearest-first instead, and the first exit is the shortest.",
    rigorous: "DFS visits everything; its first arrival proves nothing about distance — impose an order where arrival means distance.",
  }),
  // from meta (TRACK-NARRATIVES row 26): the frontier's promise — nearer is
  // always dequeued first. Not a ⚑ row: bfs IS the invariant idea in action.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: reg({
        base: "Why deep-first isn't enough",
        structured: "Explore by distance instead",
      }),
      takeaway: "A maze from S to G — now we want the fewest steps, not just any way out.",
      detail: reg({
        base: (
          <>
            <p>
              This is the same five-by-five maze you have seen before: a small grid of
              squares where <strong>S</strong> (top-left) is the start, <strong>G</strong>{" "}
              (bottom-right) is the goal, and the dark filled squares are <strong>walls</strong>{" "}
              you cannot step on. You move one square at a time, up, down, left or right.
            </p>
            <p>
              But the question has changed. Before, we only asked &ldquo;is there a way out
              at all?&rdquo; Now we ask <strong>&ldquo;what is the fewest steps?&rdquo;</strong>
            </p>
            <p>
              That word <em>fewest</em> changes everything. A walker that dives deep down one
              corridor might eventually reach G &mdash; but along a long, winding, scenic route.
              We need a method that does not just <em>find</em> a path, it always reports the{" "}
              <em>shortest</em> one.
            </p>
          </>
        ),
        intuitive: (
          <>
            <p>
              Look at the maze for a second. <strong>S</strong> (top-left) is where you stand,{" "}
              <strong>G</strong> (bottom-right) is the way out, the dark filled squares are{" "}
              <strong>walls</strong>, and one move is one square &mdash; up, down, left or right.
            </p>
            <p>
              Last time the question was &ldquo;can you get out at all?&rdquo; &mdash; any route,
              however winding, counted as a win. Today&rsquo;s question is harder:{" "}
              <strong>what is the smallest number of steps that gets you out?</strong>
            </p>
            <p>
              That one word &mdash; <em>fewest</em> &mdash; changes what counts as an answer.
              Finding <em>a</em> way out is no longer enough. We need a way of exploring that can
              look you in the eye and say: <em>nothing shorter exists.</em>
            </p>
          </>
        ),
      }),
      visual: flood(GG, null, emptyDist, false),
      panels: [
        {
          left: 40,
          top: 22,
          width: 740,
          variant: "main",
          label: "The setup",
          title: "Same maze. New question: how few steps?",
          body: reg({
            base: (
              <>
                The same 5&times;5 grid: start at <strong>S</strong> (top-left), reach{" "}
                <strong>G</strong> (bottom-right), filled cells are walls. New question:
                not <em>is there a way out?</em> but <em>what&rsquo;s the fewest steps?</em>{" "}
                A long winding route counts too, so we need a method that always reports
                the shortest.
              </>
            ),
            intuitive: (
              <>
                Same maze as before: you stand at <strong>S</strong> (top-left), the way out
                is <strong>G</strong> (bottom-right), dark squares are walls, and a move is
                one square. But the question changed: not <em>can you get out?</em> &mdash;{" "}
                <em>what&rsquo;s the fewest steps out?</em> A winding route still escapes, but
                it no longer wins. We need a way to be <em>sure</em> nothing shorter exists.
              </>
            ),
          }),
        },
      ],
      arrows: [
        {
          x1: GG.cx(GOAL[0], GOAL[1]),
          y1: 150,
          x2: GG.cx(GOAL[0], GOAL[1]),
          y2: GG.cy(GOAL[0], GOAL[1]) - GG.cellPx / 2 - 4,
        },
      ],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that we want the fewest steps, the natural first idea is to just walk the maze — but does walking find the shortest way?",
      actionLabel: "Explore by distance instead",
      takeaway: "Diving deep finds a path, but not always the shortest one.",
      detail: (
        <>
          <p>
            A <em>depth-first</em> walker plunges all the way down one corridor until it hits
            a dead end, then backs up and tries the next branch. (&ldquo;Depth-first&rdquo;
            just means: always go as deep as you can before trying anything sideways.) If the
            goal happens to sit at the end of the very first corridor it tries, lucky &mdash;
            it finds a path fast.
          </p>
          <p>
            On <em>this</em> particular maze that happens to be 8 steps, which is the true
            shortest. But that is luck, not a guarantee. On a different maze the same walker
            could wander the long way around a wall before stumbling onto G. To be sure it had
            the shortest, it would have to keep finding paths and remember the best one &mdash;
            a ton of extra exploring.
          </p>
          <p>
            There is a smarter order. What if, instead of going deep, we explored strictly{" "}
            <strong>by distance</strong> &mdash; first every square one step from S, then every
            square two steps away, then three? The very first time we touch G, that is as close
            as it could ever possibly be.
          </p>
        </>
      ),
      visual: <DfsContrast />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 780,
          variant: "main",
          label: "The obvious thing",
          title: "Depth-first finds a path. It doesn't promise the shortest.",
          body: (
            <>
              A <em>depth-first</em> walker dives down one branch to a dead end before
              trying another. On <em>this</em> maze that&rsquo;s 8 steps &mdash; the true
              shortest &mdash; but another maze could send it the long way around. Finding{" "}
              <em>a</em> path isn&rsquo;t finding the <em>shortest</em> one. What if we
              explored <strong>by distance</strong> &mdash; one step away, then two, then
              three?
            </>
          ),
        },
      ],
      arrows: [
        {
          x1: GG.cx(0, 1),
          y1: 150,
          x2: GG.cx(0, 1),
          y2: GG.cy(0, 1) - GG.cellPx / 2 - 4,
        },
      ],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      // the structured connector folds the cut `obvious` beat (the DFS recap)
      // into this beat's opening, so the sequence reads whole without slot 2.
      connector: reg({
        base: "So instead of diving deep, let's grow outward by distance and watch what that buys us.",
        structured: "A depth-first dive finds a path, not always the shortest one — so explore strictly by distance instead: every square one step from S, then two, then three.",
      }),
      actionLabel: "Why the first touch wins",
      takeaway: "Grow outward one ring at a time — the first touch of G is the shortest.",
      detail: (
        <>
          <p>
            Use the buttons to the right of the maze: <strong>▶ play</strong> runs it on its own,
            or <strong>step ring</strong> advances one ring at a time (and <strong>↺ reset</strong>{" "}
            starts over). A ripple of
            light spreads out from the start square. First it lights every square one step away.
            Then every square one step from <em>those</em> &mdash; the two-step squares. Then
            three steps, then four, growing outward like a circle in a pond.
          </p>
          <p>
            The small number written on each square is its <strong>distance</strong> &mdash;
            the smallest number of steps from S needed to reach it. The first moment the ripple
            washes over G, the number on G <em>is</em> the answer.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct:</strong> the ripple grows in lockstep, one ring at a time. There
            is no way a square <em>two</em> steps away gets touched before a square <em>one</em>{" "}
            step away. So the instant we touch G, no shorter route can exist &mdash; we have
            already checked every closer square first.
          </div>
        </>
      ),
      visual: (api) => <Ripples api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 480,
          variant: "main",
          label: "The instinct",
          title: "Spread a ripple outward, one ring at a time.",
          body: (
            <>
              Use <strong>▶ play</strong> or <strong>step ring</strong> on the right of the
              maze. A ripple of light spreads from{" "}
              <strong>S</strong>: cells one step away, then two, then three. The small
              number on each cell is its <strong>distance</strong> &mdash; the fewest
              steps from S to reach it. The instant the ripple touches <strong>G</strong>,
              that number is the answer.
            </>
          ),
        },
        {
          left: 40,
          top: 300,
          width: 250,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The instinct:</strong> a cell
              two steps away can never light before a one-step cell. So the first
              touch of G is the shortest &mdash; nothing closer was skipped.
            </>
          ),
        },
      ],
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      // rigorous OPENS here: the bridgeFrom line is its lead-in, so the
      // connector is empty for that register (variables-exemplar pattern).
      connector: reg({
        base: "The ripple is the idea; now we need a piece of bookkeeping that makes a computer grow it in exactly that order.",
        rigorous: "",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "A first-in-first-out queue (+ a seen-set) grows the ripple in exact order.",
        rigorous: "FIFO + mark-on-enqueue: every cell enters once; dequeue order is distance order.",
      }),
      detail: reg({
        base: (
          <>
            <p>
              Keep a <strong>queue</strong> &mdash; think of a line at a ticket counter: you join
              at the <em>back</em>, and you always get called from the <em>front</em>, in the order
              you arrived. (Computer people call this <em>first-in, first-out</em>.) Put the start
              square in the line first, with distance 0.
            </p>
            <p>
              <strong>Then loop:</strong> pull the square at the front of the line. If it is G, its
              distance is the answer &mdash; stop. Otherwise look at each neighbouring square that
              is open (not a wall) and that we have never seen before. Mark each one{" "}
              <strong>seen</strong>, give it a distance of <em>mine plus one</em>, and send it to
              the back of the line.
            </p>
            <p>
              Marking a square <em>seen</em> the very moment it joins the line is the small but
              crucial detail. (&ldquo;Seen&rdquo; is just a checklist of squares already added.) It
              guarantees each square gets a distance exactly once &mdash; the smallest one possible
              &mdash; and never sneaks back in with a larger number.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle &mdash; keep a promise alive:</strong> because the line is
              first-in-first-out, the distance of whatever we pull off the front only ever goes up,
              never down. So the first time we pull G off the line, its distance is the smallest it
              will ever be.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>The invariant.</strong> The queue always holds distances of the form{" "}
              <code>d, &hellip;, d, d+1, &hellip;, d+1</code> &mdash; non-decreasing, at most two
              distinct values. Induction: popping a distance-<code>d</code> cell appends only
              distance-<code>(d+1)</code> cells at the back, which preserves the shape. Dequeue
              distances therefore never decrease, so the <em>first</em> dequeue of any cell &mdash;
              the goal included &mdash; happens at its minimum distance. That is the entire
              correctness proof.
            </p>
            <p>
              <strong>Mark on enqueue, not on dequeue.</strong> Distances are assigned as cells
              join, and the <code>seen</code> check at the door is what makes &ldquo;each cell
              enters once&rdquo; true. Deferring the check to pop time still terminates, but lets
              several neighbours enqueue the same cell &mdash; duplicate entries up to one per
              edge, and the memory bound breaks.
            </p>
          </>
        ),
      }),
      visual: (api) => <QueueOrderGate api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 800,
          variant: "main",
          label: "The derivation",
          title: reg({
            base: "A queue holds 'the next ring to look at'.",
            rigorous: "A FIFO worklist; mark seen on enqueue.",
          }),
          body: reg({
            base: (
              <>
                A <strong>queue</strong> is a waiting line: join at the back, leave from the
                front. Put S in line at distance 0. Loop: pull the front cell; if it&rsquo;s G,
                its distance is the answer. Otherwise mark each open, unseen neighbour{" "}
                <strong>seen</strong>, set its distance one higher, and send it to the back.
              </>
            ),
            rigorous: (
              <>
                Commit to the worklist&rsquo;s discipline first (the predict), then watch. Start
                with <code>{"queue = [(start, 0)]"}</code>, <code>{"seen = {start}"}</code>. Loop:
                pop the front; at the goal, return its <code>d</code>; otherwise mark every open,
                unseen neighbour <code>seen</code> and append it at{" "}
                <code>d + 1</code>. <Term word="FIFO">FIFO</Term> keeps dequeued distances
                non-decreasing &mdash; the <Term word="invariant">invariant</Term> &mdash; so a
                cell&rsquo;s first dequeue is its shortest distance.
              </>
            ),
          }),
        },
      ],
      arrows: [
        {
          x1: GGq.x0 + COLS * (GGq.cellPx + GGq.gap) + 36,
          y1: 150,
          x2: GGq.x0 + COLS * (GGq.cellPx + GGq.gap) + 36,
          y2: GGq.y0 - 8,
        },
      ],
      codeLabels: [
        "seen",
        "init_queue",
        "loop",
        "dequeue",
        "visit",
        "found",
        "seen_check",
        "mark",
        "enqueue",
      ],
      // the ONE PredictGate beat: the tap on a pill is the gating interaction;
      // the AutoBfs playback then answers it (gate honesty per types.ts).
      interaction: "wedge",
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "Now that every square joins the line exactly once, we can count the total work and see how it stacks up against depth-first.",
        rigorous: "Each cell enters the queue once — now total the work exactly.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Each cell joins once, so the work is O(V + E) — and the closest is reached first.",
        intuitive: "Each cell joins the line once — work grows in step with the maze, closest always first.",
        rigorous: "O(V + E) time, frontier-sized queue — same work as DFS, only the dequeue order differs.",
      }),
      detail: reg({
        base: (
          <>
            <p>
              Because we mark a square seen the instant it enters the line, no square ever joins
              twice. Let <strong>V</strong> stand for the open squares and <strong>E</strong> stand
              for the connections between neighbouring squares. We touch each square once and each
              connection a fixed number of times, so the total work is{" "}
              <code>O(V + E)</code>. That <code>O(...)</code> notation just describes how the effort
              <em>grows</em> as the maze gets bigger &mdash; here it grows in step with the number of
              squares plus the number of connections, nothing worse.
            </p>
            <p>
              <strong>Memory:</strong> the line holds the squares in the current ring and the next
              ring at the same time. For a thin, snaking maze that is only a handful. For a wide-open
              grid the line can briefly hold the whole edge of the expanding wave &mdash; but that is
              still far smaller than the entire maze.
            </p>
            <p>
              <strong>Versus depth-first:</strong> for the same maze, both do the same total amount
              of work. The difference is purely in <em>what you reach first</em> &mdash; this method
              reaches the <em>closest</em> squares first, which is exactly why only its first arrival
              at G is guaranteed to be the shortest.
            </p>
            <p>
              <strong>Edge cases:</strong> if G is walled off, the line simply runs dry and the
              answer is &ldquo;no path&rdquo; (the code returns &minus;1) &mdash; after exploring
              only what S can reach, never the whole maze. If S <em>is</em> G, the very first pull
              answers 0. And the guarantee is conditional: first-touch-is-shortest holds only while
              every step costs the same.
            </p>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>Exact costs.</strong> Time: each of the V open cells is enqueued once and
              dequeued once, and each of the E neighbour-links is inspected at most once per
              endpoint&rsquo;s dequeue &mdash; a constant per link. Counted, that is V + a constant
              &times; E steps: <Term word="O(V + E)"><code>O(V + E)</code></Term>. On this
              4-connected grid E &le; 2V, so effectively linear in the cell count. Space:{" "}
              <code>seen</code> is O(V); the queue peaks at one frontier (a ring plus part of the
              next) &mdash; O(V) worst case on open grids, far less in corridors.
            </p>
            <p>
              <strong>Edge cases.</strong> <code>start == end</code> returns 0 &mdash; the goal
              test runs at dequeue, so the first pop handles it. Unreachable goal: the queue
              drains and the function returns &minus;1, having paid only for S&rsquo;s component.
              Marking on dequeue instead of enqueue inflates the queue with duplicates (up to one
              per edge). And the guarantee is conditional: first-touch-is-shortest requires equal
              step costs &mdash; weighted links break it. DFS matches the O(V + E) bound; the
              dequeue order is the only difference, and it is the whole point.
            </p>
          </>
        ),
      }),
      visual: (api) => <AutoBfs api={api} frozen />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 800,
          variant: "main",
          label: "The operations",
          title: reg({
            base: "Each cell enters the line once. Each is checked once.",
            rigorous: "Each cell once; each link a constant number of times.",
          }),
          body: reg({
            base: (
              <>
                Marked seen the moment it joins, a cell never joins twice. Let{" "}
                <strong>V</strong> = open cells and <strong>E</strong> = links between
                neighbours. Total work is <strong>O(V + E)</strong> &mdash; &ldquo;O(...)&rdquo;
                just means how the effort grows, here in step with cells plus links. DFS does
                the same work, but only BFS&rsquo;s <em>first</em> arrival at G is guaranteed
                shortest.
              </>
            ),
            rigorous: (
              <>
                Count it on the flood: every open cell holds exactly one number &mdash; V cells,
                one enqueue and one dequeue each &mdash; and each of the E links is inspected a
                constant number of times. That tally is{" "}
                <Term word="O(V + E)"><code>O(V + E)</code></Term> time, with a frontier-sized
                queue. DFS matches the bound; only the dequeue order &mdash; and so the
                shortest-path guarantee &mdash; differs.
              </>
            ),
          }),
        },
      ],
      arrows: [
        {
          x1: GGq.x0 + COLS * (GGq.cellPx + GGq.gap) + 36,
          y1: 150,
          x2: GGq.x0 + COLS * (GGq.cellPx + GGq.gap) + 36,
          y2: GGq.y0 - 8,
        },
      ],
      codeLabels: ["seen", "seen_check", "mark"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "The maze was just a stage prop — strip it away and the same outward walk solves a whole family of 'closest first' problems.",
      actionLabel: "Name the pattern",
      takeaway: "On any equal-cost graph this outward walk gives the shortest route.",
      detail: (
        <>
          <p>
            A maze square is really just a <strong>node</strong> &mdash; a dot &mdash; joined to
            other dots by <strong>edges</strong>, the lines between them. Anywhere the connections
            all cost the same (one click is one click, one hop is one hop), this same outward walk
            hands you the shortest route.
          </p>
          <p>
            Same shape, different stories:
          </p>
          <ul>
            <li>degrees of separation on a social network &mdash; &ldquo;how far is this person from me?&rdquo;</li>
            <li>word ladders &mdash; turn <em>cat</em> into <em>dog</em> one letter at a time</li>
            <li>routing a message across a network where every link weighs the same</li>
            <li>walking a tree level by level, or broadcasting to your neighbours, then theirs, then theirs</li>
          </ul>
          <p>
            When the connections are <em>not</em> equal-cost &mdash; a real road map where some
            roads are longer &mdash; the walk needs a smarter line that always serves the
            cheapest-so-far next (a <em>priority queue</em>, a line sorted by total cost). That is{" "}
            <strong>Dijkstra&rsquo;s algorithm</strong> &mdash; same shape, smarter line.
          </p>
        </>
      ),
      visual: <NetworkRipple />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 450,
          variant: "main",
          label: "The generalization",
          title: "Anywhere you want 'closest first'.",
          body: (
            <>
              A cell can be any <strong>node</strong> &mdash; a dot joined to others by{" "}
              <strong>edges</strong> (the lines). Wherever links cost the same &mdash; one
              click is one click &mdash; this outward walk gives the shortest route: degrees
              of separation, word ladders, equal-cost routing, tree levels. When links cost
              differently (a road map), use a smarter tool &mdash; Dijkstra&rsquo;s algorithm.
            </>
          ),
        },
      ],
      arrows: [{ x1: 250, y1: 234, x2: 250, y2: 338 }],
      codeLabels: ["enqueue"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: reg({
        base: "Give the move its name — and the cues that tell you to reach for it next time.",
        rigorous: "Name it, and file the invariant it runs on.",
      }),
      takeaway: reg({
        base: "It's Breadth-First Search — reach for it on “fewest steps” / “level by level”.",
        intuitive: "Breadth-First Search: a queue explores nearest-first — first touch of G is shortest.",
        rigorous: "BFS: FIFO frontier keeps dequeue distance non-decreasing — shortest on equal costs.",
      }),
      detail: reg({
        base: (
          <>
            <p>
              That is the name. <em>Breadth-first</em> &mdash; because we finish every square at
              distance d before touching any square at distance d+1. The <em>queue</em> (that
              first-in-first-out line) is the single thing that forces that order; pull from the
              front, push to the back, and the rings come out perfectly sorted by distance.
            </p>
            <p>
              <strong>Reach for it when you hear:</strong>
            </p>
            <ul>
              <li>&ldquo;fewest steps&rdquo; or &ldquo;shortest path&rdquo; where every step costs the same</li>
              <li>&ldquo;closest matching X&rdquo; on a network of equal-cost links</li>
              <li>&ldquo;level by level&rdquo; anything &mdash; print a tree one level at a time, or broadcast outward</li>
              <li>any problem where every move has the same cost</li>
            </ul>
            <p>
              Open the drawer for the Python and you will see it: a queue, a seen-set, a loop. The
              cleverness is entirely in the <em>order</em> things come off the line, not in the code.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity and invariants:</strong> the queue keeps one
              promise &mdash; distances coming off the front never go down &mdash; and the shortest
              path falls out of that promise.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>
              The move you derived has a name: <strong>Breadth-First Search</strong>.{" "}
              <em>Breadth-first</em> means wide before deep &mdash; every square at distance d gets
              its turn before any square at distance d+1. The waiting line (first in, first out) is
              the single thing that forces that order: pull from the front, send newcomers to the
              back, and the rings come out perfectly sorted by distance.
            </p>
            <p>
              <strong>Reach for it when you hear:</strong>
            </p>
            <ul>
              <li>&ldquo;fewest steps&rdquo; or &ldquo;shortest way&rdquo; where every step costs the same</li>
              <li>&ldquo;closest&rdquo; anything on a web of equal hops &mdash; nearest friend, nearest match</li>
              <li>&ldquo;level by level&rdquo; &mdash; print a tree one floor at a time, or spread news outward</li>
            </ul>
            <p>
              Open the drawer for the Python and you will see how little there is: a queue, a
              seen-list, a loop. All the cleverness lives in the <em>order</em> things leave the
              line, not in the code.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The third big idea (3 of 7) &mdash; keep a promise alive:</strong> the line
              promises &ldquo;nearer leaves first,&rdquo; and because that promise never breaks, the
              first time you reach the goal nothing shorter can exist.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>The checklist.</strong> Worklist a <Term word="deque"><code>deque</code></Term>{" "}
              (<code>popleft</code> / <code>append</code> &mdash; a list&rsquo;s <code>pop(0)</code>{" "}
              costs O(n) per pop); mark <code>seen</code> on enqueue; carry the distance with the
              cell, or flood level-by-level and count rings. Multi-source: seed the queue with every
              source at 0 &mdash; the proof is unchanged. Equal edge costs are load-bearing; for
              weighted edges the FIFO queue becomes a priority queue &mdash; Dijkstra, same skeleton.
            </p>
            <p>
              <strong>Triggers:</strong> shortest path on unit-cost edges; level-order traversal;
              &ldquo;closest X such that&hellip;&rdquo;; word ladders; flood fill / broadcast.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity and invariants:</strong> BFS is an invariant
              wearing an algorithm &mdash; dequeue distances never decrease, so the first arrival is
              provably the shortest. Keep a promise alive and the re-checking disappears.
            </div>
          </>
        ),
      }),
      visual: <AutoBfs api={{ onActiveLine: () => {}, onInteractionDone: () => {} }} frozen />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 470,
          variant: "main",
          label: "The pattern",
          title: "Breadth-First Search.",
          body: reg({
            base: (
              <>
                That&rsquo;s the name &mdash; <em>breadth-first</em> because we finish
                every cell at distance d before any at d+1, and the queue forces that
                order. Reach for it when you hear &ldquo;fewest steps&rdquo; where every
                step costs the same, &ldquo;closest match&rdquo;, or &ldquo;level by
                level&rdquo;.
              </>
            ),
            rigorous: (
              <>
                <em>Breadth-first</em>: exhaust distance d before touching d+1 &mdash; the{" "}
                <Term word="FIFO">FIFO</Term> queue is the entire mechanism. Triggers: shortest
                path on equal-cost edges, level-order traversal, &ldquo;closest X such
                that&hellip;&rdquo;, multi-source spread. Unequal costs &rarr; Dijkstra (a
                priority queue in the same skeleton).
              </>
            ),
          }),
        },
      ],
      codeLabels: ["found"],
    },
  ],
};
