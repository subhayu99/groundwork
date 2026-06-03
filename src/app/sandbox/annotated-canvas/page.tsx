"use client";

/**
 * PROTOTYPE — full binary-search lesson, "annotated canvas" form.
 *
 * Same content as the real lesson (src/categories/algorithms/topics/binary-search):
 * the sorted phone book, the 15-cell array searching for 27, all 7 derivation
 * beats in their real first-principles voice — but the explanation lives ON the
 * visual plane (positioned per beat, with arrows to the thing it describes)
 * instead of in a separate column of cards. Go/no-go artifact.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { prepareCode, resolveLines } from "@/shared/code/syncAnchors";
import binarySearchPy from "@/categories/algorithms/topics/binary-search/algorithm.py";

// Real algorithm.py, parsed once: strip @sync markers for display, build the
// label→line index. The same single-source-of-truth sync the live app uses.
const { code: PY_CODE, labelToLine } = prepareCode(binarySearchPy);

const ARR = [3, 7, 11, 14, 19, 23, 27, 32, 38, 44, 51, 59, 68, 74, 81];
const TARGET = 27; // index 6

const VW = 860, VH = 470; // canvas design size; scaled to fit its area at runtime
const CW = 40, GAP = 6, STRIDE = CW + GAP, CH = 40, CY = 250;
const ROW_W = ARR.length * CW + (ARR.length - 1) * GAP;
const X0 = (VW - ROW_W) / 2;
const cellX = (i: number) => X0 + i * STRIDE;
const cx = (i: number) => cellX(i) + CW / 2;

type Tone = "idle" | "live" | "gone" | "mid" | "found" | "visited" | "no" | "yes";
const FILL: Record<Tone, string> = {
  idle: "var(--bg-card)",
  live: "var(--bg-card)",
  gone: "var(--bg-inset)",
  visited: "color-mix(in oklab, var(--diff-med) 14%, var(--bg-card))",
  mid: "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))",
  found: "color-mix(in oklab, var(--diff-easy) 32%, var(--bg-card))",
  no: "color-mix(in oklab, var(--diff-hard) 20%, var(--bg-card))",
  yes: "color-mix(in oklab, var(--diff-easy) 22%, var(--bg-card))",
};
const STROKE: Record<Tone, string> = {
  idle: "var(--line)", live: "var(--line)", gone: "var(--line-faint)",
  visited: "var(--diff-med)", mid: "var(--accent-line)", found: "var(--diff-easy)",
  no: "var(--diff-hard)", yes: "var(--diff-easy)",
};

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-sky)" strokeWidth={2} markerEnd="url(#ac-arrow)" />;
}

/* The cells row, shared by the array beats. */
function Cells({ tones, markers, values = ARR }: { tones: Tone[]; markers?: Record<number, string>; values?: number[] }) {
  return (
    <>
      {values.map((v, i) => {
        const t = tones[i] ?? "idle";
        return (
          <g key={i}>
            <rect x={cellX(i)} y={CY} width={CW} height={CH} rx={8}
              style={{ fill: FILL[t], stroke: STROKE[t], transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            <text x={cx(i)} y={CY + CH / 2} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none"
              style={{ fontSize: 14, fill: t === "gone" ? "var(--text-faint)" : "var(--text)", transition: "fill .3s" }}>
              {v}
            </text>
            {markers?.[i] && (
              <g>
                <rect x={cx(i) - 13} y={CY + CH + 7} width={26} height={16} rx={5}
                  fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1} />
                <text x={cx(i)} y={CY + CH + 15} textAnchor="middle" dominantBaseline="central"
                  className="font-mono select-none" style={{ fontSize: 10, fill: "var(--accent-ink)" }}>
                  {markers[i]}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
}

/* a square-bracket spanning cells [a..b] with a label, for "this whole half is gone" */
function Bracket({ a, b, label, color = "var(--diff-hard)" }: { a: number; b: number; label: string; color?: string }) {
  const x1 = cellX(a) - 2, x2 = cellX(b) + CW + 2, y = CY - 12;
  return (
    <g>
      <path d={`M${x1},${y + 8} L${x1},${y} L${x2},${y} L${x2},${y + 8}`} fill="none" stroke={color} strokeWidth={1.5} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: color }}>{label}</text>
    </g>
  );
}

type PanelPos = { left: number; top: number; width: number };
interface Beat {
  label: string;
  title: string;
  panel: PanelPos;
  text: React.ReactNode;
  svg: React.ReactNode;
  /** extra small panel (e.g. the wedge question) */
  panel2?: { pos: PanelPos; node: React.ReactNode };
  /** @sync labels in algorithm.py whose lines light up on this beat */
  codeLabels: string[];
}

const liveAll = (): Tone[] => ARR.map(() => "live");

const BEATS: Beat[] = [
  // 1 — setup
  {
    label: "The setup",
    title: "A sorted phone book. Find page 27.",
    panel: { left: 150, top: 28, width: 560 },
    text: (
      <>
        You&rsquo;re holding a sorted phone book &mdash; a thousand names, all in order. Someone says
        &ldquo;find&nbsp;27.&rdquo; You wouldn&rsquo;t start at page&nbsp;one. You&rsquo;d flip to the{" "}
        <strong>middle</strong>, see if you&rsquo;ve gone too far, and throw away half. Then do it again.
      </>
    ),
    svg: (() => { const t = liveAll(); t[7] = "mid"; return <><Cells tones={t} markers={{ 7: "mid" }} /><Arrow x1={cx(7)} y1={150} x2={cx(7)} y2={CY - 4} /></>; })(),
    codeLabels: ["sig"],
  },
  // 2 — linear scan
  {
    label: "The obvious thing",
    title: "Scanning throws away the sortedness.",
    panel: { left: 150, top: 322, width: 580 },
    text: (
      <>
        The dumb way: page 1, page 2, page 3 &hellip; up to a thousand checks. But the book is{" "}
        <strong>sorted</strong>, and we&rsquo;ve barely used that. Each page only says &ldquo;not
        here&rdquo; &mdash; never <em>how far away</em> she is. What if one check could tell us where she
        is, not just where she isn&rsquo;t?
      </>
    ),
    svg: (() => { const t = liveAll(); for (let i = 0; i <= 5; i++) t[i] = "visited"; t[6] = "mid"; return <><Cells tones={t} /><Arrow x1={cx(3)} y1={322} x2={cx(3)} y2={CY + CH + 4} /></>; })(),
    codeLabels: ["sig"],
  },
  // 3 — wedge
  {
    label: "The wedge",
    title: "Guess a page — half the book vanishes.",
    panel: { left: 150, top: 28, width: 560 },
    text: (
      <>
        Guess any page &mdash; say you land on <strong>59</strong>. It&rsquo;s bigger than 27, and because
        the book is sorted, <em>everything to its right is bigger too.</em> All of it &mdash; gone, in one
        look. That&rsquo;s the entire trick.
      </>
    ),
    panel2: {
      pos: { left: 250, top: 330, width: 360 },
      node: (
        <>
          <strong className="text-[var(--accent-ink)]">The wedge:</strong> if every check halves what&rsquo;s
          left, how many checks until just one page remains?
        </>
      ),
    },
    svg: (() => { const t = liveAll(); for (let i = 11; i <= 14; i++) t[i] = "gone"; t[11] = "mid"; return <><Cells tones={t} /><Bracket a={11} b={14} label="all gone in one look" /><Arrow x1={cx(11)} y1={150} x2={cx(11)} y2={CY - 4} /></>; })(),
    codeLabels: ["greater", "hi_update"],
  },
  // 4 — derivation
  {
    label: "The derivation",
    title: "Two markers. Always check the middle.",
    panel: { left: 150, top: 24, width: 580 },
    text: (
      <>
        Hold two markers: <code>lo</code> at the start and <code>hi</code> at the end of what&rsquo;s still
        possible. Look at the <strong>middle</strong>. If it&rsquo;s your target &mdash; done. Too small? the
        answer is to the right, so move <code>lo</code> past it. Too big? move <code>hi</code> before it. When
        they cross, it isn&rsquo;t there. <span className="text-[var(--accent-ink)]">Each check eliminates a
        whole side &mdash; not one cell.</span>
      </>
    ),
    svg: (() => { const t = liveAll(); t[7] = "mid"; return <><Cells tones={t} markers={{ 0: "lo", 7: "mid", 14: "hi" }} /><Arrow x1={cx(7)} y1={150} x2={cx(7)} y2={CY - 4} /></>; })(),
    codeLabels: ["init", "loop", "mid"],
  },
  // 5 — the win (halving cascade)
  {
    label: "The win",
    title: "Halving a million takes about twenty steps.",
    panel: { left: 150, top: 28, width: 560 },
    text: (
      <>
        Scanning a thousand pages: up to <strong>1,000</strong> checks. Binary search: about{" "}
        <strong>10</strong>. Make it a million &mdash; scanning needs a million; halving needs about{" "}
        <strong>20</strong>. That gap is why every sorted-data system &mdash; from Python&rsquo;s{" "}
        <code>bisect</code> to the index pages of your database &mdash; runs on binary search.
      </>
    ),
    svg: (() => {
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
    })(),
    codeLabels: ["loop", "mid"],
  },
  // 6 — generalization (no → yes boundary)
  {
    label: "The generalization",
    title: "Anywhere answers go from “no” to “yes.”",
    panel: { left: 150, top: 26, width: 560 },
    text: (
      <>
        The phone-book version finds an exact value. The deeper version finds the <strong>boundary</strong>{" "}
        between &ldquo;too small&rdquo; and &ldquo;big enough.&rdquo; Ask: <em>&ldquo;smallest ship that
        finishes the deliveries in 14 days?&rdquo;</em> &mdash; no list at all, but a bigger ship is always
        easier, so the answers line up one way. Guess in the middle, throw away half.
      </>
    ),
    svg: (() => {
      const n = 10, bw = 48, bg = 8, total = n * bw + (n - 1) * bg, sx = (VW - total) / 2, y = 252;
      const boundary = 6; // first "yes"
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const x = sx + i * (bw + bg), yes = i >= boundary;
            return (
              <g key={i}>
                <rect x={x} y={y} width={bw} height={40} rx={8} fill={yes ? FILL.yes : FILL.no} stroke={yes ? STROKE.yes : STROKE.no} strokeWidth={2} />
                <text x={x + bw / 2} y={y + 20} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--text)" }}>{yes ? "yes" : "no"}</text>
              </g>
            );
          })}
          <text x={sx + boundary * (bw + bg) - bg / 2} y={y - 28} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>binary-search this boundary</text>
          <text x={sx + boundary * (bw + bg) - bg / 2} y={y - 10} textAnchor="middle" style={{ fontSize: 18, fill: "var(--accent)" }}>▾</text>
          <text x={sx + 2.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>ship too small</text>
          <text x={sx + 7.5 * (bw + bg)} y={y + 60} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>big enough</text>
        </g>
      );
    })(),
    codeLabels: ["compare", "less", "greater"],
  },
  // 7 — the name
  {
    label: "The pattern",
    title: "Binary Search.",
    panel: { left: 150, top: 24, width: 600 },
    text: (
      <>
        That&rsquo;s the name. Two conventions: <code>lo ≤ hi</code> (closed) or <code>lo &lt; hi</code>{" "}
        (half-open) &mdash; pick one and stop second-guessing. You&rsquo;ll spot it when you see:
        <ul className="list-disc pl-5 mt-1.5 space-y-0.5 text-[13px]">
          <li>a sorted array + find, or find-the-insert-position</li>
          <li>&ldquo;smallest / largest value such that&hellip;&rdquo;</li>
          <li>&ldquo;minimum X to make all Y work&rdquo;</li>
          <li>any &ldquo;does this work?&rdquo; that flips no→yes once as you turn a dial</li>
        </ul>
      </>
    ),
    svg: (() => { const t: Tone[] = ARR.map(() => "gone"); t[6] = "found"; return <><Cells tones={t} markers={{ 6: "✓" }} /><Arrow x1={cx(6)} y1={CY + CH + 30} x2={cx(6)} y2={CY + CH + 4} /></>; })(),
    codeLabels: ["found"],
  },
];

export default function AnnotatedCanvasBinarySearch() {
  const [b, setB] = useState(0);
  const [showCode, setShowCode] = useState(true);
  const beat = BEATS[b];

  // Scale the fixed-size canvas (svg + the absolutely-positioned HTML panels,
  // together) to fit whatever area the column gives it — so it actually fills
  // the desktop viewport instead of floating at a fixed size.
  const areaRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(w / VW, h / VH, 1.9)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showCode]);

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      <div className="shrink-0 flex flex-col items-center gap-0.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">prototype · binary search · annotated canvas</span>
        </div>
        <p className="text-xs text-[var(--text-faint)]">Real lesson content — explanation lives on the visual, one beat at a time.</p>
      </div>

      {/* main fills the viewport — two vertical sections on desktop, stacked on mobile.
          Back/Next sit directly under the canvas, reachable without scrolling past the code. */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 pb-4 justify-center w-full">
        {/* LEFT — canvas (scales to fill its area) + controls beneath */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div ref={areaRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
            <div style={{ width: VW * scale, height: VH * scale }} className="relative shrink-0">
              <div
                className="absolute top-0 left-0 rounded-2xl border border-[var(--line-faint)] bg-[var(--bg-inset)]"
                style={{ width: VW, height: VH, transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
              <svg width={VW} height={VH} className="absolute inset-0 overflow-visible">
                <defs>
                  <marker id="ac-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto-start-reverse">
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-sky)" />
                  </marker>
                </defs>
                <AnimatePresence mode="wait">
                  <motion.g key={b} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    {beat.svg}
                  </motion.g>
                </AnimatePresence>
              </svg>

              {/* main text panel — on the plane */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={b}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}
                  className="absolute rounded-xl border border-[var(--accent-line)] p-3.5"
                  style={{ left: beat.panel.left, top: beat.panel.top, width: beat.panel.width, background: "color-mix(in oklab, var(--accent-sky) 9%, var(--bg-card))" }}
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">{beat.label}</div>
                  <div className="font-semibold text-[15px] mt-0.5 mb-1.5 text-[var(--text)]">{beat.title}</div>
                  <div className="text-[13.5px] leading-relaxed text-[var(--text-muted)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)]">{beat.text}</div>
                </motion.div>
              </AnimatePresence>

              {beat.panel2 && (
                <div className="absolute rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-[12.5px] leading-snug text-[var(--text-muted)]"
                  style={{ left: beat.panel2.pos.left, top: beat.panel2.pos.top, width: beat.panel2.pos.width }}>
                  {beat.panel2.node}
                </div>
              )}
              </div>
            </div>
          </div>

          {/* controls — directly beneath the canvas */}
          <div className="flex items-center gap-4">
            <button onClick={() => setB((x) => Math.max(0, x - 1))} disabled={b === 0}
              className="min-h-[40px] px-4 rounded-lg border border-[var(--line)] text-[var(--text-muted)] disabled:opacity-40 hover:border-[var(--line-strong)]">← Back</button>
            <div className="flex items-center gap-2">
              {BEATS.map((_, i) => (
                <button key={i} onClick={() => setB(i)} aria-label={`beat ${i + 1}: ${BEATS[i].label}`}
                  className="w-2.5 h-2.5 rounded-full transition-colors" style={{ backgroundColor: i === b ? "var(--accent)" : "var(--line)" }} />
              ))}
            </div>
            <button onClick={() => setB((x) => Math.min(BEATS.length - 1, x + 1))} disabled={b === BEATS.length - 1}
              className="min-h-[40px] px-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] disabled:opacity-40">Next →</button>
            {!showCode && (
              <button onClick={() => setShowCode(true)} aria-label="show code panel"
                className="ml-1 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)] font-mono text-[11px]">
                <span>&lt;/&gt;</span> code
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — collapsible code pane (its own vertical section on desktop) */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
              className="flex flex-col min-h-0 w-full xl:flex-1 xl:max-w-[680px] xl:min-w-[440px]"
            >
              <div className="shrink-0 flex items-center justify-between mb-1.5 px-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
                  python · binary_search.py <span className="text-[var(--accent-ink)] normal-case">· ▶ line follows the beat</span>
                </span>
                <button onClick={() => setShowCode(false)} aria-label="collapse code panel" title="collapse code"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <CodeHighlight code={PY_CODE} highlightedLines={resolveLines(beat.codeLabels, labelToLine) ?? []} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
