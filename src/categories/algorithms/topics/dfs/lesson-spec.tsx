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

/* Centered grid geometry inside the canvas box — big cells fill the visual band.
   cellPx 50 (was 46) is the largest that still keeps all 5 rows on the 470-tall
   canvas at y0 185; bottom edge lands at 467. */
const GG = gridGeom(ROWS, COLS, VW, 185, 50, 8);
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
  /* controls live in the right gutter, beside the band-filling grid */
  const gx = GG.x0 + COLS * (GG.cellPx + GG.gap) + 20; // just right of the grid
  const gy = GG.cy(2, 0); // vertically centred on the grid

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
        x={gx}
        y={gy - 26}
        textAnchor="start"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: w.done ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {w.done ? `reached G · depth ${depth}` : `depth ${depth} · visited ${w.visited.size}`}
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
        <rect x={gx} y={gy - 12} width={88} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 44} y={gy + 1} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
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
        <rect x={gx} y={gy + 22} width={88} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 44} y={gy + 35} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
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
    }, pace(600));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = s.stack.length > 0 ? s.stack[s.stack.length - 1].cell : null;
  const trailSet = new Set(s.trail.map(([r, c]) => key(r, c)));
  const depth = s.trail.length - 1;
  /* status + replay live in the right gutter, beside the band-filling grid */
  const gx = GG.x0 + COLS * (GG.cellPx + GG.gap) + 20;
  const gy = GG.cy(2, 0);

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
        x={gx}
        y={gy - 14}
        textAnchor="start"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: s.found ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {s.found
          ? `reached G · depth ${depth}`
          : s.done
          ? "no path"
          : `depth ${depth} · visited ${s.visited.size}`}
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
        <rect x={gx} y={gy + 2} width={72} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 36} y={gy + 15} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
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
        <text x={GG.x0 - 16} y={GG.cy(1, 0)} textAnchor="end" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-hard)" }}>
          blind seqs = 1,048,576
        </text>
        <text x={GG.x0 + COLS * (GG.cellPx + GG.gap) + 16} y={GG.cy(3, 0)} textAnchor="start" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>
          maze cells = 25
        </text>
      </g>
    </g>
  );
}

/* ── Beat 6 static: same dive-deep walk, now on a generic graph ─────────────── */
function GraphDive() {
  const nodes: GNode[] = [
    { id: "a", x: 240, y: 250, label: "A", tone: "trail" },
    { id: "b", x: 380, y: 210, label: "B", tone: "trail" },
    { id: "c", x: 520, y: 200, label: "C", tone: "active" },
    { id: "d", x: 360, y: 350, label: "D", tone: "visited" },
    { id: "e", x: 640, y: 250, label: "E", tone: "idle" },
    { id: "f", x: 500, y: 380, label: "F", tone: "idle" },
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
      <NodeGraph nodes={nodes} edges={edges} radius={24} />
      <text x={520} y={168} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>
        dig down A &rarr; B &rarr; C first
      </text>
      <text x={430} y={430} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        same walk: folders &middot; web links &middot; friends-of-friends &middot; dependencies
      </text>
    </g>
  );
}

export const dfsLesson: LessonSpec = {
  topicTitle: "depth-first search · escape the maze",
  canvas: { width: VW, height: VH },
  codeSource: dfsPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "The naive idea",
      visual: maze(null, emptySet, emptySet),
      panels: [
        {
          left: 40,
          top: 20,
          width: 640,
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
      detail: (
        <>
          <p>Picture a small board, 5 squares wide and 5 squares tall. You begin in the top-left square, marked <strong>S</strong> for start, and you want to reach the bottom-right square, marked <strong>G</strong> for goal. Some squares are <strong>walls</strong> &mdash; solid blocks you cannot walk through. From any square you may step one square at a time: up, down, left, or right (never diagonally). The question is simply: <strong>is there a way through?</strong></p>
          <p>Your eyes can trace a route through this little maze in about a second &mdash; you see the whole picture at once. A computer can&rsquo;t do that. It has no overview; it can only stand on one square and look at the squares right next to it. So to teach it to escape, we have to turn &ldquo;find a way&rdquo; into a step-by-step recipe it can follow one square at a time.</p>
        </>
      ),
      arrows: [{ x1: GG.cx(0, 0), y1: 162, x2: GG.cx(0, 0), y2: GG.cy(0, 0) - GG.cellPx / 2 - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "Since the computer can only see one cell at a time, what is the most naive thing it could try?",
      actionLabel: "Two rules that tame it",
      visual: <Explosion />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 780,
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
      detail: (
        <>
          <p>The most naive idea is <strong>brute force</strong>: write out every possible string of moves &mdash; up-up-right, up-right-right, and so on &mdash; and test each one against the maze to see if it lands on the goal. But the count explodes. At every square you have up to four choices, so a sequence ten moves long already has over a million possibilities. The maze itself has only 25 squares, so almost all that effort is wasted re-walking the same ground.</p>
          <p>Two cheap rules cut it down to size. First, <strong>never step onto a square you&rsquo;ve already visited.</strong> If you&rsquo;ve stood there before, you already explored everything reachable from it &mdash; going again teaches you nothing new. Second, <strong>turn around when you&rsquo;re stuck:</strong> if every neighbour of your square is a wall or already-visited, this square leads nowhere, so retreat to where you came from and try a different direction there.</p>
          <p>Those two rules &mdash; mark-as-visited and back-up-when-stuck &mdash; are the entire idea. Instead of a million blind guesses, you walk the maze deliberately, touching each open square at most once.</p>
        </>
      ),
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "Those two rules describe a way of walking — so let's actually walk it by hand.",
      actionLabel: "Make it a rule",
      visual: (api) => <ManualWalk api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 560,
          variant: "main",
          label: "The instinct",
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
          left: 20,
          top: 300,
          width: 250,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The instinct:</strong>{" "}
              the maze from any cell is a smaller copy of the same question &mdash;{" "}
              <em>can I reach G from here?</em>
            </>
          ),
        },
      ],
      detail: (
        <>
          <p>Take the controls. Click any lit neighbour and the walker steps into it; every square it enters gets marked so it won&rsquo;t come back. Pick a direction, push as deep as you can, and keep going until you run out of new squares to enter.</p>
          <p>When you&rsquo;re stuck &mdash; surrounded by walls and already-marked squares &mdash; press <strong>back up</strong>. That retreats one square to where you came from, so you can try a different direction from there. Watch the <em>trail</em>: it snakes outward, jams against a wall, retreats to the last spot where there was an untried choice, and pushes out again. That retreat-and-retry is the heart of the whole method.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The instinct:</strong> the maze starting from <em>any</em> square is just a smaller copy of the same question &mdash; <em>can I reach the goal from here?</em> If one of your neighbours can reach the goal, then so can you. That self-similarity is what lets one simple rule solve the whole maze.</div>
        </>
      ),
      codeLabels: ["recurse", "visit"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "You just did the walk by hand — now let's write down the exact rule so a computer can run it without you.",
      actionLabel: "Count the work",
      visual: (api) => <AutoDfs api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 780,
          variant: "main",
          label: "The derivation",
          title: "Standing at a cell, ask each neighbour.",
          body: (
            <>
              Name the move <code>explore(cell, trail)</code>, where <code>trail</code>{" "}
              is the cells walked so far. On <strong>G</strong>: hand back the trail.
              Elsewhere: mark it visited, then ask each open, unvisited neighbour the
              same question. Out of neighbours: return nothing &mdash; the caller tries
              its next direction. Solving a problem by solving smaller copies of itself
              is <strong>recursion</strong>.
            </>
          ),
        },
      ],
      detail: (
        <>
          <p>Give the move a name: <code>find_path_from(cell, trail)</code>, where <code>trail</code> is the list of squares walked so far to reach this one. There are exactly three cases to handle.</p>
          <p><strong>You&rsquo;re standing on the goal.</strong> Done &mdash; hand back the trail, which is the route that got you here.</p>
          <p><strong>You&rsquo;re on any other square.</strong> First mark it visited so you never come back. Then, for each neighbour in turn: if it&rsquo;s open (not a wall) and not yet visited, ask it the very same question by calling <code>find_path_from(neighbour, trail + neighbour)</code>. If that call hands back a trail, you&rsquo;re finished &mdash; pass it straight up. If it hands back nothing, move on and try the next neighbour.</p>
          <p><strong>You&rsquo;ve run out of neighbours.</strong> Hand back nothing. Whoever called you will then try <em>its</em> next direction. A function that solves a problem by calling itself on smaller copies of the same problem is using <strong>recursion</strong>, and breaking the big maze into &ldquo;solve the maze from each neighbour&rdquo; is called <em>decomposition</em>.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The principle &mdash; decomposition:</strong> the big maze is solved by solving each smaller maze that starts from a neighbour. Once you see that, the recursive rule writes itself.</div>
        </>
      ),
      codeLabels: ["found", "visit", "neighbors", "recurse", "backtrack"],
      interaction: "playback",
    },
    {
      id: "operations",
      label: "The operations",
      connector: "The rule is correct — but is it fast, and how much memory does all that diving cost?",
      actionLabel: "Same shape, new problems",
      visual: (api) => <AutoDfs api={api} showStack />,
      panels: [
        {
          left: 40,
          top: 8,
          width: 780,
          variant: "main",
          label: "The operations",
          title: "Each cell once. Memory grows with the deepest detour.",
          body: (
            <>
              Work grows as <strong>O(cells + walls)</strong> &mdash; here a few dozen
              checks, since the visited mark touches each cell once. Memory is the{" "}
              <strong>stack</strong>: paused calls waiting to resume. The live trail{" "}
              <span className="text-[var(--diff-easy)]">is</span> that stack &mdash; a
              20-cell detour stacks 20 deep before retreating.
            </>
          ),
        },
      ],
      detail: (
        <>
          <p>Because every square gets marked visited the first time we stand on it, each square becomes the &ldquo;current&rdquo; square at most once. From each one we glance at its four neighbours. So the total work is <code>O(cells + walls)</code> &mdash; &ldquo;order cells-plus-walls&rdquo; just means the effort grows in step with how many squares there are plus how many connections we check between them. For a 5&times;5 grid that&rsquo;s a few dozen checks at the very most, not a million.</p>
          <p>Now the memory cost. Each unfinished call to <code>find_path_from</code> is paused, waiting for the deeper call it made to come back. Those paused calls pile up on a <strong>stack</strong> &mdash; a stack is just a pile where the last thing added is the first thing removed, like a stack of plates. There&rsquo;s one paused call per square along the current trail, so the trail you see on screen <em>is</em> the stack. If the deepest dead-end is twenty squares in, the stack grows twenty deep before the walker starts retreating.</p>
          <p>For a very wide, twisty maze that pile can get tall. Real systems sometimes replace the self-calling (recursive) walk with an explicit list of squares-still-to-visit that they manage by hand. It&rsquo;s the same algorithm &mdash; just different bookkeeping for where to go next.</p>
        </>
      ),
      codeLabels: ["visited", "recurse"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "The generalization",
      connector: "Nothing in that walk actually depended on it being a grid of squares — so where else does it work?",
      actionLabel: "Name the pattern",
      visual: <GraphDive />,
      panels: [
        {
          left: 40,
          top: 8,
          width: 560,
          variant: "main",
          label: "The generalization",
          title: "Not just grids. Anything with neighbours.",
          body: (
            <>
              A cell can be any <strong>node</strong> (a thing-with-links: a dot)
              &mdash; a folder, a friend, a webpage. The same walk crawls a website,
              finds connected groups, or solves a sudoku. Whenever you ask &ldquo;can I
              reach X?&rdquo;, this is the walk.
            </>
          ),
        },
      ],
      detail: (
        <>
          <p>Look back at the rule: a square was just &ldquo;a thing with neighbours.&rdquo; We never relied on it being a grid. Anything with neighbours works the same way &mdash; a folder with subfolders, a friend with friends, a webpage with links. The general name for such a thing-with-links is a <strong>node</strong> (think of it as a dot), and the whole web of dots-and-links is a <em>graph</em>. The walker doesn&rsquo;t care what the dots represent.</p>
          <p>So the exact same walk shows up everywhere, just with a different story: crawl every page on a website, find every connected cluster in a social network, detect a loop in a list of which-task-depends-on-which, hunt through folders for a file, solve a sudoku by trying each empty cell and undoing bad guesses, or count separate islands on a map.</p>
          <p>The trigger is always the same shape of question: &ldquo;<em>can I reach X from here?</em>&rdquo; or &ldquo;<em>what can I reach from here?</em>&rdquo; Whenever you hear that, this is the walk to reach for.</p>
        </>
      ),
      arrows: [{ x1: 240, y1: 162, x2: 240, y2: 226 }],
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
      label: "The pattern",
      connector: "You've built the whole walk from scratch — here's its name and the cues that tell you to reach for it.",
      panels: [
        {
          left: 40,
          top: 18,
          width: 640,
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
      detail: (
        <>
          <p>That&rsquo;s the name: <strong>Depth-First Search</strong>, or DFS. It&rsquo;s called <em>depth-first</em> because at each step you go as <em>deep</em> as you can &mdash; push along one path until you&rsquo;re stuck &mdash; before turning around to try anything else. The opposite habit, checking everything close before anything far, is a different walk (breadth-first) you&rsquo;ll meet next.</p>
          <p>Reach for DFS when you see any of these signals:</p>
          <ul>
            <li>&ldquo;Is there a path / can I reach it / does it connect?&rdquo;</li>
            <li>&ldquo;Visit every connected thing&rdquo; &mdash; count the separate clusters, or fill in a whole region.</li>
            <li>&ldquo;Try a choice, undo it, try the next&rdquo; &mdash; puzzles like sudoku or placing queens on a chessboard.</li>
            <li>The natural answer is recursive: each step looks just like the original problem, one size smaller.</li>
          </ul>
          <p>Open the code drawer to see the Python. The recursive helper does all the real work; the few lines around it just create the visited set and kick the walk off at the start.</p>
        </>
      ),
      arrows: [{ x1: GG.cx(GOAL[0], GOAL[1]), y1: 162, x2: GG.cx(GOAL[0], GOAL[1]), y2: GG.cy(GOAL[0], GOAL[1]) - GG.cellPx / 2 - 4 }],
      codeLabels: ["found"],
    },
  ],
};
