"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
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
      <text x={sx + boundary * (bw + bg) - bg / 2} y={y - 10} textAnchor="middle" style={{ fontSize: 18, fill: "var(--accent)" }}>▾</text>
      <text x={sx + 2.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>too small</text>
      <text x={sx + 7.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>big enough</text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

export const binarySearchLesson: LessonSpec = {
  topicTitle: "binary search · find 27",
  canvas: { width: VW, height: VH },
  codeSource: binarySearchPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I have the question",
      visual: idleRow(undefined, undefined, { 7: "mid" }),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "A sorted phone book. Find 27.",
        body: <>You&rsquo;re holding a sorted phone book &mdash; a thousand names in order. You wouldn&rsquo;t start at page one. You&rsquo;d flip to the <strong>middle</strong>, see if you&rsquo;ve gone too far, and throw away half. Then again.</>,
      }],
      detail: (
        <>
          <p>Picture a real phone book: a thousand names in alphabetical order, and someone asks you to find one specific name. You&rsquo;d never read it cover to cover from page one.</p>
          <p>You flip to the <strong>middle</strong> and look. If that page comes <em>after</em> the name you want, the whole back half is useless &mdash; ignore it. If it comes <em>before</em>, the front half is gone. Either way, one glance throws away half the book. Then you repeat the same move on whatever&rsquo;s left.</p>
        </>
      ),
      arrows: [{ x1: G.cx(7), y1: 150, x2: G.cx(7), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "scan",
      label: "The obvious thing",
      connector: "So the order is right there in the book — why does reading page by page still feel like wasted effort?",
      actionLabel: "Use the sortedness",
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : i < 6 ? "muted" : undefined)), ARR.map((_, i) => i > 6)),
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Checking one by one wastes the order.",
        body: <>The plain way: page 1, page 2, page 3 &hellip; up to a thousand checks. But the book is <strong>sorted</strong>, and that barely helped. Each page only said &ldquo;not here&rdquo; &mdash; never <em>how far</em> off you were.</>,
      }],
      detail: (
        <>
          <p>The obvious method: read every page in order &mdash; page 1, page 2, page 3 &mdash; until you hit the name. For a thousand pages that&rsquo;s up to a thousand checks. This is a <strong>linear scan</strong>, and its cost is <code>O(n)</code> (&ldquo;order n&rdquo;): the work grows in step with the number of items <code>n</code> &mdash; double the book, double the worst case.</p>
          <p>The frustrating part: the book is already sorted, and the scan barely uses that. Each page you flip past only says &ldquo;not here&rdquo; &mdash; never <em>how far away</em> the name still is. Could a single comparison tell us where it <em>is</em>, not just where it isn&rsquo;t?</p>
        </>
      ),
      arrows: [{ x1: G.cx(3), y1: 300, x2: G.cx(3), y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "Here's the move that answers that — one comparison that tells you which way to go.",
      actionLabel: "Halve, then halve again",
      visual: (api) => <ClickToHalve api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Guess a page — half the book vanishes.",
          body: <>Click any page. Land on a number bigger than 27? Because the book is sorted, <em>everything to its right is bigger too</em> &mdash; all gone, in one look. Smaller? the left half goes. That&rsquo;s the whole trick.</>,
        },
        {
          left: 250, top: 366, width: 360, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> if every guess halves what&rsquo;s left, how many guesses until one page remains?</>,
        },
      ],
      detail: (
        <>
          <p>Click any cell to guess. Because the array is sorted, the moment you land on a number <em>bigger</em> than the target, every number to its right is bigger too &mdash; so they all vanish at once, even though you never looked at them one by one. Land on a <em>smaller</em> number and the whole left side disappears instead.</p>
          <p>One comparison eliminates half of everything still in play. That is the entire trick &mdash; and exactly what the linear scan was throwing away.</p>
        </>
      ),
      codeLabels: ["greater", "hi_update"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "Now turn that one move into a repeatable rule a computer can follow — two markers and a middle check.",
      actionLabel: "Count the work",
      visual: (api) => <AutoBinarySearch api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "Two markers. Always check the middle.",
        body: <>Keep two markers &mdash; <code>lo</code> at the start, <code>hi</code> at the end of what&rsquo;s still possible. Check the middle. Match? done. Too small? the answer&rsquo;s to the right, move <code>lo</code> past it. Too big? move <code>hi</code> before it. <span className="text-[var(--accent-ink)]">Each check drops a whole half.</span></>,
      }],
      detail: (
        <>
          <p>Hold two markers: <code>lo</code> at the start and <code>hi</code> at the end of the part that could still contain the target &mdash; so the answer, if it exists, is somewhere in <code>[lo, hi]</code>.</p>
          <p>Each round, look at the middle: <code>mid = (lo + hi) / 2</code> (rounded down to a whole index). Three outcomes:</p>
          <ul>
            <li><code>arr[mid] == target</code> &mdash; done, return <code>mid</code>.</li>
            <li><code>arr[mid] &lt; target</code> &mdash; the answer is to the right, move <code>lo = mid + 1</code>.</li>
            <li><code>arr[mid] &gt; target</code> &mdash; the answer is to the left, move <code>hi = mid - 1</code>.</li>
          </ul>
          <p>Stop when <code>lo &gt; hi</code>: the search space is empty, so the target isn&rsquo;t there.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle &mdash; search space pruning:</strong> every comparison eliminates an entire side, not just one element.
          </div>
        </>
      ),
      codeLabels: ["init", "loop", "mid"],
      interaction: "playback",
    },
    {
      id: "win",
      label: "The win",
      connector: "Counting the work shows the real payoff — and it scales almost for free.",
      actionLabel: "Same shape, different problems",
      visual: <HalvingCascade />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The win", title: "Halving a million takes about twenty steps.",
        body: <>Checking a thousand pages one by one: up to 1,000 looks. Halving: about 10. A million? one-by-one needs a million; halving needs about 20. That gap is why sorted data everywhere &mdash; from search to database indexes &mdash; runs on this.</>,
      }],
      detail: (
        <>
          <p>Compare the costs head to head. A thousand items one by one: up to 1,000 looks. Halving repeatedly: about 10. Bump it to a million &mdash; one-by-one needs a million, halving needs about 20.</p>
          <p>That &ldquo;about 10/20&rdquo; is <code>log&#8322;</code> (&ldquo;log base two&rdquo;): how many times you can halve a pile before one item remains. Big-O calls it <code>O(log n)</code> &mdash; work that grows by just one extra step each time the data <em>doubles</em>. That gap is why sorted-data tools everywhere lean on it, from Python&rsquo;s <code>bisect</code> to the index pages (B-trees) your database uses to find a row fast.</p>
        </>
      ),
      codeLabels: ["loop", "mid"],
    },
    {
      id: "general",
      label: "The generalization",
      connector: "And the same shape solves problems that don't even look like searching a list.",
      actionLabel: "Name the pattern",
      visual: <Boundary />,
      panels: [{
        left: 150, top: 26, width: 560, variant: "main", label: "The generalization", title: "Anywhere answers flip from “no” to “yes.”",
        body: <>The phone-book version finds an exact value. The deeper one finds the <strong>boundary</strong> between &ldquo;too small&rdquo; and &ldquo;big enough&rdquo; &mdash; e.g. &ldquo;smallest ship that finishes in 14 days?&rdquo; No list at all, but bigger is always easier, so guess the middle and halve.</>,
      }],
      detail: (
        <>
          <p>The phone-book version finds an exact value. The deeper version finds the <strong>boundary</strong> between &ldquo;too small&rdquo; and &ldquo;big enough.&rdquo; Example: &ldquo;What&rsquo;s the smallest ship that finishes all deliveries in 14 days?&rdquo; There&rsquo;s no list to search at all.</p>
          <p>But the answers line up in one direction &mdash; the bigger the ship, the easier the job, so once a size works, every larger size works too. That one-way property is called <strong>monotonicity</strong>, and it&rsquo;s all binary search needs. Guess the middle, ask &ldquo;does this work?&rdquo;, throw away half. Small to big, easy to hard, no to yes &mdash; one check halves it.</p>
        </>
      ),
      codeLabels: ["compare", "less", "greater"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "Give the move its name — and the cues that tell you to reach for it next time.",
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : undefined)), ARR.map((_, i) => i !== 6)),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Binary Search.",
        body: <>That&rsquo;s the name. You&rsquo;ll spot it when you see: a sorted list + find a value; &ldquo;smallest / largest value such that&hellip;&rdquo;; &ldquo;minimum X to make all Y work&rdquo;; or any &ldquo;does this work?&rdquo; that flips from no to yes exactly once as you turn a dial.</>,
      }],
      detail: (
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
      arrows: [{ x1: G.cx(6), y1: G.y + G.cellH + 34, x2: G.cx(6), y2: G.y + G.cellH + 4 }],
      codeLabels: ["found"],
    },
  ],
};
