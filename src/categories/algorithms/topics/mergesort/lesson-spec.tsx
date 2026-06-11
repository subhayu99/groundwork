"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import mergesortPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [5, 2, 4, 7, 1, 3, 8, 6];
const SORTED = [1, 2, 3, 4, 5, 6, 7, 8];
const VW = 860, VH = 470;
const ROW_Y = 250;
const G = rowGeom(ARR.length, VW, ROW_Y);

/* ── segment model (shared by the instinct + playback beats) ──────────────────── */
interface Segment { values: number[]; sorted: boolean; }
const startSegments = (): Segment[] => [{ values: [...ARR], sorted: false }];

function splitAll(segs: Segment[]): Segment[] {
  const next: Segment[] = [];
  for (const s of segs) {
    if (s.values.length <= 1) { next.push({ ...s, sorted: true }); continue; }
    const mid = Math.floor(s.values.length / 2);
    next.push({ values: s.values.slice(0, mid), sorted: false });
    next.push({ values: s.values.slice(mid), sorted: false });
  }
  return next;
}
function mergeOneLevel(segs: Segment[]): Segment[] {
  if (segs.length === 1) return segs;
  const next: Segment[] = [];
  for (let i = 0; i < segs.length; i += 2) {
    if (i + 1 >= segs.length) { next.push(segs[i]); continue; }
    const a = segs[i].values, b = segs[i + 1].values, out: number[] = [];
    let p = 0, q = 0;
    while (p < a.length && q < b.length) { if (a[p] <= b[q]) out.push(a[p++]); else out.push(b[q++]); }
    while (p < a.length) out.push(a[p++]);
    while (q < b.length) out.push(b[q++]);
    next.push({ values: out, sorted: true });
  }
  return next;
}
const allAtomic = (segs: Segment[]) => segs.every((s) => s.values.length <= 1);

/* Draw a row of segments centered in the canvas at height y, with a small gap
   between segments so the splits read as separate piles. */
function SegRow({ segs, y }: { segs: Segment[]; y: number }) {
  const cw = 36, gap = 3, segGap = 16;
  const totalCells = segs.reduce((n, s) => n + s.values.length, 0);
  const totalW = totalCells * cw + (totalCells - segs.length) * gap + (segs.length - 1) * segGap;
  let x = (VW - totalW) / 2;
  const out: React.ReactNode[] = [];
  segs.forEach((s, si) => {
    s.values.forEach((v, vi) => {
      const tone: Tone = s.sorted ? "good" : "idle";
      const ts = s.sorted
        ? { bg: "color-mix(in oklab, var(--diff-easy) 20%, var(--bg-card))", border: "var(--diff-easy)" }
        : { bg: "var(--bg-card)", border: "var(--line)" };
      out.push(
        <g key={`${si}-${vi}`}>
          <rect x={x} y={y} width={cw} height={36} rx={7} style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
          <text x={x + cw / 2} y={y + 18} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{v}</text>
        </g>,
      );
      void tone;
      x += cw + (vi < s.values.length - 1 ? gap : 0);
    });
    if (si < segs.length - 1) x += segGap;
  });
  return <g>{out}</g>;
}

/* ── interactive WEDGE: split down to singletons, then merge back up ───────── */
function SplitMerge({ api }: { api: BeatVisualApi }) {
  const [segs, setSegs] = useState<Segment[]>(startSegments);
  const [phase, setPhase] = useState<"splitting" | "merging">("splitting");

  const split = () => {
    api.onActiveLine(["split", "recurse_left", "recurse_right"]);
    setSegs((cur) => {
      const next = splitAll(cur);
      if (allAtomic(next)) setPhase("merging");
      return next;
    });
  };
  const merge = () => {
    api.onActiveLine(["merge_loop", "merge_compare", "merge_take"]);
    setSegs((cur) => {
      const next = mergeOneLevel(cur);
      // Unlock "Next" only after the full journey: split to singles AND
      // merged all the way back to one fully-sorted segment.
      if (next.length === 1 && next[0].sorted) api.onInteractionDone();
      return next;
    });
  };
  const reset = () => { setSegs(startSegments()); setPhase("splitting"); };

  const done = segs.length === 1 && segs[0].sorted;
  const caption = done
    ? "sorted — one clean pass per level"
    : phase === "splitting"
    ? `splitting · ${segs.length} piece${segs.length > 1 ? "s" : ""}`
    : "merging · take the smaller card next";

  const Btn = ({ x, label, onClick }: { x: number; label: string; onClick: () => void }) => (
    <g onClick={onClick} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={x - 38} y={ROW_Y + 88} width={76} height={24} rx={6} fill="var(--accent-soft)" stroke="var(--accent-line)" />
      <text x={x} y={ROW_Y + 100} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{label}</text>
    </g>
  );

  return (
    <g>
      <SegRow segs={segs} y={ROW_Y} />
      <text x={VW / 2} y={ROW_Y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>{caption}</text>
      {phase === "splitting"
        ? <Btn x={VW / 2 - 46} label="split →" onClick={split} />
        : <Btn x={VW / 2 - 46} label="merge →" onClick={done ? () => {} : merge} />}
      <g onClick={reset} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 + 14} y={ROW_Y + 88} width={56} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2 + 42} y={ROW_Y + 100} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── playback: auto split-down, then merge-up; code line follows each frame ── */
type Ph = "splitting" | "merging" | "done";
interface AS { segs: Segment[]; phase: Ph; }
function AutoMergesort({ api }: { api: BeatVisualApi }) {
  const init = (): AS => ({ segs: startSegments(), phase: "splitting" });
  const [s, setS] = useState<AS>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.phase === "done") return;
      if (c.phase === "splitting") {
        const next = splitAll(c.segs);
        api.onActiveLine(["split", "recurse_left", "recurse_right"]);
        setS({ segs: next, phase: allAtomic(next) ? "merging" : "splitting" });
        return;
      }
      const next = mergeOneLevel(c.segs);
      api.onActiveLine(["merge_loop", "merge_compare", "merge_take"]);
      const sorted = next.length === 1 && next[0].sorted;
      setS({ segs: next, phase: sorted ? "done" : "merging" });
    }, pace(850));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = s.phase === "done";
  const caption = done ? "sorted ✓" : s.phase === "splitting" ? "splitting down to single cards…" : "merging the sorted halves up…";

  return (
    <g>
      <SegRow segs={s.segs} y={ROW_Y} />
      <text x={VW / 2} y={ROW_Y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>{caption}</text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={ROW_Y + 88} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={ROW_Y + 100} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visuals ────────────────────────────────────────────────────────── */
const idleRow = (tones?: (Tone | undefined)[]) => <CellRow geom={G} values={ARR} tones={tones} />;
const sortedRow = () => <CellRow geom={rowGeom(SORTED.length, VW, ROW_Y)} values={SORTED} tones={SORTED.map(() => "good" as Tone)} />;

/* Cost diagram: a triangle of levels (8 → 4s → 2s → singles) with a height
   bracket for "how many levels = log n" and one level marked "n cards touched". */
function CostLevels() {
  const widths = [8, 4, 2, 1]; // cells per pile, per level
  const cw = 22, gap = 2, segGap = 12, y0 = 222, rowH = 34;
  return (
    <g>
      {widths.map((per, li) => {
        const piles = 8 / per;
        const totalCells = 8;
        const totalW = totalCells * cw + (totalCells - piles) * gap + (piles - 1) * segGap;
        let x = (VW - totalW) / 2;
        const y = y0 + li * rowH;
        const cells: React.ReactNode[] = [];
        for (let pi = 0; pi < piles; pi++) {
          for (let c = 0; c < per; c++) {
            const active = li === 2; // mark one level's linear sweep
            cells.push(
              <rect key={`${pi}-${c}`} x={x} y={y} width={cw} height={24} rx={4}
                fill={active ? "color-mix(in oklab, var(--accent-sky) 26%, var(--bg-card))" : "color-mix(in oklab, var(--accent-sky) 12%, var(--bg-card))"}
                stroke={active ? "var(--accent-line)" : "var(--accent-line)"} strokeWidth={1.4} />,
            );
            x += cw + (c < per - 1 ? gap : 0);
          }
          x += segGap;
        }
        return <g key={li}>{cells}</g>;
      })}
      {/* log n height bracket on the left */}
      <path d={`M${190},${y0} L${182},${y0} L${182},${y0 + 3 * rowH + 24} L${190},${y0 + 3 * rowH + 24}`} fill="none" stroke="var(--diff-hard)" strokeWidth={1.5} />
      <text x={176} y={y0 + (3 * rowH + 24) / 2} textAnchor="end" dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>~3 levels</text>
      <text x={VW - 176} y={y0 + 2 * rowH + 12} textAnchor="start" dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>← every card touched once</text>
      <text x={VW / 2} y={y0 + 3 * rowH + 48} textAnchor="middle" className="font-mono" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>n cards per level × (number of halvings) levels</text>
    </g>
  );
}

/* ── PREDICTION GATE + reveal: commit to split-and-merge's price, THEN count ──
 * The lesson's ONE prediction gate (BEAT-RITUAL: the cost predict sits right
 * before the cost reveal). The learner has split and merged by hand but hasn't
 * counted the levels — one tap on a pill is the real interaction
 * (interaction: "wedge"; PredictGate fires api.onInteractionDone()), then after
 * a short reading pause the CostLevels triangle answers the prediction. The
 * caption restates the naive price so the question stays register-neutral
 * (rigorous never meets the `naive` beat). The gate is HTML hosted on the SVG
 * canvas via <foreignObject>; data-canvas-panel opts it into the scene
 * layout's content-extent measurement. */
function MergeCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <CostLevels />;

  return (
    <g>
      <text x={VW / 2} y={214} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        swap-by-swap prices 1,000 cards at about a million steps &mdash; now price split-and-merge
      </text>
      <foreignObject x={190} y={240} width={480} height={200}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Same 1,000 cards, sorted by split-and-merge — about how much work is it?"
            choices={[
              { id: "same", label: "about the same — every card still travels to its spot", note: "cards do travel far — but each merge carries them across in one sweep, not one swap at a time" },
              { id: "fewer", label: "way fewer — one sweep per halving level", correct: true, note: "about ten levels for 1,000 cards, one clean sweep each — count it on the triangle" },
              { id: "more", label: "more — all that splitting is extra work", note: "the cuts are cheap; the real work is the merging, one sweep per level" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* Divide-and-conquer tree fragment + sibling chips naming other instances. */
function DivideConquer() {
  const cx = VW / 2, py = 210, cy = 296, r = 26;
  const lx = cx - 110, rx = cx + 110;
  const node = (x: number, y: number, label: string) => (
    <g>
      <rect x={x - 34} y={y - 18} width={68} height={36} rx={8} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={2} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{label}</text>
    </g>
  );
  void r;
  const chips = ["count out-of-order pairs", "closest two points", "big-number multiply", "FFT", "split across 2 CPUs"];
  const chipY = 372, chipH = 22; let chipX = 0;
  const chipW = (t: string) => t.length * 6.0 + 18;
  const totalChipW = chips.reduce((w, t) => w + chipW(t), 0) + (chips.length - 1) * 8;
  chipX = (VW - totalChipW) / 2;
  return (
    <g>
      <line x1={cx} y1={py + 18} x2={lx} y2={cy - 18} stroke="var(--line)" strokeWidth={2} />
      <line x1={cx} y1={py + 18} x2={rx} y2={cy - 18} stroke="var(--line)" strokeWidth={2} />
      {node(cx, py, "problem · n")}
      {node(lx, cy, "half · n/2")}
      {node(rx, cy, "half · n/2")}
      <line x1={lx} y1={cy + 18} x2={cx} y2={cy + 40} stroke="var(--diff-easy)" strokeWidth={2} />
      <line x1={rx} y1={cy + 18} x2={cx} y2={cy + 40} stroke="var(--diff-easy)" strokeWidth={2} />
      <text x={cx} y={cy + 50} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>cheap combine</text>
      {chips.map((t, i) => {
        const w = chipW(t), x = chipX;
        chipX += w + 8;
        return (
          <g key={i}>
            <rect x={x} y={chipY} width={w} height={chipH} rx={11} fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1} />
            <text x={x + w / 2} y={chipY + chipH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 9, fill: "var(--text-muted)" }}>{t}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, naive, wedge, derive, ops, general, name)
 *   structured : 5 — cuts `naive` (its cost is recalled inline by the wedge's
 *                structured connector) and `general` (the transfer cues already
 *                live in `name`'s trigger list).
 *   rigorous   : 3 — derive (the model + invariant; opener leans on the
 *                rigorous bridgeFrom recalling recursion's contract) + ops
 *                (cost derivation + edges, gate included) + name (close).
 *   refresh    : additionally trims `naive` + `general` (trimOnRefresh).      */
export const mergesortLesson: LessonSpec = {
  topicTitle: "mergesort · sort eight cards",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: mergesortPy as string,
  // standing on recursion (the anchor, per TRACK-NARRATIVES.md): trust the
  // smaller call — mergesort makes that decomposition total: split to trivial,
  // merge the sorted answers back.
  bridgeFrom: reg({
    base: "You already trust a function to solve a smaller copy of its own problem — now that one act of trust sorts anything.",
    intuitive: "You've seen a recipe call itself on a smaller piece and trust the answer — today that trick sorts a whole messy row.",
    rigorous: "Recursion: a base case plus a trusted smaller call. Mergesort instantiates it — split to trivial, merge sorted halves.",
  }),
  // from meta (TRACK-NARRATIVES row 29): split to trivial, merge with two
  // pointers — decomposition made total.
  principle: { key: "decomposition", n: 4, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: reg({
        base: "The obvious recipe",
        structured: "Find a faster move",
      }),
      takeaway: reg({
        base: "Eight cards in a jumble — and computers do this on millions of rows.",
        intuitive: "Eight messy cards are easy by eye — the method is what survives a million rows.",
      }),
      visual: (
        <g>
          {idleRow()}
          <Bracket x1={G.left(0)} x2={G.left(7) + G.cellW} y={G.y - 14} label="sort these" color="var(--text-muted)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "Eight cards in a jumble. Put them in order.",
        body: reg({
          base: <>Eight cards landed out of order: 5, 2, 4, 7, 1, 3, 8, 6. Sorting eight by eye is easy. But computers sort tables with <strong>hundreds of millions of rows</strong> &mdash; every leaderboard, every database lookup. The <em>method</em> is what matters.</>,
          intuitive: <>Eight cards landed in a jumble: 5, 2, 4, 7, 1, 3, 8, 6. You could line up eight by eye in seconds. But the same chore runs on <strong>millions of rows</strong> &mdash; every leaderboard, every search results page. At that size only the <em>method</em> matters, so that&rsquo;s what we&rsquo;ll build.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You&rsquo;ve got eight cards spread on the table, face up, in whatever order they landed: <code>5, 2, 4, 7, 1, 3, 8, 6</code>. The job is simply to put them in order, smallest to largest.</p>
            <p>Eight cards is easy to do by eye. Eighty is annoying. Eight hundred <em>million</em> is the kind of thing computers spend their lives doing &mdash; every time a database joins two tables, ranks search results, or builds a leaderboard, something is sorting. At that size you can&rsquo;t eyeball it, so the exact <em>method</em> you use is what decides whether the answer comes back in a second or a week.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Spread eight cards on the table, face up, just as they landed: <code>5, 2, 4, 7, 1, 3, 8, 6</code>. The whole job: line them up, smallest to largest.</p>
            <p>Eight is easy. But sorting is the computer&rsquo;s daily chore &mdash; ranking search results, building leaderboards, lining up database rows &mdash; on piles of <em>millions</em>. Nobody can eyeball a million, so the exact recipe you follow is what decides whether the answer takes a second or a week. We&rsquo;ll build that recipe on eight cards, and it&rsquo;ll work unchanged on a million.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(3), y1: 150, x2: G.cx(3), y2: G.y - 28 }],
      codeLabels: ["sig"],
    },
    {
      id: "naive",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Eight by eye was easy — so what’s the most obvious recipe a computer could follow?",
      actionLabel: "Split. Sort. Merge.",
      takeaway: reg({
        base: "Swapping neighbours works but is O(n²) — moving a card far is slow.",
        intuitive: "Swapping neighbours works, but doubling the cards roughly quadruples the work.",
      }),
      visual: idleRow(ARR.map((_, i) => (i === 0 || i === 1 ? "muted" : undefined))),
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Swap neighbours until nothing's backwards.",
        body: <>The first idea: walk left to right, swap any pair that&rsquo;s out of order, repeat. It works but crawls &mdash; each swap fixes one tiny disagreement, so moving a card far means swapping it past every neighbour. Double the cards and the work roughly <em>quadruples</em>.</>,
      }],
      detail: (
        <>
          <p>The first method everyone reaches for: walk left to right and swap any two neighbours that are out of order. Do a full pass; if you made any swaps, do another. When a whole pass makes zero swaps, everything is sorted. It works &mdash; it&rsquo;s just slow.</p>
          <p>The trouble is that each swap only fixes one tiny local disagreement between two touching cards. To carry a card a long way across the row, you have to swap it past <em>every single neighbour</em> on the way. So the total work grows like the <em>square</em> of the size &mdash; written <Term word="O(n²)"><code>O(n&sup2;)</code></Term> (&ldquo;order n squared&rdquo;, meaning the work scales with the number of cards <code>n</code> multiplied by itself). A thousand cards can mean about a million swaps; double the cards and the work roughly quadruples.</p>
          <p>What we really want is a way to move information across the row in big chunks instead of one nudge at a time.</p>
        </>
      ),
      arrows: [{ x1: G.cx(0) + G.stride / 2, y1: 150, x2: G.cx(0) + G.stride / 2, y2: G.y - 6 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      // intuitive/structured variants recall the naive cost self-containedly,
      // so the beat still opens cleanly when `naive` is cut or trimmed.
      connector: reg({
        base: "If single swaps move cards too slowly, what if we could move a whole side at once?",
        intuitive: "One swap only ever fixes two touching cards — what if a whole side could move in one go?",
        structured: "Swapping neighbours costs about a million steps on a thousand cards — here's the move that shifts whole sides at once.",
      }),
      actionLabel: "Make it a rule",
      takeaway: reg({
        base: "Split to single cards, then merge sorted halves in one clean sweep.",
        intuitive: "Keep cutting to single cards, then zip sorted halves back — one sweep each.",
      }),
      visual: (api) => <SplitMerge api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Cut in half. Sort each half. Merge them.",
          body: reg({
            base: <>Pretend the two halves are already sorted. Finishing is easy: walk both with two fingers, always take the smaller card &mdash; one pass, each card seen once. The only question left is &ldquo;how do I sort a half?&rdquo; Same trick, smaller. <strong>Use the buttons under the row: split all the way down, then merge.</strong></>,
            intuitive: <>Pretend someone already sorted each half for you. Finishing is suddenly easy: one finger at the front of each half, always take the smaller card, step that finger on. One sweep and the row is sorted &mdash; each card looked at once. The only mystery left: who sorts the halves? The same trick, on smaller piles. <strong>Use the buttons under the row: split all the way down, then merge.</strong></>,
          }),
        },
        {
          left: 558, top: 352, width: 272, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> keep cutting until each piece is a single card &mdash; and one card is already in order. Then merge the pieces back, two at a time.</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Here&rsquo;s the instinct. Pretend, just for a moment, that the left half of the row and the right half are each <em>already</em> sorted. Then finishing the whole row is easy: put one finger at the front of each half and compare. Whichever finger points at the smaller card, take that card and slide that finger forward. Keep going and the cards come out in perfect order &mdash; a single left-to-right pass where each card is touched once. That step is called a <strong>merge</strong>.</p>
            <p>So the hard question shrinks to a smaller version of itself: how do you sort a half? The same way &mdash; cut it in half, sort the two pieces, merge them. The pieces keep getting smaller until each is a <em>single card</em>, and a single card is already sorted, so the splitting stops there. A rule that solves a problem by calling itself on a smaller piece is called <Term word="recursion"><strong>recursion</strong></Term>.</p>
            <p>Use the <strong>split</strong> button under the row and the row breaks into halves, quarters, then singletons. Once every piece is a single card the button becomes <strong>merge</strong> &mdash; keep pressing it and the sorted pieces fuse back together. <strong>↺ reset</strong> sends the cards back to their starting jumble.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The instinct:</strong> sorting halves and merging them is far less work than swap-by-swap, because the merge moves cards from one side to the other in one clean sweep instead of one nudge at a time.</div>
          </>
        ),
        intuitive: (
          <>
            <p>Play pretend for a second: imagine the left four cards are already in order, and the right four too. Could you finish the row? Easily &mdash; put a finger on the front card of each half and compare. Take the smaller card, slide that finger forward, compare again. One sweep, left to right, and the whole row comes out sorted &mdash; no card looked at twice. That finishing move is called a <strong>merge</strong>.</p>
            <p>So the only question left is &ldquo;who sorted the halves?&rdquo; And the answer is: the same move, on smaller piles. Cut each half in half, and again, until every pile is one single card &mdash; and a single card can&rsquo;t be out of order, so the cutting stops by itself. A recipe that solves a problem by handing a smaller copy to itself is called <Term word="recursion"><strong>recursion</strong></Term> &mdash; you met it a lesson ago; this is it earning its keep.</p>
            <p>Try it &mdash; press <strong>split</strong> until every pile is a single card, then press <strong>merge</strong> and watch the sorted piles fuse back, two at a time. <strong>↺ reset</strong> reshuffles the jumble.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The instinct:</strong> the merge carries cards across the row in whole sorted sweeps &mdash; far cheaper than nudging them along one swap at a time.</div>
          </>
        ),
      }),
      codeLabels: ["split", "recurse_left", "recurse_right"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      // Appears for EVERY register — rigorous opens here; its connector reads
      // as an opener on top of the rigorous bridgeFrom line.
      connector: reg({
        base: "You just did it by hand — now turn that split-sort-merge move into a rule a computer can repeat.",
        rigorous: "Two cases carry the whole algorithm — a trivial base and split-recurse-merge. State them exactly.",
      }),
      actionLabel: "Count the work",
      takeaway: reg({
        base: "sort() calls itself on each half; one card is the base case; merge combines.",
        intuitive: "The recipe calls itself on each half; one card stops it; the merge zips halves together.",
        rigorous: "Base case len ≤ 1; recurse on the halves; merge sorted halves with two pointers.",
      }),
      visual: (api) => <AutoMergesort api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation",
        title: reg({
          base: "A recipe that calls itself, plus a two-finger merge.",
          rigorous: "One base case, two recursive calls, one linear merge.",
        }),
        body: reg({
          base: <>Write <code>sort</code> as <strong>recursion</strong> &mdash; a recipe that calls itself on a smaller piece. Simplest case: 0 or 1 cards are already sorted, hand them back. Otherwise find the middle, sort each half, then merge. The merge uses two <em>fingers</em> &mdash; markers showing where you&rsquo;re looking in each half.</>,
          intuitive: <>Watch the rule run itself. If a pile has 0 or 1 cards, hand it back &mdash; nothing to sort. Otherwise: cut at the middle, sort each half <em>by this very rule</em>, then merge with two fingers &mdash; little markers showing where you&rsquo;re looking in each half. Press <strong>↺ replay</strong> as often as you like.</>,
          rigorous: <><code>mergesort(nums)</code>: if <code>len(nums) &lt;= 1</code>, return it &mdash; the base case anchors termination. Else recurse on <code>nums[:mid]</code> and <code>nums[mid:]</code>, then <code>merge</code>: pointers <code>i</code>, <code>j</code> walk the halves, the smaller head is appended each round, the survivor&rsquo;s tail is extended on. Sorted in, sorted out &mdash; merge&rsquo;s contract.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Write the recipe as <code>sort(arr)</code> &mdash; a rule that calls itself on smaller pieces (that self-calling is <strong>recursion</strong>). It has two cases.</p>
            <p><strong>The simplest case.</strong> If the list has 0 or 1 cards, it&rsquo;s already in order &mdash; just hand it straight back. This is what stops the recursion from going forever.</p>
            <p><strong>The general case.</strong> Find the middle. Let <code>left = mergesort(nums[:mid])</code> and <code>right = mergesort(nums[mid:])</code> &mdash; sort each half by the very same rule &mdash; then return <code>merge(left, right)</code>. (In the code drawer the function is named <code>mergesort(nums)</code> &mdash; same idea as the <code>sort</code> recipe above.)</p>
            <p><strong>The merge.</strong> Use two <em>fingers</em> &mdash; pointers marking where you&rsquo;re looking in each half: <code>i</code> at the front of <code>left</code>, <code>j</code> at the front of <code>right</code>. Whichever points at the smaller card, write that card to the output and step that finger forward. When one side runs out, dump whatever&rsquo;s left of the other side onto the end.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The principle &mdash; decomposition:</strong> a hard sort becomes two smaller sorts plus a cheap merge, and those smaller sorts solve themselves by the exact same rule.</div>
          </>
        ),
        intuitive: (
          <>
            <p>Now write your hand-moves down as a rule the computer can repeat. It has just two cases.</p>
            <p><strong>The tiny case.</strong> A pile of 0 or 1 cards is already in order &mdash; hand it straight back. This is the stop sign: it&rsquo;s why the self-calling can&rsquo;t go on forever.</p>
            <p><strong>Every other case.</strong> Cut at the middle. Ask the same recipe to sort the left pile, then the right pile &mdash; trust it; the piles only get smaller &mdash; then <strong>merge</strong> the two sorted answers with the two-finger move you just did by hand: whichever finger points at the smaller card, that card goes to the output and the finger steps on. When one side runs dry, the other side&rsquo;s leftovers slide onto the end.</p>
            <p>That&rsquo;s genuinely all of it. In the code drawer the recipe is <code>mergesort(nums)</code> and the two-finger move is its helper, <code>merge</code>.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The big idea:</strong> a hard sort becomes two easier sorts plus one cheap merge &mdash; and the easier sorts solve themselves by the same rule.</div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model.</strong> <code>mergesort(nums)</code>: if <code>len(nums) &lt;= 1</code>, return <code>nums</code>; else split at <code>mid = len(nums) // 2</code>, recurse on both slices, return <code>merge(left, right)</code>. The merge loop keeps an <Term word="invariant">invariant</Term>: <code>out</code> is sorted, and everything in <code>out</code> is &le; everything not yet consumed in either half &mdash; so appending the smaller head preserves it, and extending the leftover tail finishes it.</p>
            <p><strong>Correctness</strong> by induction on length: the base case is trivially sorted; the halves are sorted by hypothesis; the invariant makes <code>merge</code>&rsquo;s output sorted. Termination: every recursive call is on a strictly shorter slice. One subtlety pays rent later: the <code>&lt;=</code> in the compare takes from <code>left</code> on ties, so equal items keep their original order &mdash; the sort is <em>stable</em>.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The principle &mdash; decomposition, idea 4 of 7:</strong> the problem reduces to two half-size copies of itself plus a linear combine. The next beat prices exactly that recurrence.</div>
          </>
        ),
      }),
      codeLabels: ["base", "split", "recurse_left", "recurse_right", "merge_call"],
      interaction: "playback",
    },
    {
      id: "ops",
      label: "The operations",
      connector: reg({
        base: "The rule clearly works — but is it actually faster than swapping? Count the steps.",
        rigorous: "Now price the recurrence: count the levels, count the work per level — commit before the diagram counts it for you.",
      }),
      actionLabel: reg({
        base: "Same shape, new problems",
        structured: "Name the pattern",
        rigorous: "Name the pattern",
      }),
      takeaway: reg({
        base: "log n levels × n cards per level = O(n log n) — millions, not trillions.",
        intuitive: "A few halving levels, one sweep each — a million cards in about twenty million steps.",
        rigorous: "Halving gives log n levels × n merge work — O(n log n) every case, O(n) extra space.",
      }),
      visual: (api) => <MergeCostGate api={api} />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The operations",
        title: reg({
          base: "Halve down a few levels; one walk per level.",
          rigorous: "⌈log₂ n⌉ levels, n work per level.",
        }),
        body: reg({
          base: <>A thousand cards take about ten cuts to reach single cards &mdash; call that count of halvings <code>log n</code> (it grows slowly: double the cards, add one cut). Each level touches every card once: <code>n</code>, the number of cards. Total <code>n × log n</code> &mdash; 20 million steps for a million cards, not a trillion.</>,
          intuitive: <>Count it on the triangle. A thousand cards take about <strong>ten cuts</strong> to reach single cards &mdash; double the cards, just one more cut. And each level&rsquo;s merging touches every card exactly once: one sweep per level. A few levels, one sweep each &mdash; a million cards cost about twenty million steps, where swap-by-swap would&rsquo;ve cost about a <em>trillion</em>.</>,
          rigorous: <>The triangle is the recurrence drawn. Each split level halves the slices &mdash; ⌈log&#8322; n⌉ + 1 levels down to singletons &mdash; and the merges on any level touch each of the <code>n</code> elements exactly once. Count first, then name it: <code>n</code> per level &times; <code>log n</code> levels is <Term word="O(n log n)"><code>O(n log n)</code></Term> &mdash; and the shape never depends on the values, so worst case equals best case.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p><strong>How many times do we cut?</strong> Each split halves the pile. Halving a thousand cards down to single cards takes only about ten steps (because halving ten times splits roughly a thousand into one). That count of halvings is written <Term word="O(log n)"><code>O(log n)</code></Term> (&ldquo;order log n&rdquo;) &mdash; a cost that grows very slowly: <em>doubling</em> the number of cards adds just one more level.</p>
            <p><strong>How much work at each level?</strong> Every merge on a level looks at each card in its slice exactly once, and across the whole level the merges touch every card &mdash; that&rsquo;s <Term word="O(n)"><code>O(n)</code></Term> (&ldquo;order n&rdquo;), work proportional to the number of cards <code>n</code>.</p>
            <p><strong>Total.</strong> <code>n</code> cards per level times about <code>log n</code> levels gives <Term word="O(n log n)"><code>O(n log n)</code></Term>. For a million cards that&rsquo;s roughly twenty million steps &mdash; not the trillion that swap-by-swap (<code>O(n&sup2;)</code>) would have demanded.</p>
            <p><strong>Memory.</strong> The merge needs a second strip of space to write the combined result into, so it uses <code>O(n)</code> extra memory &mdash; an amount that grows with the number of cards. Some sorts (like quicksort) avoid that extra copy, but they trade away a different guarantee to do it.</p>
          </>
        ),
        intuitive: (
          <>
            <p><strong>How many levels?</strong> Watch the halving: 1,000 &rarr; 500 &rarr; 250 &hellip; about ten cuts and every pile is a single card. Doubling the cards adds just <em>one</em> more cut. (That slow-growing count is what the chip <Term word="O(log n)"><code>O(log n)</code></Term> means, whenever you meet it.)</p>
            <p><strong>How much work per level?</strong> The merges on one level, between them, pick up every card exactly once &mdash; one clean sweep across the row, whether you&rsquo;re near the top of the triangle or the bottom. Work that touches each card once is <Term word="O(n)"><code>O(n)</code></Term>.</p>
            <p><strong>Put together:</strong> one sweep of all the cards, repeated once per level. A million cards means twenty-ish levels of a million touches &mdash; about twenty million steps, where swap-by-swap needed about a trillion. That bargain is what <Term word="O(n log n)"><code>O(n log n)</code></Term> names.</p>
            <p><strong>The honest costs.</strong> The merge writes into a fresh strip of space, so you need room for a second copy of the cards. And the recipe never cuts corners: a row that&rsquo;s <em>already sorted</em> still pays full price. Zero cards, or one? Already sorted &mdash; the tiny case hands them straight back.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact cost.</strong> T(n) = 2T(n/2) + cn unrolls to cn work on each of ⌈log&#8322; n⌉ levels: <Term word="O(n log n)"><code>O(n log n)</code></Term> comparisons and moves &mdash; best, average, and worst case alike, because splitting and merging never inspect the arrangement. Contrast quicksort: in-place and often faster in practice, but O(n&sup2;) on adversarial input; mergesort&rsquo;s bound is unconditional.</p>
            <p><strong>Space.</strong> <code>merge</code> writes a fresh <code>out</code> &mdash; <Term word="O(n)"><code>O(n)</code></Term> auxiliary &mdash; and this implementation&rsquo;s <code>nums[:mid]</code> slices copy as well (same bound, bigger constant). Recursion depth is log&#8322; n <Term word="frame">frames</Term> &mdash; about 30 for a billion items, no stack concern.</p>
            <p><strong>Edges.</strong> Empty and one-element lists are the base case, returned as-is. Already-sorted input still pays the full n log n &mdash; Timsort (Python&rsquo;s built-in) exploits existing runs to drop toward O(n) there. Ties: the <code>&lt;=</code> in the compare takes from the left half first, so stability holds &mdash; change it to <code>&lt;</code> and stability silently breaks.</p>
          </>
        ),
      }),
      arrows: [{ x1: 160, y1: 156, x2: 182, y2: 220 }],
      codeLabels: ["split", "merge_loop", "merge_tail"],
      interaction: "wedge",
    },
    {
      id: "general",
      label: "The generalization",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "That n log n win wasn’t luck — it comes from a shape that shows up far beyond sorting.",
      actionLabel: "Name the pattern",
      takeaway: "Split, solve each half, cheaply combine — the same shape solves many problems.",
      visual: <DivideConquer />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The generalization", title: "Divide and conquer is everywhere.",
        body: <>The shape &mdash; split, solve each half, cheaply combine &mdash; fits any problem that breaks into a smaller copy of itself. Each box (a <em>node</em>) holds one chunk. The same skeleton multiplies huge numbers and splits work across processors.</>,
      }],
      detail: (
        <>
          <p>The shape of mergesort &mdash; split the problem, solve each half, then cheaply combine &mdash; shows up wherever a problem on <em>n</em> items breaks naturally into the same problem on <em>n/2</em> items with an inexpensive combine step. Each box in the diagram (called a <strong>node</strong> &mdash; just one point in a branching tree of subproblems) holds one chunk of the work.</p>
          <p>Same skeleton, different stories: counting how many pairs in a list are out of order (a sneaky variant of mergesort), finding the closest pair of points on a map, multiplying enormous numbers (Karatsuba&rsquo;s method), the fast Fourier transform behind audio and image processing, and splitting work across two processors that each solve a half and then merge their results.</p>
          <p>When the combine step is the expensive part, this approach can lose; when combining is cheap, it wins big. Mergesort wins precisely because merging is <em>linear</em> &mdash; touching each card once is far cheaper than re-sorting each half from scratch would have been.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 188 }],
      codeLabels: ["split", "recurse_left", "recurse_right", "merge_call"],
    },
    {
      id: "name",
      label: "The pattern",
      // The base line leans on `general`'s divide-and-conquer reveal, which only
      // full-path intuitive sees — every register gets a self-contained variant.
      connector: reg({
        base: "It’s the textbook face of that divide-and-conquer shape — so give it its name and learn to spot it.",
        intuitive: "The split-sort-merge move has earned its proper name — and the cues for spotting it in the wild.",
        structured: "The split-sort-merge rule has earned its name — and the cues that tell you to reach for it.",
        rigorous: "Name it, and file it under the idea it embodies.",
      }),
      takeaway: reg({
        base: "It’s Mergesort — reach for it on big sorts needing dependable speed.",
        intuitive: "It's called mergesort: split to single cards, merge back up — dependably fast at any size.",
        rigorous: "Mergesort: stable, O(n log n) worst case, O(n) space — the canonical decomposition.",
      }),
      visual: (
        <g>
          {sortedRow()}
          <text x={VW / 2} y={ROW_Y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>✓ sorted</text>
        </g>
      ),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Mergesort.",
        body: reg({
          base: <>That&rsquo;s the name. The recursion divides; the merge conquers. Reach for it to sort big data with dependable speed even at its worst, to merge two already-sorted streams, or for a file too big to fit in memory. Open the drawer &mdash; around twenty real lines.</>,
          intuitive: <>Its name is <strong>mergesort</strong> &mdash; the splitting divides, the merging conquers. File it under <strong>idea 4 of 7, decomposition</strong>: solve a smaller version of the same problem. Reach for it on big sorts that must be dependably fast, or whenever two sorted piles need combining &mdash; that&rsquo;s the merge on its own. Open the drawer &mdash; about twenty real lines.</>,
          rigorous: <>Mergesort &mdash; divide and conquer in its textbook form, <strong>idea 4 of 7: decomposition</strong>. Triggers: a guaranteed <code>O(n log n)</code> on big or adversarial data; stability requirements; merging already-sorted streams (the merge alone); external sorting when data outgrows memory. Open the drawer &mdash; the whole thing is about twenty lines.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: <strong>mergesort</strong>. It&rsquo;s the textbook example of <em>divide and conquer</em> &mdash; the recursion does the dividing, and the merge does the conquering.</p>
            <p>Reach for it when you see signals like these:</p>
            <ul>
              <li>&ldquo;Sort&rdquo; on big data where you need a dependable worst-case speed</li>
              <li>&ldquo;Merge two already-sorted streams&rdquo; (that&rsquo;s just the merge step on its own)</li>
              <li>&ldquo;Process a file too big to fit in memory&rdquo; (external mergesort, sorting in chunks)</li>
              <li>Anywhere divide-and-conquer with a cheap linear combine seems to fit</li>
            </ul>
            <p>Open the code drawer for the Python. The recursion is short; the merge is the longer loop. Together they&rsquo;re around twenty lines of real work.</p>
          </>
        ),
        intuitive: (
          <>
            <p>You derived a famous algorithm: <strong>mergesort</strong>. The recursion does the dividing; the merge does the conquering &mdash; <em>divide and conquer</em>, as programmers call that whole family of recipes.</p>
            <p>Cues that say &ldquo;reach for it&rdquo;:</p>
            <ul>
              <li>A big sort that must be dependably fast <em>every</em> time &mdash; no unlucky slow days</li>
              <li>Two already-sorted lists to combine &mdash; that&rsquo;s the two-finger merge on its own</li>
              <li>A file too big for memory &mdash; sort it in chunks, then merge the chunks</li>
            </ul>
            <p>Open the code drawer and read it &mdash; the recursion is four short lines, the merge is the loop, and you can follow every line now.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7 &mdash; decomposition:</strong> solve a smaller version of the same problem &mdash; split to single cards, trust the recipe on each half, combine cheaply.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>Mergesort. Stable (ties resolve left-first), <code>O(n log n)</code> in every case, <code>O(n)</code> auxiliary space, log-depth recursion. Triggers: worst-case guarantees; stability; merging sorted streams &mdash; the merge step alone, <code>O(n + m)</code>; external sort (sorted runs merged k-way) when data exceeds memory. Python&rsquo;s built-in sort is Timsort: mergesort&rsquo;s merge engineered over natural runs, adaptive down to O(n) on nearly-sorted input.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7 &mdash; decomposition, made total:</strong> split to trivial, trust the smaller call, combine linearly &mdash; two pointers in the merge, halving in the levels: the track&rsquo;s moves reunited in one algorithm.
            </div>
          </>
        ),
      }),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: G.y - 36 }],
      codeLabels: ["sig", "merge_call"],
    },
  ],
};
