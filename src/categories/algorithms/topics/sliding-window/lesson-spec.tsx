"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
import sliding_windowPy from "./algorithm.py";

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
    api.onInteractionDone();
    api.onActiveLine(["slide"]);
    setStart(Math.max(0, Math.min(LAST_START, next)));
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
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
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
    }, 950);
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
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
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
  const cw = 250, gap = 16, total = chips.length * cw + (chips.length - 1) * gap, sx = (VW - total) / 2, y = 248;
  return (
    <g>
      {chips.map((c, i) => {
        const x = sx + i * (cw + gap);
        return (
          <g key={i}>
            <rect x={x} y={y} width={cw} height={48} rx={10} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1.5} />
            <text x={x + cw / 2} y={y + 24} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{c}</text>
          </g>
        );
      })}
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[]) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} />
);

export const slidingWindowLesson: LessonSpec = {
  topicTitle: "sliding window · sums of every 3-in-a-row",
  canvas: { width: VW, height: VH },
  codeSource: sliding_windowPy as string,
  beats: [
    {
      id: "setup",
      visual: (
        <g>
          {idleRow(windowTones(0))}
          <Bracket x1={G.left(0)} x2={G.left(0) + K * G.stride - G.gap} y={G.y - 16} label={`window · k=${K}`} color="var(--accent-ink)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "A row of numbers. Add the first three.",
        body: <>Here&rsquo;s a row of ten numbers. A friend points at the first three &mdash; we&rsquo;ll call that frame around them a <strong>window</strong> &mdash; and asks &ldquo;what do these add up to?&rdquo; Then slides it one cell right and asks again. Eight times.</>,
      }],
      arrows: [{ x1: G.cx(1), y1: 150, x2: G.cx(1), y2: G.y - 18 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      visual: (
        <g>
          {idleRow(windowTones(1))}
          <Bracket x1={G.left(1)} x2={G.left(1) + K * G.stride - G.gap} y={G.y - 16} label="re-adding all 3" color="var(--diff-hard)" />
          <text x={VW / 2} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--text-faint)" }}>3 × 8 = 24 additions for 8 answers</text>
        </g>
      ),
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Add three. Slide. Add three. Slide.",
        body: <>The first idea: just do it. For each of the 8 windows, add its three numbers &mdash; that&rsquo;s 24 additions. But any two side-by-side windows <strong>share two numbers</strong>. You add those, then add them right back again.</>,
      }],
      arrows: [{ x1: G.cx(2), y1: 300, x2: G.cx(2), y2: G.y + G.cellH + 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      visual: (api) => <DragWindow api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The wedge", title: "Drag the window. Watch only what changes.",
          body: <>Your turn. Tap a cell to nudge the window one step. Don&rsquo;t do mental math &mdash; just watch the cells. One number drops out of the left edge, one new number joins on the right, and the middle one doesn&rsquo;t move at all.</>,
        },
        {
          left: 250, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> when you slide by one, how many numbers actually change &mdash; and how many stay exactly where they were?</>,
        },
      ],
      codeLabels: ["slide"],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: <FrozenSlide />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "One leaves, one enters, the rest stay.",
        body: <>Two cells change per slide. Keep a running total &mdash; call it <code>window_sum</code>. The new total is the old total, minus the number that <strong>left</strong>, plus the number that <strong>entered</strong>. Two operations, however wide the window. <span className="text-[var(--accent-ink)]">Pay to add each number once, then reuse that total forever.</span></>,
      }],
      arrows: [
        { x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 4 },
        { x1: G.cx(5), y1: 150, x2: G.cx(5), y2: G.y - 4 },
      ],
      codeLabels: ["init_window", "slide"],
    },
    {
      id: "win",
      visual: <CounterRace />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The win", title: "Two operations beat k, and the gap grows.",
        body: <>The obvious way adds <code>k</code> numbers every slide (here k=3); the wedge way adds just 2. Small lead now. But with a window of 100 across a million numbers, the obvious way does about fifty times the work for the same answer.</>,
      }],
      arrows: [{ x1: G.cx(8), y1: 150, x2: 610, y2: 222 }],
      codeLabels: ["loop", "slide", "record"],
      interaction: "playback",
      // playback visual mounts below via the playback beat; this static race is the framing
    },
    {
      id: "playback",
      visual: (api) => <AutoSlide api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "Watch it run", title: "The window marches; the total just nudges.",
        body: <>Press play in your mind: the window slides cell by cell. At each step the code subtracts the leaver and adds the newcomer &mdash; the <code>loop</code> line repeating two operations &mdash; and records the new sum. Eight answers, almost no arithmetic.</>,
      }],
      codeLabels: ["loop", "slide", "record"],
      interaction: "playback",
    },
    {
      id: "general",
      visual: (
        <g>
          {idleRow(ARR.map((_, i) => (i >= 4 && i < 7 ? "good" : i >= 1 && i < 4 ? "active" : undefined)))}
          <Bracket x1={G.left(4)} x2={G.left(4) + K * G.stride - G.gap} y={G.y - 16} label="biggest so far = 16" color="var(--diff-easy)" />
          <text x={VW / 2} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)" }}>same slide · just remember the largest total seen</text>
        </g>
      ),
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The generalization", title: "Same wedge. New question.",
        body: <>Forget listing all eight sums. New question: what&rsquo;s the <strong>biggest</strong> three-in-a-row sum? Same slide, same two operations &mdash; just remember the largest total you&rsquo;ve seen, plus one comparison each step. The slide doesn&rsquo;t care what you ask.</>,
      }],
      arrows: [{ x1: G.cx(5), y1: 150, x2: G.cx(5), y2: G.y - 18 }],
      codeLabels: ["loop", "slide", "record"],
    },
    {
      id: "name",
      visual: <Signals />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Sliding Window.",
        body: <>That&rsquo;s the name. You&rsquo;ll spot it whenever you look at side-by-side stretches of a row and the answer can be <strong>nudged</strong> as the window moves instead of rebuilt each time. The full Python is docked on the right &mdash; trace one pass.</>,
      }],
      codeLabels: ["sig", "init_window", "init_results", "loop", "slide", "record", "result"],
    },
  ],
};
