"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const N = 6;
const CELL = 44;
const GAP = 4;

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function BacktrackingVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <EmptyBoardViz />;
  if (step === 3) return <ManualPlaceViz onInteraction={onWedgeInteraction} />;
  return <AutoBacktrackViz />;
}

function safe(placed: number[], row: number, col: number): boolean {
  for (let r = 0; r < placed.length; r++) {
    const c = placed[r];
    if (c === col) return false;
    if (Math.abs(c - col) === Math.abs(r - row)) return false;
  }
  return true;
}

function attackedBy(placed: number[]): Set<string> {
  const out = new Set<string>();
  for (let r = 0; r < placed.length; r++) {
    const c = placed[r];
    for (let rr = 0; rr < N; rr++) {
      for (let cc = 0; cc < N; cc++) {
        if (rr === r && cc === c) continue;
        if (cc === c || rr === r) out.add(`${rr},${cc}`);
        else if (Math.abs(cc - c) === Math.abs(rr - r)) out.add(`${rr},${cc}`);
      }
    }
  }
  return out;
}

function Board({
  placed,
  activeRow,
  activeCol,
  showAttacks,
}: {
  placed: number[];
  activeRow: number | null;
  activeCol: number | null;
  showAttacks: boolean;
}) {
  const attacks = useMemo(() => attackedBy(placed), [placed]);
  return (
    <div className="grid" style={{ gridTemplateRows: `repeat(${N}, ${CELL}px)`, gap: GAP }}>
      {Array.from({ length: N }, (_, r) => (
        <div
          key={r}
          className="grid"
          style={{ gridTemplateColumns: `repeat(${N}, ${CELL}px)`, gap: GAP }}
        >
          {Array.from({ length: N }, (_, c) => {
            const queenHere = placed[r] === c;
            const isActive = activeRow === r && activeCol === c;
            const attacked = showAttacks && attacks.has(`${r},${c}`);
            const checkerLight = (r + c) % 2 === 0;
            const bg = queenHere
              ? "color-mix(in oklab, var(--diff-easy) 28%, var(--bg-card))"
              : isActive
              ? "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))"
              : attacked
              ? "color-mix(in oklab, var(--diff-hard) 14%, var(--bg-card))"
              : checkerLight
              ? "var(--bg-card)"
              : "var(--bg-elevated)";
            const border = queenHere
              ? "var(--diff-easy)"
              : isActive
              ? "var(--accent-line)"
              : "var(--line)";
            return (
              <motion.div
                key={c}
                animate={{ backgroundColor: bg, borderColor: border }}
                transition={{ duration: 0.16 }}
                className="rounded-sm border flex items-center justify-center font-mono text-base"
                style={{ width: CELL, height: CELL, color: "var(--text)" }}
              >
                {queenHere ? "♛" : ""}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* Steps 1-2 — empty board, callout */
function EmptyBoardViz() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        {N}×{N} board · place {N} queens · no attacks
      </div>
      <Board placed={[]} activeRow={null} activeCol={null} showAttacks={false} />
      <div className="font-mono text-xs text-[var(--text-muted)] max-w-[320px] text-center">
        column-per-row placements to check, blind:{" "}
        <span className="text-[var(--diff-hard)]">
          {N}
          <sup>{N}</sup> = {Math.pow(N, N).toLocaleString()}
        </span>
        <br />
        actual solutions: <span className="text-[var(--diff-easy)]">4</span> (rotations and
        mirrors count separately)
      </div>
    </div>
  );
}

/* Step 3 — manual placement with attack overlay */
function ManualPlaceViz({ onInteraction }: { onInteraction?: () => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [showAttacks, setShowAttacks] = useState(true);

  const nextRow = placed.length;
  const attacks = attackedBy(placed);
  const noSafeSquare =
    nextRow < N &&
    Array.from({ length: N }).every((_, col) => attacks.has(`${nextRow},${col}`));

  const tryPlace = (col: number) => {
    onInteraction?.();
    if (nextRow >= N) return;
    if (attacks.has(`${nextRow},${col}`)) return;
    setPlaced([...placed, col]);
  };

  const undo = () => {
    onInteraction?.();
    setPlaced(placed.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click a safe square in the next row · undo when stuck
      </div>
      <div className="grid" style={{ gridTemplateRows: `repeat(${N}, ${CELL}px)`, gap: GAP }}>
        {Array.from({ length: N }, (_, r) => (
          <div
            key={r}
            className="grid"
            style={{ gridTemplateColumns: `repeat(${N}, ${CELL}px)`, gap: GAP }}
          >
            {Array.from({ length: N }, (_, c) => {
              const queenHere = placed[r] === c;
              const attacked = showAttacks && attacks.has(`${r},${c}`);
              const isCandidate = r === nextRow && !attacks.has(`${r},${c}`);
              const checkerLight = (r + c) % 2 === 0;
              const bg = queenHere
                ? "color-mix(in oklab, var(--diff-easy) 28%, var(--bg-card))"
                : attacked
                ? "color-mix(in oklab, var(--diff-hard) 14%, var(--bg-card))"
                : checkerLight
                ? "var(--bg-card)"
                : "var(--bg-elevated)";
              const border = queenHere
                ? "var(--diff-easy)"
                : isCandidate
                ? "var(--accent-line)"
                : "var(--line)";
              return (
                <button
                  key={c}
                  onClick={() => tryPlace(c)}
                  disabled={!isCandidate}
                  className="rounded-sm border flex items-center justify-center font-mono text-base"
                  style={{
                    width: CELL,
                    height: CELL,
                    color: "var(--text)",
                    backgroundColor: bg,
                    borderColor: border,
                    cursor: isCandidate ? "pointer" : "default",
                  }}
                  aria-label={`row ${r} col ${c}`}
                >
                  {queenHere ? "♛" : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        placed: <span className="text-[var(--text)]">{placed.length}</span> of {N}
        {noSafeSquare && (
          <span className="text-[var(--diff-hard)] ml-3">✗ no safe square in row {nextRow}</span>
        )}
        {placed.length === N && (
          <span className="text-[var(--diff-easy)] ml-3">✓ solution!</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPlaced([])}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
        >
          ↺
        </button>
        <button
          onClick={undo}
          disabled={placed.length === 0}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40"
        >
          undo
        </button>
        <button
          onClick={() => setShowAttacks((s) => !s)}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
        >
          {showAttacks ? "hide attacks" : "show attacks"}
        </button>
      </div>
    </div>
  );
}

interface BtState {
  placed: number[];
  nextCol: number;
  attempts: number;
  solutions: number[][];
  done: boolean;
}

function btStep(state: BtState): BtState {
  if (state.done) return state;
  const row = state.placed.length;

  if (row === N) {
    // Solution. Record and backtrack.
    const solutions = [...state.solutions, [...state.placed]];
    const lastCol = state.placed[state.placed.length - 1];
    return {
      ...state,
      placed: state.placed.slice(0, -1),
      nextCol: lastCol + 1,
      solutions,
    };
  }

  let col = state.nextCol;
  while (col < N && !safe(state.placed, row, col)) col++;

  if (col >= N) {
    // No safe column left in this row. Backtrack.
    if (state.placed.length === 0) {
      return { ...state, done: true };
    }
    const lastCol = state.placed[state.placed.length - 1];
    return {
      ...state,
      placed: state.placed.slice(0, -1),
      nextCol: lastCol + 1,
      attempts: state.attempts + 1,
    };
  }

  return {
    ...state,
    placed: [...state.placed, col],
    nextCol: 0,
    attempts: state.attempts + 1,
  };
}

/* Steps 4-7 — auto backtracking sweep */
function AutoBacktrackViz() {
  const [state, setState] = useState<BtState>({
    placed: [],
    nextCol: 0,
    attempts: 0,
    solutions: [],
    done: false,
  });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setState((cur) => {
        if (cur.done) {
          setPlaying(false);
          return cur;
        }
        return btStep(cur);
      });
    }, 220);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setState({ placed: [], nextCol: 0, attempts: 0, solutions: [], done: false });
    setPlaying(false);
  };
  const stepOnce = () => setState((cur) => (cur.done ? cur : btStep(cur)));

  const activeRow = state.done ? null : state.placed.length;
  const activeCol = state.done ? null : state.nextCol;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        place row by row · prune dead branches · count solutions
      </div>
      <Board placed={state.placed} activeRow={activeRow} activeCol={activeCol} showAttacks />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        placed: <span className="text-[var(--accent)]">{state.placed.length}</span>
        <span className="mx-3">·</span>
        attempts: <span className="text-[var(--text)]">{state.attempts}</span>
        <span className="mx-3">·</span>
        solutions: <span className="text-[var(--diff-easy)]">{state.solutions.length}</span>
        {state.done && <span className="text-[var(--diff-easy)] ml-3">✓ done</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
        >
          ↺
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={state.done}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40"
        >
          {playing ? "Pause" : "Play through"}
        </button>
        <button
          onClick={stepOnce}
          disabled={state.done}
          className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}
