"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, NodeGraph, GNode, GEdge, Bracket } from "@/shared/lesson/canvas";
import dp_1dPy from "./algorithm.py";

const VW = 860, VH = 470;

/* dp[0..8] for the "ways to climb i stairs" table — 1,1,2,3,5,8,13,21,34. */
const DP = (() => {
  const a = [1, 1];
  for (let i = 2; i <= 8; i++) a[i] = a[i - 1] + a[i - 2];
  return a;
})();
/* Row geometry for the 9-cell dp table, centered, sitting in the middle band. */
const G = rowGeom(DP.length, VW, 250, 44, 8, 44);

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
  const tw = 64, th = 18, gap = 9;          // tread width / height / vertical gap
  const baseY = 392, x0 = 250;
  const rows = Array.from({ length: steps }, (_, i) => {
    const tread = i + 1;                     // step 1 (bottom) … step 8 (top)
    const x = x0 + i * 14;
    const y = baseY - i * (th + gap);
    return (
      <g key={i}>
        <rect x={x} y={y} width={tw} height={th} rx={4}
          fill={tread === steps ? "color-mix(in oklab, var(--accent-sky) 22%, var(--bg-card))" : "var(--bg-card)"}
          stroke={tread === steps ? "var(--accent-line)" : "var(--line)"} strokeWidth={1.5} />
        <text x={x + tw / 2} y={y + th / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>step {tread}</text>
      </g>
    );
  });
  return (
    <g>
      <Caption y={196} text="8 steps · hop 1 or 2 at a time" />
      {rows}
      {showCounts && (
        <g>
          <text x={560} y={300} className="font-mono select-none" style={{ fontSize: 13, fill: "var(--diff-easy)" }}>real answer = 34 routes</text>
          <text x={560} y={326} className="font-mono select-none" style={{ fontSize: 13, fill: "var(--diff-hard)" }}>naive recursion = 67 calls</text>
          <text x={560} y={350} className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>most re-compute the same</text>
          <text x={560} y={364} className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>sub-answer over and over</text>
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
  { id: "6", k: 6, x: 430, y: 200 },
  { id: "5a", k: 5, x: 300, y: 252, parent: "6" },
  { id: "4a", k: 4, x: 560, y: 252, parent: "6" },
  { id: "4b", k: 4, x: 200, y: 308, parent: "5a" },
  { id: "3a", k: 3, x: 380, y: 308, parent: "5a" },
  { id: "3b", k: 3, x: 520, y: 308, parent: "4a" },
  { id: "2a", k: 2, x: 640, y: 308, parent: "4a" },
  { id: "3c", k: 3, x: 130, y: 364, parent: "4b" },
  { id: "2b", k: 2, x: 250, y: 364, parent: "4b" },
  { id: "2c", k: 2, x: 350, y: 364, parent: "3a" },
  { id: "1a", k: 1, x: 430, y: 364, parent: "3a" },
  { id: "2d", k: 2, x: 500, y: 364, parent: "3b" },
  { id: "1b", k: 1, x: 580, y: 364, parent: "3b" },
  { id: "2e", k: 2, x: 100, y: 420, parent: "3c" },
  { id: "1c", k: 1, x: 175, y: 420, parent: "3c" },
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
    }, 900);
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
  const cw = 178, ch = 56, gap = 16, cols = 2;
  const totalW = cols * cw + (cols - 1) * gap;
  const x0 = (VW - totalW) / 2, y0 = 250;
  return (
    <g>
      <Caption y={232} text="one skeleton — solve small parts once, reuse them — many stories" />
      {cards.map((c, i) => {
        const r = Math.floor(i / cols), col = i % cols;
        const x = x0 + col * (cw + gap), y = y0 + r * (ch + gap);
        return (
          <g key={c[0]}>
            <rect x={x} y={y} width={cw} height={ch} rx={8} fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1.5} />
            <text x={x + cw / 2} y={y + 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>{c[0]}</text>
            <text x={x + cw / 2} y={y + 40} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>{c[1]}</text>
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
      visual: <Staircase />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The setup",
        title: "How many ways to climb the stairs?",
        body: <>You&rsquo;re at the bottom of an <strong>8-step</strong> staircase. Each move you hop up 1 step or 2 steps. How many different routes reach the top? 1 step: 1 way. 2 steps: 2 ways. 3 steps: 3 ways. For 8, too many to count by hand.</>,
      }],
      arrows: [{ x1: 300, y1: 150, x2: 290, y2: 213 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      visual: <Staircase showCounts />,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The obvious thing",
        title: "A rule that re-does the same work over and over.",
        body: <>On step n, only your last move matters: you came from n&minus;1 or n&minus;2. So ways(n) = ways(n&minus;1) + ways(n&minus;2). (<strong>Recursion</strong> = a rule that calls itself on a smaller case.) But finding ways(8) keeps re-asking the same smaller questions.</>,
      }],
      arrows: [{ x1: 590, y1: 150, x2: 560, y2: 316 }],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      visual: (api) => <ToggleMemo api={api} />,
      panels: [
        {
          left: 40, top: 20, width: 560, variant: "main", label: "The wedge",
          title: "Solve each question once. Look it up after.",
          body: <>This branching picture of who-calls-whom is a <strong>tree</strong>; each circle is one call ways(k). Notice how the same numbers repeat. Toggle <strong>remember answers</strong>: the second time a call comes back, hand over the answer we wrote down. The green calls vanish.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> every sub-question has exactly one true answer. Computing it twice is pure waste &mdash; so write it down once.</>,
        },
      ],
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: <g>{dpRow(1, DP.map((_, i) => (i <= 1 ? "good" : undefined)), { 0: "dp0", 1: "dp1" })}<Bracket x1={G.left(0)} x2={G.left(1) + G.cellW} y={G.y - 16} label="the two base values" color="var(--diff-easy)" /></g>,
      panels: [{
        left: 40, top: 20, width: 560, variant: "main", label: "The derivation",
        title: "Two flavours, same answer.",
        body: <>Top-down: keep the rule, add a notebook &mdash; check if it&rsquo;s written down before working, store it after. Bottom-up: drop recursion, fill a table from the smallest case up. dp[0]=1, dp[1]=1, then dp[i]=dp[i&minus;1]+dp[i&minus;2]. (dp[i] = ways to reach step i; [i] picks one slot.)</>,
      }],
      arrows: [{ x1: G.cx(0), y1: 150, x2: G.cx(0), y2: G.y - 18 }],
      codeLabels: ["init_table"],
    },
    {
      id: "operations",
      visual: (api) => <AutoTabulate api={api} />,
      panels: [{
        left: 40, top: 20, width: 580, variant: "main", label: "The operations",
        title: "From exponential to one quick pass.",
        body: <>Naive recursion roughly doubles its work per extra step &mdash; ways(40) calls itself a billion times. The table fills each slot once, one addition each: that&rsquo;s <strong>O(n)</strong> (work grows in step with the stairs n). Keeping only the last two values is <strong>O(1)</strong> &mdash; a fixed amount however tall the staircase.</>,
      }],
      arrows: [{ x1: 430, y1: 150, x2: 430, y2: G.y - 18 }],
      codeLabels: ["loop", "recurrence", "answer"],
      interaction: "playback",
    },
    {
      id: "general",
      visual: <FamilyGallery />,
      panels: [{
        left: 40, top: 20, width: 580, variant: "main", label: "The generalization",
        title: "Anywhere n depends on smaller n.",
        body: <>The stairs aren&rsquo;t special. Any problem with a small self-referential rule whose pieces keep overlapping gets the same speed-up (below). You need two things: the parts must <em>overlap</em> (so there&rsquo;s something to reuse), and each part must have one fixed answer (so you can write it down).</>,
      }],
      codeLabels: ["recurrence"],
    },
    {
      id: "name",
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
      arrows: [{ x1: G.cx(8), y1: 150, x2: G.cx(8), y2: G.y - 6 }],
      codeLabels: ["answer"],
    },
  ],
};
