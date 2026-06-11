"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket, Arrow } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import two_pointersPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [1, 3, 5, 7, 9, 10, 12, 15, 18, 20];
const TARGET = 17; // 5 + 12 → indices 2 and 6
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* the floating "target = 17" tag, drawn above the row */
function TargetTag({ y = G.y - 34 }: { y?: number }) {
  return (
    <g>
      <rect x={VW / 2 - 56} y={y} width={112} height={22} rx={7}
        fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1} />
      <text x={VW / 2} y={y + 11} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>
        target = 17
      </text>
    </g>
  );
}

/* ── interactive (wedge): move a finger, watch the sum & verdict change ────── */
function MoveTheFingers({ api }: { api: BeatVisualApi }) {
  const [L, setL] = useState(0);
  const [R, setR] = useState(ARR.length - 1);
  const sum = ARR[L] + ARR[R];
  const verdict = sum === TARGET ? "match!" : sum < TARGET ? "too small" : "too big";

  const stepL = () => { api.onInteractionDone(); api.onActiveLine(["compute", "compare"]); if (L < R - 1) setL(L + 1); };
  const stepR = () => { api.onInteractionDone(); api.onActiveLine(["compute", "compare"]); if (R > L + 1) setR(R - 1); };
  const reset = () => { setL(0); setR(ARR.length - 1); };

  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    sum === TARGET && (i === L || i === R) ? "good" : i === L || i === R ? "active" : undefined);
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };

  const Btn = ({ x, label, on }: { x: number; label: string; on: () => void }) => (
    <g onClick={on} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); on(); } }}>
      <rect x={x - 48} y={G.y + G.cellH + 42} width={96} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={x} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{label}</text>
    </g>
  );

  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} markers={markers} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: sum === TARGET ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {`arr[L] + arr[R] = ${ARR[L]} + ${ARR[R]} = ${sum}  (${verdict})`}
      </text>
      <Btn x={VW / 2 - 110} label="L → bigger" on={stepL} />
      <Btn x={VW / 2 + 110} label="R → smaller" on={stepR} />
      <g onClick={reset} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 - 28} y={G.y + G.cellH + 42} width={56} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── playback: the two pointers converge on their own, code follows ────────── */
interface TP { L: number; R: number; done: boolean; found: boolean; steps: number; }
function AutoTwoPointers({ api }: { api: BeatVisualApi }) {
  const init = (): TP => ({ L: 0, R: ARR.length - 1, done: false, found: false, steps: 0 });
  const [s, setS] = useState<TP>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.L >= c.R) { api.onActiveLine(["notfound"]); setS({ ...c, done: true }); return; }
      const sum = ARR[c.L] + ARR[c.R];
      const steps = c.steps + 1;
      if (sum === TARGET) { api.onActiveLine(["compare", "found"]); setS({ ...c, done: true, found: true, steps }); return; }
      if (sum < TARGET) { api.onActiveLine(["less", "move_left"]); setS({ ...c, L: c.L + 1, steps }); }
      else { api.onActiveLine(["greater", "move_right"]); setS({ ...c, R: c.R - 1, steps }); }
    }, pace(950));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { L, R, done, found, steps } = s;
  const sum = ARR[L] + ARR[R];
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    found && (i === L || i === R) ? "good" : i === L || i === R ? "active" : undefined);
  const dim = ARR.map((_, i) => i < L || i > R);
  const markers: Record<number, string> = {};
  if (L < R) { markers[L] = "L"; markers[R] = "R"; }

  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done
          ? (found ? `found ${ARR[L]} + ${ARR[R]} = 17 ✓  ·  ${steps} comparisons (vs 45)` : "no pair")
          : `${ARR[L]} + ${ARR[R]} = ${sum} → ${sum < TARGET ? "move L right" : "move R left"}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 42} width={60} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static: brute-force, one anchor against the rest ──────────────────────── */
function BruteForce() {
  const anchor = 0, j = 5;
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    i === anchor ? "active" : i === j ? "muted" : undefined);
  const dim = ARR.map((_, i) => i > anchor && i < j);
  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: "var(--diff-hard)" }}>
        {`arr[i] + arr[j] = ${ARR[anchor]} + ${ARR[j]} = ${ARR[anchor] + ARR[j]}  ·  up to 45 pairs to try`}
      </text>
    </g>
  );
}

/* ── PREDICTION GATE + reveal: one move retires a whole side (the "too big"
 * case). The gate is the beat's real interaction (interaction: "wedge"): the
 * learner commits to WHAT one comparison proved before the reveal lands — one
 * pill tap fires api.onInteractionDone() inside PredictGate. The bracket, the
 * dimmed-out side, and the "R steps left" arrow stay hidden until the tap,
 * because they ARE the answer (the variables exemplar's tap-conditional
 * reveal). The gate is HTML on the SVG canvas via <foreignObject>;
 * data-canvas-panel opts it into the scene layout's extent measurement. ───── */
function RetireSide({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const L = 0, R = ARR.length - 1;
  const sum = ARR[L] + ARR[R];
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    i === L || i === R ? "active" : revealed ? "bad" : undefined);
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} markers={markers} />
      {revealed && (
        <Bracket x1={G.left(L)} x2={G.left(R) + G.cellW} y={G.y - 14} label="every pair with arr[R] — all too big, gone in one move" />
      )}
      <text x={VW / 2} y={G.y + G.cellH + 24} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {`arr[L] + arr[R] = ${ARR[L]} + ${ARR[R]} = ${sum} > ${TARGET}  (too big)`}
      </text>
      {revealed && (
        <g>
          <Arrow x1={G.cx(R)} y1={G.y + G.cellH + 44} x2={G.cx(R - 1) + 6} y2={G.y + G.cellH + 44} />
          <text x={G.cx(R) - 30} y={G.y + G.cellH + 60} textAnchor="middle" className="font-mono select-none"
            style={{ fontSize: 11, fill: "var(--accent-ink)" }}>R steps left</text>
        </g>
      )}
      <foreignObject x={40} y={G.y + G.cellH + 78} width={470} height={190}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question={`${ARR[L]} + ${ARR[R]} = ${sum} — too big. What did that one look prove?`}
            choices={[
              { id: "one", label: "only that this one pair fails", note: "it proves more — 1 is the smallest partner the 20 could ever get, and even that overshot" },
              { id: "right", label: "every pair using the 20 is too big", correct: true, note: "1 was the smallest partner left for the 20 — so the 20 is out of the game entirely" },
              { id: "left", label: "every pair using the 1 is too big", note: "the 1 still has smaller partners than the 20 to try — it's the 20 that has no hope" },
            ]}
            onRevealed={() => setRevealed(true)}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── static: 45 vs 9 stat bars ─────────────────────────────────────────────── */
function WinStat() {
  const y = 232, bh = 34;
  const max = 45, scale = 560 / max, x0 = (VW - 560) / 2;
  const Row = ({ row, label, n, tone }: { row: number; label: string; n: number; tone: string }) => {
    const yy = y + row * (bh + 22);
    return (
      <g>
        <text x={x0} y={yy - 7} className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{label}</text>
        <rect x={x0} y={yy} width={n * scale} height={bh} rx={7} fill={`color-mix(in oklab, ${tone} 22%, var(--bg-card))`} stroke={tone} strokeWidth={2} />
        <text x={x0 + n * scale + 14} y={yy + bh / 2} dominantBaseline="central" className="font-mono select-none"
          style={{ fontSize: 14, fill: "var(--text)" }}>{n}</text>
      </g>
    );
  };
  return (
    <g>
      <Row row={0} label="check every pair (brute force)" n={45} tone="var(--diff-hard)" />
      <Row row={1} label="two fingers converging" n={9} tone="var(--diff-easy)" />
      <text x={VW / 2} y={y + 2 * (bh + 22) + 6} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        n = how many cards (here 10) · worst case is n−1 = 9 · this board finds it even sooner
      </text>
    </g>
  );
}

/* ── static: the palindrome generalization (letters stepping inward) ───────── */
function PalindromeScene() {
  const word = ["R", "A", "C", "E", "C", "A", "R"];
  const PG = rowGeom(word.length, VW, 250, 46, 8, 46);
  const L = 1, R = 5; // already stepped inward once; outer pair matched (green)
  const tones: (Tone | undefined)[] = word.map((_, i) =>
    i === 0 || i === 6 ? "good" : i === L || i === R ? "active" : undefined);
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };
  return (
    <g>
      <CellRow geom={PG} values={word} tones={tones} markers={markers} />
      <text x={VW / 2} y={PG.y - 14} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>palindrome? letters match at both ends → step both inward</text>
      <Arrow x1={PG.cx(L) - 22} y1={PG.y + PG.cellH + 30} x2={PG.cx(L) + 6} y2={PG.y + PG.cellH + 30} />
      <Arrow x1={PG.cx(R) + 22} y1={PG.y + PG.cellH + 30} x2={PG.cx(R) - 6} y2={PG.y + PG.cellH + 30} />
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <g>
    <TargetTag />
    <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
  </g>
);

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 8 beats (setup, brute, wedge, derive, win, run, general, name)
 *   structured : 5 — setup, wedge, derive, win, name (brute's 45-look count
 *                folds into the wedge connector; run + general cut)
 *   rigorous   : 3 — derive (invariant + the prediction gate) · win (exact
 *                cost + edge cases) · name (pattern close); the problem
 *                statement folds into derive's rigorous prose.
 *   refresh    : additionally trims brute, run, general (trimOnRefresh).      */
export const twoPointersLesson: LessonSpec = {
  topicTitle: "two pointers · find a pair that sums to 17",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: two_pointersPy as string,
  // standing on arrays (bridge anchor per TRACK-NARRATIVES.md): any slot in
  // one step — this lesson spends the row's sorted ORDER to skip most pairs.
  bridgeFrom: reg({
    base: "An array hands you any slot in one step — now a sorted array's order can tell you which slots never to visit.",
    intuitive: "You know the shelf: any spot in one step. This row is also sorted — and that order lets you skip most of it.",
    rigorous: "arr[i] is O(1) address math — sortedness adds an order guarantee strong enough to prune the whole pair space.",
  }),
  // from meta (TRACK-NARRATIVES row 18): sorted order steers the fingers; most
  // pairs are never checked — idea 3 of 7, monotonicity-and-invariants.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I see the setup",
      takeaway: reg({
        base: "Ten sorted cards — find two that add up to 17, touching as few as possible.",
        intuitive: "Ten cards in order, one target: find the pair that sums to 17 with the fewest touches.",
      }),
      visual: idleRow(),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "Ten cards on a table. Find the pair that adds up.",
        body: reg({
          base: <>Ten number cards lie in a row, smallest to largest. A friend names a total &mdash; say <strong>17</strong> &mdash; and asks for two cards that add up to it exactly. The question: how few cards must you touch?</>,
          intuitive: <>Ten number cards lie in a row, already in order &mdash; smallest on the left, largest on the right. A friend names a total, <strong>17</strong>, and wants two cards that add up to it exactly. The game: be sure of the answer while touching as few cards as you can.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Picture ten cards laid out in a row, smallest on the left, largest on the right. A friend points at a number &mdash; let&rsquo;s say <code>17</code> &mdash; and asks: &ldquo;Find me two cards that add up to exactly this.&rdquo;</p>
            <p>You&rsquo;re allowed to pick any two cards, lift them up, check their total, and put them back. The real question isn&rsquo;t <em>can</em> you do it &mdash; it&rsquo;s how <strong>few</strong> cards you have to touch before you&rsquo;re sure. That &ldquo;how few&rdquo; is the whole game here.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Start with the table: ten cards in a row, laid left to right from smallest to largest. Your friend points at a number &mdash; <code>17</code> &mdash; and says: &ldquo;two of these add up to exactly that. Find them.&rdquo;</p>
            <p>The rules are gentle: lift any two cards, total them, put them back. Anyone can find the pair eventually &mdash; the real game is being <em>sure</em> while touching as few cards as possible. Keep that score in your head for the whole lesson: how many touches?</p>
          </>
        ),
      }),
      codeLabels: ["sig"],
    },
    {
      id: "brute",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Before getting clever, what does the honest, no-tricks way actually cost?",
      actionLabel: "Sorted should mean something",
      takeaway: "Trying every pair is up to 45 tries (O(n²)) — and ignores that the cards are sorted.",
      visual: <BruteForce />,
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Try every pair until one works.",
        body: <>The honest way: pick one card, test it against every other. Nothing sums to 17? Pick the next, test the rest. For ten cards that&rsquo;s up to <strong>45</strong> tries &mdash; you touch cards over and over. The cards are <strong>sorted</strong>, but we haven&rsquo;t used that.</>,
      }],
      detail: (
        <>
          <p>The honest answer: pick the first card, then test it against every other card. If nothing sums to <code>17</code>, pick the second card and test it against every card after it. Then the third, and so on. This is the <strong>brute-force</strong> way &mdash; try every possible pair and hope one fits.</p>
          <p>For ten cards that&rsquo;s <code>9 + 8 + 7 + &hellip; + 1 = 45</code> pairs to inspect, and you end up touching the same cards over and over. Scale it up: a thousand cards means roughly half a million pairs. We call this <Term word="O(n²)"><code>O(n&sup2;)</code></Term> work (&ldquo;order n-squared&rdquo;) &mdash; meaning if the number of cards <code>n</code> doubles, the effort roughly <em>quadruples</em>.</p>
          <p>Here&rsquo;s the waste: the cards are already <strong>sorted</strong>, smallest to largest, and we haven&rsquo;t used that fact at all. Surely the order is worth something.</p>
        </>
      ),
      arrows: [{ x1: G.cx(5), y1: 300, x2: G.cx(5), y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "If checking every pair wastes the sorted order, start at the two ends and let the order guide you.",
        structured: "Checking every pair costs up to 45 looks for ten cards — and never uses the sorted order. Start at the two ends instead and let the order guide you.",
      }),
      actionLabel: "I see the pattern",
      takeaway: reg({
        base: "Start a finger at each end: too small grows by moving L right, too big shrinks by moving R left.",
        intuitive: "One finger on each end card: total too small? move the left one. Too big? move the right one.",
      }),
      visual: (api) => <MoveTheFingers api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Two fingers. One at each end. Move them.",
          body: reg({
            base: <>Put one finger &mdash; call it <Term word="L"><code>L</code></Term> &mdash; on the smallest card, one (<Term word="R"><code>R</code></Term>) on the largest. <em><Term word="arr[i]"><code>arr[L]</code></Term> just means the card the L finger points at.</em> Add the two. Use the buttons: when the sum is too small, which finger makes it bigger?</>,
            intuitive: <>One finger &mdash; call it <Term word="L"><code>L</code></Term> &mdash; goes on the smallest card, the other (<Term word="R"><code>R</code></Term>) on the largest. <em><Term word="arr[i]"><code>arr[L]</code></Term> is just &ldquo;the card under the L finger.&rdquo;</em> Add the two cards. Now play with the buttons: when the total comes out too small, which finger makes it grow?</>,
          }),
        },
        {
          left: 600, top: 360, width: 252, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> too small &rarr; move which finger to grow the sum? Too big &rarr; which one to shrink it?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Put your left finger on the smallest card and your right finger on the largest. We&rsquo;ll call them <code>L</code> and <code>R</code> &mdash; just names for &ldquo;the card the left finger is on&rdquo; and &ldquo;the card the right finger is on.&rdquo; Add the two numbers together. Then use the buttons to move whichever finger you like, and just <em>watch</em> what the sum does.</p>
            <p>Don&rsquo;t reach for a strategy yet. Notice the feel of it: when does each finger want to move? What does it mean when the total comes out too small? Too big? The answer is hiding in plain sight because the cards are sorted &mdash; moving <code>L</code> right always lands on a bigger card, moving <code>R</code> left always lands on a smaller one.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> if the sum is too small, which finger could you move to make it bigger? If the sum is too big, which one could you move to shrink it?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Left finger on the smallest card, right finger on the largest. Call them <code>L</code> and <code>R</code> &mdash; nothing fancy, just names for &ldquo;where each finger is.&rdquo; Add the two cards they touch. Then press the buttons and simply <em>watch</em> what the total does.</p>
            <p>No strategy yet &mdash; get a feel for it first. Because the cards are in order, moving <code>L</code> right always lands on a bigger card, and moving <code>R</code> left always lands on a smaller one. So one finger can only push the total up, and the other can only pull it down.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> the total comes out too small &mdash; which finger fixes that? Too big &mdash; which one?
            </div>
          </>
        ),
      }),
      codeLabels: ["compute", "compare"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      // Appears for EVERY register — rigorous opens here, so its connector is empty
      // (the bridgeFrom line does the opening) and its prose restates the problem.
      connector: reg({
        base: "You felt which finger to move — now here's the reason it's always the right call.",
        rigorous: "",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "Because it's sorted, one comparison retires a whole side of pairs at once, not just one.",
        intuitive: "Sorted cards keep a promise: one look can throw away every pair using an end card.",
        rigorous: "Each comparison soundly discards one endpoint — any valid pair always stays inside the window.",
      }),
      visual: (api) => <RetireSide api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The derivation",
          title: reg({
            base: "Each move retires a whole row of pairs.",
            rigorous: "One comparison eliminates one endpoint.",
          }),
          body: reg({
            base: <>Too big? <code>L</code> is already the smallest card left, so <em>every</em> pair using <code>arr[R]</code> is too big &mdash; never look at it again, step <code>R</code> left. Too small? Mirror it: step <code>L</code> right. One look retires a whole side.</>,
            intuitive: <>The fingers read 1 + 20 = 21 &mdash; too big. <code>L</code> is already on the smallest card in play, so before anything moves, tap below: how much did that single look actually rule out?</>,
            rigorous: <>Sorted <code>arr</code>, target 17; <code>L</code> and <code>R</code> start at the ends. If <code>arr[L] + arr[R]</code> overshoots, every pair containing <code>arr[R]</code> overshoots too &mdash; <code>arr[L]</code> is its smallest available partner &mdash; so <code>R</code> is discarded outright. Undershoot mirrors with <code>L</code>. One comparison, one endpoint gone.</>,
          }),
        },
        {
          left: 600, top: 360, width: 252, variant: "note",
          body: reg({
            base: <><strong className="text-[var(--accent-ink)]">Why it works:</strong> sorted is a promise the cards keep &mdash; each comparison cuts a whole side, not one pair.</>,
            rigorous: <><strong className="text-[var(--accent-ink)]">Invariant:</strong> if a pair summing to the target exists, both its indices lie in <code>[L, R]</code>. Every move preserves it.</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Call the fingers <code>L</code> and <code>R</code>, and look at the total <code>arr[L] + arr[R]</code> &mdash; the left card plus the right card.</p>
            <p><strong>Too small?</strong> Remember <code>R</code> is sitting on the biggest card left in play. So pairing <code>arr[L]</code> with <em>anything</em> between <code>L</code> and <code>R</code> can only be smaller still &mdash; every one of those pairs is also too small. That means <code>arr[L]</code> can never be part of the answer, so we throw it away for good and step <code>L</code> one card to the right.</p>
            <p><strong>Too big?</strong> The mirror image. Every pair using <code>arr[R]</code> with anything from <code>L</code> to <code>R</code> is also too big, so we retire <code>R</code> and step it one card to the left.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong>{" "}being sorted is a promise the cards keep. Each single comparison lets us eliminate a whole side of the remaining cards at once &mdash; not just one pair.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Look at what the fingers are touching: <code>L</code> is on the smallest card still in play, <code>R</code> on the biggest. Their total came out too big &mdash; 21, over 17.</p>
            <p>Now the thought that powers the whole lesson: could the <code>20</code> ever work with <em>any</em> other card? Every other partner it could get is bigger than the <code>1</code> &mdash; so every one of those totals would be even bigger than 21. The <code>20</code> is hopeless. Slide <code>R</code> off it, for good.</p>
            <p>Too small is the mirror image: then the card under <code>L</code> is the hopeless one &mdash; even the biggest partner left couldn&rsquo;t lift it to 17 &mdash; so <code>L</code> steps right instead.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong>{" "}sorted order is a promise the cards keep &mdash; and that promise lets one look throw away a whole side of pairs, never just one.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Invariant.</strong> If some pair sums to the target, both its indices lie in <code>[L, R]</code>. True at the start (<code>L = 0</code>, <code>R = n &minus; 1</code> cover everything); each move must keep it true.</p>
            <p><strong>Proof of the move.</strong> Suppose <code>arr[L] + arr[R]</code> &gt; target. For any <code>k</code> with <code>L &le; k &lt; R</code>: <code>arr[k] &ge; arr[L]</code> (sorted), so <code>arr[k] + arr[R] &ge; arr[L] + arr[R]</code> &gt; target. No pair inside the window uses index <code>R</code>, so decrementing <code>R</code> preserves the invariant. The undershoot case mirrors for <code>L</code>. Each step discards exactly one index, soundly.</p>
            <p>Sortedness does all the work: it is the monotone guarantee that makes the discard safe. Unsorted input voids the argument &mdash; sort first, or use a hash map instead.</p>
          </>
        ),
      }),
      codeLabels: ["compute", "less", "move_left", "greater", "move_right"],
      interaction: "wedge",
    },
    {
      id: "win",
      label: "The win",
      connector: reg({
        base: "If one look retires a whole side, count how many looks the whole search can possibly take.",
        rigorous: "Each comparison discards exactly one index — so bound the total.",
      }),
      actionLabel: reg({
        base: "See it converge",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Each card is touched once, so 45 pairs collapse to at most 9 steps — O(n) instead of O(n²).",
        intuitive: "The fingers never back up, so ten cards cost at most nine looks — not forty-five.",
        rigorous: "L only rises, R only falls: at most n − 1 comparisons — O(n) time, O(1) extra space.",
      }),
      visual: <WinStat />,
      panels: [{
        left: 150, top: 26, width: 560, variant: "main", label: "The win", title: "Forty-five pairs becomes nine comparisons.",
        body: reg({
          base: <>Trying every pair takes up to <code>n &times; (n &minus; 1) / 2</code> &mdash; with <code>n</code> (the card count) = 10, that&rsquo;s 45. Two fingers touch each card once: <code>L</code> only moves right, <code>R</code> only left. They meet in at most <code>n &minus; 1</code> = 9 steps.</>,
          intuitive: <>Count it on the cards, not with a formula: every look retires one card for good, and the game ends when the fingers meet. Ten cards, two already under the fingers &mdash; at most <strong>nine</strong> looks. The try-every-pair way needed up to <strong>45</strong>.</>,
          rigorous: <>Each iteration moves exactly one pointer inward, so <code>R &minus; L</code> drops by one per comparison: at most <code>n &minus; 1</code> comparisons, against brute force&rsquo;s <code>n(n &minus; 1)/2</code> pair inspections. That linear count is <Term word="O(n)"><code>O(n)</code></Term> time &mdash; and <Term word="O(1)"><code>O(1)</code></Term> extra space: two indices, nothing else.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Put the two costs side by side. Brute force inspects up to <code>n &times; (n &minus; 1) / 2</code> pairs &mdash; here <code>n</code> is the card count, so with <code>n = 10</code> that&rsquo;s 45 comparisons. That formula is <Term word="O(n²)"><code>O(n&sup2;)</code></Term> work: double the cards and the effort roughly quadruples.</p>
            <p>The two fingers, by contrast, touch each card at most once. <code>L</code> only ever moves right, <code>R</code> only ever moves left, and they march toward each other until they meet. So after at most <code>n &minus; 1</code> = 9 steps the search is over. That&rsquo;s <Term word="O(n)"><code>O(n)</code></Term> work (&ldquo;order n&rdquo;) &mdash; the effort grows in simple step with the number of cards, not with its square.</p>
            <p>Forty-five collapses to nine, and the gap only widens as the row gets longer. Next, see the fingers actually converge.</p>
            <p>Edge cases, while we&rsquo;re counting: if <em>no</em> pair sums to 17, the fingers simply meet and the search ends honestly &mdash; the code returns <code>None</code> after those same at-most-9 looks. The loop&rsquo;s <code>L &lt; R</code> condition also means a card never pairs with itself, and an empty or one-card row ends before a single look.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Line the two costs up. The try-every-pair way: up to 45 looks for ten cards &mdash; and double the cards means roughly four times the looks. Growth like that is what people write as <Term word="O(n²)"><code>O(n&sup2;)</code></Term>.</p>
            <p>The two fingers: every look retires a card for good. <code>L</code> never backs up, <code>R</code> never backs up, and the game stops when they meet &mdash; so ten cards cost at most nine looks. Counting like that, effort growing in step with the cards, is what <Term word="O(n)"><code>O(n)</code></Term> means.</p>
            <p>And when there is <em>no</em> winning pair at all? Nothing breaks: the fingers meet, the answer is &ldquo;no pair,&rdquo; and it still took at most nine looks. A row with one card (or none) ends before a single look &mdash; the fingers have nowhere to stand. And a card never gets paired with itself, because the two fingers must sit on different cards.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact cost.</strong> Every iteration does constant work and moves exactly one pointer inward, so the window width <code>R &minus; L</code> falls from <code>n &minus; 1</code> to 0: at most <code>n &minus; 1</code> iterations, best case 1. Time <Term word="O(n)"><code>O(n)</code></Term>, extra space <Term word="O(1)"><code>O(1)</code></Term> &mdash; versus <code>n(n &minus; 1)/2</code> pair inspections for brute force. (Input not sorted? Sorting first costs <code>O(n log n)</code> and dominates.)</p>
            <p><strong>Edge cases.</strong> No valid pair: the pointers meet and the function returns <code>None</code> &mdash; a miss costs the same O(n). Empty or single-element input: <code>left &lt; right</code> is false immediately, zero iterations. The strict <code>&lt;</code> also forbids pairing an element with itself. Duplicates are harmless &mdash; the first valid pair found is returned. Precondition: ascending order; unsorted input silently breaks the discard argument.</p>
          </>
        ),
      }),
      codeLabels: ["loop", "compute", "compare", "found"],
    },
    {
      id: "run",
      label: "The win, watched",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Nine steps on paper — here it is happening, the retired cards fading out one move at a time.",
      actionLabel: "Where else it fits",
      takeaway: reg({
        base: "Watched live: the fingers walk inward, retired cards fade, and they land on 17 in just a few looks.",
        intuitive: "The fingers often land on the pair early — nine looks is the worst case, not the usual cost.",
      }),
      visual: (api) => <AutoTwoPointers api={api} />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "Watch it converge", title: "The fingers walk inward on their own.",
        body: <>The two fingers start at the ends and step inward by themselves, each move shrinking what&rsquo;s left. Faded cards are retired &mdash; out of play for good. When the sum lands on 17, the pair turns green. Use <strong>&ldquo;↺ replay&rdquo;</strong> under the visual to run it again. This board finishes in well under nine looks.</>,
      }],
      detail: (
        <>
          <p>The rule from the last two beats now runs on its own &mdash; just watch. The two fingers start at the far ends and step inward one move at a time, and every move shrinks the part of the row still in play.</p>
          <p>The faded cards aren&rsquo;t just dimmed for looks &mdash; they&rsquo;re the ones we <em>retired</em>, gone for good because we proved they couldn&rsquo;t be part of the answer. When <code>arr[L] + arr[R]</code> finally lands on <code>17</code>, that pair turns green and the search stops. Count the moves: this board reaches the answer in well under the nine looks the worst case allows, because the fingers often meet the target before they ever get close to each other.</p>
        </>
      ),
      codeLabels: ["loop", "compute", "compare", "found"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "The cards were just one excuse to use the fingers — the same move answers questions that have nothing to do with sums.",
      actionLabel: "Name the pattern",
      takeaway: "The same two fingers solve palindromes and most-water too — all they need is a direction.",
      visual: <PalindromeScene />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The generalization", title: "Same fingers. New questions.",
        body: <>The fingers don&rsquo;t care <em>what</em> they compare. Is a word a palindrome (reads the same backward)? One finger at each end, step inward while letters match. They just need a <strong>direction</strong>: order, symmetry, or height.</>,
      }],
      detail: (
        <>
          <p>Try a different question with the same two fingers: is this word a <strong>palindrome</strong> &mdash; does it read the same forwards and backwards, like <em>racecar</em>? Put one finger at each end and compare the letters. If they match, both fingers step inward. The first time they don&rsquo;t, it&rsquo;s not a palindrome. Same convergence, about <code>n / 2</code> moves &mdash; roughly half as many steps as there are letters.</p>
          <p>Or a question with no list to search at all: given the heights of vertical lines, which two hold the most water between them? Two fingers at the ends, always move the <em>shorter</em> one inward, because the short line is the bottleneck. Same pattern again.</p>
          <p>The fingers genuinely don&rsquo;t care <em>what</em> they&rsquo;re comparing. All they need is that the thing underneath has a <em>direction</em> &mdash; sorted order, symmetry, height &mdash; that tells each finger which way to step.</p>
        </>
      ),
      codeLabels: ["loop", "compare"],
    },
    {
      id: "name",
      visual: idleRow(
        ARR.map((_, i) => (i === 2 || i === 6 ? "good" : undefined)),
        ARR.map((_, i) => i !== 2 && i !== 6),
        { 2: "✓", 6: "✓" },
      ),
      label: "The pattern",
      connector: reg({
        base: "You've used it, proved it, and stretched it — here's its name and the cues that should make you reach for it.",
        structured: "You've used it and proved it — here's its name and the cues that should make you reach for it.",
        rigorous: "Name it, and file it under the idea it instantiates.",
      }),
      takeaway: reg({
        base: "It's Two Pointers — reach for it on sorted pair-sums, palindromes, or “most water”.",
        intuitive: "Two Pointers: when a row has a direction, two fingers can find the answer in one pass.",
        rigorous: "Two Pointers: a monotone invariant discards a side per comparison — O(n) on ordered input.",
      }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Two Pointers.",
        body: reg({
          base: <>That&rsquo;s the name. Reach for it whenever a row has a <strong>direction</strong> &mdash; sorted order, symmetry, a one-way pattern &mdash; and one comparison can retire a whole side. Signals: &ldquo;sorted array + pair sum&rdquo;; &ldquo;palindrome&rdquo;; &ldquo;container with most water.&rdquo;</>,
          intuitive: <>Its name: <strong>Two Pointers</strong> &mdash; the &ldquo;pointers&rdquo; are your two fingers. Reach for it when a row has a <strong>direction</strong> &mdash; sorted order, symmetry, a one-way pattern &mdash; so one look can retire a whole side. And file the why: idea 3 of 7, <strong>keep a guarantee that lets you skip work</strong>.</>,
          rigorous: <>Two Pointers. It applies when the data carries a monotone guarantee &mdash; sorted order, symmetry, a one-way bound &mdash; strong enough that one comparison soundly discards a whole side. That is idea 3 of 7, <strong>monotonicity and invariants</strong>: maintain a guarantee that lets you skip work.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: <strong>Two Pointers</strong>. The &ldquo;<Term word="pointer">pointers</Term>&rdquo; are just the two fingers &mdash; markers that each remember a position in the row. The pattern fits whenever a line of data has a <em>direction</em> (sorted order, symmetry, or some one-way pattern) and a single comparison can rule out a whole side of what&rsquo;s left, instead of just one item.</p>
            <p>Reach for it when you spot signals like these:</p>
            <ul>
              <li>a &ldquo;sorted array&rdquo; plus a &ldquo;pair sum&rdquo; or &ldquo;target&rdquo;</li>
              <li>&ldquo;palindrome&rdquo; or &ldquo;symmetric&rdquo;</li>
              <li>&ldquo;remove duplicates in place&rdquo;</li>
              <li>&ldquo;container with most water&rdquo; or &ldquo;trap rainwater&rdquo;</li>
            </ul>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity and invariants:</strong> maintain a guarantee that lets you skip work. Here the guarantee was sorted order, and it paid out a whole side of skipped pairs per look.
            </div>
            <p>Open the Code panel to see exactly how the two fingers look written out in Python.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The move has a proper name: <strong>Two Pointers</strong>. The &ldquo;<Term word="pointer">pointers</Term>&rdquo; are just the two fingers &mdash; markers that each remember a spot in the row. It fits whenever the row has a <em>direction</em> &mdash; sorted order, symmetry, some one-way pattern &mdash; so that one look can rule out a whole side, never just one card.</p>
            <p>Signals that should make your hand twitch: &ldquo;sorted array&rdquo; plus &ldquo;pair sum,&rdquo; &ldquo;palindrome,&rdquo; &ldquo;remove duplicates in place,&rdquo; &ldquo;container with most water.&rdquo;</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; keep a guarantee that lets you skip work:</strong> the sorted order was a promise the cards kept, and every look cashed that promise in for a whole side of skipped pairs.
            </div>
            <p>Open the Code panel to see the two fingers written out in Python.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Two Pointers.</strong> Preconditions: a monotone structure (sorted order, symmetry, a one-way bound) and a comparison that classifies one endpoint as disposable. Mechanics: two indices move monotonically toward each other; the invariant &mdash; any answer lies within the window &mdash; is preserved per step; termination in &le; n &minus; 1 steps. Variants: pair-sum on sorted input, palindrome check (&asymp; n/2 steps), container-with-most-water (advance the shorter line), in-place dedup (read/write pointers).</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity and invariants:</strong> maintain a guarantee that lets you skip work; here sortedness pays out one soundly discarded endpoint per comparison.
            </div>
          </>
        ),
      }),
      arrows: [
        { x1: G.cx(2), y1: G.y + G.cellH + 34, x2: G.cx(2), y2: G.y + G.cellH + 4 },
        { x1: G.cx(6), y1: G.y + G.cellH + 34, x2: G.cx(6), y2: G.y + G.cellH + 4 },
      ],
      codeLabels: ["found", "notfound"],
    },
  ],
};
