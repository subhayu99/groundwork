"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, gridGeom, GridCells, Pill } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import hash_mapsPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* The phone book — unsorted, "alice" last so the linear scan visibly grinds. */
const NAMES = ["harper", "dan", "maya", "cara", "leo", "bob", "ivy", "fawn", "kai", "grace", "eli", "june", "alice"];
const TARGET = "alice";

/* Illustrative polynomial hash (NOT Python's built-in hash) — matches visualizer.tsx. */
function hash(s: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % buckets;
}
const BUCKETS = 16;

/* Precompute which names land in which slot (slot 2 = 3-item chain, slot 12 = 2). */
const GROUPED: string[][] = Array.from({ length: BUCKETS }, () => []);
for (const n of NAMES) GROUPED[hash(n, BUCKETS)].push(n);
const COLLISION_SLOTS = GROUPED.map((b) => b.length > 1);

/* ── geometry ──────────────────────────────────────────────────────────────── */
// The phone-book scan: a single horizontal row of 13 name-cells in the middle band.
const ROW = rowGeom(NAMES.length, VW, 250, 50, 5, 44);
// The 16 slot boxes (Beat 3 wedge): one row of 16, middle band.
const SLOTS = rowGeom(BUCKETS, VW, 270, 44, 6, 44);
// The 4×4 bucket array (Beats 4–5).
const GRID = gridGeom(4, 4, VW, 206, 56, 8);
const slotRC = (i: number) => ({ r: Math.floor(i / 4), c: i % 4 });

/* ── Beat 2 playback: the linear scan grinds top→down until it hits alice ────── */
interface Scan { cursor: number; done: boolean; }
function LinearScan({ api }: { api: BeatVisualApi }) {
  const init = (): Scan => ({ cursor: -1, done: false });
  const [s, setS] = useState<Scan>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const next = c.cursor + 1;
      if (next >= NAMES.length || NAMES[next] === TARGET) { setS({ cursor: next, done: true }); return; }
      setS({ cursor: next, done: false });
    }, pace(360));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { cursor, done } = s;
  const found = done && cursor >= 0 && cursor < NAMES.length && NAMES[cursor] === TARGET;
  const tones: (Tone | undefined)[] = NAMES.map((_, i) =>
    found && i === cursor ? "good" : i === cursor ? "active" : i < cursor ? "muted" : undefined
  );
  const comparisons = cursor < 0 ? 0 : Math.min(cursor + 1, NAMES.length);

  return (
    <g>
      <CellRow geom={ROW} values={NAMES} tones={tones} fontSize={11} />
      <text x={VW / 2} y={ROW.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: found ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {found ? `read ${comparisons} names before "alice" — that is the cost` : `reading one by one… comparisons: ${comparisons}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={ROW.y + ROW.cellH + 30} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={ROW.y + ROW.cellH + 42} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── Beat 3 wedge: click a name chip; the hash computes its slot, one box lights ─ */
function HashAddress({ api }: { api: BeatVisualApi }) {
  const [picked, setPicked] = useState<string | null>(null);
  const chips = ["alice", "bob", "cara", "zoe"]; // zoe is NOT in the book

  const pick = (name: string) => {
    api.onInteractionDone();
    api.onActiveLine(["hm_slot"]);
    setPicked(name);
  };

  const slot = picked === null ? null : hash(picked, BUCKETS);
  const inBook = picked !== null && NAMES.includes(picked);

  // chip row
  const cw = 80, cg = 14, ctotal = chips.length * cw + (chips.length - 1) * cg, csx = (VW - ctotal) / 2, cy = 192;

  return (
    <g>
      {/* name chips to click */}
      {chips.map((name, i) => {
        const x = csx + i * (cw + cg), on = picked === name;
        return (
          <g key={name} onClick={() => pick(name)} style={{ cursor: "pointer", outline: "none" }} tabIndex={0} role="button" aria-label={`pick ${name}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(name); } }}>
            <rect x={x} y={cy} width={cw} height={30} rx={8}
              fill={on ? "color-mix(in oklab, var(--accent-sky) 28%, var(--bg-card))" : "var(--bg-card)"}
              stroke={on ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} />
            <text x={x + cw / 2} y={cy + 15} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 12, fill: "var(--text)" }}>{name}</text>
          </g>
        );
      })}
      {/* the computation line */}
      <text x={VW / 2} y={cy + 52} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>
        {picked === null ? "click a name — its letters get turned into a box number"
          : <>hash(&ldquo;{picked}&rdquo;) mod 16 = <tspan style={{ fill: "var(--accent)", fontSize: 15 }}>{slot}</tspan></>}
      </text>
      {/* the 16 slot boxes */}
      <CellRow geom={SLOTS} values={Array.from({ length: BUCKETS }, (_, i) => i)} fontSize={11}
        tones={Array.from({ length: BUCKETS }, (_, i) => (slot !== null && i === slot ? "active" : undefined))} />
      {slot !== null && <Pill x={SLOTS.cx(slot)} y={SLOTS.y + SLOTS.cellH + 7} text={picked!} />}
      <text x={VW / 2} y={SLOTS.y + SLOTS.cellH + 38} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        {picked === null ? "illustrative hash, not Python's built-in"
          : inBook ? "in the book — one hop, no searching" : `"${picked}" is not in the book — but we still went straight to a box`}
      </text>
    </g>
  );
}

/* ── Beat 4 playback: the 13 names drop into their hashed boxes one at a time ──── */
interface Drop { n: number; done: boolean; }
function DropIntoBuckets({ api }: { api: BeatVisualApi }) {
  const init = (): Drop => ({ n: 0, done: false });
  const [s, setS] = useState<Drop>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      api.onActiveLine(["hm_put_slot", "hm_put_append"]);
      if (c.n >= NAMES.length) { setS({ ...c, done: true }); return; }
      setS({ n: c.n + 1, done: c.n + 1 >= NAMES.length });
    }, pace(420));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // names placed so far → which slots they fill
  const placed = NAMES.slice(0, s.n);
  const filled: string[][] = Array.from({ length: BUCKETS }, () => []);
  for (const nm of placed) filled[hash(nm, BUCKETS)].push(nm);
  const lastSlot = s.n > 0 ? hash(NAMES[s.n - 1], BUCKETS) : -1;

  return (
    <g>
      <GridCells rows={4} cols={4} geom={GRID}
        cell={(r, c) => {
          const i = r * 4 + c, names = filled[i];
          return {
            tone: (i === lastSlot ? "active" : names.length ? "visited" : undefined) as Tone | undefined,
            content: <tspan style={{ fontSize: 10 }}>{names.length ? names.join(",") : i}</tspan>,
          };
        }} />
      <text x={VW / 2} y={GRID.y0 - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: s.done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {s.done ? "every name landed in a computed box — no searching" : `dropping names into boxes… ${s.n}/${NAMES.length}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={GRID.y0 + 4 * (GRID.cellPx + GRID.gap) + 4} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={GRID.y0 + 4 * (GRID.cellPx + GRID.gap) + 16} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── PREDICTION GATE + playback (Beat 4): commit to whether names will share a
 * box, THEN watch the drop answer it. The gate is the beat's real interaction
 * (interaction: "wedge"): one pill tap fires api.onInteractionDone() inside
 * PredictGate, feedback shows, and after a short reading pause the
 * DropIntoBuckets playback runs and answers the prediction on canvas. HTML
 * hosted on the SVG canvas via <foreignObject> per Predict.tsx; the inner
 * data-canvas-panel div opts it into the scene layout's extent measurement.
 * Pre-reveal reuses the SLOTS row geometry from the wedge beat — the same 16
 * boxes the learner just hashed into, now waiting empty. */
function BucketDropGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <DropIntoBuckets api={api} />;

  return (
    <g>
      <text x={VW / 2} y={240} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        13 names are about to drop into these 16 boxes &mdash; each goes where its hash says
      </text>
      <CellRow geom={SLOTS} values={Array.from({ length: BUCKETS }, (_, i) => i)} fontSize={11} />
      <foreignObject x={190} y={336} width={480} height={130} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="13 names, 16 boxes — does every name get a box to itself?"
            choices={[
              { id: "own", label: "yes — 16 boxes is room enough", note: "room isn't the issue — the hash assigns boxes blindly, so two names can still get the same number" },
              { id: "share", label: "some names will share a box", correct: true, note: "nothing stops two names from hashing to the same number — watch box 2" },
              { id: "never", label: "a good hash never doubles up", note: "a hash only spreads names evenly — it can't promise different names different numbers" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1800)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── static bucket grid (Beat 5): collisions in warn tone ─────────────────────── */
function CollisionGrid() {
  return (
    <g>
      <GridCells rows={4} cols={4} geom={GRID}
        cell={(r, c) => {
          const i = r * 4 + c, names = GROUPED[i];
          return {
            tone: (COLLISION_SLOTS[i] ? "muted" : names.length ? "visited" : undefined) as Tone | undefined,
            content: <tspan style={{ fontSize: 9 }}>{names.length ? names.join(",") : i}</tspan>,
          };
        }} />
      <text x={VW / 2} y={GRID.y0 - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        13 names in 16 boxes · yellow = more than one name shares a box — chain them
      </text>
    </g>
  );
}

/* ── Beat 6: two-column "use it / don't" board ────────────────────────────────── */
function FitBoard() {
  const yes = ["count words", "cache results", "dedupe a list", "join on a field"];
  const cw = 230, ch = 38, gap = 12, lx = 150, rx = 480, y0 = 256;
  return (
    <g>
      <text x={lx + cw / 2} y={y0 - 16} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>use a hash map — &ldquo;given X, find Y&rdquo;</text>
      {yes.map((t, i) => {
        const y = y0 + i * (ch + gap);
        return (
          <g key={t}>
            <rect x={lx} y={y} width={cw} height={ch} rx={8} fill="color-mix(in oklab, var(--diff-easy) 16%, var(--bg-card))" stroke="var(--diff-easy)" strokeWidth={2} />
            <text x={lx + 14} y={y + ch / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{t}</text>
          </g>
        );
      })}
      <text x={rx + cw / 2} y={y0 - 16} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>it can&rsquo;t do this</text>
      <g>
        <rect x={rx} y={y0} width={cw} height={ch * 2 + gap} rx={8} fill="color-mix(in oklab, var(--diff-hard) 14%, var(--bg-card))" stroke="var(--diff-hard)" strokeWidth={2} />
        <text x={rx + cw / 2} y={y0 + ch - 4} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>keep things in order, or</text>
        <text x={rx + cw / 2} y={y0 + ch + 14} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>&ldquo;all keys between A and M&rdquo;</text>
        <text x={rx + cw / 2} y={y0 + ch * 2 + gap + 18} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>→ for that, use a tree</text>
      </g>
    </g>
  );
}

/* ── Beat 7: summary card ─────────────────────────────────────────────────────── */
function SummaryCard() {
  const rows: [string, string, string][] = [
    ["insert", "O(1) average", "easy"],
    ["look up by key", "O(1) average", "easy"],
    ["delete by key", "O(1) average", "easy"],
    ["membership (is it in?)", "O(1) average", "easy"],
    ["iterate everything", "O(n)", "med"],
    ["order / range query", "use a tree", "hard"],
  ];
  const tx = 250, ty = 250, rh = 22;
  const color = (k: string) => k === "easy" ? "var(--diff-easy)" : k === "med" ? "var(--diff-med)" : "var(--diff-hard)";
  return (
    <g>
      <text x={VW / 2} y={ty - 32} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 14 }}>
        <tspan style={{ fill: "var(--text)" }}>phone[</tspan>
        <tspan style={{ fill: "var(--accent)" }}>&ldquo;alice&rdquo;</tspan>
        <tspan style={{ fill: "var(--text)" }}>] → </tspan>
        <tspan style={{ fill: "var(--diff-easy)" }}>+1-555-0102</tspan>
        <tspan style={{ fill: "var(--text-faint)" }}>  in 1 hop</tspan>
      </text>
      {rows.map(([op, cost, k], i) => {
        const y = ty + i * rh;
        return (
          <g key={op}>
            <text x={tx} y={y} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{op}</text>
            <text x={VW - tx} y={y} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: color(k) }}>{cost}</text>
          </g>
        );
      })}
      <text x={VW / 2} y={ty + rows.length * rh + 8} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>trade space for time</text>
    </g>
  );
}

/* ── static idle visuals for non-animating beats ─────────────────────────────── */
const idleRow = (tones?: (Tone | undefined)[]) => <CellRow geom={ROW} values={NAMES} tones={tones} fontSize={11} />;

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, scan, wedge, structure, operations, fit, name)
 *   structured : 5 — cuts `scan` (its count folds into the wedge connector) and `fit`
 *   rigorous   : 3 — `structure` (invariant + the collision gate) ·
 *                `operations` (exact costs + edge cases) · `name` (close + stamp)
 *   refresh    : additionally trims `scan` + `fit` (trimOnRefresh).            */
export const hashMapsLesson: LessonSpec = {
  topicTitle: "hash maps · find Alice's number",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: hash_mapsPy as string,
  // standing on arrays (the bridge anchor, per TRACK-NARRATIVES.md): slot i is
  // one step — IF you already know i. Here the key computes its own i.
  bridgeFrom: reg({
    base: "You can grab slot i of an array in one step — if you know i. Now the key itself will compute that number.",
    intuitive: "You can jump straight to any numbered box in a row — next, a name turns itself into its box number.",
    rigorous: "arr[i] is one step of address arithmetic — given i. A hash computes i from the key itself.",
  }),
  // Stamp (TRACK-NARRATIVES row 14, from meta): hash maps are the track's payoff
  // for trade-space-for-time — claimed outright at the close, not foreshadowed.
  principle: { key: "trade-space-for-time", n: 5, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: reg({
        base: "An unordered phone book — find one name without paying for the whole book.",
        intuitive: "One question drives everything: what does finding a single name have to cost?",
      }),
      visual: idleRow(),
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The setup", title: "A phone book of ten thousand names. Find Alice.",
        body: reg({
          base: <>A phone book &mdash; ten thousand names, in no order. Someone asks for Alice&rsquo;s number. You don&rsquo;t know her page, or even if she&rsquo;s listed. Every answer costs work. How much does finding one name cost?</>,
          intuitive: <>A phone book with ten thousand names &mdash; and nobody sorted it. Someone asks for Alice&rsquo;s number. You don&rsquo;t know her page. You don&rsquo;t even know if she&rsquo;s listed. The whole lesson is one question: how much work does finding one name cost?</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Picture a real phone book with ten thousand names and numbers &mdash; and, to make it hard, they&rsquo;re in <em>no</em> order at all. Someone walks up and asks, &ldquo;What&rsquo;s Alice&rsquo;s number?&rdquo;</p>
            <p>You don&rsquo;t know which page she&rsquo;s on. You don&rsquo;t even know if she&rsquo;s in the book at all. The only way to answer is to do some <strong>work</strong> &mdash; flip pages, read names, compare. The whole question of this lesson is: how much work does finding <em>one</em> name have to cost?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Hold the picture in your head: a real phone book, ten thousand names with a number next to each &mdash; and, to make it hard, in no order at all. Someone walks up: &ldquo;What&rsquo;s Alice&rsquo;s number?&rdquo;</p>
            <p>You can&rsquo;t guess her page. You can&rsquo;t even be sure she&rsquo;s in there. Any honest answer costs <strong>work</strong> &mdash; flipping pages, reading names, comparing. So before any clever trick, pin the question down: how much work should finding <em>one</em> name cost?</p>
          </>
        ),
      }),
      codeLabels: [],
    },
    {
      id: "scan",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "With no order to lean on, the only sure way to answer is to look at the names yourself.",
      actionLabel: "Compute, don't search",
      takeaway: "Reading name by name is O(n) — work grows with the size of the book.",
      visual: (api) => <LinearScan api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Open page one. Start reading.",
        body: <>The simple way: <strong>scan</strong> &mdash; read names top to bottom until you hit Alice. If she&rsquo;s the 4,872nd, that&rsquo;s 4,872 reads; if missing, all ten thousand. The work grows in step with the count of names &mdash; we call that <Term word="O(n)"><strong>O(n)</strong></Term>. What if the name told you the page?</>,
      }],
      detail: (
        <>
          <p>The simplest approach: start at the top and read every name in turn until you hit <em>Alice</em>. This is called a <strong>linear scan</strong> &mdash; &ldquo;linear&rdquo; because the work goes up in a straight line with the size of the book. If she&rsquo;s the 4,872nd name, that&rsquo;s 4,872 reads. If she isn&rsquo;t in the book at all, you read all ten thousand before you can say so.</p>
          <p>Computer people write that worst case as <strong><code>O(n)</code></strong> (&ldquo;order n&rdquo;): the cost grows in step with <code>n</code>, the number of names. Double the book and you double the work. Sorting the book first would let you use a smarter search &mdash; about 14 checks for ten thousand &mdash; but that still isn&rsquo;t free, and you&rsquo;d have to keep it sorted every time someone is added.</p>
          <p>So here&rsquo;s the real question: what if there were <em>no searching at all</em>? What if the name itself <em>told you</em> the page?</p>
        </>
      ),
      arrows: [{ x1: ROW.cx(1), y1: 184, x2: ROW.cx(1), y2: ROW.y - 4 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "That last question — what if the name told you the page? — is exactly the move we make now.",
        intuitive: "Scanning paid one look per name. The move now: make the name itself tell you the page.",
        structured: "A scan pays a read per name — 4,872 reads if Alice sits that deep, all ten thousand on a miss: O(n). Change the move — compute where she lives.",
      }),
      actionLabel: "Compute the address",
      takeaway: reg({
        base: "A hash turns the key itself into a box number — one hop, no searching.",
        intuitive: "A name's own letters become its box number — you jump straight there, no searching.",
      }),
      visual: (api) => <HashAddress api={api} />,
      panels: [
        {
          left: 150, top: 22, width: 580, variant: "main", label: "The instinct", title: "Pick a name. Watch its address appear.",
          body: reg({
            base: <>Click a name and a <strong>hash function</strong> &mdash; a recipe that turns the letters into a number &mdash; hands you a box. It searches nothing; it computes a number, then takes it mod 16 (the remainder, landing in box 0&ndash;15). One hop, however huge the book.</>,
            intuitive: <>Click a name. A <strong>hash function</strong> &mdash; a fixed recipe that turns letters into a number &mdash; hands you a box on the spot. It looks nothing up; it computes, the way <code>3 + 4</code> always makes <code>7</code>. The raw number is huge, so we keep just the remainder after dividing by 16 &mdash; that&rsquo;s &ldquo;mod 16&rdquo; &mdash; which always lands in box 0&ndash;15. One hop, however huge the book.</>,
          }),
        },
        {
          left: 250, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what if every key knew where to find itself?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Click a name above. A <strong>hash function</strong> &mdash; a fixed recipe that turns the letters of a name into a number &mdash; reads its characters and hands you a box number. It doesn&rsquo;t look anything up; it just <em>computes</em>, the way <code>3 + 4</code> always gives <code>7</code>. Same name in, same number out, every time.</p>
            <p>The raw number can be huge, so we take it <code>mod 16</code> &mdash; the <em>remainder</em> after dividing by 16 &mdash; which always lands between 0 and 15, one of our boxes. Try a name that isn&rsquo;t even in the book: you still get a box instantly, because the recipe never searches &mdash; it computes.</p>
            <p>And here&rsquo;s why it matters: the answer is <em>one hop</em>, whether the book holds ten names or ten million. The size of the book never enters into it.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> what if every key knew where to find itself?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Try every chip. The same name always lands in the same box &mdash; that&rsquo;s the whole promise of a <strong>hash function</strong>: a fixed recipe, letters in, number out, no memory and no luck involved.</p>
            <p>The recipe&rsquo;s raw number can be enormous, so we keep only the <em>remainder</em> after dividing by 16 &mdash; written &ldquo;mod 16&rdquo; &mdash; and a remainder is always 0 to 15, so it always names one of our 16 boxes.</p>
            <p>Now try <code>zoe</code>, who isn&rsquo;t in the book at all. You <em>still</em> get a box instantly &mdash; because nothing was searched. The recipe doesn&rsquo;t know who&rsquo;s listed; it just turns letters into a number. Whether zoe is really there is answered by opening that one box.</p>
            <p>Feel the size of this: one hop for a book of ten names, one hop for ten million. The book&rsquo;s size never enters the recipe.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> what if every key knew where to find itself?
            </div>
          </>
        ),
      }),
      codeLabels: ["hm_slot"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      connector: reg({
        base: "Now that a name can name its own box, we just need the row of boxes to drop names into.",
        rigorous: "Two pieces — a bucket array and a hash to address it — generate every cost a hash map charges.",
      }),
      actionLabel: "What's the actual cost?",
      takeaway: reg({
        base: "A hash map = an array of buckets + the hash that addresses them.",
        intuitive: "A hash map is a row of boxes plus the recipe that turns a key into its box number.",
        rigorous: "Invariant: a key lives in its hashed bucket or nowhere — position computed, never searched.",
      }),
      visual: (api) => <BucketDropGate api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The structure",
        title: reg({
          base: "An array of boxes, addressed by the hash.",
          rigorous: "Bucket array + hash function.",
        }),
        body: reg({
          base: <>A hash map is two parts: a numbered row of slots called <strong>buckets</strong> (jumping to box <Term word="arr[i]"><code>arr[i]</code></Term> is instant, however many there are), plus the hash function. To store a name, hash it and drop it in that box. Most boxes hold one; some get crowded.</>,
          intuitive: <>A hash map is two parts glued together: a numbered row of boxes called <strong>buckets</strong> &mdash; the array you already know, where jumping to box <code>i</code> is one step &mdash; plus the letters-to-number recipe. Storing a name is hash, then drop. Predict below, then watch the names rain in.</>,
          rigorous: <>Two components: an array of <code>m</code> buckets (the index jump is address arithmetic &mdash; one step at any <code>m</code>) and a hash <code>h</code>. The invariant: a key lives in bucket <code>h(key) mod m</code>, or nowhere. Store: hash, jump, append. Find: the same hash and jump, then a walk of that one bucket only. Predict the wrinkle, then run it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>A <strong>hash map</strong> is just two simple pieces glued together.</p>
            <p>The first piece is an <strong>array of boxes</strong> &mdash; a numbered row of slots, here called <strong>buckets</strong>. An array is the most basic store there is, and its superpower is that jumping straight to box number <code>i</code> (written <code>arr[i]</code>) is <em>instant</em> &mdash; the computer leaps right to it without scanning past the others, no matter how many boxes there are.</p>
            <p>The second piece is the <strong>hash function</strong> from the last step: feed it a key &mdash; a name, a number, anything &mdash; and it produces a box number. A good hash spreads keys evenly so no single box gets overloaded.</p>
            <p>Put them together and storing is trivial: hash the name to get a box, drop it in. Finding it later is the same move &mdash; hash, then look in that one box. No searching anywhere, just arithmetic. Watch the names rain into their computed boxes; most boxes end up with one name, a few get crowded.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Tap your guess first &mdash; then watch the rain. A <strong>hash map</strong> is just two simple pieces working together.</p>
            <p>Piece one: an <strong>array of boxes</strong>, here called <strong>buckets</strong>. You met this row in the arrays lesson &mdash; its superpower is that jumping to box number <code>i</code> is one step, whether there are 16 boxes or 16 million.</p>
            <p>Piece two: the recipe from the last step. Feed it any key &mdash; a name, a word, a number &mdash; and it answers with a box number. A good recipe spreads names out evenly, so no box gets swamped.</p>
            <p>Storing is hash-then-drop; finding is hash-then-open-that-one-box. Nothing is ever searched. But watch what the playback shows: 13 names, 16 boxes &mdash; and the recipe assigns boxes blindly, with no list of who took what. Whether every name still gets its own box is exactly what your guess is about.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The structure.</strong> <code>buckets = [[] for _ in range(m)]</code>; <code>slot(key) = hash(key) % m</code>. Put: compute the slot, append to that bucket. Get: compute the slot, scan that one bucket. The hash is deterministic, so the invariant holds across every operation: a key is findable in exactly one bucket &mdash; the structure never searches for a position, it computes one.</p>
            <p>Count the work: one hash evaluation, one index jump, then a walk bounded by that bucket&rsquo;s chain length &mdash; never by <code>n</code>. Performance therefore reduces entirely to keeping chains short. Determinism cuts both ways, though: it guarantees you re-find every key, and it cannot forbid two keys from computing the same slot. Commit to the prediction, then run the drop.</p>
          </>
        ),
      }),
      arrows: [{ x1: GRID.cx(0, 0), y1: 188, x2: GRID.cx(0, 0), y2: GRID.cy(0, 0) - GRID.cellPx / 2 - 4 }],
      codeLabels: ["hm_put_slot", "hm_put_append"],
      interaction: "wedge",
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "We watched a few boxes get crowded as names landed — so what does that crowding cost us?",
        rigorous: "The sharing you predicted happened on screen — now price it exactly.",
      }),
      actionLabel: reg({
        base: "When it fits",
        structured: "Name the structure",
        rigorous: "Name the structure",
      }),
      takeaway: reg({
        base: "Insert, look up, delete are O(1) on average — chaining absorbs collisions.",
        intuitive: "Add, find, delete stay a few flat hops on average — shared boxes stay short.",
        rigorous: "Expected O(1) at constant load factor; worst case O(n); resizes amortize to O(1).",
      }),
      visual: <CollisionGrid />,
      panels: [
        {
          left: 150, top: 22, width: 580, variant: "main", label: "The operations", title: "Constant time — on average.",
          body: reg({
            base: <>Insert, look up, delete: all <Term word="O(1)"><strong>O(1)</strong></Term> on average &mdash; cost stays flat, ten keys or ten million. A <strong>collision</strong> is two keys landing in one box; we <strong>chain</strong> them (keep a small list in that box) so both fit. When it fills, we build a bigger one &mdash; slow, but rare.</>,
            intuitive: <>Count the hops: add is hash-and-drop; find is hash, open one box, read a name or three; delete is the same trip. Ten names or ten million, the count doesn&rsquo;t change &mdash; flat cost like that is written <Term word="O(1)"><code>O(1)</code></Term>. It&rsquo;s &ldquo;on average&rdquo; because of two wrinkles: a <strong>collision</strong> (two names, one box &mdash; chain them in a tiny list) and the rare rebuild when the table fills.</>,
            rigorous: <>Put, get, delete each cost one hash + one jump + a chain walk of expected length &alpha; = n/m, the <strong>load factor</strong> &mdash; held constant by resizing, that count is <Term word="O(1)"><code>O(1)</code></Term> expected. Worst case, every key in one bucket: <Term word="O(n)"><code>O(n)</code></Term>. A resize doubles <code>m</code> and rehashes all <code>n</code> &mdash; <Term word="amortized">amortized</Term> O(1) per insert.</>,
          }),
        },
        {
          left: 568, top: 300, width: 282, variant: "note",
          body: reg({
            base: <>Box 2 holds three names &mdash; <code>fawn, eli, june</code>. Looking one up still walks only that one short box, never the whole table.</>,
            rigorous: <>The worst case is real: keys engineered to share one bucket degrade lookups to <Term word="O(n)"><code>O(n)</code></Term> &mdash; which is why Python randomizes string hashing per process.</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p>The three everyday moves &mdash; <strong>insert</strong> (add a key), <strong>look up</strong> (find its value), and <strong>delete</strong> &mdash; all cost <strong><code>O(1)</code></strong> on average. <code>O(1)</code> means <em>constant time</em>: the cost stays flat whether the table holds ten keys or ten million, because hashing jumps straight to the right box. Notice the word <em>average</em> &mdash; that&rsquo;s the honest version, and here are the two wrinkles behind it.</p>
            <p>First, <strong>collisions</strong>. Sometimes two different keys hash to the <em>same</em> box &mdash; on the canvas, box 2 holds three names at once. We handle it by <strong>chaining</strong>: each box keeps a tiny list, and all of them live there side by side. To look one up, you hash to the box and then walk only that short list &mdash; never the whole table. As long as boxes stay short, this barely costs anything.</p>
            <p>Second, <strong>resizing</strong>. When the table gets too full, we build a bigger array and re-drop every key into it. That one step is <code>O(n)</code> &mdash; it touches all <code>n</code> keys &mdash; so it&rsquo;s genuinely slow. But it happens so rarely that, spread across the many cheap inserts around it, the cost-per-insert <em>averaged out</em> is still tiny. That&rsquo;s the whole meaning of &ldquo;O(1) on average&rdquo;: the one slow step is rare enough to vanish in the average.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Price each everyday move by counting hops. <strong>Insert</strong>: hash the name, drop it in its box &mdash; two quick steps. <strong>Look up</strong>: hash, open that one box, read the name or the two or three sharing it. <strong>Delete</strong>: the same trip, then cross one out. None of those counts care how big the book is &mdash; work that stays flat like that is <Term word="O(1)"><code>O(1)</code></Term>, &ldquo;constant time.&rdquo;</p>
            <p>Wrinkle one: <strong>collisions</strong>. Two names can land on the same box number &mdash; on the canvas, box 2 caught three. The fix is to <strong>chain</strong> them: that box keeps a tiny list, and a lookup walks only that list, never the whole table. Three names instead of one is barely slower; ten thousand in one box would be a disaster &mdash; which is exactly why the recipe spreads names evenly.</p>
            <p>Wrinkle two: <strong>the rebuild</strong>. When the table gets crowded, we make a bigger row of boxes and re-drop every name. That one moment really does touch all <code>n</code> names &mdash; <Term word="O(n)"><code>O(n)</code></Term> &mdash; but it&rsquo;s rare, and spread across the thousands of cheap drops around it the average cost stays tiny. Cost smoothed out like that is called <Term word="amortized">amortized</Term>. That&rsquo;s the honest meaning of &ldquo;O(1) on average.&rdquo;</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> Put, get, delete: one hash + one index + an expected &alpha; = n/m chain walk &mdash; expected <Term word="O(1)"><code>O(1)</code></Term> under uniform hashing with &alpha; bounded (CPython resizes around two-thirds full). Worst case &mdash; all keys in one bucket &mdash; is <Term word="O(n)"><code>O(n)</code></Term>. A resize rehashes all <code>n</code> keys into <code>2m</code> buckets: O(n) once, <Term word="amortized">amortized</Term> O(1) per insert. Iterating everything is O(n); any order you observe (CPython preserves insertion order) is an implementation promise, not a hash-table property.</p>
            <p><strong>Edges.</strong> A miss walks the full chain before <code>KeyError</code> &mdash; absence costs as much as a hit. The empty map still computes a slot; the bucket is just empty. Keys must be hashable, hence immutable &mdash; a <code>list</code> can&rsquo;t key a dict, since mutating it would change its slot and orphan the entry. Equal keys must hash equal &mdash; the contract that makes overwrite-on-put correct. And adversarial keys forcing one bucket are why string hashes are randomized per process.</p>
          </>
        ),
      }),
      arrows: [{ x1: GRID.cx(0, 2), y1: 188, x2: GRID.cx(0, 2), y2: GRID.cy(0, 2) - GRID.cellPx / 2 - 4 }],
      codeLabels: ["hm_put_scan", "hm_put_overwrite", "hm_get_scan"],
    },
    {
      id: "fit",
      label: "When it fits",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that the costs are clear and almost always cheap, the useful question is: when do you reach for one?",
      actionLabel: "Name the structure",
      takeaway: "Reach for it on “given X, find Y”; reach for a tree when you need order.",
      visual: <FitBoard />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When it fits", title: "Lookups by key. Counting. Caching. Most things.",
        body: <>Reach for a hash map whenever you&rsquo;d say &ldquo;given X, find Y&rdquo; &mdash; counting how often each word appears, saving (<strong>caching</strong>) a slow result to reuse, removing duplicates, joining two datasets. The one thing it can&rsquo;t do: keep order, or answer &ldquo;all keys between A and M.&rdquo;</>,
      }],
      detail: (
        <>
          <p>The simplest tell: reach for a hash map any time you can phrase the job as <strong>&ldquo;given X, find Y&rdquo;</strong> &mdash; given a name, find a number; given a word, find its count. If you have a key and want the thing attached to it, this is the tool.</p>
          <p>That covers an enormous amount of real work:</p>
          <ul>
            <li><strong>Counting</strong> &mdash; how many times each word appears in a document (the word is the key, the count is the value).</li>
            <li><strong>Caching</strong> &mdash; saving the result of a slow computation under its inputs, so the next time the same inputs show up you reuse the answer instead of redoing the work.</li>
            <li><strong>Deduplicating</strong> &mdash; remembering what you&rsquo;ve already seen so you can drop repeats from a stream.</li>
            <li><strong>Joining</strong> &mdash; matching up two datasets on a shared field, like stitching orders to customers by id.</li>
          </ul>
          <p>The one thing a hash map <em>cannot</em> do is keep things in any meaningful order, or answer a <strong>range</strong> question like &ldquo;all keys between A and M.&rdquo; The boxes are scattered by the hash on purpose, so order is gone. When you need order or ranges, you reach for a <strong>tree</strong> instead.</p>
        </>
      ),
      codeLabels: ["lookup", "membership"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: reg({
        base: "You've now built the whole idea from scratch — so here's the name you'll meet it under everywhere.",
        rigorous: "Name it, and file it under the idea it proves.",
      }),
      takeaway: reg({
        base: "It’s the hash map / dictionary — trade memory so you never search.",
        intuitive: "Hash map = dictionary: spend extra boxes so any key is one hop away.",
        rigorous: "dict is a hash table: O(1)-average key ops bought with memory — space traded for time.",
      }),
      visual: <SummaryCard />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Hash map. A dictionary, in Python.",
        body: reg({
          base: <>That&rsquo;s the named pattern: hash map, hash table, <strong>dictionary</strong> (a store of key&rarr;value pairs) &mdash; same idea everywhere. Python&rsquo;s <code>dict</code> is one; so are JavaScript&rsquo;s <code>Map</code> and Java&rsquo;s <code>HashMap</code>. The principle underneath: spend memory to never search.</>,
          intuitive: <>The thing you built has a name &mdash; several, actually: <strong>hash map</strong>, hash table, <strong>dictionary</strong>. Python&rsquo;s <code>dict</code> is one; so is JavaScript&rsquo;s <code>Map</code>. And the deal underneath is idea 5 of 7, <strong>trade space for time</strong>: spend a roomy row of boxes so finding anything is one hop &mdash; never a search.</>,
          rigorous: <>Hash map / hash table / dictionary / associative array &mdash; one structure. Python&rsquo;s <code>dict</code>, Java&rsquo;s <code>HashMap</code>, Go&rsquo;s <code>map</code>: same cost model. It is the full statement of <strong>trade-space-for-time</strong>, idea 5 of 7: memory spent on sparse buckets buys O(1)-average membership &mdash; cost decoupled from <code>n</code>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Different languages give this same idea different names: <em>hash map</em>, <em>hash table</em>, <strong>dictionary</strong>, <em>associative array</em>. They all mean the one thing you just built &mdash; a store of <strong>key&rarr;value pairs</strong>, where you hand it a key and it hands you back the value in one hop.</p>
            <p>You already use these constantly. Python&rsquo;s <code>dict</code> is a hash map. So is JavaScript&rsquo;s <code>Map</code> (and, loosely, its plain objects), Java&rsquo;s <code>HashMap</code>, and Go&rsquo;s <code>map</code>. It&rsquo;s the workhorse data structure of everyday programming &mdash; the thing you reach for without even thinking.</p>
            <p>And underneath it all sits one of the deepest ideas in computer science: <strong>trade space for time</strong>. We set aside a big array of boxes &mdash; spending memory we didn&rsquo;t strictly need &mdash; precisely so we never have to search. That trade is why <code>phone[&ldquo;alice&rdquo;]</code> finds Alice&rsquo;s number in a single step instead of ten thousand.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 5 of 7 &mdash; trade space for time:</strong> spend memory on a clever filing system and &ldquo;is it here?&rdquo; stops depending on size.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Different languages, one idea: <em>hash map</em>, <em>hash table</em>, <strong>dictionary</strong>, <em>associative array</em>. All of them are the machine you just built &mdash; a store of <strong>key&rarr;value pairs</strong>, where you hand over a key and get its value back in a hop.</p>
            <p>You&rsquo;ll use this constantly without ceremony: Python&rsquo;s <code>dict</code>, JavaScript&rsquo;s <code>Map</code>, Java&rsquo;s <code>HashMap</code>, Go&rsquo;s <code>map</code>. It&rsquo;s the workhorse of everyday code &mdash; the thing programmers reach for without thinking.</p>
            <p>And remember where the magic came from. In arrays you paid a strict layout to make <em>positions</em> instant &mdash; a seed. Here the seed flowered: we set aside a whole roomy row of boxes &mdash; memory we didn&rsquo;t strictly need &mdash; so that <code>phone[&ldquo;alice&rdquo;]</code> is one hop instead of ten thousand reads.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The big idea, claimed (5 of 7) &mdash; trade space for time:</strong> write it down in the right place and you can look it up instantly &mdash; size stops mattering.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>Hash table: a bucket array addressed by a hash of the key. Python&rsquo;s <code>dict</code> (open addressing, randomized string hashes, resize near two-thirds load), Java&rsquo;s <code>HashMap</code> (chaining, long chains treeified), Go&rsquo;s <code>map</code> &mdash; implementations differ, the cost model doesn&rsquo;t: expected O(1) put/get/delete, O(n) worst case, no order, no range queries.</p>
            <p><strong>Trade space for time, idea 5 of 7</strong> &mdash; here as the theorem, not the seed: arrays bought O(1) <em>position</em> with layout; the hash map spends sparse buckets to buy O(1) <em>membership</em>. Memoization and caching replay this exact trade.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 5 of 7 &mdash; trade space for time:</strong> spend memory so the answer is looked up, never searched for &mdash; cost decoupled from n.
            </div>
          </>
        ),
      }),
      codeLabels: ["dict_init", "insert", "lookup"],
    },
  ],
};
