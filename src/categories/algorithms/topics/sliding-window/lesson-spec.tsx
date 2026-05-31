"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
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

export const slidingWindowLesson: LessonSpec = {
  topicTitle: "sliding window · sums of every 3-in-a-row",
  canvas: { width: VW, height: VH },
  codeSource: sliding_windowPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I see the setup",
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
      detail: (
        <>
          <p>You&rsquo;ve got a row of ten numbers. A friend points at the first three and asks, <em>&ldquo;what do those add up to?&rdquo;</em> You add them. Easy. The little frame around those three cells is what we&rsquo;ll call a <strong>window</strong> &mdash; just a marked-off stretch of the row.</p>
          <p>Then they shift their finger one cell to the right and ask again. And again. And again &mdash; eight times in total, until the window reaches the end of the row.</p>
          <p><strong>The question isn&rsquo;t which numbers are in the window.</strong> The real question is: what&rsquo;s the <em>least amount of arithmetic</em> you can possibly get away with to answer all eight?</p>
        </>
      ),
      arrows: [{ x1: G.cx(0), y1: 150, x2: G.cx(0), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "We know the window will slide eight times — so what's the first, dumbest way to answer each ask?",
      actionLabel: "Something feels wasteful",
      visual: (
        <g>
          {idleRow(windowTones(1))}
          <Bracket x1={G.left(1)} x2={G.left(1) + K * G.stride - G.gap} y={G.y - 16} label="re-adding all 3" color="var(--diff-hard)" />
          <text x={VW / 2} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--text-faint)" }}>3 × 8 = 24 additions for 8 answers</text>
        </g>
      ),
      panels: [{
        left: 150, top: 344, width: 580, variant: "main", label: "The obvious thing", title: "Add three. Slide. Add three. Slide.",
        body: <>The first idea: just do it. Add the three numbers in each of the 8 windows &mdash; 24 additions. But side-by-side windows <strong>share two numbers</strong>, so you keep re-adding what you just added.</>,
      }],
      detail: (
        <>
          <p>The first answer that arrives: just <em>do it</em>. For every position of the window, add up the three numbers sitting underneath it, from scratch.</p>
          <p>That&rsquo;s <code>3 &times; 8 = 24</code> additions to answer eight questions. Sounds reasonable &mdash; until you watch it happen step by step.</p>
          <p>Look at the second window next to the first. They <strong>share two of their three</strong> numbers. So you add those two numbers, then a moment later you slide over and add the very same two again. And then again on the next slide. You&rsquo;re paying full price for arithmetic you already did.</p>
        </>
      ),
      arrows: [{ x1: G.cx(2), y1: 344, x2: G.cx(2), y2: G.y + G.cellH + 40 }],
      codeLabels: ["sig"],
    },
    {
      id: "wedge",
      label: "The wedge",
      connector: "Since neighbouring windows overlap so much, let's stop calculating and just watch what actually moves.",
      actionLabel: "I think I see it",
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
      detail: (
        <>
          <p>Your turn. Tap a cell to the left or right of the window to nudge it one step that way. Then do it again. Then again.</p>
          <p>Don&rsquo;t do any math in your head &mdash; just <em>watch the cells</em>. Which numbers are inside the window before you move? Which ones after? You&rsquo;ll see that only the two edges change: one number drops off the left, one new number joins on the right, and everything in the middle stays exactly where it was.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The wedge question:</strong> when you slide the window by one, how many numbers actually change &mdash; and how many stay exactly where they were?
          </div>
        </>
      ),
      codeLabels: ["slide"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "You just saw only the two edges move — now let's turn that picture into a rule we can write down.",
      actionLabel: "Count the operations",
      visual: <FrozenSlide />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "One leaves, one enters, the rest stay.",
        body: <>Two cells change per slide. Keep a running total &mdash; call it <code>window_sum</code>. The new total is the old total, minus the number that <strong>left</strong>, plus the number that <strong>entered</strong>. Just two steps, any window width. <span className="text-[var(--accent-ink)]">Add each number once, then reuse the total forever.</span></>,
      }],
      detail: (
        <>
          <p>Two cells change roles every slide. There are really three roles in play: the number that <em>leaves</em>, the numbers that <em>stay</em>, and the number that <em>enters</em>. Let&rsquo;s name them and write down what we just saw.</p>
          <p>Keep one number as you go &mdash; the sum of whatever is currently inside the window. Call it <code>window_sum</code> (a <em>running total</em>: you update it instead of recomputing it). When the window slides forward one step, the only cells that move are the one at the old left edge (the <strong>leaver</strong>) and the brand-new one at the right edge (the <strong>newcomer</strong>).</p>
          <p>So the recipe almost writes itself: <code>new total = old total &minus; leaver + newcomer</code>. Just two operations, no matter how wide the window is. The numbers in the middle never get touched again.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle:</strong> we paid to add each number once, then reused that total forever after. That&rsquo;s the whole deal &mdash; <em>information reuse</em>.
          </div>
        </>
      ),
      arrows: [
        { x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 4 },
        { x1: G.cx(5), y1: 150, x2: G.cx(5), y2: G.y - 4 },
      ],
      codeLabels: ["init_window", "slide"],
    },
    {
      id: "win",
      label: "The win",
      connector: "Now that each slide costs just two operations, let's put a number on how much that actually saves.",
      actionLabel: "Watch it run",
      visual: <CounterRace />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The win", title: "Two operations beat k, and the gap grows.",
        body: <>The obvious way adds <code>k</code> numbers every slide (here k=3); the wedge way adds just 2. Small lead now. But with a window of 100 across a million numbers, the obvious way does about fifty times the work for the same answer.</>,
      }],
      detail: (
        <>
          <p>Watch the two counters race. The obvious way piles up <code>k</code> additions on every slide &mdash; here <code>k</code> (the window width) is 3. The wedge way adds only 2, no matter how wide the window gets. With <code>k=3</code> that&rsquo;s a small lead.</p>
          <p>Now stretch it: a window of 100 numbers sliding across a million. The obvious way does about <em>fifty times</em> as much work for the exact same answers. The shape of the task didn&rsquo;t change at all &mdash; only the bookkeeping did. That widening gap is the whole point of the wedge.</p>
        </>
      ),
      arrows: [{ x1: G.cx(8), y1: 150, x2: 610, y2: 222 }],
      codeLabels: ["loop", "slide", "record"],
      interaction: "playback",
      // playback visual mounts below via the playback beat; this static race is the framing
    },
    {
      id: "playback",
      label: "The win, watched",
      connector: "We've counted the savings on paper — now let the code run it live and see the total barely move.",
      actionLabel: "Try it on a different question",
      visual: (api) => <AutoSlide api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "Watch it run", title: "The window marches; the total just nudges.",
        body: <>Press play in your mind: the window slides cell by cell. At each step the code subtracts the leaver and adds the newcomer &mdash; the <code>loop</code> line repeating two operations &mdash; and records the new sum. Eight answers, almost no arithmetic.</>,
      }],
      detail: (
        <>
          <p>Now watch the same idea run on its own. The window marches across the row one cell at a time. At every step the code subtracts the leaver and adds the newcomer &mdash; that&rsquo;s the <code>loop</code> line (the instruction the computer repeats once per slide) doing its two operations &mdash; then records the fresh sum.</p>
          <p>Notice the running total barely twitches each step instead of being rebuilt. Eight answers come out the far end with almost no arithmetic. Same array, same answers as the obvious way &mdash; a tiny fraction of the work.</p>
        </>
      ),
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
      label: "The generalization",
      connector: "The slide gave us all eight sums cheaply — but does the same move survive a completely different question?",
      actionLabel: "Name the pattern",
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The generalization", title: "Same wedge. New question.",
        body: <>Forget listing all eight sums. New question: what&rsquo;s the <strong>biggest</strong> three-in-a-row sum? Same slide, same two operations &mdash; just remember the largest total you&rsquo;ve seen, plus one comparison each step. The slide doesn&rsquo;t care what you ask.</>,
      }],
      detail: (
        <>
          <p>Forget listing every three-in-a-row sum. New question: what&rsquo;s <strong>the biggest</strong> three-in-a-row sum on this same row? One number out, not eight.</p>
          <p>The same wedge still applies. Slide a window of three exactly as before, but this time keep the largest sum you&rsquo;ve seen so far as you go. That&rsquo;s the two operations per slide, plus one extra <em>comparison</em> &mdash; &ldquo;is this new total bigger than my best?&rdquo; &mdash; each step.</p>
          <p>The pattern doesn&rsquo;t care what you&rsquo;re asking. It only cares that you&rsquo;re looking at side-by-side (<em>contiguous</em>) windows whose value can be updated a little bit at a time instead of recomputed from scratch.</p>
        </>
      ),
      arrows: [{ x1: G.cx(6), y1: 150, x2: G.cx(6), y2: G.y - 4 }],
      codeLabels: ["loop", "slide", "record"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "You've built the whole move from scratch — here's its name and the cues that say \"reach for it.\"",
      visual: <Signals />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Sliding Window.",
        body: <>That&rsquo;s the name. You&rsquo;ll spot it whenever you look at side-by-side stretches of a row and the answer can be <strong>nudged</strong> as the window moves instead of rebuilt each time. The full Python is docked on the right &mdash; trace one pass.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name &mdash; <strong>Sliding Window</strong> &mdash; and you earned it by deriving the whole thing. It applies whenever you&rsquo;re looking at side-by-side (<em>contiguous</em>) stretches of a row and the answer can be <strong>nudged</strong> as the window moves instead of rebuilt from scratch each time.</p>
          <p>Reach for it when you see cues like these:</p>
          <ul>
            <li>&ldquo;contiguous stretch of length k&rdquo;</li>
            <li>&ldquo;longest / shortest window satisfying X&rdquo;</li>
            <li>&ldquo;count substrings with property Y&rdquo;</li>
          </ul>
          <p>The full Python is docked on the right &mdash; trace a single pass through it and you&rsquo;ll see every move you just made by hand.</p>
        </>
      ),
      codeLabels: ["sig", "init_window", "init_results", "loop", "slide", "record", "result"],
    },
  ],
};
