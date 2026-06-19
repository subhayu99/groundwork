"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { GridCells, gridGeom, Arrow, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
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

/* ── Beat 5 PREDICTION GATE + playback: commit to the prune's payoff, THEN
 * watch the search run. One tap on a pill is the beat's real interaction
 * (interaction: "wedge"): PredictGate fires api.onInteractionDone(), feedback
 * shows, and after a short reading pause the AutoBacktrack playback answers
 * the prediction with the live "boards built" counter. The gate is HTML on
 * the SVG canvas via <foreignObject>; data-canvas-panel opts it into the
 * scene layout's content-extent measurement (per the arrays exemplar). */
function PruneCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoBacktrack api={api} showDepth />;

  return (
    <g>
      {board([], noAttacks, null)}
      <text
        x={VW / 2}
        y={GG.y0 + N * (GG.cellPx + GG.gap) + 14}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}
      >
        the empty board, before the search runs
      </text>
      <foreignObject x={566} y={GG.y0 - 10} width={286} height={280} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Six column picks per row make 46,656 possible boards — how many will the checking search actually build?"
            choices={[
              { id: "most", label: "still tens of thousands", note: "one failed check abandons every board starting that way — the cut is wholesale, not one at a time" },
              { id: "half", label: "about half of them", note: "the prune doesn't shave boards off one by one — each refusal drops every continuation at once" },
              { id: "hundreds", label: "a few hundred", correct: true, note: "every early refusal discards thousands of doomed boards unbuilt — watch the counter" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
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

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, derive, operations,
 *                general, name)
 *   structured : 5 — cuts `obvious` (its 46,656 count folds into the wedge's
 *                structured connector) and `general`
 *   rigorous   : 3 — `derive` (invariant + soundness; the problem statement
 *                folds into its prose) + `operations` (exact costs + edges,
 *                gate included) + `name` (pattern + stamp; the generalization
 *                folds in as one clause).
 *   refresh    : additionally trims `obvious` + `general` (trimOnRefresh).    */
export const backtrackingLesson: LessonSpec = {
  topicTitle: "backtracking · six queens, no clashes",
  layout: "focus",
  diagramShape: "box",
  canvas: { width: VW, height: VH },
  codeSource: backtrackingPy as string,
  // Standing on dfs (the bridge anchor, per TRACK-NARRATIVES.md): the learner
  // owns "go deep, back up when stuck" — this lesson swaps cells for choices.
  bridgeFrom: reg({
    base: "DFS digs down one path and backs up when stuck. Here the paths are choices, and a check abandons dead branches early.",
    intuitive: "You just learned to walk deep into a maze and back out of dead ends. This time the maze is made of choices.",
    rigorous: "DFS explores depth-first, retreating at dead ends. Here the space is partial placements, and a check prunes subtrees.",
  }),
  // Stamp from meta (TRACK-NARRATIVES row 28, primary; secondary: decomposition):
  // backtracking IS search-space pruning — abandon dead branches wholesale.
  principle: { key: "search-space-pruning", n: 2, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "How would you search?",
      takeaway: reg({
        base: "Place six queens so none attack, and a computer can’t just see a safe square.",
        intuitive: "Six queens, no shared row, column or diagonal, and a computer must test square by square.",
      }),
      detail: reg({
        base: (
        <>
          <p>
            You have a 6&times;6 chessboard, six rows and six columns of squares, and
            six chess <strong>queens</strong>. The job: place all six so that{" "}
            <strong>no two of them attack each other</strong>. A queen attacks in straight lines and
            diagonally as far as it likes, so no two queens may share a row, a column, or a diagonal.
          </p>
          <p>
            At a glance you can tell it&rsquo;s possible, but also that it&rsquo;s tight. Every
            queen you place lights up a whole cross-and-X of forbidden squares, ruling out a big chunk
            of the board for the next one.
          </p>
          <p>
            Your eye spots a safe square instantly. A computer can&rsquo;t &ldquo;see&rdquo; the board.
            It has to test squares one at a time. So the real question is: how should it{" "}
            <em>search</em>?
          </p>
        </>
      ),
        intuitive: (
          <>
            <p>
              Here&rsquo;s the whole puzzle. A 6&times;6 chessboard, six rows and six columns,
              and six chess <strong>queens</strong>. A queen attacks in straight lines and diagonals as
              far as she likes, so the rule is simple: no two queens may ever share a row, a column, or
              a diagonal.
            </p>
            <p>
              Look at the one queen already on the board. Every red square is hers. One piece
              rules out a whole cross-and-X of squares for everyone else. Six of these have to fit
              together without a single clash. Tight, but possible.
            </p>
            <p>
              You&rsquo;d solve it by eye, nudging queens around until it works. A computer has no eye.
              It can only ask tiny questions &mdash; &ldquo;is this square safe?&rdquo; &mdash; one
              square at a time. So the real lesson starts with: in what <em>order</em> should it ask?
            </p>
          </>
        ),
      }),
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
          body: reg({
            base: (
            <>
              A <strong>queen</strong> in chess attacks every square in its row,
              column, and both diagonals: the red squares. Goal: place all six
              so none sits in another&rsquo;s line of fire. Your eye finds a spot at
              once; a computer must test squares one at a time.
            </>
          ),
            intuitive: (
              <>
                A chess <strong>queen</strong> attacks along her whole row, her whole column, and both
                diagonals: every red square is hers. The job: stand all six queens on the board
                with nobody in anybody&rsquo;s line of fire. Your eye spots a safe square in a blink. A
                computer can&rsquo;t see; it must test squares one at a time.
              </>
            ),
          }),
        },
      ],
      arrows: [{ x1: GG.cx(0, 2), y1: 162, x2: GG.cx(0, 2), y2: GG.cy(0, 0) - GG.cellPx / 2 - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that a computer has to test squares one at a time, the first idea is to just test all of them. So how many boards is that?",
      actionLabel: "Stop building dead branches",
      takeaway: "Trying every board (46,656 of them) wastes effort on boards doomed from the first clash.",
      detail: (
        <>
          <p>
            The blind way is <strong>brute force</strong>: literally try every possibility and
            keep the ones that are legal. Since two queens can never share a row, each of the six rows
            holds exactly one queen, so the only real choice is <em>which column</em> on each row.
            That&rsquo;s six picks from six columns: <code>6<sup>6</sup> = 46,656</code> boards to check.
          </p>
          <p>
            That number is doable for a computer, but it&rsquo;s wasteful. The real problem
            isn&rsquo;t the total count; it&rsquo;s how many of those boards{" "}
            <em>could never possibly work</em>.
          </p>
          <p>
            The moment you put the first queen down, clashes pile up fast, like the three red
            queens shown here: two share a column, and a third is caught on a diagonal. Each was doomed
            the instant it landed. Why even bother building boards like this?
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
              The blind way, <strong>brute force</strong>, means trying every
              possibility and keeping the legal boards. Since each row holds one queen,
              we just pick a column per row: 46,656 boards. But most clash at once,
              like the three reds here: two on a shared column, one on a diagonal.
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
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "So instead of building whole dead boards, build a partial one and check it as you go.",
        structured: "Testing every full board means six column picks per row: 46,656 boards, most doomed at the first clash. So build a partial board and check it as you go.",
      }),
      actionLabel: "Make it a rule",
      takeaway: "Build one piece at a time, check as you go, and undo the moment a path can’t win.",
      detail: reg({
        base: (
        <>
          <p>
            Your turn on the board to the right. Place a queen in row 0 wherever you like. The
            squares it attacks light up red. Now drop to row 1: you can only click a square the row-0
            queen <em>doesn&rsquo;t</em> attack. Keep filling rows top to bottom, one safe (blue) square
            at a time.
          </p>
          <p>
            Sooner or later you may reach a row with <em>no</em> safe square left. That means the
            partial board you&rsquo;ve built so far is a <strong>dead end</strong>: nothing you
            add can rescue it. Press <strong>undo</strong> to pull the last queen back off, and try a
            different column in the row above instead. That single undo is the whole idea.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct:</strong> don&rsquo;t finish a guess before checking it can still win. Test
            at every step, and quit a branch the moment it can&rsquo;t reach a full board.
          </div>
        </>
      ),
        intuitive: (
          <>
            <p>
              Play it. Put a queen anywhere in row 0 and her attacks light up red. Drop to row 1
              and you can only click a square she doesn&rsquo;t touch. Keep going, row by row, one safe
              (blue) square at a time.
            </p>
            <p>
              Sooner or later a row may offer you <em>nothing</em>: every square red. Stop and
              notice what that means: the queens placed so far can never become a full answer, no
              matter what happens below. The board isn&rsquo;t just stuck. It&rsquo;s doomed, so
              finishing it would be wasted work.
            </p>
            <p>
              Press <strong>undo</strong>: the last queen lifts off, and you try her next column
              instead. That one motion, back up a step and try the next option, is the
              entire idea of this lesson.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct:</strong> don&rsquo;t finish a guess before checking it can still
              win. Test at every step, and quit a path the moment it can&rsquo;t reach a full board.
            </div>
          </>
        ),
      }),
      visual: (api) => <ManualPlace api={api} />,
      panels: [
        {
          left: 150,
          top: 16,
          width: 560,
          variant: "main",
          label: "The instinct",
          title: "Place a queen. Check. Undo when stuck.",
          body: reg({
            base: (
            <>
              Your turn. Fill rows top-down: click a safe (blue) square in the next
              row, and red attacked squares refuse the click. Stuck with no safe
              square? Press <strong>undo</strong> to pull the last queen and try a
              different column above. That undo is the whole idea.
            </>
          ),
            intuitive: (
              <>
                Your turn: fill the rows from the top. In each row, click any square the queens
                above don&rsquo;t attack (blue; red squares refuse the click). If a row offers no safe
                square, press <strong>undo</strong>: pull the last queen back and try her somewhere
                else. That undo is the whole trick.
              </>
            ),
          }),
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
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "Now turn that place-check-undo motion you just did by hand into a rule a computer can repeat on its own.",
        rigorous: "",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "A function that places a safe column, recurses one row deeper, then pops it back off. That pop is the undo.",
        intuitive: "Place a safe column, go one row deeper, pop it off on return. The pop is the undo.",
        rigorous: "An unsafe prefix has no completions, so rejecting it discards its whole subtree.",
      }),
      detail: reg({
        base: (
        <>
          <p>
            Write a function <code>place(placed)</code>, where <code>placed</code> is a list of the
            columns chosen so far, one entry per row already filled. So <code>[1, 3]</code> means
            row 0&rsquo;s queen is in column 1 and row 1&rsquo;s is in column 3.
          </p>
          <p>
            <strong>Base case</strong> (the &ldquo;we&rsquo;re done with this path&rdquo; check): if{" "}
            <code>placed</code> already has six entries, the board is full and legal, so record this
            solution and return.
          </p>
          <p>
            <strong>Recursive case:</strong> the next row to fill is <code>len(placed)</code>. For each
            column 0 to 5, if a queen there wouldn&rsquo;t share a column or diagonal with any queen
            already down, add that column and call <code>place</code> one row deeper. That self-call is{" "}
            <Term word="recursion"><strong>recursion</strong></Term>, a function that solves a smaller version of the same job by
            calling itself. When it returns, <strong>pop</strong> that column back off. The pop is the
            &ldquo;undo&rdquo;: without it the list would only ever grow and we&rsquo;d never try the
            other columns.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle, pruning:</strong> every time we reject a column, we skip every
            board that would have started with it, a whole branch of possibilities we never even
            build.
          </div>
        </>
      ),
        intuitive: (
          <>
            <p>
              Time to hand your motion to the computer. Keep one list, <code>placed</code>: the
              column you chose for each filled row. So <code>[1, 3]</code> means: row 0&rsquo;s queen
              stands in column 1, row 1&rsquo;s in column 3. The list <em>is</em> the board so far.
            </p>
            <p>
              The rule has two halves. <strong>Done?</strong> If the list holds six columns, the board
              is full and legal, so save it and step back. <strong>Not done?</strong> Try each
              column of the next row: if a queen there clashes with no queen already down, add the
              column to the list and run the <em>same rule</em> one row deeper. A step that reruns
              itself on a smaller job is <Term word="recursion"><strong>recursion</strong></Term>.
            </p>
            <p>
              And when that deeper run comes back, win or lose, <strong>pop</strong> the
              column off again. That pop is your undo button, made automatic. Without it the list would
              only ever grow, and the other columns would never get their turn.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle, pruning:</strong> every column we reject takes with it
              every board that would have started that way, a whole branch of possibilities we
              never even build.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>State:</strong> <code>placed[r]</code> is the column of the queen in row{" "}
              <code>r</code>; the next row to fill is <code>len(placed)</code>.{" "}
              <strong>Invariant:</strong> every prefix on the recursion path is consistent. No
              two placed queens share a column or a diagonal (rows are distinct by construction).{" "}
              <code>safe(placed, col)</code> is exactly the test that extending by one row preserves
              the invariant.
            </p>
            <p>
              <strong>Soundness of the prune:</strong> constraints only accumulate, since adding a
              queen never removes an existing clash, so an inconsistent prefix has no consistent
              completion, and rejecting it discards its entire subtree. <strong>Completeness:</strong>{" "}
              the loop tries every column at every depth, and the pop after the recursive call restores
              the prefix exactly, so siblings explore from an identical state and every consistent
              assignment is reached once.
            </p>
          </>
        ),
      }),
      visual: board([1, 3, 0], attackedBy([1, 3, 0]), 3),
      panels: [
        {
          left: 40,
          top: 18,
          width: 252,
          variant: "main",
          label: "The derivation",
          title: reg({
            base: "Place row by row. Recurse. Undo a dead end.",
            rigorous: "Extend. Recurse. Restore.",
          }),
          body: reg({
            base: (
            <>
              <code>placed</code> lists the column picked per filled row, so{" "}
              <code>[1, 3]</code> fills rows 0 and 1. Six placed? Save it. Else, for each
              safe column: add it, call <code>place</code> a row deeper. That call is{" "}
              <strong>recursion</strong> (a step that reruns itself on a smaller job).
              Then pop it off. That pop is the undo.
            </>
          ),
            rigorous: (
              <>
                n queens: one per row, choosing a column per row so no two share a column or
                diagonal. <code>place(placed)</code> extends a consistent prefix: full board &rarr;
                record; else for each <em>safe</em> column, append,{" "}
                <Term word="recursion">recurse</Term>, pop. The pop restores the prefix; the safety
                test is the prune.
              </>
            ),
          }),
        },
        {
          left: 562,
          top: 350,
          width: 280,
          variant: "note",
          body: reg({
            base: (
            <>
              <strong className="text-[var(--accent-ink)]">The principle:</strong>{" "}
              rejecting a column skips every board that would have started with it,
              a whole branch we never build. That is pruning.
            </>
          ),
            rigorous: (
              <>
                <strong className="text-[var(--accent-ink)]">The prune:</strong> rejecting a column
                discards every completion of that prefix; the subtree is never built.
              </>
            ),
          }),
        },
      ],
      arrows: [{ x1: 296, y1: GG.cy(3, 0), x2: GG.cx(3, 0) - GG.cellPx / 2 - 4, y2: GG.cy(3, 0) }],
      codeLabels: ["record_solution", "record_append", "loop", "is_safe", "place", "recurse", "backtrack"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "Now that the search runs itself, count how much work the prune actually saves.",
        rigorous: "The procedure is fixed; now bound its work. Commit to a prediction before the run.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Failing early touches a few hundred boards, not 46,656, and memory stays tiny (six paused calls).",
        intuitive: "The check skips doomed boards wholesale: a few hundred built instead of 46,656.",
        rigorous: "Exponential worst case; pruning cuts subtrees; memory O(n), one path of paused calls.",
      }),
      detail: reg({
        base: (
        <>
          <p>
            Without the safety check, the search would build all <code>6<sup>6</sup> = 46,656</code>
            boards. With the check, it touches only a tiny fraction: a few hundred partial boards,
            not tens of thousands. Watch <em>boards built</em> climb on the right and{" "}
            <em>solutions</em> settle on 4.
          </p>
          <p>
            The worst-case math is still <strong>exponential</strong>, meaning the work can balloon
            wildly as the board grows, and there are puzzles where the prune barely helps. But for the
            queens the prune bites hard, and for sudoku it bites even harder. The whole technique is to{" "}
            <em>fail early</em>: catch a doomed path the instant it&rsquo;s doomed.
          </p>
          <p>
            <strong>Memory</strong> stays tiny. The only thing being held is the chain of paused{" "}
            <code>place</code> calls, the <strong>call stack</strong>, the pile of half-finished
            function calls waiting to resume. It&rsquo;s at most six deep, one paused call per
            row, plus a single list of six columns. That&rsquo;s it.
          </p>
          <p>
            <strong>Edge cases:</strong> a board can have <em>no</em> answer at all. 2&times;2
            and 3&times;3 queens have zero solutions. Nothing special is needed: the search exhausts
            every column, the last undo empties the board, and it returns an empty list. The not-found
            path is the same motion as everything else.
          </p>
        </>
      ),
        intuitive: (
          <>
            <p>
              Tap your prediction first, then keep your eye on the two numbers. <em>Boards built</em>{" "}
              counts every queen placed or pulled back; blind guessing would mean all 46,656 boards,
              but the counter stops a few hundred in. <em>Solutions</em> climbs to 4, every
              answer this board has.
            </p>
            <p>
              Why so few? Every time a square fails the safety check, the search refuses to build{" "}
              <em>anything</em> that starts that way, so thousands of would-be boards vanish in one
              refusal. Work that can balloon as the puzzle grows is called <strong>exponential</strong>;
              the check is what keeps it tame here.
            </p>
            <p>
              And the memory? Tiny. The computer only remembers the queens currently on the board: the
              chain of paused calls (the <Term word="call stack">call stack</Term>, its pile of
              half-finished jobs) is never deeper than six, one per row, plus one list of columns.
            </p>
            <p>
              One honest note: some boards have <em>no</em> answer at all. Queens on a 2&times;2
              or 3&times;3 can&rsquo;t avoid each other. The search needs nothing special for that: it
              tries everything, undoes everything, and comes home with an empty list.
            </p>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>Count first:</strong> the blind space is 6<sup>6</sup> = 46,656 complete boards;
              the pruned run builds a few hundred partial boards, because one failed check discards an
              entire subtree. The worst case stays exponential (pruning improves runs, never the
              bound), and each node pays an <Term word="O(n)"><code>O(n)</code></Term> safety scan
              over <code>placed</code>. Memory is the active path: at most n paused{" "}
              <Term word="frame">frames</Term> on the <Term word="call stack">call stack</Term> plus one
              n-entry list. n = 6 yields exactly 4 solutions.
            </p>
            <p>
              <strong>Edges:</strong> n = 2 and n = 3 admit zero solutions; the root exhausts its
              columns and the function returns an empty list, no special case. n = 1 is a single
              trivial solution. Recording must copy (<code>placed[:]</code>): the path list mutates in
              place, so an aliased reference would be corrupted by later pops. Needing one solution
              instead of all? Return early on the first record; the shape is unchanged.
            </p>
          </>
        ),
      }),
      visual: (api) => <PruneCostGate api={api} />,
      panels: [
        {
          left: 40,
          top: 18,
          width: 252,
          variant: "main",
          label: "The operations",
          title: "Worst case balloons. The prune cuts deep.",
          body: reg({
            base: (
            <>
              Blindly: 46,656 boards. The safety check fails early, so it touches only
              a few hundred. Watch <em>boards built</em> climb and{" "}
              <em>solutions</em> reach 4. Worst case stays{" "}
              <strong>exponential</strong> (work balloons as the board grows), but the
              prune bites hard. Memory stays tiny: just the paused{" "}
              <code>place</code> calls, six deep at most.
            </>
          ),
            intuitive: (
              <>
                Blind guessing would grind through all 46,656 boards. How many does the checking search
                actually build? Commit to a guess, then watch <em>boards built</em> climb and{" "}
                <em>solutions</em> settle at 4. Work that can balloon as a puzzle grows is called{" "}
                <strong>exponential</strong>, and the check is what tames it here. Memory stays
                tiny: six paused calls at most.
              </>
            ),
            rigorous: (
              <>
                Six column choices per row: 6<sup>6</sup> = 46,656 complete boards blind. Predict what
                pruning leaves, then watch the counter. The worst case stays exponential (pruning
                improves runs, never the bound); the safety scan is{" "}
                <Term word="O(n)"><code>O(n)</code></Term> per node; memory is the path, at most
                n paused <Term word="frame">frames</Term> plus one list.
              </>
            ),
          }),
        },
      ],
      codeLabels: ["is_safe", "backtrack"],
      interaction: "wedge",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "That same fail-early motion isn't really about queens at all. It fits any puzzle built one piece at a time.",
      actionLabel: "Name the pattern",
      takeaway: "The same place-check-undo shape solves sudoku, map coloring, valid brackets, subset sum.",
      detail: (
        <>
          <p>
            The six-queens puzzle was never really about chess. Strip away the board and what&rsquo;s
            left is: build an answer one choice at a time, and the instant a partial answer becomes
            impossible, abandon <em>every</em> way of continuing it.
          </p>
          <p>
            Same shape, totally different stories, just like the panels show:
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
              continuing it. Same shape, new stories: sudoku, map coloring, valid
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
      connector: reg({
        base: "Now that you've seen the shape repeat across puzzles, give the move its name and the cues that flag it.",
        structured: "You've counted what the check saves; now give the move its name and the cues that flag it.",
        rigorous: "Name the move, and file it under the idea it runs on.",
      }),
      takeaway: reg({
        base: "It’s Backtracking: depth-first search with a check at every step; reach for it on “find all / is there any”.",
        intuitive: "Backtracking: build, check, undo. Doomed paths are dropped whole, never finished.",
        rigorous: "Backtracking = DFS over partial assignments + pruning; idea 2 of 7, eliminate wholesale.",
      }),
      detail: reg({
        base: (
        <>
          <p>
            That&rsquo;s the name: <strong>backtracking</strong>. Under the hood it&rsquo;s{" "}
            <strong>depth-first search</strong>, digging all the way down one path before trying any
            others, with a constraint check at every step. The <em>back</em> in backtracking is the
            undo: the recursion drops its <Term word="frame">frame</Term> (the paused call&rsquo;s bookmark)
            off the <Term word="call stack">call stack</Term> and the caller moves on to its next option.
          </p>
          <p>
            <strong>Pattern signals, reach for it when you see:</strong>
          </p>
          <ul>
            <li>&ldquo;Find all&rdquo; or &ldquo;count all&rdquo; arrangements that satisfy some rule.</li>
            <li>&ldquo;Is there any&rdquo; assignment that satisfies the rule.</li>
            <li>You can describe a partial answer and tell mid-way whether it&rsquo;s still feasible.</li>
            <li>The answer is built up by a sequence of choices, not by a single formula.</li>
          </ul>
          <p>
            One detail when you read the code: saving a finished board uses <code>placed[:]</code>, a
            frozen <em>copy</em> of the list, so that later undos can&rsquo;t reach back and erase a
            solution you already recorded. The safety check is the engine; the recursion writes itself.
            (Six queens has 4 solutions in all.)
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>Idea 2 of 7, prune the search space:</strong> eliminate possibilities
            wholesale instead of checking them one by one. Binary search drops half the row per
            question; backtracking drops every board that starts with a doomed move.
          </div>
        </>
      ),
        intuitive: (
          <>
            <p>
              You derived it; now own the name: <strong>backtracking</strong>. Under the hood it&rsquo;s{" "}
              <strong>depth-first search</strong>, digging all the way down one path before trying
              any other, with a check at every step. The <em>back</em> is the undo: the paused
              call lets go (its <Term word="frame">frame</Term>, the bookmark of a half-finished
              call, pops off the <Term word="call stack">call stack</Term>) and the caller simply
              tries its next column.
            </p>
            <p>
              When should it jump to mind? When a puzzle asks to <strong>find all</strong> (or count,
              or &ldquo;is there any&rdquo;) arrangements that obey a rule, and you can tell{" "}
              <em>midway</em> whether a half-built answer still has a chance. That midway check is the
              engine: the sharper it is, the more the search gets to skip.
            </p>
            <p>
              One code detail worth keeping: a finished board is saved as <code>placed[:]</code>,
              a frozen copy, so later undos can&rsquo;t reach back and erase an answer you
              already recorded. (Six queens has exactly 4.)
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The second big idea (2 of 7), prune the search space:</strong> don&rsquo;t
              test answers one by one. Throw away whole groups at once. Binary search threw away
              half a row per question; backtracking throws away every board that starts with a doomed
              move.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>
              <strong>Backtracking: depth-first search over the tree of partial assignments, with a
              feasibility check at every extension.</strong> The &ldquo;back&rdquo; is the return:
              the <Term word="frame">frame</Term> pops and the caller resumes at its next
              candidate. The template (choose, check, recurse, unchoose) covers sudoku,
              graph coloring, bracket strings, subset sum: any answer built by a sequence of checkable
              choices.
            </p>
            <p>
              Signals: &ldquo;find all / count / is there any&rdquo; under constraints; a partial answer
              with a cheap midway feasibility test; no closed-form construction. Implementation edge:
              record via <code>placed[:]</code>, since the path list mutates in place, so storing the
              reference lets later pops corrupt recorded solutions.
            </p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 2 of 7, search-space pruning:</strong> eliminate wholesale, never one
              by one. Binary search discards half the candidates per probe; backtracking discards the
              entire subtree under every failed prefix.
            </div>
          </>
        ),
      }),
      visual: board(SOLUTION, noAttacks, null),
      panels: [
        {
          left: 560,
          top: 20,
          width: 282,
          variant: "main",
          label: "The pattern",
          title: "Backtracking.",
          body: reg({
            base: (
            <>
              That&rsquo;s the name: <strong>depth-first search</strong> (dig
              down one path before trying others) with a check at every step. The
              &ldquo;back&rdquo; is the undo. Saving a board uses <code>placed[:]</code>,
              a frozen copy, so later undos can&rsquo;t erase it. Reach for it on
              &ldquo;find all / is there any&rdquo; puzzles. (Six queens: 4 solutions.)
            </>
          ),
            intuitive: (
              <>
                The move has a name: <strong>backtracking</strong>. Underneath it&rsquo;s{" "}
                <strong>depth-first search</strong>, digging down one path before trying any other,
                with a safety check at every step. The &ldquo;back&rdquo; is the undo you kept
                pressing. Reach for it when a puzzle says &ldquo;find all&rdquo; or &ldquo;is there
                any&rdquo;. (Six queens: 4 answers.)
              </>
            ),
            rigorous: (
              <>
                <strong>Backtracking</strong>: depth-first search over partial assignments with a
                feasibility check at every extension. Signals: &ldquo;find all / count / is there
                any&rdquo; under constraints, and a partial answer testable midway. Record through a
                copy (<code>placed[:]</code>) because the path list mutates. (n = 6: 4 solutions.)
              </>
            ),
          }),
        },
      ],
      arrows: [{ x1: 558, y1: GG.cy(2, 5), x2: GG.cx(2, 5) + GG.cellPx / 2 + 4, y2: GG.cy(2, 5) }],
      codeLabels: ["record_solution", "record_append"],
    },
  ],
};
