"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, gridGeom, GridCells, Pill } from "@/shared/lesson/canvas";
import hash_mapsPy from "./algorithm.py";

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
      api.onActiveLine(["hm_get_scan"]);
      if (next >= NAMES.length || NAMES[next] === TARGET) { setS({ cursor: next, done: true }); return; }
      setS({ cursor: next, done: false });
    }, 360);
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
    }, 420);
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
      <text x={VW / 2} y={GRID.y0 - 14} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: s.done ? "var(--diff-easy)" : "var(--text-faint)" }}>
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
      <text x={VW / 2} y={GRID.y0 - 14} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
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

export const hashMapsLesson: LessonSpec = {
  topicTitle: "hash maps · find Alice's number",
  canvas: { width: VW, height: VH },
  codeSource: hash_mapsPy as string,
  beats: [
    {
      id: "setup",
      visual: idleRow(),
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The setup", title: "A phone book of ten thousand names. Find Alice.",
        body: <>You&rsquo;re holding a phone book &mdash; ten thousand names, in no order. Someone asks for Alice&rsquo;s number. You don&rsquo;t know her page, or even if she&rsquo;s listed. Every answer costs work. How much does finding one name cost?</>,
      }],
      codeLabels: [],
    },
    {
      id: "scan",
      visual: (api) => <LinearScan api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Open page one. Start reading.",
        body: <>The simple way is to <strong>scan</strong> &mdash; read names top to bottom until you hit Alice. On entry 4,872 that&rsquo;s 4,872 reads; if she&rsquo;s missing, all ten thousand. Cost grows with the pile &mdash; we call that <strong>O(n)</strong>. What if the name itself told you the page?</>,
      }],
      arrows: [{ x1: ROW.cx(1), y1: 184, x2: ROW.cx(1), y2: ROW.y - 4 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      visual: (api) => <HashAddress api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 580, variant: "main", label: "The wedge", title: "Pick a name. Watch its address appear.",
          body: <>Click a name and a <strong>hash function</strong> &mdash; a tiny recipe that chews the letters into a number &mdash; hands you a box. It looks nothing up; it just computes, then takes mod 16 (the remainder after dividing by 16, which wraps the answer into a box from 0&ndash;15). One hop, however huge the book.</>,
        },
        {
          left: 250, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> what if every key knew where to find itself?</>,
        },
      ],
      codeLabels: ["hm_slot"],
      interaction: "wedge",
    },
    {
      id: "structure",
      visual: (api) => <DropIntoBuckets api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The structure", title: "An array of boxes, addressed by the hash.",
        body: <>A hash map is two parts. One: a plain array of slots we call <strong>buckets</strong> &mdash; jumping to box number i (written <code>arr[i]</code>) is instant, however big the array. Two: the hash function. Store = hash, drop in the box. Most boxes hold one name; some get crowded.</>,
      }],
      arrows: [{ x1: GRID.cx(0, 0), y1: 178, x2: GRID.cx(0, 0), y2: GRID.cy(0, 0) - GRID.cellPx / 2 - 4 }],
      codeLabels: ["hm_put_slot", "hm_put_append"],
      interaction: "playback",
    },
    {
      id: "operations",
      visual: <CollisionGrid />,
      panels: [
        {
          left: 150, top: 22, width: 580, variant: "main", label: "The operations", title: "Constant time — on average.",
          body: <>Insert, look up, delete: all <strong>O(1)</strong> on average &mdash; cost stays flat whether the table holds ten keys or ten million. A <strong>collision</strong> is two keys landing in one box; we <strong>chain</strong> them (keep a tiny list per box) so both fit. When the table fills, we build a bigger one &mdash; slow, but rare.</>,
        },
        {
          left: 568, top: 300, width: 282, variant: "note",
          body: <>Box 2 holds three names &mdash; <code>fawn, eli, june</code>. Looking one up still walks only that one short box, never the whole table.</>,
        },
      ],
      arrows: [{ x1: GRID.cx(0, 2), y1: 178, x2: GRID.cx(0, 2), y2: GRID.cy(0, 2) - GRID.cellPx / 2 - 4 }],
      codeLabels: ["hm_put_scan", "hm_put_overwrite", "hm_get_scan"],
    },
    {
      id: "fit",
      visual: <FitBoard />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When it fits", title: "Lookups by key. Counting. Caching. Most things.",
        body: <>Reach for a hash map whenever you&rsquo;d say &ldquo;given X, find Y&rdquo; &mdash; counting how often each word appears, remembering (<strong>caching</strong>) an expensive result, removing duplicates, joining two datasets. The one thing it can&rsquo;t do: keep order, or answer &ldquo;all keys between A and M.&rdquo;</>,
      }],
      codeLabels: ["lookup", "membership"],
    },
    {
      id: "name",
      visual: <SummaryCard />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Hash map. A dictionary, in Python.",
        body: <>That&rsquo;s the named pattern: hash map, hash table, <strong>dictionary</strong> (a store of key&rarr;value pairs), associative array &mdash; same idea everywhere. Python&rsquo;s <code>dict</code> is one; so are JavaScript&rsquo;s <code>Map</code> and Java&rsquo;s <code>HashMap</code>. The principle underneath: spend memory to never search.</>,
      }],
      codeLabels: ["dict_init", "insert", "lookup"],
    },
  ],
};
