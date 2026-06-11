"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, StackBoxes, StackBox, Pill, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import stacksQueuesPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

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
        else { api.onActiveLine([]); setS({ ...c, note: "empty — LIFO done" }); }
      }
    }, pace(950));
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

/* ── PREDICTION GATE + playback: commit to the pop ORDER, then watch it ───────
 * The gate is the operations beat's real interaction (interaction: "wedge"):
 * one tap on a pill fires api.onInteractionDone() inside PredictGate, feedback
 * shows, and after a short reading pause the AutoStack playback answers the
 * prediction by pushing three then popping three. The gate is HTML hosted on
 * the SVG canvas via <foreignObject>; data-canvas-panel opts it into the scene
 * layout's content-extent measurement. Pre-reveal the header shows the bare
 * "STACK" — its "· last in, first out" suffix would hand over the answer, so
 * it's tap-conditional (the variables-exemplar move); AutoStack restores it. */
const GATE_STACK = ["home", "inbox", "draft"];

function PopOrderGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <AutoStack api={api} />;

  const items: StackBox[] = GATE_STACK.map((label, i) => ({ key: i, label, tone: i === GATE_STACK.length - 1 ? "active" : "idle" }));
  return (
    <g>
      <text x={VW / 2} y={S_TOP - 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>STACK</text>
      <Pill x={VW / 2} y={S_TOP - 18} text="↑ top — both push & pop here" />
      <StackBoxes items={items} cx={VW / 2} top={S_TOP} width={BOX_W} boxH={BOX_H} gap={BOX_GAP} />
      <text x={VW / 2} y={S_TOP + 3 * (BOX_H + BOX_GAP) + 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        went in: home → inbox → draft
      </text>
      <foreignObject x={545} y={196} width={290} height={250} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="Three pops will empty this stack — in what order do the three come out?"
            choices={[
              { id: "same", label: "home, inbox, draft — the order they went in", note: "that's a queue's promise — every pop here takes the top, and the newest sits there" },
              { id: "reversed", label: "draft, inbox, home — arrival order, reversed", correct: true, note: "each pop takes the newest survivor off the top, so the pile unwinds backwards" },
              { id: "depends", label: "no way to tell without running it", note: "the contract leaves no freedom — only the top is ever touched, so the order is fixed" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1700)); }}
          />
        </div>
      </foreignObject>
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

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, structure, operations,
 *                fits, name)
 *   structured : 5 — folds `obvious` into the wedge's connector, cuts `fits`
 *   rigorous   : 3 — `structure` (the two invariants) + `operations` (costs,
 *                edges, and the prediction gate) + `name` (close); the
 *                setup/wedge essentials fold into those beats' rigorous prose.
 *   refresh    : additionally trims `obvious` + `fits` (trimOnRefresh).        */
export const stacksQueuesLesson: LessonSpec = {
  topicTitle: "stacks & queues · two contracts on a row",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: stacksQueuesPy as string,
  // standing on arrays (the bridge anchor, per TRACK-NARRATIVES.md): one step
  // to any slot — this lesson gives that freedom up on purpose.
  bridgeFrom: reg({
    base: "An array hands you any slot in one step — now give most of that freedom up on purpose, and see what it buys.",
    intuitive: "Last lesson: a row where you can grab any spot instantly. Now we promise to touch only its ends — on purpose.",
    rigorous: "Arrays give O(1) access at any index — these two contracts spend that freedom to buy an order invariant.",
  }),
  // principle stamp from meta (TRACK-NARRATIVES row 12, no ⚑): LIFO/FIFO order
  // is a kept guarantee — the close claims the invariant idea directly.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: reg({
        base: "Same row of items, opposite rules: browser back wants newest-first, a coffee line wants oldest-first.",
        intuitive: "One row, two opposite rules: back gives the newest page; the line serves the oldest.",
      }),
      visual: <SharedRow />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "Two questions. Opposite rules. Same row of items.",
        body: reg({
          base: <>You&rsquo;re browsing &mdash; the browser keeps your pages so <em>back</em> returns the <strong>newest</strong> one first. In another room a barista serves whoever ordered <strong>first</strong>. Both are just rows of items. So why do the rules look opposite?</>,
          intuitive: <>Hit <em>back</em> and your browser returns the page you just left &mdash; the <strong>newest</strong> one. In a coffee line, the next person served is whoever has waited longest &mdash; the <strong>oldest</strong> order. Both are just rows of things waiting their turn. Why do the rules point in opposite directions?</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You&rsquo;re reading online, and your browser quietly remembers every page you&rsquo;ve visited so the <em>back</em> button works. When you hit back, the page that comes up is the <strong>newest</strong> one you left &mdash; the most recent goes first.</p>
            <p>Meanwhile, in a different room, a barista is making drinks. Whoever ordered <em>first</em> gets served first, and brand-new orders go to the end of the line. Here the <strong>oldest</strong> goes first.</p>
            <p>Both situations are just a row of items waiting to be handled. So why do the two rules &mdash; newest-first versus oldest-first &mdash; come out exactly opposite?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Picture the first row. Your browser quietly keeps every page you visit so the <em>back</em> button has somewhere to go &mdash; and back always returns the page you left <strong>most recently</strong>. Newest first.</p>
            <p>Now the second row, at the coffee shop. New orders join the end of the line, and the barista always serves whoever has been waiting <strong>longest</strong>. Oldest first.</p>
            <p>Strip the stories away and both are the same thing: a row of items waiting to be handled. Same row &mdash; yet one hands out the newest and the other the oldest. Hold that question. The answer turns out to be a single promise about <em>where you&rsquo;re allowed to touch the row</em>.</p>
          </>
        ),
      }),
      codeLabels: [],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Take that same row of items and try to store it the plain way — and the two rules start costing very different amounts.",
      actionLabel: "What's the trick?",
      takeaway: "In a plain array, adding at the end is instant (O(1)) but removing the front shuffles everyone over (O(n)).",
      visual: <SharedRow frontLeaving shift />,
      panels: [{
        left: 150, top: 24, width: 580, variant: "main", label: "The obvious thing", title: "Use an array. Add at the end is cheap; the front is not.",
        body: <>An <strong>array</strong> is a fixed row of slots in memory. Adding at the <em>end</em> is one move, no matter how long &mdash; an instant, length-independent cost we write <Term word="O(1)"><code>O(1)</code></Term>. But removing the <em>front</em> slides everyone left, so the cost grows with the number of items (call that count <em>n</em>) &mdash; written <Term word="O(n)"><code>O(n)</code></Term>.</>,
      }],
      detail: (
        <>
          <p>The natural way to hold a row of items is an <strong>array</strong> &mdash; a fixed run of numbered slots sitting side by side in the computer&rsquo;s memory. We already know how arrays behave: adding a new item at the <em>end</em> is instant, just one move, no matter how long the list already is. That length-independent &ldquo;costs the same forever&rdquo; behaviour is written <code>O(1)</code> (say &ldquo;order one&rdquo;: constant time).</p>
          <p>The trouble is the barista&rsquo;s rule. The next customer to serve is at the <em>front</em>, and removing the front slot of an array means every remaining item has to shuffle left by one to close the gap. So the work grows in step with how many items are waiting &mdash; call that count <code>n</code> &mdash; which we write <code>O(n)</code> (&ldquo;order n&rdquo;: do roughly <code>n</code> moves). After a busy morning, that&rsquo;s a lot of shifting.</p>
          <p>Same array, two different ways of touching it, two completely different costs. The question is whether a smarter promise about <em>where</em> we touch could make the expensive case cheap.</p>
        </>
      ),
      arrows: [{ x1: ROWG.cx(0), y1: 152, x2: ROWG.cx(0), y2: ROWG.y - 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "So here's the promise that fixes the expensive case: never reach into the middle — only ever touch the ends.",
        intuitive: "Serving the front made everyone shuffle — so make a deal: never reach into the middle, only ever touch the ends.",
        structured: "A plain array prices the two rules apart: the back is one move, but serving the front steps every survivor left — one move per item. The fix is a promise: never touch the middle, only the ends.",
      }),
      actionLabel: "Restrict, then optimize",
      takeaway: reg({
        base: "Promise to touch only the ends, never the middle, and nothing ever has to shuffle to fill a gap.",
        intuitive: "Touch only the ends and no gap ever opens — nothing ever has to shuffle.",
      }),
      visual: (api) => <PushPopStack api={api} />,
      panels: [
        {
          left: 60, top: 18, width: 740, variant: "main", label: "The instinct", title: "Touch only the ends. Watch which end each move uses.",
          body: reg({
            base: <>Both start with a few items. On the stack press <em>push</em> (add) and <em>pop</em> (remove the newest) &mdash; both touch the <strong>top</strong>. On the queue press <em>add</em> and <em>remove</em> &mdash; add joins the back, remove takes the front.</>,
            intuitive: <>Two live rows, ready to poke. Left: press <em>push</em> to pile an item on and <em>pop</em> to take one off &mdash; notice both land at the <strong>top</strong>. Right: press <em>add</em> and <em>remove</em> &mdash; new arrivals join the back, the front gets served. Watch where your finger is allowed to go.</>,
          }),
        },
        {
          left: 190, top: 402, width: 480, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> if you promise to only ever touch the ends, what suddenly becomes free?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>On the canvas are the two structures, each holding a few items. On the left one, press <em>push</em> (add an item) and <em>pop</em> (take one off) and watch where they land &mdash; both happen at the <strong>top</strong>, the same end. On the right one, press <em>add</em> and <em>remove</em>: add joins the back, remove takes the front, so the two moves happen at <em>opposite</em> ends.</p>
            <p>Notice that the underlying row of items is not special &mdash; it&rsquo;s still just an array. What changed is the <em>promise about where you&rsquo;re allowed to touch it</em>. Neither structure ever reaches into the middle, so nothing ever has to shuffle over to fill a gap.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> if you decide in advance that the only places you&rsquo;ll ever touch are the ends, what suddenly becomes free?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Play with both for a moment. The left row is the browser history: <em>push</em> piles a new page on, <em>pop</em> takes one back off &mdash; and both moves land at the <strong>top</strong>, the very same end. The right row is the coffee line: <em>add</em> joins the back, <em>remove</em> serves the front &mdash; two different ends, one job each.</p>
            <p>Here&rsquo;s the quiet part: the items themselves are still just sitting in a plain row, like before. The only new thing is a <em>rule about where your hand may go</em>. Neither row ever gets touched in the middle &mdash; so no gap ever opens up, and nobody ever has to shuffle over to close one.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> if you decide in advance that the only places you&rsquo;ll ever touch are the ends, what suddenly becomes free?
            </div>
          </>
        ),
      }),
      codeLabels: ["push", "pop"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      connector: reg({
        base: "Those two end-only promises are exactly the two structures — one touches a single end, the other splits the work across two.",
        intuitive: "You just played with both — now pin down the two promises you were keeping.",
        rigorous: "Two access contracts on one sequence — state them as invariants first.",
      }),
      actionLabel: "What's the cost?",
      takeaway: reg({
        base: "A stack uses one end (LIFO, newest out first); a queue uses two ends (FIFO, oldest out first).",
        intuitive: "A stack takes from one end (newest first); a queue serves the other (oldest first).",
        rigorous: "Stack: one end, newest out first; queue: two ends, oldest out first — order is the invariant.",
      }),
      visual: <TwoContracts stackTones={["idle", "idle", "active"]} queueTones={["active", "idle", "idle"]} />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The structure",
        title: reg({
          base: "One end, or two.",
          rigorous: "Two invariants on one sequence.",
        }),
        body: reg({
          base: <>A <strong>stack</strong> adds &amp; removes only at the <em>top</em>: newest out first &mdash; <Term word="LIFO"><strong>LIFO</strong></Term> (last in, first out). A <strong>queue</strong> adds at the back, removes from the front: oldest out first &mdash; <Term word="FIFO"><strong>FIFO</strong></Term> (first in, first out).</>,
          intuitive: <>A <strong>stack</strong> adds and takes at the same end, the top &mdash; so the newest thing always comes out first: <Term word="LIFO"><strong>LIFO</strong></Term>, &ldquo;last in, first out.&rdquo; A <strong>queue</strong> adds at the back and serves the front &mdash; the oldest comes out first: <Term word="FIFO"><strong>FIFO</strong></Term>, &ldquo;first in, first out.&rdquo; The browser wanted a stack; the barista runs a queue.</>,
          rigorous: <>A <strong>stack</strong> permits mutation at one end only: after any operation, the top is the most recently added survivor &mdash; <Term word="LIFO"><strong>LIFO</strong></Term>. A <strong>queue</strong> mutates at both ends with fixed roles &mdash; in at the back, out at the front: the front is always the oldest survivor &mdash; <Term word="FIFO"><strong>FIFO</strong></Term>. Each is an <Term word="invariant">invariant</Term> every operation preserves.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>A <strong>stack</strong> only lets you add and remove at <em>one</em> end &mdash; the <em>top</em>. Because you always take off whatever you most recently put on, the newest item comes out first. The shorthand is <strong>LIFO</strong>: <em>last in, first out</em>. (A &ldquo;stack&rdquo; is exactly that &mdash; think a pile of plates.)</p>
            <p>A <strong>queue</strong> uses <em>two</em> ends with different jobs: you add at the <em>back</em> and remove from the <em>front</em>. Because the front holds whoever has been waiting longest, the oldest item comes out first. The shorthand is <strong>FIFO</strong>: <em>first in, first out</em> &mdash; an ordinary line at a shop.</p>
            <p>That&rsquo;s the whole idea. The restriction isn&rsquo;t a limitation getting in your way &mdash; it&rsquo;s precisely the thing that lets every move stay instant, because you never disturb the middle.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The left promise: add and remove at <em>one</em> end only, the <em>top</em>. Whatever you take off is always the thing you most recently put on &mdash; newest first, every time. People shorten that to <strong>LIFO</strong>, <em>last in, first out</em>. The name &ldquo;stack&rdquo; is the picture: a stack of plates, where only the top plate is ever touched.</p>
            <p>The right promise: use <em>two</em> ends, one job each &mdash; new items join the <em>back</em>, and you only ever remove from the <em>front</em>. The front is whoever has waited longest, so it&rsquo;s oldest first: <strong>FIFO</strong>, <em>first in, first out</em>. That&rsquo;s an ordinary line at a shop.</p>
            <p>And that answers the setup&rsquo;s riddle: the two rules come out opposite because of <em>which end</em> the leaving happens at. Take from the same end you add to, and you get newest-first; take from the opposite end, and you get oldest-first. The promise decides the order &mdash; and because it&rsquo;s kept on every single move, you can trust the order without ever checking.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Stack invariant:</strong> mutation only at the top, so the top is always the most recently added survivor &mdash; pops replay history newest-first. <strong>Queue invariant:</strong> insert at the back, remove at the front, so the front is always the oldest survivor &mdash; removal order equals arrival order.</p>
            <p><strong>Proof sketch (induction):</strong> both hold on the empty structure. Each insert places the newest element at the permitted entry end; each removal takes an extreme without touching the interior. No operation reorders survivors, so each guarantee persists after every operation &mdash; an <Term word="invariant">invariant</Term> you build on without re-checking. The restriction to the ends is also what will price the operations: no interior cell is ever vacated, so nothing ever shifts.</p>
          </>
        ),
      }),
      arrows: [
        { x1: STACK_CX, y1: 152, x2: STACK_CX, y2: S_TOP - 40 },
        { x1: Q_CX, y1: 152, x2: Q_CX, y2: S_TOP - 40 },
      ],
      codeLabels: ["sig", "qinit"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "And here's the payoff of touching only the ends: now put a price tag on every move.",
        intuitive: "Time to put a price on every move — but first, commit to what the contract predicts.",
        rigorous: "Invariants stated; now count what each operation actually moves.",
      }),
      actionLabel: reg({
        base: "When does each fit?",
        structured: "Name them",
        rigorous: "Name them",
      }),
      takeaway: reg({
        base: "Every push/pop/peek and queue add/remove is O(1) — as long as the queue uses a deque, not a plain list.",
        intuitive: "Push, pop, add, remove: each touches one end — one step each, if the queue's row is a deque.",
        rigorous: "Every op is O(1) — stack on a list, queue on a deque; a list's front-pop is the O(n) trap.",
      }),
      visual: (api) => <PopOrderGate api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The operations",
        title: reg({
          base: "Every move is at an end, so every move is instant.",
          rigorous: "Ends move one cell; a list's front moves them all.",
        }),
        body: reg({
          base: <>On a stack, <code>push</code>, <code>pop</code>, and <code>peek</code> (look at the top without taking it) are all <code>O(1)</code>. A queue&rsquo;s add/remove are <code>O(1)</code> too &mdash; if you use a <Term word="deque"><em>deque</em></Term> (say &ldquo;deck&rdquo;: a row built to be fast at both ends), not a plain list whose front-removal is <code>O(n)</code>.</>,
          intuitive: <>Count what one move touches: <code>push</code>, <code>pop</code>, and <code>peek</code> (look at the top without taking it) each handle a single item &mdash; one step at any size, which is what <Term word="O(1)"><code>O(1)</code></Term> means. A queue&rsquo;s add/remove are one step too &mdash; if its row is a <Term word="deque"><em>deque</em></Term> (say &ldquo;deck&rdquo;: built to be fast at both ends), not a plain list that shuffles its front away.</>,
          rigorous: <><code>push</code>, <code>pop</code>, <code>peek</code> touch exactly one cell at the sequence&rsquo;s end &mdash; zero elements move: <Term word="O(1)"><code>O(1)</code></Term>. Dequeue from a contiguous front moves every survivor &mdash; n &minus; 1 shifts: <Term word="O(n)"><code>O(n)</code></Term> on a list; <code>collections.deque</code> is built for <code>O(1)</code> at both ends.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>On a <strong>stack</strong>, the three moves are <code>push</code> (add to the top), <code>pop</code> (take the top off), and <code>peek</code> (look at the top without removing it). All three are <code>O(1)</code> &mdash; instant, the same cost whether the stack holds three items or three million, because each one touches only the top. There&rsquo;s no looking up an item in the middle; if you need that, a stack is the wrong tool.</p>
            <p>On a <strong>queue</strong>, adding at the back (<code>enqueue</code>) and removing from the front (<code>dequeue</code>) are both <code>O(1)</code> too &mdash; <em>but only if you store it the right way.</em> In Python that&rsquo;s a <code>collections.deque</code> (say &ldquo;deck&rdquo;: a row purpose-built to be fast at both ends). A plain list looks fine, but its front-removal <code>pop(0)</code> secretly shuffles everything left, so it&rsquo;s <code>O(n)</code> &mdash; the very cost the instinct was meant to kill.</p>
            <p>One edge to respect: <code>pop</code>, <code>peek</code>, and a deque&rsquo;s <code>popleft</code> all fail on an <em>empty</em> structure (Python raises <code>IndexError</code>) &mdash; check, or catch, before you take.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Price the <strong>stack</strong> first, by counting touches. <code>push</code> sets one item on top; <code>pop</code> lifts one item off the top; <code>peek</code> just looks at the top. One item touched, nobody else disturbed &mdash; whether the pile holds three items or three million. A cost that stays flat like that is written <Term word="O(1)"><code>O(1)</code></Term>. (Want something from the middle? A stack simply doesn&rsquo;t offer that &mdash; wrong tool.)</p>
            <p>The <strong>queue</strong> earns the same price, with one trap. Joining the back touches one item; serving the front touches one item &mdash; <em>if</em> the row underneath is a <Term word="deque"><em>deque</em></Term> (say &ldquo;deck&rdquo;), a row purpose-built to be fast at both ends. Store it in a plain list instead and serving the front quietly brings back the shuffle from earlier &mdash; every waiting item steps left, cost growing with the line: <Term word="O(n)"><code>O(n)</code></Term>.</p>
            <p>And one small honesty rule: you can&rsquo;t take from an <em>empty</em> pile or line &mdash; Python stops the program if you try. Check there&rsquo;s something in it before you take.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> Stack on a Python list: <code>append</code> (push), <code>pop()</code>, and <code>[-1]</code> (peek) all touch the last cell &mdash; zero shifts, <code>O(1)</code> (append <Term word="amortized">amortized</Term> across growth). Queue: <code>deque.append</code> / <code>popleft</code> are <code>O(1)</code> at both ends; <code>list.pop(0)</code> shifts all n &minus; 1 survivors &mdash; <code>O(n)</code> per serve, <Term word="O(n²)"><code>O(n²)</code></Term> for a queue drained that way.</p>
            <p><strong>Edges.</strong> <code>pop</code> / <code>popleft</code> / peek on an empty structure raise <code>IndexError</code> &mdash; guard or catch. The deque&rsquo;s price: no cheap random access (indexing its middle is <code>O(n)</code> &mdash; the opposite of the array&rsquo;s trade). <code>deque(maxlen=k)</code> silently evicts from the far end once full. Neither contract offers search: membership is an <code>O(n)</code> scan in both.</p>
          </>
        ),
      }),
      codeLabels: ["push", "pop", "peek"],
      interaction: "wedge",
    },
    {
      id: "fits",
      label: "When it fits",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Both are now equally cheap, so the only thing left to decide is which one a given problem actually wants.",
      actionLabel: "Name them",
      takeaway: "Choose a stack when you want the most-recent item next; a queue when the longest-waiter goes next.",
      visual: <TwoContracts stackTones={["idle", "muted", "active"]} queueTones={["active", "muted", "idle"]} showNoMiddle chips />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When it fits", title: "Newest-next vs oldest-next.",
        body: <>Pick a <strong>stack</strong> when you want the most-recent thing next &mdash; like browser back or the <Term word="call stack"><em>call stack</em></Term> (the list of functions still waiting to finish). Pick a <strong>queue</strong> when the longest-waiter goes next &mdash; like print jobs or scheduling.</>,
      }],
      detail: (
        <>
          <p>Reach for a <strong>stack</strong> whenever the next thing you want is the one most recently added. That covers the browser <em>back</em> button, the <em>call stack</em> (the running list of functions still waiting to finish &mdash; the most recently called returns first), undo history, checking balanced parentheses, and <em>depth-first</em> traversal (diving as deep as possible before backing up).</p>
          <p>Reach for a <strong>queue</strong> whenever the next thing you want is the one that has waited longest: scheduling, task queues, print spoolers, request pipelines, and <em>breadth-first</em> traversal (spreading one ring outward at a time). Anything where fairness or first-come-first-served matters is a queue.</p>
          <p>One warning sign: if you ever find yourself wanting to pull something out of the <em>middle</em>, neither fits &mdash; that&rsquo;s a hint you need a different structure entirely.</p>
        </>
      ),
      codeLabels: ["sig", "qinit"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: reg({
        base: "Now give the two contracts their names — and notice they're just the everyday pictures you already know.",
        rigorous: "Name them, and file the invariant where it belongs.",
      }),
      takeaway: reg({
        base: "Stack and Queue: two contracts on a plain array, and the contract is what keeps every move instant.",
        intuitive: "Stack = plate pile, queue = coffee line: kept promises that keep every move instant.",
        rigorous: "Stack/queue: access contracts on a sequence — the order invariant is what you build on.",
      }),
      visual: <NamedContracts />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The pattern", title: "Stack and Queue.",
        body: reg({
          base: <>The names are the pictures. A <strong>stack</strong> of plates: add to the top, take from the top. A <strong>queue</strong> at a coffee shop: join the back, get called from the front. They aren&rsquo;t exotic &mdash; just two contracts on a plain row, and the contract is what keeps every move instant.</>,
          intuitive: <>You&rsquo;ve derived both. The <strong>stack</strong> is named for the plate pile &mdash; add to the top, take from the top. The <strong>queue</strong> is the coffee line &mdash; join the back, get called from the front. Underneath, each is just a plain row plus a <em>kept promise</em> &mdash; and the promise is the whole trick: it fixes the order and keeps every move instant.</>,
          rigorous: <>A <strong>stack</strong> and a <strong>queue</strong>: two access contracts on one sequence. The restriction is the feature &mdash; it pins an order <Term word="invariant">invariant</Term> (LIFO / FIFO) that later tools assume outright: the <Term word="call stack">call stack</Term>, undo logs, schedulers, DFS (stack-shaped) and BFS (queue-shaped).</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The names come straight from the physical picture. A <strong>stack</strong> of plates: you add to the top, you take from the top &mdash; nobody pulls a plate from the middle of the pile. A <strong>queue</strong> at a coffee shop: new customers join the back, and the barista calls the person at the front.</p>
            <p>Seen this way, they&rsquo;re barely separate data structures at all &mdash; they&rsquo;re two <em>contracts</em> laid on top of a plain array. The contract (touch only the top, or only the two ends) is the entire reason every operation stays fast.</p>
            <p>Open the code drawer to see how Python writes both: a list works as a stack out of the box, and a <code>deque</code> gives you a fast queue.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity &amp; invariants:</strong> the contract is a kept promise &mdash; every operation preserves the order guarantee, so you can build on it without ever re-checking.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>The names are just the pictures you&rsquo;ve been using. A <strong>stack</strong> of plates: add to the top, take from the top &mdash; nobody ever pulls a plate from the middle. A <strong>queue</strong> at a coffee shop: join the back, get called from the front. The browser&rsquo;s back button was a stack all along; the barista was running a queue.</p>
            <p>And notice what you actually built: not a new kind of row &mdash; the items still sit in a plain row &mdash; but a <em>promise about where to touch it</em>. Keep the promise and two things come for free: every move stays one step, and the order (newest-first, or oldest-first) is <em>guaranteed</em>, not hoped for.</p>
            <p>Open the code drawer to see how Python writes both: a list works as a stack out of the box, and a <code>deque</code> gives you a fast queue.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The third big idea (3 of 7) &mdash; a promise you keep:</strong> a rule that every move respects becomes a guarantee you can build on &mdash; here, the guarantee of who comes out next.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>In Python: a stack is a plain <code>list</code> (<code>append</code> / <code>pop</code> at the tail); a queue is <code>collections.deque</code> (<code>O(1)</code> at both ends). Same storage, different contract &mdash; the contract, not the memory layout, is the structure.</p>
            <p>What it buys downstream: the call stack and DFS run on LIFO; schedulers and BFS run on FIFO &mdash; BFS&rsquo;s nearest-first guarantee <em>is</em> the queue invariant at work. The monotonic-stack pattern later sharpens this same contract into an <Term word="amortized">amortized</Term> counting tool.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7 &mdash; monotonicity &amp; invariants:</strong> LIFO/FIFO are invariants every operation preserves &mdash; a guarantee you build on, never re-derive.
            </div>
          </>
        ),
      }),
      codeLabels: ["push", "pop", "enqueue", "dequeue"],
    },
  ],
};
