"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GridViz } from "@/shared/viz/GridViz";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import type { Tone } from "@/shared/viz/tones";

const N = 6;
const CELL = 44;
const GAP = 4;

/* @sync labels — resolved against algorithm.py (single source of truth) */
const LINE_SAFE_CHECK: (number | string)[] = ["loop", "is_safe"]; // safety prune (one coherent region)
const LINE_PLACE = "place"; // `placed.append(col)` — choose / place the queen
const LINE_RECURSE = "recurse"; // `place(placed)` — recurse one row deeper
const LINE_UNDO = "backtrack"; // `placed.pop()` — undo / backtrack
const LINE_RECORD_SOLUTION: (number | string)[] = ["record_solution", "record_append"];

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

export function BacktrackingVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <EmptyBoardViz />;
  if (step === 3) return <ManualPlaceViz onInteraction={onWedgeInteraction} onActiveLine={onActiveLine} />;
  return <AutoBacktrackViz onActiveLine={onActiveLine} />;
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
    <GridViz
      rows={N}
      cols={N}
      cellPx={CELL}
      gap={GAP}
      cell={(r, c) => {
        const queenHere = placed[r] === c;
        const isActive = activeRow === r && activeCol === c;
        const attacked = showAttacks && attacks.has(`${r},${c}`);
        const tone: Tone = queenHere
          ? "good"
          : isActive
          ? "active"
          : attacked
          ? "bad"
          : "idle";
        return { tone, content: queenHere ? "♛" : "" };
      }}
    />
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
function ManualPlaceViz({
  onInteraction,
  onActiveLine,
}: {
  onInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}) {
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
    // Validity / safety check — clicking an attacked square is rejected.
    onActiveLine?.(LINE_SAFE_CHECK);
    if (attacks.has(`${nextRow},${col}`)) return;
    // Choose / place the queen in the next row.
    const next = [...placed, col];
    setPlaced(next);
    if (next.length === N) onActiveLine?.(LINE_RECORD_SOLUTION);
    else onActiveLine?.([LINE_PLACE]);
  };

  const undo = () => {
    onInteraction?.();
    // Undo / backtrack — remove the last queen.
    onActiveLine?.([LINE_UNDO]);
    setPlaced(placed.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click a safe square in the next row · undo when stuck
      </div>
      <GridViz
        rows={N}
        cols={N}
        cellPx={CELL}
        gap={GAP}
        onCellClick={(_r, c) => tryPlace(c)}
        cellDisabled={(r, c) => !(r === nextRow && !attacks.has(`${r},${c}`))}
        cell={(r, c) => {
          const queenHere = placed[r] === c;
          const attacked = showAttacks && attacks.has(`${r},${c}`);
          const tone: Tone = queenHere ? "good" : attacked ? "bad" : "idle";
          return { tone, content: queenHere ? "♛" : "" };
        }}
      />
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

// Classify a single backtracking transition into the algorithm.py lines it
// exercised, so the code drawer can highlight the place / recurse / undo /
// record-solution motion live as the stepper runs.
function linesForTransition(prev: BtState, next: BtState): (number | string)[] {
  if (next.solutions.length > prev.solutions.length) return LINE_RECORD_SOLUTION;
  if (next.placed.length > prev.placed.length) {
    // A safe column was found and the queen was placed; recursing deeper.
    return ["is_safe", LINE_PLACE, LINE_RECURSE];
  }
  if (next.placed.length < prev.placed.length) return [LINE_UNDO];
  return LINE_SAFE_CHECK;
}

/* Steps 4-7 — auto backtracking sweep */
function AutoBacktrackViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const [state, setState] = useState<BtState>({
    placed: [],
    nextCol: 0,
    attempts: 0,
    solutions: [],
    done: false,
  });

  // Emit the active code lines from an effect that observes the committed
  // state transition — never from inside the setState updater (that would be
  // calling the parent's setState during this component's render, the
  // "Cannot update a component while rendering a different component" error).
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== state) {
      onActiveLine?.(linesForTransition(prev, state));
      prevStateRef.current = state;
    }
  }, [state, onActiveLine]);

  const btStepOnce = () =>
    setState((cur) => (cur.done ? cur : btStep(cur)));

  const pb = usePlayback({
    onTick: btStepOnce,
    isDone: () => state.done,
    intervalMs: 220,
  });

  const reset = () => {
    setState({ placed: [], nextCol: 0, attempts: 0, solutions: [], done: false });
    pb.stop();
  };

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
      <PlaybackControls
        playing={pb.playing}
        onToggle={pb.toggle}
        onReset={reset}
        onStep={pb.stepOnce}
        atEnd={state.done}
        playLabel="Play through"
      />
    </div>
  );
}
