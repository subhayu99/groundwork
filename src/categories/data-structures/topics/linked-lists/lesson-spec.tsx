"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import { toneStyle } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Arrow } from "@/shared/lesson/canvas";
import linkedListPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* ── The working chain, used consistently across beats 3–7 ─────────────────── */
const CHAIN = [1, 2, 4, 5, 7];

/* ── Array row (beats 1 & 2): sorted cells with a gap where 3 belongs ──────── */
const ARR = [1, 2, 4, 5, 7, 8, 10];
const ARR_G = rowGeom(ARR.length, VW, 250, 48, 8, 48);

/* ── Linked-list node geometry ─────────────────────────────────────────────
   A node = a value box (square) + a small "next" pointer cell to its right.
   Arrows leave a node's next-cell and land on the following node's value box. */
const VAL_W = 50, NEXT_W = 24, NODE_H = 50, NODE_GAP = 34;
const NODE_STRIDE = VAL_W + NEXT_W + NODE_GAP;

interface ChainGeom {
  y: number;
  x0: number;
  valLeft: (i: number) => number;
  valCx: (i: number) => number;
  nextLeft: (i: number) => number;
  nextCx: (i: number) => number;
  nodeRight: (i: number) => number;
  endX: number; // where the "None" terminator sits
}
function chainGeom(count: number, y: number, headW = 56): ChainGeom {
  // total width = head label + nodes + gaps + a terminator slot
  const nodesW = count * (VAL_W + NEXT_W) + count * NODE_GAP;
  const termW = 70;
  const total = headW + NODE_GAP + nodesW + termW;
  const x0 = (VW - total) / 2 + headW + NODE_GAP; // left edge of first node
  const valLeft = (i: number) => x0 + i * NODE_STRIDE;
  const nextLeft = (i: number) => valLeft(i) + VAL_W;
  return {
    y, x0,
    valLeft,
    valCx: (i) => valLeft(i) + VAL_W / 2,
    nextLeft,
    nextCx: (i) => nextLeft(i) + NEXT_W / 2,
    nodeRight: (i) => nextLeft(i) + NEXT_W,
    endX: valLeft(count - 1) + NODE_STRIDE,
  };
}

/* one node drawn at index i with a given tone */
function NodeBox({
  g, i, value, tone = "idle", dim = false, showNextDot = true,
}: { g: ChainGeom; i: number; value: number; tone?: Tone; dim?: boolean; showNextDot?: boolean }) {
  const ts = toneStyle[tone];
  const y = g.y;
  return (
    <g style={{ opacity: dim ? 0.32 : 1, transition: "opacity .3s" }}>
      {/* value compartment */}
      <rect x={g.valLeft(i)} y={y} width={VAL_W} height={NODE_H} rx={9}
        style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2.5} />
      <text x={g.valCx(i)} y={y + NODE_H / 2} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 18, fill: "var(--text)" }}>{value}</text>
      {/* next compartment */}
      <rect x={g.nextLeft(i)} y={y} width={NEXT_W} height={NODE_H} rx={6}
        style={{ fill: "var(--bg-elevated)", stroke: ts.border, transition: "stroke .3s" }} strokeWidth={2.5} />
      {showNextDot && (
        <circle cx={g.nextCx(i)} cy={y + NODE_H / 2} r={3.5} fill="var(--accent-ink)" />
      )}
    </g>
  );
}

/* arrow from node i's next-cell to node (i+1)'s value box */
function ChainLink({ g, i, color }: { g: ChainGeom; i: number; color?: string }) {
  const y = g.y + NODE_H / 2;
  return <Arrow x1={g.nextCx(i)} y1={y} x2={g.valLeft(i + 1) - 4} y2={y} color={color} />;
}

/* the head label + first link into node 0 */
function HeadLabel({ g, color }: { g: ChainGeom; color?: string }) {
  const y = g.y + NODE_H / 2;
  return (
    <g>
      <text x={g.x0 - NODE_GAP - 4} y={y} textAnchor="end" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>head</text>
      <Arrow x1={g.x0 - NODE_GAP} y1={y} x2={g.valLeft(0) - 4} y2={y} color={color} />
    </g>
  );
}

/* the "None" terminator + the final link from the last node */
function NoneEnd({ g, last, color }: { g: ChainGeom; last: number; color?: string }) {
  const y = g.y + NODE_H / 2;
  return (
    <g>
      <Arrow x1={g.nextCx(last)} y1={y} x2={g.endX - 6} y2={y} color={color} />
      <text x={g.endX + 24} y={y} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 15, fill: "var(--text-muted)" }}>None</text>
    </g>
  );
}

/* ── full static chain renderer ────────────────────────────────────────────── */
function Chain({
  g, values, tones, dim, linkColors,
}: {
  g: ChainGeom; values: number[];
  tones?: (Tone | undefined)[]; dim?: boolean[];
  linkColors?: (string | undefined)[]; // length = values.length+1; [0]=head link, [k]=link after node k-1
}) {
  return (
    <g>
      <HeadLabel g={g} color={linkColors?.[0]} />
      {values.map((v, i) => (
        <NodeBox key={i} g={g} i={i} value={v} tone={tones?.[i]} dim={dim?.[i]} />
      ))}
      {values.slice(0, -1).map((_, i) => (
        <ChainLink key={`l${i}`} g={g} i={i} color={linkColors?.[i + 1]} />
      ))}
      <NoneEnd g={g} last={values.length - 1} color={linkColors?.[values.length]} />
    </g>
  );
}

/* a clickable SVG button (mirrors monotonic-stack's Btn) */
function Btn({ x, y, label, onClick, disabled = false }: { x: number; y: number; label: string; onClick: () => void; disabled?: boolean }) {
  const w = Math.max(96, label.length * 7 + 22);
  return (
    <g onClick={disabled ? undefined : onClick} style={{ cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 }}
      tabIndex={disabled ? undefined : 0} role="button" aria-label={label}
      onKeyDown={disabled ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={x - w / 2} y={y} width={w} height={28} rx={7} fill="var(--bg-card)" stroke="var(--accent-line)" strokeWidth={1.5} />
      <text x={x} y={y + 14} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none"
        style={{ fontSize: 12, fill: "var(--accent-ink)" }}>{label}</text>
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 1 — the array setup (static)
   ════════════════════════════════════════════════════════════════════════════ */
const GAP_X = (ARR_G.left(1) + ARR_G.cellW + ARR_G.left(2)) / 2; // between cell 1 (value 2) and cell 2 (value 4)
function ArraySetup() {
  return (
    <g>
      <CellRow geom={ARR_G} values={ARR} />
      {/* gap marker where 3 belongs */}
      <g>
        <line x1={GAP_X} y1={ARR_G.y - 16} x2={GAP_X} y2={ARR_G.y + ARR_G.cellH + 16} stroke="var(--accent-ink)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={GAP_X} y={ARR_G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>3 wants to land here</text>
      </g>
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 2 — array insert cascade (playback): cell 3 enters, later cells shift right
   ════════════════════════════════════════════════════════════════════════════ */
function ArrayShiftPlayback({ api }: { api: BeatVisualApi }) {
  // frame: how many of the tail cells (from old index 2 onward) have been shoved right
  const tail = [4, 5, 7, 8, 10]; // cells that must move (old indices 2..6)
  const [step, setStep] = useState(0); // 0..tail.length ; at tail.length the 3 has landed
  const ref = useRef(step); ref.current = step;
  const total = tail.length; // number of shoves = n

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c >= total) return;
      api.onActiveLine([]);
      setStep(c + 1);
    }, pace(700));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // build a row of length 8 (the new array after full insert) but reveal progressively.
  const FULL = [1, 2, 3, 4, 5, 7, 8, 10];
  const fg = rowGeom(FULL.length, VW, 250, 46, 8, 46);
  const shovedCount = step; // how many tail cells already moved
  const inserted = step >= total;
  // index map: indices 0,1 fixed; index 2 = the new 3 (appears once all shoved? we reveal at end);
  const tones: (Tone | undefined)[] = FULL.map((_, i) => {
    if (i === 2) return inserted ? "active" : undefined; // the entering 3
    if (i >= 3) {
      const tailPos = i - 3; // 0-based position within tail
      return tailPos < shovedCount ? "muted" : undefined; // muted = already shifted
    }
    return undefined;
  });
  const dim = FULL.map((_, i) => (i === 2 && !inserted));
  const firstShiftCx = fg.cx(3);

  return (
    <g>
      <CellRow geom={fg} values={FULL} tones={tones} dim={dim} />
      <text x={fg.cx(3)} y={fg.y - 18} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>first cell forced to move</text>
      <text x={VW / 2} y={fg.y + fg.cellH + 40} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: inserted ? "var(--diff-easy)" : "var(--accent-ink)" }}>
        {inserted ? `3 placed — but it cost ${total} shoves` : `total shifts paid: ${shovedCount} (heading for n = ${total})`}
      </text>
      <g onClick={() => setStep(0)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setStep(0); } }}>
        <rect x={VW / 2 - 30} y={fg.y + fg.cellH + 54} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={fg.y + fg.cellH + 66} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
      {/* marker for arrow target = first shifted cell */}
      <line x1={firstShiftCx} y1={0} x2={firstShiftCx} y2={0} stroke="none" />
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 3 — the instinct: insert / remove on the chain, count pointer edits
   ════════════════════════════════════════════════════════════════════════════ */
type ChainState = { values: number[]; touched: number[]; relinkAt: number | null; edits: number; note: string; acted: boolean };
function wedgeInit(): ChainState {
  return { values: [...CHAIN], touched: [], relinkAt: null, edits: 0, note: "click a button and count what changed", acted: false };
}
const WEDGE_G = chainGeom(CHAIN.length, 232);

function WedgeChain({ api }: { api: BeatVisualApi }) {
  const [s, setS] = useState<ChainState>(wedgeInit);

  const insertAfter = (afterIdx: number, value: number) => {
    api.onInteractionDone();
    setS(() => {
      const values = [...CHAIN];
      values.splice(afterIdx + 1, 0, value);
      api.onActiveLine(["insert_new", "insert_relink"]);
      return {
        values,
        touched: [afterIdx, afterIdx + 1],
        relinkAt: afterIdx, // the link leaving node afterIdx was rerouted
        edits: 2,
        note: `insert ${value} after node ${afterIdx}: 2 pointer edits — neighbours untouched`,
        acted: true,
      };
    });
  };

  const removeThird = () => {
    api.onInteractionDone();
    setS(() => {
      const values = [...CHAIN];
      values.splice(2, 1); // remove 3rd node (value 4)
      api.onActiveLine(["remove_relink"]);
      return {
        values,
        touched: [1], // node before the removed one had its pointer rerouted
        relinkAt: 1,
        edits: 1,
        note: "remove the 3rd card (value 4): 1 pointer edit — node 1 now skips to value 5",
        acted: true,
      };
    });
  };

  const g = chainGeom(s.values.length, 232);
  const tones: (Tone | undefined)[] = s.values.map((_, i) => (s.acted && s.touched.includes(i) ? "good" : undefined));
  // link colors: highlight the single rerouted pointer green
  const linkColors: (string | undefined)[] = Array(s.values.length + 1).fill(undefined);
  if (s.acted && s.relinkAt !== null) linkColors[s.relinkAt + 1] = "var(--diff-easy)";

  return (
    <g>
      <Chain g={g} values={s.values} tones={tones} linkColors={linkColors} />
      <text x={VW / 2} y={g.y - 22} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>{s.note}</text>
      {/* pointer-edits counter */}
      <text x={VW / 2} y={g.y + NODE_H + 34} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: s.acted ? "var(--accent-ink)" : "var(--text-faint)" }}>
        Pointer edits: {s.edits}
      </text>
      {/* action buttons */}
      <Btn x={VW / 2 - 230} y={g.y + NODE_H + 52} label="insert 3 after node 1" onClick={() => insertAfter(1, 3)} />
      <Btn x={VW / 2} y={g.y + NODE_H + 52} label="insert 6 after node 3" onClick={() => insertAfter(3, 6)} />
      <Btn x={VW / 2 + 230} y={g.y + NODE_H + 52} label="remove the 3rd card" onClick={removeThird} />
      <Btn x={VW / 2} y={g.y + NODE_H + 88} label="↺ reset" onClick={() => setS(wedgeInit())} />
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 4 — anatomy: spotlight one node's value + next compartments
   ════════════════════════════════════════════════════════════════════════════ */
const ANATOMY_G = chainGeom(CHAIN.length, 250);
function Anatomy() {
  const g = ANATOMY_G;
  const focus = 2; // the enlarged/spotlit node (value 4)
  const tones: (Tone | undefined)[] = CHAIN.map((_, i) => (i === focus ? "active" : undefined));
  const dim = CHAIN.map((_, i) => i !== focus);
  return (
    <g>
      <Chain g={g} values={CHAIN} tones={tones} dim={dim} />
      {/* compartment labels on the focus node */}
      <text x={g.valCx(focus)} y={g.y - 14} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--accent-ink)" }}>value</text>
      <text x={g.nextCx(focus)} y={g.y + NODE_H + 16} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--accent-ink)" }}>next</text>
      <text x={g.nextCx(focus)} y={g.y + NODE_H + 30} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 9.5, fill: "var(--text-faint)" }}>(address of next box)</text>
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 5 — operations: find-walk playback (NET-NEW amber traversal) + cost table
   ════════════════════════════════════════════════════════════════════════════ */
const OPS_G = chainGeom(CHAIN.length, 214);
const FIND_TARGET = 7; // last node, so the walk lights the whole chain
function FindWalk({ api }: { api: BeatVisualApi }) {
  const targetIdx = CHAIN.indexOf(FIND_TARGET);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef({ cursor, done }); ref.current = { cursor, done };

  useEffect(() => {
    api.onActiveLine(["traverse_init"]);
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.cursor >= targetIdx) { api.onActiveLine(["traverse_loop"]); setDone(true); return; }
      api.onActiveLine(["traverse_advance"]);
      setCursor(c.cursor + 1);
    }, pace(850));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = OPS_G;
  const tones: (Tone | undefined)[] = CHAIN.map((_, i) => {
    if (done && i === targetIdx) return "good";
    if (i === cursor) return "active"; // amber-ish current node
    if (i < cursor) return "visited";
    return undefined;
  });

  // cost table, drawn below the chain
  const rows: [string, string][] = [
    ["insert after a node", "O(1)"],
    ["remove the next node", "O(1)"],
    ["find a value", "O(n)"],
    ["jump to position k", "O(n)"],
  ];
  const tableY = g.y + NODE_H + 40;
  const colCx = VW / 2;
  return (
    <g>
      <Chain g={g} values={CHAIN} tones={tones} />
      <text x={g.valLeft(0)} y={g.y + NODE_H + 22} textAnchor="start" className="font-mono select-none"
        style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--accent-ink)" }}>
        {done ? `found 7 — had to walk all ${targetIdx + 1} steps from head` : `walking from head… now at node ${cursor} (value ${CHAIN[cursor]})`}
      </text>
      {/* cost table */}
      {rows.map(([op, cost], i) => {
        const ry = tableY + i * 22;
        const cheap = cost === "O(1)";
        return (
          <g key={op}>
            <text x={colCx - 14} y={ry} textAnchor="end" dominantBaseline="central" className="font-mono select-none"
              style={{ fontSize: 12, fill: "var(--text-muted)" }}>{op}</text>
            <text x={colCx + 14} y={ry} textAnchor="start" dominantBaseline="central" className="font-mono select-none"
              style={{ fontSize: 12, fill: cheap ? "var(--diff-easy)" : "var(--diff-med)" }}>{cost}</text>
          </g>
        );
      })}
      <g onClick={() => { setCursor(0); setDone(false); }} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCursor(0); setDone(false); } }}>
        <rect x={VW / 2 - 30} y={tableY + rows.length * 22 + 2} width={60} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={tableY + rows.length * 22 + 13} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 6 — generalization: chain (left) morphs into a small tree + graph hint
   ════════════════════════════════════════════════════════════════════════════ */
function Generalize() {
  // left: a short chain (3 nodes) as the "base case"
  const cy = 250;
  const chainX = [70, 150, 230];
  const r = 20;
  // right: a tiny tree — one root sprouting two children
  const root = { x: 560, y: 200 };
  const childL = { x: 500, y: 300 };
  const childR = { x: 620, y: 300 };
  // graph hint: the root also points to an arbitrary far node
  const far = { x: 740, y: 250 };

  const circle = (cx: number, y: number, tone: Tone, label: string) => {
    const ts = toneStyle[tone];
    return (
      <g>
        <circle cx={cx} cy={y} r={r} style={{ fill: ts.bg, stroke: ts.border }} strokeWidth={2.5} />
        <text x={cx} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{label}</text>
      </g>
    );
  };

  return (
    <g>
      {/* left: the chain base case */}
      <text x={150} y={cy - 50} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>a list: each node → 1 next</text>
      {chainX.slice(0, -1).map((x, i) => (
        <Arrow key={i} x1={x + r} y1={cy} x2={chainX[i + 1] - r - 2} y2={cy} />
      ))}
      {chainX.map((x, i) => <g key={i}>{circle(x, cy, "accent", String([1, 2, 4][i]))}</g>)}

      {/* divider hint */}
      <text x={380} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 22, fill: "var(--text-faint)" }}>→</text>
      <text x={380} y={cy + 38} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>same node idea</text>

      {/* right: a tree — node sprouting two children */}
      <text x={560} y={186} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>a tree: node → several children</text>
      <Arrow x1={root.x - 8} y1={root.y + r - 4} x2={childL.x + 6} y2={childL.y - r - 2} />
      <Arrow x1={root.x + 8} y1={root.y + r - 4} x2={childR.x - 6} y2={childR.y - r - 2} />
      {/* graph hint: an extra arbitrary arrow */}
      <Arrow x1={root.x + r} y1={root.y} x2={far.x - r - 2} y2={far.y} color="var(--diff-med)" />
      <text x={700} y={338} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--diff-med)" }}>a graph: point anywhere</text>
      {circle(root.x, root.y, "active", "A")}
      {circle(childL.x, childL.y, "accent", "B")}
      {circle(childR.x, childR.y, "accent", "C")}
      {circle(far.x, far.y, "idle", "Z")}
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BEAT 7 — the name: clean chain + cost recap + singly/doubly diagram
   ════════════════════════════════════════════════════════════════════════════ */
const NAME_G = chainGeom(CHAIN.length, 192);
const MINI_R = 16;
function MiniNode({ cx, y, label }: { cx: number; y: number; label: string }) {
  return (
    <g>
      <rect x={cx - 20} y={y - MINI_R} width={40} height={2 * MINI_R} rx={6} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={2} />
      <text x={cx} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{label}</text>
    </g>
  );
}
function NameSummary() {
  const g = NAME_G;
  const costRows: [string, string][] = [
    ["insert after node", "O(1)"],
    ["remove next node", "O(1)"],
    ["access by index", "O(n)"],
    ["find a value", "O(n)"],
    ["memory locality", "poor"],
  ];
  // singly / doubly diagrams: three nodes at fixed x, right of the cost table
  const NX = [520, 610, 700];
  const SINGLY_Y = 330, DOUBLY_Y = 410;
  const DOUBLY_ARROW = "var(--diff-med)";
  return (
    <g>
      <Chain g={g} values={CHAIN} tones={CHAIN.map(() => "accent")} />
      {/* cost recap (left column) */}
      <text x={170} y={278} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>cost recap</text>
      {costRows.map(([op, cost], i) => {
        const ry = 302 + i * 22;
        const ok = cost === "O(1)";
        return (
          <g key={op}>
            <text x={300} y={ry} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{op}</text>
            <text x={314} y={ry} textAnchor="start" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: ok ? "var(--diff-easy)" : "var(--diff-med)" }}>{cost}</text>
          </g>
        );
      })}
      {/* singly */}
      <text x={NX[0] - 20} y={SINGLY_Y - 30} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>singly: one arrow (&rarr; next)</text>
      {NX.slice(0, -1).map((x, i) => <Arrow key={`s${i}`} x1={x + 20} y1={SINGLY_Y} x2={NX[i + 1] - 22} y2={SINGLY_Y} />)}
      {NX.map((x, i) => <MiniNode key={`sn${i}`} cx={x} y={SINGLY_Y} label={String(CHAIN[i])} />)}
      {/* doubly */}
      <text x={NX[0] - 20} y={DOUBLY_Y - 30} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>doubly: two arrows (&harr; prev/next)</text>
      {NX.slice(0, -1).map((x, i) => (
        <g key={`d${i}`}>
          <Arrow x1={x + 20} y1={DOUBLY_Y - 5} x2={NX[i + 1] - 22} y2={DOUBLY_Y - 5} />
          <Arrow x1={NX[i + 1] - 22} y1={DOUBLY_Y + 5} x2={x + 20} y2={DOUBLY_Y + 5} color={DOUBLY_ARROW} />
        </g>
      ))}
      {NX.map((x, i) => <MiniNode key={`dn${i}`} cx={x} y={DOUBLY_Y} label={String(CHAIN[i])} />)}
    </g>
  );
}

export const linkedListsLesson: LessonSpec = {
  topicTitle: "linked lists · order lives in the arrows, not the positions",
  canvas: { width: VW, height: VH },
  codeSource: linkedListPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I have the question",
      visual: <ArraySetup />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "Add one item to a sorted list — without disturbing the rest.",
        body: <>You keep friends in alphabetical order. A new friend belongs between the 2nd and 3rd. To open a gap, everyone after must slide down a spot. Fine for ten names &mdash; painful for ten million. Can we add one without bothering the rest?</>,
      }],
      detail: (
        <>
          <p>Picture a tidy list of friends kept in alphabetical order. A new friend, <em>Charlie</em>, turns up and belongs right in the middle &mdash; between the 2nd and 3rd names. To open a slot for him, everyone from that point on has to shuffle down one place to make room.</p>
          <p>That&rsquo;s no trouble for ten names. It gets painful for ten million. Is there a way to slip Charlie in <em>without</em> disturbing all the people who don&rsquo;t even care that he showed up?</p>
        </>
      ),
      arrows: [{ x1: GAP_X, y1: 150, x2: GAP_X, y2: ARR_G.y - 18 }],
      codeLabels: [],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "We have the wish — add one item without disturbing the rest. Here's why the everyday tool, an array, can't grant it.",
      actionLabel: "Free the positions",
      visual: (api) => <ArrayShiftPlayback api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Arrays force a domino effect.",
        body: <>In an array, an address is just a position in line. Drop a value into slot 2 and every later value physically shifts one place right &mdash; one insertion, <em>n</em> shoves, where <em>n</em> is how many items sit after it. The fixed positions forced the work.</>,
      }],
      detail: (
        <>
          <p>An <strong>array</strong> is the everyday list most languages give you &mdash; a run of slots numbered <code>0, 1, 2, &hellip;</code>, where an item&rsquo;s &ldquo;address&rdquo; is simply its position in that run. To put Charlie in at slot 2, slot 3 has to become Dana, slot 4 has to become Eli, and so on down the line.</p>
          <p>Every single name after Charlie has to physically move over by one. That&rsquo;s <em>n</em> shoves for one insertion &mdash; <code>n</code> being how many items sit after him &mdash; so the cost is <code>O(n)</code> (&ldquo;order n&rdquo;): the work grows in step with how many follow. The information never changed; it was the <em>fixed positions</em> that forced all the busywork.</p>
          <p>So here&rsquo;s the question that cracks it open: what if positions weren&rsquo;t fixed at all?</p>
        </>
      ),
      arrows: [{ x1: 403, y1: 150, x2: 403, y2: 200 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "So free the positions: instead of a fixed line, give each item an arrow that says where the next one lives.",
      actionLabel: "Pointers are the trick",
      visual: (api) => <WedgeChain api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Each card points to the next.",
          body: <>Meet cards joined by arrows. Each holds a value AND an arrow saying where the next card lives &mdash; that arrow is a <strong>pointer</strong>. Order lives in the arrows, not in where cards sit. Use the buttons under the chain to insert, then remove, and count what changed.</>,
        },
        {
          left: 24, top: 394, width: 330, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> how many existing cards actually had to change &mdash; an insert? a remove?</>,
        },
      ],
      detail: (
        <>
          <p>Look at the cards joined by arrows. Each card holds a value <em>and</em> an arrow that tells you where the next card lives. That arrow is a <strong>pointer</strong> &mdash; just a stored note saying &ldquo;the next thing is over <em>there</em>.&rdquo; The order of the list is carried by those arrows, not by where the cards happen to sit on screen.</p>
          <p>Using the buttons below the chain, choose <em>insert 3 after node 1</em> and see what moves. Then choose <em>remove the 3rd card</em>. Notice how almost nothing budges &mdash; we just re-aim one or two arrows, and every other card stays exactly where it was. No domino, no shuffle.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct question:</strong> when you slide a new card in, how many of the cards that were already there actually had to change?
          </div>
        </>
      ),
      arrows: [{ x1: 290, y1: 392, x2: WEDGE_G.nextCx(1) + 20, y2: 290 }],
      codeLabels: ["insert_new", "insert_relink"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      connector: "Those cards-with-arrows have a real name and a fixed anatomy — let's open one up.",
      actionLabel: "What's cheap?",
      visual: <Anatomy />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The structure", title: "A node: one value + the address of the next.",
        body: <>A linked list is a chain of small boxes called <strong>nodes</strong>. Each node carries a value plus a pointer to the next node. You start at the first node &mdash; the <strong>head</strong> &mdash; and follow arrows until <code>None</code> (Python&rsquo;s word for &ldquo;nothing here,&rdquo; the end).</>,
      }],
      detail: (
        <>
          <p>Each card is really a <strong>node</strong> &mdash; a small box split into two compartments. The left holds the <em>value</em> (the data you care about); the right holds the <em>next</em> pointer (the address of the following node). A <strong>linked list</strong> is just a chain of these nodes hooked together by their next pointers.</p>
          <p>To read the list you start at the very first node, called the <strong>head</strong>, and follow each arrow forward until one points at <code>None</code> &mdash; Python&rsquo;s word for &ldquo;nothing here,&rdquo; which marks the end of the chain.</p>
          <p>The trade is plain. You give up <em>random access</em> &mdash; there&rsquo;s no instant <code>list[487]</code> to jump straight to the 488th item &mdash; and the nodes are scattered in memory rather than packed side by side. In return, you can insert or remove a node anywhere in <em>constant time</em>, as long as you&rsquo;re already standing next to the right spot.</p>
        </>
      ),
      arrows: [{ x1: 300, y1: 150, x2: ANATOMY_G.nextCx(2), y2: 248 }],
      codeLabels: ["node_class", "node_value", "node_next"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: "Now that we know a node is value + next-pointer, let's price each thing you can do with the chain.",
      actionLabel: "When it fits",
      visual: (api) => <FindWalk api={api} />,
      panels: [{
        left: 470, top: 20, width: 360, variant: "main", label: "The operations", title: "Cheap edits, expensive lookups.",
        body: <>Insert or remove where you&rsquo;re standing: <strong>O(1)</strong> &mdash; instant, same cost no matter how long the list. But find a value, or jump to the 50th item: <strong>O(n)</strong> &mdash; cost grows with the list&rsquo;s length (n) &mdash; you must walk from the head; there&rsquo;s no shortcut.</>,
      }],
      detail: (
        <>
          <p><strong>Insert after a node you&rsquo;re already at:</strong> <code>O(1)</code> &mdash; &ldquo;constant time,&rdquo; meaning the cost is the same whether the list has five items or five million. You point the new node at whatever came next, then re-aim the current node&rsquo;s arrow at the new node. Two arrow changes and you&rsquo;re done.</p>
          <p><strong>Remove the node after you:</strong> <code>O(1)</code> too &mdash; just one arrow change, re-routed to skip past the node you&rsquo;re dropping. The skipped node, now pointed at by nothing, gets cleaned up automatically.</p>
          <p><strong>Find a value, or jump to the k-th item:</strong> <code>O(n)</code> &mdash; cost grows in step with the list&rsquo;s length <code>n</code>. Watch the walk above: there&rsquo;s no instant jump, so you start at the head and follow arrows one at a time until you arrive. The longer the list, the longer the walk &mdash; no shortcut.</p>
        </>
      ),
      arrows: [{ x1: 470, y1: 110, x2: OPS_G.valCx(0), y2: 208 }],
      codeLabels: ["insert_relink", "remove_relink", "traverse_init", "traverse_loop", "traverse_advance"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "When it fits",
      connector: "Cheap edits, costly lookups — that profile rarely wins on its own, but the node-and-arrow idea behind it shows up everywhere.",
      actionLabel: "Name it",
      visual: <Generalize />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When it fits", title: "It's how other structures think.",
        body: <>You rarely reach for a raw linked list, but it&rsquo;s the model underneath others: a <strong>tree</strong> is nodes pointing to several children; a <strong>graph</strong> is nodes pointing anywhere. Master the chain and those come free.</>,
      }],
      detail: (
        <>
          <p>Honest answer: in modern Python you almost never reach for a bare linked list. When you genuinely need fast edits in the middle, there&rsquo;s usually a more specialized tool &mdash; a <strong>deque</strong> (a double-ended queue, fast to add and drop at either end), an ordered map, or a tree.</p>
          <p>You still need the linked list because it&rsquo;s the <em>mental model</em> the fancier structures are built on. A <strong>tree</strong> is just nodes where each one can point to several children instead of one next. A <strong>graph</strong> is nodes that can point at any other nodes at all. Get the chain &mdash; one node, one arrow &mdash; and those richer shapes come almost for free; the plain list is simply their simplest case.</p>
        </>
      ),
      arrows: [{ x1: 620, y1: 150, x2: 588, y2: 188 }],
      codeLabels: ["node_class", "node_next"],
    },
    {
      id: "name",
      label: "The structure",
      connector: "Trees, graphs, deques — they all trace back to the one shape you just built. Time to name it.",
      visual: <NameSummary />,
      panels: [{
        left: 150, top: 20, width: 580, variant: "main", label: "The structure", title: "Linked List.",
        body: <>That&rsquo;s the name. <strong>Singly linked</strong> = each node has one arrow (to next). <strong>Doubly linked</strong> = two arrows (next AND previous) so you can walk backwards. The big idea: position is not address &mdash; order is whatever the arrows say, and an edit costs one pointer swap.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: a <strong>linked list</strong>. It comes in two flavors. <em>Singly linked</em> means each node has just one arrow, pointing to the next node &mdash; you can only walk forward. <em>Doubly linked</em> means each node has two arrows, one to the next node and one to the previous one, so you can also walk backwards and unhook a node without first finding the one before it.</p>
          <p>The big idea to carry away: <strong>position is not address</strong>. Order isn&rsquo;t set by where things sit in a row &mdash; it&rsquo;s whatever the arrows say. And because of that, inserting or removing costs exactly what it should: a single pointer swap, not a cascade of shoves.</p>
          <p>Open the code drawer to see a tiny Python sketch of a node and the chain it forms.</p>
        </>
      ),
      arrows: [{ x1: 600, y1: 150, x2: 565, y2: 392 }],
      codeLabels: ["sig"],
    },
  ],
};
