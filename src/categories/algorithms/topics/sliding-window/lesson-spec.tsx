"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import sliding_windowPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const K = 3;
const LAST_START = ARR.length - K; // 7 → 8 windows (starts 0..7)
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250, 56, 8, 48);

const windowSum = (start: number) =>
  ARR.slice(start, start + K).reduce((a, b) => a + b, 0);

/** Tone the cells inside [start, start+K) as the live window. */
const windowTones = (start: number): (Tone | undefined)[] =>
  ARR.map((_, i) => (i >= start && i < start + K ? "active" : undefined));

/* ── wedge: drag/step the window; one leaves, one enters, the middle stays ─── */
function DragWindow({ api }: { api: BeatVisualApi }) {
  const [start, setStart] = useState(0);
  const [moved, setMoved] = useState(false);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(LAST_START, next));
    if (clamped === start) return; // boundary hit: nothing actually moved
    api.onInteractionDone();
    api.onActiveLine(["slide"]);
    setStart(clamped);
    setMoved(true);
  };

  // previous window cells; "leaver" = old left edge, "enter" = new right edge
  const tones: (Tone | undefined)[] = ARR.map((_, i) => {
    if (i >= start && i < start + K) {
      if (moved && i === start + K - 1) return "good"; // the cell that just entered
      return "active";
    }
    if (moved && i === start - 1) return "bad"; // the cell that just left
    return undefined;
  });

  const sum = windowSum(start);

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} onCellClick={(i) => go(i <= start ? start - 1 : start + 1)} cellEnabled={() => true} />
      <Bracket x1={G.left(start)} x2={G.left(start) + K * G.stride - G.gap} y={G.y - 16} label={`window · k=${K}`} color="var(--accent-ink)" />
      <text x={VW / 2} y={G.y - 46} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {moved ? `one number left, one joined — middle stayed put · sum = ${sum}` : "drag the window: tap a cell left or right of it"}
      </text>
      {/* step buttons (touch friendly) */}
      <g onClick={() => go(start - 1)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="step left"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(start - 1); } }}>
        <rect x={VW / 2 - 64} y={G.y + G.cellH + 40} width={56} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2 - 36} y={G.y + G.cellH + 53} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>‹ left</text>
      </g>
      <g onClick={() => go(start + 1)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="step right"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(start + 1); } }}>
        <rect x={VW / 2 + 8} y={G.y + G.cellH + 40} width={60} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2 + 38} y={G.y + G.cellH + 53} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>right ›</text>
      </g>
    </g>
  );
}

/* ── PREDICTION GATE + drag: commit to what one slide changes, THEN drag ─────
 * The gate is the wedge beat's real interaction (interaction: "wedge"): one
 * pill tap fires api.onInteractionDone() inside PredictGate, feedback shows,
 * and after a short reading pause the interactive DragWindow mounts so the
 * learner verifies the prediction by hand. The gate is HTML hosted on the SVG
 * canvas via <foreignObject> (per Predict.tsx — panels are pointer-events-none
 * and note panels don't render on mobile, so the canvas is the one host every
 * viewport shares); data-canvas-panel opts it into the scene layout's
 * content-extent measurement so vertical centring accounts for it. It sits
 * BELOW the row in the right strip (x 550+): the note panel keeps its spot at
 * x 250–540, and the scene layout's title band owns the canvas top. Nothing in
 * the pre-reveal visual spoils the answer — the window simply hasn't moved. */
function SlideChangePredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <DragWindow api={api} />;

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={windowTones(0)} />
      <Bracket x1={G.left(0)} x2={G.left(0) + K * G.stride - G.gap} y={G.y - 16} label={`window · k=${K}`} color="var(--accent-ink)" />
      <foreignObject x={550} y={G.y + G.cellH + 24} width={290} height={240} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="The window is about to slide one cell right — what changes inside it?"
            choices={[
              { id: "all", label: "everything — three fresh numbers", note: "look at the two middle cells — they sit inside both the old window and the new one" },
              { id: "edges", label: "just the edges — one leaves, one joins", correct: true, note: "the middle survives every slide — now drag the window and watch it happen" },
              { id: "none", label: "nothing — the row never changes", note: "the row stays put, but the frame moves — its left cell falls out and a new right cell joins" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── playback: window marches the row; per frame, the running total updates ─── */
interface SW { start: number; ops: number; done: boolean; }
function AutoSlide({ api }: { api: BeatVisualApi }) {
  const init = (): SW => ({ start: 0, ops: 0, done: false });
  const [s, setS] = useState<SW>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.start === 0) { api.onActiveLine(["init_window", "init_results"]); setS({ ...c, start: 1, ops: 0 }); return; }
      if (c.start >= LAST_START) { api.onActiveLine(["result"]); setS({ ...c, done: true }); return; }
      api.onActiveLine(["loop", "slide", "record"]);
      setS({ ...c, start: c.start + 1, ops: c.ops + 2 });
    }, pace(950));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { start, ops, done } = s;
  const tones = windowTones(start);
  const sum = windowSum(start);

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} />
      <Bracket x1={G.left(start)} x2={G.left(start) + K * G.stride - G.gap} y={G.y - 16} label={`sum = ${sum}`} color="var(--accent-ink)" />
      <text x={VW / 2} y={G.y - 46} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? `all 8 windows done · only 2 operations per slide` : `window at start ${start} — subtract the leaver, add the newcomer (+2 ops, total ${ops})`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 40} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visuals for the non-interactive beats ─────────────────────────── */

/** A frozen slide: label leaver / stays / enters with the equation on the plane. */
function FrozenSlide() {
  const start = 3; // window 3..5, came from 2..4: leaver = idx 2, newcomer = idx 5
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    i === 2 ? "bad" : i === 5 ? "good" : i >= start && i < start + K ? "active" : undefined,
  );
  const oldSum = windowSum(2), newSum = windowSum(3);
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} />
      <text x={G.cx(2)} y={G.y + G.cellH + 22} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>leaves</text>
      <text x={G.cx(4)} y={G.y + G.cellH + 22} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>stays</text>
      <text x={G.cx(5)} y={G.y + G.cellH + 22} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>enters</text>
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono" style={{ fontSize: 13, fill: "var(--text)" }}>
        new total = {oldSum} − {ARR[2]} + {ARR[5]} = {newSum}
      </text>
    </g>
  );
}

/** Race the counters: naive +k per slide vs derived +2 per slide. */
function CounterRace() {
  const slides = 7; // 8 windows = 1 setup + 7 slides
  const naive = K * (slides + 1); // recompute every window from scratch: k per window
  const derived = K + 2 * slides; // pay k once, then +2 each slide
  const rows = [
    { label: "obvious way", per: `+${K} per slide`, total: naive, tone: "bad" as Tone },
    { label: "wedge way", per: "+2 per slide", total: derived, tone: "good" as Tone },
  ];
  const bw = 360, bx = (VW - bw) / 2, y0 = 226, rh = 46;
  return (
    <g>
      {rows.map((r, i) => {
        const y = y0 + i * (rh + 14);
        const ts = r.tone === "bad" ? "var(--diff-hard)" : "var(--diff-easy)";
        return (
          <g key={i}>
            <rect x={bx} y={y} width={bw} height={rh} rx={9}
              fill={`color-mix(in oklab, ${ts} 16%, var(--bg-card))`} stroke={ts} strokeWidth={2} />
            <text x={bx + 16} y={y + rh / 2} dominantBaseline="central" className="font-mono" style={{ fontSize: 13, fill: "var(--text)" }}>{r.label}</text>
            <text x={bx + 168} y={y + rh / 2} dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{r.per}</text>
            <text x={bx + bw - 16} y={y + rh / 2} textAnchor="end" dominantBaseline="central" className="font-mono" style={{ fontSize: 18, fill: ts }}>{r.total} ops</text>
          </g>
        );
      })}
      <text x={VW / 2} y={y0 + 2 * (rh + 14) + 6} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        here k=3 (small lead) · with a window of 100, the obvious way runs about 50× longer
      </text>
    </g>
  );
}

/** The pattern's three signal chips. */
function Signals() {
  const chips = ["contiguous stretch of length k", "longest / shortest window satisfying X", "count substrings with property Y"];
  const cw = 268, gap = 12, total = chips.length * cw + (chips.length - 1) * gap, sx = (VW - total) / 2, y = 280, h = 58;
  return (
    <g>
      {chips.map((c, i) => {
        const x = sx + i * (cw + gap);
        return (
          <g key={i}>
            <rect x={x} y={y} width={cw} height={h} rx={11} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1.5} />
            <text x={x + cw / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 10, fill: "var(--accent-ink)" }}>{c}</text>
          </g>
        );
      })}
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[]) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} />
);

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 8 beats (setup, obvious, wedge, derive, win, playback,
 *                general, name) — the full ritual.
 *   structured : 5 — setup (the obvious thing's 24-addition count folds in) ·
 *                wedge · derive · win · name.
 *   rigorous   : 3 — derive (invariant + the model; opens here, bridge above) ·
 *                win (exact cost + edge cases) · name (stamped close).
 *   refresh    : additionally trims obvious, playback, general (trimOnRefresh). */
export const slidingWindowLesson: LessonSpec = {
  topicTitle: "sliding window · sums of every 3-in-a-row",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: sliding_windowPy as string,
  // standing on arrays (bridge anchor per TRACK-NARRATIVES row 20): reaching any
  // slot is one step — so the only cost left on the table is the arithmetic.
  bridgeFrom: reg({
    base: "An array hands you any slot in one step, so the cost here isn't reaching numbers, it's re-adding them.",
    intuitive: "You know the row: any spot in one step, no counting. Now the work shifts from finding numbers to re-adding them.",
    rigorous: "arr[i] is O(1), so access is free; the only cost left is redundant arithmetic across overlapping windows.",
  }),
  // principle per TRACK-NARRATIVES row 20 (from meta; secondary: 3) — not a ⚑
  // foreshadow row: this lesson IS information reuse, claimed outright at the close.
  principle: { key: "information-reuse", n: 1, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: reg({
        base: "I see the setup",
        structured: "Something feels wasteful",
      }),
      takeaway: reg({
        base: "A window of three slides down a row: eight sums to find with the least arithmetic.",
        structured: "Eight overlapping windows of three; re-adding each from scratch costs 24 additions.",
      }),
      visual: (
        <g>
          {idleRow(windowTones(0))}
          <Bracket x1={G.left(0)} x2={G.left(0) + K * G.stride - G.gap} y={G.y - 16} label={`window · k=${K}`} color="var(--accent-ink)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "A row of numbers. Add the first three.",
        body: reg({
          base: <>Here&rsquo;s a row of ten numbers. A friend points at the first three (we&rsquo;ll call that frame around them a <strong>window</strong>) and asks &ldquo;what do these add up to?&rdquo; Then slides it one cell right and asks again. Eight times.</>,
          structured: <>A row of ten numbers; a three-cell frame, a <strong>window</strong>, slides one cell at a time: eight stops, eight sums. The plain answer re-adds all three at every stop, 3 &times; 8 = 24 additions, even though neighbouring windows share two of their three numbers.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You&rsquo;ve got a row of ten numbers. A friend points at the first three and asks, <em>&ldquo;what do those add up to?&rdquo;</em> You add them. Easy. The little frame around those three cells is what we&rsquo;ll call a <strong>window</strong>: just a marked-off stretch of the row.</p>
            <p>Then they shift their finger one cell to the right and ask again. And again. And again, eight times in total, until the window reaches the end of the row.</p>
            <p><strong>The question isn&rsquo;t which numbers are in the window.</strong> The real question is: what&rsquo;s the <em>least amount of arithmetic</em> you can possibly get away with to answer all eight?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Picture a paper frame lying on the row, covering exactly three numbers. Your friend only ever asks one thing: <em>&ldquo;what do the covered numbers add up to?&rdquo;</em> That frame is our <strong>window</strong>, just a marked-off stretch of the row.</p>
            <p>Then the frame scoots a single cell to the right, and the question repeats. Eight stops in all before it runs out of row.</p>
            <p>Keep one thought in the corner of your eye as we go: each scoot is tiny. Most of what the frame covers after a move, it was already covering before the move.</p>
          </>
        ),
        structured: (
          <>
            <p>The window is a frame over three consecutive cells (its width: <code>k = 3</code>); it has eight possible positions, starts 0 through 7. The task: report the sum at every position.</p>
            <p>The from-scratch baseline adds three numbers per window, 3 &times; 8 = 24 additions, and feels fine until you notice that adjacent windows overlap in two of their three cells, so it keeps re-adding numbers it has already added. That overlap is the lever this whole lesson pulls.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(0), y1: 150, x2: G.cx(0), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "We know the window will slide eight times, so what's the first, dumbest way to answer each ask?",
      actionLabel: "Something feels wasteful",
      takeaway: "Re-adding all three each time is 24 additions, and it re-adds the two numbers neighbours share.",
      visual: (
        <g>
          {idleRow(windowTones(1))}
          <Bracket x1={G.left(1)} x2={G.left(1) + K * G.stride - G.gap} y={G.y - 16} label="re-adding all 3" color="var(--diff-hard)" />
          <text x={VW / 2} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--text-faint)" }}>3 × 8 = 24 additions for 8 answers</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 580, variant: "main", label: "The obvious thing", title: "Add three. Slide. Add three. Slide.",
        body: <>The first idea: just do it. Add the three numbers in each of the 8 windows, 24 additions in all. But side-by-side windows <strong>share two numbers</strong>, so you keep re-adding what you just added.</>,
      }],
      detail: (
        <>
          <p>The first answer that arrives: just <em>do it</em>. For every position of the window, add up the three numbers sitting underneath it, from scratch.</p>
          <p>That&rsquo;s <code>3 &times; 8 = 24</code> additions to answer eight questions. Sounds reasonable &mdash; until you watch it happen step by step.</p>
          <p>Look at the second window next to the first. They <strong>share two of their three</strong> numbers. So you add those two numbers, then a moment later you slide over and add the very same two again. And then again on the next slide. You&rsquo;re paying full price for arithmetic you already did.</p>
        </>
      ),
      arrows: [{ x1: G.cx(2), y1: 168, x2: G.cx(2), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "Since neighbouring windows overlap so much, let's stop calculating and just watch what actually moves.",
        intuitive: "Neighbouring windows mostly overlap, so no math yet; just predict, then watch what actually moves.",
        structured: "Re-adding all three costs 24 additions for eight answers. Stop calculating and watch what actually moves.",
      }),
      actionLabel: "I think I see it",
      takeaway: reg({
        base: "When the window slides one step, only two numbers change: one leaves, one enters; the middle stays.",
        intuitive: "Slide by one and just two cells change: one leaves, one joins; the middle stays put.",
      }),
      visual: (api) => <SlideChangePredict api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Move the window. Watch only what changes.",
          body: reg({
            base: <>Your turn. Tap a cell beside the window, or use the <strong>&ldquo;&lsaquo; left&rdquo;</strong> / <strong>&ldquo;right &rsaquo;&rdquo;</strong> buttons under the row, to nudge it one step. Don&rsquo;t do mental math; just watch the cells. One number drops out of the left edge, one new number joins on the right, and the middle one doesn&rsquo;t move at all.</>,
            intuitive: <>First, commit to a guess at the <strong>predict</strong> card: one tap. Then the window is yours: tap a cell beside it, or use the <strong>&ldquo;&lsaquo; left&rdquo;</strong> / <strong>&ldquo;right &rsaquo;&rdquo;</strong> buttons under the row, and nudge it one step at a time. No mental math; just watch which cells change and which sit still.</>,
            structured: <>Commit at the <strong>predict</strong> card first: one tap. Then nudge the window a step at a time. Tap a cell beside it, or use the <strong>&ldquo;&lsaquo; left&rdquo;</strong> / <strong>&ldquo;right &rsaquo;&rdquo;</strong> buttons, and track which cells actually change roles as it moves.</>,
          }),
        },
        {
          left: 250, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> when you slide by one, how many numbers actually change, and how many stay exactly where they were?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Your turn. Tap a cell to the left or right of the window, or use the &ldquo;&lsaquo; left&rdquo; / &ldquo;right &rsaquo;&rdquo; buttons under the row, to nudge it one step that way. Then do it again. Then again.</p>
            <p>Don&rsquo;t do any math in your head; just <em>watch the cells</em>. Which numbers are inside the window before you move? Which ones after? You&rsquo;ll see that only the two edges change: one number drops off the left, one new number joins on the right, and everything in the middle stays exactly where it was.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> when you slide the window by one, how many numbers actually change, and how many stay exactly where they were?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Answer the predict question beside the row before you move anything, and commit with one tap. Then the window is live.</p>
            <p>Nudge it: tap a cell to the left or right of the window, or use the &ldquo;&lsaquo; left&rdquo; / &ldquo;right &rsaquo;&rdquo; buttons. Do it a few times, slowly, and only watch: one cell drops away on the left, one lights up on the right &mdash; and count with your eyes how many never moved at all.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> after one slide, how much of the adding you did for the last window is still sitting there, already done?
            </div>
          </>
        ),
        structured: (
          <>
            <p>Commit at the predict card, then drag: tap a cell on either side of the window, or step it with the buttons. The tones name the roles: the old left edge exits, a new right edge enters, and the cells between keep their places.</p>
            <p>Now read that as bookkeeping: of the three numbers under the window, two carry over unchanged on every single step. Whatever total you held a moment ago is almost the total you need next.</p>
          </>
        ),
      }),
      codeLabels: ["slide"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      // Appears for EVERY register — rigorous opens here (bridge line above), so
      // its connector is empty.
      connector: reg({
        base: "You just saw only the two edges move. Now let's turn that picture into a rule we can write down.",
        rigorous: "",
      }),
      actionLabel: "Count the operations",
      takeaway: reg({
        base: "Keep a running total: new sum = old sum − the leaver + the newcomer. Two operations, any width.",
        intuitive: "New total = old total, minus the leaver, plus the joiner: two steps at any window width.",
        rigorous: "Invariant: window_sum equals the current window's sum, and the edge update keeps it true in two ops.",
      }),
      visual: <FrozenSlide />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation",
        title: reg({
          base: "One leaves, one enters, the rest stay.",
          rigorous: "Hold the sum; repair it at the edges.",
        }),
        body: reg({
          base: <>Two cells change per slide. Keep a running total and call it <code>window_sum</code>. The new total is the old total, minus the number that <strong>left</strong>, plus the number that <strong>entered</strong>. Just two steps, any window width. <span className="text-[var(--accent-ink)]">Add each number once, then reuse the total forever.</span></>,
          intuitive: <>You saw it: two cells change, the rest sit still. So keep one number alive as you go, the total of whatever the window covers right now, a <Term word="accumulator">running total</Term> called <code>window_sum</code>. Each slide: take away the number that <strong>left</strong>, add the number that <strong>joined</strong>. Two tiny steps, and the middle is never re-added.</>,
          rigorous: <>Maintain <code>window_sum</code> under the invariant: <em>it equals the sum of the cells currently in the window</em>. Consecutive windows differ in exactly two cells, so <code>window_sum &minus; leaver + newcomer</code> re-establishes the invariant in two operations per slide, independent of the width <code>k</code>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Two cells change roles every slide. There are really three roles in play: the number that <em>leaves</em>, the numbers that <em>stay</em>, and the number that <em>enters</em>. Let&rsquo;s name them and write down what we just saw.</p>
            <p>Keep one number as you go: the sum of whatever is currently inside the window. Call it <code>window_sum</code> (a <em>running total</em>: you update it instead of recomputing it). When the window slides forward one step, the only cells that move are the one at the old left edge (the <strong>leaver</strong>) and the brand-new one at the right edge (the <strong>newcomer</strong>).</p>
            <p>So the recipe almost writes itself: <code>new total = old total &minus; leaver + newcomer</code>. Just two operations, no matter how wide the window is. The numbers in the middle never get touched again.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> we paid to add each number once, then reused that total forever after. That&rsquo;s the whole deal &mdash; <em>information reuse</em>.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Name the three roles you watched: the number that <em>leaves</em>, the numbers that <em>stay</em>, and the number that <em>joins</em>. Only the first and the last ever touch your total.</p>
            <p>So carry one number with you: the total of what the window covers right now. A carried number like that is called a <Term word="accumulator">running total</Term>: you repair it instead of rebuilding it. One slide = take away the leaver, add the joiner. That&rsquo;s the whole move.</p>
            <p>Check it against the picture: the old total was 10. Out goes the 4, in comes the 9 &mdash; 10 &minus; 4 + 9 = 15. Nobody re-added the 1 and the 5 sitting in the middle.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The trick in one line:</strong> pay to add each number once, then reuse that work forever. Never re-figure-out what you already figured out.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Correctness.</strong> Invariant: <code>window_sum</code> equals the sum of the current window. <code>sum(arr[:k])</code> establishes it; each loop step applies <code>window_sum = window_sum &minus; arr[i &minus; k] + arr[i]</code>, and consecutive windows differ in exactly those two cells, so the update re-establishes the invariant. Induction over the starts closes the proof; recording <code>window_sum</code> at every start yields all the answers.</p>
            <p><strong>The mechanism is information reuse:</strong> each element enters the sum once and leaves it once; the interior is never re-touched. Two operations per slide, whatever <code>k</code> is. That is the count the next beat totals up.</p>
          </>
        ),
      }),
      arrows: [
        { x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 4 },
        { x1: G.cx(5), y1: 150, x2: G.cx(5), y2: G.y - 4 },
      ],
      codeLabels: ["init_window", "slide"],
    },
    {
      id: "win",
      label: "The win",
      connector: reg({
        base: "Now that each slide costs just two operations, let's put a number on how much that actually saves.",
        rigorous: "Two ops per slide is the claim. Total the ledger against the rebuild-every-time baseline.",
      }),
      actionLabel: reg({
        base: "See the payoff",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Two operations per slide instead of k, and the gap widens as the window grows (≈50× at k=100).",
        intuitive: "Two steps per slide at any width; the wider the window, the bigger the saving.",
        rigorous: "All windows in one pass: O(n) total, O(1) per slide. The rebuild grows with k.",
      }),
      visual: <CounterRace />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The win",
        title: reg({
          base: "Two operations beat k, and the gap grows.",
          rigorous: "17 ops, not 24, and k drops out entirely.",
        }),
        body: reg({
          base: <>The obvious way adds <code>k</code> numbers every slide (here k=3); the instinct way adds just 2. Small lead now. But with a window of 100 across a million numbers, the obvious way does about fifty times the work for the same answer.</>,
          intuitive: <>Read the race: the obvious way pays <code>k</code> additions per slide (here 3), the instinct way pays 2, so the totals are 24 against 17. Now grow the window to 100: the obvious way pays 100 per slide, the instinct way still pays 2. About fifty times the work, gone.</>,
          rigorous: <>Total it: setup pays <code>k</code>, then <code>n &minus; k</code> slides at 2 ops, so <code>k + 2(n &minus; k)</code> = 17 here. Rebuilding pays <code>k</code> per window: <code>k(n &minus; k + 1)</code> = 24. Counted, now named: the pass is <Term word="O(n)"><code>O(n)</code></Term> total, independent of <code>k</code>; the rebuild is O(n·k).</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Watch the two counters race. The obvious way piles up <code>k</code> additions on every slide; here <code>k</code> (the window width) is 3. The instinct way adds only 2, no matter how wide the window gets. With <code>k=3</code> that&rsquo;s a small lead.</p>
            <p>Now stretch it: a window of 100 numbers sliding across a million. The obvious way does about <em>fifty times</em> as much work for the exact same answers. The shape of the task didn&rsquo;t change at all &mdash; only the bookkeeping did. That widening gap is the whole point of the instinct.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Count the race honestly. Eight windows: the obvious way pays 3 additions each, 24 in all. The instinct way pays 3 once to get going, then 2 per slide for 7 slides, so 17. A small lead here, but the obvious way&rsquo;s bill grows with the window&rsquo;s width, and the instinct way&rsquo;s never does: a window of 100 makes it about fifty times the work for the same answers.</p>
            <p>And however long the row gets, you now touch each number about twice: once when it joins the window, once when it leaves. Work that grows in step with the row is written <Term word="O(n)"><code>O(n)</code></Term>; the flat two-steps-per-slide is <Term word="O(1)"><code>O(1)</code></Term>. You counted both before naming them.</p>
            <p>Three corner cases, so nothing bites later: a window wider than the row means there are no windows at all (the code answers with an empty list). A window exactly as wide as the row gives one answer and zero slides. A window of width 1 makes every number its own answer; the slide still works, there&rsquo;s just nothing left to reuse.</p>
          </>
        ),
        structured: (
          <>
            <p>The ledger: rebuild = 3 additions &times; 8 windows = 24. Running total = 3 once + 2 &times; 7 slides = 17. A small gap at <code>k = 3</code>; enormous at <code>k = 100</code>, since the rebuild scales with <code>k</code> and the running total doesn&rsquo;t.</p>
            <p>Counted, now named: the per-slide update is <Term word="O(1)"><code>O(1)</code></Term> (flat cost at any width), and the whole pass touches each element about twice. That is <Term word="O(n)"><code>O(n)</code></Term> for all windows together, versus roughly n &times; k for the rebuild.</p>
            <p>Edges worth a glance: <code>k &gt; n</code> or <code>k &le; 0</code> gives no valid window, and the code&rsquo;s guard line returns an empty list. <code>k = n</code> gives one window, zero slides. <code>k = 1</code> means the sums are the elements themselves. All of them fall out of the same loop bounds.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact cost.</strong> Setup: one k-cell sum. Each of the n &minus; k slides: one subtract, one add, giving k + 2(n &minus; k) operations total, against k(n &minus; k + 1) for the rebuild. Asymptotically <Term word="O(n)"><code>O(n)</code></Term> versus O(n·k): the width cancels out of the streaming version. Extra memory beyond the output: O(1).</p>
            <p><strong>Edges.</strong> k &le; 0 or k &gt; n: zero windows, so the guard returns <code>[]</code> before any arithmetic. k = n: one window; the loop never runs. k = 1: each element is its own window; the update degenerates to replacement. Python ints never overflow the running sum; floats drift under repeated &plusmn;, so re-sum periodically if it matters. And the update must be undoable: sums subtract cleanly; max/min don&rsquo;t, so a sliding max needs different machinery.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(8), y1: 150, x2: 610, y2: 222 }],
      codeLabels: ["loop", "slide", "record"],
      interaction: "playback",
      // playback visual mounts below via the playback beat; this static race is the framing
    },
    {
      id: "playback",
      label: "The win, watched",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "We've counted the savings on paper; now let the code run it live and see the total barely move.",
      actionLabel: "A different question",
      takeaway: "Watching it run: the window marches across, the running total just nudges. Eight answers, almost no arithmetic.",
      visual: (api) => <AutoSlide api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "Watch it run", title: "The window marches; the total just nudges.",
        body: <>The window slides across the row on its own, cell by cell. At each step the code subtracts the leaver and adds the newcomer (the <code>loop</code> line repeating two operations) and records the new sum. Eight answers, almost no arithmetic. Use <strong>&ldquo;&#8635; replay&rdquo;</strong> under the visual to watch it again.</>,
      }],
      detail: (
        <>
          <p>Now watch the same idea run on its own. The window marches across the row one cell at a time. At every step the code subtracts the leaver and adds the newcomer. That&rsquo;s the <code>loop</code> line (the instruction the computer repeats once per slide) doing its two operations, then recording the fresh sum.</p>
          <p>Notice the running total barely twitches each step instead of being rebuilt. Eight answers come out the far end with almost no arithmetic. Same array, same answers as the obvious way &mdash; a tiny fraction of the work.</p>
        </>
      ),
      codeLabels: ["loop", "slide", "record"],
      interaction: "playback",
    },
    {
      id: "general",
      registers: ["intuitive"],
      trimOnRefresh: true,
      visual: (
        <g>
          {idleRow(ARR.map((_, i) => (i >= 4 && i < 7 ? "good" : i >= 1 && i < 4 ? "active" : undefined)))}
          <Bracket x1={G.left(4)} x2={G.left(4) + K * G.stride - G.gap} y={G.y - 16} label="biggest so far = 16" color="var(--diff-easy)" />
          <text x={VW / 2} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>same slide · just remember the largest total seen</text>
        </g>
      ),
      label: "The generalization",
      connector: "The slide gave us all eight sums cheaply, but does the same move survive a completely different question?",
      actionLabel: "Name the pattern",
      takeaway: "Same slide answers a new question (biggest sum): it only cares about contiguous windows you can update, not what you ask.",
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The generalization", title: "Same wedge. New question.",
        body: <>Forget listing all eight sums. New question: what&rsquo;s the <strong>biggest</strong> three-in-a-row sum? Same slide, same two operations: just remember the largest total you&rsquo;ve seen, plus one comparison each step. The slide doesn&rsquo;t care what you ask.</>,
      }],
      detail: (
        <>
          <p>Forget listing every three-in-a-row sum. New question: what&rsquo;s <strong>the biggest</strong> three-in-a-row sum on this same row? One number out, not eight.</p>
          <p>The same wedge still applies. Slide a window of three exactly as before, but this time keep the largest sum you&rsquo;ve seen so far as you go. That&rsquo;s the two operations per slide, plus one extra <em>comparison</em> each step: &ldquo;is this new total bigger than my best?&rdquo;</p>
          <p>The pattern doesn&rsquo;t care what you&rsquo;re asking. It only cares that you&rsquo;re looking at side-by-side (<em>contiguous</em>) windows whose value can be updated a little bit at a time instead of recomputed from scratch.</p>
        </>
      ),
      arrows: [{ x1: G.cx(6), y1: 150, x2: G.cx(6), y2: G.y - 4 }],
      codeLabels: ["loop", "slide", "record"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: reg({
        base: "You've built the whole move from scratch. Here's its name and the cues that say \"reach for it.\"",
        rigorous: "Name the move, and file it under the idea it instantiates.",
      }),
      takeaway: reg({
        base: "It's the Sliding Window: reach for it on contiguous stretches where the answer can be nudged, not rebuilt.",
        intuitive: "Sliding window: nudge the total. Subtract the leaver, add the joiner; never re-add the middle.",
        rigorous: "Sliding window: O(1) per slide via the running-sum invariant; O(n) for every window.",
      }),
      visual: <Signals />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Sliding Window.",
        body: reg({
          base: <>That&rsquo;s the name. You&rsquo;ll spot it whenever you look at side-by-side stretches of a row and the answer can be <strong>nudged</strong> as the window moves instead of rebuilt each time. Open the <strong>code</strong> tab on the right for the full Python, then trace one pass.</>,
          intuitive: <>Its name: the <strong>sliding window</strong>. You&rsquo;ll feel it whenever side-by-side stretches of a row overlap and the answer can be <strong>nudged</strong> instead of rebuilt. File it under the first big idea (1 of 7), <strong>information reuse</strong>: never re-figure-out what you already figured out.</>,
          structured: <>That&rsquo;s the name: <strong>sliding window</strong>. The signal: contiguous stretches whose answer updates incrementally as the window moves. File it under idea 1 of 7, <strong>information reuse</strong>: pay for each element once, then repair the answer instead of rebuilding it. The <strong>code</strong> tab has the full pass.</>,
          rigorous: <>Sliding window. Trigger: contiguous ranges, fixed width here, with an incrementally maintainable aggregate. Idea 1 of 7, <strong>information reuse</strong>: compute each contribution once, repair the aggregate per step. Next door, the variable-width version: the invariant drives the shrink.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: the <strong>Sliding Window</strong>, and you earned it by deriving the whole thing. It applies whenever you&rsquo;re looking at side-by-side (<em>contiguous</em>) stretches of a row and the answer can be <strong>nudged</strong> as the window moves instead of rebuilt from scratch each time.</p>
            <p>Reach for it when you see cues like these:</p>
            <ul>
              <li>&ldquo;contiguous stretch of length k&rdquo;</li>
              <li>&ldquo;longest / shortest window satisfying X&rdquo;</li>
              <li>&ldquo;count substrings with property Y&rdquo;</li>
            </ul>
            <p>Open the <strong>code</strong> tab on the right for the full Python. Trace a single pass through it and you&rsquo;ll see every move you just made by hand.</p>
          </>
        ),
        intuitive: (
          <>
            <p>You built every piece of this yourself: spotted the waste, watched the edges, carried a running total, counted the savings. The move&rsquo;s proper name is the <strong>sliding window</strong>.</p>
            <p>Spot it from the words a problem uses:</p>
            <ul>
              <li>&ldquo;every stretch of <code>k</code> in a row&rdquo; (days, letters, readings)</li>
              <li>&ldquo;longest / shortest run that satisfies something&rdquo;</li>
              <li>&ldquo;count the chunks of neighbours with some property&rdquo;</li>
            </ul>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first big idea (1 of 7), information reuse:</strong> pay to figure something out once, then reuse it instead of redoing it. You just used it to beat a whole family of problems.
            </div>
            <p>Open the <strong>code</strong> tab and trace one pass &mdash; every line is a move you made by hand. Next: a window that stretches and shrinks on its own.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Triggers: &ldquo;contiguous subarray / substring of length k&rdquo;; any aggregate over all length-k ranges (sum, mean, count, hash); scans where consecutive ranges differ by one element per edge. Requirement: the aggregate supports removal. Sums and counts do; max/min need a monotonic deque instead.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7, information reuse:</strong> compute each fact once; repair, don&rsquo;t rebuild. Prefix sums, memoization, DP tables: the same ledger at scale.
            </div>
            <p>Next: the variable-width window &mdash; same two-op update; a maintained invariant decides when the left edge advances.</p>
          </>
        ),
      }),
      codeLabels: ["sig", "init_window", "init_results", "loop", "slide", "record", "result"],
    },
  ],
};
