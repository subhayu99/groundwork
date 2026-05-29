"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrayViz } from "@/shared/viz/ArrayViz";
import { phasedVisualizer } from "@/shared/viz/phasedVisualizer";

/* @sync labels — resolved against linked-lists/algorithm.py (single source of truth) */
const LINE_INSERT_RELINK = ["insert_new", "insert_relink"]; // new_node = Node(..., next=node.next); node.next = new_node
const LINE_REMOVE_RELINK = ["remove_relink"]; // node.next = removed.next

export const LinkedListsVisualizer = phasedVisualizer([
  { until: 2, render: () => <ArrayShiftViz /> },
  { until: 3, render: (p) => <LinkedListViz onInteraction={p.onWedgeInteraction} onActiveLine={p.onActiveLine} /> },
  { until: 5, render: (p) => <LinkedListViz onInteraction={undefined} onActiveLine={p.onActiveLine} expanded /> },
  { render: () => <SummaryViz /> },
]);

interface NodeItem { id: number; value: number }

/* Step 1-2 — array insertion forces shifts */
function ArrayShiftViz() {
  const [arr, setArr] = useState<number[]>([1, 2, 4, 5, 7, 8, 10]);
  const [shifted, setShifted] = useState<number[]>([]);
  const [entering, setEntering] = useState<number[]>([]);
  const [shifts, setShifts] = useState(0);

  const insertAt2 = () => {
    const insertAt = 2;
    const newVal = 3;
    if (arr.length > 12) return;
    const shiftIdxs = arr.slice(insertAt).map((_, i) => i + insertAt + 1);
    setShifted(shiftIdxs);
    setEntering([insertAt]);
    setArr((a) => [...a.slice(0, insertAt), newVal, ...a.slice(insertAt)]);
    setShifts((s) => s + arr.length - insertAt);
    setTimeout(() => {
      setShifted([]);
      setEntering([]);
    }, 720);
  };

  const reset = () => {
    setArr([1, 2, 4, 5, 7, 8, 10]);
    setShifted([]);
    setEntering([]);
    setShifts(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        array · insert in the middle
      </div>

      <div className="relative pt-6">
        <ArrayViz values={arr} highlightedIndices={shifted} enteringIndices={entering} />
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          total shifts paid: <span className="text-[var(--diff-med)]">{shifts}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          <button onClick={insertAt2} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--diff-med)_22%,transparent)]">
            insert 3 at index 2 · O(n)
          </button>
        </div>
        <p className="font-mono text-[10px] text-[var(--text-faint)] mt-2">
          everything from index 2 onward shifts right
        </p>
      </div>
    </div>
  );
}

/* Steps 3-5 — interactive linked list */
function LinkedListViz({ onInteraction, onActiveLine, expanded }: { onInteraction?: () => void; onActiveLine?: (lines: (number | string)[]) => void; expanded?: boolean }) {
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 1, value: 1 },
    { id: 2, value: 2 },
    { id: 4, value: 4 },
    { id: 5, value: 5 },
    { id: 7, value: 7 },
  ]);
  const [highlightedIds, setHighlightedIds] = useState<number[]>([]);
  const [shifts, setShifts] = useState(0);
  const [pointerEdits, setPointerEdits] = useState(0);
  const [lastOp, setLastOp] = useState<string | null>(null);

  const insertAfter = (afterId: number, value: number) => {
    const newId = Date.now() + Math.random();
    const afterValue = nodes.find((n) => n.id === afterId)?.value ?? value;
    setHighlightedIds([afterId, newId]);
    setNodes((ns) => {
      const idx = ns.findIndex((n) => n.id === afterId);
      const next = [...ns];
      next.splice(idx + 1, 0, { id: newId, value });
      return next;
    });
    setPointerEdits((p) => p + 2);
    setLastOp(`insert ${value} after node(${afterValue}) · 2 pointer swaps`);
    onInteraction?.();
    onActiveLine?.(LINE_INSERT_RELINK);
    setTimeout(() => setHighlightedIds([]), 720);
  };

  const removeNode = (id: number) => {
    const removedValue = nodes.find((n) => n.id === id)?.value;
    setHighlightedIds([id]);
    setPointerEdits((p) => p + 1);
    setLastOp(`remove node(${removedValue}) · 1 pointer swap`);
    onInteraction?.();
    onActiveLine?.(LINE_REMOVE_RELINK);
    setTimeout(() => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setHighlightedIds([]);
    }, 480);
  };

  const reset = () => {
    setNodes([
      { id: 1, value: 1 },
      { id: 2, value: 2 },
      { id: 4, value: 4 },
      { id: 5, value: 5 },
      { id: 7, value: 7 },
    ]);
    setShifts(0);
    setPointerEdits(0);
    setHighlightedIds([]);
    setLastOp(null);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        linked list · click an action below
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-center pt-6 max-w-[720px]">
        <span className="font-mono text-[10px] text-[var(--text-faint)] mr-1">head →</span>
        <AnimatePresence initial={false}>
          {nodes.map((n, i) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: highlightedIds.length > 0 && !highlightedIds.includes(n.id) ? 0.55 : 1,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.6, y: -10 }}
              transition={{ duration: 0.28 }}
              style={{
                borderColor: highlightedIds.includes(n.id) ? "var(--accent-sky)" : "var(--line)",
                backgroundColor: highlightedIds.includes(n.id)
                  ? "color-mix(in oklab, var(--accent-sky) 16%, var(--bg-card))"
                  : "var(--bg-card)",
              }}
              className="flex items-center gap-1 transition-[background-color,border-color] duration-200"
            >
              <div className="rounded-lg border-2 px-3 h-12 flex items-center font-mono text-base text-[var(--text)]" style={{ borderColor: "inherit", background: "inherit" }}>
                {n.value}
              </div>
              {i < nodes.length - 1 && (
                <span className="font-mono text-[var(--text-faint)]">→</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {nodes.length > 0 && <span className="font-mono text-[10px] text-[var(--text-faint)] ml-1">→ ∅</span>}
      </div>

      <div className="flex flex-col items-center gap-4 mt-2 max-w-[720px] w-full">
        <div className="font-mono text-xs text-[var(--text-muted)] h-4">
          {lastOp ?? "—"}
        </div>
        <div className="flex items-center gap-8 font-mono">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Pointer edits</span>
            <span className="text-2xl" style={{ color: "var(--diff-easy)" }}>{pointerEdits}</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Array shifts saved</span>
            <span className="text-2xl text-[var(--text-muted)]">≫</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
          {nodes.length > 0 && (
            <>
              <button onClick={() => insertAfter(nodes[Math.min(1, nodes.length - 1)].id, 3)} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
                insert 3 after {nodes[Math.min(1, nodes.length - 1)].value}
              </button>
              <button onClick={() => insertAfter(nodes[Math.min(3, nodes.length - 1)].id, 6)} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
                insert 6 after {nodes[Math.min(3, nodes.length - 1)].value}
              </button>
              <button onClick={() => removeNode(nodes[Math.min(2, nodes.length - 1)].id)} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-hard)_50%,transparent)] text-[var(--diff-hard)] bg-[color-mix(in_oklab,var(--diff-hard)_12%,transparent)]">
                remove the 3rd node
              </button>
            </>
          )}
        </div>
        {!expanded && (
          <p className="font-mono text-[10px] text-[var(--text-faint)] mt-2 max-w-md text-center">
            insertion and removal are pointer swaps — the cards in front and behind don&rsquo;t care
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryViz() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        linked list · position is not address
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] text-[var(--text-faint)] mr-1">head →</span>
        {[3, 1, 4, 1, 5].map((v, i, arr) => (
          <div key={i} className="flex items-center gap-1">
            <div className="rounded-lg border-2 border-[var(--line)] bg-[var(--bg-card)] px-3 h-12 flex items-center font-mono text-base text-[var(--text)]">{v}</div>
            {i < arr.length - 1 && <span className="font-mono text-[var(--text-faint)]">→</span>}
          </div>
        ))}
        <span className="font-mono text-[10px] text-[var(--text-faint)] ml-1">→ ∅</span>
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)] grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>insert after node</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>remove next node</div><div className="text-[var(--diff-easy)]">O(1)</div>
        <div>access by index</div><div className="text-[var(--diff-hard)]">O(n)</div>
        <div>find a value</div><div className="text-[var(--diff-hard)]">O(n)</div>
        <div>memory locality</div><div className="text-[var(--diff-med)]">poor</div>
      </div>
    </div>
  );
}
