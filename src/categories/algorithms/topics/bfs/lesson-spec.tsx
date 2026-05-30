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

export const bfsLesson: LessonSpec = {
  topicTitle: "breadth-first search · the fewest steps out",
  canvas: { width: VW, height: VH },
  codeSource: bfsPy as string,
  beats: [
    {
      id: "setup",
      visual: flood(GG, null, emptyDist, false),
      panels: [
        {
          left: 40,
          top: 22,
          width: 740,
          variant: "main",
          label: "The setup",
          title: "Same maze. New question: how few steps?",
          body: (
            <>
              The same 5&times;5 grid: start at <strong>S</strong> (top-left), reach{" "}
              <strong>G</strong> (bottom-right), filled cells are walls. New question:
              not <em>is there a way out?</em> but <em>what&rsquo;s the fewest steps?</em>{" "}
              A long winding route counts too, so we need a method that always reports
              the shortest.
            </>
          ),
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
      visual: (api) => <Ripples api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 480,
          variant: "main",
          label: "The wedge",
          title: "Spread a ripple outward, one ring at a time.",
          body: (
            <>
              Press <strong>play</strong> (or step). A ripple of light spreads from{" "}
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
              <strong className="text-[var(--accent-ink)]">The wedge:</strong> a cell
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
      visual: (api) => <AutoBfs api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 800,
          variant: "main",
          label: "The derivation",
          title: "A queue holds 'the next ring to look at'.",
          body: (
            <>
              A <strong>queue</strong> is a waiting line: join at the back, leave from the
              front. Put S in line at distance 0. Loop: pull the front cell; if it&rsquo;s G,
              its distance is the answer. Otherwise mark each open, unseen neighbour{" "}
              <strong>seen</strong>, set its distance one higher, and send it to the back.
            </>
          ),
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
      interaction: "playback",
    },
    {
      id: "operations",
      visual: (api) => <AutoBfs api={api} frozen />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 800,
          variant: "main",
          label: "The operations",
          title: "Each cell enters the line once. Each is checked once.",
          body: (
            <>
              Marked seen the moment it joins, a cell never joins twice. Let{" "}
              <strong>V</strong> = open cells and <strong>E</strong> = links between
              neighbours. Total work is <strong>O(V + E)</strong> &mdash; &ldquo;O(...)&rdquo;
              just means how the effort grows, here in step with cells plus links. DFS does
              the same work, but only BFS&rsquo;s <em>first</em> arrival at G is guaranteed
              shortest.
            </>
          ),
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
      visual: <AutoBfs api={{ onActiveLine: () => {}, onInteractionDone: () => {} }} frozen />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 470,
          variant: "main",
          label: "The pattern",
          title: "Breadth-First Search.",
          body: (
            <>
              That&rsquo;s the name &mdash; <em>breadth-first</em> because we finish
              every cell at distance d before any at d+1, and the queue forces that
              order. Reach for it when you hear &ldquo;fewest steps&rdquo; where every
              step costs the same, &ldquo;closest match&rdquo;, or &ldquo;level by
              level&rdquo;.
            </>
          ),
        },
      ],
      codeLabels: ["found"],
    },
  ],
};
