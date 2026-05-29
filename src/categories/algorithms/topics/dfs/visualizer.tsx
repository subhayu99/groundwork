"use client";

import { useState } from "react";
import { GridViz, type CellSpec } from "@/shared/viz/GridViz";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";

type Cell = [number, number];

/**
 * algorithm.py `@sync:` labels, mirrored here so the live visualizer can emit the
 * exact source lines it is "executing". Resolved against algorithm.py at render
 * time — no hand-maintained line numbers, so the highlight can never drift.
 */
const LINE_VISIT = "visit"; // visited.add((r, c))
const LINE_RECURSE = "recurse"; // explore(nr, nc, trail + [(nr, nc)]) — descend into neighbour
const LINE_BACKTRACK = "backtrack"; // return None — dead end, back up to caller
const LINE_FOUND = "found"; // if (r, c) == end: return trail

const GRID: number[][] = [
  [0, 0, 0, 0, 1],
  [1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
];
const ROWS = GRID.length;
const COLS = GRID[0].length;
const START: Cell = [0, 0];
const GOAL: Cell = [ROWS - 1, COLS - 1];
const CELL_PX = 56;
const GAP = 6;

const DIRS: Cell[] = [
  [0, 1],  // right
  [1, 0],  // down
  [0, -1], // left
  [-1, 0], // up
];

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function DfsVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <MazeStaticViz />;
  if (step === 3) return <ManualWalkViz onInteraction={onWedgeInteraction} onActiveLine={onActiveLine} />;
  return <AutoDfsViz onActiveLine={onActiveLine} />;
}

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

/** Map a maze cell to a GridViz CellSpec, preserving the original tone/content. */
function mazeCell(
  r: number,
  c: number,
  current: Cell | null,
  visited: Set<string>,
  trail: Set<string>,
): CellSpec {
  const isStart = r === START[0] && c === START[1];
  const isGoal = r === GOAL[0] && c === GOAL[1];
  const isCurrent = current != null && current[0] === r && current[1] === c;
  const key = cellKey(r, c);
  if (GRID[r][c] === 1) return { tone: "wall" };
  if (isCurrent) return { tone: "active", content: "•" };
  if (trail.has(key)) return { tone: "trail" };
  if (visited.has(key)) return { tone: "visited" };
  if (isStart) return { tone: "start", content: "S" };
  if (isGoal) return { tone: "goal", content: "G" };
  return { tone: "idle" };
}

/* Steps 1-2 — static maze with sequence-count callout */
function MazeStaticViz() {
  const emptyVisited = new Set<string>();
  const emptyTrail = new Set<string>();
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        a 5×5 maze · is there a way from S to G?
      </div>
      <GridViz
        rows={ROWS}
        cols={COLS}
        cellPx={CELL_PX}
        gap={GAP}
        cell={(r, c) => mazeCell(r, c, null, emptyVisited, emptyTrail)}
      />
      <div className="font-mono text-xs text-[var(--text-muted)] max-w-[320px] text-center">
        sequences of 10 moves to try, blind:{" "}
        <span className="text-[var(--diff-hard)]">4<sup>10</sup> = 1,048,576</span>
        <br />
        cells in the maze: <span className="text-[var(--diff-easy)]">25</span>
      </div>
    </div>
  );
}

interface WalkState {
  current: Cell;
  trail: Cell[];
  visited: Set<string>;
  done: boolean;
}

function startWalk(): WalkState {
  return {
    current: [...START],
    trail: [[...START]],
    visited: new Set([cellKey(START[0], START[1])]),
    done: false,
  };
}

function openAndUnvisited(r: number, c: number, visited: Set<string>): boolean {
  return (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    GRID[r][c] === 0 &&
    !visited.has(cellKey(r, c))
  );
}

/* Step 3 — manual: click an open adjacent cell to step there. */
function ManualWalkViz({
  onInteraction,
  onActiveLine,
}: {
  onInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}) {
  const [walk, setWalk] = useState<WalkState>(startWalk());

  const tryStep = (r: number, c: number) => {
    onInteraction?.();
    const [cr, cc] = walk.current;
    const isAdjacent = Math.abs(cr - r) + Math.abs(cc - c) === 1;
    if (!isAdjacent || !openAndUnvisited(r, c, walk.visited)) return;
    const key = cellKey(r, c);
    const trail = [...walk.trail, [r, c] as Cell];
    const visited = new Set(walk.visited);
    visited.add(key);
    const done = r === GOAL[0] && c === GOAL[1];
    // Stepping into a neighbour = recurse, then mark it visited; goal = return.
    onActiveLine?.(done ? [LINE_FOUND] : [LINE_RECURSE, LINE_VISIT]);
    setWalk({ current: [r, c], trail, visited, done });
  };

  const backup = () => {
    onInteraction?.();
    if (walk.trail.length <= 1) return;
    const trail = walk.trail.slice(0, -1);
    const current = trail[trail.length - 1];
    onActiveLine?.([LINE_BACKTRACK]);
    setWalk({ ...walk, current, trail });
  };

  const reset = () => setWalk(startWalk());

  const trailSet = new Set(walk.trail.map(([r, c]) => cellKey(r, c)));

  const isCandidate = (r: number, c: number) =>
    GRID[r][c] === 0 &&
    !walk.visited.has(cellKey(r, c)) &&
    Math.abs(walk.current[0] - r) + Math.abs(walk.current[1] - c) === 1;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click an open neighbour · back up when stuck
      </div>
      <GridViz
        rows={ROWS}
        cols={COLS}
        cellPx={CELL_PX}
        gap={GAP}
        cell={(r, c) => mazeCell(r, c, walk.current, walk.visited, trailSet)}
        onCellClick={tryStep}
        cellDisabled={(r, c) => !isCandidate(r, c)}
      />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        steps: <span className="text-[var(--text)]">{walk.trail.length - 1}</span>
        <span className="mx-3">·</span>
        visited: <span className="text-[var(--accent)]">{walk.visited.size}</span>
        {walk.done && <span className="text-[var(--diff-easy)] ml-3">✓ reached G</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={backup} disabled={walk.trail.length <= 1} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">
          back up
        </button>
      </div>
    </div>
  );
}

interface DfsFrame {
  cell: Cell;
  dirIdx: number;
}

interface DfsState {
  stack: DfsFrame[];
  visited: Set<string>;
  trail: Cell[];
  found: boolean;
  done: boolean;
}

function initDfs(): DfsState {
  return {
    stack: [{ cell: [...START], dirIdx: 0 }],
    visited: new Set([cellKey(START[0], START[1])]),
    trail: [[...START]],
    found: false,
    done: false,
  };
}

function dfsStep(state: DfsState): DfsState {
  if (state.found || state.done) return state;
  const stack = [...state.stack];
  if (stack.length === 0) return { ...state, done: true };
  const top = stack[stack.length - 1];
  const [r, c] = top.cell;
  if (r === GOAL[0] && c === GOAL[1]) {
    return { ...state, found: true, done: true };
  }
  if (top.dirIdx >= DIRS.length) {
    // Exhausted neighbours. Backtrack.
    stack.pop();
    const trail = state.trail.slice(0, -1);
    if (stack.length === 0) return { ...state, stack, trail, done: true };
    return { ...state, stack, trail };
  }
  const [dr, dc] = DIRS[top.dirIdx];
  const nr = r + dr;
  const nc = c + dc;
  const newTop: DfsFrame = { ...top, dirIdx: top.dirIdx + 1 };
  const newStackHead = [...stack.slice(0, -1), newTop];
  if (openAndUnvisited(nr, nc, state.visited)) {
    const visited = new Set(state.visited);
    visited.add(cellKey(nr, nc));
    const trail = [...state.trail, [nr, nc] as Cell];
    return {
      ...state,
      stack: [...newStackHead, { cell: [nr, nc], dirIdx: 0 }],
      visited,
      trail,
      found: nr === GOAL[0] && nc === GOAL[1],
      done: nr === GOAL[0] && nc === GOAL[1],
    };
  }
  return { ...state, stack: newStackHead };
}

/**
 * Classify what a single dfsStep does to its state, mapping it to the
 * algorithm.py line that the step represents. Mirrors dfsStep's branches.
 */
function lineForStep(prev: DfsState, next: DfsState): (number | string)[] | null {
  if (prev.done) return null;
  if (next.found) return [LINE_FOUND]; // reached goal → return trail
  if (next.stack.length < prev.stack.length) return [LINE_BACKTRACK]; // popped → back up
  if (next.trail.length > prev.trail.length) return [LINE_RECURSE, LINE_VISIT]; // descended → mark visited
  return null; // advanced dirIdx without moving — no source line of interest
}

/* Steps 4-7 — auto-play DFS with backtracking */
function AutoDfsViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  // Pure reducer: one DFS operation per frame. `dfsStep` advances the search and
  // `lineForStep` classifies the transition into the algorithm.py @sync label it
  // executed — recurse/visit when descending, backtrack when popping, found at the
  // goal — so the highlighted code line marches in lockstep with the animation.
  const step = (s: DfsState): AlgoFrame<DfsState> => {
    const next = dfsStep(s);
    return {
      state: next,
      active: lineForStep(s, next) ?? [],
      done: next.done,
    };
  };

  return (
    <AnimatedAlgorithmView<DfsState>
      initial={initDfs}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={[LINE_VISIT]}
      intervalMs={300}
      playLabel="Play through"
      render={(dfs) => {
        const current = dfs.stack.length > 0 ? dfs.stack[dfs.stack.length - 1].cell : null;
        const trailSet = new Set(dfs.trail.map(([r, c]) => cellKey(r, c)));
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
              dive deep · back up when stuck
            </div>
            <GridViz
              rows={ROWS}
              cols={COLS}
              cellPx={CELL_PX}
              gap={GAP}
              cell={(r, c) => mazeCell(r, c, current, dfs.visited, trailSet)}
            />
            <div className="font-mono text-xs text-[var(--text-muted)]">
              stack depth: <span className="text-[var(--accent)]">{dfs.stack.length}</span>
              <span className="mx-3">·</span>
              visited: <span className="text-[var(--text)]">{dfs.visited.size}</span>
              {dfs.found && (
                <span className="text-[var(--diff-easy)] ml-3">
                  ✓ trail length {dfs.trail.length - 1}
                </span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
