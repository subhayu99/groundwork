"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge, StackBoxes, StackBox, Pill, Bracket } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import recursionPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* ── the one shared object: the Downloads tree (same geometry every beat) ───── */
/* ids, positions (canvas space, middle band y 180–430), and the truth totals.  */
type Kind = "file" | "folder";
interface TNode { id: string; label: string; x: number; y: number; kind: Kind; size: number; total: number; parent?: string; }

/* tree laid out left-of-centre so the call-stack panel sits on the right */
const T: TNode[] = [
  { id: "root",    label: "Downloads", x: 120, y: 210, kind: "folder", size: 0, total: 19 },
  { id: "resume",  label: "resume",    x: 248, y: 210, kind: "file",   size: 2, total: 2,  parent: "root" },
  { id: "photos",  label: "photos",    x: 248, y: 258, kind: "folder", size: 0, total: 7,  parent: "root" },
  { id: "beach",   label: "beach",     x: 372, y: 244, kind: "file",   size: 4, total: 4,  parent: "photos" },
  { id: "party",   label: "party",     x: 372, y: 290, kind: "file",   size: 3, total: 3,  parent: "photos" },
  { id: "projects",label: "projects",  x: 248, y: 338, kind: "folder", size: 0, total: 9, parent: "root" },
  { id: "notes",   label: "notes",     x: 372, y: 338, kind: "file",   size: 1, total: 1,  parent: "projects" },
  { id: "code",    label: "code",      x: 372, y: 386, kind: "folder", size: 0, total: 8,  parent: "projects" },
  { id: "app",     label: "app.zip",   x: 496, y: 386, kind: "file",   size: 8, total: 8,  parent: "code" },
  { id: "scratch", label: "scratch",   x: 248, y: 418, kind: "file",   size: 1, total: 1,  parent: "root" },
];
const TBY = new Map(T.map((n) => [n.id, n]));

const EDGES: GEdge[] = T.filter((n) => n.parent).map((n) => ({ from: n.parent!, to: n.id }));

/* build the GNode list, with per-id tone + per-id shown number (or "?") */
function treeNodes(opts: {
  tone?: (n: TNode) => Tone | undefined;
  shown?: (n: TNode) => number | null;     // null → "?", number → "<n>MB"
  hideNum?: (n: TNode) => boolean;          // file rows always show their own size
  click?: (id: string) => void;
  enabled?: (id: string) => boolean;
}): GNode[] {
  return T.map((n) => {
    const isFile = n.kind === "file";
    const num = isFile ? n.size : opts.shown ? opts.shown(n) : null;
    const sub = opts.hideNum?.(n) ? undefined : num === null ? "?" : `${num}MB`;
    return {
      id: n.id, x: n.x, y: n.y, shape: "rect" as const, w: 78, h: 26,
      label: <tspan style={{ fontSize: 10 }}>{isFile ? n.label : `${n.label}/`}</tspan>,
      sub: sub == null ? undefined : <tspan style={{ fontSize: 8 }}>{sub}</tspan>,
      tone: opts.tone?.(n) ?? "idle",
    };
  });
}

const edgesToned = (active: (id: string) => boolean): GEdge[] =>
  EDGES.map((e) => ({ ...e, tone: active(e.to) ? "active" : undefined }));

/* ── call-stack panel geometry (StackBoxes), middle-right band ──────────────── */
const STACK_CX = 700, STACK_TOP = 232, STACK_W = 200, STACK_BH = 30, STACK_GAP = 7;

function stackHeader(note: string) {
  return (
    <g>
      <text x={STACK_CX} y={STACK_TOP - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>CALL STACK · newest on top</text>
      <Pill x={STACK_CX} y={STACK_TOP - 18} text="↑ working here" />
      <text x={STACK_CX} y={STACK_TOP + 5 * (STACK_BH + STACK_GAP) + 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>{note}</text>
    </g>
  );
}

/* ── static helper: render the whole canvas for a beat ──────────────────────── */
function TreeScene({
  nodes, edges, stack, stackNote, badge,
}: {
  nodes: GNode[]; edges: GEdge[];
  stack?: StackBox[]; stackNote?: string;
  badge?: { tone?: Tone; text: string };
}) {
  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} />
      {badge && (
        <text x={TBY.get("root")!.x} y={TBY.get("root")!.y - 22} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 11, fill: badge.tone === "good" ? "var(--diff-easy)" : "var(--accent-ink)" }}>{badge.text}</text>
      )}
      {stack !== undefined && (
        <>
          {stackHeader(stackNote ?? "")}
          <StackBoxes items={stack} cx={STACK_CX} top={STACK_TOP} width={STACK_W} boxH={STACK_BH} gap={STACK_GAP} />
        </>
      )}
    </g>
  );
}

/* ── interactive WEDGE: click a folder's "ask" → it fills in, children glow ─── */
function AskAFolder({ api }: { api: BeatVisualApi }) {
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('click a folder to ask "how big are you?"');

  const ask = (id: string) => {
    const n = TBY.get(id);
    if (!n || n.kind !== "folder") return;
    api.onInteractionDone();
    api.onActiveLine(["recursive_call", "aggregate"]);
    setAnswered((a) => ({ ...a, [id]: true }));
    setMsg(`${n.label}/ = its files + each subfolder = ${n.total}MB`);
  };

  const nodes = treeNodes({
    tone: (n) => (n.kind === "folder" && answered[n.id] ? "good" : n.kind === "folder" ? "active" : undefined),
    shown: (n) => (answered[n.id] ? n.total : null),
    click: ask,
    enabled: (id) => TBY.get(id)?.kind === "folder",
  });
  // attach click handler via NodeGraph (folders only)
  return (
    <g>
      <NodeGraph
        nodes={nodes}
        edges={EDGES}
        onNodeClick={ask}
        cellEnabled={(id) => TBY.get(id)?.kind === "folder"}
      />
      <text x={120} y={188} textAnchor="start" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>folders are clickable · files just know their size</text>
      <text x={300} y={448} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>{msg}</text>
    </g>
  );
}

/* ── playback: the recursion runs itself — recurse in, return up, stack drains  */
interface Frame { stack: string[]; finished: Record<string, number>; active: string | null; idx: { [id: string]: number }; done: boolean; }

function AutoRecurse({ api }: { api: BeatVisualApi }) {
  const childrenOf = (id: string) => T.filter((n) => n.parent === id).map((n) => n.id);
  const init = (): Frame => ({ stack: [], finished: {}, active: null, idx: {}, done: false });
  const [s, setS] = useState<Frame>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      // start: push root
      if (c.stack.length === 0) {
        api.onActiveLine(["sig"]);
        setS({ ...c, stack: ["root"], active: "root", idx: { root: -1 } });
        return;
      }
      const topId = c.stack[c.stack.length - 1];
      const node = TBY.get(topId)!;
      if (node.kind === "file") {
        // base case → return size up
        api.onActiveLine(["base_case", "base_return"]);
        const fin = { ...c.finished, [topId]: node.size };
        const popped = c.stack.slice(0, -1);
        if (popped.length === 0) { setS({ ...c, stack: [], finished: fin, active: null, done: true }); return; }
        setS({ ...c, stack: popped, finished: fin, active: popped[popped.length - 1] });
        return;
      }
      // folder: descend into next child, or finish
      const kids = childrenOf(topId);
      const nextIdx = (c.idx[topId] ?? -1) + 1;
      if (nextIdx < kids.length) {
        api.onActiveLine(["recursive_call"]);
        const child = kids[nextIdx];
        setS({ ...c, stack: [...c.stack, child], active: child, idx: { ...c.idx, [topId]: nextIdx, [child]: -1 } });
        return;
      }
      // all children done → sum + return up
      api.onActiveLine(["aggregate", "folder_return"]);
      const total = node.total;
      const fin = { ...c.finished, [topId]: total };
      const popped = c.stack.slice(0, -1);
      if (popped.length === 0) { setS({ ...c, stack: [], finished: fin, active: null, done: true }); return; }
      setS({ ...c, stack: popped, finished: fin, active: popped[popped.length - 1] });
    }, pace(760));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStack = new Set(s.stack);
  const nodes = treeNodes({
    tone: (n) =>
      s.active === n.id ? "active"
      : s.finished[n.id] !== undefined ? "good"
      : onStack.has(n.id) ? "active"
      : undefined,
    shown: (n) => (s.finished[n.id] !== undefined ? s.finished[n.id] : null),
  });
  const edges = edgesToned((id) => onStack.has(id) || s.active === id);

  const items: StackBox[] = s.stack.map((id, i) => {
    const n = TBY.get(id)!;
    return { key: id, label: `${n.label}${n.kind === "folder" ? "/" : ""}`, sub: i === s.stack.length - 1 ? "top" : undefined, tone: i === s.stack.length - 1 ? "active" : "accent" };
  });
  const note = s.done ? "empty — every call has returned ✓"
    : s.stack.length === 0 ? "starting…"
    : `${s.stack.length} call${s.stack.length > 1 ? "s" : ""} waiting`;

  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} />
      {stackHeader(note)}
      <StackBoxes items={items} cx={STACK_CX} top={STACK_TOP} width={STACK_W} boxH={STACK_BH} gap={STACK_GAP} />
      {s.done && (
        <text x={TBY.get("root")!.x} y={TBY.get("root")!.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>19MB ✓</text>
      )}
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={STACK_CX - 30} y={448} width={60} height={20} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={STACK_CX} y={458} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── beat 2: naive flat scan — touches only top-level files, can't go deep ──── */
function NaiveScan() {
  const reached = new Set(["resume", "scratch"]); // a flat loop only sees the top row's files
  const nodes = treeNodes({
    tone: (n) => (reached.has(n.id) ? "good" : n.kind === "folder" ? "muted" : undefined),
    shown: () => null,
  });
  return (
    <g>
      <NodeGraph nodes={nodes} edges={EDGES} />
      <text x={300} y={188} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>top-level files added: 2 + 1 = 3MB</text>
      <text x={TBY.get("app")!.x} y={TBY.get("app")!.y + 28} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>✗ a flat loop never reaches here</text>
    </g>
  );
}

/* ── beat 5: fully resolved + peak-depth stack with a height bracket ────────── */
function ResolvedPeak() {
  const nodes = treeNodes({ tone: () => "good", shown: (n) => n.total });
  // peak-depth chain: Downloads › projects › code › app.zip (4 frames)
  const chain = ["root", "projects", "code", "app"];
  const items: StackBox[] = chain.map((id, i) => {
    const n = TBY.get(id)!;
    return { key: id, label: `${n.label}${n.kind === "folder" ? "/" : ""}`, sub: i === chain.length - 1 ? "top" : undefined, tone: i === chain.length - 1 ? "active" : "accent" };
  });
  const topY = STACK_TOP;
  const botY = STACK_TOP + chain.length * (STACK_BH + STACK_GAP) - STACK_GAP;
  return (
    <g>
      <NodeGraph nodes={nodes} edges={EDGES.map((e) => ({ ...e, tone: "good" as Tone }))} />
      <text x={TBY.get("root")!.x} y={TBY.get("root")!.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>19MB ✓</text>
      {stackHeader("peak: 4 calls deep")}
      <StackBoxes items={items} cx={STACK_CX} top={STACK_TOP} width={STACK_W} boxH={STACK_BH} gap={STACK_GAP} />
      {/* height bracket on the LEFT side of the stack */}
      <path d={`M${STACK_CX - STACK_W / 2 - 14},${topY} L${STACK_CX - STACK_W / 2 - 20},${topY} L${STACK_CX - STACK_W / 2 - 20},${botY} L${STACK_CX - STACK_W / 2 - 14},${botY}`}
        fill="none" stroke="var(--diff-hard)" strokeWidth={1.5} />
      <text x={STACK_CX - STACK_W / 2 - 24} y={(topY + botY) / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>height = deepest nesting</text>
    </g>
  );
}

/* ── beat 6: three mini-trees sharing the SAME nesting shape ────────────────── */
function SameShape() {
  // tiny generic shape: parent → two children, one of which has a child
  const mini = (cx: number, top: number, root: string, mid: string, leaf: string, sib: string): { nodes: GNode[]; edges: GEdge[] } => {
    const nodes: GNode[] = [
      { id: `${root}-r`, x: cx,      y: top,      shape: "rect", w: 64, h: 24, tone: "accent", label: <tspan style={{ fontSize: 10 }}>{root}</tspan> },
      { id: `${root}-a`, x: cx - 42, y: top + 46, shape: "rect", w: 56, h: 24, tone: "active", label: <tspan style={{ fontSize: 10 }}>{mid}</tspan> },
      { id: `${root}-b`, x: cx + 42, y: top + 46, shape: "rect", w: 56, h: 24, tone: "idle",   label: <tspan style={{ fontSize: 10 }}>{sib}</tspan> },
      { id: `${root}-c`, x: cx - 42, y: top + 92, shape: "rect", w: 56, h: 24, tone: "idle",   label: <tspan style={{ fontSize: 10 }}>{leaf}</tspan> },
    ];
    const edges: GEdge[] = [
      { from: `${root}-r`, to: `${root}-a`, tone: "active" },
      { from: `${root}-r`, to: `${root}-b` },
      { from: `${root}-a`, to: `${root}-c`, tone: "active" },
    ];
    return { nodes, edges };
  };
  const a = mini(180, 210, "{ }", "{ }", '"x"', '"n"');
  const b = mini(430, 210, "<div>", "<div>", "text", "<p>");
  const c = mini(680, 210, "( + )", "( * )", "4-1", "2");
  const all = [a, b, c];
  return (
    <g>
      {all.map((m, i) => <NodeGraph key={i} nodes={m.nodes} edges={m.edges} />)}
      <text x={180} y={428} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>JSON</text>
      <text x={430} y={428} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>HTML boxes</text>
      <text x={680} y={428} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>math: (2 + (3*(4-1)))</text>
      <text x={VW / 2} y={448} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>same shape: a thing made of smaller copies of itself</text>
    </g>
  );
}

/* ── beat 7: resolved tree with base-case / recursive-case callouts ─────────── */
function NamedPattern() {
  const nodes = treeNodes({ tone: (n) => (n.kind === "file" ? "good" : "active"), shown: (n) => n.total });
  const file = TBY.get("scratch")!;     // a file row = base case
  const folder = TBY.get("code")!;      // a folder row = recursive case
  return (
    <g>
      <NodeGraph nodes={nodes} edges={EDGES} />
      <text x={TBY.get("root")!.x} y={TBY.get("root")!.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>19MB ✓</text>
      <Bracket x1={file.x - 42} x2={file.x + 42} y={file.y + 34} label="base case — a file knows its size" color="var(--diff-easy)" />
      <Bracket x1={folder.x - 42} x2={folder.x + 156} y={folder.y - 16} label="recursive case — ask each child, add up" color="var(--accent-ink)" />
    </g>
  );
}

/* ── beat 4: static mid-recursion snapshot, deepest path on the stack ───────── */
function MidRecursion() {
  const onStack = new Set(["root", "projects", "code", "app"]);
  const finished: Record<string, number> = { resume: 2, beach: 4, party: 3, photos: 7, notes: 1 };
  const nodes = treeNodes({
    tone: (n) => (n.id === "app" ? "active" : onStack.has(n.id) ? "active" : finished[n.id] !== undefined ? "good" : undefined),
    shown: (n) => (finished[n.id] !== undefined ? finished[n.id] : null),
  });
  const edges = edgesToned((id) => onStack.has(id));
  const chain = ["root", "projects", "code", "app"];
  const items: StackBox[] = chain.map((id, i) => {
    const n = TBY.get(id)!;
    const partial = id === "projects" ? 1 : 0; // notes.txt already counted
    return { key: id, label: `${n.label}${n.kind === "folder" ? "/" : ""}`, sub: i === chain.length - 1 ? "→ returns 8" : `partial ${partial}`, tone: i === chain.length - 1 ? "active" : "accent" };
  });
  return (
    <g>
      <NodeGraph nodes={nodes} edges={edges} />
      <Bracket x1={TBY.get("app")!.x - 42} x2={TBY.get("app")!.x + 42} y={TBY.get("app")!.y + 34} label="base case: return 8, stop" color="var(--diff-easy)" />
      {stackHeader("recursing in — newest call on top")}
      <StackBoxes items={items} cx={STACK_CX} top={STACK_TOP} width={STACK_W} boxH={STACK_BH} gap={STACK_GAP} />
    </g>
  );
}

export const recursionLesson: LessonSpec = {
  topicTitle: "recursion · how big is your Downloads folder?",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: recursionPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "The obvious first idea",
      takeaway: "One folder size means adding up files hidden at unknown depth.",
      visual: <TreeScene nodes={treeNodes({ shown: () => null })} edges={EDGES} />,
      panels: [{
        left: 150, top: 24, width: 580, variant: "main", label: "The setup", title: "How big is your Downloads folder?",
        body: <>Your phone says Downloads is <strong>19MB</strong>. But files hide inside folders, inside more folders. To get one number you must add up every file. Each folder shows a <code>?</code> until you total it. How does the phone know?</>,
      }],
      detail: (
        <>
          <p>You open your Downloads folder to free up space. Inside are some files and some folders. Inside <em>those</em> folders are more files and more folders. Yet your phone just shows you one number &mdash; <code>19MB</code>. How does it know?</p>
          <p>The straight answer: add up the size of every single file. The catch is that you can&rsquo;t see them all at once. They&rsquo;re hiding behind folders, behind more folders, going down as deep as someone cared to nest them.</p>
        </>
      ),
      arrows: [{ x1: 200, y1: 152, x2: TBY.get("root")!.x, y2: TBY.get("root")!.y - 20 }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "Now that one number has to come from files hidden at unknown depth, the first instinct is to just go in and grab them all.",
      actionLabel: "Notice the repeat",
      takeaway: "You can't write loops for a depth you don't know in advance.",
      visual: <NaiveScan />,
      panels: [{
        left: 150, top: 24, width: 600, variant: "main", label: "The obvious thing", title: "Loops inside loops inside loops.",
        body: <>The naive plan: a loop walks the top items, adding file sizes. Hit a folder? Loop inside it. Hit another? Loop again. You can hand-write two or three levels, but folders nest as deep as they like &mdash; you can&rsquo;t write a loop for a depth you don&rsquo;t know.</>,
      }],
      detail: (
        <>
          <p>Here&rsquo;s the obvious plan. Walk the top-level items. If it&rsquo;s a file, add its size. If it&rsquo;s a folder, <em>loop</em> over its contents (a loop just means &ldquo;do this for each thing inside&rdquo;). If <em>that</em> holds a folder, loop again. And again.</p>
          <p>You can hand-write the loops for two levels. Three. Four. But folders aren&rsquo;t promised to stop at any fixed depth &mdash; you can&rsquo;t write loops for a depth you don&rsquo;t know in advance. The diagram shows a flat loop reaching only the top row; <code>app.zip</code>, buried three levels down, never gets counted.</p>
          <p>There is something the same about every loop, though. Each time we open a folder we do the exact same job: <em>add up the size of everything inside</em>. The job never changes. Only the folder changes.</p>
        </>
      ),
      arrows: [{ x1: 470, y1: 152, x2: TBY.get("app")!.x, y2: TBY.get("app")!.y - 16 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "That repeated job — the same work on every folder — is the crack to lever open.",
      actionLabel: "Let the function call itself",
      takeaway: "Each subfolder is the same problem, just on fewer items.",
      visual: (api) => <AskAFolder api={api} />,
      panels: [
        {
          left: 60, top: 18, width: 740, variant: "main", label: "The instinct", title: "Open a folder — it’s a smaller copy of the same problem.",
          body: <>Click any folder to ask its total. Inside you always find the same shape: some files with sizes, some more folders. So a folder&rsquo;s total is its own files plus each inner folder&rsquo;s total &mdash; the <strong>same problem, on fewer items.</strong></>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> if a folder is made of smaller folders just like it, can the rule for the whole be the rule for a part?</>,
        },
      ],
      detail: (
        <>
          <p>Click any folder in the picture to peek inside. Notice what you find: files (each with a size) and more folders. The smaller folders have the <em>same shape</em> as the big one &mdash; some files, some folders. Nothing about a subfolder looks different from the folder you started with; it&rsquo;s just smaller.</p>
          <p>So if you already knew the size of every subfolder, the answer for the outer folder would be easy: add up the file sizes you can see, plus the size of each subfolder. Done. The hard part isn&rsquo;t the adding &mdash; it&rsquo;s that the subfolders are themselves unsolved.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct:</strong> each subfolder is <em>the same problem</em> as the original, just on fewer items.
          </div>
        </>
      ),
      codeLabels: ["recursive_call", "aggregate"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "If a subfolder is just a smaller copy of the same question, then the rule that answers the whole can answer the part — so let's write that rule down.",
      actionLabel: "Count the work",
      takeaway: "The rule: a file returns its size; a folder asks each child and adds up.",
      visual: <MidRecursion />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The derivation", title: "Write the rule. The function calls itself.",
        body: <>Define <code>folder_size(node)</code> &mdash; a recipe taking one item (a <code>node</code> is a file or folder). Two cases. <strong>File:</strong> return its size, stop. <strong>Folder:</strong> run the recipe on each child, then add the answers. It can&rsquo;t run forever &mdash; every call works on a <em>strictly smaller</em> item.</>,
      }],
      detail: (
        <>
          <p>Let&rsquo;s name the recipe <code>folder_size(node)</code>. A <strong>function</strong> is just a named recipe you can run; a <strong>node</strong> is one item in the tree &mdash; either a file or a folder. The recipe has exactly two cases.</p>
          <p><strong>File.</strong> The node is a file. Return its size and stop. Nothing to dig into.</p>
          <p><strong>Folder.</strong> The node is a folder. Go through its children, and for each child run <code>folder_size(child)</code> &mdash; the recipe <em>asks itself the same question</em> on a smaller piece. Add up the answers it gets back and return the total.</p>
          <p>A recipe that runs itself sounds like it could spin forever, but it can&rsquo;t here: every call is on something <strong>strictly smaller</strong> &mdash; a child of the folder we&rsquo;re standing in, never the folder itself. Because each step shrinks the problem, it has to bottom out at files.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle &mdash; <Term word="decomposition">decomposition</Term>:</strong> solve a problem by solving a smaller version of itself.
          </div>
        </>
      ),
      arrows: [{ x1: 430, y1: 150, x2: TBY.get("code")!.x, y2: TBY.get("code")!.y - 14 }],
      codeLabels: ["base_case", "base_return", "recursive_call", "aggregate"],
      interaction: "none",
    },
    {
      id: "operations",
      label: "The operations",
      connector: "The rule is written; now see it actually run, and count how much work it does.",
      actionLabel: "How tall the pile gets",
      takeaway: "Every item is touched once (O(n)); calls wait in a stack until they return.",
      visual: (api) => <AutoRecurse api={api} />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The operations", title: "Each item is touched once; calls pile up in a stack.",
        body: <>Every item is looked at exactly once &mdash; that&rsquo;s <Term word="O(n)"><code>O(n)</code></Term> (work grows in step with the number of items, <em>n</em>). Watch the <Term word="call stack"><strong>call stack</strong></Term> on the right: a to-do list where the newest waiting call sits on top, draining as each returns.</>,
      }],
      detail: (
        <>
          <p>The run plays on its own &mdash; just follow it (the <strong>&#8634; replay</strong> button under the stack restarts it). Every node in the tree &mdash; every file, every folder &mdash; gets looked at exactly one time. We write that cost as <Term word="O(n)"><code>O(n)</code></Term>: the work grows in step with how many items <em>n</em> are in the tree (folders included). Twice as many items, roughly twice the work &mdash; no hidden blow-up.</p>
          <p>Now watch the panel on the right. The <Term word="call stack"><strong>call stack</strong></Term> is the computer&rsquo;s to-do list of recipes it has started but not yet finished. Each time <code>folder_size</code> opens a folder and calls itself on a child, a new entry is stacked on top &mdash; the newest, innermost call always sits on top. That call has to finish before the one beneath it can continue.</p>
          <p>As each call returns its answer, its entry is removed and the total bubbles up to the folder waiting below. The stack grows as we dive in and <em>drains</em> back to empty once every call has returned &mdash; that&rsquo;s the moment the root finally reads its full size.</p>
        </>
      ),
      codeLabels: ["recursive_call", "aggregate", "folder_return"],
      interaction: "playback",
    },
    {
      id: "depth",
      label: "The memory cost",
      connector: "Those piled-up calls aren't free — they take memory, so the next question is how tall the pile can get.",
      actionLabel: "Same shape, new questions",
      takeaway: "Memory cost = the deepest nesting, not the total number of items.",
      visual: <ResolvedPeak />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The memory cost", title: "The stack only gets as tall as the deepest folder.",
        body: <>When every call has returned, the root reads <strong>19MB</strong>. The stack&rsquo;s tallest moment equals the deepest nesting &mdash; here <code>Downloads › projects › code › app.zip</code>, just 4 calls. Only a very deep chain could run the stack out of room.</>,
      }],
      detail: (
        <>
          <p>Each call sitting on the stack is waiting for its children to finish, and each one takes a little memory while it waits. So the real question for memory is: how tall does the stack ever get?</p>
          <p>The tallest moment equals the <em>deepest nesting</em> in the tree &mdash; the longest chain of folders inside folders. Here that chain is <code>Downloads › projects › code › app.zip</code>, so the stack peaks at just 4 calls (the bracket marks that height). If a tree were balanced and 30 levels deep, the peak would be 30 calls &mdash; not the total number of items, just the depth.</p>
          <p>If a tree is <em>extremely</em> deep &mdash; think a million-level chain &mdash; the stack can run out of room (most languages cap it around 1,000&ndash;10,000 waiting calls). Real file systems never get that deep, so this is never the limit in practice. For artificial worst cases you&rsquo;d swap the self-calling recipe for an explicit to-do list you manage by hand &mdash; a pattern for another day.</p>
        </>
      ),
      arrows: [{ x1: 540, y1: 152, x2: STACK_CX - STACK_W / 2 - 24, y2: STACK_TOP + 30 }],
      codeLabels: ["recursive_call", "folder_return"],
    },
    {
      id: "general",
      label: "The generalization",
      connector: "A folder tree was just the example; the same self-calling trick fits a whole family of shapes.",
      actionLabel: "Name the pattern",
      takeaway: "Anything built from smaller copies of itself yields to the same trick.",
      visual: <SameShape />,
      panels: [{
        left: 150, top: 24, width: 580, variant: "main", label: "The generalization", title: "Tree-shaped data is everywhere.",
        body: <>The same trick fits anything built from smaller copies of itself. A JSON record holds records. An HTML box holds boxes. The math <code>(2 + (3 * (4 - 1)))</code> nests inside itself. Org charts, reply threads, file trees &mdash; all solved by &ldquo;answer me by answering my parts.&rdquo;</>,
      }],
      detail: (
        <>
          <p>The same trick works on anything that branches into smaller copies of itself. The folder tree was just one face of it:</p>
          <ul>
            <li><strong>JSON</strong> (a common way to store data): an object holds values that might themselves be objects. Want to count every key? Same recipe.</li>
            <li><strong>HTML</strong> (the structure of a web page): a box holds boxes that hold boxes. Want the total height? Same recipe.</li>
            <li><strong>Math expressions</strong> like <code>(2 + (3 * (4 - 1)))</code>: each set of parentheses is a smaller expression you evaluate exactly the same way.</li>
          </ul>
          <p>File permissions, nested comment threads, org-chart head-counts, outline indent levels, the way a chess engine looks moves ahead &mdash; all the same shape. Each one says: <em>solve me by solving my children.</em></p>
        </>
      ),
      arrows: [{ x1: 430, y1: 152, x2: 430, y2: 196 }],
      codeLabels: [],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "All those examples share one move with one name — here it is, plus the cues that tell you to reach for it.",
      takeaway: "It's Recursion — a base case plus a self-call on a smaller piece.",
      visual: <NamedPattern />,
      panels: [{
        left: 150, top: 24, width: 600, variant: "main", label: "The pattern", title: "Recursion.",
        body: <>That&rsquo;s the name: <Term word="recursion"><strong>recursion</strong></Term> &mdash; a function that calls itself on a smaller version of the same problem. It needs a <strong>base case</strong> (so small the answer is obvious &mdash; a file knows its size) and a <strong>recursive case</strong> (shrink, combine, return).</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: <strong>recursion</strong> &mdash; a function that calls itself on a smaller version of the same problem. Every recursion has two non-negotiable pieces:</p>
          <ul>
            <li><strong>A base case.</strong> A version so small the answer is obvious without calling yourself &mdash; here, a file already knows its own size, so it just returns it (marked on the picture).</li>
            <li><strong>A recursive case.</strong> Reduce the work to one or more <em>strictly smaller</em> copies of the same problem, combine their answers, and return &mdash; here, a folder asks each child and adds up.</li>
          </ul>
          <p>How do you spot a problem that wants recursion? Watch for these signals:</p>
          <ul>
            <li>the input is tree-shaped or nested (things inside things)</li>
            <li>the answer for a whole depends on the answer for its parts</li>
            <li>you catch yourself writing &ldquo;a loop inside a loop inside a loop&rdquo;</li>
          </ul>
          <p>Open the code drawer to see it in Python: about five lines do the real work &mdash; the rest is just the rule, written down.</p>
        </>
      ),
      codeLabels: ["base_case", "base_return", "recursive_call", "aggregate", "folder_return"],
    },
  ],
};
