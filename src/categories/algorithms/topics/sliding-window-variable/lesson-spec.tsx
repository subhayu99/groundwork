"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import sliding_window_variablePy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const S = "abracadabra";
const ARR = Array.from(S);
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* dim everything outside [l, r] (when r >= l), else dim all */
function dimOutside(l: number, r: number): boolean[] {
  return ARR.map((_, i) => !(r >= l && i >= l && i <= r));
}

/* ── interactive WEDGE: grow R / shrink L by hand, keep the run repeat-free ─── */
function ManualWindow({ api }: { api: BeatVisualApi }) {
  const [l, setL] = useState(0);
  const [r, setR] = useState(0);

  const expand = () => { api.onInteractionDone(); setR((cur) => Math.min(ARR.length - 1, cur + 1)); };
  const contract = () => { api.onInteractionDone(); setL((cur) => Math.min(r, cur + 1)); };
  const reset = () => { setL(0); setR(0); };

  const run = S.slice(l, r + 1);
  const unique = new Set(run).size === run.length;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i >= l && i <= r ? (unique ? "active" : "bad") : undefined));
  const dim = dimOutside(l, r);
  const markers: Record<number, string> = {};
  markers[l] = l === r ? "L R" : "L";
  if (r !== l) markers[r] = "R";

  const btnY = G.y + G.cellH + 44;
  const Btn = ({ x, w, label, onClick, disabled, primary }: { x: number; w: number; label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) => (
    <g onClick={disabled ? undefined : onClick} style={{ cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 }}
      tabIndex={disabled ? undefined : 0} role="button" aria-label={label}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}>
      <rect x={x} y={btnY} width={w} height={24} rx={6} fill={primary ? "var(--accent-soft)" : "var(--bg-card)"} stroke={primary ? "var(--accent-line)" : "var(--line)"} />
      <text x={x + w / 2} y={btnY + 12} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: primary ? "var(--accent-ink)" : "var(--text-muted)" }}>{label}</text>
    </g>
  );

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: unique ? "var(--diff-easy)" : "var(--diff-hard)" }}>
        {`"${run}" · length ${r - l + 1} · ${unique ? "no repeats ✓" : "repeat ✗"}`}
      </text>
      <Btn x={VW / 2 - 150} w={36} label="↺" onClick={reset} />
      <Btn x={VW / 2 - 104} w={92} label="contract L →" onClick={contract} disabled={l >= r} />
      <Btn x={VW / 2 + 2} w={92} label="expand R →" onClick={expand} disabled={r >= ARR.length - 1} primary />
    </g>
  );
}

/* ── playback: the breathing window runs itself, the code line follows ─────── */
interface SW { l: number; r: number; seen: Record<string, number>; best: number; bestRange: [number, number]; done: boolean; }
function AutoWindow({ api }: { api: BeatVisualApi }) {
  const init = (): SW => ({ l: 0, r: -1, seen: {}, best: 0, bestRange: [0, 0], done: false });
  const [s, setS] = useState<SW>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const nextR = c.r + 1;
      if (nextR >= ARR.length) { api.onActiveLine(["result"]); setS({ ...c, done: true }); return; }
      const ch = ARR[nextR];
      const prev = c.seen[ch];
      if (prev !== undefined && prev >= c.l) {
        api.onActiveLine(["expand", "check", "contract", "record", "update"]);
        setS({ ...c, l: prev + 1, seen: { ...c.seen, [ch]: nextR }, r: nextR, best: Math.max(c.best, nextR - (prev + 1) + 1), bestRange: nextR - (prev + 1) + 1 > c.best ? [prev + 1, nextR] : c.bestRange });
        return;
      }
      const seen = { ...c.seen, [ch]: nextR };
      const len = nextR - c.l + 1;
      if (len > c.best) { api.onActiveLine(["expand", "record", "update"]); setS({ ...c, r: nextR, seen, best: len, bestRange: [c.l, nextR] }); }
      else { api.onActiveLine(["expand", "record", "update"]); setS({ ...c, r: nextR, seen }); }
    }, pace(850));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { l, r, seen, best, bestRange, done } = s;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => {
    if (done && i >= bestRange[0] && i <= bestRange[1]) return "good";
    return r >= l && i >= l && i <= r ? "active" : undefined;
  });
  const dim = done ? ARR.map((_, i) => !(i >= bestRange[0] && i <= bestRange[1])) : dimOutside(l, Math.max(0, r));
  const markers: Record<number, string> = {};
  if (!done && r >= 0) { markers[l] = l === r ? "L R" : "L"; if (r !== l) markers[r] = "R"; }

  const seenStr = Object.keys(seen).length === 0 ? "{}" : `{${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(", ")}}`;

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 38} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? `done · longest no-repeat run = ${best} ("${S.slice(bestRange[0], bestRange[1] + 1)}")` : r < 0 ? "starting…" : `window "${S.slice(l, r + 1)}" · best so far ${best}`}
      </text>
      <text x={VW / 2} y={G.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>
        {`last-seen table: ${seenStr}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 40} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── PREDICTION GATE + playback: commit to the shrink rule, THEN watch it ────
 * Frozen at the lesson's pivotal moment: the window holds "abr" and R's next
 * letter is a second "a" — the rule is about to break. The learner commits to
 * the smallest legal fix BEFORE the playback reveals the L-jump. One tap on a
 * pill is the beat's real interaction (interaction: "wedge"): PredictGate fires
 * api.onInteractionDone(), feedback shows, and after a short reading pause the
 * AutoWindow playback answers the prediction. The gate is HTML hosted on the
 * SVG canvas via <foreignObject>; data-canvas-panel opts it into the scene
 * layout's content-extent measurement so vertical centring accounts for it. */
const GATE_L = 0, GATE_R = 2, GATE_NEXT = 3; // "abr" + the incoming duplicate "a"
function ShrinkRuleGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoWindow api={api} />;

  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    i === GATE_L || i === GATE_NEXT ? "bad" : i > GATE_L && i <= GATE_R ? "active" : undefined,
  );
  const dim = ARR.map((_, i) => i > GATE_NEXT);
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ [GATE_L]: "L", [GATE_R]: "R", [GATE_NEXT]: "next" }} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {`window "abr" — R's next letter is a second "a", and its old copy is still inside`}
      </text>
      <foreignObject x={195} y={G.y + G.cellH + 28} width={470} height={200}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="What's the smallest move that lets the new “a” in and keeps the run repeat-free?"
            choices={[
              { id: "jump", label: "slide L just past the old “a”", correct: true, note: "“br” is still repeat-free, so it stays — the window gives up only what it must" },
              { id: "restart", label: "restart the window at the new “a”", note: "that throws away “br” — letters already proven repeat-free can stay" },
              { id: "skip", label: "leave the new “a” out and grow R past it", note: "a run is contiguous — R can't skip a box, so the fix must come from the left end" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1800)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── static: the naive scan (one start, run grows rightward) ───────────────── */
function NaiveScan() {
  const start = 2, end = 5; // a frozen snapshot of "raca"-style scan from start=2
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i === start ? "muted" : i > start && i <= end ? "active" : undefined));
  const dim = ARR.map((_, i) => i < start || i > end);
  return (
    <g>
      <text x={VW / 2} y={G.y - 44} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        from every start, walk right until a letter repeats · then start over one cell over
      </text>
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-med)" }}>
        about length × length checks; the same letters get re-read again and again
      </text>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ [start]: "start" }} />
    </g>
  );
}

/* ── static: touched-twice / linear-time contrast ─────────────────────────── */
function LinearContrast() {
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i >= 1 && i <= 4 ? "good" : undefined));
  const dim = ARR.map((_, i) => !(i >= 1 && i <= 4));
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ 1: "L", 4: "R" }} />
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        each letter is added once (R reaches it) and dropped once (L passes it): about 2n moves
      </text>
      <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>
        naive on 1,000 letters ≈ 500,000 checks · breathing window ≈ 2,000
      </text>
    </g>
  );
}

/* ── static: three tiny windows sharing the same two-marker motion ─────────── */
function ThreeVariants() {
  const rows: { y: number; label: string; values: string[]; lo: number; hi: number }[] = [
    { y: 196, label: "no repeats (this lesson)", values: Array.from("abrac"), lo: 1, hi: 4 },
    { y: 286, label: "covers every needed letter", values: Array.from("xaybzc"), lo: 1, hi: 5 },
    { y: 376, label: "at most 2 different letters", values: Array.from("aabbc"), lo: 0, hi: 3 },
  ];
  const mini = (count: number, y: number) => rowGeom(count, VW, y, 34, 5, 30);
  return (
    <g>
      {rows.map((row, ri) => {
        const g = mini(row.values.length, row.y);
        const tones: (Tone | undefined)[] = row.values.map((_, i) => (i >= row.lo && i <= row.hi ? "active" : undefined));
        const dim = row.values.map((_, i) => i < row.lo || i > row.hi);
        return (
          <g key={ri}>
            <CellRow geom={g} values={row.values} tones={tones} dim={dim} fontSize={12} markers={{ [row.lo]: "L", [row.hi]: "R" }} />
            <text x={g.left(0) - 14} y={g.y + g.cellH / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>
              {ri + 1}.
            </text>
            <text x={g.cx(row.values.length - 1) + g.cellW / 2 + 18} y={g.y + g.cellH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
              {row.label}
            </text>
          </g>
        );
      })}
      <text x={VW / 2} y={446} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>
        right grows · left shrinks just enough · the rule changes, the motion doesn&rsquo;t
      </text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, naive, wedge, derive, win, general, name)
 *   structured : 5 — cuts `naive` (its cost folds into the wedge's structured
 *                connector) and `general` (the slot-6 transfer beat).
 *   rigorous   : 3 — `derive` (invariant + the prediction gate) · `win`
 *                (exact costs + edge cases) · `name` (pattern + stamp).
 *   refresh    : additionally trims `naive` + `general` (trimOnRefresh).      */
export const slidingWindowVariableLesson: LessonSpec = {
  topicTitle: "variable sliding window · longest run with no repeats",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: sliding_window_variablePy as string,
  // standing on the fixed sliding window (the bridge anchor, per TRACK-NARRATIVES.md):
  // the learner owns "nudge the answer, never rebuild it" — this lesson keeps that
  // reuse and lets a rule (the invariant) decide the window's width.
  bridgeFrom: reg({
    base: "The fixed window taught you to nudge an answer instead of rebuilding it. Now the window also decides how wide to be.",
    intuitive: "You've slid a window that reuses its sum: drop the leaver, add the joiner. Now the window learns to stretch and shrink.",
    rigorous: "Fixed window: O(1) per slide by reusing the running sum. Same reuse, but now an invariant drives the width.",
  }),
  // TRACK-NARRATIVES row 21: information-reuse is the primary stamp (from meta);
  // monotonicity-and-invariants is the secondary — the invariant drives the shrink.
  principle: { key: "information-reuse", n: 1, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: "Find the longest run with no repeated letter; length is whatever fits the rule.",
      detail: reg({
        base: (
          <>
            <p>You&rsquo;re looking at a row of letters: the word <code>abracadabra</code> laid out one box per letter. A friend asks: &ldquo;What&rsquo;s the longest stretch you can read in a row without saying the same letter twice?&rdquo;</p>
            <p>An earlier idea, the <em>fixed</em> sliding window, always asked for a stretch of exactly some chosen length. This question is different: it doesn&rsquo;t care how long the stretch is. It cares about a <strong>property</strong>. Every letter inside the stretch must be unique. The length is whatever falls out once we protect that rule.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Look at the row of boxes, the word <code>abracadabra</code>, one letter per box. A friend asks: reading left to right, how long a stretch can you say out loud without repeating any letter?</p>
            <p>The window you met last lesson had a fixed size: &ldquo;exactly three boxes, slide along.&rdquo; This question never mentions a size. It hands you a <strong>rule</strong> instead: every letter inside the stretch must be different. However long the stretch can get while the rule still holds, that&rsquo;s the answer.</p>
          </>
        ),
      }),
      visual: (
        <g>
          {idleRow()}
          <Bracket x1={G.left(0)} x2={G.left(ARR.length - 1) + G.cellW} y={G.y - 16} label="find the longest no-repeat run" color="var(--text-faint)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "The longest stretch with no repeats.",
        body: reg({
          base: <>The word <code>abracadabra</code> as a row of letter boxes. What is the longest run, read left-to-right, with no repeated letter? We don&rsquo;t fix the length. We protect a rule: every letter inside is different.</>,
          intuitive: <>The word <code>abracadabra</code>, one letter per box. Reading left to right, what&rsquo;s the longest run you can take without any letter showing up twice? Nobody hands us a length. We&rsquo;re handed a rule to protect: every letter inside is different.</>,
        }),
      }],
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: G.y - 42 }],
      codeLabels: ["sig"],
    },
    {
      id: "naive",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that we know the rule we're protecting, what's the most direct way to hunt for the longest stretch that keeps it?",
      actionLabel: "Reuse what's already valid",
      takeaway: "Trying every start is O(n²); it keeps re-reading letters it already checked.",
      detail: (
        <>
          <p>The most direct method: pick a starting box, then walk rightward adding letters until one repeats; note how long that clean stretch got. Do that from every possible start, and keep the longest you ever saw.</p>
          <p>For an <em>n</em>-letter word (here <em>n</em> just means &ldquo;the number of letters&rdquo;) that&rsquo;s roughly <code>n²/2</code> character checks, about length-times-length work. We write that as <Term word="O(n²)"><code>O(n²)</code></Term>, meaning the effort grows with the <em>square</em> of the length: double the word and the work roughly quadruples.</p>
          <p>And the waste is obvious once you see it. If we&rsquo;ve confirmed <em>abr</em> is repeat-free starting at box 0, we throw that away and re-verify it starting at box 1 (now re-reading <em>br</em>), then again at box 2 (re-reading <em>r</em>). The information we already earned is sitting right there, and we keep tossing it.</p>
        </>
      ),
      visual: <NaiveScan />,
      panels: [{
        left: 150, top: 332, width: 580, variant: "main", label: "The obvious thing", title: "Check every possible stretch.",
        body: <>The slow way: from each starting box, walk right until a letter repeats, and keep the longest clean run. For an <em>n</em>-letter word (<em>n</em> counts the letters) that&rsquo;s about <code>n²/2</code> checks, roughly length-times-length. Worse, we keep re-reading the same letters.</>,
      }],
      arrows: [{ x1: G.cx(2), y1: 328, x2: G.cx(2), y2: G.y + G.cellH + 25 }],
      codeLabels: [],
      interaction: "none",
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "If re-reading from scratch is the waste, the fix is to never start over, so let's give the stretch two ends we can nudge by hand.",
        structured: "Checking every start re-reads the same letters, roughly length-times-length checks in all. The fix is to never start over: give the stretch two ends you can nudge.",
      }),
      actionLabel: "Two motions, one rule",
      takeaway: reg({
        base: "Two ends, L and R, that only ever nudge forward, so work already done stays done.",
        intuitive: "Two markers that only ever move forward, so nothing you've checked gets checked again.",
      }),
      detail: reg({
        base: (
          <>
            <p>The row of letters has two <strong>markers</strong>, just labels sitting under the boxes. <Term word="L"><code>L</code></Term> marks the left edge of your current stretch; <Term word="R"><code>R</code></Term> marks the right edge. Use the buttons under the row: <em>expand R &rarr;</em> pulls the next letter on the right into the window, and <em>contract L &rarr;</em> drops the leftmost letter off the window. (The <em>&#8634;</em> button resets both ends to the start.)</p>
            <p>Try to find the longest valid (no-repeat) stretch using just those two move buttons. The thing to notice: you <em>never</em> have to start over. You only ever grow the right edge or shrink the left edge, so the work you already did stays done.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> when does <code>R</code> <em>want</em> to move? When does <code>L</code> <em>have</em> to move? Are they ever moving for the same reason?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Two labels now sit under the boxes. Think of them as two fingers resting on the row. <Term word="L"><code>L</code></Term> pins where your stretch starts; <Term word="R"><code>R</code></Term> pins where it ends. The buttons move them: <em>expand R &rarr;</em> pulls the next letter on the right into the stretch, and <em>contract L &rarr;</em> drops the leftmost letter out of it. (The <em>&#8634;</em> button puts both back at the start.)</p>
            <p>Your job: find the longest no-repeat stretch using only those two moves. And watch what never happens: you never wipe the slate and begin again. Each finger only ever walks forward, so everything you&rsquo;ve already checked stays checked.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> when does <code>R</code> <em>want</em> to move? When does <code>L</code> <em>have</em> to move? Are they ever moving for the same reason?
            </div>
          </>
        ),
      }),
      visual: (api) => <ManualWindow api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Two ends. Move them by hand.",
          body: reg({
            base: <>Two <strong>markers</strong> (just labels under the row): <code>L</code> on the left edge of your run, <code>R</code> on the right. With the buttons under the row, <em>expand R</em> adds the next letter on the right; <em>contract L</em> drops the leftmost. Find the longest no-repeat run, and notice you never restart.</>,
            intuitive: <>Two <strong>markers</strong> sit under the row, two fingers on the boxes: <code>L</code> at the left end of your stretch, <code>R</code> at the right. <em>expand R</em> pulls in the next letter; <em>contract L</em> lets go of the leftmost one. Hunt for the longest no-repeat run, and notice you never, ever restart.</>,
          }),
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> when does <code>R</code> <em>want</em> to move? When does <code>L</code> <em>have</em> to move? Are they ever moving for the same reason?</>,
        },
      ],
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      // Appears for EVERY register — rigorous opens here, so its connector is empty
      // (the bridgeFrom line is its lead-in) and its prose states the problem itself.
      connector: reg({
        base: "You just felt the two motions by hand. Now let's pin them into one rule a computer can repeat.",
        rigorous: "",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "R grows while the rule holds; on a repeat, a lookup table jumps L just past the duplicate.",
        intuitive: "Grow R each step; if the new letter is a repeat, jump L just past its old copy.",
        rigorous: "Invariant: the window is repeat-free; a violation moves L the minimum, just past the old copy.",
      }),
      detail: reg({
        base: (
          <>
            <p>Walk <code>R</code> across the word one box at a time. At each step, ask a single question: does the letter at <code>R</code> already appear inside the current window?</p>
            <p><strong>Not a repeat?</strong> Extend the window to include it, and if this stretch is the longest clean one you&rsquo;ve seen, record its length as the new best.</p>
            <p><strong>Already inside?</strong> The window just broke its &ldquo;no repeats&rdquo; rule. Slide <code>L</code> forward until the duplicate is just outside the window. To do that in one move instead of stepping <code>L</code> along, we keep a <strong>hash map</strong>: a tiny lookup table that, given a letter, instantly hands back the last box where we saw it. So <code>L</code> jumps straight past the old copy.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> the window keeps one rule alive, &ldquo;every letter inside is unique.&rdquo; <code>R</code> grows the window as long as the rule still holds; <code>L</code> shrinks it by the smallest amount needed to bring the rule back.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Walk <code>R</code> across the word one box at a time. Each step, one question: is the letter at <code>R</code> already somewhere in the current stretch?</p>
            <p><strong>No?</strong> Pull it in. The stretch just got longer. If it&rsquo;s the longest clean stretch so far, write its length down as the new best.</p>
            <p><strong>Yes?</strong> The no-repeats rule just broke, and the only cure is on the left: slide <code>L</code> forward until the old copy of that letter is outside. To make that one hop instead of many little steps, we keep a tiny lookup table that answers &ldquo;where did I last see this letter?&rdquo; instantly, so <code>L</code> jumps straight past the old copy.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> the window keeps one rule alive, &ldquo;every letter inside is unique.&rdquo; <code>R</code> grows the window while the rule holds; <code>L</code> gives up the fewest letters that bring it back.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The step.</strong> For each <code>R</code>: if <code>s[R]</code> has a previous occurrence at <code>p</code> with <code>p &gt;= L</code>, set <code>L = p + 1</code>. That is the minimal restore, since any window keeping an index &le; <code>p</code> would still contain both copies of <code>s[R]</code>. Then record <code>last_seen[s[R]] = R</code> and <code>best = max(best, R − L + 1)</code>.</p>
            <p><strong>The guard.</strong> The check is <code>ch in last_seen and last_seen[ch] &gt;= left</code>, where the <code>&gt;= left</code> half is load-bearing. A stale occurrence <em>behind</em> <code>L</code> must be ignored: jumping to it would move <code>L</code> backward, breaking monotonicity and silently re-admitting duplicates.</p>
            <p><strong>Why no maximum is missed:</strong> after each step the window is the longest repeat-free substring <em>ending at</em> <code>R</code>; <code>best</code> takes the maximum over every <code>R</code>, hence over all candidates.</p>
          </>
        ),
      }),
      visual: (api) => <ShrinkRuleGate api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation",
        title: reg({
          base: "Right always grows. Left shrinks just enough.",
          rigorous: "One invariant: the window stays repeat-free.",
        }),
        body: reg({
          base: <>Walk <code>R</code> across the word. Each step: is the letter at <code>R</code> already in the run? No: keep it, update the best length. Yes: the rule just broke, so slide <code>L</code> past the duplicate. <span className="text-[var(--accent-ink)]">A small lookup table remembers each letter&rsquo;s last position, so <code>L</code> jumps there in one move.</span></>,
          intuitive: <>March <code>R</code> along one box at a time, asking one question: is this new letter already in the stretch? No: keep it, and note the length if it&rsquo;s a record. Yes: the rule breaks, and the fix has to come from <code>L</code>. Commit to your prediction below, then watch the run. <span className="text-[var(--accent-ink)]">A tiny lookup table remembers each letter&rsquo;s last box, so the fix is one hop, not a crawl.</span></>,
          rigorous: <>Find the longest substring with all characters distinct. Invariant: the window <code>s[L..R]</code> is repeat-free. Advance <code>R</code> each step; if <code>s[R]</code> already occurs in the window, <code>L</code> jumps to one past that occurrence in one <Term word="hash map">hash-map</Term> lookup, <Term word="O(1)"><code>O(1)</code></Term>. Both ends only move right. Commit to the restore move below, then watch the run.</>,
        }),
      }],
      codeLabels: ["expand", "check", "contract", "record", "update"],
      interaction: "wedge",
    },
    {
      id: "win",
      label: "The win",
      connector: reg({
        base: "Now that each end only ever moves one direction, let's tally how much work that actually costs.",
        rigorous: "Both ends are monotone, so count total moves across the whole run, not per-step worst case.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Each letter is touched twice: that's O(n), linear time instead of squared.",
        intuitive: "Each letter is added once and dropped once, about two looks per letter, however long the word.",
        rigorous: "At most 2n pointer moves with O(1) lookups: O(n) time, alphabet-bounded space.",
      }),
      detail: reg({
        base: (
          <>
            <p>Count the moves. Each letter enters the window at most once (when <code>R</code> passes over it) and leaves at most once (when <code>L</code> passes over it). That&rsquo;s about <code>2n</code> moves in total, written <Term word="O(n)"><code>O(n)</code></Term>, meaning the work grows in step with how long the word is, no faster.</p>
            <p>Put numbers on it: the naive method on a thousand-letter word is around half a million checks. The breathing window is about two thousand. Same answer, a fraction of the effort.</p>
            <p>The hash-map lookup we used to jump <code>L</code> costs the same tiny amount every time, no matter how full the table gets. That&rsquo;s <Term word="O(1)"><code>O(1)</code></Term>, &ldquo;constant time.&rdquo; And the memory it needs is at most one entry per distinct letter; for ordinary English text that&rsquo;s only about 26 entries.</p>
            <p>Edges worth a glance before moving on: an empty word returns 0, since the loop never runs. A word with every letter different never moves <code>L</code> at all, and the window ends as the whole word. A word like <code>aaaa</code> keeps the window one letter wide, <code>L</code> hopping along behind <code>R</code>. And the code ignores a remembered position that&rsquo;s already <em>behind</em> <code>L</code>: jumping to a stale one would drag <code>L</code> backward.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Count the moves the way you&rsquo;d count steps. Each letter gets pulled into the window at most once, the moment <code>R</code> reaches it, and dropped at most once, the moment <code>L</code> walks past it. Two touches per letter, tops. For a word of <em>n</em> letters that&rsquo;s about <code>2n</code> moves, and that pattern has a name: <Term word="O(n)"><code>O(n)</code></Term>, the work grows in step with the word, no faster.</p>
            <p>Feel it with numbers: on a thousand-letter word, the try-every-start way costs about half a million checks. The breathing window costs about two thousand. Same answer, a sliver of the effort.</p>
            <p>The lookup table is the quiet hero: asking it &ldquo;where did I last see this letter?&rdquo; costs the same tiny amount no matter how full it gets. That&rsquo;s <Term word="O(1)"><code>O(1)</code></Term>, &ldquo;constant time.&rdquo; And it never grows past one entry per distinct letter; ordinary English text tops out around 26.</p>
            <p>Quick edge checks, so nothing bites later: an empty word scores 0 (there&rsquo;s nothing to walk). A word where every letter differs never moves <code>L</code>, so the whole word is the answer. And <code>aaaa</code>? The window stays one letter wide while <code>L</code> hops along right behind <code>R</code>.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Cost, counted.</strong> <code>R</code> advances exactly n times; <code>L</code> never retreats, so it advances at most n times, giving at most <code>2n</code> index moves, each with one constant-time table lookup and update. That count is <Term word="O(n)"><code>O(n)</code></Term> time. Space: the last-seen table holds at most one entry per distinct character, O(min(n, &sigma;)) for alphabet size &sigma;, effectively constant for fixed alphabets.</p>
            <p><strong>Edge cases.</strong> Empty string &rarr; 0; the loop body never runs. All-distinct input &rarr; <code>L</code> stays at 0; answer n. All-equal input (<code>aaaa</code>) &rarr; window width never exceeds 1; <code>L</code> jumps every step. The <code>last_seen[ch] &gt;= left</code> guard: a stale occurrence behind <code>L</code> must not trigger a jump, or <code>L</code> moves backward and duplicates slip in. The while-loop shrink variant (step <code>L</code> until valid) keeps the same O(n) bound, since total shrinkage across the run is at most n.</p>
          </>
        ),
      }),
      visual: <LinearContrast />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The win", title: "Every letter touched twice. Linear time.",
        body: reg({
          base: <>Each letter joins the run once and leaves once: about <code>2n</code> moves, written <code>O(n)</code> (work grows in step with the word&rsquo;s length). The table lookup is instant, written <code>O(1)</code> (same tiny cost at any size). Naive on 1,000 letters: half a million checks; this: about two thousand.</>,
          intuitive: <>Count it: each letter is pulled in once (when <code>R</code> reaches it) and dropped once (when <code>L</code> passes it), about two moves per letter, never more. People write that as <Term word="O(n)"><code>O(n)</code></Term>: work that grows in step with the word. Try-every-start on 1,000 letters: about half a million checks. This: about two thousand.</>,
          rigorous: <>Count, then name: <code>R</code> makes n forward moves, <code>L</code> at most n, giving at most <code>2n</code> moves, each with an <Term word="O(1)"><code>O(1)</code></Term> lookup. That count is <Term word="O(n)"><code>O(n)</code></Term> time; space is one table entry per distinct character. Against the every-start scan&rsquo;s ~n&sup2;/2 checks: ~250&times; fewer at n = 1,000.</>,
        }),
      }],
      arrows: [{ x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 44 }],
      codeLabels: ["expand", "contract"],
      interaction: "none",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "That linear cost wasn't special to “no repeats”; the same two-ended dance works for a whole family of rules.",
      actionLabel: "Name it",
      takeaway: "Swap the rule, keep the motion: it fits any rule that breaks once you cross a line.",
      detail: (
        <>
          <p>The trick works whenever the window has a <em>rule that breaks cleanly the moment you cross a line</em>. Swap the rule, keep the motion. A few examples:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>&ldquo;Smallest window containing every letter of a target <code>pattern</code>&rdquo;: grow <code>R</code> until the window covers the whole pattern, then shrink <code>L</code> while it still covers it.</li>
            <li>&ldquo;Longest stretch with at most <code>k</code> different values&rdquo; (where <code>k</code> is any number you pick): same template; the rule is now &ldquo;at most k distinct items inside.&rdquo;</li>
            <li>&ldquo;Largest-sum stretch with non-negative values and length at most <code>k</code>&rdquo;: same again.</li>
          </ul>
          <p>The condition you&rsquo;re protecting changes from problem to problem. The dance &mdash; right grows while it can, left shrinks just enough &mdash; does not.</p>
        </>
      ),
      visual: <ThreeVariants />,
      panels: [{
        left: 130, top: 22, width: 600, variant: "main", label: "The generalization", title: "Any rule that breaks once you cross a line.",
        body: <>It fits any rule that snaps the moment you cross a line: &ldquo;smallest window covering every needed letter,&rdquo; or &ldquo;at most <code>k</code> different letters&rdquo; (<code>k</code> is any number). Grow <code>R</code> while the rule holds; shrink <code>L</code> the least that brings it back.</>,
      }],
      codeLabels: ["expand", "check", "contract"],
      interaction: "none",
    },
    {
      id: "name",
      label: "The pattern",
      connector: reg({
        base: "We've seen it work and seen it generalize, so let's give the move its name and the cues that flag it next time.",
        structured: "It works and the cost is linear, so give the move its name and the cues that flag it next time.",
        rigorous: "Name it, and file it under the idea it runs on.",
      }),
      takeaway: reg({
        base: "It's the Variable Sliding Window; reach for it on “longest / shortest run such that…”.",
        intuitive: "The variable sliding window: grow R when you can, shrink L when you must.",
        rigorous: "Variable sliding window: two monotone ends guard an invariant, O(n) for “longest run such that…”.",
      }),
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: <strong>Sliding Window (Variable)</strong>. It&rsquo;s the same family as the fixed-size sliding window, but this one <em>breathes</em>: the right edge expands when it can, the left edge contracts when it must. (For our word, the longest no-repeat run is <code>brac</code>, length 4.)</p>
            <p>Reach for it when you spot signals like these:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Longest / shortest <em>substring</em> (a run of letters sitting next to each other) or subarray such that&hellip;&rdquo;</li>
              <li>&ldquo;At most k of X&rdquo; or &ldquo;at least k of X&rdquo;</li>
              <li>&ldquo;Smallest window containing all of Y&rdquo;</li>
              <li>Any &ldquo;works / doesn&rsquo;t work&rdquo; rule that flips exactly once as a contiguous range grows</li>
            </ul>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7, information reuse:</strong> both ends only ever move forward, so work already done stays done, and the <Term word="invariant">invariant</Term> (the rule kept alive) decides every move.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>That&rsquo;s the name: the <strong>variable sliding window</strong>. Same family as the fixed-size window you already know, but this one <em>breathes</em>: the right end grows the stretch whenever it can; the left end gives up just enough whenever it must. (For our word, the longest no-repeat run is <code>brac</code>, length 4.)</p>
            <p>Cues that should make your hand reach for it:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Longest / shortest stretch of side-by-side letters (or numbers) such that&hellip;&rdquo;</li>
              <li>&ldquo;At most k of something&rdquo; or &ldquo;at least k of something&rdquo;</li>
              <li>&ldquo;Smallest window that contains all of Y&rdquo;</li>
              <li>Any works / doesn&rsquo;t-work rule that flips as a stretch grows</li>
            </ul>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first big idea (1 of 7), reuse what you already know:</strong> neither end ever walks backward, so nothing you checked is ever checked again. That one habit is the whole speed-up.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Variable sliding window.</strong> The template: advance <code>R</code> each step; restore the invariant by the minimum <code>L</code> advance; update the answer. Requirements: growing the window can only break the constraint, shrinking can only repair it, and membership state updates in constant time. Two monotone indices then give O(n) overall.</p>
            <p>Triggers: &ldquo;longest / shortest substring or subarray such that&hellip;&rdquo;, &ldquo;at most / at least k of X&rdquo;, &ldquo;smallest window containing all of Y&rdquo;. Non-triggers: constraints that don&rsquo;t repair monotonically under shrinking, e.g. subarray sums with negative numbers, where the window&rsquo;s logic breaks.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7, information reuse:</strong> monotone ends mean no index is re-examined, while the <Term word="invariant">invariant</Term> deciding each move is idea 3&rsquo;s territory, met here in action.
            </div>
          </>
        ),
      }),
      visual: idleRow(ARR.map((_, i) => (i >= 1 && i <= 4 ? "good" : undefined)), ARR.map((_, i) => !(i >= 1 && i <= 4)), { 1: "L", 4: "R ✓" }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Sliding Window (Variable).",
        body: reg({
          base: <>That&rsquo;s the name; the answer here is <code>brac</code> (length 4). Same family as the fixed-size window, but this one breathes: right expands when it can, left contracts when it must. Spot it whenever a problem asks for the longest or shortest <em>substring</em> (a run of letters sitting next to each other) under a rule that flips on or off.</>,
          intuitive: <>The move has a name: the <strong>variable sliding window</strong>, same family as the fixed-size window, but this one breathes. (Our word&rsquo;s answer: <code>brac</code>, length 4.) Spot it whenever a question asks for the longest or shortest <em>stretch of neighbours</em> under a rule that can break and be fixed, and remember the engine underneath: reuse what you&rsquo;ve already checked.</>,
          rigorous: <>Sliding window, variable width; here the answer is <code>brac</code>, length 4. Triggers: longest/shortest <em>contiguous</em> run subject to a constraint, &ldquo;no repeats,&rdquo; &ldquo;at most k distinct,&rdquo; &ldquo;smallest window covering Y.&rdquo; Two monotone indices plus constant-time membership state give <Term word="O(n)"><code>O(n)</code></Term>; the constraint must break on growth and repair on shrink.</>,
        }),
      }],
      arrows: [{ x1: G.cx(2), y1: G.y + G.cellH + 34, x2: G.cx(2), y2: G.y + G.cellH + 4 }],
      codeLabels: ["result"],
      interaction: "none",
    },
  ],
};
