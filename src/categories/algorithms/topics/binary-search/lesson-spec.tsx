"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import binarySearchPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [3, 7, 11, 14, 19, 23, 27, 32, 38, 44, 51, 59, 68, 74, 81];
const TARGET = 27; // index 6
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* ── interactive: click a page, half the book goes dark (the instinct) ───────── */
function ClickToHalve({ api }: { api: BeatVisualApi }) {
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(ARR.length - 1);
  const [last, setLast] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const click = (i: number) => {
    api.onInteractionDone();
    if (i < lo || i > hi || done) return;
    setLast(i);
    if (ARR[i] === TARGET) { api.onActiveLine(["compare", "found"]); setDone(true); return; }
    if (ARR[i] < TARGET) { api.onActiveLine(["less", "lo_update"]); setLo(i + 1); }
    else { api.onActiveLine(["greater", "hi_update"]); setHi(i - 1); }
  };

  const reset = () => { setLo(0); setHi(ARR.length - 1); setLast(null); setDone(false); };
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (done && i === last ? "good" : i === last ? "active" : undefined));
  const dim = ARR.map((_, i) => i < lo || i > hi);

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} onCellClick={click} cellEnabled={(i) => i >= lo && i <= hi && !done} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {last === null ? "click any page to guess" : done ? `found 27 at index ${last}` : `${ARR[last]} ${ARR[last] < TARGET ? "< 27 — left half gone" : "> 27 — right half gone"}`}
      </text>
      <g onClick={reset} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 - 28} y={G.y + G.cellH + 40} width={56} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── playback: binary search runs itself, the code line follows each frame ─── */
interface BS { lo: number; hi: number; mid: number | null; done: boolean; found: boolean; }
function AutoBinarySearch({ api }: { api: BeatVisualApi }) {
  const init = (): BS => ({ lo: 0, hi: ARR.length - 1, mid: null, done: false, found: false });
  const [s, setS] = useState<BS>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.lo > c.hi) { api.onActiveLine(["notfound"]); setS({ ...c, mid: null, done: true }); return; }
      const m = Math.floor((c.lo + c.hi) / 2);
      if (ARR[m] === TARGET) { api.onActiveLine(["compare", "found"]); setS({ ...c, mid: m, done: true, found: true }); return; }
      if (ARR[m] < TARGET) { api.onActiveLine(["less", "lo_update"]); setS({ ...c, mid: m, lo: m + 1 }); }
      else { api.onActiveLine(["greater", "hi_update"]); setS({ ...c, mid: m, hi: m - 1 }); }
    }, pace(950));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { lo, hi, mid, done, found } = s;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (found && i === mid ? "good" : i === mid ? "active" : undefined));
  const dim = ARR.map((_, i) => i < lo || i > hi);
  const markers: Record<number, string> = {};
  if (lo <= hi) { markers[lo] = "lo"; markers[hi] = "hi"; }
  if (mid !== null) markers[mid] = "mid";

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? (found ? "found 27 ✓" : "not found") : mid === null ? "starting…" : `check middle (${ARR[mid]}) → ${ARR[mid] < TARGET ? "go right" : ARR[mid] > TARGET ? "go left" : "match"}`}
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
function HalvingCascade() {
  const seq = [1000, 500, 250, 125, 62, 31, 15, 7, 3, 1];
  const bw = 58, bg = 10, total = seq.length * bw + (seq.length - 1) * bg, sx = (VW - total) / 2, y = 250;
  return (
    <g>
      {seq.map((n, i) => {
        const x = sx + i * (bw + bg);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={36} rx={7} fill="color-mix(in oklab, var(--accent-sky) 16%, var(--bg-card))" stroke="var(--accent-line)" strokeWidth={1.5} />
            <text x={x + bw / 2} y={y + 18} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--text)" }}>{n.toLocaleString()}</text>
            {i < seq.length - 1 && <text x={x + bw + bg / 2} y={y + 18} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fill: "var(--text-faint)" }}>›</text>}
          </g>
        );
      })}
      <text x={VW / 2} y={y + 64} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>1,000 → 1 in ~10 halvings · a million → ~20</text>
    </g>
  );
}

/* ── PREDICTION GATE + reveal: commit to the cost of halving, THEN count it ──
 * The lesson's ONE prediction gate (BEAT-RITUAL: the cost predict sits right
 * before the cost reveal). The learner has felt one halving in the wedge but
 * hasn't counted the cascade — one tap on a pill is the real interaction
 * (interaction: "wedge"; PredictGate fires api.onInteractionDone()), then after
 * a short reading pause the HalvingCascade answers the prediction. The gate is
 * HTML hosted on the SVG canvas via <foreignObject>; data-canvas-panel opts it
 * into the scene layout's content-extent measurement. */
function HalvingCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <HalvingCascade />;

  return (
    <g>
      <text x={VW / 2} y={214} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        page by page could take up to 1,000 looks &mdash; now price the halving way
      </text>
      <foreignObject x={190} y={240} width={480} height={200}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Every look halves what's left — about how many looks from 1,000 pages to the last one?"
            choices={[
              { id: "half", label: "about 500 — half the looks", note: "one halving spares 500, but the next look halves the 500, and the next halves again" },
              { id: "hundred", label: "about 100", note: "smaller still — every single look halves everything that's left" },
              { id: "ten", label: "about 10", correct: true, note: "1,000 → 500 → 250 … ten halvings corner the last page" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

function Boundary() {
  const n = 10, bw = 48, bg = 8, total = n * bw + (n - 1) * bg, sx = (VW - total) / 2, y = 252, boundary = 6;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = sx + i * (bw + bg), yes = i >= boundary;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={40} rx={8}
              fill={yes ? "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))" : "color-mix(in oklab, var(--diff-hard) 20%, var(--bg-card))"}
              stroke={yes ? "var(--diff-easy)" : "var(--diff-hard)"} strokeWidth={2} />
            <text x={x + bw / 2} y={y + 20} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--text)" }}>{yes ? "yes" : "no"}</text>
          </g>
        );
      })}
      <text x={sx + boundary * (bw + bg) - bg / 2} y={y - 28} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>binary-search this boundary</text>
      <text x={sx + boundary * (bw + bg) - bg / 2} y={y - 2} textAnchor="middle" style={{ fontSize: 18, fill: "var(--accent)" }}>▾</text>
      <text x={sx + 2.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>too small</text>
      <text x={sx + 7.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>big enough</text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, scan, wedge, derive, win, general, name)
 *   structured : 5 — cuts `scan` (folded into the wedge's structured connector)
 *                and `general` (its triggers already live in `name`'s prose).
 *   rigorous   : 3 — derive (invariant) + win (cost + edges, gate included)
 *                + name; the wedge's pruning lemma is recalled by the rigorous
 *                bridgeFrom line so derive's "iterate the lemma" opener lands.
 *   refresh    : additionally trims `scan` + `general` (trimOnRefresh).        */
export const binarySearchLesson: LessonSpec = {
  topicTitle: "binary search · find 27",
  // PILOT (focus layout): opt into the single-column, low-cognitive-load layout.
  // Binary search only — every other topic keeps its current layout. The mobile
  // diagram is a "line", so the whole row fits the screen width (never wraps) and
  // you watch it halve. A/B against the prior scene layout via ?layout=scene.
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: binarySearchPy as string,
  // standing on arrays (the anchor, per TRACK-NARRATIVES.md): arr[i] is one
  // step — this lesson adds sorted order so one probe can discard half the row.
  bridgeFrom: reg({
    base: "An array hands you any position in one step — now add sorted order, and one look can rule out half the row.",
    intuitive: "You already know an array lets you jump straight to any slot. Sort those slots, and one peek at the middle throws away half of them.",
    rigorous: "arr[mid] is O(1) address math — on a sorted array one probe eliminates a whole side: the pruning lemma.",
  }),
  // from meta (TRACK-NARRATIVES row 19): ask the middle, half the world dies.
  principle: { key: "search-space-pruning", n: 2, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: reg({
        base: "A sorted phone book — find one name without reading it all.",
        rigorous: "Sorted array, one target — the order is the exploitable structure.",
      }),
      visual: idleRow(undefined, undefined, { 7: "mid" }),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup",
        title: reg({
          base: "A sorted phone book. Find 27.",
          rigorous: "Sorted array, n = 15. Find 27.",
        }),
        body: reg({
          base: <>You&rsquo;re holding a sorted phone book &mdash; a thousand names in order. You wouldn&rsquo;t start at page one. You&rsquo;d flip to the <strong>middle</strong>, see if you&rsquo;ve gone too far, and throw away half. Then again.</>,
          intuitive: <>Picture a real phone book in your lap &mdash; a thousand names, already in A-to-Z order. You need exactly one. Nobody starts at page one. You open the <strong>middle</strong>, glance once, and you know which half the name lives in. The other half? You never touch it.</>,
          rigorous: <>A sorted array and a target. Order is the lever: comparing 27 against any element pins which side of it 27 must lie on, so one probe can discard half the candidates. The marked cell is the first probe: ⌊(0 + 14) / 2⌋ = 7.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Picture a real phone book: a thousand names in alphabetical order, and someone asks you to find one specific name. You&rsquo;d never read it cover to cover from page one.</p>
            <p>You flip to the <strong>middle</strong> and look. If that page comes <em>after</em> the name you want, the whole back half is useless &mdash; ignore it. If it comes <em>before</em>, the front half is gone. Either way, one glance throws away half the book. Then you repeat the same move on whatever&rsquo;s left.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Here&rsquo;s the game. A phone book holds a thousand names in A-to-Z order, and you need to find just one. Reading from page one would work &mdash; eventually. Your hands already know a better way.</p>
            <p>Open the book near the <strong>middle</strong> and read one name. Does the name you want come earlier in the alphabet? Then the entire back half is useless &mdash; let it go. Does it come later? The front half is gone instead. One glance, five hundred pages thrown away. Now play the same move on the half that&rsquo;s left.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Problem: given sorted <code>arr</code> and <code>target</code>, return an index <code>i</code> with <code>arr[i] == target</code>, else <code>-1</code>. Sortedness is the load-bearing precondition: it makes one comparison informative about a whole region, not a single cell.</p>
            <p>The plan: maintain a window that provably contains the target if it&rsquo;s present at all, probe the window&rsquo;s midpoint, and let each comparison either hit or discard half. Cost preview: ⌈log&#8322;(n+1)⌉ comparisons worst case, versus n for a scan.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(7), y1: 150, x2: G.cx(7), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "scan",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "So the order is right there in the book — why does reading page by page still feel like wasted effort?",
      actionLabel: "Use the sortedness",
      takeaway: reg({
        base: "Reading page by page is O(n) — and wastes the sorted order.",
        intuitive: "Page by page can take a thousand looks — and never uses the A-to-Z order.",
        rigorous: "Linear scan: O(n) probes; the sorted precondition goes unused.",
      }),
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : i < 6 ? "muted" : undefined)), ARR.map((_, i) => i > 6)),
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing",
        title: reg({
          base: "Checking one by one wastes the order.",
          rigorous: "The baseline is O(n) — and order-blind.",
        }),
        body: reg({
          base: <>The plain way: page 1, page 2, page 3 &hellip; up to a thousand checks. But the book is <strong>sorted</strong>, and that barely helped. Each page only said &ldquo;not here&rdquo; &mdash; never <em>how far</em> off you were.</>,
          intuitive: <>Try the plain way: page 1, page 2, page 3 &hellip; if the name sits near the back, that&rsquo;s a thousand looks. And here&rsquo;s the itch: the book is in perfect order, yet you never used that. Every page just said &ldquo;nope&rdquo; &mdash; never &ldquo;getting warmer.&rdquo;</>,
          rigorous: <>The baseline: probe indices 0, 1, 2, &hellip; until equality. Worst case n probes &mdash; O(n) &mdash; and a miss always costs all n. It needs no precondition at all, which is the indictment: on sorted input it runs no faster.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The obvious method: read every page in order &mdash; page 1, page 2, page 3 &mdash; until you hit the name. For a thousand pages that&rsquo;s up to a thousand checks. This is a <strong>linear scan</strong>, and its cost is <Term word="O(n)"><code>O(n)</code></Term> (&ldquo;order n&rdquo;): the work grows in step with the number of items <code>n</code> &mdash; double the book, double the worst case.</p>
            <p>The frustrating part: the book is already sorted, and the scan barely uses that. Each page you flip past only says &ldquo;not here&rdquo; &mdash; never <em>how far away</em> the name still is. Could a single comparison tell us where it <em>is</em>, not just where it isn&rsquo;t?</p>
          </>
        ),
        intuitive: (
          <>
            <p>The obvious method: start at page one and check each page in turn until you hit the name. A thousand pages can mean a thousand looks. Double the book, double the looks &mdash; the effort grows in step with the size of the pile. (That&rsquo;s all the symbol <Term word="O(n)"><code>O(n)</code></Term> means, when you meet it.)</p>
            <p>Now the part that should bother you. The book is already in perfect order &mdash; and the scan never once used it. Every page you flipped past said only &ldquo;not here.&rdquo; Never &ldquo;you&rsquo;re close,&rdquo; never &ldquo;way past it.&rdquo; Could one look instead tell you which <em>direction</em> the name is?</p>
          </>
        ),
        rigorous: (
          <>
            <p>The scan probes indices in order until equality: worst case n probes, O(n); a miss costs exactly n. It assumes nothing about the input &mdash; which is the waste, since it runs identically on sorted data.</p>
            <p>Per-probe information is the tell: an equality test eliminates one element; a three-way comparison on sorted data eliminates an entire prefix or suffix. Same probe cost, strictly more pruning &mdash; the next beat buys the stronger test.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(3), y1: 300, x2: G.cx(3), y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      // intuitive/structured variants are self-contained recalls of the naive
      // cost, so the beat still opens cleanly when `scan` is cut or trimmed.
      connector: reg({
        base: "Here's the move that answers that — one comparison that tells you which way to go.",
        intuitive: "Page after page only ever said “not here” — here's the look that says which way to go instead.",
        structured: "Checking page by page costs up to a thousand looks and never uses the order — here's the comparison that does.",
      }),
      actionLabel: "Make it a rule",
      takeaway: reg({
        base: "One comparison eliminates a whole half — because it's sorted.",
        intuitive: "One look can throw away half the book — because it's in order.",
        rigorous: "One comparison discards an entire prefix or suffix — sortedness pays.",
      }),
      visual: (api) => <ClickToHalve api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct",
          title: reg({
            base: "Guess a page — half the book vanishes.",
            rigorous: "One probe kills a prefix or a suffix.",
          }),
          body: reg({
            base: <>Click any page. Land on a number bigger than 27? Because the book is sorted, <em>everything to its right is bigger too</em> &mdash; all gone, in one look. Smaller? the left half goes. That&rsquo;s the whole trick.</>,
            intuitive: <>Click any number in the row. Say you land on one bigger than 27 &mdash; the row is sorted, so everything to its right is bigger still. None of those can be 27. They all go dark in one look. Land on a smaller one? The left side goes dark instead. That&rsquo;s the whole trick.</>,
            rigorous: <>Probe any index <code>i</code>. If <code>arr[i] &gt; 27</code>, sortedness gives <code>arr[j] &gt; 27</code> for every <code>j &gt; i</code> &mdash; the suffix dies unexamined. If <code>arr[i] &lt; 27</code>, the prefix dies. The dimmed cells are exactly the eliminated set.</>,
          }),
        },
        {
          left: 250, top: 366, width: 360, variant: "note",
          body: reg({
            base: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> if every guess halves what&rsquo;s left, how many guesses until one page remains?</>,
            rigorous: <><strong className="text-[var(--accent-ink)]">The question:</strong> each probe halves the live set &mdash; how many probes take n down to 1?</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Click any cell to guess. Because the array is sorted, the moment you land on a number <em>bigger</em> than the target, every number to its right is bigger too &mdash; so they all vanish at once, even though you never looked at them one by one. Land on a <em>smaller</em> number and the whole left side disappears instead.</p>
            <p>One comparison eliminates half of everything still in play. That is the entire trick &mdash; and exactly what the linear scan was throwing away.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Go on &mdash; click any number in the row. Suppose you hit one bigger than 27. The row is in order, so every number to its right must be bigger too. You never looked at them, yet you <em>know</em> none of them is 27 &mdash; so they all go dark at once. Hit a smaller number and the whole left side goes dark instead.</p>
            <p>Count what one click just did: half of everything still in play, gone. The page-by-page scan threw that power away on every single look.</p>
          </>
        ),
        rigorous: (
          <>
            <p>The pruning lemma: probing <code>i</code> with <code>arr[i] &lt; target</code> eliminates indices <code>0..i</code>; with <code>arr[i] &gt; target</code>, it eliminates <code>i..n-1</code>. Nothing in the discarded side is examined &mdash; sortedness certifies it wholesale. Click cells and watch the eliminated set (the dim cells) grow.</p>
            <p>Everything that follows is this lemma iterated, with the probe placed to make the worst case halve: the midpoint.</p>
          </>
        ),
      }),
      codeLabels: ["greater", "hi_update"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: reg({
        base: "Now turn that one move into a repeatable rule a computer can follow — two markers and a middle check.",
        rigorous: "Iterate the lemma: a window, a midpoint probe, and an invariant to carry the proof.",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "Two markers (lo, hi) + always check the middle = the rule.",
        intuitive: "Two markers fence in where the answer can still be; always check the middle.",
        rigorous: "Invariant: target, if present, lies in arr[lo..hi]; probe the midpoint.",
      }),
      visual: (api) => <AutoBinarySearch api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation",
        title: reg({
          base: "Two markers. Always check the middle.",
          rigorous: "Maintain the invariant; halve the window.",
        }),
        body: reg({
          base: <>Keep two markers &mdash; <Term word="lo"><code>lo</code></Term> at the start, <Term word="hi"><code>hi</code></Term> at the end of what&rsquo;s still possible. Check the middle. Match? done. Too small? the answer&rsquo;s to the right, move <code>lo</code> past it. Too big? move <code>hi</code> before it. <span className="text-[var(--accent-ink)]">Each check drops a whole half.</span></>,
          intuitive: <>Watch the run above. Two markers fence in where 27 can still hide: <Term word="lo"><code>lo</code></Term> is the left fence, <Term word="hi"><code>hi</code></Term> the right. Each round, check the number halfway between them. It&rsquo;s 27? Done. Too small? 27 must be to the right &mdash; slide the left fence past the middle. Too big? Slide the right fence. <span className="text-[var(--accent-ink)]">Every check drops half of what&rsquo;s left.</span></>,
          rigorous: <>The loop maintains the invariant: <em>target, if present, lies in</em> <code>arr[lo..hi]</code>. Probe <code>mid = (lo + hi) // 2</code>: equality returns; otherwise <code>lo = mid + 1</code> or <code>hi = mid - 1</code> re-establishes the invariant on a half-size window. Exit at <code>lo &gt; hi</code> certifies absence.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Hold two markers: <code>lo</code> at the start and <code>hi</code> at the end of the part that could still contain the target &mdash; so the answer, if it exists, is somewhere in <code>[lo, hi]</code>.</p>
            <p>Each round, look at the middle: <Term word="mid"><code>mid</code></Term> <code>= (lo + hi) // 2</code> (<Term word="//">rounded down to a whole index</Term>). Three outcomes:</p>
            <ul>
              <li><Term word="arr[i]"><code>arr[mid]</code></Term> <code>== target</code> &mdash; done, return <code>mid</code>.</li>
              <li><code>arr[mid] &lt; target</code> &mdash; the answer is to the right, move <code>lo = mid + 1</code>.</li>
              <li><code>arr[mid] &gt; target</code> &mdash; the answer is to the left, move <code>hi = mid - 1</code>.</li>
            </ul>
            <p>Stop when <code>lo &gt; hi</code>: the search space is empty, so the target isn&rsquo;t there.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle &mdash; search space pruning:</strong> every comparison eliminates an entire side, not just one element.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Give the instinct a uniform a computer can wear. Keep two markers: <Term word="lo"><code>lo</code></Term> marks the first spot still worth checking, <Term word="hi"><code>hi</code></Term> the last. Between them is the only place 27 can still hide &mdash; watch the dark cells close in from both ends as the run plays.</p>
            <p>Each round is one move: check the spot halfway between the markers (that position is called <Term word="mid"><code>mid</code></Term>). Three things can happen:</p>
            <ul>
              <li>It&rsquo;s 27 &mdash; done. That&rsquo;s the answer.</li>
              <li>It&rsquo;s smaller &mdash; 27 must be further right. Move the left marker just past the middle.</li>
              <li>It&rsquo;s bigger &mdash; 27 must be further left. Move the right marker just before the middle.</li>
            </ul>
            <p>If the markers ever cross, there&rsquo;s nowhere left to hide &mdash; 27 isn&rsquo;t in the book.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The big idea:</strong> every look throws away a whole side &mdash; never just one page.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Correctness.</strong> Invariant: <em>target, if present, lies in</em> <code>arr[lo..hi]</code>. <code>lo, hi = 0, n - 1</code> establishes it; each iteration probes <code>mid = (lo + hi) // 2</code> and either returns <code>mid</code> or re-establishes the invariant on a strictly smaller window via <code>lo = mid + 1</code> / <code>hi = mid - 1</code>. Termination follows; <code>lo &gt; hi</code> at exit certifies absence. That is the whole proof.</p>
            <p><strong>Cost.</strong> The window at least halves per iteration: ⌈log&#8322;(n+1)⌉ comparisons worst case &mdash; exactly 4 for this n = 15.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Pitfalls:</strong> the ±1 is load-bearing &mdash; <code>lo = mid</code> loops forever on a two-element window. And <code>(lo + hi) // 2</code> overflows fixed-width ints in C/Java &mdash; write <code>lo + (hi - lo) // 2</code> there; Python&rsquo;s arbitrary-precision ints make the plain form safe.
            </div>
          </>
        ),
      }),
      codeLabels: ["init", "loop", "mid"],
      interaction: "playback",
    },
    {
      id: "win",
      label: "The win",
      connector: reg({
        base: "Counting the work shows the real payoff — and it scales almost for free.",
        rigorous: "Count it: the window halves per probe — the recurrence is T(n) = T(n/2) + 1.",
      }),
      actionLabel: reg({
        base: "Same shape, different problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "Halving is O(log n) — a million items in ~20 steps.",
        intuitive: "Halving: about ten looks for a thousand, about twenty for a million.",
        rigorous: "⌈log₂(n+1)⌉ comparisons worst case — 10 for 10³, 20 for 10⁶.",
      }),
      visual: (api) => <HalvingCostGate api={api} />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The win",
        title: reg({
          base: "Halving a million takes about twenty steps.",
          rigorous: "T(n) = T(n/2) + 1 — twenty probes for a million.",
        }),
        body: reg({
          base: <>Checking a thousand pages one by one: up to 1,000 looks. Halving: about 10. A million? one-by-one needs a million; halving needs about 20. That gap is why sorted data everywhere &mdash; from search to database indexes &mdash; runs on this.</>,
          intuitive: <>Read the boxes above left to right: a thousand, halved again and again, is down to one in about ten steps. So page by page could cost a thousand looks; halving costs about ten. A million names? About twenty looks. That&rsquo;s why a search bar feels instant.</>,
          rigorous: <>The cascade halves 1,000 down to 1. Worst case is ⌈log&#8322;(n+1)⌉ comparisons: 10 for 10³, 20 for 10⁶, 30 for 10⁹ &mdash; doubling n adds one probe. That additive growth is why B-tree indexes and <code>bisect</code>-style lookups stay fast at scale.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Compare the costs head to head. A thousand items one by one: up to 1,000 looks. Halving repeatedly: about 10. Bump it to a million &mdash; one-by-one needs a million, halving needs about 20.</p>
            <p>That &ldquo;about 10/20&rdquo; is <code>log&#8322;</code> (&ldquo;log base two&rdquo;): how many times you can halve a pile before one item remains. Big-O calls it <Term word="O(log n)"><code>O(log n)</code></Term> &mdash; work that grows by just one extra step each time the data <em>doubles</em>. That gap is why sorted-data tools everywhere lean on it, from Python&rsquo;s <code>bisect</code> to the index pages (B-trees) your database uses to find a row fast.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Follow the cascade: 1,000 → 500 → 250 → 125 &hellip; down to 1. Count the hops &mdash; about ten. So a thousand-page book takes about ten looks instead of up to a thousand. A million names? About twenty looks. And doubling the book again adds just <em>one</em> extra look.</p>
            <p>There&rsquo;s a name for &ldquo;how many times can you halve this pile&rdquo;: <Term word="O(log n)"><code>O(log n)</code></Term> (say &ldquo;log of n&rdquo;). You don&rsquo;t need the symbol to feel the point: the pile collapses absurdly fast. That&rsquo;s why your contacts app finds a name instantly, and why a database can pluck one row from a billion.</p>
          </>
        ),
        rigorous: (
          <>
            <p>T(n) = T(⌊n/2⌋) + 1 with T(1) = 1 solves to ⌊log&#8322; n⌋ + 1 = ⌈log&#8322;(n+1)⌉ comparisons worst case: 10 for 10³, 20 for 10⁶, 30 for 10⁹. Each doubling of n costs exactly one more probe.</p>
            <p>In the wild: <code>bisect</code> / <code>lower_bound</code> on sorted arrays; B-trees &mdash; the high-fanout cousin &mdash; behind database indexes, trading log&#8322; for log<sub>fanout</sub> to match disk pages.</p>
          </>
        ),
      }),
      codeLabels: ["loop", "mid"],
      interaction: "wedge",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: reg({
        base: "And the same shape solves problems that don't even look like searching a list.",
        rigorous: "Strip the array away — the real requirement is a monotone predicate.",
      }),
      actionLabel: "Name the pattern",
      takeaway: reg({
        base: "Works on any monotonic “no → yes” boundary, not just lists.",
        intuitive: "Works anywhere answers flip once from “no” to “yes” — not just lists.",
        rigorous: "Any monotone predicate admits bisection — search the no→yes boundary.",
      }),
      visual: <Boundary />,
      panels: [{
        left: 150, top: 26, width: 560, variant: "main", label: "The generalization",
        title: reg({
          base: "Anywhere answers flip from “no” to “yes.”",
          rigorous: "Bisect any monotone predicate.",
        }),
        body: reg({
          base: <>The phone-book version finds an exact value. The deeper one finds the <strong>boundary</strong> between &ldquo;too small&rdquo; and &ldquo;big enough&rdquo; &mdash; e.g. &ldquo;smallest ship that finishes in 14 days?&rdquo; No list at all, but bigger is always easier, so guess the middle and halve.</>,
          intuitive: <>The phone book found an exact name. The bigger idea finds a <strong>tipping point</strong>. Ask: &ldquo;what&rsquo;s the smallest ship that can deliver everything in 14 days?&rdquo; No list anywhere &mdash; but a bigger ship is never worse, so the answers line up like the boxes above: no, no, no &hellip; yes, yes. Guess a middle size, ask &ldquo;does it work?&rdquo;, throw half away.</>,
          rigorous: <>Replace <code>arr[mid] == target</code> with any predicate P(x) that flips false → true once over an ordered domain &mdash; the boxes above are its truth table. Binary search returns the boundary: the least x with P(x) true. &ldquo;Smallest ship that finishes in 14 days&rdquo;: feasibility is monotone in capacity, so bisect capacity &mdash; no array required.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The phone-book version finds an exact value. The deeper version finds the <strong>boundary</strong> between &ldquo;too small&rdquo; and &ldquo;big enough.&rdquo; Example: &ldquo;What&rsquo;s the smallest ship that finishes all deliveries in 14 days?&rdquo; There&rsquo;s no list to search at all.</p>
            <p>But the answers line up in one direction &mdash; the bigger the ship, the easier the job, so once a size works, every larger size works too. That one-way property is called <Term word="monotonicity"><strong>monotonicity</strong></Term>, and it&rsquo;s all binary search needs. Guess the middle, ask &ldquo;does this work?&rdquo;, throw away half. Small to big, easy to hard, no to yes &mdash; one check halves it.</p>
          </>
        ),
        intuitive: (
          <>
            <p>So far we searched a book. The deeper trick searches for a <strong>tipping point</strong>. Try this question: &ldquo;What&rsquo;s the smallest ship that can finish all the deliveries in 14 days?&rdquo; There&rsquo;s no list of pages anywhere &mdash; just ship sizes you could imagine trying.</p>
            <p>Here&rsquo;s what saves us: a bigger ship is never worse. Once some size works, every bigger size works too &mdash; so the answers line up exactly like the row above: no, no, no, then yes forever. (The fancy word for &ldquo;answers that only flip one way&rdquo; is <Term word="monotonicity"><strong>monotonicity</strong></Term>.) Play the same game: try a middle size. Works? Look smaller. Doesn&rsquo;t? Look bigger. Half the sizes vanish per question.</p>
          </>
        ),
        rigorous: (
          <>
            <p>The array was never essential. Sufficient: a predicate P over an ordered domain that flips false → true exactly once &mdash; monotone, with boundary b. Bisect the domain: ⌈log&#8322;(range)⌉ probes, each one evaluation of P, returning b (the least x with P(x) true).</p>
            <p>The interview shape: &ldquo;minimum capacity to ship within D days,&rdquo; &ldquo;first bad version,&rdquo; &ldquo;smallest divisor under a threshold.&rdquo; The feasibility check is monotone, so bisect the answer space; each probe often costs O(n) itself, for O(n log range) total.</p>
          </>
        ),
      }),
      codeLabels: ["compare", "less", "greater"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "Give the move its name — and the cues that tell you to reach for it next time.",
      takeaway: reg({
        base: "It’s Binary Search — reach for it on sorted / “smallest such that”.",
        intuitive: "It’s called binary search — use it on sorted lists and “smallest that works” questions.",
        rigorous: "Binary search: sorted lookup, or any monotone “least x such that”.",
      }),
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : undefined)), ARR.map((_, i) => i !== 6)),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Binary Search.",
        body: reg({
          base: <>That&rsquo;s the name. You&rsquo;ll spot it when you see: a sorted list + find a value; &ldquo;smallest / largest value such that&hellip;&rdquo;; &ldquo;minimum X to make all Y work&rdquo;; or any &ldquo;does this work?&rdquo; that flips from no to yes exactly once as you turn a dial.</>,
          intuitive: <>The move has a name: <strong>binary search</strong> &mdash; &ldquo;binary&rdquo; because every look splits the pile in two. Keep the cues in your pocket: things are in order and you want one of them; &ldquo;smallest number that works&rdquo;; &ldquo;biggest one that fits&rdquo;; any yes/no that flips just once as you turn a dial up.</>,
          rigorous: <>Binary search. Triggers: sorted lookup or insertion point (<code>bisect_left</code> / <code>bisect_right</code>); &ldquo;smallest / largest x such that&hellip;&rdquo; with a monotone check; minimize a capacity or speed subject to feasibility; any predicate that flips once along a dial. If the check is monotone, bisect the answer space.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: <strong>binary search</strong>. Two conventions are worth knowing, because mixing them up is the classic off-by-one bug: <em>closed bounds</em> &mdash; loop while <code>lo &lt;= hi</code>, with <code>hi</code> = the last index (what you just watched); or <em>half-open</em> &mdash; loop while <code>lo &lt; hi</code>, with <code>hi</code> = one-past-the-end. Both are correct; pick one and stop second-guessing.</p>
            <p>Reach for it when you see:</p>
            <ul>
              <li>a <strong>sorted list</strong> + find a value (or its insert position)</li>
              <li>&ldquo;smallest / largest value such that&hellip;&rdquo;</li>
              <li>&ldquo;minimum X to make all Y work&rdquo;</li>
              <li>any &ldquo;does this work?&rdquo; that flips from no to yes once as you turn a dial</li>
            </ul>
          </>
        ),
        intuitive: (
          <>
            <p>You just derived a famous algorithm: <strong>binary search</strong>. (&ldquo;Binary&rdquo; = two &mdash; every look cuts what&rsquo;s left in two.) One habit worth copying from the run you watched: decide exactly what your two markers mean &mdash; here, the first and last spots still in play &mdash; and never let a move break that meaning. That&rsquo;s what keeps every marker move honest.</p>
            <p>Reach for it when you see:</p>
            <ul>
              <li>an ordered list + find one thing in it</li>
              <li>&ldquo;smallest / largest that still works&rdquo;</li>
              <li>&ldquo;minimum X so all Y succeed&rdquo;</li>
              <li>any yes/no question that flips just once as you turn a dial</li>
            </ul>
          </>
        ),
        rigorous: (
          <>
            <p>Conventions &mdash; the classic bug source. <em>Closed</em> (this lesson, and <code>algorithm.py</code>): invariant on <code>arr[lo..hi]</code>, loop while <code>lo &lt;= hi</code>, shrink with <code>mid ± 1</code>. <em>Half-open</em>: invariant on <code>arr[lo..hi)</code>, loop while <code>lo &lt; hi</code>, set <code>hi = mid</code> on the high branch; at exit <code>lo == hi</code> is the insertion point &mdash; what <code>bisect_left</code> returns. Both are correct; mixing them is the off-by-one.</p>
            <p>Edges to test: empty array, single element, target below or above the whole range, duplicates (decide first / last / any occurrence).</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(6), y1: G.y + G.cellH + 34, x2: G.cx(6), y2: G.y + G.cellH + 4 }],
      codeLabels: ["found"],
    },
  ],
};
