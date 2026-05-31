"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
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
  const [reachedAtomic, setReachedAtomic] = useState(false);
  const [mergedOnce, setMergedOnce] = useState(false);

  const split = () => {
    api.onActiveLine(["split", "recurse_left", "recurse_right"]);
    setSegs((cur) => {
      const next = splitAll(cur);
      if (allAtomic(next)) { setPhase("merging"); setReachedAtomic(true); }
      return next;
    });
  };
  const merge = () => {
    api.onActiveLine(["merge_loop", "merge_compare", "merge_take"]);
    setMergedOnce(true);
    setSegs((cur) => mergeOneLevel(cur));
    // Unlock "Next" only after the full journey: split to singles AND merged.
    if (reachedAtomic) api.onInteractionDone();
  };
  const reset = () => { setSegs(startSegments()); setPhase("splitting"); setReachedAtomic(false); setMergedOnce(false); };

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
      {mergedOnce && !reachedAtomic && (
        <text x={VW / 2} y={ROW_Y + 124} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>split all the way to single cards first</text>
      )}
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

export const mergesortLesson: LessonSpec = {
  topicTitle: "mergesort · sort eight cards",
  canvas: { width: VW, height: VH },
  codeSource: mergesortPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "Try the obvious thing",
      visual: (
        <g>
          {idleRow()}
          <Bracket x1={G.left(0)} x2={G.left(7) + G.cellW} y={G.y - 14} label="sort these" color="var(--text-muted)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "Eight cards in a jumble. Put them in order.",
        body: <>Eight cards landed out of order: 5, 2, 4, 7, 1, 3, 8, 6. Sorting eight by eye is easy. But computers sort tables with <strong>hundreds of millions of rows</strong> &mdash; every leaderboard, every database lookup. The <em>method</em> is what matters.</>,
      }],
      detail: (
        <>
          <p>You&rsquo;ve got eight cards spread on the table, face up, in whatever order they landed: <code>5, 2, 4, 7, 1, 3, 8, 6</code>. The job is simply to put them in order, smallest to largest.</p>
          <p>Eight cards is easy to do by eye. Eighty is annoying. Eight hundred <em>million</em> is the kind of thing computers spend their lives doing &mdash; every time a database joins two tables, ranks search results, or builds a leaderboard, something is sorting. At that size you can&rsquo;t eyeball it, so the exact <em>method</em> you use is what decides whether the answer comes back in a second or a week.</p>
        </>
      ),
      arrows: [{ x1: G.cx(3), y1: 150, x2: G.cx(3), y2: G.y - 28 }],
      codeLabels: ["sig"],
    },
    {
      id: "naive",
      label: "The obvious thing",
      connector: "Eight by eye was easy — so what’s the most obvious recipe a computer could follow?",
      actionLabel: "Split. Sort. Merge.",
      visual: idleRow(ARR.map((_, i) => (i === 0 || i === 1 ? "muted" : undefined))),
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Swap neighbours until nothing's backwards.",
        body: <>The first idea: walk left to right, swap any pair that&rsquo;s out of order, repeat. It works but crawls &mdash; each swap fixes one tiny disagreement, so moving a card far means swapping it past every neighbour. Double the cards and the work roughly <em>quadruples</em>.</>,
      }],
      detail: (
        <>
          <p>The first method everyone reaches for: walk left to right and swap any two neighbours that are out of order. Do a full pass; if you made any swaps, do another. When a whole pass makes zero swaps, everything is sorted. It works &mdash; it&rsquo;s just slow.</p>
          <p>The trouble is that each swap only fixes one tiny local disagreement between two touching cards. To carry a card a long way across the row, you have to swap it past <em>every single neighbour</em> on the way. So the total work grows like the <em>square</em> of the size &mdash; written <code>O(n&sup2;)</code> (&ldquo;order n squared&rdquo;, meaning the work scales with the number of cards <code>n</code> multiplied by itself). A thousand cards can mean about a million swaps; double the cards and the work roughly quadruples.</p>
          <p>What we really want is a way to move information across the row in big chunks instead of one nudge at a time.</p>
        </>
      ),
      arrows: [{ x1: G.cx(0) + G.stride / 2, y1: 300, x2: G.cx(0) + G.stride / 2, y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "If single swaps move cards too slowly, what if we could move a whole side at once?",
      actionLabel: "Press play and watch",
      visual: (api) => <SplitMerge api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Cut in half. Sort each half. Merge them.",
          body: <>Pretend the two halves are already sorted. Finishing is easy: walk both with two fingers, always take the smaller card &mdash; one pass, each card seen once. The only question left is &ldquo;how do I sort a half?&rdquo; Same trick, smaller. <strong>Press split, then merge.</strong></>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> keep cutting until each piece is a single card &mdash; and one card is already in order. Then merge the pieces back, two at a time.</>,
        },
      ],
      detail: (
        <>
          <p>Here&rsquo;s the instinct. Pretend, just for a moment, that the left half of the row and the right half are each <em>already</em> sorted. Then finishing the whole row is easy: put one finger at the front of each half and compare. Whichever finger points at the smaller card, take that card and slide that finger forward. Keep going and the cards come out in perfect order &mdash; a single left-to-right pass where each card is touched once. That step is called a <strong>merge</strong>.</p>
          <p>So the hard question shrinks to a smaller version of itself: how do you sort a half? The same way &mdash; cut it in half, sort the two pieces, merge them. The pieces keep getting smaller until each is a <em>single card</em>, and a single card is already sorted, so the splitting stops there. A rule that solves a problem by calling itself on a smaller piece is called <strong>recursion</strong>.</p>
          <p>Press <strong>split</strong> on the right and watch the row break into halves, quarters, then singletons. Then press <strong>merge</strong> and watch the sorted pieces fuse back upward.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The instinct:</strong> sorting halves and merging them is far less work than swap-by-swap, because the merge moves cards from one side to the other in one clean sweep instead of one nudge at a time.</div>
        </>
      ),
      codeLabels: ["split", "recurse_left", "recurse_right"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "You just did it by hand — now turn that split-sort-merge move into a rule a computer can repeat.",
      actionLabel: "Count the work",
      visual: (api) => <AutoMergesort api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "A recipe that calls itself, plus a two-finger merge.",
        body: <>Write <code>sort</code> as <strong>recursion</strong> &mdash; a recipe that calls itself on a smaller piece. Simplest case: 0 or 1 cards are already sorted, hand them back. Otherwise find the middle, sort each half, then merge. The merge uses two <em>fingers</em> &mdash; markers showing where you&rsquo;re looking in each half.</>,
      }],
      detail: (
        <>
          <p>Write the recipe as <code>sort(arr)</code> &mdash; a rule that calls itself on smaller pieces (that self-calling is <strong>recursion</strong>). It has two cases.</p>
          <p><strong>The simplest case.</strong> If the list has 0 or 1 cards, it&rsquo;s already in order &mdash; just hand it straight back. This is what stops the recursion from going forever.</p>
          <p><strong>The general case.</strong> Find the middle. Let <code>left = sort(arr[:mid])</code> and <code>right = sort(arr[mid:])</code> &mdash; sort each half by the very same rule &mdash; then return <code>merge(left, right)</code>.</p>
          <p><strong>The merge.</strong> Use two <em>fingers</em> &mdash; pointers marking where you&rsquo;re looking in each half: <code>i</code> at the front of <code>left</code>, <code>j</code> at the front of <code>right</code>. Whichever points at the smaller card, write that card to the output and step that finger forward. When one side runs out, dump whatever&rsquo;s left of the other side onto the end.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]"><strong>The principle &mdash; decomposition:</strong> a hard sort becomes two smaller sorts plus a cheap merge, and those smaller sorts solve themselves by the exact same rule.</div>
        </>
      ),
      codeLabels: ["base", "split", "recurse_left", "recurse_right", "merge_call"],
      interaction: "playback",
    },
    {
      id: "ops",
      label: "The operations",
      connector: "The rule clearly works — but is it actually faster than swapping? Count the steps.",
      actionLabel: "Same shape, new problems",
      visual: <CostLevels />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The operations", title: "Halve down a few levels; one walk per level.",
        body: <>A thousand cards take about ten cuts to reach single cards &mdash; call that count of halvings <code>log n</code> (it grows slowly: double the cards, add one cut). Each level touches every card once: <code>n</code>, the number of cards. Total <code>n × log n</code> &mdash; 20 million steps for a million cards, not a trillion.</>,
      }],
      detail: (
        <>
          <p><strong>How many times do we cut?</strong> Each split halves the pile. Halving a thousand cards down to single cards takes only about ten steps (because halving ten times splits roughly a thousand into one). That count of halvings is written <code>O(log n)</code> (&ldquo;order log n&rdquo;) &mdash; a cost that grows very slowly: <em>doubling</em> the number of cards adds just one more level.</p>
          <p><strong>How much work at each level?</strong> Every merge on a level looks at each card in its slice exactly once, and across the whole level the merges touch every card &mdash; that&rsquo;s <code>O(n)</code> (&ldquo;order n&rdquo;), work proportional to the number of cards <code>n</code>.</p>
          <p><strong>Total.</strong> <code>n</code> cards per level times about <code>log n</code> levels gives <code>O(n log n)</code>. For a million cards that&rsquo;s roughly twenty million steps &mdash; not the trillion that swap-by-swap (<code>O(n&sup2;)</code>) would have demanded.</p>
          <p><strong>Memory.</strong> The merge needs a second strip of space to write the combined result into, so it uses <code>O(n)</code> extra memory &mdash; an amount that grows with the number of cards. Some sorts (like quicksort) avoid that extra copy, but they trade away a different guarantee to do it.</p>
        </>
      ),
      arrows: [{ x1: 160, y1: 156, x2: 182, y2: 220 }],
      codeLabels: ["split", "merge_loop", "merge_tail"],
    },
    {
      id: "general",
      label: "The generalization",
      connector: "That n log n win wasn’t luck — it comes from a shape that shows up far beyond sorting.",
      actionLabel: "Name the pattern",
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
      connector: "It’s the textbook face of that divide-and-conquer shape — so give it its name and learn to spot it.",
      visual: (
        <g>
          {sortedRow()}
          <text x={VW / 2} y={ROW_Y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>✓ sorted</text>
        </g>
      ),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Mergesort.",
        body: <>That&rsquo;s the name. The recursion divides; the merge conquers. Reach for it to sort big data with dependable speed even at its worst, to merge two already-sorted streams, or for a file too big to fit in memory. Open the drawer &mdash; under twenty real lines.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: <strong>mergesort</strong>. It&rsquo;s the textbook example of <em>divide and conquer</em> &mdash; the recursion does the dividing, and the merge does the conquering.</p>
          <p>Reach for it when you see signals like these:</p>
          <ul>
            <li>&ldquo;Sort&rdquo; on big data where you need a dependable worst-case speed</li>
            <li>&ldquo;Merge two already-sorted streams&rdquo; (that&rsquo;s just the merge step on its own)</li>
            <li>&ldquo;Process a file too big to fit in memory&rdquo; (external mergesort, sorting in chunks)</li>
            <li>Anywhere divide-and-conquer with a cheap linear combine seems to fit</li>
          </ul>
          <p>Open the code drawer for the Python. The recursion is short; the merge is the longer loop. Together they&rsquo;re fewer than twenty lines of real work.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: G.y - 36 }],
      codeLabels: ["sig", "merge_call"],
    },
  ],
};
