"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { GridCells, gridGeom, Arrow, Bracket } from "@/shared/lesson/canvas";
import backtrackingPy from "./algorithm.py";

const VW = 860,
  VH = 470;

const N = 6;

/* Centered 6×6 board in the visual band. cellPx 36, gap 6 → 246px square.
   y0 188 lands the bottom edge at ~434, inside the middle band; the top stays
   clear of the top-band panels (which end by ~y170). */
const GG = gridGeom(N, N, VW, 188, 36, 6);
const key = (r: number, c: number) => `${r},${c}`;

/* Which squares a set of placed queens attacks (row, column, both diagonals).
   `placed[r]` is the column of the queen in row r. */
function attackedBy(placed: number[]): Set<string> {
  const out = new Set<string>();
  for (let r = 0; r < placed.length; r++) {
    const c = placed[r];
    for (let rr = 0; rr < N; rr++) {
      for (let cc = 0; cc < N; cc++) {
        if (rr === r && cc === c) continue;
        if (cc === c || rr === r) out.add(key(rr, cc));
        else if (Math.abs(cc - c) === Math.abs(rr - r)) out.add(key(rr, cc));
      }
    }
  }
  return out;
}

/* The algorithm's own safety test: same column or same diagonal (row is never
   checked because each row holds exactly one queen). */
function safe(placed: number[], row: number, col: number): boolean {
  for (let r = 0; r < placed.length; r++) {
    const c = placed[r];
    if (c === col) return false;
    if (Math.abs(c - col) === Math.abs(r - row)) return false;
  }
  return true;
}

/* Tone for one board square given live state. */
function tone(
  r: number,
  c: number,
  placed: number[],
  attacks: Set<string>,
  activeRow: number | null,
): Tone {
  if (placed[r] === c) return "good";
  if (activeRow === r && safe(placed, r, c)) return "active";
  if (attacks.has(key(r, c))) return "bad";
  return "idle";
}

const QUEEN = "♛"; // ♛

/* A static board drawing — used by the non-interactive beats. */
function board(placed: number[], attacks: Set<string>, activeRow: number | null) {
  return (
    <GridCells
      rows={N}
      cols={N}
      geom={GG}
      cell={(r, c) => ({
        tone: tone(r, c, placed, attacks, activeRow),
        content: placed[r] === c ? QUEEN : undefined,
      })}
    />
  );
}

const noAttacks = new Set<string>();

/* ── Beat 3 wedge: click a safe square in the next row; undo retreats ───────── */
function ManualPlace({ api }: { api: BeatVisualApi }) {
  const [placed, setPlaced] = useState<number[]>([]);

  const nextRow = placed.length;
  const attacks = attackedBy(placed);
  const full = placed.length === N;
  const noSafe =
    !full &&
    nextRow < N &&
    Array.from({ length: N }).every((_, col) => attacks.has(key(nextRow, col)));

  const tryPlace = (r: number, c: number) => {
    api.onInteractionDone();
    if (full || r !== nextRow) return;
    api.onActiveLine(["loop", "is_safe"]); // the safety scan fires on every click
    if (attacks.has(key(r, c))) return; // attacked square refuses the click
    const next = [...placed, c];
    setPlaced(next);
    if (next.length === N) api.onActiveLine(["record_solution", "record_append"]);
    else api.onActiveLine(["place"]);
  };

  const undo = () => {
    api.onInteractionDone();
    if (placed.length === 0) return;
    api.onActiveLine(["backtrack"]);
    setPlaced(placed.slice(0, -1));
  };

  const reset = () => setPlaced([]);

  /* controls live in the right gutter, beside the band-filling board */
  const gx = GG.x0 + N * (GG.cellPx + GG.gap) + 20;
  const gy = GG.cy(2, 0);

  return (
    <g>
      <GridCells
        rows={N}
        cols={N}
        geom={GG}
        cell={(r, c) => ({
          tone: tone(r, c, placed, attacks, full ? null : nextRow),
          content: placed[r] === c ? QUEEN : undefined,
        })}
        onCellClick={tryPlace}
        cellEnabled={(r, c) => !full && r === nextRow && !attacks.has(key(r, c))}
      />
      <text
        x={gx}
        y={gy - 26}
        textAnchor="start"
        className="font-mono select-none"
        style={{
          fontSize: 11,
          fill: full
            ? "var(--diff-easy)"
            : noSafe
            ? "var(--diff-hard)"
            : "var(--text-faint)",
        }}
      >
        {full
          ? "solved ✓"
          : noSafe
          ? `no safe square ✕ row ${nextRow}`
          : `placed ${placed.length} of ${N}`}
      </text>
      {/* undo */}
      <g
        onClick={undo}
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        aria-label="undo"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            undo();
          }
        }}
      >
        <rect x={gx} y={gy - 12} width={84} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 42} y={gy + 1} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          &larr; undo
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
        <rect x={gx} y={gy + 22} width={84} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 42} y={gy + 35} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          &#8634; reset
        </text>
      </g>
    </g>
  );
}

/* ── Beat 5 playback: the search places, prunes, undoes on its own ──────────── */
interface BtState {
  placed: number[];
  nextCol: number; // cursor over candidate columns in the current row
  attempts: number; // partial boards built (placements + undos)
  solutions: number;
  phase: "scan" | "act";
  done: boolean;
}
const initBt = (): BtState => ({
  placed: [],
  nextCol: 0,
  attempts: 0,
  solutions: 0,
  phase: "scan",
  done: false,
});

function btStep(s: BtState): { next: BtState; line: string[] } {
  if (s.done) return { next: s, line: [] };
  const row = s.placed.length;

  // A full board → record the solution, then back up to explore further.
  if (row === N) {
    const lastCol = s.placed[s.placed.length - 1];
    return {
      next: {
        ...s,
        placed: s.placed.slice(0, -1),
        nextCol: lastCol + 1,
        solutions: s.solutions + 1,
        phase: "act",
      },
      line: ["record_solution", "record_append"],
    };
  }

  // SCAN: advance the cursor past unsafe columns.
  if (s.phase === "scan") {
    let col = s.nextCol;
    while (col < N && !safe(s.placed, row, col)) col++;
    return { next: { ...s, nextCol: col, phase: "act" }, line: ["loop", "is_safe"] };
  }

  // ACT: the cursor now points past any unsafe columns.
  const col = s.nextCol;
  if (col >= N) {
    // No safe column left → undo the last queen (or finish if at the top).
    if (s.placed.length === 0) return { next: { ...s, done: true }, line: [] };
    const lastCol = s.placed[s.placed.length - 1];
    return {
      next: {
        ...s,
        placed: s.placed.slice(0, -1),
        nextCol: lastCol + 1,
        attempts: s.attempts + 1,
        phase: "act",
      },
      line: ["backtrack"],
    };
  }
  // A safe column was found → place the queen and recurse one row deeper.
  return {
    next: {
      ...s,
      placed: [...s.placed, col],
      nextCol: 0,
      attempts: s.attempts + 1,
      phase: "scan",
    },
    line: ["place", "recurse"],
  };
}

function AutoBacktrack({ api, showDepth }: { api: BeatVisualApi; showDepth?: boolean }) {
  const [s, setS] = useState<BtState>(initBt);
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const { next, line } = btStep(c);
      if (line.length) api.onActiveLine(line);
      setS(next);
    }, 280);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRow =
    !s.done && s.phase === "scan" && s.placed.length < N ? s.placed.length : null;
  const attacks = attackedBy(s.placed);
  const depth = s.placed.length;

  const gx = GG.x0 + N * (GG.cellPx + GG.gap) + 20;
  const gy = GG.cy(2, 0);

  return (
    <g>
      <GridCells
        rows={N}
        cols={N}
        geom={GG}
        cell={(r, c) => ({
          tone: tone(r, c, s.placed, attacks, activeRow),
          content: s.placed[r] === c ? QUEEN : undefined,
        })}
      />
      {showDepth && (
        <Bracket
          x1={GG.x0 - 4}
          x2={GG.x0 - 4 + N * (GG.cellPx + GG.gap)}
          y={GG.y0 - 14}
          label={`paused calls = rows placed = ${depth} (max ${N})`}
          color="var(--diff-easy)"
        />
      )}
      <text x={gx} y={gy - 26} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        {`boards built ${s.attempts}`}
      </text>
      <text
        x={gx}
        y={gy - 12}
        textAnchor="start"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: s.solutions > 0 ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {`solutions ${s.solutions}${s.done ? " ✓" : ""}`}
      </text>
      <g
        onClick={() => setS(initBt())}
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        aria-label="replay"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setS(initBt());
          }
        }}
      >
        <rect x={gx} y={gy + 4} width={72} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={gx + 36} y={gy + 17} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
          &#8634; replay
        </text>
      </g>
    </g>
  );
}

/* ── Beat 2 static: a full but illegal board, with the blind count below ────── */
function Explosion() {
  // One queen per row; rows 1 & 3 clash on column 2 (toned by attackedBy).
  const illegal = [0, 2, 4, 2, 5, 3];
  const attacks = attackedBy(illegal);
  return (
    <g>
      <GridCells
        rows={N}
        cols={N}
        geom={GG}
        cell={(r, c) => {
          const here = illegal[r] === c;
          // A queen sitting on another queen's attacked square reads "bad".
          const clash = here && attacks.has(key(r, c));
          return {
            tone: clash ? "bad" : here ? "good" : "idle",
            content: here ? QUEEN : undefined,
          };
        }}
      />
      <text
        x={VW / 2}
        y={GG.y0 + N * (GG.cellPx + GG.gap) + 14}
        textAnchor="middle"
        className="font-mono"
        style={{ fontSize: 12, fill: "var(--diff-hard)" }}
      >
        blind boards = 6&times;6&times;6&times;6&times;6&times;6 = 46,656
      </text>
    </g>
  );
}

/* ── Beat 6 static: same place-check-undo shape, four other stories ─────────── */
function Gallery() {
  const faint = "var(--text-faint)";
  const cy = 300;
  const cards: { x: number; title: string; svg: React.ReactNode }[] = [
    {
      x: 150,
      title: "sudoku",
      svg: (
        <g>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}-${c}`} x={120 + c * 20} y={cy - 30 + r * 20} width={18} height={18} rx={3} fill="var(--bg-card)" stroke="var(--line)" />
            )),
          )}
          <text x={120 + 24} y={cy - 30 + 24} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>7</text>
        </g>
      ),
    },
    {
      x: 350,
      title: "graph coloring",
      svg: (
        <g>
          <line x1={330} y1={cy - 24} x2={372} y2={cy - 4} stroke="var(--line)" strokeWidth={2} />
          <line x1={372} y1={cy - 4} x2={330} y2={cy + 16} stroke="var(--line)" strokeWidth={2} />
          <circle cx={330} cy={cy - 24} r={11} fill="color-mix(in oklab, var(--diff-easy) 24%, var(--bg-card))" stroke="var(--diff-easy)" strokeWidth={2} />
          <circle cx={372} cy={cy - 4} r={11} fill="color-mix(in oklab, var(--diff-hard) 22%, var(--bg-card))" stroke="var(--diff-hard)" strokeWidth={2} />
          <circle cx={330} cy={cy + 16} r={11} fill="color-mix(in oklab, var(--accent-sky) 28%, var(--bg-card))" stroke="var(--accent-line)" strokeWidth={2} />
        </g>
      ),
    },
    {
      x: 540,
      title: "valid brackets",
      svg: (
        <text x={540} y={cy - 6} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 22, fill: "var(--accent-ink)" }}>
          ( ( ) )
        </text>
      ),
    },
    {
      x: 710,
      title: "subset sum",
      svg: (
        <g>
          <text x={710} y={cy - 14} textAnchor="middle" className="font-mono" style={{ fontSize: 13, fill: "var(--text)" }}>3 + 5 = 8</text>
          <text x={710} y={cy + 6} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>target 8 ✓</text>
        </g>
      ),
    },
  ];
  return (
    <g>
      <g opacity={0.18}>{board([], noAttacks, null)}</g>
      {cards.map((card) => (
        <g key={card.title}>
          {card.svg}
          <text x={card.x} y={cy + 40} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: faint }}>
            {card.title}
          </text>
        </g>
      ))}
      <text x={VW / 2} y={cy + 78} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        same motion: add a piece &middot; check the rule &middot; undo if it breaks
      </text>
    </g>
  );
}

/* A real 6-queens solution for the closing board: columns [1,3,5,0,2,4]. */
const SOLUTION = [1, 3, 5, 0, 2, 4];

export const backtrackingLesson: LessonSpec = {
  topicTitle: "backtracking · six queens, no clashes",
  canvas: { width: VW, height: VH },
  codeSource: backtrackingPy as string,
  beats: [
    {
      id: "setup",
      // demo queen at row 0, col 2 with its whole line of fire lit "bad".
      visual: board([2], attackedBy([2]), null),
      panels: [
        {
          left: 160,
          top: 18,
          width: 540,
          variant: "main",
          label: "The setup",
          title: "Six queens on a 6×6 board. No clashes.",
          body: (
            <>
              A <strong>queen</strong> in chess attacks every square in its row,
              column, and both diagonals &mdash; the red squares. Goal: place all six
              so none sits in another&rsquo;s line of fire. Your eye finds a spot at
              once; a computer must test squares one at a time.
            </>
          ),
        },
      ],
      arrows: [{ x1: GG.cx(0, 2), y1: 162, x2: GG.cx(0, 2), y2: GG.cy(0, 0) - GG.cellPx / 2 - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      visual: <Explosion />,
      panels: [
        {
          left: 560,
          top: 20,
          width: 282,
          variant: "main",
          label: "The obvious thing",
          title: "Trying every board explodes.",
          body: (
            <>
              The blind way &mdash; <strong>brute force</strong>, meaning try every
              possibility &mdash; keeps the legal boards. Since each row holds one queen,
              we just pick a column per row: 46,656 boards. But most clash at once
              &mdash; like the two reds here, doomed the moment they share a column.
            </>
          ),
        },
      ],
      arrows: [{ x1: 558, y1: GG.cy(1, 2), x2: GG.cx(1, 2) + GG.cellPx / 2 + 4, y2: GG.cy(1, 2) }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <ManualPlace api={api} />,
      panels: [
        {
          left: 150,
          top: 16,
          width: 560,
          variant: "main",
          label: "The wedge",
          title: "Place a queen. Check. Undo when stuck.",
          body: (
            <>
              Your turn. Fill rows top-down: click a safe (blue) square in the next
              row &mdash; red attacked squares refuse the click. Stuck with no safe
              square? Press <strong>undo</strong> to pull the last queen and try a
              different column above. That undo is the whole idea.
            </>
          ),
        },
        {
          left: 562,
          top: 372,
          width: 280,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The wedge:</strong>{" "}
              don&rsquo;t finish a guess before checking it can still win. Test at
              every step, and quit a branch the instant it can&rsquo;t reach a full
              board.
            </>
          ),
        },
      ],
      arrows: [{ x1: GG.cx(0, 2), y1: 168, x2: GG.cx(0, 2), y2: GG.cy(0, 0) - GG.cellPx / 2 - 4 }],
      codeLabels: ["loop", "is_safe"],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: board([1, 3, 0], attackedBy([1, 3, 0]), 3),
      panels: [
        {
          left: 40,
          top: 18,
          width: 252,
          variant: "main",
          label: "The derivation",
          title: "Place row by row. Recurse. Undo a dead end.",
          body: (
            <>
              <code>placed</code> lists the column picked per filled row, so{" "}
              <code>[1, 3]</code> fills rows 0 and 1. Six placed? Save it. Else, for each
              safe column: add it, call <code>place</code> a row deeper &mdash;{" "}
              <strong>recursion</strong> (a step that reruns itself on a smaller job)
              &mdash; then pop it off. That pop is the undo.
            </>
          ),
        },
        {
          left: 562,
          top: 372,
          width: 280,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The principle:</strong>{" "}
              rejecting a column skips every board that would have started with it
              &mdash; a whole branch we never build. That is pruning.
            </>
          ),
        },
      ],
      arrows: [{ x1: 296, y1: GG.cy(3, 0), x2: GG.cx(3, 0) - GG.cellPx / 2 - 4, y2: GG.cy(3, 0) }],
      codeLabels: ["record_solution", "record_append", "loop", "is_safe", "place", "recurse", "backtrack"],
    },
    {
      id: "operations",
      visual: (api) => <AutoBacktrack api={api} showDepth />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 252,
          variant: "main",
          label: "The operations",
          title: "Worst case balloons. The prune cuts deep.",
          body: (
            <>
              Blindly: 46,656 boards. The safety check fails early, so it touches only
              a few hundred &mdash; watch <em>boards built</em> climb and{" "}
              <em>solutions</em> reach 4. Worst case stays{" "}
              <strong>exponential</strong> (work balloons as the board grows), but the
              prune bites hard. Memory stays tiny: just the paused{" "}
              <code>place</code> calls, six deep at most.
            </>
          ),
        },
      ],
      codeLabels: ["is_safe", "backtrack"],
      interaction: "playback",
    },
    {
      id: "general",
      visual: <Gallery />,
      panels: [
        {
          left: 150,
          top: 18,
          width: 560,
          variant: "main",
          label: "The generalization",
          title: "Not just chess. Anything built piece-by-piece with a check.",
          body: (
            <>
              The shape was never about queens: build an answer one choice at a time,
              and the instant a partial answer becomes impossible, drop every way of
              continuing it. Same shape, new stories &mdash; sudoku, coloring a map so
              neighbours differ, valid bracket strings, hitting a target sum. The check
              beats blind guessing.
            </>
          ),
        },
      ],
      codeLabels: ["is_safe"],
    },
    {
      id: "name",
      visual: board(SOLUTION, noAttacks, null),
      panels: [
        {
          left: 560,
          top: 20,
          width: 282,
          variant: "main",
          label: "The pattern",
          title: "Backtracking.",
          body: (
            <>
              That&rsquo;s the name &mdash; <strong>depth-first search</strong> (dig
              down one path before trying others) with a check at every step. The
              &ldquo;back&rdquo; is the undo. Saving a board uses <code>placed[:]</code>
              &mdash; a frozen copy, so later undos can&rsquo;t erase it. Reach for it on
              &ldquo;find all / is there any&rdquo; puzzles. (Six queens: 4 solutions.)
            </>
          ),
        },
      ],
      arrows: [{ x1: 558, y1: GG.cy(2, 5), x2: GG.cx(2, 5) + GG.cellPx / 2 + 4, y2: GG.cy(2, 5) }],
      codeLabels: ["record_solution", "record_append"],
    },
  ],
};
