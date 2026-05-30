"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { NodeGraph, GNode, GEdge } from "@/shared/lesson/canvas";
import treesPy from "./algorithm.py";

const VW = 860, VH = 470;

/* ── Org-chart tree, positioned by depth/level in canvas space ─────────────────
 * Ana is the root; everyone below is a direct report of the node above them. */
interface Person { id: string; label: string; x: number; y: number; parent?: string; }
const ORG: Person[] = [
  { id: "ana", label: "Ana", x: 430, y: 96 },
  { id: "bo", label: "Bo", x: 250, y: 188, parent: "ana" },
  { id: "harper", label: "Harper", x: 640, y: 188, parent: "ana" },
  { id: "cara", label: "Cara", x: 150, y: 286, parent: "bo" },
  { id: "eli", label: "Eli", x: 340, y: 286, parent: "bo" },
  { id: "ivy", label: "Ivy", x: 570, y: 286, parent: "harper" },
  { id: "june", label: "June", x: 710, y: 286, parent: "harper" },
  { id: "dax", label: "Dax", x: 150, y: 384, parent: "cara" },
  { id: "fawn", label: "Fawn", x: 290, y: 384, parent: "eli" },
  { id: "grace", label: "Grace", x: 400, y: 384, parent: "eli" },
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

/* ── BST, positioned by depth/level — smaller left, larger right ──────────────── */
interface BstPos { v: number; x: number; y: number; parent?: number; }
const BST: BstPos[] = [
  { v: 50, x: 430, y: 150 },
  { v: 30, x: 250, y: 232, parent: 50 },
  { v: 70, x: 610, y: 232, parent: 50 },
  { v: 20, x: 160, y: 314, parent: 30 },
  { v: 40, x: 340, y: 314, parent: 30 },
  { v: 60, x: 520, y: 314, parent: 70 },
  { v: 80, x: 700, y: 314, parent: 70 },
  { v: 10, x: 110, y: 396, parent: 20 },
  { v: 35, x: 290, y: 396, parent: 40 },
  { v: 65, x: 470, y: 396, parent: 60 },
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
  const colW = 150, x0 = VW / 2 - colW, rowH = 26, y0 = 84, headH = 22;
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
      <Caption y={62} text={activePerson ? `${activePerson.label}'s branch: ${count} ${count === 1 ? "person" : "people"} lit — one walk down the links` : "click any person to light up their branch"} />
      <ReplayButton y={430} label="↺ reset" onClick={() => { setActive(null); api.onActiveLine([]); }} />
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
    }, 1000);
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
        y={120}
        tone={s.done ? "var(--diff-easy)" : "var(--text-faint)"}
        text={
          s.done
            ? `found 35 in ${result.path.length} steps — never touched the other half`
            : cur === undefined
              ? "starting at the root…"
              : `at ${cur}: 35 ${35 < cur ? "< it → go left" : 35 > cur ? "> it → go right" : "= it → match"}`
        }
      />
      <ReplayButton y={430} label="↺ replay" onClick={() => setS(init())} />
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
  let tx = 70;
  const treeRow = treeChips.map((t) => { const w = t.length * 6.4 + 18; const el = chip(t, tx, 250, false); tx += w + 8; return el; });
  let bx = 130;
  const bstRow = bstChips.map((t) => { const w = t.length * 6.4 + 18; const el = chip(t, bx, 296, true); bx += w + 8; return el; });
  return (
    <g>
      <NodeGraph nodes={orgNodes(() => undefined)} edges={ORG_EDGES} radius={18} />
      <text x={70} y={244} className="font-mono select-none" style={{ fontSize: 10, fill: "var(--accent-ink)" }}>TREE — any nested data:</text>
      {treeRow}
      <text x={70} y={290} className="font-mono select-none" style={{ fontSize: 10, fill: "var(--diff-easy)" }}>BST — ordered lookups:</text>
      {bstRow}
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
  const x0 = 250, y0 = 248, rowH = 30, w = 360;
  return (
    <g>
      <NodeGraph nodes={orgNodes(() => undefined)} edges={ORG_EDGES} radius={14} />
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
      visual: <FlatTable />,
      panels: [{
        left: 40, top: 24, width: 250, variant: "main", label: "The setup",
        title: "People have managers. Managers have managers.",
        body: <>Open a folder: it holds files and more folders, which hold more folders. Reply to a comment, someone replies to <em>your</em> reply. These don&rsquo;t form a straight line &mdash; they <strong>branch</strong>. A flat list can&rsquo;t say &ldquo;what&rsquo;s inside what.&rdquo;</>,
      }],
      codeLabels: [],
    },
    {
      id: "obvious",
      visual: <FlatTable rowTone={(k) => (k === "bo" ? "active" : subtreeIds("bo").has(k) && k !== "bo" ? "visited" : undefined)} />,
      panels: [{
        left: 40, top: 24, width: 250, variant: "main", label: "The obvious thing",
        title: "Flatten it. Watch the shape die.",
        body: <>Store everyone in a list with a &ldquo;manager&rdquo; column. &ldquo;Who does Bo report to?&rdquo; is one quick lookup (blue). But &ldquo;everyone <em>under</em> Bo?&rdquo; forces you to scan every row (orange) to rebuild the branch. The real shape is a hierarchy; a flat table fights it.</>,
      }],
      arrows: [{ x1: 280, y1: 200, x2: 360, y2: 200 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      visual: (api) => <ClickToBranch api={api} />,
      panels: [
        {
          left: 596, top: 30, width: 244, variant: "main", label: "The wedge",
          title: "Click a person. Their branch lights up.",
          body: <>Each box here is a <strong>node</strong> &mdash; one person. A node remembers only its direct reports; that single link from one node to another is a <strong>pointer</strong>. Click anyone: only their branch lights. You didn&rsquo;t search the company &mdash; you followed pointers down.</>,
        },
        {
          left: 596, top: 232, width: 244, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> what does &ldquo;a child&rdquo; look like in this structure &mdash; and how is it different from a sibling next to it?</>,
        },
      ],
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "structure",
      visual: <g><NodeGraph nodes={orgNodes((id) => (id === "ana" ? "active" : undefined))} edges={ORG_EDGES} radius={21} /><Caption y={62} text="root — the one box every path starts from" /></g>,
      panels: [{
        left: 596, top: 30, width: 244, variant: "main", label: "The structure",
        title: "Nodes with links to children. No loops.",
        body: <>A <strong>tree</strong> is just nodes &mdash; like a chain where each box held one &ldquo;next,&rdquo; but now a box can hold <em>several</em> child links. One start box is the <strong>root</strong> (lit). No box ever points back up; that loop-back would make it a <strong>graph</strong>. A <em>binary</em> tree caps each node at two children: left and right.</>,
      }],
      arrows: [{ x1: 596, y1: 110, x2: 458, y2: 96 }],
      codeLabels: ["node_class"],
    },
    {
      id: "operations",
      visual: (api) => <AutoBSTSearch api={api} />,
      panels: [{
        left: 40, top: 24, width: 250, variant: "main", label: "The operations",
        title: "Walk it all, or take the sorted shortcut.",
        body: <>Visiting every node costs <strong>O(n)</strong> &mdash; &ldquo;n&rdquo; is the node count, so 10&times; the nodes is 10&times; the work. A <strong>Binary Search Tree</strong> keeps smaller values left, larger right, so a lookup is a chain of left/right turns: <strong>O(log n)</strong> &mdash; doubling the tree adds just one step &mdash; if it&rsquo;s balanced (no branch much longer than the others).</>,
      }],
      arrows: [{ x1: 290, y1: 150, x2: 408, y2: 150 }],
      codeLabels: ["bst_start", "bst_eq", "bst_left", "bst_right"],
      interaction: "playback",
    },
    {
      id: "fits",
      visual: <FitsChips />,
      panels: [{
        left: 250, top: 28, width: 360, variant: "main", label: "When it fits",
        title: "Hierarchy, and sorted lookups with ranges.",
        body: <>Reach for a <strong>tree</strong> whenever data is genuinely nested (below). Reach for a <strong>BST</strong> (or a balanced cousin like AVL / red-black) when you need fast lookups <em>and</em> sorted order &mdash; a <strong>hash map</strong> (a lookup table) finds one value instantly, <strong>O(1)</strong>, but keeps nothing in order. Databases use B-trees: a wide-branching BST.</>,
      }],
      codeLabels: ["bst_insert_left", "bst_insert_right"],
    },
    {
      id: "name",
      visual: <ComplexityRecap />,
      panels: [{
        left: 40, top: 24, width: 200, variant: "main", label: "The pattern",
        title: "Tree.",
        body: <>That&rsquo;s the name. Variants you&rsquo;ll meet: <em>heaps</em> (a tree that always keeps the biggest &mdash; or smallest &mdash; item ready at the top), <em>tries</em> (a tree of word-prefix letters), <em>B-trees</em> (the engine behind database indexes). All share one skeleton: nodes holding child links, rooted at the top.</>,
      }],
      codeLabels: ["node_class", "bst_class"],
    },
  ],
};
