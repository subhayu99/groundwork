"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, StackBoxes, StackBox, Pill, Bracket } from "@/shared/lesson/canvas";
import stacksQueuesPy from "./algorithm.py";

const VW = 860, VH = 470;

/* shared row of items both stories sit on (beats 1–2) */
const ROW = ["home", "inbox", "draft", "sent", "page"];
const ROWG = rowGeom(ROW.length, VW, 280, 96, 12, 48);

/* ── static: the shared row (setup) ───────────────────────────────────────── */
function SharedRow({ frontLeaving = false, shift = false }: { frontLeaving?: boolean; shift?: boolean }) {
  const tones: (Tone | undefined)[] = ROW.map((_, i) =>
    frontLeaving && i === 0 ? "bad" : shift && i > 0 ? "muted" : undefined,
  );
  return (
    <g>
      <CellRow geom={ROWG} values={ROW} tones={tones} />
      <text x={ROWG.left(0) - 14} y={ROWG.y + ROWG.cellH / 2} textAnchor="end" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>front →</text>
      <text x={ROWG.left(ROW.length - 1) + ROWG.cellW + 14} y={ROWG.y + ROWG.cellH / 2} dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>← back</text>
      {frontLeaving && (
        <text x={ROWG.cx(3)} y={ROWG.y - 18} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 11, fill: "var(--diff-hard)" }}>remove front — everyone shifts left</text>
      )}
      {shift && ROW.slice(1).map((_, i) => (
        <text key={i} x={ROWG.cx(i + 1)} y={ROWG.y + ROWG.cellH + 18} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 16, fill: "var(--diff-med)" }}>←</text>
      ))}
    </g>
  );
}

/* ── interactive WEDGE: push then pop a stack (LIFO), code line follows click ─ */
const STACK_CX = 250, Q_CX = 620, S_TOP = 218, BOX_W = 190, BOX_H = 32, BOX_GAP = 8;
const SEED = ["home", "inbox", "draft"]; // grows on push

function PushPopStack({ api }: { api: BeatVisualApi }) {
  const [stack, setStack] = useState<string[]>([...SEED]);
  const [queue, setQueue] = useState<string[]>(["latte", "mocha"]);
  const [msg, setMsg] = useState("press push / pop on the stack, or add / remove on the queue");
  const POOL = ["sent", "page", "post", "feed", "stats"];
  const poolRef = useRef(0);
  const next = () => POOL[poolRef.current++ % POOL.length];

  const push = () => {
    api.onInteractionDone(); api.onActiveLine(["push"]);
    const v = next(); setStack((s) => [...s, v]); setMsg(`push("${v}") — newest sits on top`);
  };
  const pop = () => {
    api.onInteractionDone(); api.onActiveLine(["pop"]);
    setStack((s) => { if (!s.length) { setMsg("stack is empty"); return s; } const v = s[s.length - 1]; setMsg(`pop() → "${v}" — the newest comes out first`); return s.slice(0, -1); });
  };
  const enq = () => {
    api.onInteractionDone(); api.onActiveLine(["enqueue"]);
    const v = next(); setQueue((q) => [...q, v]); setMsg(`add("${v}") — joins the back of the line`);
  };
  const deq = () => {
    api.onInteractionDone(); api.onActiveLine(["dequeue"]);
    setQueue((q) => { if (!q.length) { setMsg("queue is empty"); return q; } const v = q[0]; setMsg(`remove() → "${v}" — the oldest is served first`); return q.slice(1); });
  };

  const sItems: StackBox[] = stack.map((label, i) => ({ key: i, label, tone: i === stack.length - 1 ? "active" : "idle" }));
  const qItems: StackBox[] = queue.map((label, i) => ({ key: i, label, tone: i === 0 ? "active" : "idle" }));

  return (
    <g>
      {/* stack — both ops touch the TOP */}
      <text x={STACK_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>STACK · last in, first out</text>
      <Pill x={STACK_CX} y={S_TOP - 18} text="↑ top" />
      <StackBoxes items={sItems} cx={STACK_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} />
      <Btn x={STACK_CX - 44} y={338} label="push" onClick={push} />
      <Btn x={STACK_CX + 44} y={338} label="pop" onClick={pop} />

      {/* queue — add at back, remove from front */}
      <text x={Q_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>QUEUE · first in, first out</text>
      <Pill x={Q_CX} y={S_TOP - 18} text="↑ front (out)" />
      <StackBoxes items={qItems} cx={Q_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} topOnTop={false} />
      <Btn x={Q_CX - 50} y={338} label="add" onClick={enq} />
      <Btn x={Q_CX + 50} y={338} label="remove" onClick={deq} />

      <text x={STACK_CX} y={392} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>{msg}</text>
    </g>
  );
}

/* a tiny clickable button in SVG */
function Btn({ x, y, label, onClick }: { x: number; y: number; label: string; onClick: () => void }) {
  const w = Math.max(54, label.length * 8 + 18);
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={x - w / 2} y={y} width={w} height={26} rx={7} fill="var(--bg-card)" stroke="var(--accent-line)" strokeWidth={1.5} />
      <text x={x} y={y + 13} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>{label}</text>
    </g>
  );
}

/* ── playback: a stack fills (push×3) then empties (pop×3), code follows ────── */
function AutoStack({ api }: { api: BeatVisualApi }) {
  const SCRIPT = ["home", "inbox", "draft"];
  type S = { items: string[]; phase: "push" | "pop"; i: number; note: string };
  const init = (): S => ({ items: [], phase: "push", i: 0, note: "watch: push three, then pop three" });
  const [s, setS] = useState<S>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.phase === "push") {
        if (c.i < SCRIPT.length) { api.onActiveLine(["push"]); const v = SCRIPT[c.i]; setS({ ...c, items: [...c.items, v], i: c.i + 1, note: `push("${v}")` }); }
        else { setS({ ...c, phase: "pop", i: 0 }); }
      } else {
        if (c.items.length) { api.onActiveLine(["pop"]); const v = c.items[c.items.length - 1]; setS({ ...c, items: c.items.slice(0, -1), note: `pop() → "${v}" (newest first)` }); }
        else { api.onActiveLine(["peek"]); setS({ ...c, note: "empty — LIFO done" }); }
      }
    }, 950);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: StackBox[] = s.items.map((label, i) => ({ key: i, label, tone: i === s.items.length - 1 ? (s.phase === "pop" ? "good" : "active") : "idle" }));
  return (
    <g>
      <text x={VW / 2} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>STACK · last in, first out</text>
      <Pill x={VW / 2} y={S_TOP - 18} text="↑ top — both push & pop here" />
      <StackBoxes items={items} cx={VW / 2} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} />
      <text x={VW / 2} y={410} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>{s.note}</text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={428} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={440} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static: stack + queue side by side, touch-points highlighted ──────────── */
function TwoContracts({ stackTones, queueTones, showNoMiddle = false, chips = false }: {
  stackTones?: (Tone | undefined)[]; queueTones?: (Tone | undefined)[]; showNoMiddle?: boolean; chips?: boolean;
}) {
  const st = ["home", "inbox", "draft"];
  const qu = ["latte", "mocha", "americano"];
  const sItems: StackBox[] = st.map((label, i) => ({ key: i, label, tone: stackTones?.[i] }));
  const qItems: StackBox[] = qu.map((label, i) => ({ key: i, label, tone: queueTones?.[i] }));
  const sChips = ["browser back", "undo", "call stack", "DFS (dive deep)"];
  const qChips = ["scheduling", "task pool", "print jobs", "BFS (spread wide)"];
  return (
    <g>
      <text x={STACK_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>STACK · last in, first out</text>
      <Pill x={STACK_CX} y={S_TOP - 18} text="↑ top" />
      <StackBoxes items={sItems} cx={STACK_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} />
      <text x={Q_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>QUEUE · first in, first out</text>
      <Pill x={Q_CX} y={S_TOP - 18} text="↑ front (out)" />
      <StackBoxes items={qItems} cx={Q_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} topOnTop={false} />
      {showNoMiddle && (
        <text x={(STACK_CX + Q_CX) / 2} y={S_TOP + BOX_H + BOX_GAP + BOX_H / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>✗ no middle</text>
      )}
      {chips && (
        <>
          {sChips.map((c, i) => (
            <text key={`s${i}`} x={STACK_CX} y={S_TOP + 130 + i * 18} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>{c}</text>
          ))}
          {qChips.map((c, i) => (
            <text key={`q${i}`} x={Q_CX} y={S_TOP + 130 + i * 18} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>{c}</text>
          ))}
        </>
      )}
    </g>
  );
}

/* ── static: the two named contracts as physical pictures (recap) ──────────── */
function NamedContracts() {
  const st = ["home", "inbox", "draft"];
  const qu = ["latte", "mocha", "americano"];
  const sItems: StackBox[] = st.map((label, i) => ({ key: i, label, tone: i === st.length - 1 ? "active" : "idle" }));
  const qItems: StackBox[] = qu.map((label, i) => ({ key: i, label, tone: i === 0 ? "active" : "idle" }));
  return (
    <g>
      <text x={STACK_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>STACK — a pile of plates</text>
      <StackBoxes items={sItems} cx={STACK_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} />
      <Bracket x1={STACK_CX - BOX_W / 2} x2={STACK_CX + BOX_W / 2} y={S_TOP + 130} label="add & take from top" color="var(--diff-easy)" />
      <text x={Q_CX} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>QUEUE — a coffee-shop line</text>
      <StackBoxes items={qItems} cx={Q_CX} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} topOnTop={false} />
      <Bracket x1={Q_CX - BOX_W / 2} x2={Q_CX + BOX_W / 2} y={S_TOP + 130} label="join back · called from front" color="var(--diff-easy)" />
    </g>
  );
}

export const stacksQueuesLesson: LessonSpec = {
  topicTitle: "stacks & queues · two contracts on a row",
  canvas: { width: VW, height: VH },
  codeSource: stacksQueuesPy as string,
  beats: [
    {
      id: "setup",
      visual: <SharedRow />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "Two questions. Opposite rules. Same row of items.",
        body: <>You&rsquo;re browsing &mdash; the browser keeps your pages so <em>back</em> returns the <strong>newest</strong> one first. In another room a barista serves whoever ordered <strong>first</strong>. Both are just rows of items. So why do the rules look opposite?</>,
      }],
      codeLabels: [],
    },
    {
      id: "obvious",
      visual: <SharedRow frontLeaving shift />,
      panels: [{
        left: 150, top: 24, width: 580, variant: "main", label: "The obvious thing", title: "Use an array. Add at the end is cheap; the front is not.",
        body: <>An <strong>array</strong> is a fixed row of slots in memory. Adding at the <em>end</em> is one move, no matter how long &mdash; an instant, length-independent cost we write <code>O(1)</code>. But removing the <em>front</em> slides everyone left, so the cost grows with the number of items (call that count <em>n</em>) &mdash; written <code>O(n)</code>.</>,
      }],
      arrows: [{ x1: ROWG.cx(0), y1: 152, x2: ROWG.cx(0), y2: ROWG.y - 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <PushPopStack api={api} />,
      panels: [
        {
          left: 60, top: 18, width: 740, variant: "main", label: "The wedge", title: "Touch only the ends. Watch which end each move uses.",
          body: <>Both start with a few items. On the stack press <em>push</em> (add) and <em>pop</em> (remove the newest) &mdash; both touch the <strong>top</strong>. On the queue press <em>add</em> and <em>remove</em> &mdash; add joins the back, remove takes the front.</>,
        },
        {
          left: 548, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> if you promise to only ever touch the ends, what suddenly becomes free?</>,
        },
      ],
      codeLabels: ["push", "pop"],
      interaction: "wedge",
    },
    {
      id: "structure",
      visual: <TwoContracts stackTones={["idle", "idle", "active"]} queueTones={["active", "idle", "idle"]} />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The structure", title: "One end, or two.",
        body: <>A <strong>stack</strong> adds &amp; removes only at the <em>top</em>: newest out first &mdash; <strong>LIFO</strong> (last in, first out). A <strong>queue</strong> adds at the back, removes from the front: oldest out first &mdash; <strong>FIFO</strong> (first in, first out).</>,
      }],
      arrows: [
        { x1: STACK_CX, y1: 152, x2: STACK_CX, y2: S_TOP - 40 },
        { x1: Q_CX, y1: 152, x2: Q_CX, y2: S_TOP - 40 },
      ],
      codeLabels: ["sig", "qinit"],
    },
    {
      id: "operations",
      visual: (api) => <AutoStack api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The operations", title: "Every move is at an end, so every move is instant.",
        body: <>On a stack, <code>push</code>, <code>pop</code>, and <code>peek</code> (look at the top without taking it) are all <code>O(1)</code>. A queue&rsquo;s add/remove are <code>O(1)</code> too &mdash; if you use a <em>deque</em> (say &ldquo;deck&rdquo;: a row built to be fast at both ends), not a plain list whose front-removal is <code>O(n)</code>.</>,
      }],
      codeLabels: ["push", "pop", "peek"],
      interaction: "playback",
    },
    {
      id: "fits",
      visual: <TwoContracts stackTones={["idle", "muted", "active"]} queueTones={["active", "muted", "idle"]} showNoMiddle chips />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When it fits", title: "Newest-next vs oldest-next.",
        body: <>Pick a <strong>stack</strong> when you want the most-recent thing next &mdash; like browser back or the <em>call stack</em> (the list of functions still waiting to finish). Pick a <strong>queue</strong> when the longest-waiter goes next &mdash; like print jobs or scheduling.</>,
      }],
      codeLabels: ["sig", "qinit"],
    },
    {
      id: "name",
      visual: <NamedContracts />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The pattern", title: "Stack and Queue.",
        body: <>The names are the pictures. A <strong>stack</strong> of plates: add to the top, take from the top. A <strong>queue</strong> at a coffee shop: join the back, get called from the front. They aren&rsquo;t exotic &mdash; just two contracts on a plain row, and the contract is what keeps every move instant.</>,
      }],
      codeLabels: ["push", "pop", "enqueue", "dequeue"],
    },
  ],
};
