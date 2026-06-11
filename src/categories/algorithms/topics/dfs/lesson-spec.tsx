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
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
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
    if (w.trail.length <= 1 || w.done) return;
    api.onInteractionDone();
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

/* ── PREDICTION GATE + playback (the operations beat): commit to the mark's
 * fate at a dead end, THEN the AutoDfs playback (stack bracket on) answers it
 * with a visited count that only climbs. The gate is the beat's real
 * interaction (interaction: "wedge"): one pill tap fires
 * api.onInteractionDone() inside PredictGate; after a short reading pause the
 * playback runs. HTML hosted on the SVG canvas via <foreignObject> in the left
 * gutter (the grid fills the centre band); data-canvas-panel opts it into the
 * scene layout's content-extent measurement. ───────────────────────────────── */
const GATE_TRAIL: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
];
const DEAD_END = GATE_TRAIL[GATE_TRAIL.length - 1];

function MarkFateGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current);
  }, []);

  if (revealed) return <AutoDfs api={api} showStack />;

  const walked = new Set(GATE_TRAIL.map(([r, c]) => key(r, c)));
  return (
    <g>
      {maze(DEAD_END, walked, walked)}
      <text
        x={VW / 2}
        y={GG.y0 - 14}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--text-faint)" }}
      >
        stuck: wall right, wall below, walked ground behind
      </text>
      <foreignObject x={12} y={GG.y0 - 28} width={264} height={300} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="The walker must back up out of this dead end — what happens to the mark on the cell it leaves?"
            choices={[
              {
                id: "erased",
                label: "erased — backing up undoes the visit",
                note: "backing up moves the walker, never the marks — no cell is ever explored twice",
              },
              {
                id: "stays",
                label: "it stays — that cell is never explored again",
                correct: true,
                note: "permanent marks are the whole cost story — watch the visited count only climb",
              },
              {
                id: "deadends",
                label: "it stays only because this is a dead end",
                note: "junction or dead end, every mark is permanent — neighbours are tried from the first visit, never by re-entering",
              },
            ]}
            onRevealed={() => {
              timer.current = window.setTimeout(() => setRevealed(true), pace(1800));
            }}
          />
        </div>
      </foreignObject>
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

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, derive, operations,
 *                general, name)
 *   structured : 5 — cuts `obvious` (its naive count folds into the wedge's
 *                structured connector) and `general`
 *   rigorous   : 3 — derive (rule + invariant, opener) + operations (exact
 *                cost & edges, with the gate) + name (close, stamped)
 *   refresh    : additionally trims `obvious` + `general` (trimOnRefresh).    */
export const dfsLesson: LessonSpec = {
  topicTitle: "depth-first search · escape the maze",
  // Opt into the one-scene immersive layout (proven on binary-search).
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: dfsPy as string,
  // Standing on recursion (the bridge anchor, per TRACK-NARRATIVES.md): the
  // learner just banked "trust the smaller call" — DFS points that self-call
  // at a space: go deep, back up.
  bridgeFrom: reg({
    base: "A function that calls itself on a smaller piece can solve the whole — now point that self-call at a maze.",
    intuitive: "You've seen a problem solve itself by trusting a smaller copy of itself — now use that trick to walk a maze.",
    rigorous: "Recursion: base case + self-call on a smaller instance. Here the instance is a space — go deep, back up.",
  }),
  // From meta (TRACK-NARRATIVES row 25): decomposition, idea 4 of 7 —
  // recursion walking a space; the close states it as the lesson's idea.
  principle: { key: "decomposition", n: 4, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      // Rigorous opens at the derivation — its bridge line renders there.
      registers: ["intuitive", "structured"],
      actionLabel: reg({
        base: "The naive idea",
        structured: "Walk it by hand", // structured skips `obvious`
      }),
      takeaway: "A maze: reach G from S, seeing only one cell at a time.",
      visual: maze(null, emptySet, emptySet),
      panels: [
        {
          left: 40,
          top: 20,
          width: 640,
          variant: "main",
          label: "The setup",
          title: "A small maze. Reach the corner.",
          body: reg({
            base: (
            <>
              A 5&times;5 grid. You start at <strong>S</strong> (top-left); the goal
              is <strong>G</strong> (bottom-right). Filled cells are walls &mdash;
              you can&rsquo;t pass. You may step one cell up, down, left or right.
              Your eye finds a way instantly; a computer sees only one cell at a
              time.
            </>
          ),
            intuitive: (
              <>
                A little maze: 5 rows, 5 columns. You stand on <strong>S</strong>;
                you want to reach <strong>G</strong>. Filled squares are walls. One
                step at a time &mdash; up, down, left or right. Your eye sees the
                whole board and spots a route in a second. The computer can&rsquo;t:
                it stands on one square and sees only the squares touching it. The
                job is to teach it to escape anyway.
              </>
            ),
          }),
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
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Since the computer can only see one cell at a time, what is the most naive thing it could try?",
      actionLabel: "Two rules that tame it",
      takeaway: "Trying every move blindly explodes — so: never revisit, and back up when stuck.",
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
      registers: ["intuitive", "structured"],
      // structured never saw `obvious` — its connector folds the naive count
      // in (the E17 seed survives the cut), per the arrays exemplar.
      connector: reg({
        base: "Those two rules describe a way of walking — so let's actually walk it by hand.",
        structured:
          "Blind enumeration explodes — four moves a step is a million sequences by ten steps, on a 25-cell maze. Two rules tame it: never re-enter a cell, back up when stuck. Now walk them by hand.",
      }),
      actionLabel: "Make it a rule",
      takeaway: reg({
        base: "Dig deep down one path; back up when stuck — the maze from any cell is the same question, smaller.",
        intuitive: "Go deep down one path, back up when stuck — every square asks the same smaller question.",
      }),
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
      // Rigorous OPENS here — bridgeFrom renders above this connector, which
      // therefore states the problem in one breath for that register.
      connector: reg({
        base: "You just did the walk by hand — now let's write down the exact rule so a computer can run it without you.",
        rigorous: "Reach G from S in a walled grid: one visited set and one self-call exhaust it — state the rule and its invariant.",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "The rule: mark visited, then ask each neighbour the same question — a function that calls itself (recursion).",
        intuitive: "Mark the square, then ask each open neighbour the same smaller question — the rule runs itself.",
        rigorous: "Mark visited before recursing — each open cell spawns at most one call, so the walk ends.",
      }),
      visual: (api) => <AutoDfs api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 780,
          variant: "main",
          label: "The derivation",
          title: reg({
            base: "Standing at a cell, ask each neighbour.",
            rigorous: "Mark, then recurse on open unvisited neighbours.",
          }),
          body: reg({
            base: (
            <>
              Name the move <code>explore(cell, trail)</code>, where <code>trail</code>{" "}
              is the cells walked so far. On <strong>G</strong>: hand back the trail.
              Elsewhere: mark it visited, then ask each open, unvisited neighbour the
              same question. Out of neighbours: return nothing &mdash; the caller tries
              its next direction. Solving a problem by solving smaller copies of itself
              is <Term word="recursion"><strong>recursion</strong></Term>.
            </>
          ),
            intuitive: (
              <>
                Give the move a name: <code>explore</code>. Standing on <strong>G</strong>?
                Done &mdash; hand the trail back. Standing anywhere else? Mark the square
                so you never return, then ask each open, unmarked neighbour the very same
                question: <em>can you reach G from here?</em> If every neighbour says no,
                say no too &mdash; whoever asked you tries their next direction. A rule
                that runs itself on a smaller piece of the same problem is{" "}
                <Term word="recursion"><strong>recursion</strong></Term>.
              </>
            ),
            rigorous: (
              <>
                <code>explore(cell, trail)</code>: on <strong>G</strong>, return the
                trail. Otherwise add the cell to <code>visited</code>, recurse on each
                in-bounds, open, unvisited neighbour, and propagate the first hit;
                neighbours exhausted &mdash; return <code>None</code>. The{" "}
                <Term word="invariant">invariant</Term>: a cell enters{" "}
                <code>visited</code> before its neighbours are tried, and never leaves
                &mdash; so no cell is explored twice and the walk must end.
              </>
            ),
          }),
        },
      ],
      detail: reg({
        base: (
        <>
          <p>Give the move a name: <code>find_path_from(cell, trail)</code>, where <code>trail</code> is the list of squares walked so far to reach this one. There are exactly three cases to handle.</p>
          <p><strong>You&rsquo;re standing on the goal.</strong> Done &mdash; hand back the trail, which is the route that got you here.</p>
          <p><strong>You&rsquo;re on any other square.</strong> First mark it visited so you never come back. Then, for each neighbour in turn: if it&rsquo;s open (not a wall) and not yet visited, ask it the very same question by calling <code>find_path_from(neighbour, trail + neighbour)</code>. If that call hands back a trail, you&rsquo;re finished &mdash; pass it straight up. If it hands back nothing, move on and try the next neighbour.</p>
          <p><strong>You&rsquo;ve run out of neighbours.</strong> Hand back nothing. Whoever called you will then try <em>its</em> next direction. A function that solves a problem by calling itself on smaller copies of the same problem is using <strong>recursion</strong>, and breaking the big maze into &ldquo;solve the maze from each neighbour&rdquo; is called <em>decomposition</em>.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The principle &mdash; decomposition:</strong> the big maze is solved by solving each smaller maze that starts from a neighbour. Once you see that, the recursive rule writes itself.</div>
        </>
      ),
        rigorous: (
          <>
            <p><strong>Invariant.</strong> <code>visited</code> only grows, and a cell joins it before its neighbours are tried. So each open cell spawns at most one <code>explore</code> call, the call tree has at most one node per open cell, and termination is forced: every recursive call strictly grows <code>visited</code>, which is bounded by the open-cell count.</p>
            <p><strong>Correctness sketch.</strong> The explored set is closed under adjacency: every open neighbour of an explored cell is itself explored by the loop or was visited earlier. So the walk reaches exactly the cells reachable from S &mdash; if G is reachable, some call stands on it, the base case fires, and the trail propagates up unchanged. Each <Term word="frame">frame</Term> extended the trail by one adjacent open cell, so the returned list is a genuine path &mdash; the route the <Term word="call stack">call stack</Term> walked.</p>
          </>
        ),
      }),
      codeLabels: ["found", "visit", "neighbors", "recurse", "backtrack"],
      interaction: "playback",
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "The rule is correct — but is it fast, and how much memory does all that diving cost?",
        rigorous: "The rule is correct; what remains is its exact price — commit to a prediction, then count.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern", // structured + rigorous skip `general`
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Each cell visited once — O(cells + connections), i.e. O(V + E); memory is the stack, as deep as the longest detour.",
        intuitive: "Marks make each square's work happen once — effort grows with the maze, memory with the detour.",
        rigorous: "O(V + E) time, O(V) stack worst case — and the path found is not the shortest.",
      }),
      // The ONE prediction gate (the cost predict, per BEAT-RITUAL): the mark's
      // fate is guessable from the wedge/derive walks but not yet shown.
      visual: (api) => <MarkFateGate api={api} />,
      panels: [
        {
          left: 40,
          top: 8,
          width: 780,
          variant: "main",
          label: "The operations",
          title: "Each cell once. Memory grows with the deepest detour.",
          body: reg({
            base: (
            <>
              Work grows as <strong>O(cells + connections)</strong> &mdash; here a few dozen
              checks, since the visited mark touches each cell once. Memory is the{" "}
              <strong>stack</strong>: paused calls waiting to resume. The live trail{" "}
              <span className="text-[var(--diff-easy)]">is</span> that stack &mdash; a
              20-cell detour stacks 20 deep before retreating.
            </>
          ),
            intuitive: (
              <>
                Watch the <em>visited</em> number once it runs: it only climbs &mdash;
                each open square is explored once, ever, with a glance at up to four
                neighbours. Counted like that, the work grows in step with squares plus
                the connections between them &mdash; written{" "}
                <Term word="O(cells + connections)"><code>O(cells + connections)</code></Term>.
                Memory is the pile of paused calls (a <Term word="stack">stack</Term>):
                the trail on screen <em>is</em> that pile, one paused call per square of
                the current detour.
              </>
            ),
            rigorous: (
              <>
                Each open cell is explored at most once (the permanent mark) and scans
                at most four neighbours &mdash; the playback&rsquo;s visited counter is
                that count, live. Total:{" "}
                <Term word="O(V + E)"><code>O(V + E)</code></Term>; on a grid,{" "}
                <Term word="O(rows × cols)"><code>O(rows × cols)</code></Term>. Space is
                the recursion depth &mdash; the longest live trail &mdash; plus the
                visited set: O(V) worst case.
              </>
            ),
          }),
        },
      ],
      detail: reg({
        base: (
        <>
          <p>Because every square gets marked visited the first time we stand on it, each square becomes the &ldquo;current&rdquo; square at most once. From each one we glance at its four neighbours. So the total work is <code>O(cells + connections)</code> &mdash; &ldquo;order cells-plus-connections&rdquo; just means the effort grows in step with how many squares there are plus how many connections we check between them. (In graph terms that&rsquo;s the classic <code>O(V + E)</code>.) For a 5&times;5 grid that&rsquo;s a few dozen checks at the very most, not a million.</p>
          <p>Now the memory cost. Each unfinished call to <code>find_path_from</code> is paused, waiting for the deeper call it made to come back. Those paused calls pile up on a <strong>stack</strong> &mdash; a stack is just a pile where the last thing added is the first thing removed, like a stack of plates. There&rsquo;s one paused call per square along the current trail, so the trail you see on screen <em>is</em> the stack. If the deepest dead-end is twenty squares in, the stack grows twenty deep before the walker starts retreating.</p>
          <p>For a very wide, twisty maze that pile can get tall. Real systems sometimes replace the self-calling (recursive) walk with an explicit list of squares-still-to-visit that they manage by hand. It&rsquo;s the same algorithm &mdash; just different bookkeeping for where to go next.</p>
        </>
      ),
        rigorous: (
          <>
            <p><strong>Exact cost.</strong> One <code>explore</code> call per open cell, four direction checks per call: time <Term word="O(V + E)"><code>O(V + E)</code></Term>, and on a grid E &le; 4V, so <Term word="O(rows × cols)"><code>O(rows × cols)</code></Term>. Space: the visited set is O(V); the <Term word="call stack">call stack</Term> holds one <Term word="frame">frame</Term> per trail cell &mdash; O(V) worst case, when the path snakes the whole board.</p>
            <p><strong>Edges.</strong> start == goal returns <code>[start]</code> before any marking. An unreachable goal costs the whole component, then <code>None</code> &mdash; never an infinite loop, because marks never come off. The path returned is whatever the direction order stumbles into, <em>not</em> the shortest &mdash; shortest needs the nearest-first walk, next lesson. And depth bites in Python: around a thousand stacked calls hit the default recursion limit, so production code often swaps in an explicit stack &mdash; the same walk, hand-managed bookkeeping.</p>
          </>
        ),
      }),
      codeLabels: ["visited", "recurse"],
      interaction: "wedge",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Nothing in that walk actually depended on it being a grid of squares — so where else does it work?",
      actionLabel: "Name the pattern",
      takeaway: "A cell is just a node with neighbours — the same walk crawls graphs: files, links, friends.",
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
      connector: reg({
        base: "You've built the whole walk from scratch — here's its name and the cues that tell you to reach for it.",
        rigorous: "Name it, and file it under the idea it implements.",
      }),
      takeaway: reg({
        base: "It's Depth-First Search — reach for it on “is there a path?”, “visit everything connected”, or “try, undo, retry”.",
        intuitive: "Depth-First Search: dive deep, back up when stuck — the answer to “can I reach it?”",
        rigorous: "DFS = recursion over a graph: O(V + E), depth-deep stack — decomposition, idea 4 of 7.",
      }),
      panels: [
        {
          left: 40,
          top: 18,
          width: 640,
          variant: "main",
          label: "The pattern",
          title: "Depth-First Search.",
          body: reg({
            base: (
            <>
              That&rsquo;s the name &mdash; <em>depth-first</em> because at each step
              you go as deep as you can before turning around. Spot it when you hear
              &ldquo;is there a path / does it connect?&rdquo;, &ldquo;visit every
              connected thing&rdquo;, or &ldquo;try a choice, undo it, try the next&rdquo;
              &mdash; and when the natural answer calls itself.
            </>
          ),
            intuitive: (
              <>
                The name: <strong>Depth-First Search</strong> &mdash; <em>depth-first</em>{" "}
                because you dive as deep as you can before turning back. Hear &ldquo;is
                there a path?&rdquo;, &ldquo;visit everything connected&rdquo;, or
                &ldquo;try it, undo it, try the next&rdquo; &mdash; reach for this walk.
                And it&rsquo;s idea 4 of 7,{" "}
                <Term word="decomposition">decomposition</Term>, out walking: every
                square&rsquo;s question is the same question, smaller.
              </>
            ),
            rigorous: (
              <>
                <strong>Depth-First Search</strong>: recursion over a graph &mdash;
                descend, exhaust, back up. Cues: reachability, full-component visits,
                try-undo-retry. It is idea 4 of 7,{" "}
                <Term word="decomposition">decomposition</Term>, applied to a space:
                the problem at any node is the same problem on the unvisited remainder.
              </>
            ),
          }),
        },
      ],
      detail: reg({
        base: (
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
        intuitive: (
          <>
            <p>You built it from nothing, and it has a famous name: <strong>Depth-First Search</strong> &mdash; DFS. <em>Depth-first</em> because at every step you push as <em>deep</em> as you can down one path before you ever turn around. (The opposite habit &mdash; check everything near before anything far &mdash; is a different walk called breadth-first, and it&rsquo;s the very next lesson.)</p>
            <p>Reach for it the moment a problem sounds like: &ldquo;is there a path / can I reach it?&rdquo;, &ldquo;visit every connected thing&rdquo; (count the clusters, fill a region), or &ldquo;try a choice, undo it, try the next&rdquo; (sudoku, queens on a chessboard). Or whenever the natural answer uses itself &mdash; each step the same problem, one square smaller.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7 &mdash; decomposition:</strong> the maze from any square is a smaller maze. You met the idea in recursion as &ldquo;trust the smaller call&rdquo; &mdash; DFS is that trust out walking a whole world, one neighbour at a time.
            </div>
            <p>Open the code drawer to see the Python. The recursive helper does all the real work; the few lines around it just create the visited set and kick the walk off.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Depth-First Search.</strong> The visited set plus the recursive descent is the entire algorithm; the rest is bookkeeping. Standard variants: an explicit stack instead of recursion (no depth limit), entry/exit ordering on the calls (pre/post-order), and an outer loop over unvisited starts to cover disconnected graphs.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7 &mdash; decomposition:</strong> &ldquo;reach G from here&rdquo; decomposes into &ldquo;reach G from a neighbour&rdquo; on the unvisited remainder &mdash; recursion pointed at a space. Backtracking, later in the track, is this exact walk over a space of choices, plus pruning.
            </div>
          </>
        ),
      }),
      arrows: [{ x1: GG.cx(GOAL[0], GOAL[1]), y1: 162, x2: GG.cx(GOAL[0], GOAL[1]), y2: GG.cy(GOAL[0], GOAL[1]) - GG.cellPx / 2 - 4 }],
      codeLabels: ["found"],
    },
  ],
};
