"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import {
  GridCells,
  gridGeom,
  NodeGraph,
  Arrow,
  Bracket,
  type GNode,
  type GEdge,
} from "@/shared/lesson/canvas";
import dfsPy from "./algorithm.py";

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

/* Centered grid geometry inside the canvas box. */
const GG = gridGeom(ROWS, COLS, VW, 150, 46, 6);
const key = (r: number, c: number) => `${r},${c}`;
const isStart = (r: number, c: number) => r === START[0] && c === START[1];
const isGoal = (r: number, c: number) => r === GOAL[0] && c === GOAL[1];

/* DFS direction order: right, down, left, up — mirrors algorithm.py's neighbour loop. */
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

function openUnvisited(r: number, c: number, visited: Set<string>) {
  return (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    GRID[r][c] === 0 &&
    !visited.has(key(r, c))
  );
}

/* Tone for a maze cell given the live search state. */
function tone(
  r: number,
  c: number,
  current: [number, number] | null,
  visited: Set<string>,
  trail: Set<string>,
): Tone {
  if (GRID[r][c] === 1) return "wall";
  if (current && current[0] === r && current[1] === c) return "active";
  if (trail.has(key(r, c))) return "trail";
  if (visited.has(key(r, c))) return "visited";
  if (isStart(r, c)) return "start";
  if (isGoal(r, c)) return "goal";
  return "idle";
}

function content(r: number, c: number): string | undefined {
  if (isStart(r, c)) return "S";
  if (isGoal(r, c)) return "G";
  return undefined;
}

/* A static maze drawing — used by the non-interactive beats. */
function maze(
  current: [number, number] | null,
  visited: Set<string>,
  trail: Set<string>,
) {
  return (
    <GridCells
      rows={ROWS}
      cols={COLS}
      geom={GG}
      cell={(r, c) => ({
        tone: tone(r, c, current, visited, trail),
        content: content(r, c),
      })}
    />
  );
}

const emptySet = new Set<string>();

/* ── Beat 3 wedge: click an open neighbour to step; "back up" retreats ──────── */
interface WalkState {
  current: [number, number];
  trail: [number, number][];
  visited: Set<string>;
  done: boolean;
}
const startWalk = (): WalkState => ({
  current: [...START] as [number, number],
  trail: [[...START] as [number, number]],
  visited: new Set([key(START[0], START[1])]),
  done: false,
});

function ManualWalk({ api }: { api: BeatVisualApi }) {
  const [w, setW] = useState<WalkState>(startWalk);

  const isCandidate = (r: number, c: number) =>
    openUnvisited(r, c, w.visited) &&
    Math.abs(w.current[0] - r) + Math.abs(w.current[1] - c) === 1;

  const step = (r: number, c: number) => {
    api.onInteractionDone();
    if (w.done || !isCandidate(r, c)) return;
    const visited = new Set(w.visited);
    visited.add(key(r, c));
    const trail = [...w.trail, [r, c] as [number, number]];
    const done = isGoal(r, c);
    api.onActiveLine(done ? ["found"] : ["recurse", "visit"]);
    setW({ current: [r, c], trail, visited, done });
  };

  const backUp = () => {
    api.onInteractionDone();
    if (w.trail.length <= 1 || w.done) return;
    const trail = w.trail.slice(0, -1);
    api.onActiveLine(["backtrack"]);
    setW({ ...w, current: trail[trail.length - 1], trail });
  };

  const reset = () => setW(startWalk());
  const trailSet = new Set(w.trail.map(([r, c]) => key(r, c)));
  const depth = w.trail.length - 1;
  const by = GG.cy(GOAL[0], 0) + GG.cellPx / 2; // grid bottom-ish

  return (
    <g>
      <GridCells
        rows={ROWS}
        cols={COLS}
        geom={GG}
        cell={(r, c) => ({
          tone: tone(r, c, w.current, w.visited, trailSet),
          content: content(r, c),
        })}
        onCellClick={step}
        cellEnabled={(r, c) => isCandidate(r, c) && !w.done}
      />
      <text
        x={VW / 2}
        y={by + 30}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 12, fill: w.done ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {w.done
          ? `reached G · trail depth ${depth}`
          : `trail depth ${depth} · visited ${w.visited.size} — click a lit neighbour, or back up`}
      </text>
      {/* back up */}
      <g
        onClick={backUp}
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        aria-label="back up"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            backUp();
          }
        }}
      >
        <rect x={VW / 2 - 64} y={by + 44} width={62} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2 - 33} y={by + 56} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          ← back up
        </text>
      </g>
      {/* reset */}
      <g
        onClick={reset}
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        aria-label="reset"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            reset();
          }
        }}
      >
        <rect x={VW / 2 + 4} y={by + 44} width={48} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2 + 28} y={by + 56} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          ↺ reset
        </text>
      </g>
    </g>
  );
}

/* ── Beats 4-5 playback: DFS dives and backtracks on its own ────────────────── */
interface DfsFrame {
  cell: [number, number];
  dirIdx: number;
}
interface DfsState {
  stack: DfsFrame[];
  visited: Set<string>;
  trail: [number, number][];
  found: boolean;
  done: boolean;
}
const initDfs = (): DfsState => ({
  stack: [{ cell: [...START] as [number, number], dirIdx: 0 }],
  visited: new Set([key(START[0], START[1])]),
  trail: [[...START] as [number, number]],
  found: false,
  done: false,
});

function dfsStep(s: DfsState): { next: DfsState; line: string[] } {
  if (s.found || s.done) return { next: s, line: [] };
  const stack = [...s.stack];
  if (stack.length === 0) return { next: { ...s, done: true }, line: ["backtrack"] };
  const top = stack[stack.length - 1];
  const [r, c] = top.cell;
  if (isGoal(r, c)) return { next: { ...s, found: true, done: true }, line: ["found"] };
  if (top.dirIdx >= DIRS.length) {
    stack.pop();
    const trail = s.trail.slice(0, -1);
    return { next: { ...s, stack, trail, done: stack.length === 0 }, line: ["backtrack"] };
  }
  const [dr, dc] = DIRS[top.dirIdx];
  const nr = r + dr,
    nc = c + dc;
  const head = [...stack.slice(0, -1), { ...top, dirIdx: top.dirIdx + 1 }];
  if (openUnvisited(nr, nc, s.visited)) {
    const visited = new Set(s.visited);
    visited.add(key(nr, nc));
    const trail = [...s.trail, [nr, nc] as [number, number]];
    const reached = isGoal(nr, nc);
    return {
      next: {
        ...s,
        stack: [...head, { cell: [nr, nc], dirIdx: 0 }],
        visited,
        trail,
        found: reached,
        done: reached,
      },
      line: reached ? ["found"] : ["recurse", "visit"],
    };
  }
  return { next: { ...s, stack: head }, line: [] };
}

function AutoDfs({ api, showStack }: { api: BeatVisualApi; showStack?: boolean }) {
  const [s, setS] = useState<DfsState>(initDfs);
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const { next, line } = dfsStep(c);
      if (line.length) api.onActiveLine(line);
      setS(next);
    }, 600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = s.stack.length > 0 ? s.stack[s.stack.length - 1].cell : null;
  const trailSet = new Set(s.trail.map(([r, c]) => key(r, c)));
  const depth = s.trail.length - 1;
  const by = GG.cy(GOAL[0], 0) + GG.cellPx / 2;

  return (
    <g>
      <GridCells
        rows={ROWS}
        cols={COLS}
        geom={GG}
        cell={(r, c) => ({
          tone: tone(r, c, current, s.visited, trailSet),
          content: content(r, c),
        })}
      />
      {showStack && current && (
        <Bracket
          x1={GG.x0 - 4}
          x2={GG.x0 - 4 + COLS * (GG.cellPx + GG.gap)}
          y={GG.y0 - 14}
          label={`stack depth = trail length = ${depth}`}
          color="var(--diff-easy)"
        />
      )}
      <text
        x={VW / 2}
        y={by + 30}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 12, fill: s.found ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {s.found
          ? `reached G · trail depth ${depth}`
          : s.done
          ? "no path"
          : `trail depth ${depth} · visited ${s.visited.size} — dive deep, back up when stuck`}
      </text>
      <g
        onClick={() => setS(initDfs())}
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        aria-label="replay"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setS(initDfs());
          }
        }}
      >
        <rect x={VW / 2 - 30} y={by + 44} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={by + 56} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          ↺ replay
        </text>
      </g>
    </g>
  );
}

/* ── Beat 2 static: the blind-explosion callout over a dimmed maze ──────────── */
function Explosion() {
  return (
    <g>
      {maze(null, emptySet, emptySet)}
      <g opacity={0.9}>
        <text x={VW / 2} y={GG.y0 - 22} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-hard)" }}>
          blind move-sequences of length 10 = 4&times;4&times;&hellip; = 1,048,576
        </text>
        <text x={VW / 2} y={GG.cy(GOAL[0], 0) + GG.cellPx / 2 + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>
          cells in the whole maze = 25
        </text>
      </g>
    </g>
  );
}

/* ── Beat 6 static: same dive-deep walk, now on a generic graph ─────────────── */
function GraphDive() {
  const nodes: GNode[] = [
    { id: "a", x: 200, y: 200, label: "A", tone: "trail" },
    { id: "b", x: 320, y: 150, label: "B", tone: "trail" },
    { id: "c", x: 440, y: 120, label: "C", tone: "active" },
    { id: "d", x: 320, y: 280, label: "D", tone: "visited" },
    { id: "e", x: 560, y: 170, label: "E", tone: "idle" },
    { id: "f", x: 440, y: 320, label: "F", tone: "idle" },
  ];
  const edges: GEdge[] = [
    { from: "a", to: "b", tone: "trail" },
    { from: "b", to: "c", tone: "trail" },
    { from: "a", to: "d", tone: "visited" },
    { from: "c", to: "e" },
    { from: "d", to: "f" },
  ];
  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} radius={20} />
      <text x={440} y={88} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>
        dig down A &rarr; B &rarr; C first
      </text>
      <text x={380} y={400} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        same walk: folders &middot; web links &middot; friends-of-friends &middot; dependencies
      </text>
    </g>
  );
}

const cy = GG.cy(GOAL[0], 0) + GG.cellPx / 2;

export const dfsLesson: LessonSpec = {
  topicTitle: "depth-first search · escape the maze",
  canvas: { width: VW, height: VH },
  codeSource: dfsPy as string,
  beats: [
    {
      id: "setup",
      visual: maze(null, emptySet, emptySet),
      panels: [
        {
          left: 30,
          top: 150,
          width: 250,
          variant: "main",
          label: "The setup",
          title: "A small maze. Reach the corner.",
          body: (
            <>
              A 5&times;5 grid. You start at <strong>S</strong> (top-left); the goal
              is <strong>G</strong> (bottom-right). Filled cells are walls &mdash;
              you can&rsquo;t pass. You may step one cell up, down, left or right.
              Your eye finds a way instantly; a computer sees only one cell at a
              time.
            </>
          ),
        },
      ],
      arrows: [{ x1: 250, y1: 200, x2: GG.cx(0, 0) - 28, y2: GG.cy(0, 0) }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      visual: <Explosion />,
      panels: [
        {
          left: 200,
          top: cy + 70,
          width: 460,
          variant: "main",
          label: "The obvious thing",
          title: "Trying every move-sequence explodes.",
          body: (
            <>
              The blind way &mdash; ignoring walls and never reusing what you
              learned &mdash; lists every sequence of moves and tests each: four
              choices a step, over a million for just ten steps. But the maze has
              only 25 cells. Two cheap rules tame it: <strong>never re-enter a
              cell</strong> (you&rsquo;d learn nothing new), and{" "}
              <strong>turn around</strong> when every neighbour dead-ends.
            </>
          ),
        },
      ],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <ManualWalk api={api} />,
      panels: [
        {
          left: 30,
          top: 150,
          width: 250,
          variant: "main",
          label: "The wedge",
          title: "Pick a direction. Dig deep. Back up when stuck.",
          body: (
            <>
              Your turn. Click a lit neighbour to step into it &mdash; each cell
              you enter is marked. Stuck? Press <strong>back up</strong> to retreat
              one cell and try another direction. That retreat is the whole idea.
            </>
          ),
        },
        {
          left: 600,
          top: 150,
          width: 240,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The wedge:</strong> the
              maze from any cell is just a smaller copy of the same question &mdash;{" "}
              <em>can I reach G from here?</em> If a neighbour can, so can you.
            </>
          ),
        },
      ],
      codeLabels: ["recurse", "visit"],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: (api) => <AutoDfs api={api} />,
      panels: [
        {
          left: 30,
          top: 150,
          width: 250,
          variant: "main",
          label: "The derivation",
          title: "Standing at a cell, ask each neighbour.",
          body: (
            <>
              Name the move <code>explore(cell, trail)</code> &mdash; <code>trail</code>{" "}
              is the cells walked so far. On <strong>G</strong>: hand back the trail.
              On any other cell: mark it visited, then ask each open, unvisited
              neighbour the same question; if one returns a trail, you&rsquo;re done.
              Out of neighbours: return nothing &mdash; your caller tries its next
              direction. A problem solved by solving smaller copies of itself is{" "}
              <strong>recursion</strong>.
            </>
          ),
        },
      ],
      codeLabels: ["found", "visit", "neighbors", "recurse", "backtrack"],
      interaction: "playback",
    },
    {
      id: "operations",
      visual: (api) => <AutoDfs api={api} showStack />,
      panels: [
        {
          left: 180,
          top: cy + 70,
          width: 500,
          variant: "main",
          label: "The operations",
          title: "Each cell once. Memory grows with the deepest detour.",
          body: (
            <>
              How the work grows as the maze gets bigger is written{" "}
              <strong>O(cells + walls)</strong> &mdash; here a few dozen checks,
              because the visited mark means each cell is the current cell at most
              once. Memory comes from the <strong>stack</strong>: the pile of paused
              calls waiting to resume, newest first. The live trail{" "}
              <span className="text-[var(--diff-easy)]">is</span> that stack &mdash;
              a 20-cell detour stacks 20 deep before retreating.
            </>
          ),
        },
      ],
      codeLabels: ["visited", "recurse"],
      interaction: "playback",
    },
    {
      id: "general",
      visual: <GraphDive />,
      panels: [
        {
          left: 30,
          top: 150,
          width: 230,
          variant: "main",
          label: "The generalization",
          title: "Not just grids. Anything with neighbours.",
          body: (
            <>
              A cell can be anything with neighbours &mdash; a <strong>node</strong>{" "}
              (just a thing-with-links: a dot) like a folder with subfolders, a
              friend with friends, a webpage with links. The same walk crawls a
              website, finds connected groups, or solves a sudoku. Whenever you ask
              &ldquo;can I reach X?&rdquo;, this is the walk.
            </>
          ),
        },
      ],
      arrows: [{ x1: 270, y1: 200, x2: 420, y2: 124 }],
      codeLabels: ["neighbors", "recurse"],
    },
    {
      id: "name",
      visual: maze(
        null,
        new Set([key(0, 3), key(2, 0), key(2, 1)]),
        new Set([
          key(0, 0),
          key(0, 1),
          key(0, 2),
          key(1, 2),
          key(2, 2),
          key(2, 3),
          key(2, 4),
          key(3, 4),
          key(4, 4),
        ]),
      ),
      panels: [
        {
          left: 30,
          top: 150,
          width: 250,
          variant: "main",
          label: "The pattern",
          title: "Depth-First Search.",
          body: (
            <>
              That&rsquo;s the name &mdash; <em>depth-first</em> because at each step
              you go as deep as you can before turning around. Spot it when you hear
              &ldquo;is there a path / does it connect?&rdquo;, &ldquo;visit every
              connected thing&rdquo;, or &ldquo;try a choice, undo it, try the next&rdquo;
              &mdash; and when the natural answer calls itself.
            </>
          ),
        },
      ],
      arrows: [{ x1: 250, y1: 200, x2: GG.cx(GOAL[0], GOAL[1]) - 28, y2: GG.cy(GOAL[0], GOAL[1]) }],
      codeLabels: ["found"],
    },
  ],
};
