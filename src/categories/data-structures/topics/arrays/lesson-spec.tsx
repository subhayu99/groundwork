"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import arraysPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const TARGET = 6; // the slot we keep pointing at in the small stand-in row
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250, 48, 8, 44);

// the insert scenario shared by the prediction gate and the playback that answers it
const BASE = [3, 1, 4, 5, 9, 2, 6, 5];
const NEW = 8;
const MID = 3;

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
        {touched ? `arr[${i}] = ${ARR[i]}  ·  base + ${i} × size  ·  1 jump` : "click any slot — you land on it in one step, no counting"}
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

/* ── PREDICTION GATE + playback: commit to the insert's cost, THEN watch it ───
 * The gate is the beat's real interaction (interaction: "wedge"): one tap on a
 * pill fires api.onInteractionDone() inside PredictGate, feedback shows, and
 * after a short reading pause the AutoInsert playback answers the prediction
 * with the actual tail shift. The gate is HTML hosted on the SVG canvas via
 * <foreignObject>; data-canvas-panel opts it into the scene layout's content-
 * extent measurement so vertical centring accounts for it. */
function InsertCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  const geom = rowGeom(BASE.length, VW, 250, 48, 8, 44);
  const tones: (Tone | undefined)[] = BASE.map((_, k) => (k === MID ? "active" : undefined));

  if (revealed) return <AutoInsert api={api} />;

  return (
    <g>
      <CellRow geom={geom} values={BASE} tones={tones} markers={{ [MID]: `↓ ${NEW} goes here` }} />
      <text x={VW / 2} y={geom.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        a new value, {NEW}, needs slot {MID} — and the slots are all taken
      </text>
      <foreignObject x={40} y={geom.y + geom.cellH + 28} width={470} height={200}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question={`A new value needs slot ${MID} — what happens to the cells after it?`}
            choices={[
              { id: "stay", label: "nothing — they stay put", note: "slot 3 is already taken, and a slot holds one value — the row has to make room" },
              { id: "shift", label: "every later cell shifts right", correct: true, note: "the row stays gap-free, so each cell after slot 3 steps right once — watch the count" },
              { id: "last", label: "only the last cell moves", note: "that would leave a hole at slot 3 — every cell after it has to step right" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1800)); }}
          />
        </div>
      </foreignObject>
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
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: arraysPy as string,
  // standing on for-loops (the cross-track stitch, per TRACK-NARRATIVES.md):
  // you can already WALK a known set — this lesson is where those sets live.
  bridgeFrom: reg({
    base: "You can already walk a known set with a for loop. Arrays are where those sets actually live.",
    intuitive: "You can already visit every item in a row, one at a time, with a for loop. Now meet the row itself.",
    rigorous: "for iterates a collection in order; arrays are the contiguous layout underneath, where arr[i] costs one step.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 10): pay contiguous layout, get
  // position i in one step — the SEED of trade-space-for-time, not its proof.
  principle: { key: "trade-space-for-time", n: 5, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      takeaway: reg({
        base: "The only thing we care about is reaching a book by its position, fast.",
        intuitive: "Everything here is one question: how fast can you grab the book at spot 487?",
      }),
      actionLabel: "I have the question",
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "active" : undefined))),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "A thousand books. Find the 487th.",
        body: reg({
          base: <>You&rsquo;re shelving a thousand books and a friend says &ldquo;hand me book number 487.&rdquo; You don&rsquo;t care what it is, only that it sits at that <strong>position</strong>. How fast can you reach it? (Picture this short row 1,000 long.)</>,
          intuitive: <>A friend points at a shelf of a thousand books: &ldquo;hand me book number 487.&rdquo; Which book it is doesn&rsquo;t matter. Only the spot it sits in. The whole lesson is one question: how fast can you put your hand on spot 487? (Picture this short row stretched 1,000 long.)</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You&rsquo;re organizing a thousand books, and your friend asks: &ldquo;hand me book number four-eighty-seven.&rdquo;</p>
            <p>You don&rsquo;t care which book it is. You don&rsquo;t care about its title. You just need the one that&rsquo;s in <em>position 487</em>, the 487th spot in the row. The only question that matters is: how fast can you get to it?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Start with the picture: a thousand books in one long row, and a friend asks for book number four-eighty-seven.</p>
            <p>Notice what the question is <em>not</em> about. Not the title, not the cover, not what&rsquo;s inside. Only the spot: the 487th place in the row. Every storage lesson starts at this question: once you know <em>where</em> something lives, how fast can you put your hand on it?</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: [],
    },
    {
      id: "pile",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      takeaway: "Stored as a pile, reaching position 487 takes 487 lifts; the arrangement forces counting.",
      connector: "Before we can speed it up, look at the slowest honest way to store those books.",
      actionLabel: "What changes if we rearrange?",
      visual: <PileCount />,
      panels: [{
        left: 150, top: 326, width: 580, variant: "main", label: "The obvious thing", title: "A pile of books. Count from the top.",
        body: <>Simplest storage: a pile. To reach book 487 you lift the top one, then the next, then the next, 487 lifts for one question. Ask for a different book and you start over. The cost grows with the position you&rsquo;re asked about.</>,
      }],
      detail: (
        <>
          <p>The simplest way to store the books: stack them in a pile. To get book 487, you lift the top one (that&rsquo;s 1), the next (2), the next (3)&hellip; all the way down to 487. That&rsquo;s 487 lifts just to answer one question.</p>
          <p>And every time the question changes (book 53? book 921?) you start from the top again. The amount of work grows with whatever position you&rsquo;re asked about.</p>
          <p>The problem isn&rsquo;t the books. It&rsquo;s the <em>pile</em>: the way they&rsquo;re arranged forces you to count through everything in front of the one you want.</p>
        </>
      ),
      arrows: [{ x1: G.cx(6), y1: G.y + G.cellH + 4, x2: G.cx(6), y2: 322 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      takeaway: reg({
        base: "Give every position a fixed, equal-size home and a slot's number (its index) takes you straight there in one step.",
        intuitive: "Equal slots in a row: the slot's number takes you straight there, no counting.",
      }),
      connector: reg({
        base: "Now that the pile makes you count from the top, change one thing: give every position a fixed home.",
        intuitive: "A pile forces you to count from the top every single time, so change one thing: give every position a fixed home.",
        structured: "Pile-like storage makes you count from the top, and reaching position i costs i steps. Change one thing: give every position a fixed home.",
      }),
      actionLabel: "Storage decides speed",
      visual: (api) => <DragToSlot api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Give every position a fixed home.",
          body: reg({
            base: <>Now lay the books on a long shelf, every slot the same size: slot 0, slot 1 &hellip; slot 999. The slot&rsquo;s number is its <strong>index</strong> (the position, counting from 0). <em>Click any slot</em> and you walk straight there in one step, no counting.</>,
            intuitive: <>Lay the books on a long shelf instead, every slot exactly the same width: slot 0, slot 1 &hellip; slot 999. A slot&rsquo;s number is its <strong>index</strong>, just &ldquo;which spot,&rdquo; counting from 0. <em>Click any slot</em>: you land on it in one step. No lifting, no counting through the others.</>,
          }),
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what changed about the books? Nothing. What changed about the <em>arrangement</em>?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Now imagine the books laid out on a long shelf instead of stacked. Each slot is exactly the same size: slot 0, slot 1, slot 2&hellip; slot 999. A slot&rsquo;s number is its <strong>index</strong>, just the position, counting from zero.</p>
            <p>You no longer reach book 487 by lifting 487 books off a pile. You walk straight to slot 487. Click any slot in the picture and watch: you land on it in one step, no counting through the ones before it.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> what changed about the books? Nothing. What changed about the <em>arrangement</em>, and why did that alone make the lookup instant?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Same books, new arrangement: a long shelf where every slot is exactly the same width, slot 0, slot 1, slot 2&hellip; slot 999. A slot&rsquo;s number is its <strong>index</strong>, and that&rsquo;s all an index is: &ldquo;which spot,&rdquo; counting from zero.</p>
            <p>Try it. Click any slot in the picture. You never pass through the slots before it; you just arrive. Book 487 no longer costs 487 lifts. It costs one step &mdash; and so does every other book on the shelf.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> the books didn&rsquo;t change, only their <em>arrangement</em> did. Why would that alone make finding one instant?
            </div>
          </>
        ),
      }),
      codeLabels: ["index_read"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      takeaway: reg({
        base: "Even spacing lets the computer compute slot i's address as base + i × size: constant time, O(1).",
        intuitive: "The computer calculates where slot i lives: one step, even in a million-long row.",
        rigorous: "address(i) = base + i × size. That's O(1) random access; the layout is the lookup.",
      }),
      connector: reg({
        base: "That one-step jump isn't magic. It's arithmetic, and the even spacing of the slots is what makes it work.",
        rigorous: "Every cost an array charges follows from one address equation. Start there.",
      }),
      actionLabel: "What operations cost what?",
      visual: <MemoryRuler />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "The structure",
        title: reg({
          base: "Same-size slots, packed side by side.",
          rigorous: "Contiguous memory, fixed stride.",
        }),
        body: reg({
          base: <>That row of equal slots is an <strong>array</strong>. Slots are all one size, sitting side by side with no gaps. So slot <code>i</code>&rsquo;s spot is just <code>base + i × size</code>, one bit of arithmetic, the same work whether the row is a thousand or a million. That fixed effort is called <strong>constant time</strong>.</>,
          intuitive: <>That row of same-size slots is an <strong>array</strong>. The slots sit side by side with no gaps, so the computer never walks the row. It <em>calculates</em> where slot <code>i</code> is: start of the row + i &times; one slot&rsquo;s width. Ten books or a million, the same one step. Work that stays flat like that is called <Term word="O(1)"><code>O(1)</code></Term>, &ldquo;constant time.&rdquo;</>,
          rigorous: <>Contiguous memory, fixed-size cells: slot <code>i</code>&rsquo;s address is computed, not searched. It&rsquo;s <code>base + i × size</code>, one multiply, one add, one load, identical for n = 10 or n = 10⁶. That flat count is <Term word="O(1)"><code>O(1)</code></Term> random access.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That row of equal slots is an <strong>array</strong>. Two things make it special: every element is the same size, and they sit right next to each other in <strong>memory</strong> (the computer&rsquo;s row of numbered storage spots) with no gaps between them.</p>
            <p>Because the spacing is perfectly even, the computer can <em>compute</em> where slot <code>i</code> lives instead of walking to it: its address is <code>base + i &times; size</code>, the start of the row, plus <code>i</code> steps of one slot each. (<code>base</code> is where the row begins; <code>size</code> is how wide one slot is.)</p>
            <p>That little bit of arithmetic is a single CPU instruction. The work is the same whether the array holds a thousand books or a million; reaching slot 487 costs exactly as much either way. Work that doesn&rsquo;t grow with the size of the data like this is called <strong>constant time</strong>, written <Term word="O(1)"><code>O(1)</code></Term>.</p>
          </>
        ),
        intuitive: (
          <>
            <p>That row of equal slots is an <strong>array</strong>. Two promises make it work: every slot is the same width, and the slots sit right next to each other with no gaps, in <strong>memory</strong>, the computer&rsquo;s own long row of numbered storage spots.</p>
            <p>Those two promises turn &ldquo;walk there&rdquo; into &ldquo;calculate it.&rdquo; Where is slot 487? The start of the row, plus 487 slot-widths: <code>base + 487 &times; size</code>. The computer does that one multiplication and lands on the spot. It never touches the 486 slots before it, just like you never lifted those books.</p>
            <p>Ten books or a million, that math is the same single step. Work that stays flat as the data grows is called <strong>constant time</strong>, written <Term word="O(1)"><code>O(1)</code></Term>. Tap the chip; it just means &ldquo;one step, every time.&rdquo;</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The layout invariant.</strong> Element <code>k</code> occupies bytes <code>[base + k·size, base + (k+1)·size)</code>: fixed element size, no gaps, stable base. Every operation preserves it, so a position is never searched for: it is computed. <code>arr[i]</code> compiles to exactly that address expression.</p>
            <p>The invariant is also the constraint. Equal-size cells are what make the stride arithmetic valid (Python keeps it by storing fixed-size <Term word="pointer">references</Term> in the cells, never the objects themselves), and contiguity is what the CPU rewards: neighbouring indices share cache lines, so sequential scans run near memory bandwidth, what we call <Term word="memory locality">locality</Term>.</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["index_read"],
    },
    {
      id: "operations",
      label: "The operations",
      takeaway: reg({
        base: "Reads and appends are O(1); inserting or deleting in the middle is O(n) because the tail must shift.",
        intuitive: "Grab-by-slot is one step; squeezing into the middle moves every later book.",
        rigorous: "Index ops are O(1); middle insert/delete shifts the tail, so O(n); append amortized O(1).",
      }),
      connector: reg({
        base: "Reaching a slot is free, but not every operation gets to ride that arithmetic, so let's price them out.",
        rigorous: "The address math prices reads. Mutation moves memory, so predict the cost before the playback.",
      }),
      actionLabel: reg({
        base: "When does this fit?",
        structured: "Name the structure",
        rigorous: "Name the structure",
      }),
      visual: (api) => <InsertCostGate api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The operations",
          title: reg({
            base: "Cheap reads, costly middle-edits.",
            rigorous: "Reads are arithmetic; making room is movement.",
          }),
          body: reg({
            base: <>Read or write by index is one step at any size, written <strong>O(1)</strong> (&ldquo;cost stays the same&rdquo;). Inserting in the middle differs: call the item count <code>n</code>; every later item must shift over to make room, so cost grows in step with <code>n</code>, written <Term word="O(n)"><strong>O(n)</strong></Term>. Watch the tail shift.</>,
            intuitive: <>Grabbing any slot by its number is one step at any size: <Term word="O(1)"><code>O(1)</code></Term>. Squeezing a book into the <em>middle</em> is different: every later book must step right to make room. Call the book count <code>n</code>; the work grows with it, written <Term word="O(n)"><code>O(n)</code></Term>. Predict it, then watch.</>,
            rigorous: <>Read or write by index is the same address computation, <Term word="O(1)"><code>O(1)</code></Term>, already counted. Insert at index <code>i</code>: cells <code>i..n−1</code> each step right, n &minus; i writes, n at the front; delete mirrors it. The playback counts the shifts; that linear count is what <Term word="O(n)"><code>O(n)</code></Term> names.</>,
          }),
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: reg({
            base: <>Append at the end is O(1) too, on average. Once in a while the shelf is full and the books are copied to a bigger one.</>,
            intuitive: <>Adding at the <strong>end</strong> barely disturbs the row, usually one step. Rarely the shelf is full and everything is copied to a bigger one; spread out, that cost stays tiny (<Term word="amortized">amortized</Term>).</>,
            rigorous: <>Append: <Term word="amortized">amortized</Term> O(1). Capacity doubles on overflow, so n appends cost O(n) total, though any single append may pay a full copy.</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Call the number of items in the array <code>n</code>. Here&rsquo;s what each common move costs:</p>
            <ul>
              <li><strong>Read / write by index:</strong> <code>O(1)</code>. Instant at any size; just the <code>base + i &times; size</code> address math.</li>
              <li><strong>Append at the end:</strong> <code>O(1)</code> on average. You stay next to the last element. (Now and then a full shelf is copied into a bigger one.)</li>
              <li><strong>Insert in the middle:</strong> <code>O(n)</code>. Every element after the insertion point shifts right one slot to make room. Watch the tail slide over.</li>
              <li><strong>Find a value (no index):</strong> <code>O(n)</code>. With no position to jump to, you scan until you spot it.</li>
            </ul>
            <p>The pattern: anything tied to a known <em>position</em> is cheap; anything that makes you <em>move</em> or <em>search</em> the items costs work that grows with <code>n</code>.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Call the number of books in the row <code>n</code>. Price each everyday move by counting steps:</p>
            <ul>
              <li><strong>Grab / replace by slot number:</strong> one step at any size, <Term word="O(1)"><code>O(1)</code></Term>; it&rsquo;s just the start + slot &times; width calculation.</li>
              <li><strong>Add at the end:</strong> usually one step too, nothing else moves. (Rarely the shelf fills up and every book is copied to a bigger one; spread across many adds, the average stays tiny, and that&rsquo;s <Term word="amortized">amortized</Term> cost.)</li>
              <li><strong>Squeeze one into the middle:</strong> every book after the spot steps right, just as you watched. For a thousand books that can be hundreds of moves: <Term word="O(n)"><code>O(n)</code></Term>.</li>
              <li><strong>Find a value with no slot number:</strong> nothing to calculate, so it&rsquo;s look, look, look, also <Term word="O(n)"><code>O(n)</code></Term>.</li>
            </ul>
            <p>One pattern under all four: a known <em>position</em> is calculated, so it&rsquo;s instant. <em>Moving</em> books or <em>hunting</em> for one costs steps that grow with the row.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> Read/write by index: O(1). Append: <Term word="amortized">amortized</Term> O(1); geometric growth makes n appends O(n) total, though any single append may pay a full copy. Insert/delete at index <code>i</code>: the tail <code>i..n−1</code> shifts one slot, n &minus; i moves, so O(n) worst case at the front and O(1) at the back. Membership with no index: O(n) scan, since the layout buys nothing there.</p>
            <p><strong>Edges.</strong> The empty array: every index is invalid and a scan trivially misses. Out-of-range reads raise <code>IndexError</code> in Python, with no clamping, no silent growth. Negative indices alias from the end (<code>arr[-1]</code> is the last cell), which masks off-by-one bugs instead of crashing them. A search for an absent value always costs the full n.</p>
          </>
        ),
      }),
      codeLabels: ["append", "insert_mid", "delete"],
      interaction: "wedge",
    },
    {
      id: "fit",
      label: "When it fits",
      registers: ["intuitive"],
      trimOnRefresh: true,
      takeaway: reg({
        base: "Use an array for read-by-position, append, and scanning; pick another structure for constant middle edits.",
        intuitive: "Arrays shine at grab-by-spot, append, and scans; heavy middle edits want another shape.",
      }),
      connector: "With every operation priced, the rule for when to use an array writes itself.",
      actionLabel: "Name the structure",
      visual: <CostCard />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "When it fits", title: "Cheap moves win: pick the array for those.",
          body: <>Reach for arrays when the work is read-by-position, append, or scan start-to-end. Pick other layouts (later lessons) when you constantly insert or delete in the middle.</>,
        },
        {
          left: 560, top: 240, width: 280, variant: "note", label: "When it fits",
          body: <>Reach for arrays when the work is read-by-position, append, or scan start-to-end. Pick other layouts (later lessons) when you constantly insert or delete in the middle.</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Arrays are the default choice for almost any sequence of things. Reach for one whenever the work looks like: <em>read by position, add to the end, or scan from start to finish</em>, all the cheap moves.</p>
            <p>Reach for something else when the work is dominated by <em>inserting and deleting in the middle</em>, because you&rsquo;ll pay <code>O(n)</code> (cost growing with the list size) on every single edit as the tail keeps shifting.</p>
            <p>Those middle-heavy workloads are exactly what other structures are built for: <strong>linked lists</strong> (items chained together so each points to the next, instead of sitting in a fixed row), <strong>trees</strong>, or <strong>hash maps</strong>. You&rsquo;ll meet them in later lessons; for now, just know the array&rsquo;s sweet spot and its weak spot.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The rule of thumb writes itself from the prices. Reach for an array when the day-to-day work is the cheap stuff: grab by position, add to the end, or read the whole row start to finish.</p>
            <p>Reach for something else when you&rsquo;re constantly squeezing things into the middle or pulling them out of it, because every single edit pays the tail-shuffle, <Term word="O(n)"><code>O(n)</code></Term>, again and again.</p>
            <p>Middle-heavy work is exactly what other shapes are built for: <strong>linked lists</strong> (each item points to the next, so splicing one in is cheap), <strong>trees</strong> (items arranged by branching), and <Term word="hash map"><strong>hash maps</strong></Term>. They&rsquo;re all later lessons; for now, know the array&rsquo;s sweet spot and its weak spot.</p>
          </>
        ),
      }),
      codeLabels: ["loop"],
    },
    {
      id: "name",
      label: "The pattern",
      takeaway: reg({
        base: "It's an array (Python's list is a dynamic array); every arr[i] is that base + i × size jump.",
        intuitive: "It's called an array: same-size slots in a row, any position in one step.",
        rigorous: "Array: contiguous fixed-stride memory; arr[i] is address math, the space-for-time seed.",
      }),
      connector: reg({
        base: "You've earned the name, and you already know the one line that makes the whole thing tick.",
        rigorous: "Name it, and file it under the idea it seeds.",
      }),
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "good" : undefined)), undefined, { [TARGET]: "arr[i]" }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Array. List, in Python.",
        body: reg({
          base: <>That&rsquo;s the name. In many languages an array&rsquo;s size is fixed; Python&rsquo;s <code>list</code> is a <Term word="dynamic array"><strong>dynamic array</strong></Term>, growing when you append, same cost model. Every <Term word="arr[i]"><code>arr[i]</code></Term> you see does that <code>base + i × size</code> jump. That one line is why arrays are everywhere.</>,
          intuitive: <>The name: an <strong>array</strong>. Python&rsquo;s everyday <code>list</code> is a <Term word="dynamic array"><strong>dynamic array</strong></Term>, the same shelf, it just grows itself when you append. Every <Term word="arr[i]"><code>arr[i]</code></Term> in code is that start + i &times; width jump, and that bargain (a strict layout for instant access) is the seed of idea 5 of 7: <strong>trade space for time</strong>.</>,
          rigorous: <>An array. Python&rsquo;s <code>list</code> is a <Term word="dynamic array">dynamic array</Term>: same layout plus geometric growth, same cost model. Every <Term word="arr[i]"><code>arr[i]</code></Term> is the <code>base + i × size</code> computation: space spent on a rigid layout, time bought back, the seed of <strong>trade-space-for-time</strong>, idea 5 of 7.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the name: an <strong>array</strong>. In low-level languages an array has a fixed size you set up front. In Python, the everyday <code>list</code> is a <strong>dynamic array</strong>: same idea, but it quietly grows itself whenever you append. The cost model you just learned is identical either way.</p>
            <p>So when you see <code>arr[i]</code> in code, the runtime is doing that <code>base + i &times; size</code> jump under the hood, one instant step to any position. That single line is the whole reason arrays show up everywhere, from the pixels on this screen to the rows in a spreadsheet.</p>
            <p>Open the Code panel to see the handful of operations you&rsquo;ll actually reach for day to day.</p>
          </>
        ),
        intuitive: (
          <>
            <p>You&rsquo;ve derived a real structure: the <strong>array</strong>. In many languages you declare its size up front; Python&rsquo;s everyday <code>list</code> is a <Term word="dynamic array"><strong>dynamic array</strong></Term>, the same row of slots, it just quietly grows when you append. The prices you counted are identical either way.</p>
            <p>From here on, every <Term word="arr[i]"><code>arr[i]</code></Term> you read in code is the move you derived: start of the row + i &times; one slot&rsquo;s width, one step. The pixels of this screen, the rows of a spreadsheet, the characters of this sentence &mdash; rows of same-size slots, all the way down.</p>
            <p>And file the deal it rests on: the array <em>spends</em> a strict, gap-free layout and <em>buys</em> instant access to any position. That trade is the seed of <strong>idea 5 of 7, trade space for time</strong>. A few lessons from now, hash maps grow the same seed into something that feels like magic.</p>
            <p>Open the Code panel to see the handful of operations you&rsquo;ll actually reach for day to day.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Array: contiguous, fixed-stride storage, where access is address arithmetic. Python&rsquo;s <code>list</code> stores fixed-size references contiguously and over-allocates geometrically; C arrays fix n up front; C++ <code>vector</code> and Java <code>ArrayList</code> are the same dynamic-array deal. One cost model covers them all.</p>
            <p>The principle this seeds is <strong>trade space for time, idea 5 of 7</strong>: commit memory to a strict layout so position is computed, never searched. Arrays are the first installment; hash maps pay more space still to make even membership O(1).</p>
          </>
        ),
      }),
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["setup", "length"],
    },
  ],
};
