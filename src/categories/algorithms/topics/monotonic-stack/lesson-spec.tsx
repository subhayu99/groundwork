"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, StackBoxes, StackBox, Pill, Bracket } from "@/shared/lesson/canvas";
import monotonic_stackPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* ── the eight days of weather (the running example) ──────────────────────── */
const TEMPS = [73, 74, 75, 71, 69, 72, 76, 73];
const ANSWER = [1, 1, 4, 2, 1, 1, 0, 0];
const N = TEMPS.length;

/* bars row geometry (temperature bars, height ∝ temp).
   Bars are LEFT-aligned so the right column is free for the waiting stack. */
const BAR_W = 44, BAR_GAP = 14, BAR_BASE = 318; // baseline y the bars sit on
const BARS_TOTAL = N * BAR_W + (N - 1) * BAR_GAP; // = 450
const BARS_X0 = 64;
const barLeft = (i: number) => BARS_X0 + i * (BAR_W + BAR_GAP);
const barCx = (i: number) => barLeft(i) + BAR_W / 2;
const BARS_CX = BARS_X0 + BARS_TOTAL / 2; // center of the bars block (for captions)
const TMIN = 65, TMAX = 78; // mapping range for bar height
const barH = (t: number) => 26 + ((t - TMIN) / (TMAX - TMIN)) * 78; // 26..104 px tall
const barTop = (t: number) => BAR_BASE - barH(t);

/* answer row sits just under the baseline, aligned to the bars */
const ANS_Y = BAR_BASE + 16;
const ansGeom = { ...rowGeom(N, VW, ANS_Y, BAR_W, BAR_GAP, 28), x0: BARS_X0,
  cx: (i: number) => barCx(i), left: (i: number) => barLeft(i) };

/* tone fills for bars (mirror CellRow's tone styling by hand) */
const toneFill: Record<string, { bg: string; border: string }> = {
  idle: { bg: "var(--bg-card)", border: "var(--line)" },
  active: { bg: "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))", border: "var(--accent-line)" },
  waiting: { bg: "color-mix(in oklab, var(--accent-sky) 14%, var(--bg-card))", border: "color-mix(in oklab, var(--accent-line) 55%, var(--line))" },
  compare: { bg: "color-mix(in oklab, var(--diff-med) 20%, var(--bg-card))", border: "var(--diff-med)" },
  answered: { bg: "color-mix(in oklab, var(--diff-easy) 20%, var(--bg-card))", border: "var(--diff-easy)" },
  gone: { bg: "var(--bg-card)", border: "var(--line)" },
};

/* a single labelled temperature bar */
function Bar({ i, tone = "idle", dim = false }: { i: number; tone?: string; dim?: boolean }) {
  const t = TEMPS[i];
  const f = toneFill[tone] ?? toneFill.idle;
  return (
    <g style={{ opacity: dim ? 0.3 : 1, transition: "opacity .3s" }}>
      <rect x={barLeft(i)} y={barTop(t)} width={BAR_W} height={barH(t)} rx={6}
        style={{ fill: f.bg, stroke: f.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
      <text x={barCx(i)} y={barTop(t) - 8} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text)" }}>{t}&deg;</text>
      <text x={barCx(i)} y={BAR_BASE + 12} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 10, fill: "var(--text-faint)" }}>{i}</text>
    </g>
  );
}

/* the bars row, with per-index tone + dim arrays */
function BarsRow({ tones, dim }: { tones?: (string | undefined)[]; dim?: boolean[] }) {
  return (
    <g>
      <line x1={BARS_X0 - 10} y1={BAR_BASE} x2={BARS_X0 + BARS_TOTAL + 10} y2={BAR_BASE}
        stroke="var(--line)" strokeWidth={1.5} />
      {TEMPS.map((_, i) => <Bar key={i} i={i} tone={tones?.[i]} dim={dim?.[i]} />)}
    </g>
  );
}

/* the answer row of cells; value -> tone */
function AnswerRow({ vals, tones }: { vals: (string | number)[]; tones?: (Tone | undefined)[] }) {
  return (
    <g>
      <text x={BARS_X0 - 16} y={ANS_Y + 15} textAnchor="end" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>answer</text>
      <CellRow geom={ansGeom} values={vals} tones={tones} fontSize={13} />
    </g>
  );
}

/* the waiting stack panel, drawn in the right column, top-on-top */
const STK_CX = 660, STK_TOP = 198, STK_W = 158, STK_BOXH = 26, STK_GAP = 6;
function WaitingStack({ idxs, label = "waiting line (newest on top)" }: { idxs: number[]; label?: string }) {
  const items: StackBox[] = idxs.map((j, k) => ({
    key: j,
    label: `day ${j}`,
    sub: `${TEMPS[j]}°`,
    tone: k === idxs.length - 1 ? "active" : "accent",
  }));
  return (
    <g>
      <text x={STK_CX} y={STK_TOP - 14} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{label}</text>
      {idxs.length === 0 ? (
        <text x={STK_CX} y={STK_TOP + 14} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 11, fill: "var(--text-faint)" }}>(line is empty)</text>
      ) : (
        <StackBoxes items={items} cx={STK_CX} top={STK_TOP} width={STK_W} boxH={STK_BOXH} gap={STK_GAP} />
      )}
    </g>
  );
}

/* ── INTERACTIVE WEDGE: user clicks "send day i", stack grows/drains ──────── */
type WalkState = {
  i: number;            // next arriving day (outer index)
  stack: number[];      // indices still waiting
  answer: (number | null)[];
  note: string;
  done: boolean;
};
function walkInit(): WalkState {
  return { i: 0, stack: [], answer: Array(N).fill(null), note: "press “send day 0” to start the walk", done: false };
}

function ManualWalk({ api }: { api: BeatVisualApi }) {
  const [s, setS] = useState<WalkState>(walkInit);

  const send = () => {
    api.onInteractionDone();
    setS((c) => {
      if (c.done) return c;
      const i = c.i;
      const t = TEMPS[i];
      const stack = [...c.stack];
      const answer = [...c.answer];
      let note = "";
      // pop everyone today is warmer than
      let popped = 0;
      while (stack.length && TEMPS[stack[stack.length - 1]] < t) {
        const j = stack.pop()!;
        answer[j] = i - j;
        popped++;
      }
      stack.push(i);
      if (popped > 0) { api.onActiveLine(["while_pop", "record", "push"]); note = `day ${i} (${t}°) is warmer — sent ${popped} home, then joined the line`; }
      else { api.onActiveLine(["push"]); note = `day ${i} (${t}°) beats no one — joins the back and waits`; }
      const ni = i + 1;
      const done = ni >= N;
      if (done) note += " · walk complete";
      return { i: ni, stack, answer, note, done };
    });
  };

  const reset = () => { setS(walkInit()); api.onActiveLine(["loop"]); };

  // tones: arriving-day active, on-stack waiting, already-answered answered
  const tones: (string | undefined)[] = TEMPS.map((_, idx) => {
    if (!s.done && idx === s.i) return "active";
    if (s.stack.includes(idx)) return "waiting";
    if (s.answer[idx] !== null) return "answered";
    if (idx < s.i) return "waiting"; // still on stack but not last
    return undefined;
  });
  const ansVals = s.answer.map((a) => (a === null ? "·" : a));
  const ansTones: (Tone | undefined)[] = s.answer.map((a) => (a === null ? undefined : "good"));

  return (
    <g>
      <BarsRow tones={tones} />
      <AnswerRow vals={ansVals} tones={ansTones} />
      <WaitingStack idxs={s.stack} />
      <text x={BARS_CX} y={ANS_Y + 56} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--text-faint)" }}>{s.note}</text>
      {!s.done ? (
        <Btn x={BARS_CX - 60} y={ANS_Y + 70} label={`send day ${s.i}`} onClick={send} />
      ) : (
        <text x={BARS_CX - 60} y={ANS_Y + 83} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 11, fill: "var(--diff-easy)" }}>done ✓</text>
      )}
      <Btn x={BARS_CX + 60} y={ANS_Y + 70} label="↺ reset" onClick={reset} />
    </g>
  );
}

/* a clickable SVG button */
function Btn({ x, y, label, onClick }: { x: number; y: number; label: string; onClick: () => void }) {
  const w = Math.max(70, label.length * 7.5 + 18);
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={x - w / 2} y={y} width={w} height={26} rx={7} fill="var(--bg-card)" stroke="var(--accent-line)" strokeWidth={1.5} />
      <text x={x} y={y + 13} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none"
        style={{ fontSize: 12, fill: "var(--accent-ink)" }}>{label}</text>
    </g>
  );
}

/* ── PLAYBACK: one full auto pass; code line follows each frame ───────────── */
type Frame = {
  i: number;
  stack: number[];
  answer: (number | null)[];
  ops: number;        // total pushes + pops so far
  phase: "pop" | "push" | "done";
  note: string;
};
function AutoWalk({ api }: { api: BeatVisualApi }) {
  const init = (): Frame => ({ i: 0, stack: [], answer: Array(N).fill(null), ops: 0, phase: "push", note: "watch one left-to-right pass" });
  const [f, setF] = useState<Frame>(init);
  const ref = useRef(f); ref.current = f;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.phase === "done") return;
      if (c.i >= N) { api.onActiveLine(["done"]); setF({ ...c, phase: "done", note: "pass complete · leftovers stay 0" }); return; }
      const t = TEMPS[c.i];
      // a pop step?
      if (c.phase === "pop" || (c.stack.length && TEMPS[c.stack[c.stack.length - 1]] < t)) {
        if (c.stack.length && TEMPS[c.stack[c.stack.length - 1]] < t) {
          api.onActiveLine(["while_pop", "pop", "record"]);
          const stack = [...c.stack];
          const j = stack.pop()!;
          const answer = [...c.answer]; answer[j] = c.i - j;
          setF({ ...c, stack, answer, ops: c.ops + 1, phase: "pop", note: `day ${c.i} warmer than day ${j} → answer[${j}] = ${c.i - j}` });
          return;
        }
        // no more to pop -> fall through to push
      }
      api.onActiveLine(["push"]);
      const stack = [...c.stack, c.i];
      setF({ ...c, stack, ops: c.ops + 1, i: c.i + 1, phase: "push", note: `day ${c.i} (${t}°) joins the line` });
    }, pace(850));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tones: (string | undefined)[] = TEMPS.map((_, idx) => {
    if (f.phase !== "done" && idx === f.i) return "active";
    if (f.stack.includes(idx)) return "waiting";
    if (f.answer[idx] !== null) return "answered";
    return undefined;
  });
  const ansVals = f.answer.map((a) => (a === null ? "·" : a));
  const ansTones: (Tone | undefined)[] = f.answer.map((a) => (a === null ? undefined : "good"));
  const CAP = 2 * N;

  return (
    <g>
      <BarsRow tones={tones} />
      <AnswerRow vals={ansVals} tones={ansTones} />
      <WaitingStack idxs={f.stack} />
      <text x={BARS_CX} y={ANS_Y + 56} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--text-faint)" }}>{f.note}</text>
      <text x={BARS_CX} y={ANS_Y + 74} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: f.ops >= CAP ? "var(--diff-med)" : "var(--accent-ink)" }}>
        pushes + pops: {f.ops} / cap {CAP}
      </text>
      <g onClick={() => setF(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setF(init()); } }}>
        <rect x={BARS_CX - 30} y={ANS_Y + 84} width={60} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={BARS_CX} y={ANS_Y + 95} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none"
          style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── PLAYBACK 2 (naive scan) for beat 2: stand on a day, look right ───────── */
function NaiveScan({ api }: { api: BeatVisualApi }) {
  type NS = { base: number; probe: number; comps: number; done: boolean };
  const init = (): NS => ({ base: 0, probe: 1, comps: 0, done: false });
  const [s, setS] = useState<NS>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      api.onActiveLine(["sig"]);
      // advance probe until warmer, then move base
      if (c.probe >= N) { // base never found warmer
        const nb = c.base + 1;
        if (nb >= N) { setS({ ...c, done: true }); return; }
        setS({ ...c, base: nb, probe: nb + 1, comps: c.comps + 1 });
        return;
      }
      if (TEMPS[c.probe] > TEMPS[c.base]) { // found warmer -> move base
        const nb = c.base + 1;
        if (nb >= N) { setS({ ...c, comps: c.comps + 1, done: true }); return; }
        setS({ ...c, base: nb, probe: nb + 1, comps: c.comps + 1 });
        return;
      }
      setS({ ...c, probe: c.probe + 1, comps: c.comps + 1 });
    }, pace(600));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tones: (string | undefined)[] = TEMPS.map((_, i) => {
    if (i === s.base) return "active";
    if (i === s.probe && !s.done) return "compare";
    if (i < s.base) return "answered";
    return undefined;
  });
  return (
    <g>
      <BarsRow tones={tones} />
      <text x={BARS_CX} y={ANS_Y + 16} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: s.done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {s.done ? "every day re-scanned forward — lots of repeat reading" : `standing on day ${s.base}, looking right at day ${Math.min(s.probe, N - 1)}`}
      </text>
      <text x={BARS_CX} y={ANS_Y + 36} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--accent-ink)" }}>comparisons so far: {s.comps}</text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={BARS_CX - 30} y={ANS_Y + 48} width={60} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={BARS_CX} y={ANS_Y + 59} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none"
          style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── STATIC: generalization stories ───────────────────────────────────────── */
function StoryFamily() {
  // ghosted bars + mini story rows
  const stories = [
    "next warmer day  (temperatures)",
    "largest rectangle under a row of bars",
    "how long a stock kept rising",
    "next paint color that is lighter",
  ];
  return (
    <g>
      <BarsRow tones={TEMPS.map(() => "gone")} dim={TEMPS.map(() => true)} />
      <g>
        {stories.map((txt, k) => (
          <g key={k}>
            <circle cx={250} cy={ANS_Y + 6 + k * 22} r={3} fill="var(--accent-line)" />
            <text x={264} y={ANS_Y + 6 + k * 22} dominantBaseline="central" className="font-mono select-none"
              style={{ fontSize: 12, fill: "var(--text)" }}>{txt}</text>
          </g>
        ))}
      </g>
      <text x={250} y={ANS_Y + 6 + stories.length * 22 + 8} dominantBaseline="central" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>one walk + a stack of waiters answers all of them</text>
    </g>
  );
}

/* ── STATIC: final resolved state for the name beat ───────────────────────── */
function FinalState() {
  // days 6 and 7 stayed on the stack (never warmed) -> answer 0
  const leftover = [6, 7];
  const tones: (string | undefined)[] = TEMPS.map((_, i) => (leftover.includes(i) ? "active" : "answered"));
  const ansTones: (Tone | undefined)[] = ANSWER.map((a) => (a === 0 ? "muted" : "good"));
  return (
    <g>
      <BarsRow tones={tones} />
      <AnswerRow vals={ANSWER} tones={ansTones} />
      <WaitingStack idxs={leftover} label="never warmed → answer 0" />
      <Bracket x1={barLeft(6)} x2={barLeft(7) + BAR_W} y={barTop(76) - 14}
        label="no warmer day ahead" color="var(--diff-med)" />
    </g>
  );
}

/* idle bars + answer for setup */
function SetupState() {
  const tones: (string | undefined)[] = TEMPS.map((_, i) => (i === 0 ? "active" : undefined));
  return (
    <g>
      <BarsRow tones={tones} />
      <AnswerRow vals={Array(N).fill("·")} />
    </g>
  );
}

export const monotonicStackLesson: LessonSpec = {
  topicTitle: "monotonic stack · eight cold days, when does it warm up?",
  canvas: { width: VW, height: VH },
  codeSource: monotonic_stackPy as string,
  beats: [
    {
      id: "setup",
      visual: <SetupState />,
      panels: [{
        left: 60, top: 20, width: 600, variant: "main", label: "The setup", title: "Eight cold days. When does it warm up?",
        body: <>For each day, count the days until a warmer one. If a warmer day is two ahead, the answer is <strong>2</strong>; if none ever comes, <strong>0</strong>. Eight days is easy &mdash; a weather app holds a whole year.</>,
      }],
      arrows: [{ x1: 150, y1: 150, x2: barCx(0), y2: barTop(TEMPS[0]) - 14 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      visual: (api) => <NaiveScan api={api} />,
      panels: [
        {
          left: 60, top: 20, width: 620, variant: "main", label: "The obvious thing", title: "Stand on each day. Look right until it gets warmer.",
          body: <>The honest way: stand on a day, walk forward until a warmer one shows up, note the gap. Cold early days re-read almost the whole week. Eight days is fine; a million is not &mdash; the work grows like size <em>times</em> size.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The waste:</strong> the same later days get re-read over and over. What could we remember instead?</>,
        },
      ],
      arrows: [{ x1: barCx(2), y1: 152, x2: barCx(2), y2: barTop(TEMPS[2]) - 14 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      visual: (api) => <ManualWalk api={api} />,
      panels: [
        {
          left: 60, top: 18, width: 470, variant: "main", label: "The wedge", title: "Keep a line of days still waiting.",
          body: <>Walk left to right. Keep a <strong>stack</strong> &mdash; a line where you only add to and remove from the <em>same end</em>, the back. Each new day asks the last in line: &ldquo;Warmer than you?&rdquo; <strong>Yes</strong> &rarr; send them home with the gap. <strong>No</strong> &rarr; join the back and wait.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> if each day is added to the line once and sent home once, how much total work is that?</>,
        },
      ],
      arrows: [{ x1: 300, y1: 150, x2: STK_CX, y2: STK_TOP - 4 }],
      codeLabels: ["while_pop", "record", "push"],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: (api) => <AutoWalk api={api} />,
      panels: [{
        left: 60, top: 18, width: 470, variant: "main", label: "The derivation", title: "A stack of indices. Pop while today wins.",
        body: <>Store each day&rsquo;s <strong>index</strong> (its position, 0&ndash;7), not its temperature, so we can subtract to get the gap. For each new day, while the top day is cooler, <strong>pop</strong> it (remove the top) and record <code>answer = today &minus; that day</code>. Then add today. Anyone left over stays 0.</>,
      }],
      arrows: [{ x1: 300, y1: 150, x2: STK_CX, y2: STK_TOP - 4 }],
      codeLabels: ["loop", "while_pop", "pop", "record", "push"],
      interaction: "playback",
    },
    {
      id: "operations",
      visual: (api) => <AutoWalk api={api} />,
      panels: [
        {
          left: 60, top: 20, width: 620, variant: "main", label: "The operations", title: "A few days do a lot. The average is constant.",
          body: <>One warm day can send everyone home &mdash; looks expensive. But every send-home was paid for by an add that already happened, so total adds plus removals is at most <code>2n</code> (twice the number of days, <code>n</code>). We call that <code>O(n)</code>: work that grows in step with the number of days.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">Watch the counter:</strong> total pushes + pops climbs toward its cap of 2 &times; 8 = 16, never past it.</>,
        },
      ],
      codeLabels: ["while_pop", "pop", "push"],
      interaction: "playback",
    },
    {
      id: "general",
      visual: <StoryFamily />,
      panels: [{
        left: 540, top: 60, width: 290, variant: "main", label: "The generalization", title: "Next/previous thing with a property.",
        body: <>The trick isn&rsquo;t about temperatures. It fits any &ldquo;for each item, what&rsquo;s the next or previous one that&rsquo;s bigger / smaller / taller / cheaper?&rdquo; Same shape every time: walk once, keep a stack of waiters, let each item answer everyone it beats.</>,
      }],
      codeLabels: ["loop", "while_pop", "push"],
    },
    {
      id: "name",
      visual: <FinalState />,
      panels: [{
        left: 60, top: 20, width: 470, variant: "main", label: "The pattern", title: "Monotonic Stack.",
        body: <>&ldquo;Monotonic&rdquo; means temperatures inside only go one way: coolest at the bottom, colder up top. Cheap-on-average cost, where rare costly steps are pre-paid by cheap ones, is called <strong>amortized</strong>. Spot it on &ldquo;next/previous bigger-smaller&rdquo; and &ldquo;largest rectangle.&rdquo;</>,
      }],
      arrows: [{ x1: 320, y1: 150, x2: barCx(6), y2: barTop(TEMPS[6]) - 14 }],
      codeLabels: ["done"],
    },
  ],
};
