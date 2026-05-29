"use client";

import { useMemo, useState } from "react";
import { GridViz } from "@/shared/viz/GridViz";
import { StackPanel } from "@/shared/viz/StackPanel";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";
import type { Tone } from "@/shared/viz/tones";

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
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

/* @sync labels — resolved against bfs/algorithm.py (single source of truth) */
const LINE_INIT_QUEUE = "init_queue"; // queue = deque([(start, 0)]) — the starting frame
const LINE_DEQUEUE = "dequeue"; // (r, c), d = queue.popleft() — pull from front + read distance d
const LINE_GOAL = ["visit", "found"]; // (r, c) == end → return d (first sighting is shortest)
const LINE_MARK_VISITED = "mark"; // visited.add((nr, nc))
const LINE_ENQUEUE = "enqueue"; // queue.append(((nr, nc), d + 1)) — push neighbour + distance d + 1

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function BfsVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <ContrastViz />;
  if (step === 3) return <RippleViz onInteraction={onWedgeInteraction} />;
  return <DerivedBfsViz onActiveLine={onActiveLine} />;
}

function MazeWithDistances({
  distances,
  active,
  showDistances,
}: {
  distances: Record<string, number>;
  active: Cell | null;
  showDistances: boolean;
}) {
  return (
    <GridViz
      rows={ROWS}
      cols={COLS}
      cellPx={CELL_PX}
      gap={GAP}
      cell={(r, c) => {
        const key = cellKey(r, c);
        const isStart = r === START[0] && c === START[1];
        const isGoal = r === GOAL[0] && c === GOAL[1];
        const isActive = active != null && active[0] === r && active[1] === c;
        const d = distances[key];
        const hasD = typeof d === "number";
        let tone: Tone;
        if (GRID[r][c] === 1) tone = "wall";
        else if (isActive) tone = "active";
        else if (isStart) tone = "start";
        else if (isGoal) tone = "goal";
        else if (hasD) tone = "visited";
        else tone = "idle";
        if (GRID[r][c] === 1) return { tone };
        return {
          tone,
          content: isStart ? "S" : isGoal ? "G" : "",
          sub: showDistances && hasD ? d : undefined,
        };
      }}
    />
  );
}

/* Steps 1-2 — show DFS finding A path (not necessarily shortest) */
function ContrastViz() {
  // Pre-computed DFS path with this maze, our DIRS order [right, down, left, up].
  // Reuses Manhattan-ish trail length 8.
  const dfsPath: Cell[] = useMemo(
    () => [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 4],
      [4, 4],
    ],
    [],
  );
  const shortest = 8;
  const dfsLen = dfsPath.length - 1;
  const trailSet = new Set(dfsPath.map(([r, c]) => cellKey(r, c)));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        depth-first finds a path · is it the shortest?
      </div>
      <GridViz
        rows={ROWS}
        cols={COLS}
        cellPx={CELL_PX}
        gap={GAP}
        cell={(r, c) => {
          const isStart = r === START[0] && c === START[1];
          const isGoal = r === GOAL[0] && c === GOAL[1];
          const key = cellKey(r, c);
          const onTrail = trailSet.has(key);
          let tone: Tone;
          if (GRID[r][c] === 1) tone = "wall";
          else if (onTrail) tone = "trail";
          else tone = "idle";
          if (GRID[r][c] === 1) return { tone };
          return { tone, content: isStart ? "S" : isGoal ? "G" : "" };
        }}
      />
      <div className="font-mono text-xs text-[var(--text-muted)] max-w-[320px] text-center">
        depth-first length: <span className="text-[var(--diff-easy)]">{dfsLen}</span>
        <span className="mx-3">·</span>
        actual shortest: <span className="text-[var(--diff-easy)]">{shortest}</span>
        <br />
        on this maze they match. on a different maze depth-first could be much longer.
      </div>
    </div>
  );
}

interface RippleState {
  distances: Record<string, number>;
  ring: number;
  reachedGoalAt: number | null;
}

function nextRing(state: RippleState): RippleState {
  const cur = state.ring;
  const frontier: Cell[] = [];
  Object.entries(state.distances).forEach(([k, d]) => {
    if (d === cur) {
      const [r, c] = k.split(",").map(Number);
      frontier.push([r, c]);
    }
  });
  const distances = { ...state.distances };
  let reachedGoal = state.reachedGoalAt;
  for (const [r, c] of frontier) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < ROWS &&
        nc >= 0 &&
        nc < COLS &&
        GRID[nr][nc] === 0 &&
        distances[cellKey(nr, nc)] === undefined
      ) {
        distances[cellKey(nr, nc)] = cur + 1;
        if (nr === GOAL[0] && nc === GOAL[1] && reachedGoal === null) {
          reachedGoal = cur + 1;
        }
      }
    }
  }
  return { distances, ring: cur + 1, reachedGoalAt: reachedGoal };
}

function initRipple(): RippleState {
  return {
    distances: { [cellKey(START[0], START[1])]: 0 },
    ring: 0,
    reachedGoalAt: null,
  };
}

/* Step 3 — ring-by-ring spread, manual or play */
function RippleViz({ onInteraction }: { onInteraction?: () => void }) {
  const [state, setState] = useState<RippleState>(initRipple());

  const stepRing = () => {
    onInteraction?.();
    setState((cur) => (cur.reachedGoalAt !== null ? cur : nextRing(cur)));
  };

  const pb = usePlayback({
    onTick: () => setState((cur) => nextRing(cur)),
    isDone: () => state.reachedGoalAt !== null,
    intervalMs: 480,
  });

  const reset = () => {
    setState(initRipple());
    pb.stop();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        ring {state.ring} · closer cells lit first
      </div>
      <MazeWithDistances distances={state.distances} active={null} showDistances />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        cells reached: <span className="text-[var(--accent)]">{Object.keys(state.distances).length}</span>
        {state.reachedGoalAt !== null && (
          <span className="text-[var(--diff-easy)] ml-3">
            ✓ goal at distance {state.reachedGoalAt}
          </span>
        )}
      </div>
      <PlaybackControls
        playing={pb.playing}
        onToggle={pb.toggle}
        onReset={reset}
        onStep={stepRing}
        atEnd={state.reachedGoalAt !== null}
        playLabel="Play through"
      />
    </div>
  );
}

interface BfsState {
  queue: Array<{ cell: Cell; d: number }>;
  visited: Set<string>;
  distances: Record<string, number>;
  active: Cell | null;
  reachedGoalAt: number | null;
  done: boolean;
}

function initBfs(): BfsState {
  return {
    queue: [{ cell: [...START], d: 0 }],
    visited: new Set([cellKey(START[0], START[1])]),
    distances: { [cellKey(START[0], START[1])]: 0 },
    active: null,
    reachedGoalAt: null,
    done: false,
  };
}

/** Pure reducer: one BFS operation (dequeue → goal-check → push unvisited
 *  neighbours) per frame. Returns the next state plus the algorithm.py @sync
 *  labels this step exercised; the wrapper emits them post-commit (no setState
 *  or onActiveLine side-effects here). */
function bfsStep(state: BfsState): AlgoFrame<BfsState> {
  if (state.queue.length === 0) {
    return { state: { ...state, done: true, active: null }, active: [LINE_DEQUEUE], done: true };
  }
  const [head, ...rest] = state.queue;
  const [r, c] = head.cell;
  if (r === GOAL[0] && c === GOAL[1]) {
    return {
      state: { ...state, active: head.cell, reachedGoalAt: head.d, done: true },
      active: LINE_GOAL,
      done: true,
    };
  }
  const newQueue = [...rest];
  const visited = new Set(state.visited);
  const distances = { ...state.distances };
  const lines: (number | string)[] = [LINE_DEQUEUE]; // popleft: read cell + distance d from the front
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (
      nr >= 0 &&
      nr < ROWS &&
      nc >= 0 &&
      nc < COLS &&
      GRID[nr][nc] === 0 &&
      !visited.has(cellKey(nr, nc))
    ) {
      visited.add(cellKey(nr, nc));
      lines.push(LINE_MARK_VISITED); // visited.add(...)
      distances[cellKey(nr, nc)] = head.d + 1;
      newQueue.push({ cell: [nr, nc], d: head.d + 1 });
      lines.push(LINE_ENQUEUE); // append neighbour with distance d + 1
    }
  }
  return {
    state: {
      ...state,
      queue: newQueue,
      visited,
      distances,
      active: head.cell,
      done: false,
    },
    active: [...new Set(lines)],
    done: false,
  };
}

/* Steps 4-7 — BFS with visible queue */
function DerivedBfsViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  return (
    <AnimatedAlgorithmView<BfsState>
      initial={initBfs}
      step={bfsStep}
      onActiveLine={onActiveLine}
      initialActive={[LINE_INIT_QUEUE]}
      intervalMs={380}
      playLabel="Play through"
      render={(state) => (
        <div className="flex flex-col items-center gap-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            pull from front · push neighbours to back · distances grow only up
          </div>
          <div className="flex flex-row gap-6 items-start">
            <MazeWithDistances
              distances={state.distances}
              active={state.active}
              showDistances
            />
            <StackPanel
              title="queue · front on top"
              topOnTop={false}
              widthPx={180}
              minHeightPx={140}
              emptyLabel="empty"
              items={state.queue.slice(0, 7).map((q, i) => ({
                key: `${cellKey(q.cell[0], q.cell[1])}-${i}`,
                label: `(${q.cell[0]},${q.cell[1]})`,
                sub: `d=${q.d}`,
                tone: "accent" as Tone,
              }))}
              footer={
                state.queue.length > 7 ? `+${state.queue.length - 7} more` : undefined
              }
            />
          </div>
          <div className="font-mono text-xs text-[var(--text-muted)]">
            visited: <span className="text-[var(--accent)]">{state.visited.size}</span>
            {state.reachedGoalAt !== null && (
              <span className="text-[var(--diff-easy)] ml-3">
                ✓ shortest distance {state.reachedGoalAt}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}
