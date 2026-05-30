"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom } from "@/shared/lesson/canvas";
import arraysPy from "./algorithm.py";

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
    }, 700);
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
  const cw = 360, x = (VW - cw) / 2, y0 = 248, rh = 28;
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
      <text x={VW / 2} y={y0 + rows.length * rh + 6} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
        * O(1) on average — once in a while the shelf fills and books copy to a bigger shelf
      </text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

export const arraysLesson: LessonSpec = {
  topicTitle: "arrays · reach any slot in one step",
  canvas: { width: VW, height: VH },
  codeSource: arraysPy as string,
  beats: [
    {
      id: "setup",
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "active" : undefined))),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "A thousand books. Find the 487th.",
        body: <>You&rsquo;re shelving a thousand books and a friend says &ldquo;hand me book number 487.&rdquo; You don&rsquo;t care what it is &mdash; only that it sits at that <strong>position</strong>. The whole question: how fast can you reach it? (Picture this short row 1,000 long.)</>,
      }],
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: [],
    },
    {
      id: "pile",
      visual: <PileCount />,
      panels: [{
        left: 150, top: 332, width: 580, variant: "main", label: "The obvious thing", title: "A pile of books. Count from the top.",
        body: <>Simplest storage: a pile. To reach book 487 you lift the top one, then the next, then the next &mdash; 487 lifts for one question. Ask for a different book and you start over. The cost grows with the position you&rsquo;re asked about.</>,
      }],
      arrows: [{ x1: G.cx(6), y1: 332, x2: G.cx(6), y2: G.y + G.cellH + 26 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <DragToSlot api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The wedge", title: "Give every position a fixed home.",
          body: <>Now lay the books on a long shelf, every slot the same size: slot 0, slot 1 &hellip; slot 999. The slot&rsquo;s number is its <strong>index</strong> (the position, counting from 0). <em>Click any slot</em> &mdash; you walk straight there in one step, no counting.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> what changed about the books? Nothing. What changed about the <em>arrangement</em>?</>,
        },
      ],
      codeLabels: ["index_read"],
      interaction: "wedge",
    },
    {
      id: "structure",
      visual: <MemoryRuler />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "The structure", title: "Same-size slots, packed side by side.",
        body: <>That row of equal slots is an <strong>array</strong>. Every slot has the same size and they sit next to each other in memory with no gaps (&ldquo;contiguous&rdquo;). So slot <code>i</code>&rsquo;s spot is just <code>base + i × size</code> &mdash; one piece of arithmetic, the same work for a row of a thousand or a million. We call that <strong>constant time</strong>: the effort doesn&rsquo;t grow as the array grows.</>,
      }],
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["index_read"],
    },
    {
      id: "operations",
      visual: (api) => <AutoInsert api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The operations", title: "Cheap reads, costly middle-edits.",
          body: <>Read or write by index is one step, same cost at any size &mdash; we write that <strong>O(1)</strong> (&ldquo;stays constant&rdquo;). Inserting in the middle is different: call the number of items <code>n</code>; every later element must shift to make room, so the cost grows in step with <code>n</code>. We write that <strong>O(n)</strong>. Watch the tail shift.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <>Append at the end is O(1) too &mdash; on average. Once in a while the shelf is full and the books are copied to a bigger one.</>,
        },
      ],
      codeLabels: ["append", "insert_mid", "delete"],
      interaction: "playback",
    },
    {
      id: "fit",
      visual: <CostCard />,
      panels: [{
        left: 540, top: 372, width: 290, variant: "note", label: "When it fits",
        body: <>Use arrays when the work is read-by-position, append, or scan start-to-end. Reach elsewhere &mdash; a linked list or hash map &mdash; when you constantly insert/delete in the middle.</>,
      }],
      codeLabels: ["loop"],
    },
    {
      id: "name",
      visual: idleRow(ARR.map((_, i) => (i === TARGET ? "good" : undefined)), undefined, { [TARGET]: "arr[i]" }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Array. List, in Python.",
        body: <>That&rsquo;s the name. In low-level languages an array&rsquo;s size is fixed; Python&rsquo;s <code>list</code> is a <strong>dynamic array</strong> &mdash; it grows when you append, with the same cost model. Every <code>arr[i]</code> you see does that <code>base + i × size</code> jump. That one line is why arrays are everywhere.</>,
      }],
      arrows: [{ x1: G.cx(TARGET), y1: 150, x2: G.cx(TARGET), y2: G.y - 4 }],
      codeLabels: ["setup", "length"],
    },
  ],
};
