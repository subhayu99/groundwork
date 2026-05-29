"use client";

import { useMemo, useState } from "react";
import { TreeViz, TreeVizNode, TreeVizEdge } from "@/shared/viz/TreeViz";

interface TNode {
  id: string;
  label: string;
  children: TNode[];
}

const ORG_CHART: TNode = {
  id: "ceo",
  label: "Ana",
  children: [
    {
      id: "eng",
      label: "Bo",
      children: [
        { id: "fe", label: "Cara", children: [{ id: "u1", label: "Dax", children: [] }] },
        { id: "be", label: "Eli", children: [
          { id: "u2", label: "Fawn", children: [] },
          { id: "u3", label: "Grace", children: [] },
        ] },
      ],
    },
    {
      id: "ops",
      label: "Harper",
      children: [
        { id: "sup", label: "Ivy", children: [] },
        { id: "fin", label: "June", children: [] },
      ],
    },
  ],
};

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
}

export function TreesVisualizer({ step, onWedgeInteraction }: VisualizerProps) {
  if (step <= 2) return <FlatListViz />;
  if (step === 3) return <ClickableTreeViz onInteraction={onWedgeInteraction} />;
  if (step >= 4 && step <= 5) return <BSTViz />;
  return <SummaryTreeViz />;
}

/* Step 1-2 — flat list view (loses hierarchy) */
function FlatListViz() {
  const flat = useMemo(() => {
    const out: { name: string; manager: string | null }[] = [];
    const walk = (n: TNode, mgr: string | null) => {
      out.push({ name: n.label, manager: mgr });
      for (const c of n.children) walk(c, n.label);
    };
    walk(ORG_CHART, null);
    return out;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 max-w-[420px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        flat table · who reports to whom
      </div>
      <div className="font-mono text-xs w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] overflow-hidden">
        <div className="grid grid-cols-2 px-3 py-1.5 border-b border-[var(--line)] text-[var(--text-faint)] uppercase tracking-wider text-[10px]">
          <span>name</span>
          <span>manager</span>
        </div>
        {flat.map((r, i) => (
          <div key={i} className="grid grid-cols-2 px-3 py-1.5 border-t border-[var(--line-faint)]">
            <span className="text-[var(--text)]">{r.name}</span>
            <span className="text-[var(--text-muted)]">{r.manager ?? "—"}</span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-[var(--text-faint)] text-center max-w-[320px]">
        a list captures every parent-child edge, but to find &ldquo;everyone reporting under Bo&rdquo; you
        have to walk the whole table
      </p>
    </div>
  );
}

/* Step 3 — clickable tree: highlight subtree */
function ClickableTreeViz({ onInteraction }: { onInteraction?: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const findNode = (root: TNode, id: string): TNode | null => {
    if (root.id === id) return root;
    for (const c of root.children) {
      const f = findNode(c, id);
      if (f) return f;
    }
    return null;
  };

  const activeNode = activeId ? findNode(ORG_CHART, activeId) : null;

  const subtreeIds = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const out = new Set<string>();
    const walk = (n: TNode) => {
      out.add(n.id);
      for (const c of n.children) walk(c);
    };
    walk(activeNode);
    return out;
  }, [activeNode]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click any person · see only their subtree
      </div>
      <TreeSVG
        root={ORG_CHART}
        highlightedIds={subtreeIds}
        onClickNode={(id) => {
          setActiveId(id === activeId ? null : id);
          onInteraction?.();
        }}
      />
      <p className="font-mono text-[10px] text-[var(--text-faint)] max-w-[420px] text-center">
        {activeNode
          ? `subtree under ${activeNode.label} has ${subtreeIds.size} ${subtreeIds.size === 1 ? "person" : "people"} · one pointer-walk from the clicked node`
          : "click anyone — the rest of the org doesn't get touched"}
      </p>
    </div>
  );
}

/* Step 4-5 — BST search animation */
const BST_VALUES = [50, 30, 70, 20, 40, 60, 80, 10, 35, 65];

interface BSTNode {
  value: number;
  left?: BSTNode;
  right?: BSTNode;
}
function bstInsert(root: BSTNode | undefined, v: number): BSTNode {
  if (!root) return { value: v };
  if (v < root.value) root.left = bstInsert(root.left, v);
  else if (v > root.value) root.right = bstInsert(root.right, v);
  return root;
}
const BST_ROOT: BSTNode = (() => {
  let r: BSTNode | undefined = undefined;
  for (const v of BST_VALUES) r = bstInsert(r, v);
  return r!;
})();

function BSTViz() {
  const [target, setTarget] = useState(35);
  const path = useMemo(() => {
    const out: number[] = [];
    let cur: BSTNode | undefined = BST_ROOT;
    while (cur) {
      out.push(cur.value);
      if (target === cur.value) break;
      cur = target < cur.value ? cur.left : cur.right;
    }
    return out;
  }, [target]);

  const toTreeNode = (b: BSTNode): TNode => ({
    id: String(b.value),
    label: String(b.value),
    children: [b.left, b.right].filter(Boolean).map((c) => toTreeNode(c!)),
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        binary search tree · find {target}
      </div>
      <TreeSVG
        root={toTreeNode(BST_ROOT)}
        highlightedIds={new Set(path.map(String))}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          path: <span className="text-[var(--accent)]">{path.join(" → ")}</span>
          <span className="ml-3 text-[var(--diff-easy)]">{path.length} comparisons</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[320px]">
          {BST_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setTarget(v)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs border ${
                target === v
                  ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                  : "border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTreeViz() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        tree · nodes pointing at child nodes
      </div>
      <TreeSVG root={ORG_CHART} />
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>traverse all</div><div className="text-[var(--diff-med)]">O(n)</div>
        <div>BST lookup (balanced)</div><div className="text-[var(--diff-easy)]">O(log n)</div>
        <div>BST lookup (worst)</div><div className="text-[var(--diff-hard)]">O(n)</div>
        <div>insert / delete</div><div className="text-[var(--diff-med)]">O(log n) avg</div>
      </div>
    </div>
  );
}

/* ===== Reusable tree SVG layout ===== */

interface LaidOutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  children: LaidOutNode[];
}

function layout(root: TNode, hSpacing = 60, vSpacing = 70): { node: LaidOutNode; width: number; height: number } {
  let leafIndex = 0;
  const measureLeaves = (n: TNode): number => (n.children.length === 0 ? 1 : n.children.reduce((s, c) => s + measureLeaves(c), 0));
  const depths: number[] = [];
  const assign = (n: TNode, depth: number): LaidOutNode => {
    depths[depth] = depths[depth] === undefined ? depth : Math.max(depths[depth], depth);
    if (n.children.length === 0) {
      const x = leafIndex * hSpacing;
      leafIndex += 1;
      return { id: n.id, label: n.label, x, y: depth * vSpacing, children: [] };
    }
    const kids = n.children.map((c) => assign(c, depth + 1));
    const x = (kids[0].x + kids[kids.length - 1].x) / 2;
    return { id: n.id, label: n.label, x, y: depth * vSpacing, children: kids };
  };
  const out = assign(root, 0);
  const width = Math.max(measureLeaves(root) * hSpacing, hSpacing);
  let maxDepth = 0;
  const walkDepth = (n: TNode, d: number) => {
    maxDepth = Math.max(maxDepth, d);
    for (const c of n.children) walkDepth(c, d + 1);
  };
  walkDepth(root, 0);
  const height = (maxDepth + 1) * vSpacing;
  return { node: out, width, height };
}

function collectEdges(n: LaidOutNode): { from: LaidOutNode; to: LaidOutNode }[] {
  const out: { from: LaidOutNode; to: LaidOutNode }[] = [];
  for (const c of n.children) {
    out.push({ from: n, to: c });
    out.push(...collectEdges(c));
  }
  return out;
}

function collectNodes(n: LaidOutNode): LaidOutNode[] {
  return [n, ...n.children.flatMap(collectNodes)];
}

function TreeSVG({
  root,
  highlightedIds,
  onClickNode,
}: {
  root: TNode;
  highlightedIds?: Set<string>;
  onClickNode?: (id: string) => void;
}) {
  const NODE_R = 22;
  const PAD = 30;
  const { node: laid, width, height } = layout(root);
  const allNodes = collectNodes(laid);
  const edges = collectEdges(laid);

  const hasHighlight = !!highlightedIds && highlightedIds.size > 0;

  const vizNodes: TreeVizNode[] = allNodes.map((n) => {
    const isHi = highlightedIds?.has(n.id);
    return {
      id: n.id,
      x: n.x + PAD,
      y: n.y + PAD,
      label: n.label,
      tone: isHi ? "active" : hasHighlight ? "muted" : "idle",
    };
  });

  const vizEdges: TreeVizEdge[] = edges.map((e) => {
    const isHi = highlightedIds?.has(e.from.id) && highlightedIds?.has(e.to.id);
    return { from: e.from.id, to: e.to.id, tone: isHi ? "active" : undefined };
  });

  return (
    <div className="relative" style={{ width: width + PAD * 2, height: height + PAD * 2 }}>
      <TreeViz
        nodes={vizNodes}
        edges={vizEdges}
        width={width + PAD * 2}
        height={height + PAD * 2}
        radius={NODE_R}
      />
      {onClickNode && (
        <svg
          width={width + PAD * 2}
          height={height + PAD * 2}
          className="absolute inset-0 overflow-visible"
        >
          {vizNodes.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={NODE_R}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => onClickNode(n.id)}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
