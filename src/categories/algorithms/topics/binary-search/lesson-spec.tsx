"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
import binarySearchPy from "./algorithm.py";

const ARR = [3, 7, 11, 14, 19, 23, 27, 32, 38, 44, 51, 59, 68, 74, 81];
const TARGET = 27; // index 6
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* ── interactive: click a page, half the book goes dark (the wedge) ───────── */
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
        {last === null ? "click any page to guess" : done ? `found 27 at index ${last}` : `${ARR[last]} ${ARR[last] < TARGET ? "< 27 — left half kept" : "> 27 — right half gone"}`}
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
    }, 950);
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
      visual: idleRow(undefined, undefined, { 7: "mid" }),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "A sorted phone book. Find 27.",
        body: <>You&rsquo;re holding a sorted phone book &mdash; a thousand names in order. You wouldn&rsquo;t start at page one. You&rsquo;d flip to the <strong>middle</strong>, see if you&rsquo;ve gone too far, and throw away half. Then again.</>,
      }],
      arrows: [{ x1: G.cx(7), y1: 150, x2: G.cx(7), y2: G.y - 4 }],
      codeLabels: ["sig"],
    },
    {
      id: "scan",
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : i < 6 ? "muted" : undefined)), ARR.map((_, i) => i > 6)),
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Checking one by one wastes the order.",
        body: <>The plain way: page 1, page 2, page 3 &hellip; up to a thousand checks. But the book is <strong>sorted</strong>, and that barely helped. Each page only said &ldquo;not here&rdquo; &mdash; never <em>how far</em> off you were.</>,
      }],
      arrows: [{ x1: G.cx(3), y1: 300, x2: G.cx(3), y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <ClickToHalve api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The wedge", title: "Guess a page — half the book vanishes.",
          body: <>Click any page. Land on a number bigger than 27? Because the book is sorted, <em>everything to its right is bigger too</em> &mdash; all gone, in one look. Smaller? the left half goes. That&rsquo;s the whole trick.</>,
        },
        {
          left: 250, top: 366, width: 360, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> if every guess halves what&rsquo;s left, how many guesses until one page remains?</>,
        },
      ],
      codeLabels: ["greater", "hi_update"],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: (api) => <AutoBinarySearch api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "Two markers. Always check the middle.",
        body: <>Keep two markers &mdash; <code>lo</code> at the start, <code>hi</code> at the end of what&rsquo;s still possible. Check the middle. Match? done. Too small? the answer&rsquo;s to the right, move <code>lo</code> past it. Too big? move <code>hi</code> before it. <span className="text-[var(--accent-ink)]">Each check drops a whole half.</span></>,
      }],
      codeLabels: ["init", "loop", "mid"],
      interaction: "playback",
    },
    {
      id: "win",
      visual: <HalvingCascade />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The win", title: "Halving a million takes about twenty steps.",
        body: <>Checking a thousand pages one by one: up to 1,000 looks. Halving: about 10. A million? one-by-one needs a million; halving needs about 20. That gap is why sorted data everywhere &mdash; from search to database indexes &mdash; runs on this.</>,
      }],
      codeLabels: ["loop", "mid"],
    },
    {
      id: "general",
      visual: <Boundary />,
      panels: [{
        left: 150, top: 26, width: 560, variant: "main", label: "The generalization", title: "Anywhere answers flip from “no” to “yes.”",
        body: <>The phone-book version finds an exact value. The deeper one finds the <strong>boundary</strong> between &ldquo;too small&rdquo; and &ldquo;big enough&rdquo; &mdash; e.g. &ldquo;smallest ship that finishes in 14 days?&rdquo; No list at all, but bigger is always easier, so guess the middle and halve.</>,
      }],
      codeLabels: ["compare", "less", "greater"],
    },
    {
      id: "name",
      visual: idleRow(ARR.map((_, i) => (i === 6 ? "good" : undefined)), ARR.map((_, i) => i !== 6)),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Binary Search.",
        body: <>That&rsquo;s the name. You&rsquo;ll spot it when you see: a sorted list + find a value; &ldquo;smallest / largest value such that&hellip;&rdquo;; &ldquo;minimum X to make all Y work&rdquo;; or any &ldquo;does this work?&rdquo; that flips from no to yes exactly once as you turn a dial.</>,
      }],
      arrows: [{ x1: G.cx(6), y1: G.y + G.cellH + 34, x2: G.cx(6), y2: G.y + G.cellH + 4 }],
      codeLabels: ["found"],
    },
  ],
};
