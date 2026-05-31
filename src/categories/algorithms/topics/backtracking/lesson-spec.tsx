"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { GridCells, gridGeom, Arrow, Bracket } from "@/shared/lesson/canvas";
import backtrackingPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

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
    }, pace(280));
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
      <text x={gx} y={gy - 32} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
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
      label: "The setup",
      actionLabel: "How would you search?",
      detail: (
        <>
          <p>
            You have a 6&times;6 chessboard &mdash; six rows and six columns of squares &mdash; and
            six chess <strong>queens</strong>. The job: place all six so that{" "}
            <strong>no two of them attack each other</strong>. A queen attacks in straight lines and
            diagonally as far as it likes, so no two queens may share a row, a column, or a diagonal.
          </p>
          <p>
            At a glance you can tell it&rsquo;s possible &mdash; but also that it&rsquo;s tight. Every
            queen you place lights up a whole cross-and-X of forbidden squares, ruling out a big chunk
            of the board for the next one.
          </p>
          <p>
            Your eye spots a safe square instantly. A computer can&rsquo;t &ldquo;see&rdquo; the board
            &mdash; it has to test squares one at a time. So the real question is: how should it{" "}
            <em>search</em>?
          </p>
        </>
      ),
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
      label: "The obvious thing",
      connector: "Now that a computer has to test squares one at a time, the first idea is to just test all of them — so how many boards is that?",
      actionLabel: "Stop building dead branches",
      detail: (
        <>
          <p>
            The blind way is <strong>brute force</strong> &mdash; literally try every possibility and
            keep the ones that are legal. Since two queens can never share a row, each of the six rows
            holds exactly one queen, so the only real choice is <em>which column</em> on each row.
            That&rsquo;s six picks from six columns: <code>6<sup>6</sup> = 46,656</code> boards to check.
          </p>
          <p>
            That number is doable for a computer &mdash; but it&rsquo;s wasteful. The real problem
            isn&rsquo;t the total count; it&rsquo;s how many of those boards{" "}
            <em>could never possibly work</em>.
          </p>
          <p>
            The moment you put the first queen in column 0, every single board whose second queen also
            sits in column 0 is dead on arrival &mdash; like the two red queens shown here, doomed the
            instant they shared a column. Why even bother building them?
          </p>
        </>
      ),
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
      label: "The instinct",
      connector: "So instead of building whole dead boards, build a partial one and check it as you go.",
      actionLabel: "Make it a rule",
      detail: (
        <>
          <p>
            Your turn on the board to the right. Place a queen in row 0 wherever you like &mdash; the
            squares it attacks light up red. Now drop to row 1: you can only click a square the row-0
            queen <em>doesn&rsquo;t</em> attack. Keep filling rows top to bottom, one safe (blue) square
            at a time.
          </p>
          <p>
            Sooner or later you may reach a row with <em>no</em> safe square left. That means the
            partial board you&rsquo;ve built so far is a <strong>dead end</strong> &mdash; nothing you
            add can rescue it. Press <strong>undo</strong> to pull the last queen back off, and try a
            different column in the row above instead. That single undo is the whole idea.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct:</strong> don&rsquo;t finish a guess before checking it can still win. Test
            at every step, and quit a branch the moment it can&rsquo;t reach a full board.
          </div>
        </>
      ),
      visual: (api) => <ManualPlace api={api} />,
      panels: [
        {
          left: 150,
          top: 16,
          width: 560,
          variant: "main",
          label: "The instinct",
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
          top: 350,
          width: 280,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The instinct:</strong>{" "}
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
      label: "The derivation",
      connector: "Now turn that place-check-undo motion you just did by hand into a rule a computer can repeat on its own.",
      actionLabel: "Count the work",
      detail: (
        <>
          <p>
            Write a function <code>place(placed)</code>, where <code>placed</code> is a list of the
            columns chosen so far &mdash; one entry per row already filled. So <code>[1, 3]</code> means
            row 0&rsquo;s queen is in column 1 and row 1&rsquo;s is in column 3.
          </p>
          <p>
            <strong>Base case</strong> (the &ldquo;we&rsquo;re done with this path&rdquo; check): if{" "}
            <code>placed</code> already has six entries, the board is full and legal &mdash; record this
            solution and return.
          </p>
          <p>
            <strong>Recursive case:</strong> the next row to fill is <code>len(placed)</code>. For each
            column 0 to 5, if a queen there wouldn&rsquo;t share a column or diagonal with any queen
            already down, add that column and call <code>place</code> one row deeper. That self-call is{" "}
            <strong>recursion</strong> &mdash; a function that solves a smaller version of the same job by
            calling itself. When it returns, <strong>pop</strong> that column back off. The pop is the
            &ldquo;undo&rdquo;: without it the list would only ever grow and we&rsquo;d never try the
            other columns.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle &mdash; pruning:</strong> every time we reject a column, we skip every
            board that would have started with it &mdash; a whole branch of possibilities we never even
            build.
          </div>
        </>
      ),
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
          top: 350,
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
      label: "The operations",
      connector: "Now that the search runs itself, count how much work the prune actually saves.",
      actionLabel: "Same shape, new problems",
      detail: (
        <>
          <p>
            Without the safety check, the search would build all <code>6<sup>6</sup> = 46,656</code>
            boards. With the check, it touches only a tiny fraction &mdash; a few hundred partial boards,
            not tens of thousands. Watch <em>boards built</em> climb on the right and{" "}
            <em>solutions</em> settle on 4.
          </p>
          <p>
            The worst-case math is still <strong>exponential</strong> &mdash; meaning the work can balloon
            wildly as the board grows, and there are puzzles where the prune barely helps. But for the
            queens the prune bites hard, and for sudoku it bites even harder. The whole technique is to{" "}
            <em>fail early</em>: catch a doomed path the instant it&rsquo;s doomed.
          </p>
          <p>
            <strong>Memory</strong> stays tiny. The only thing being held is the chain of paused{" "}
            <code>place</code> calls &mdash; the <strong>call stack</strong>, the pile of half-finished
            function calls waiting to resume &mdash; and it&rsquo;s at most six deep, one paused call per
            row, plus a single list of six columns. That&rsquo;s it.
          </p>
        </>
      ),
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
      label: "The generalization",
      connector: "That same fail-early motion isn't really about queens at all — it fits any puzzle built one piece at a time.",
      actionLabel: "Name the pattern",
      detail: (
        <>
          <p>
            The six-queens puzzle was never really about chess. Strip away the board and what&rsquo;s
            left is: build an answer one choice at a time, and the instant a partial answer becomes
            impossible, abandon <em>every</em> way of continuing it.
          </p>
          <p>
            Same shape, totally different stories &mdash; just like the panels show:
          </p>
          <ul>
            <li><strong>Sudoku:</strong> drop a digit in a cell, check the row/column/box rule, undo if it breaks.</li>
            <li><strong>Map / graph coloring:</strong> color a region, check no neighbor clashes, undo if it does.</li>
            <li><strong>Valid bracket strings:</strong> add a <code>(</code> or <code>)</code>, check it&rsquo;s still balanceable, undo if not.</li>
            <li><strong>Subset sum:</strong> include a number, check you haven&rsquo;t overshot the target, undo if you have.</li>
          </ul>
          <p>
            The check at each step is what separates this from blind guessing. The sharper the check, the
            bigger the prune, the faster the whole thing runs.
          </p>
        </>
      ),
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
              and the instant a partial answer can&rsquo;t work, drop every way of
              continuing it. Same shape, new stories &mdash; sudoku, map coloring, valid
              bracket strings, target sums. The check beats blind guessing.
            </>
          ),
        },
      ],
      codeLabels: ["is_safe"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "Now that you've seen the shape repeat across puzzles, give the move its name and the cues that flag it.",
      detail: (
        <>
          <p>
            That&rsquo;s the name: <strong>backtracking</strong>. Under the hood it&rsquo;s{" "}
            <strong>depth-first search</strong> &mdash; dig all the way down one path before trying any
            others &mdash; with a constraint check at every step. The <em>back</em> in backtracking is the
            undo: the recursion pops its frame off the call stack and the caller moves on to its next
            option.
          </p>
          <p>
            <strong>Pattern signals &mdash; reach for it when you see:</strong>
          </p>
          <ul>
            <li>&ldquo;Find all&rdquo; or &ldquo;count all&rdquo; arrangements that satisfy some rule.</li>
            <li>&ldquo;Is there any&rdquo; assignment that satisfies the rule.</li>
            <li>You can describe a partial answer and tell mid-way whether it&rsquo;s still feasible.</li>
            <li>The answer is built up by a sequence of choices, not by a single formula.</li>
          </ul>
          <p>
            One detail when you read the code: saving a finished board uses <code>placed[:]</code> &mdash; a
            frozen <em>copy</em> of the list, so that later undos can&rsquo;t reach back and erase a
            solution you already recorded. The safety check is the engine; the recursion writes itself.
            (Six queens has 4 solutions in all.)
          </p>
        </>
      ),
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
