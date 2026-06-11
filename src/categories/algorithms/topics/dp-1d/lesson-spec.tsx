"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, NodeGraph, GNode, GEdge, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import dp_1dPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* dp[0..8] for the "ways to climb i stairs" table — 1,1,2,3,5,8,13,21,34. */
const DP = (() => {
  const a = [1, 1];
  for (let i = 2; i <= 8; i++) a[i] = a[i - 1] + a[i - 2];
  return a;
})();
/* Row geometry for the 9-cell dp table, centered, sitting in the middle band. */
const G = rowGeom(DP.length, VW, 300, 52, 10, 52);

/* ── shared SVG caption above/below the visual ─────────────────────────────── */
function Caption({ y, text, tone = "var(--text-faint)" }: { y: number; text: string; tone?: string }) {
  return (
    <text x={VW / 2} y={y} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: tone }}>
      {text}
    </text>
  );
}
function ReplayButton({ y, label, onClick }: { y: number; label: string; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={VW / 2 - 36} y={y} width={72} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={VW / 2} y={y + 12} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{label}</text>
    </g>
  );
}

/* ── STAIRCASE visual (beats 1-2), raw SVG so we control tone + counters ────── */
function Staircase({ showCounts }: { showCounts?: boolean }) {
  const steps = 8;
  const tw = 70, th = 20, gap = 8;          // tread width / height / vertical gap
  const stepShift = 24;                      // horizontal offset per step
  const stride = th + gap;
  // Footprint of the treads (x0 .. x0 + 7*shift + tw). Keep it left of the
  // counts column when showCounts; otherwise center it in the 860 width.
  const footprint = (steps - 1) * stepShift + tw;
  const x0 = showCounts ? 120 : (VW - footprint) / 2;
  // Bottom tread (step 1) sits low in the middle band; step 8 climbs up to ~y200.
  const baseY = 404;
  const rows = Array.from({ length: steps }, (_, i) => {
    const tread = i + 1;                     // step 1 (bottom) … step 8 (top)
    const x = x0 + i * stepShift;
    const y = baseY - i * stride;
    return (
      <g key={i}>
        <rect x={x} y={y} width={tw} height={th} rx={5}
          fill={tread === steps ? "color-mix(in oklab, var(--accent-sky) 22%, var(--bg-card))" : "var(--bg-card)"}
          stroke={tread === steps ? "var(--accent-line)" : "var(--line)"} strokeWidth={1.5} />
        <text x={x + tw / 2} y={y + th / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>step {tread}</text>
      </g>
    );
  });
  return (
    <g>
      {!showCounts && (
        <text x={x0 + footprint / 2} y={186} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
          8 steps · hop 1 or 2 at a time
        </text>
      )}
      {rows}
      {showCounts && (
        <g>
          <text x={560} y={250} className="font-mono select-none" style={{ fontSize: 15, fill: "var(--diff-easy)" }}>real answer = 34 routes</text>
          <text x={560} y={282} className="font-mono select-none" style={{ fontSize: 15, fill: "var(--diff-hard)" }}>naive recursion = 67 calls</text>
          <text x={560} y={320} className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>most re-compute the same</text>
          <text x={560} y={338} className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>sub-answer over and over</text>
        </g>
      )}
    </g>
  );
}

/* ── RECURSION TREE for ways(6), hand-laid so nothing overlaps ──────────────── *
 * Each node is one call ways(k). The same k re-appears in many places — that is
 * the repeated-subproblem waste this lesson is about. Layout: depth → y, hand
 * x-positions keep the wide tree inside the 860×470 box. */
interface TNode { id: string; k: number; x: number; y: number; parent?: string; }
const TREE: TNode[] = [
  { id: "6", k: 6, x: 400, y: 198 },
  { id: "5a", k: 5, x: 280, y: 256, parent: "6" },
  { id: "4a", k: 4, x: 520, y: 256, parent: "6" },
  { id: "4b", k: 4, x: 190, y: 314, parent: "5a" },
  { id: "3a", k: 3, x: 360, y: 314, parent: "5a" },
  { id: "3b", k: 3, x: 470, y: 314, parent: "4a" },
  { id: "2a", k: 2, x: 580, y: 314, parent: "4a" },
  { id: "3c", k: 3, x: 120, y: 372, parent: "4b" },
  { id: "2b", k: 2, x: 240, y: 372, parent: "4b" },
  { id: "2c", k: 2, x: 330, y: 372, parent: "3a" },
  { id: "1a", k: 1, x: 400, y: 372, parent: "3a" },
  { id: "2d", k: 2, x: 450, y: 372, parent: "3b" },
  { id: "1b", k: 1, x: 510, y: 372, parent: "3b" },
  { id: "2e", k: 2, x: 90, y: 430, parent: "3c" },
  { id: "1c", k: 1, x: 165, y: 430, parent: "3c" },
];
const TREE_EDGES: GEdge[] = TREE.filter((t) => t.parent).map((t) => ({ from: t.parent!, to: t.id }));
const treeNodes = (tone: (t: TNode) => Tone | undefined): GNode[] =>
  TREE.map((t) => ({ id: t.id, x: t.x, y: t.y, label: t.k, tone: tone(t), r: 16 }));

/* ── WEDGE (beat 3): toggle "remember answers" → duplicate calls light up ───── *
 * Off = naive: every node is real work. On = remembered: any value computed
 * before (its 2nd+ appearance) lights green — those are the ones we now skip. */
function ToggleMemo({ api }: { api: BeatVisualApi }) {
  const [remember, setRemember] = useState(false);

  const toggle = () => {
    api.onInteractionDone();
    const next = !remember;
    setRemember(next);
    api.onActiveLine(next ? ["recurrence"] : ["sig"]);
  };

  // First time each k appears (left-to-right, top-to-bottom) is the "real" one;
  // later repeats are the reused look-ups.
  const seen = new Set<number>();
  const reused = new Set<string>();
  for (const t of TREE) {
    if (seen.has(t.k)) reused.add(t.id);
    else seen.add(t.k);
  }
  const tone = (t: TNode): Tone | undefined =>
    remember ? (reused.has(t.id) ? "good" : "active") : undefined;
  const realCalls = remember ? TREE.length - reused.size : TREE.length;

  return (
    <g>
      <NodeGraph nodes={treeNodes(tone)} edges={TREE_EDGES} radius={16} />
      <Caption y={188} tone={remember ? "var(--diff-easy)" : "var(--text-faint)"}
        text={remember
          ? `remembering: ${reused.size} green calls are looked up, not redone — real work drops to ${realCalls}`
          : "naive: every circle is real work — many ask the same question"} />
      <g onClick={toggle} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="toggle remember answers"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}>
        <rect x={VW / 2 - 80} y={444} width={160} height={24} rx={6} fill="var(--accent-soft)" stroke="var(--accent-line)" />
        <text x={VW / 2} y={456} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>
          {remember ? "naive" : "remember answers"}
        </text>
      </g>
    </g>
  );
}

/* ── PLAYBACK (beat 5): the dp table fills itself, one cell per frame ────────── */
interface TabState { filledTo: number; done: boolean; }
function AutoTabulate({ api }: { api: BeatVisualApi }) {
  const init = (): TabState => ({ filledTo: 1, done: false });
  const [s, setS] = useState<TabState>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const next = c.filledTo + 1;
      if (next >= DP.length - 1) { api.onActiveLine(["answer"]); setS({ filledTo: DP.length - 1, done: true }); return; }
      api.onActiveLine(["loop", "recurrence"]);
      setS({ filledTo: next, done: false });
    }, pace(900));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { filledTo, done } = s;
  const tones: (Tone | undefined)[] = DP.map((_, i) => (done && i === filledTo ? "good" : i === filledTo ? "active" : i < filledTo ? "good" : undefined));
  const values = DP.map((v, i) => (i <= filledTo ? v : "·"));
  const markers: Record<number, string> = { 0: "dp0", [filledTo]: `dp${filledTo}` };

  return (
    <g>
      <CellRow geom={G} values={values} tones={tones} markers={markers} />
      <Caption y={G.y - 28} tone={done ? "var(--diff-easy)" : "var(--text-faint)"}
        text={done
          ? "dp[8] = 34 ✓ — every slot computed once, one addition each"
          : `ways to climb ${filledTo} stairs = ${DP[filledTo]}  (dp[${filledTo}] = dp[${filledTo - 1}] + dp[${filledTo - 2}])`} />
      <ReplayButton y={G.y + G.cellH + 44} label="↺ replay" onClick={() => setS(init())} />
    </g>
  );
}

/* ── static dp row helper for the non-interactive table beats ───────────────── */
const dpRow = (filledTo: number, tones?: (Tone | undefined)[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={DP.map((v, i) => (i <= filledTo ? v : "·"))} tones={tones} markers={markers} />
);

/* ── PREDICTION GATE + playback (beat 5): commit to the cost of reuse, THEN
 * count it. The lesson's ONE prediction gate (BEAT-RITUAL: the cost predict
 * sits right before the cost reveal). The learner has watched repeats vanish
 * in the wedge but hasn't priced the fixed version — one tap on a pill is the
 * real interaction (interaction: "wedge"; PredictGate fires
 * api.onInteractionDone()), then after a short reading pause AutoTabulate
 * answers the prediction by filling the row, one addition per slot. The gate
 * is HTML hosted on the SVG canvas via <foreignObject>; data-canvas-panel
 * opts it into the scene layout's content-extent measurement. */
function TabulateCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoTabulate api={api} />;

  return (
    <g>
      {dpRow(1, DP.map((_, i) => (i <= 1 ? "good" : undefined)), { 0: "dp0", 1: "dp1" })}
      <Caption y={G.y - 28} text="naive ways(8) burned 67 calls — now price the write-it-down way" />
      <foreignObject x={190} y={G.y + G.cellH + 26} width={480} height={180}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Seven empty slots, each needing just the two answers before it — how much work to fill them all?"
            choices={[
              { id: "explode", label: "it still explodes — the repeats sneak back", note: "they can't: every answer a slot needs is already sitting in the row when you get there" },
              { id: "half", label: "about half of the 67 calls", note: "lower — nothing is ever computed twice now, so count the slots, not the calls" },
              { id: "once", label: "one addition per slot", correct: true, note: "each slot reads the two before it and adds — watch the row count it out" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── GENERALIZATION gallery (beat 6): same skeleton, different stories ──────── */
function FamilyGallery() {
  const cards: [string, string][] = [
    ["edit distance", "turn one word into another"],
    ["fewest coins", "make an amount of change"],
    ["knapsack", "pack a bag under a weight cap"],
    ["cheapest grid path", "walk a grid of costs"],
  ];
  const cw = 200, ch = 64, gap = 20, cols = 2;
  const totalW = cols * cw + (cols - 1) * gap;
  const x0 = (VW - totalW) / 2, y0 = 268;
  return (
    <g>
      <Caption y={238} text="one skeleton — solve small parts once, reuse them — many stories" />
      {cards.map((c, i) => {
        const r = Math.floor(i / cols), col = i % cols;
        const x = x0 + col * (cw + gap), y = y0 + r * (ch + gap);
        return (
          <g key={c[0]}>
            <rect x={x} y={y} width={cw} height={ch} rx={8} fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1.5} />
            <text x={x + cw / 2} y={y + 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>{c[0]}</text>
            <text x={x + cw / 2} y={y + 46} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>{c[1]}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, derive, operations,
 *                general, name)
 *   structured : 5 — cuts `obvious` (the recurrence + 67-call count fold into
 *                the wedge's structured connector) and `general` (its triggers
 *                already live in `name`'s prose).
 *   rigorous   : 3 — derive (invariant + both builds) + operations (cost +
 *                edges, gate included) + name; the recurrence itself is
 *                recalled by the rigorous bridgeFrom line so derive opens clean.
 *   refresh    : additionally trims `obvious` + `general` (trimOnRefresh).    */
export const dp1dLesson: LessonSpec = {
  topicTitle: "dynamic programming · ways to climb 8 stairs",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: dp_1dPy as string,
  // standing on recursion (the anchor, per TRACK-NARRATIVES.md): a base case
  // plus a self-call on a smaller piece — this lesson is what happens when
  // those self-calls keep repeating, and you start writing answers down.
  bridgeFrom: reg({
    base: "A recursion is a base case plus a self-call on a smaller piece — here those self-calls repeat, so we write answers down.",
    intuitive: "You can already solve a problem by trusting a smaller copy of itself — now the small copies repeat, so we keep notes.",
    rigorous: "ways(n) = ways(n−1) + ways(n−2) is plain recursion — naive evaluation is exponential; cache subproblems and it collapses.",
  }),
  // from meta (TRACK-NARRATIVES row 27): remember sub-answers; exponential
  // collapses — this lesson IS information reuse in action, not a foreshadow.
  principle: { key: "information-reuse", n: 1, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "The natural rule",
      takeaway: reg({
        base: "Count the routes up an 8-step staircase, hopping 1 or 2 at a time.",
        intuitive: "One question: how many routes climb 8 stairs in hops of 1 or 2?",
      }),
      visual: <Staircase />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The setup",
        title: "How many ways to climb the stairs?",
        body: reg({
          base: <>You&rsquo;re at the bottom of an <strong>8-step</strong> staircase. Each move you hop up 1 step or 2 steps. How many different routes reach the top? 1 step: 1 way. 2 steps: 2 ways. 3 steps: 3 ways. For 8, too many to count by hand.</>,
          intuitive: <>Stand at the bottom of <strong>8 stairs</strong>. Every move is your choice: hop up 1 step, or hop up 2. Count the <em>different</em> routes to the top. For 1 stair there&rsquo;s 1 route; for 2 stairs, 2 routes; for 3 stairs, 3. By 8, listing them by hand stops being fun.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Picture standing at the bottom of a staircase with <strong>8 steps</strong>. Every move, you may hop up either <strong>1 step</strong> or <strong>2 steps</strong> &mdash; your choice each time. The question is simple to ask: how many <em>different</em> routes get you all the way to the top?</p>
            <p>For a 1-step staircase there&rsquo;s just one way (a single little hop). For 2 steps there are two ways (1 then 1, or one big 2). For 3 steps there are three ways (1+1+1, 1+2, or 2+1). The counts grow fast.</p>
            <p>By the time you reach 8 steps, there are far more routes than you&rsquo;d want to list out by hand. We need a method, not patience.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Take the staircase one size at a time. A 1-step staircase: one route (a single small hop). A 2-step staircase: two routes &mdash; hop-hop, or one big 2-hop. A 3-step staircase: three routes &mdash; 1+1+1, 1 then 2, or 2 then 1.</p>
            <p>Try 4 steps in your head and it already gets slippery &mdash; routes blur together and it&rsquo;s easy to count one twice. By 8 steps there are dozens of routes, and the count keeps climbing fast as the staircase grows.</p>
            <p>Patience won&rsquo;t do it. We need a method that can&rsquo;t miscount &mdash; and the whole lesson is about finding the laziest correct one.</p>
          </>
        ),
      }),
      arrows: [{ x1: 540, y1: 158, x2: 524, y2: 210 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "We have the question; now reach for the most natural way to answer it.",
      actionLabel: "Stop the repeats",
      takeaway: "ways(n) = ways(n−1) + ways(n−2) — but naive recursion redoes the same calls.",
      visual: <Staircase showCounts />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The obvious thing",
        title: "A rule that re-does the same work over and over.",
        body: <>On step n, only your last move matters: you came from n&minus;1 or n&minus;2. So ways(n) = ways(n&minus;1) + ways(n&minus;2). (<Term word="recursion"><strong>Recursion</strong></Term> = a rule that calls itself on a smaller case.) But finding ways(8) keeps re-asking the same smaller questions.</>,
      }],
      detail: (
        <>
          <p>Stand on step <code>n</code>. The only thing that decides how you arrived is your <em>last</em> move: either you took 1 step (so a moment ago you were on step <code>n&minus;1</code>), or you took 2 steps (so you were on step <code>n&minus;2</code>). Every route into step <code>n</code> passes through one of those two places.</p>
          <p>So the number of ways to reach step <code>n</code> is just the ways to reach <code>n&minus;1</code> plus the ways to reach <code>n&minus;2</code>: <code>ways(n) = ways(n&minus;1) + ways(n&minus;2)</code>. That tiny rule is a <strong>recursion</strong> &mdash; a rule that answers a question by calling itself on smaller versions of the same question.</p>
          <p>Here&rsquo;s the trap. To get <code>ways(8)</code> we ask for <code>ways(7)</code> and <code>ways(6)</code>. But <code>ways(7)</code> <em>also</em> needs <code>ways(6)</code> &mdash; so we compute <code>ways(6)</code> twice. Further down it&rsquo;s far worse: small cases like <code>ways(2)</code> get re-computed dozens of times. The work isn&rsquo;t hard. It&rsquo;s repeated.</p>
        </>
      ),
      arrows: [{ x1: 620, y1: 152, x2: 600, y2: 236 }],
      codeLabels: ["sig", "recurrence"],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      // intuitive/structured variants are self-contained recalls of the naive
      // rule + its repeats, so the beat still opens cleanly when `obvious` is
      // cut (structured) or trimmed (intuitive refresh).
      connector: reg({
        base: "If the same small questions keep coming back, what if we just refused to answer any of them twice?",
        intuitive: "Counting routes naively asks the same small questions again and again — what if we refused to answer any of them twice?",
        structured: "Only the last hop matters, so ways(n) = ways(n−1) + ways(n−2) — but run naively, ways(8) makes 67 calls for just 34 routes.",
      }),
      actionLabel: "Make it a rule",
      takeaway: reg({
        base: "Solve each sub-question once, write it down, and look it up after.",
        intuitive: "Never answer the same small question twice — write it down, look it up.",
      }),
      visual: (api) => <ToggleMemo api={api} />,
      panels: [
        {
          left: 40, top: 20, width: 560, variant: "main", label: "The instinct",
          title: "Solve each question once. Look it up after.",
          body: reg({
            base: <>This branching picture of who-calls-whom is a <strong>tree</strong>; each circle is one call ways(k). Notice how the same numbers repeat. Toggle <strong>remember answers</strong>: the second time a call comes back, hand over the answer we wrote down. The green calls vanish.</>,
            intuitive: <>This branching picture of who-asks-whom is called a <strong>tree</strong>; each circle is one little ask, &ldquo;ways up k stairs?&rdquo; The same numbers keep reappearing in different branches. Toggle <strong>remember answers</strong>: the second time an ask comes back, we hand over the answer we wrote down &mdash; and the green circles stop being work.</>,
          }),
        },
        {
          left: 560, top: 348, width: 280, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> every sub-question has exactly one true answer. Computing it twice is pure waste &mdash; so write it down once.</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>The picture on the right is a <strong>tree</strong> of calls &mdash; a branching diagram of who-asks-whom. Each circle is one call <code>ways(k)</code>; the lines drop to the two smaller calls it sets off. Look closely and you&rsquo;ll see the same numbers showing up again and again in different branches: that repetition <em>is</em> the wasted work.</p>
            <p>Now toggle <strong>remember answers</strong>. The first time we compute some <code>ways(k)</code>, we jot the result down. The next time that exact call appears, we don&rsquo;t redo it &mdash; we just hand back the number we already wrote. On the diagram, those repeat calls light up green and effectively disappear, and the tree collapses to a fraction of its size.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct:</strong> every sub-question has exactly one true answer. Computing it twice is pure waste &mdash; so write it down the first time, and reuse it forever after.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>The picture is a <strong>tree</strong> of questions &mdash; a branching map of who-asks-whom. The top circle is the big ask, &ldquo;ways up 6?&rdquo; It sets off two smaller asks &mdash; &ldquo;ways up 5?&rdquo; and &ldquo;ways up 4?&rdquo; &mdash; and each of those sets off two more, all the way down. Now scan across the rows: the <em>same numbers</em> keep reappearing in different branches. Every repeat is the computer re-answering a question it has already answered.</p>
            <p>Hit <strong>remember answers</strong>. New deal: the first time a question gets answered, the answer is written down; any later copy of that question is handed the note instead of being re-worked. On the picture, every repeat lights up green &mdash; looked up, not redone &mdash; and the real work shrinks to a handful of circles.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct:</strong> a question like &ldquo;ways up 4?&rdquo; has exactly one true answer. Working it out twice buys nothing &mdash; so write it down once, and reuse it forever after.
            </div>
          </>
        ),
      }),
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: reg({
        base: "That “write it down, look it up” idea can be built two different ways — here are both.",
        rigorous: "Memoize the recursion top-down, or tabulate bottom-up — same invariant: every subproblem is computed exactly once.",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "Two builds: a recursion with a notebook, or a table filled from the smallest case up.",
        intuitive: "Two ways to build it: keep notes while recursing, or fill a table smallest-first.",
        rigorous: "Memoize top-down or tabulate bottom-up — each subproblem computed exactly once.",
      }),
      visual: <g>{dpRow(1, DP.map((_, i) => (i <= 1 ? "good" : undefined)), { 0: "dp0", 1: "dp1" })}<Bracket x1={G.left(0)} x2={G.left(1) + G.cellW} y={G.y - 14} label="the two base values" color="var(--diff-easy)" /></g>,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The derivation",
        title: reg({
          base: "Two flavours, same answer.",
          rigorous: "Memoization or tabulation — one invariant.",
        }),
        body: reg({
          base: <>Top-down: keep the rule, add a notebook &mdash; check if it&rsquo;s written down before working, store it after. Bottom-up: drop recursion, build from the smallest case up. Since each step only needs the last two answers, the code keeps just two rolling variables: a, b = 1, 1, then a, b = b, a + b each step.</>,
          intuitive: <>Two builds, same result. Top-down: keep the self-calling rule, but peek in the notebook before working and write the answer in after. Bottom-up: skip self-calls entirely &mdash; fill a row of answers starting from the easy ends, so each new slot just adds the two before it. And since only the last two matter, two little boxes are all the memory you really need.</>,
          rigorous: <>Top-down: cache the bare recursion &mdash; hit the cache, or compute once and store. Bottom-up: <code>dp[0] = dp[1] = 1</code>, then <code>dp[i] = dp[i&minus;1] + dp[i&minus;2]</code> in increasing <code>i</code> &mdash; every dependency is final when read. Only two values are ever live, so the table contracts to a rolling pair: <code>a, b = b, a + b</code>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p><strong>Top-down (remember as you go).</strong> Keep the recursive rule exactly as it is, but give it a notebook &mdash; a lookup table that maps each <code>k</code> to its answer. Before doing any work for <code>ways(k)</code>, peek in the notebook; if the answer&rsquo;s already there, hand it straight back. Otherwise compute it once and write it down. No sub-question is ever solved twice.</p>
            <p><strong>Bottom-up (fill a table).</strong> Drop recursion completely and build the answers from the smallest case upward in an array called <code>dp</code> (here <code>dp[i]</code> just means &ldquo;ways to reach step <code>i</code>&rdquo;, and the <code>[i]</code> picks out one slot of the array). Start with the two base values <code>dp[0] = 1</code> and <code>dp[1] = 1</code>, then walk forward filling <code>dp[i] = dp[i&minus;1] + dp[i&minus;2]</code>. By the time you reach any slot, the two it needs are already sitting there.</p>
            <p>And notice: the bottom-up form only ever looks at the last two values, so you don&rsquo;t even need the whole array &mdash; two variables are enough.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle &mdash; information reuse:</strong> the same sub-question never gets solved twice. The whole speed-up comes from one move &mdash; <em>write it down so you can look it up.</em>
            </div>
          </>
        ),
        intuitive: (
          <>
            <p><strong>Build one &mdash; remember as you go.</strong> Keep the rule from before exactly as it is, and give it a notebook. Before working anything out, peek: is &ldquo;ways up k?&rdquo; already written down? Hand it back. Not there? Work it out once, write it in. No question ever gets answered twice.</p>
            <p><strong>Build two &mdash; fill a row.</strong> Forget self-calling. Draw a row of slots where slot <code>i</code> will hold &ldquo;ways up <code>i</code> stairs.&rdquo; The two easiest slots are free: 1 way up 0 stairs (stand still) and 1 way up 1 stair. Now move right, one slot at a time, filling each as the-slot-before plus the-slot-two-before. Whenever you arrive at a slot, the two answers it needs are already sitting there.</p>
            <p>One more squeeze: filling a slot only ever uses the <em>last two</em> answers &mdash; so you don&rsquo;t even need the row. Two little boxes, shuffled forward each step, carry everything.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle &mdash; reuse what you know:</strong> no small question is ever answered twice. The entire speed-up is one move &mdash; <em>write it down so you can look it up.</em>
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Top-down (memoization).</strong> Cache the bare recursion (<code>@lru_cache</code>): on call, return the cached value or compute and store. The first call to each <code>k</code> does one addition; every later call is a lookup.</p>
            <p><strong>Bottom-up (tabulation).</strong> <code>dp[0] = dp[1] = 1</code>; for increasing <code>i</code>, <code>dp[i] = dp[i&minus;1] + dp[i&minus;2]</code>. <strong>Invariant:</strong> when <code>dp[i]</code> is written, <code>dp[i&minus;1]</code> and <code>dp[i&minus;2]</code> are already final &mdash; induction on <code>i</code> gives correctness. The loop runs <code>i = 2&hellip;n</code>: one addition per index. Only two values are ever live, so the table contracts to the rolling pair <code>a, b = b, a + b</code> &mdash; the code&rsquo;s form.</p>
            <p>Same dependency graph either way; tabulation just walks it in dependency order and pays no call overhead.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle &mdash; information reuse:</strong> each subproblem solved once, then read back &mdash; the whole collapse from exponential to linear is that one move.
            </div>
          </>
        ),
      }),
      arrows: [{ x1: 213, y1: 152, x2: 213, y2: G.y - 30 }],
      codeLabels: ["base_check", "base_return", "init_table"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "Both flavours kill the repeats — now let's count exactly how much work that saves.",
        rigorous: "Each subproblem now costs one addition — commit to the total before the row counts it out.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Reuse turns exponential work into one O(n) pass — and just O(1) memory.",
        intuitive: "Remembering sub-answers: one addition per stair instead of a blow-up of repeats.",
        rigorous: "Each subproblem once: O(n) time, O(1) rolling space — versus exponential recursion.",
      }),
      visual: (api) => <TabulateCostGate api={api} />,
      panels: [{
        left: 40, top: 20, width: 580, variant: "main", label: "The operations",
        title: reg({
          base: "From exponential to one quick pass.",
          intuitive: "From doubling every step to one quick pass.",
          rigorous: "Linear time, constant space — counted first.",
        }),
        body: reg({
          base: <>Naive recursion roughly doubles its work per extra step &mdash; ways(40) calls itself about 330 million times. Filling each table slot once is <Term word="O(n)"><strong>O(n)</strong></Term> (work grows in step with the n stairs). Keeping just the last two values is <Term word="O(1)"><strong>O(1)</strong></Term> &mdash; a fixed cost at any height.</>,
          intuitive: <>Run blind, every extra stair roughly <em>doubles</em> the work &mdash; by 40 stairs that&rsquo;s hundreds of millions of repeats. With answers written down, each slot costs one small addition. Make your prediction, then watch the row prove it: that once-per-stair work is called <Term word="O(n)"><code>O(n)</code></Term>, and carrying only the last two answers is <Term word="O(1)"><code>O(1)</code></Term> memory &mdash; the same tiny pocketful at any height.</>,
          rigorous: <>Naive: the call tree doubles per level &mdash; ways(40) is about 330 million calls. Fixed: the loop runs <code>i = 2&hellip;n</code>, one addition each; once the row confirms the count, that&rsquo;s <Term word="O(n)"><code>O(n)</code></Term> time. The rolling pair is <Term word="O(1)"><code>O(1)</code></Term> space; the memo table instead pays <Term word="O(n)"><code>O(n)</code></Term> space plus recursion depth.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p><strong>Naive recursion</strong> roughly <em>doubles</em> its work for every extra step, because each call spawns two more. By the time you ask for <code>ways(40)</code> the function calls itself about 330 million times &mdash; minutes of computing for a question with a one-line answer.</p>
            <p><strong>Either fixed version</strong> &mdash; remember-as-you-go, or fill the table &mdash; computes each <code>i</code> from 0 up to <code>n</code> exactly once, doing a single addition each time. That total cost is <code>O(n)</code> (&ldquo;order n&rdquo;): the work grows in lock-step with how many stairs there are. Watch the row above fill itself, one slot per beat, left to right.</p>
            <p>And memory: the top-down notebook holds <code>n+1</code> answers, but the bottom-up form only needs the last two numbers as it goes. That&rsquo;s <code>O(1)</code> (&ldquo;order one&rdquo;) &mdash; a fixed, tiny amount no matter how tall the staircase gets.</p>
          </>
        ),
        intuitive: (
          <>
            <p>First, feel the blow-up. Run blind, every extra stair roughly doubles the routes the computer re-walks: 8 stairs took 67 calls; 40 stairs would take about 330 million. The questions aren&rsquo;t hard &mdash; they&rsquo;re just asked over and over.</p>
            <p>Now count the fixed version on the row above: slot 2, slot 3, &hellip; slot 8 &mdash; each filled <em>once</em>, with one addition. Nine slots, nine little jobs, done. Work that grows in step with the number of stairs is written <Term word="O(n)"><code>O(n)</code></Term> &mdash; tap the chip; it just means &ldquo;twice the stairs, twice the additions.&rdquo;</p>
            <p>Memory is even better. The notebook version keeps every answer &mdash; one per stair. The row version only ever peeks at the <em>last two</em> slots, so it carries two numbers in its pocket no matter how tall the staircase &mdash; that fixed pocketful is <Term word="O(1)"><code>O(1)</code></Term>.</p>
            <p>Two honest edges: a 0-step staircase counts as 1 way (&ldquo;stay put&rdquo; is a route &mdash; that&rsquo;s what makes the adding rule true), and the code&rsquo;s first check answers 0 and 1 directly, so the loop never runs for them. Those written-in-advance answers are what everything else stands on.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> Naive recursion satisfies T(n) = T(n&minus;1) + T(n&minus;2) + O(1) &mdash; exponential growth (~1.618&#8319;); ways(40) is about 330 million calls. Memoized or tabulated: each of the n&minus;1 loop indices does one addition &mdash; O(n) time. Space: the memo table holds n+1 entries plus n frames of recursion depth; the rolling pair is O(1).</p>
            <p><strong>Edges.</strong> <code>n = 0</code> returns 1 &mdash; the empty climb counts as one way, the convention the recurrence needs; <code>n = 1</code> hits the same base check, and the loop body never runs for either. The memoized form recurses n deep &mdash; Python&rsquo;s ~1000-frame recursion limit bites near n &asymp; 1000; the loop form can&rsquo;t. Counts grow fast (ways(500) has 105 digits): Python&rsquo;s ints stay exact, while fixed-width languages overflow 64 bits past n = 91.</p>
          </>
        ),
      }),
      arrows: [{ x1: 430, y1: 152, x2: 430, y2: G.y - 44 }],
      codeLabels: ["loop", "recurrence", "answer"],
      interaction: "wedge",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "That one-pass speed-up isn't really about stairs — it shows up anywhere the same shape does.",
      actionLabel: "Name the pattern",
      takeaway: "Works wherever a problem reuses overlapping smaller answers — not just stairs.",
      visual: <FamilyGallery />,
      panels: [{
        left: 40, top: 20, width: 580, variant: "main", label: "The generalization",
        title: "Anywhere n depends on smaller n.",
        body: <>The stairs aren&rsquo;t special. Any problem solved by a rule that reuses its own smaller answers gets this speed-up (below). You need two things: the parts must <em>overlap</em> (so there&rsquo;s something to reuse), and each part must have one fixed answer.</>,
      }],
      detail: (
        <>
          <p>The stairs problem isn&rsquo;t special. Whenever a problem has a small rule that answers it in terms of <em>smaller</em> versions of itself, and that rule keeps asking for the same smaller answers over and over, this same trick rescues you.</p>
          <p>Same shape, completely different stories: the <strong>edit distance</strong> between two words (fewest single-letter changes to turn one into the other), the <strong>fewest coins</strong> to make a given amount of change, <strong>knapsack</strong> (which items fit in a bag under a weight limit for the most value), and the <strong>cheapest path</strong> through a grid of costs. None of them look like a staircase, yet each is solved by the exact same write-it-down-and-reuse move.</p>
          <p>Two ingredients are required. First, the answer must break into <em>overlapping</em> parts &mdash; if every sub-question were different, there&rsquo;d be nothing to reuse. Second, each sub-question must have one fixed answer that never changes, so it&rsquo;s safe to write down once and trust forever.</p>
        </>
      ),
      codeLabels: ["recurrence"],
    },
    {
      id: "name",
      label: "The pattern",
      // base mentions general's "two ingredients" — every register that can
      // miss `general` (structured cut; intuitive on refresh) gets a
      // self-contained variant.
      connector: reg({
        base: "Two ingredients, one repeatable move — it's time to give the whole thing its name.",
        intuitive: "You've made the waste visible and counted the win — time to give the move its name.",
        structured: "One rule, one table, one pass — time to give the move its name.",
        rigorous: "Name it, and file it under the idea it embodies.",
      }),
      takeaway: reg({
        base: "It's Dynamic Programming — reach for it on count / min-cost / max-value problems that repeat.",
        intuitive: "Dynamic Programming: solve each sub-question once, write it down, look it up.",
        rigorous: "DP = overlapping subproblems cached — exponential recursion collapses to O(n).",
      }),
      visual: <g>{dpRow(8, DP.map((): Tone => "good"), { 8: "✓" })}<Caption y={G.y - 28} tone="var(--diff-easy)" text="the whole table, computed in one pass · dp[8] = 34" /></g>,
      panels: [
        {
          left: 40, top: 20, width: 420, variant: "main", label: "The pattern",
          title: "Dynamic Programming.",
          body: reg({
            base: <>That&rsquo;s the name &mdash; misleading, since nothing is &ldquo;dynamic.&rdquo; It just means: solve overlapping sub-questions once, write them down, look them up.</>,
            intuitive: <>That&rsquo;s the name &mdash; an odd one, since nothing here is &ldquo;dynamic.&rdquo; The move is exactly what you did: solve each small question once, write it down, look it up ever after.</>,
            rigorous: <>The name (Bellman&rsquo;s, deliberately vague) covers exactly this: overlapping subproblems, each with one fixed answer, solved once &mdash; memoized or tabulated.</>,
          }),
        },
        {
          left: 500, top: 20, width: 320, variant: "note",
          body: reg({
            base: <>Spot it on <strong>number of ways / minimum cost / maximum value</strong> problems where naive recursion explodes from repeated calls, and a greedy grab-the-best step gives the wrong answer.</>,
            rigorous: <>Triggers: count-the-ways / min-cost / max-value with a recurrence on smaller indices; naive recursion repeats subproblems; greedy refuted because later choices depend on earlier ones.</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: <strong>Dynamic Programming</strong>. The dramatic phrase is misleading &mdash; nothing about it is &ldquo;dynamic&rdquo; in any everyday sense. It simply means: <em>solve overlapping sub-questions once, write the answers down, and look them up.</em></p>
            <p>Reach for it when you spot these signals:</p>
            <ul>
              <li>a &ldquo;number of ways&rdquo; / &ldquo;minimum cost&rdquo; / &ldquo;maximum value&rdquo; question with a small recursive rule</li>
              <li>the naive recursion blows up because the same call repeats again and again</li>
              <li>you can describe the answer at <em>n</em> using answers at strictly smaller <em>n</em>&rsquo;s</li>
              <li>grabbing the best-looking step right now (a <em>greedy</em> choice) gives the wrong answer, because later choices depend on earlier ones</li>
            </ul>
            <p>Open the code drawer for the Python: the loop form is what real production code looks like, and the remember-as-you-go recursion sits in the comment for readers who think recursively.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The move has a proper name: <strong>Dynamic Programming</strong> &mdash; DP for short. The name is honestly a bit silly (nothing about it is &ldquo;dynamic&rdquo;); it was picked decades ago partly because it sounded impressive. What it means is just what you built: solve each overlapping sub-question once, write the answer down, look it up ever after.</p>
            <p>How to spot a DP problem in the wild:</p>
            <ul>
              <li>it asks &ldquo;how many ways,&rdquo; &ldquo;cheapest way,&rdquo; or &ldquo;most valuable way&rdquo;</li>
              <li>there&rsquo;s a small rule answering the big case from smaller cases &mdash; like ways(n) = ways(n&minus;1) + ways(n&minus;2)</li>
              <li>doing it the plain way repeats the same small questions until it chokes</li>
              <li>grabbing the best-looking option each step (a <Term word="greedy">greedy</Term> move) picks wrong, because early choices change what&rsquo;s possible later</li>
            </ul>
            <p>Open the code drawer: the loop is the real-world form, and the remember-as-you-go version waits in the comment for when you think recursively.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first big idea (1 of 7) &mdash; reuse what you already know:</strong> you just watched it collapse a mountain of repeats into one quick pass &mdash; never figure out the same thing twice.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Dynamic programming:</strong> overlapping subproblems + one fixed answer per subproblem (which is what makes caching sound). Solve each once &mdash; memoize the recursion, or tabulate in dependency order; reconstruct from the table when the problem wants the route, not just the count.</p>
            <p>Triggers: a recurrence on strictly smaller indices; exponential naive recursion from repeats; greedy refuted by a counterexample. Edges to test: the <code>n = 0</code> / <code>n = 1</code> bases, the loop bounds (<code>range(2, n + 1)</code> is inclusive of <code>n</code>), and recursion depth if you memoize.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7 &mdash; information reuse:</strong> cache every subproblem&rsquo;s answer; the exponential tree collapses to one linear pass.
            </div>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(8), y1: 230, x2: G.cx(8), y2: G.y - 4 }],
      codeLabels: ["answer"],
    },
  ],
};
