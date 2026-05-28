"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Cell = [number, number];

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
}

export function DfsVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <MazeStaticViz />;
  if (step === 3) return <ManualWalkViz onInteraction={onWedgeInteraction} />;
  return <AutoDfsViz />;
}

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function CellBox({
  r,
  c,
  state,
}: {
  r: number;
  c: number;
  state:
    | "wall"
    | "start"
    | "goal"
    | "current"
    | "visited"
    | "trail"
    | "idle";
}) {
  const bg =
    state === "wall"
      ? "var(--bg-elevated)"
      : state === "current"
      ? "color-mix(in oklab, var(--accent-sky) 42%, var(--bg-card))"
      : state === "trail"
      ? "color-mix(in oklab, var(--diff-easy) 26%, var(--bg-card))"
      : state === "visited"
      ? "color-mix(in oklab, var(--accent-sky) 14%, var(--bg-card))"
      : state === "start" || state === "goal"
      ? "var(--bg-card)"
      : "var(--bg-card)";
  const border =
    state === "wall"
      ? "var(--line-faint)"
      : state === "current"
      ? "var(--accent-line)"
      : state === "trail"
      ? "var(--diff-easy)"
      : state === "visited"
      ? "color-mix(in oklab, var(--accent-line) 50%, var(--line))"
      : state === "start" || state === "goal"
      ? "var(--text-muted)"
      : "var(--line)";
  return (
    <motion.div
      animate={{ backgroundColor: bg, borderColor: border }}
      transition={{ duration: 0.18 }}
      className="rounded-md border-2 flex items-center justify-center font-mono text-[10px]"
      style={{ width: CELL_PX, height: CELL_PX, color: "var(--text-muted)" }}
    >
      {state === "wall"
        ? ""
        : state === "start"
        ? "S"
        : state === "goal"
        ? "G"
        : state === "current"
        ? "•"
        : ""}
    </motion.div>
  );
}

function MazeGrid({
  current,
  visited,
  trail,
}: {
  current: Cell | null;
  visited: Set<string>;
  trail: Set<string>;
}) {
  return (
    <div className="flex flex-col" style={{ gap: GAP }}>
      {GRID.map((row, r) => (
        <div key={r} className="flex" style={{ gap: GAP }}>
          {row.map((cell, c) => {
            const isStart = r === START[0] && c === START[1];
            const isGoal = r === GOAL[0] && c === GOAL[1];
            const isCurrent = current && current[0] === r && current[1] === c;
            const key = cellKey(r, c);
            let state:
              | "wall"
              | "start"
              | "goal"
              | "current"
              | "visited"
              | "trail"
              | "idle";
            if (cell === 1) state = "wall";
            else if (isCurrent) state = "current";
            else if (trail.has(key)) state = "trail";
            else if (visited.has(key)) state = "visited";
            else if (isStart) state = "start";
            else if (isGoal) state = "goal";
            else state = "idle";
            return <CellBox key={c} r={r} c={c} state={state} />;
          })}
        </div>
      ))}
    </div>
  );
}

/* Steps 1-2 — static maze with sequence-count callout */
function MazeStaticViz() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        a 5×5 maze · is there a way from S to G?
      </div>
      <MazeGrid current={null} visited={new Set()} trail={new Set()} />
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
function ManualWalkViz({ onInteraction }: { onInteraction?: () => void }) {
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
    setWalk({ current: [r, c], trail, visited, done });
  };

  const backup = () => {
    onInteraction?.();
    if (walk.trail.length <= 1) return;
    const trail = walk.trail.slice(0, -1);
    const current = trail[trail.length - 1];
    setWalk({ ...walk, current, trail });
  };

  const reset = () => setWalk(startWalk());

  const trailSet = new Set(walk.trail.map(([r, c]) => cellKey(r, c)));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click an open neighbour · back up when stuck
      </div>
      <div className="flex flex-col" style={{ gap: GAP }}>
        {GRID.map((row, r) => (
          <div key={r} className="flex" style={{ gap: GAP }}>
            {row.map((cell, c) => {
              const isStart = r === START[0] && c === START[1];
              const isGoal = r === GOAL[0] && c === GOAL[1];
              const isCurrent = walk.current[0] === r && walk.current[1] === c;
              const key = cellKey(r, c);
              let state:
                | "wall"
                | "start"
                | "goal"
                | "current"
                | "visited"
                | "trail"
                | "idle";
              if (cell === 1) state = "wall";
              else if (isCurrent) state = "current";
              else if (trailSet.has(key)) state = "trail";
              else if (walk.visited.has(key)) state = "visited";
              else if (isStart) state = "start";
              else if (isGoal) state = "goal";
              else state = "idle";
              const isCandidate =
                cell === 0 &&
                !walk.visited.has(key) &&
                Math.abs(walk.current[0] - r) + Math.abs(walk.current[1] - c) === 1;
              return (
                <button
                  key={c}
                  onClick={() => tryStep(r, c)}
                  disabled={!isCandidate}
                  className="p-0 rounded-md focus:outline-none"
                  style={{
                    cursor: isCandidate ? "pointer" : "default",
                    width: CELL_PX,
                    height: CELL_PX,
                  }}
                  aria-label={`cell ${r},${c}`}
                >
                  <CellBox r={r} c={c} state={state} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
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

/* Steps 4-7 — auto-play DFS with backtracking */
function AutoDfsViz() {
  const [dfs, setDfs] = useState<DfsState>(initDfs());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setDfs((cur) => {
        if (cur.done) {
          setPlaying(false);
          return cur;
        }
        return dfsStep(cur);
      });
    }, 300);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setDfs(initDfs());
    setPlaying(false);
  };

  const stepOnce = () => setDfs((cur) => (cur.done ? cur : dfsStep(cur)));

  const current = dfs.stack.length > 0 ? dfs.stack[dfs.stack.length - 1].cell : null;
  const trailSet = new Set(dfs.trail.map(([r, c]) => cellKey(r, c)));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        dive deep · back up when stuck
      </div>
      <MazeGrid current={current} visited={dfs.visited} trail={trailSet} />
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
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={dfs.done} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
          {playing ? "Pause" : "Play through"}
        </button>
        <button onClick={stepOnce} disabled={dfs.done} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">→</button>
      </div>
    </div>
  );
}
