"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge } from "@/shared/lesson/canvas";
import treesPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* ── Org-chart tree, positioned by depth/level in canvas space ─────────────────
 * Ana is the root; everyone below is a direct report of the node above them. */
interface Person { id: string; label: string; x: number; y: number; parent?: string; }
const ORG: Person[] = [
  { id: "ana", label: "Ana", x: 430, y: 210 },
  { id: "bo", label: "Bo", x: 250, y: 280, parent: "ana" },
  { id: "harper", label: "Harper", x: 640, y: 280, parent: "ana" },
  { id: "cara", label: "Cara", x: 150, y: 350, parent: "bo" },
  { id: "eli", label: "Eli", x: 340, y: 350, parent: "bo" },
  { id: "ivy", label: "Ivy", x: 570, y: 350, parent: "harper" },
  { id: "june", label: "June", x: 710, y: 350, parent: "harper" },
  { id: "dax", label: "Dax", x: 150, y: 418, parent: "cara" },
  { id: "fawn", label: "Fawn", x: 290, y: 418, parent: "eli" },
  { id: "grace", label: "Grace", x: 400, y: 418, parent: "eli" },
];
const ORG_EDGES: GEdge[] = ORG.filter((p) => p.parent).map((p) => ({ from: p.parent!, to: p.id }));
const childrenOf = (id: string) => ORG.filter((p) => p.parent === id).map((p) => p.id);
function subtreeIds(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (n: string) => { out.add(n); childrenOf(n).forEach(walk); };
  walk(id);
  return out;
}
const orgNodes = (tone: (id: string) => Tone | undefined): GNode[] =>
  ORG.map((p) => ({ id: p.id, x: p.x, y: p.y, label: p.label, tone: tone(p.id), r: 21 }));

/* A compact org tree confined to a left-side band, so a recap table / chip list
 * can sit beside it without ever overlapping the nodes. cx≈170, spans y≈210..420. */
const ORG_COMPACT: Record<string, { x: number; y: number }> = {
  ana: { x: 168, y: 214 },
  bo: { x: 96, y: 282 }, harper: { x: 244, y: 282 },
  cara: { x: 54, y: 350 }, eli: { x: 138, y: 350 }, ivy: { x: 210, y: 350 }, june: { x: 286, y: 350 },
  dax: { x: 54, y: 416 }, fawn: { x: 116, y: 416 }, grace: { x: 168, y: 416 },
};
const compactOrgNodes = (r: number): GNode[] =>
  ORG.map((p) => ({ id: p.id, x: ORG_COMPACT[p.id].x, y: ORG_COMPACT[p.id].y, label: p.label, tone: undefined, r }));

/* ── BST, positioned by depth/level — smaller left, larger right ──────────────── */
interface BstPos { v: number; x: number; y: number; parent?: number; }
const BST: BstPos[] = [
  { v: 50, x: 430, y: 222 },
  { v: 30, x: 250, y: 288, parent: 50 },
  { v: 70, x: 610, y: 288, parent: 50 },
  { v: 20, x: 160, y: 354, parent: 30 },
  { v: 40, x: 340, y: 354, parent: 30 },
  { v: 60, x: 520, y: 354, parent: 70 },
  { v: 80, x: 700, y: 354, parent: 70 },
  { v: 10, x: 110, y: 420, parent: 20 },
  { v: 35, x: 290, y: 420, parent: 40 },
  { v: 65, x: 470, y: 420, parent: 60 },
];
const BST_BY = new Map(BST.map((b) => [b.v, b]));
const BST_EDGES: GEdge[] = BST.filter((b) => b.parent !== undefined).map((b) => ({ from: String(b.parent), to: String(b.v) }));
const leftRight = (v: number): { left?: number; right?: number } => {
  const kids = BST.filter((b) => b.parent === v);
  return { left: kids.find((k) => k.v < v)?.v, right: kids.find((k) => k.v > v)?.v };
};
/* The path bst_contains() walks from the root looking for `target`. */
function bstPath(target: number): { path: number[]; found: boolean; wentLeft: boolean; wentRight: boolean } {
  const path: number[] = [];
  let cur: number | undefined = 50;
  let found = false, wentLeft = false, wentRight = false;
  while (cur !== undefined) {
    path.push(cur);
    if (target === cur) { found = true; break; }
    const { left, right } = leftRight(cur);
    if (target < cur) { wentLeft = true; cur = left; } else { wentRight = true; cur = right; }
  }
  return { path, found, wentLeft, wentRight };
}
const bstNodes = (tone: (v: number) => Tone | undefined): GNode[] =>
  BST.map((b) => ({ id: String(b.v), x: b.x, y: b.y, label: b.v, tone: tone(b.v), r: 20 }));

/* ── caption helper (one shared SVG caption line above the visual) ─────────────── */
function Caption({ y, text, tone = "var(--text-faint)" }: { y: number; text: string; tone?: string }) {
  return (
    <text x={VW / 2} y={y} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: tone }}>
      {text}
    </text>
  );
}
function ReplayButton({ y, label, onClick }: { y: number; label: string; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <rect x={VW / 2 - 34} y={y} width={68} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={VW / 2} y={y + 12} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{label}</text>
    </g>
  );
}

/* ── flat-table visual (beats 1-2), built as raw SVG so we control row tones ───── */
const FLAT: { name: string; mgr: string; key: string }[] = [
  { name: "Ana", mgr: "—", key: "ana" },
  { name: "Bo", mgr: "Ana", key: "bo" },
  { name: "Cara", mgr: "Bo", key: "cara" },
  { name: "Dax", mgr: "Cara", key: "dax" },
  { name: "Eli", mgr: "Bo", key: "eli" },
  { name: "Fawn", mgr: "Eli", key: "fawn" },
  { name: "Grace", mgr: "Eli", key: "grace" },
  { name: "Harper", mgr: "Ana", key: "harper" },
  { name: "Ivy", mgr: "Harper", key: "ivy" },
  { name: "June", mgr: "Harper", key: "june" },
];
function FlatTable({ rowTone }: { rowTone?: (key: string) => Tone | undefined }) {
  const colW = 150, x0 = VW / 2 - colW, rowH = 23, y0 = 178, headH = 22;
  return (
    <g>
      {/* header */}
      <rect x={x0} y={y0} width={colW * 2} height={headH} rx={6} fill="var(--bg-elevated)" stroke="var(--line)" />
      <text x={x0 + 12} y={y0 + headH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>NAME</text>
      <text x={x0 + colW + 12} y={y0 + headH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>MANAGER</text>
      {FLAT.map((r, i) => {
        const tone = rowTone?.(r.key);
        const y = y0 + headH + i * rowH;
        const fill = tone === "active" ? "color-mix(in oklab, var(--accent-sky) 28%, var(--bg-card))"
          : tone === "visited" ? "color-mix(in oklab, var(--diff-med) 22%, var(--bg-card))"
          : "var(--bg-card)";
        const opacity = rowTone && !tone ? 0.32 : 1;
        return (
          <g key={r.key} style={{ opacity, transition: "opacity .3s" }}>
            <rect x={x0} y={y} width={colW * 2} height={rowH} fill={fill} stroke="var(--line-faint)" />
            <text x={x0 + 12} y={y + rowH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{r.name}</text>
            <text x={x0 + colW + 12} y={y + rowH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{r.mgr}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ── WEDGE (beat 3): click a person, their whole branch lights up ──────────────── */
function ClickToBranch({ api }: { api: BeatVisualApi }) {
  const [active, setActive] = useState<string | null>(null);

  const click = (id: string) => {
    api.onInteractionDone();
    const next = id === active ? null : id;
    setActive(next);
    if (next) api.onActiveLine(["dfs_visit", "dfs_children", "dfs_recurse"]);
    else api.onActiveLine([]);
  };

  const lit = active ? subtreeIds(active) : null;
  const tone = (id: string): Tone | undefined =>
    lit ? (lit.has(id) ? "active" : "muted") : undefined;
  const activePerson = ORG.find((p) => p.id === active);
  const count = lit ? lit.size : 0;

  return (
    <g>
      <NodeGraph nodes={orgNodes(tone)} edges={ORG_EDGES} radius={21} onNodeClick={click} />
      <Caption y={186} text={activePerson ? `${activePerson.label}'s branch: ${count} ${count === 1 ? "person" : "people"} lit — one walk down the links` : "click any person to light up their branch"} />
      <ReplayButton y={444} label="↺ reset" onClick={() => { setActive(null); api.onActiveLine([]); }} />
    </g>
  );
}

/* ── PLAYBACK (beat 5): a BST search runs itself, one hop per frame ────────────── */
interface BSTState { idx: number; done: boolean; target: number; }
function AutoBSTSearch({ api }: { api: BeatVisualApi }) {
  const TARGET = 35;
  const result = bstPath(TARGET);
  const init = (): BSTState => ({ idx: 0, done: false, target: TARGET });
  const [s, setS] = useState<BSTState>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const atVal = result.path[c.idx];
      if (atVal === c.target) {
        api.onActiveLine(["bst_start", "bst_eq"]);
        setS({ ...c, done: true });
        return;
      }
      api.onActiveLine(["bst_start", c.target < atVal ? "bst_left" : "bst_right"]);
      if (c.idx + 1 >= result.path.length) { setS({ ...c, done: true }); return; }
      setS({ ...c, idx: c.idx + 1 });
    }, pace(1000));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visited = new Set(result.path.slice(0, s.idx + 1));
  const cur = result.path[s.idx];
  const matched = s.done && cur === s.target;
  const tone = (v: number): Tone | undefined => {
    if (matched && v === s.target) return "good";
    if (v === cur) return "active";
    if (visited.has(v)) return "visited";
    return undefined;
  };

  return (
    <g>
      <NodeGraph nodes={bstNodes(tone)} edges={BST_EDGES} radius={20} />
      <Caption
        y={184}
        tone={s.done ? "var(--diff-easy)" : "var(--text-faint)"}
        text={
          s.done
            ? `found 35 in ${result.path.length} steps — never touched the other half`
            : cur === undefined
              ? "starting at the root…"
              : `at ${cur}: 35 ${35 < cur ? "< it → go left" : 35 > cur ? "> it → go right" : "= it → match"}`
        }
      />
      <ReplayButton y={444} label="↺ replay" onClick={() => setS(init())} />
    </g>
  );
}

/* ── chips for the "when it fits" beat ─────────────────────────────────────────── */
function FitsChips() {
  const treeChips = ["file system", "web page (DOM)", "game scene graph", "parser syntax tree", "ML decision tree"];
  const bstChips = ["range query", "sorted listing", "next-larger lookup"];
  const chip = (text: string, x: number, y: number, accent: boolean) => {
    const w = text.length * 6.4 + 18;
    return (
      <g key={text}>
        <rect x={x} y={y} width={w} height={22} rx={11}
          fill={accent ? "color-mix(in oklab, var(--diff-easy) 16%, var(--bg-card))" : "var(--accent-soft)"}
          stroke={accent ? "var(--diff-easy)" : "var(--accent-line)"} strokeWidth={1} />
        <text x={x + w / 2} y={y + 11} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text)" }}>{text}</text>
      </g>
    );
  };
  // chips wrap inside the right band [colX .. colX+colW]
  const colX = 372, colW = 442;
  const wrapRow = (chips: string[], y0: number, accent: boolean) => {
    let x = colX, y = y0;
    return chips.map((t) => {
      const w = t.length * 6.4 + 18;
      if (x + w > colX + colW) { x = colX; y += 30; }
      const el = chip(t, x, y, accent);
      x += w + 8;
      return el;
    });
  };
  return (
    <g>
      <NodeGraph nodes={compactOrgNodes(17)} edges={ORG_EDGES} radius={17} />
      <text x={colX} y={236} className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>TREE — any nested data:</text>
      {wrapRow(treeChips, 250, false)}
      <text x={colX} y={356} className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>BST — ordered lookups:</text>
      {wrapRow(bstChips, 370, true)}
    </g>
  );
}

/* ── complexity recap grid for the closing beat ────────────────────────────────── */
function ComplexityRecap() {
  const rows: [string, string, string][] = [
    ["walk every node", "O(n)", "var(--diff-med)"],
    ["BST lookup, balanced", "O(log n)", "var(--diff-easy)"],
    ["BST lookup, lopsided", "O(n)", "var(--diff-hard)"],
    ["BST insert / delete", "O(log n) avg", "var(--diff-med)"],
  ];
  const x0 = 372, y0 = 248, rowH = 38, w = 412;
  return (
    <g>
      <NodeGraph nodes={compactOrgNodes(17)} edges={ORG_EDGES} radius={17} />
      {rows.map((r, i) => {
        const y = y0 + i * rowH;
        return (
          <g key={r[0]}>
            <rect x={x0} y={y} width={w} height={rowH - 6} rx={6} fill="var(--bg-card)" stroke="var(--line-faint)" />
            <text x={x0 + 12} y={y + (rowH - 6) / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{r[0]}</text>
            <text x={x0 + w - 12} y={y + (rowH - 6) / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: r[2] }}>{r[1]}</text>
          </g>
        );
      })}
    </g>
  );
}

export const treesLesson: LessonSpec = {
  topicTitle: "trees · hierarchy you can walk",
  canvas: { width: VW, height: VH },
  codeSource: treesPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I have the question",
      visual: <FlatTable />,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "The setup",
        title: "People have managers. Managers have managers.",
        body: <>Open a folder: it holds files and more folders, which hold more folders. Reply to a comment, someone replies to <em>your</em> reply. These don&rsquo;t form a straight line &mdash; they <strong>branch</strong>. A flat list can&rsquo;t say &ldquo;what&rsquo;s inside what.&rdquo;</>,
      }],
      detail: (
        <>
          <p>Open any folder on your computer. It holds files and other folders, and those folders hold more files and folders again &mdash; it keeps nesting downward. Or reply to a comment online: someone replies to your reply, and someone else replies to <em>that</em>. The conversation keeps splitting into deeper threads.</p>
          <p>None of these are a straight line where each thing has exactly one thing after it. They <strong>branch</strong>: one item can have many things hanging off it. A flat list &mdash; one row after another &mdash; can tell you the order of things, but it can&rsquo;t naturally say &ldquo;who reports to whom&rdquo; or &ldquo;what is inside what.&rdquo; We need a shape built for nesting.</p>
        </>
      ),
      codeLabels: [],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "We just said a flat list can't capture nesting — so let's try forcing the hierarchy into one anyway and watch what breaks.",
      actionLabel: "Let the shape lead",
      visual: <FlatTable rowTone={(k) => (k === "bo" ? "active" : subtreeIds("bo").has(k) && k !== "bo" ? "visited" : undefined)} />,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "The obvious thing",
        title: "Flatten it. Watch the shape die.",
        body: <>Store everyone in a list with a &ldquo;manager&rdquo; column. &ldquo;Who does Bo report to?&rdquo; is one quick lookup (blue). But &ldquo;everyone <em>under</em> Bo?&rdquo; forces you to scan every row (orange) to rebuild the branch. The real shape is a hierarchy; a flat table fights it.</>,
      }],
      detail: (
        <>
          <p>The tempting fix: store every person in a plain list, and give each row a column that names their manager. Now &ldquo;who does Bo report to?&rdquo; is one quick lookup &mdash; just read Bo&rsquo;s row and see the manager listed there (the blue row).</p>
          <p>But ask the deeper question &mdash; &ldquo;give me <em>everyone</em> under Bo, all the way down&rdquo; &mdash; and the list fights you. Nobody&rsquo;s row directly lists their reports, so you have to scan every single row checking &ldquo;is this person&rsquo;s manager Bo? is their manager one of Bo&rsquo;s reports?&rdquo; and rebuild the whole branch by hand (the orange rows).</p>
          <p>The shape of the <em>data</em> is a hierarchy &mdash; things nested inside things. The shape of the <em>storage</em> is row after flat row. That mismatch quietly taxes every question you ask. The smarter move is to let the data&rsquo;s real shape lead the storage.</p>
        </>
      ),
      arrows: [{ x1: 230, y1: 150, x2: 280, y2: 234 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The wedge",
      connector: "So let the shape lead: instead of a flat table, give each person a direct link to their reports — then ask for a branch again.",
      actionLabel: "Each node points to its kids",
      visual: (api) => <ClickToBranch api={api} />,
      panels: [
        {
          left: 40, top: 20, width: 600, variant: "main", label: "The wedge",
          title: "Click a person. Their branch lights up.",
          body: <>Each box here is a <strong>node</strong> &mdash; one person. A node remembers only its direct reports; that single link from one node to another is a <strong>pointer</strong>. Click anyone: only their branch lights. You didn&rsquo;t search the company &mdash; you followed pointers down.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> what does &ldquo;a child&rdquo; look like in this structure &mdash; and how is it different from a sibling next to it?</>,
        },
      ],
      detail: (
        <>
          <p>The chart on the canvas is the same org laid out by its real shape. Each box is a <strong>node</strong> &mdash; one person. A node keeps just one piece of wiring: a list of the people directly below it, its <em>direct reports</em>. That single link from one node down to another is called a <strong>pointer</strong> &mdash; literally an arrow that says &ldquo;the thing I&rsquo;m connected to lives over here.&rdquo;</p>
          <p>Click anyone in the middle and watch: only their branch lights up. You didn&rsquo;t scan the whole company row by row like the flat table forced you to. You started at the person you clicked and simply <em>followed their pointers downward</em> &mdash; from them to their reports, to those reports&rsquo; reports, and so on. The structure did the navigating for you.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The wedge question:</strong> what does &ldquo;a child&rdquo; look like in this structure &mdash; and how is it different from a <em>sibling</em>, the node sitting right next to it?
          </div>
        </>
      ),
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      connector: "Now that each node points to its kids, let's name the shape those pointers build — and the rules it has to follow.",
      actionLabel: "What operations?",
      visual: <g><NodeGraph nodes={orgNodes((id) => (id === "ana" ? "active" : undefined))} edges={ORG_EDGES} radius={21} /><Caption y={186} text="root — the one box every path starts from" /></g>,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "The structure",
        title: "Nodes with links to children. No loops.",
        body: <>A <strong>tree</strong> is nodes, like a chain &mdash; but a box can hold <em>several</em> child links, not one &ldquo;next.&rdquo; The one start box is the <strong>root</strong> (lit). No box points back up; that loop would make it a <strong>graph</strong>. A <em>binary</em> tree caps each node at two children.</>,
      }],
      detail: (
        <>
          <p>A <strong>tree</strong> is just nodes connected by pointers &mdash; the same idea as a chain where each box links to the next. The one new freedom: a node can hold <em>several</em> child links, not a single &ldquo;next.&rdquo; That&rsquo;s exactly what lets it branch.</p>
          <p>There&rsquo;s one special starting box called the <strong>root</strong> (the lit node at the top). Every other node is reached by following child pointers <em>downward</em> from it. A key rule: no node ever points back up to a parent. If one did, you could go in circles &mdash; a <strong>cycle</strong> &mdash; and the structure would no longer be a tree; we&rsquo;d call that a <strong>graph</strong> instead.</p>
          <p>A <em>binary</em> tree adds one more limit: each node may have at most two children, usually named <em>left</em> and <em>right</em>. Capping it at two looks like a small restriction, but it&rsquo;s what unlocks the tighter, faster operations we&rsquo;re about to meet.</p>
        </>
      ),
      arrows: [{ x1: 430, y1: 150, x2: 430, y2: 189 }],
      codeLabels: ["node_class"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: "We've got the shape and its rules — now, what can we actually do with a tree? Two answers, and the second is the payoff.",
      actionLabel: "When trees fit",
      visual: (api) => <AutoBSTSearch api={api} />,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "The operations",
        title: "Walk it all, or take the sorted shortcut.",
        body: <>Visiting every box touches all of them: twice the boxes, twice the work (shorthand <strong>O(n)</strong>, n = the count). A <strong>Binary Search Tree</strong> keeps smaller values left, larger right, so a lookup is just a chain of left/right turns &mdash; doubling the tree adds only one more turn. That barely-growing speed gets its own shorthand, <strong>O(log n)</strong>, when the tree is balanced.</>,
      }],
      detail: (
        <>
          <p><strong>Walk the whole thing (traversal).</strong> Sometimes you want to visit every node &mdash; print every file, sum every value. One way (<em>depth-first</em>) dives all the way down a branch before backing up; another (<em>breadth-first</em>) sweeps level by level. Either way you touch each node exactly once, so the cost is written <code>O(n)</code> &mdash; &ldquo;order n,&rdquo; meaning the work grows in lockstep with the number of nodes <code>n</code>. Twice the boxes, twice the work.</p>
          <p><strong>Take the sorted shortcut (Binary Search Tree).</strong> If you store values with a rule &mdash; everything smaller goes <em>left</em>, everything larger goes <em>right</em> &mdash; then finding a value is just a chain of &ldquo;go left or go right?&rdquo; decisions, like the search running on the canvas. You skip whole halves of the tree without ever looking at them.</p>
          <p>The magic: doubling the size of a balanced tree adds only <em>one more</em> turn to the walk down. That barely-growing speed gets its own shorthand, <code>O(log n)</code> &mdash; cost that creeps up by a single step each time the data doubles. (When a tree grows lopsided, balance-keeping variants like AVL or red-black trees quietly tidy it after each change so the shortcut stays fast.)</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The catch:</strong> a <em>hash map</em> (a lookup table that jumps straight to a value in one step, <code>O(1)</code>) is even faster for plain &ldquo;is X here?&rdquo; questions &mdash; but it keeps nothing in order. We reach for a BST only when we also need <em>ordering</em>: range queries, next-larger lookups, sorted listing.
          </div>
        </>
      ),
      arrows: [{ x1: 430, y1: 150, x2: 430, y2: 186 }],
      codeLabels: ["bst_start", "bst_eq", "bst_left", "bst_right"],
      interaction: "playback",
    },
    {
      id: "fits",
      label: "When it fits",
      connector: "Now that you know the two moves — walk it all, or take the sorted shortcut — here's how to recognize a problem that wants them.",
      actionLabel: "Name them",
      visual: <FitsChips />,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "When it fits",
        title: "Hierarchy, and sorted lookups with ranges.",
        body: <>Reach for a <strong>tree</strong> whenever data is genuinely nested (below). Reach for a <strong>BST</strong> (or a balanced cousin like AVL / red-black) when you need fast lookups <em>and</em> sorted order &mdash; a <strong>hash map</strong> (a lookup table) jumps straight to one value in a single step no matter how big it gets &mdash; that always-one-step speed is written <strong>O(1)</strong> &mdash; but it keeps nothing in order. Databases use B-trees: a wide-branching BST.</>,
      }],
      detail: (
        <>
          <p>Reach for a <strong>tree</strong> any time the data is genuinely hierarchical &mdash; things nested inside things. The chips on the canvas show the usual suspects: file systems, the DOM (the nested boxes that make up a web page), scene graphs in games, syntax trees in parsers, decision trees in machine learning, category nesting in an online store.</p>
          <p>Reach for a <strong>BST</strong> (or one of its balanced cousins, AVL or red-black trees) when you need fast lookups <em>and</em> the data kept in sorted order &mdash; for range queries (&ldquo;everything between 30 and 60&rdquo;), next-larger lookups, or listing things in order. If you only ever ask &ldquo;is X here?&rdquo; and never care about order, a <em>hash map</em> is the better tool: it jumps straight to one value in a single step no matter how big it grows, a speed written <code>O(1)</code> &mdash; but it keeps nothing sorted.</p>
          <p>Real databases lean on this: their indexes are <em>B-trees</em>, a wide-branching cousin of the BST that stores many keys per node so the tree stays short even with millions of rows.</p>
        </>
      ),
      codeLabels: ["bst_insert_left", "bst_insert_right"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "You've built it, learned its two operations, and seen where it fits — so give the whole shape its name.",
      visual: <ComplexityRecap />,
      panels: [{
        left: 40, top: 20, width: 600, variant: "main", label: "The pattern",
        title: "Tree.",
        body: <>That&rsquo;s the name. Variants you&rsquo;ll meet: <em>heaps</em> (a tree that always keeps the biggest &mdash; or smallest &mdash; item ready at the top), <em>tries</em> (a tree of word-prefix letters), <em>B-trees</em> (the engine behind database indexes). All share one skeleton: nodes holding child links, rooted at the top.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: <strong>tree</strong>. The recap grid on the canvas is the cost story in one glance &mdash; walking every node is <code>O(n)</code>, a balanced BST lookup is fast at <code>O(log n)</code>, and a lopsided one slumps back to <code>O(n)</code>, which is exactly why balanced variants exist.</p>
          <p>You&rsquo;ll meet a whole family later, all built on the same skeleton &mdash; nodes holding child links, rooted at the top:</p>
          <ul>
            <li><em>binary trees</em> and <em>binary search trees</em> &mdash; the two-children versions you just saw.</li>
            <li><em>heaps</em> &mdash; a tree that always keeps the biggest (or smallest) item ready at the very top, perfect for a priority queue.</li>
            <li><em>tries</em> &mdash; a tree of word-prefix letters, used for autocomplete and spell-check.</li>
            <li><em>B-trees</em> &mdash; the wide-branching engine behind database indexes.</li>
          </ul>
          <p>Open the Code panel to see two tiny Python sketches: a general tree node, and a binary search tree.</p>
        </>
      ),
      codeLabels: ["node_class", "bst_class"],
    },
  ],
};
