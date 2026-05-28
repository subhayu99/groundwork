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
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function BfsVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <ContrastViz />;
  if (step === 3) return <RippleViz onInteraction={onWedgeInteraction} />;
  return <DerivedBfsViz />;
}

function distanceColor(d: number | null, maxD: number): string {
  if (d === null) return "var(--bg-card)";
  // Fade from cool sky (close) to warm green (far) as the ripple spreads.
  const t = maxD === 0 ? 0 : d / Math.max(maxD, 1);
  const ringPct = 14 + Math.min(t, 1) * 28;
  return `color-mix(in oklab, var(--accent-sky) ${ringPct.toFixed(1)}%, var(--bg-card))`;
}

function distanceBorder(d: number | null): string {
  return d === null
    ? "var(--line)"
    : "color-mix(in oklab, var(--accent-line) 70%, var(--line))";
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
  const maxD = Object.values(distances).reduce((a, b) => Math.max(a, b), 0);
  return (
    <div className="flex flex-col" style={{ gap: GAP }}>
      {GRID.map((row, r) => (
        <div key={r} className="flex" style={{ gap: GAP }}>
          {row.map((cell, c) => {
            const key = cellKey(r, c);
            const isStart = r === START[0] && c === START[1];
            const isGoal = r === GOAL[0] && c === GOAL[1];
            const isActive = active && active[0] === r && active[1] === c;
            const d = distances[key];
            const hasD = typeof d === "number";
            const bg =
              cell === 1
                ? "var(--bg-elevated)"
                : isActive
                ? "color-mix(in oklab, var(--accent-sky) 48%, var(--bg-card))"
                : hasD
                ? distanceColor(d, maxD)
                : "var(--bg-card)";
            const border =
              cell === 1
                ? "var(--line-faint)"
                : isActive
                ? "var(--accent-line)"
                : hasD
                ? distanceBorder(d)
                : "var(--line)";
            return (
              <motion.div
                key={c}
                animate={{ backgroundColor: bg, borderColor: border }}
                transition={{ duration: 0.2 }}
                className="rounded-md border-2 flex flex-col items-center justify-center font-mono text-[10px]"
                style={{ width: CELL_PX, height: CELL_PX, color: "var(--text)" }}
              >
                {cell === 1 ? (
                  ""
                ) : (
                  <>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {isStart ? "S" : isGoal ? "G" : ""}
                    </span>
                    {showDistances && hasD && (
                      <span className="text-[10px] text-[var(--accent-ink)]">{d}</span>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
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
      <div className="flex flex-col" style={{ gap: GAP }}>
        {GRID.map((row, r) => (
          <div key={r} className="flex" style={{ gap: GAP }}>
            {row.map((cell, c) => {
              const isStart = r === START[0] && c === START[1];
              const isGoal = r === GOAL[0] && c === GOAL[1];
              const key = cellKey(r, c);
              const onTrail = trailSet.has(key);
              const bg =
                cell === 1
                  ? "var(--bg-elevated)"
                  : onTrail
                  ? "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))"
                  : "var(--bg-card)";
              const border =
                cell === 1
                  ? "var(--line-faint)"
                  : onTrail
                  ? "var(--diff-easy)"
                  : "var(--line)";
              return (
                <div
                  key={c}
                  className="rounded-md border-2 flex items-center justify-center font-mono text-[10px]"
                  style={{
                    width: CELL_PX,
                    height: CELL_PX,
                    backgroundColor: bg,
                    borderColor: border,
                    color: "var(--text-muted)",
                  }}
                >
                  {isStart ? "S" : isGoal ? "G" : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
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
  const [playing, setPlaying] = useState(false);

  const stepRing = () => {
    onInteraction?.();
    setState((cur) => (cur.reachedGoalAt !== null ? cur : nextRing(cur)));
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setState((cur) => {
        if (cur.reachedGoalAt !== null) {
          setPlaying(false);
          return cur;
        }
        return nextRing(cur);
      });
    }, 480);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setState(initRipple());
    setPlaying(false);
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
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={state.reachedGoalAt !== null} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
          {playing ? "Pause" : "Play through"}
        </button>
        <button onClick={stepRing} disabled={state.reachedGoalAt !== null} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">
          next ring →
        </button>
      </div>
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

function bfsStep(state: BfsState): BfsState {
  if (state.done) return state;
  if (state.queue.length === 0) return { ...state, done: true, active: null };
  const [head, ...rest] = state.queue;
  const [r, c] = head.cell;
  if (r === GOAL[0] && c === GOAL[1]) {
    return { ...state, active: head.cell, reachedGoalAt: head.d, done: true };
  }
  const newQueue = [...rest];
  const visited = new Set(state.visited);
  const distances = { ...state.distances };
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
      distances[cellKey(nr, nc)] = head.d + 1;
      newQueue.push({ cell: [nr, nc], d: head.d + 1 });
    }
  }
  return {
    ...state,
    queue: newQueue,
    visited,
    distances,
    active: head.cell,
    done: false,
  };
}

/* Steps 4-7 — BFS with visible queue */
function DerivedBfsViz() {
  const [state, setState] = useState<BfsState>(initBfs());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setState((cur) => {
        if (cur.done) {
          setPlaying(false);
          return cur;
        }
        return bfsStep(cur);
      });
    }, 380);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setState(initBfs());
    setPlaying(false);
  };
  const stepOnce = () => setState((cur) => (cur.done ? cur : bfsStep(cur)));

  return (
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
        <div className="flex flex-col items-center gap-2 w-[180px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            queue · front on top
          </div>
          <div className="flex flex-col items-stretch gap-1 min-h-[140px] border border-dashed border-[var(--line)] rounded-md p-2 w-full">
            {state.queue.length === 0 ? (
              <span className="text-[10px] font-mono text-[var(--text-faint)] text-center py-3">
                empty
              </span>
            ) : (
              state.queue.slice(0, 7).map((q, i) => (
                <motion.div
                  key={`${cellKey(q.cell[0], q.cell[1])}-${i}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-1 font-mono text-[10px] text-[var(--accent-ink)] flex items-center justify-between"
                >
                  <span>
                    ({q.cell[0]},{q.cell[1]})
                  </span>
                  <span className="text-[var(--text-muted)]">d={q.d}</span>
                </motion.div>
              ))
            )}
            {state.queue.length > 7 && (
              <span className="text-[9px] font-mono text-[var(--text-faint)] text-center">
                +{state.queue.length - 7} more
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        visited: <span className="text-[var(--accent)]">{state.visited.size}</span>
        {state.reachedGoalAt !== null && (
          <span className="text-[var(--diff-easy)] ml-3">
            ✓ shortest distance {state.reachedGoalAt}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={state.done} className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40">
          {playing ? "Pause" : "Play through"}
        </button>
        <button onClick={stepOnce} disabled={state.done} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40">→</button>
      </div>
    </div>
  );
}
