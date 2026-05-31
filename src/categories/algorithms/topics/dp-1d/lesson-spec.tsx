"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, NodeGraph, GNode, GEdge, Bracket } from "@/shared/lesson/canvas";
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

export const dp1dLesson: LessonSpec = {
  topicTitle: "dynamic programming · ways to climb 8 stairs",
  canvas: { width: VW, height: VH },
  codeSource: dp_1dPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "The natural rule",
      visual: <Staircase />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The setup",
        title: "How many ways to climb the stairs?",
        body: <>You&rsquo;re at the bottom of an <strong>8-step</strong> staircase. Each move you hop up 1 step or 2 steps. How many different routes reach the top? 1 step: 1 way. 2 steps: 2 ways. 3 steps: 3 ways. For 8, too many to count by hand.</>,
      }],
      detail: (
        <>
          <p>Picture standing at the bottom of a staircase with <strong>8 steps</strong>. Every move, you may hop up either <strong>1 step</strong> or <strong>2 steps</strong> &mdash; your choice each time. The question is simple to ask: how many <em>different</em> routes get you all the way to the top?</p>
          <p>For a 1-step staircase there&rsquo;s just one way (a single little hop). For 2 steps there are two ways (1 then 1, or one big 2). For 3 steps there are three ways (1+1+1, 1+2, or 2+1). The counts grow fast.</p>
          <p>By the time you reach 8 steps, there are far more routes than you&rsquo;d want to list out by hand. We need a method, not patience.</p>
        </>
      ),
      arrows: [{ x1: 540, y1: 158, x2: 524, y2: 210 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "We have the question; now reach for the most natural way to answer it.",
      actionLabel: "Stop the repeats",
      visual: <Staircase showCounts />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The obvious thing",
        title: "A rule that re-does the same work over and over.",
        body: <>On step n, only your last move matters: you came from n&minus;1 or n&minus;2. So ways(n) = ways(n&minus;1) + ways(n&minus;2). (<strong>Recursion</strong> = a rule that calls itself on a smaller case.) But finding ways(8) keeps re-asking the same smaller questions.</>,
      }],
      detail: (
        <>
          <p>Stand on step <code>n</code>. The only thing that decides how you arrived is your <em>last</em> move: either you took 1 step (so a moment ago you were on step <code>n&minus;1</code>), or you took 2 steps (so you were on step <code>n&minus;2</code>). Every route into step <code>n</code> passes through one of those two places.</p>
          <p>So the number of ways to reach step <code>n</code> is just the ways to reach <code>n&minus;1</code> plus the ways to reach <code>n&minus;2</code>: <code>ways(n) = ways(n&minus;1) + ways(n&minus;2)</code>. That tiny rule is a <strong>recursion</strong> &mdash; a rule that answers a question by calling itself on smaller versions of the same question.</p>
          <p>Here&rsquo;s the trap. To get <code>ways(8)</code> we ask for <code>ways(7)</code> and <code>ways(6)</code>. But <code>ways(7)</code> <em>also</em> needs <code>ways(6)</code> &mdash; so we compute <code>ways(6)</code> twice. Further down it&rsquo;s far worse: small cases like <code>ways(2)</code> get re-computed dozens of times. The work isn&rsquo;t hard. It&rsquo;s repeated.</p>
        </>
      ),
      arrows: [{ x1: 620, y1: 152, x2: 600, y2: 236 }],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "If the same small questions keep coming back, what if we just refused to answer any of them twice?",
      actionLabel: "Make it a rule",
      visual: (api) => <ToggleMemo api={api} />,
      panels: [
        {
          left: 40, top: 20, width: 560, variant: "main", label: "The instinct",
          title: "Solve each question once. Look it up after.",
          body: <>This branching picture of who-calls-whom is a <strong>tree</strong>; each circle is one call ways(k). Notice how the same numbers repeat. Toggle <strong>remember answers</strong>: the second time a call comes back, hand over the answer we wrote down. The green calls vanish.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> every sub-question has exactly one true answer. Computing it twice is pure waste &mdash; so write it down once.</>,
        },
      ],
      detail: (
        <>
          <p>The picture on the right is a <strong>tree</strong> of calls &mdash; a branching diagram of who-asks-whom. Each circle is one call <code>ways(k)</code>; the lines drop to the two smaller calls it sets off. Look closely and you&rsquo;ll see the same numbers showing up again and again in different branches: that repetition <em>is</em> the wasted work.</p>
          <p>Now toggle <strong>remember answers</strong>. The first time we compute some <code>ways(k)</code>, we jot the result down. The next time that exact call appears, we don&rsquo;t redo it &mdash; we just hand back the number we already wrote. On the diagram, those repeat calls light up green and effectively disappear, and the tree collapses to a fraction of its size.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct:</strong> every sub-question has exactly one true answer. Computing it twice is pure waste &mdash; so write it down the first time, and reuse it forever after.
          </div>
        </>
      ),
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "That “write it down, look it up” idea can be built two different ways — here are both.",
      actionLabel: "Count the work",
      visual: <g>{dpRow(1, DP.map((_, i) => (i <= 1 ? "good" : undefined)), { 0: "dp0", 1: "dp1" })}<Bracket x1={G.left(0)} x2={G.left(1) + G.cellW} y={G.y - 14} label="the two base values" color="var(--diff-easy)" /></g>,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The derivation",
        title: "Two flavours, same answer.",
        body: <>Top-down: keep the rule, add a notebook &mdash; check if it&rsquo;s written down before working, store it after. Bottom-up: drop recursion, fill a table from the smallest case up. dp[0]=1, dp[1]=1, then dp[i]=dp[i&minus;1]+dp[i&minus;2]. (dp[i] = ways to reach step i; [i] picks one slot.)</>,
      }],
      detail: (
        <>
          <p><strong>Top-down (remember as you go).</strong> Keep the recursive rule exactly as it is, but give it a notebook &mdash; a lookup table that maps each <code>k</code> to its answer. Before doing any work for <code>ways(k)</code>, peek in the notebook; if the answer&rsquo;s already there, hand it straight back. Otherwise compute it once and write it down. No sub-question is ever solved twice.</p>
          <p><strong>Bottom-up (fill a table).</strong> Drop recursion completely and build the answers from the smallest case upward in an array called <code>dp</code> (here <code>dp[i]</code> just means &ldquo;ways to reach step <code>i</code>&rdquo;, and the <code>[i]</code> picks out one slot of the array). Start with the two base values <code>dp[0] = 1</code> and <code>dp[1] = 1</code>, then walk forward filling <code>dp[i] = dp[i&minus;1] + dp[i&minus;2]</code>. By the time you reach any slot, the two it needs are already sitting there.</p>
          <p>And notice: the bottom-up form only ever looks at the last two values, so you don&rsquo;t even need the whole array &mdash; two variables are enough.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle &mdash; information reuse:</strong> the same sub-question never gets solved twice. The whole speed-up comes from one move &mdash; <em>write it down so you can look it up.</em>
          </div>
        </>
      ),
      arrows: [{ x1: 213, y1: 152, x2: 213, y2: G.y - 30 }],
      codeLabels: ["init_table"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: "Both flavours kill the repeats — now let's count exactly how much work that saves.",
      actionLabel: "Same shape, new problems",
      visual: (api) => <AutoTabulate api={api} />,
      panels: [{
        left: 40, top: 20, width: 580, variant: "main", label: "The operations",
        title: "From exponential to one quick pass.",
        body: <>Naive recursion roughly doubles its work per extra step &mdash; ways(40) calls itself a billion times. Filling each table slot once is <strong>O(n)</strong> (work grows in step with the n stairs). Keeping just the last two values is <strong>O(1)</strong> &mdash; a fixed cost at any height.</>,
      }],
      detail: (
        <>
          <p><strong>Naive recursion</strong> roughly <em>doubles</em> its work for every extra step, because each call spawns two more. By the time you ask for <code>ways(40)</code> the function calls itself about a billion times &mdash; minutes of computing for a question with a one-line answer.</p>
          <p><strong>Either fixed version</strong> &mdash; remember-as-you-go, or fill the table &mdash; computes each <code>i</code> from 0 up to <code>n</code> exactly once, doing a single addition each time. That total cost is <code>O(n)</code> (&ldquo;order n&rdquo;): the work grows in lock-step with how many stairs there are. Watch the row above fill itself, one slot per beat, left to right.</p>
          <p>And memory: the top-down notebook holds <code>n+1</code> answers, but the bottom-up form only needs the last two numbers as it goes. That&rsquo;s <code>O(1)</code> (&ldquo;order one&rdquo;) &mdash; a fixed, tiny amount no matter how tall the staircase gets.</p>
        </>
      ),
      arrows: [{ x1: 430, y1: 152, x2: 430, y2: G.y - 44 }],
      codeLabels: ["loop", "recurrence", "answer"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "The generalization",
      connector: "That one-pass speed-up isn't really about stairs — it shows up anywhere the same shape does.",
      actionLabel: "Name the pattern",
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
      connector: "Two ingredients, one repeatable move — it's time to give the whole thing its name.",
      visual: <g>{dpRow(8, DP.map((_, i) => (i === 8 ? "good" : "good")), { 8: "✓" })}<Caption y={G.y - 28} tone="var(--diff-easy)" text="the whole table, computed in one pass · dp[8] = 34" /></g>,
      panels: [
        {
          left: 40, top: 20, width: 420, variant: "main", label: "The pattern",
          title: "Dynamic Programming.",
          body: <>That&rsquo;s the name &mdash; misleading, since nothing is &ldquo;dynamic.&rdquo; It just means: solve overlapping sub-questions once, write them down, look them up.</>,
        },
        {
          left: 500, top: 20, width: 320, variant: "note",
          body: <>Spot it on <strong>number of ways / minimum cost / maximum value</strong> problems where naive recursion explodes from repeated calls, and a greedy grab-the-best step gives the wrong answer.</>,
        },
      ],
      detail: (
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
      arrows: [{ x1: G.cx(8), y1: 230, x2: G.cx(8), y2: G.y - 4 }],
      codeLabels: ["answer"],
    },
  ],
};
