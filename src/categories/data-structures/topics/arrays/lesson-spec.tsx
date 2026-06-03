"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import arraysPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const TARGET = 6; // the slot we keep pointing at in the small stand-in row
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250, 48, 8, 44);

/* ── interactive WEDGE: drag to any slot, the cursor lands there in one step ── */
function DragToSlot({ api }: { api: BeatVisualApi }) {
  const [i, setI] = useState(0);
  const [touched, setTouched] = useState(false);

  const pick = (idx: number) => {
    setI(idx);
    setTouched(true);
    api.onInteractionDone();
    api.onActiveLine(["index_read"]);
  };

  const tones: (Tone | undefined)[] = ARR.map((_, k) => (k === i ? "good" : undefined));

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} markers={{ [i]: "↑ here" }} onCellClick={pick} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        {touched ? `arr[${i}] = ${ARR[i]}  ·  base + ${i} × cellSize  ·  1 jump` : "click any slot — you land on it in one step, no counting"}
      </text>
      {/* the slot index strip, so "index = position number, counting from 0" is visible */}
      {ARR.map((_, k) => (
        <text key={k} x={G.cx(k)} y={G.y + G.cellH + 30} textAnchor="middle" className="font-mono select-none pointer-events-none"
          style={{ fontSize: 9, fill: k === i ? "var(--accent-ink)" : "var(--text-faint)" }}>{k}</text>
      ))}
    </g>
  );
}

/* ── playback: insert in the middle runs itself; the tail visibly shifts right ─ */
interface OpState { arr: number[]; mid: number | null; shifted: number[]; done: boolean; shifts: number; }
function AutoInsert({ api }: { api: BeatVisualApi }) {
  const BASE = [3, 1, 4, 5, 9, 2, 6, 5];
  const NEW = 8;
  const MID = 3;
  const init = (): OpState => ({ arr: BASE, mid: null, shifted: [], done: false, shifts: 0 });
  const [s, setS] = useState<OpState>(init);
  const ref = useRef(s); ref.current = s;
  const stepRef = useRef(0);

  useEffect(() => {
    stepRef.current = 0;
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const step = stepRef.current;
      // shift the tail one element at a time, from the back, to make O(n) felt
      const tailFromEnd = BASE.length - 1 - step; // index in BASE being pushed right
      if (tailFromEnd >= MID) {
        api.onActiveLine(["insert_mid"]);
        setS({ ...c, mid: null, shifted: [...c.shifted, tailFromEnd + 1], shifts: c.shifts + 1 });
        stepRef.current += 1;
      } else {
        // gap is open at MID — drop the new value in
        api.onActiveLine(["insert_mid"]);
        const next = [...BASE.slice(0, MID), NEW, ...BASE.slice(MID)];
        setS({ ...c, arr: next, mid: MID, done: true });
      }
    }, pace(700));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { arr, mid, shifted, done, shifts } = s;
  const geom = rowGeom(arr.length, VW, 250, 48, 8, 44);
  const tones: (Tone | undefined)[] = arr.map((_, k) =>
    done && k === mid ? "good" : !done && shifted.includes(k) ? "muted" : undefined,
  );

  return (
    <g>
      <CellRow geom={geom} values={arr} tones={tones} />
      <text x={VW / 2} y={geom.y - 30} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? `inserted at slot ${MID} after ${shifts} shifts — that's the O(n) cost` : `making room: shifting the tail right · ${shifts} shifts so far`}
      </text>
      <g onClick={() => { setS(init()); stepRef.current = 0; }} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); stepRef.current = 0; } }}>
        <rect x={VW / 2 - 30} y={geom.y + geom.cellH + 40} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={geom.y + geom.cellH + 52} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visual: the pile being counted from the top, swept region grows ──── */
function PileCount() {
  const k = 6; // "lifted" up to here so far
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i === k ? "active" : i < k ? "visited" : undefined));
  const dim = ARR.map((_, i) => i > k);
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ [k]: `lift #${k}` }} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        already lifted {k} books to reach this one — picture this row 1,000 long
      </text>
    </g>
  );
}

/* ── static visual: the memory ruler — even stride proves base + i × size ────── */
function MemoryRuler() {
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i === TARGET ? "good" : undefined));
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} />
      {ARR.map((_, i) => (
        <text key={i} x={G.cx(i)} y={G.y + G.cellH + 22} textAnchor="middle" className="font-mono select-none pointer-events-none"
          style={{ fontSize: 8.5, fill: i === TARGET ? "var(--accent-ink)" : "var(--text-faint)" }}>
          {i === 0 ? "base" : `+${i}·sz`}
        </text>
      ))}
      <text x={VW / 2} y={G.y + G.cellH + 48} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>
        slot {TARGET}&rsquo;s spot = base + {TARGET} × size — same one step for a row of a million
      </text>
    </g>
  );
}

/* ── static visual: the cost card — what's cheap, what's not ─────────────────── */
function CostCard() {
  const tones: (Tone | undefined)[] = ARR.map(() => undefined);
  const rows: [string, string, Tone][] = [
    ["read / write by index", "O(1)", "good"],
    ["append at the end", "O(1)*", "good"],
    ["insert in the middle", "O(n)", "muted"],
    ["delete in the middle", "O(n)", "muted"],
    ["find a value (no index)", "O(n)", "muted"],
  ];
  const cw = 360, x = 130, y0 = 248, rh = 28;
  return (
    <g>
      <CellRow geom={rowGeom(ARR.length, VW, 184, 40, 6, 30)} values={ARR} tones={tones} />
      {rows.map(([op, cost, t], i) => {
        const y = y0 + i * rh;
        return (
          <g key={op}>
            <text x={x} y={y} dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{op}</text>
            <text x={x + cw} y={y} textAnchor="end" dominantBaseline="central" className="font-mono"
              style={{ fontSize: 12, fill: t === "good" ? "var(--diff-easy)" : "var(--diff-med)" }}>{cost}</text>
          </g>
        );
      })}
      <text x={x} y={y0 + rows.length * rh + 6} className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
        * O(1) on average — now and then a full shelf copies to a bigger one
      </text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

export const arraysLesson: LessonSpec = {
  topicTitle: "arrays · reach any slot in one step",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: arraysPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      takeaway: "The only thing we care about is reaching a book by its position — fast.",
      actionLabel: "I have the question",
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "active" : undefined))),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "A thousand books. Find the 487th.",
        body: <>You&rsquo;re shelving a thousand books and a friend says &ldquo;hand me book number 487.&rdquo; You don&rsquo;t care what it is &mdash; only that it sits at that <strong>position</strong>. How fast can you reach it? (Picture this short row 1,000 long.)</>,
      }],
      detail: (
        <>
          <p>You&rsquo;re organizing a thousand books, and your friend asks: &ldquo;hand me book number four-eighty-seven.&rdquo;</p>
          <p>You don&rsquo;t care which book it is. You don&rsquo;t care about its title. You just need the one that&rsquo;s in <em>position 487</em> &mdash; the 487th spot in the row. The only question that matters is: how fast can you get to it?</p>
        </>
      ),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: [],
    },
    {
      id: "pile",
      label: "The obvious thing",
      takeaway: "Stored as a pile, reaching position 487 takes 487 lifts — the arrangement forces counting.",
      connector: "Before we can speed it up, look at the slowest honest way to store those books.",
      actionLabel: "What changes if we rearrange?",
      visual: <PileCount />,
      panels: [{
        left: 150, top: 326, width: 580, variant: "main", label: "The obvious thing", title: "A pile of books. Count from the top.",
        body: <>Simplest storage: a pile. To reach book 487 you lift the top one, then the next, then the next &mdash; 487 lifts for one question. Ask for a different book and you start over. The cost grows with the position you&rsquo;re asked about.</>,
      }],
      detail: (
        <>
          <p>The simplest way to store the books: stack them in a pile. To get book 487, you lift the top one (that&rsquo;s 1), the next (2), the next (3)&hellip; all the way down to 487. That&rsquo;s 487 lifts just to answer one question.</p>
          <p>And every time the question changes &mdash; book 53? book 921? &mdash; you start from the top again. The amount of work grows with whatever position you&rsquo;re asked about.</p>
          <p>The problem isn&rsquo;t the books. It&rsquo;s the <em>pile</em> &mdash; the way they&rsquo;re arranged forces you to count through everything in front of the one you want.</p>
        </>
      ),
      arrows: [{ x1: G.cx(6), y1: 326, x2: G.cx(6), y2: G.y + G.cellH + 26 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      takeaway: "Give every position a fixed, equal-size home and a slot's number (its index) takes you straight there in one step.",
      connector: "Now that the pile makes you count from the top, change one thing — give every position a fixed home.",
      actionLabel: "Storage decides speed",
      visual: (api) => <DragToSlot api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Give every position a fixed home.",
          body: <>Now lay the books on a long shelf, every slot the same size: slot 0, slot 1 &hellip; slot 999. The slot&rsquo;s number is its <strong>index</strong> (the position, counting from 0). <em>Click any slot</em> &mdash; you walk straight there in one step, no counting.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what changed about the books? Nothing. What changed about the <em>arrangement</em>?</>,
        },
      ],
      detail: (
        <>
          <p>Now imagine the books laid out on a long shelf instead of stacked. Each slot is exactly the same size: slot 0, slot 1, slot 2&hellip; slot 999. A slot&rsquo;s number is its <strong>index</strong> &mdash; just the position, counting from zero.</p>
          <p>You no longer reach book 487 by lifting 487 books off a pile. You walk straight to slot 487. Click any slot in the picture and watch: you land on it in one step, no counting through the ones before it.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct question:</strong> what changed about the books? Nothing. What changed about the <em>arrangement</em> &mdash; and why did that alone make the lookup instant?
          </div>
        </>
      ),
      codeLabels: ["index_read"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      takeaway: "Even spacing lets the computer compute slot i's address as base + i × size — constant time, O(1).",
      connector: "That one-step jump isn't magic — it's arithmetic, and the even spacing of the slots is what makes it work.",
      actionLabel: "What operations cost what?",
      visual: <MemoryRuler />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "The structure", title: "Same-size slots, packed side by side.",
        body: <>That row of equal slots is an <strong>array</strong>. Slots are all one size, sitting side by side with no gaps. So slot <code>i</code>&rsquo;s spot is just <code>base + i × size</code> &mdash; one bit of arithmetic, the same work whether the row is a thousand or a million. That fixed effort is called <strong>constant time</strong>.</>,
      }],
      detail: (
        <>
          <p>That row of equal slots is an <strong>array</strong>. Two things make it special: every element is the same size, and they sit right next to each other in <strong>memory</strong> (the computer&rsquo;s row of numbered storage spots) with no gaps between them.</p>
          <p>Because the spacing is perfectly even, the computer can <em>compute</em> where slot <code>i</code> lives instead of walking to it: its address is <code>base + i &times; size</code> &mdash; the start of the row, plus <code>i</code> steps of one slot each. (<code>base</code> is where the row begins; <code>size</code> is how wide one slot is.)</p>
          <p>That little bit of arithmetic is a single CPU instruction. The work is the same whether the array holds a thousand books or a million &mdash; reaching slot 487 costs exactly as much either way. Work that doesn&rsquo;t grow with the size of the data like this is called <strong>constant time</strong>, written <Term word="O(1)"><code>O(1)</code></Term>.</p>
        </>
      ),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["index_read"],
    },
    {
      id: "operations",
      label: "The operations",
      takeaway: "Reads and appends are O(1); inserting or deleting in the middle is O(n) because the tail must shift.",
      connector: "Reaching a slot is free — but not every operation gets to ride that arithmetic, so let's price them out.",
      actionLabel: "When does this fit?",
      visual: (api) => <AutoInsert api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The operations", title: "Cheap reads, costly middle-edits.",
          body: <>Read or write by index is one step at any size &mdash; written <strong>O(1)</strong> (&ldquo;cost stays the same&rdquo;). Inserting in the middle differs: call the item count <code>n</code>; every later item must shift over to make room, so cost grows in step with <code>n</code> &mdash; written <Term word="O(n)"><strong>O(n)</strong></Term>. Watch the tail shift.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <>Append at the end is O(1) too &mdash; on average. Once in a while the shelf is full and the books are copied to a bigger one.</>,
        },
      ],
      detail: (
        <>
          <p>Call the number of items in the array <code>n</code>. Here&rsquo;s what each common move costs:</p>
          <ul>
            <li><strong>Read / write by index:</strong> <code>O(1)</code> &mdash; instant at any size; just the <code>base + i &times; size</code> address math.</li>
            <li><strong>Append at the end:</strong> <code>O(1)</code> on average &mdash; you stay next to the last element. (Now and then a full shelf is copied into a bigger one.)</li>
            <li><strong>Insert in the middle:</strong> <code>O(n)</code> &mdash; every element after the insertion point shifts right one slot to make room. Watch the tail slide over.</li>
            <li><strong>Find a value (no index):</strong> <code>O(n)</code> &mdash; with no position to jump to, you scan until you spot it.</li>
          </ul>
          <p>The pattern: anything tied to a known <em>position</em> is cheap; anything that makes you <em>move</em> or <em>search</em> the items costs work that grows with <code>n</code>.</p>
        </>
      ),
      codeLabels: ["append", "insert_mid", "delete"],
      interaction: "playback",
    },
    {
      id: "fit",
      label: "When it fits",
      takeaway: "Use an array for read-by-position, append, and scanning; pick another structure for constant middle edits.",
      connector: "With every operation priced, the rule for when to use an array writes itself.",
      actionLabel: "Name the structure",
      visual: <CostCard />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "When it fits", title: "Cheap moves win — pick the array for those.",
          body: <>Reach for arrays when the work is read-by-position, append, or scan start-to-end. Pick other layouts (later lessons) when you constantly insert or delete in the middle.</>,
        },
        {
          left: 560, top: 240, width: 280, variant: "note", label: "When it fits",
          body: <>Reach for arrays when the work is read-by-position, append, or scan start-to-end. Pick other layouts (later lessons) when you constantly insert or delete in the middle.</>,
        },
      ],
      detail: (
        <>
          <p>Arrays are the default choice for almost any sequence of things. Reach for one whenever the work looks like: <em>read by position, add to the end, or scan from start to finish</em> &mdash; all the cheap moves.</p>
          <p>Reach for something else when the work is dominated by <em>inserting and deleting in the middle</em>, because you&rsquo;ll pay <code>O(n)</code> (cost growing with the list size) on every single edit as the tail keeps shifting.</p>
          <p>Those middle-heavy workloads are exactly what other structures are built for &mdash; <strong>linked lists</strong> (items chained together so each points to the next, instead of sitting in a fixed row), <strong>trees</strong>, or <strong>hash maps</strong>. You&rsquo;ll meet them in later lessons; for now, just know the array&rsquo;s sweet spot and its weak spot.</p>
        </>
      ),
      codeLabels: ["loop"],
    },
    {
      id: "name",
      label: "The pattern",
      takeaway: "It's an array (Python's list is a dynamic array); every arr[i] is that base + i × size jump.",
      connector: "You've earned the name — and you already know the one line that makes the whole thing tick.",
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "good" : undefined)), undefined, { [TARGET]: "arr[i]" }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Array. List, in Python.",
        body: <>That&rsquo;s the name. In many languages an array&rsquo;s size is fixed; Python&rsquo;s <code>list</code> is a <strong>dynamic array</strong> &mdash; it grows when you append, same cost model. Every <Term word="arr[i]"><code>arr[i]</code></Term> you see does that <code>base + i × size</code> jump. That one line is why arrays are everywhere.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: an <strong>array</strong>. In low-level languages an array has a fixed size you set up front. In Python, the everyday <code>list</code> is a <strong>dynamic array</strong> &mdash; same idea, but it quietly grows itself whenever you append. The cost model you just learned is identical either way.</p>
          <p>So when you see <code>arr[i]</code> in code, the runtime is doing that <code>base + i &times; size</code> jump under the hood &mdash; one instant step to any position. That single line is the whole reason arrays show up everywhere, from the pixels on this screen to the rows in a spreadsheet.</p>
          <p>Open the Code panel to see the handful of operations you&rsquo;ll actually reach for day to day.</p>
        </>
      ),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["setup", "length"],
    },
  ],
};
