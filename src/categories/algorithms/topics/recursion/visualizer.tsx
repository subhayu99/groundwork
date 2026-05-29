"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { StackPanel } from "@/shared/viz/StackPanel";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { AnimatedAlgorithmView, type AlgoFrame } from "@/shared/viz/AnimatedAlgorithmView";
import { phasedVisualizer } from "@/shared/viz/phasedVisualizer";

type Node =
  | { type: "file"; name: string; size: number }
  | { type: "folder"; name: string; children: Node[] };

const TREE: Node = {
  type: "folder",
  name: "Downloads",
  children: [
    { type: "file", name: "resume.pdf", size: 2 },
    {
      type: "folder",
      name: "photos",
      children: [
        { type: "file", name: "beach.jpg", size: 4 },
        { type: "file", name: "party.jpg", size: 3 },
      ],
    },
    {
      type: "folder",
      name: "projects",
      children: [
        { type: "file", name: "notes.txt", size: 1 },
        {
          type: "folder",
          name: "code",
          children: [{ type: "file", name: "app.zip", size: 8 }],
        },
      ],
    },
    { type: "file", name: "scratch.txt", size: 1 },
  ],
};

// Build a flat list of (node, depth, path) for rendering, in DFS order.
type FlatNode = { node: Node; depth: number; path: string };
function flatten(node: Node, depth = 0, path = ""): FlatNode[] {
  const me: FlatNode = { node, depth, path: path ? `${path}/${node.name}` : node.name };
  if (node.type === "file") return [me];
  return [me, ...node.children.flatMap((c) => flatten(c, depth + 1, me.path))];
}

const FLAT = flatten(TREE);

function totalSize(node: Node): number {
  if (node.type === "file") return node.size;
  return node.children.reduce((sum, c) => sum + totalSize(c), 0);
}

const TOTAL = totalSize(TREE);

/* @sync labels — resolved against algorithm.py (single source of truth) */
const LINE_BASE_CASE = "base_case"; // `if node["type"] == "file"` — we reached a leaf file
const LINE_BASE_CASE_RETURN = "base_return"; // `return node["size"]` — a file returns its own size
const LINE_RECURSIVE_CALL = "recursive_call"; // `folder_size(child)` — descend into a child
const LINE_AGGREGATE_SUM = "aggregate"; // `sum(...)` — combine children's sizes
const LINE_FOLDER_RETURN = "folder_return"; // returning a folder's summed total up the stack
const LINE_SIG = "sig"; // function signature — shown on the initial/reset frame

export const RecursionVisualizer = phasedVisualizer([
  { until: 2, render: () => <NaiveCountViz /> },
  { until: 3, render: (p) => <ManualExploreViz onInteraction={p.onWedgeInteraction} onActiveLine={p.onActiveLine} /> },
  { render: (p) => <RecursiveComputeViz onActiveLine={p.onActiveLine} /> },
]);

function NodeRow({
  flat,
  state,
  computed,
}: {
  flat: FlatNode;
  state: "idle" | "active" | "done";
  computed: number | null;
}) {
  const { node, depth } = flat;
  const isFile = node.type === "file";
  const bg =
    state === "active"
      ? "color-mix(in oklab, var(--accent-sky) 22%, var(--bg-card))"
      : state === "done"
      ? "color-mix(in oklab, var(--diff-easy) 14%, var(--bg-card))"
      : "var(--bg-card)";
  const border =
    state === "active"
      ? "var(--accent-line)"
      : state === "done"
      ? "var(--diff-easy)"
      : "var(--line)";
  return (
    <motion.div
      animate={{ backgroundColor: bg, borderColor: border }}
      transition={{ duration: 0.18 }}
      className="rounded-md border px-3 py-1.5 font-mono text-xs flex items-center justify-between"
      style={{ marginLeft: depth * 18, minWidth: 260 - depth * 18 }}
    >
      <span className="flex items-center gap-2">
        <span className="text-[var(--text-faint)]">{isFile ? "·" : "▸"}</span>
        <span className="text-[var(--text)]">{node.name}</span>
        {isFile && (
          <span className="text-[var(--text-faint)] text-[10px]">{node.size}MB</span>
        )}
      </span>
      <span
        className="font-mono text-[11px]"
        style={{ color: computed === null ? "var(--text-faint)" : "var(--diff-easy)" }}
      >
        {computed === null ? "?" : `${computed}MB`}
      </span>
    </motion.div>
  );
}

/* Steps 1-2 — naive count, scanning files only */
function NaiveCountViz() {
  const [scanIdx, setScanIdx] = useState(-1);
  const [running, setRunning] = useState(0);
  const idxRef = useRef(-1);
  const sumRef = useRef(0);

  const fileIndices = useMemo(() => {
    const out: number[] = [];
    FLAT.forEach((f, i) => { if (f.node.type === "file") out.push(i); });
    return out;
  }, []);

  const done = scanIdx >= 0 && idxRef.current >= fileIndices.length - 1;

  const pb = usePlayback({
    onTick: () => {
      const next = idxRef.current + 1;
      if (next >= fileIndices.length) {
        pb.stop();
        return;
      }
      idxRef.current = next;
      setScanIdx(fileIndices[next]);
      const node = FLAT[fileIndices[next]].node;
      if (node.type === "file") {
        sumRef.current += node.size;
        setRunning(sumRef.current);
      }
    },
    isDone: () => scanIdx >= 0 && idxRef.current >= fileIndices.length - 1,
    intervalMs: 360,
  });

  const reset = () => {
    pb.stop();
    idxRef.current = -1;
    sumRef.current = 0;
    setScanIdx(-1);
    setRunning(0);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        files only · keep digging for the next one
      </div>
      <div className="flex flex-col gap-1 w-[300px]">
        {FLAT.map((f, i) => (
          <NodeRow
            key={f.path}
            flat={f}
            state={
              f.node.type === "folder"
                ? "idle"
                : i === scanIdx
                ? "active"
                : i < scanIdx
                ? "done"
                : "idle"
            }
            computed={
              f.node.type === "file" && i <= scanIdx ? f.node.size : null
            }
          />
        ))}
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        running total: <span className="text-[var(--diff-easy)]">{running}MB</span>
        {done && <span className="text-[var(--diff-easy)] ml-3">✓ {TOTAL}MB</span>}
      </div>
      <PlaybackControls
        playing={pb.playing}
        onToggle={pb.toggle}
        onReset={reset}
        onStep={pb.stepOnce}
        atEnd={done}
        playLabel="Play through"
      />
    </div>
  );
}

/* Step 3 — manually click each folder to "ask" for its size */
function ManualExploreViz({
  onInteraction,
  onActiveLine,
}: {
  onInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}) {
  const [computed, setComputed] = useState<Record<string, number>>({});

  const askFolder = (path: string) => {
    onInteraction?.();
    const fl = FLAT.find((f) => f.path === path);
    if (!fl) return;
    const size = totalSize(fl.node);
    // Asking a folder recurses into its children and sums their sizes.
    onActiveLine?.([LINE_RECURSIVE_CALL, LINE_AGGREGATE_SUM]);
    setComputed((cur) => ({ ...cur, [path]: size }));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        click any folder · same question, smaller piece
      </div>
      <div className="flex flex-col gap-1 w-[320px]">
        {FLAT.map((f) => {
          const c = computed[f.path];
          const value =
            f.node.type === "file"
              ? f.node.size
              : typeof c === "number"
              ? c
              : null;
          return (
            <div
              key={f.path}
              className="flex items-center justify-between gap-2"
            >
              <NodeRow flat={f} state={value !== null ? "done" : "idle"} computed={value} />
              {f.node.type === "folder" && (
                <button
                  onClick={() => askFolder(f.path)}
                  className="text-[10px] font-mono px-2 py-1 rounded-md border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] whitespace-nowrap"
                >
                  ask
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="font-mono text-[10px] text-[var(--text-faint)] max-w-[360px] text-center">
        asking a folder gives the same answer as asking its top &mdash; because folder_size on the
        top is folder_size on each child, added up.
      </div>
    </div>
  );
}

interface CallFrame {
  path: string;
  childrenLeft: number;
  partial: number;
}

interface RecursionState {
  stack: CallFrame[];
  finished: Record<string, number>;
  active: string | null;
  ranBaseCase: boolean;
}

function runOneStep(state: RecursionState): RecursionState {
  // Find the top of the stack.
  const { stack, finished } = state;
  if (stack.length === 0) {
    // Start by pushing root.
    return {
      stack: [{ path: TREE.name, childrenLeft: -1, partial: 0 }],
      finished,
      active: TREE.name,
      ranBaseCase: false,
    };
  }
  const top = stack[stack.length - 1];
  const node = FLAT.find((f) => f.path === top.path)!.node;

  if (node.type === "file") {
    // Base case — return up.
    const finishedNext = { ...finished, [top.path]: node.size };
    const popped = stack.slice(0, -1);
    if (popped.length === 0) {
      return { stack: [], finished: finishedNext, active: null, ranBaseCase: true };
    }
    const parent = popped[popped.length - 1];
    const newParent: CallFrame = {
      path: parent.path,
      childrenLeft: parent.childrenLeft + 1,
      partial: parent.partial + node.size,
    };
    return {
      stack: [...popped.slice(0, -1), newParent],
      finished: finishedNext,
      active: newParent.path,
      ranBaseCase: true,
    };
  }

  // Folder: push the next child, or finish if all children done.
  const folderNode = node;
  const totalChildren = folderNode.children.length;
  const nextChildIndex = top.childrenLeft + 1;
  if (nextChildIndex < totalChildren) {
    const child = folderNode.children[nextChildIndex];
    const childPath = `${top.path}/${child.name}`;
    const updatedTop: CallFrame = { ...top, childrenLeft: nextChildIndex };
    return {
      stack: [
        ...stack.slice(0, -1),
        updatedTop,
        { path: childPath, childrenLeft: -1, partial: 0 },
      ],
      finished,
      active: childPath,
      ranBaseCase: false,
    };
  }

  // All children done — return this folder's size.
  const total = top.partial;
  const finishedNext = { ...finished, [top.path]: total };
  const popped = stack.slice(0, -1);
  if (popped.length === 0) {
    return { stack: [], finished: finishedNext, active: null, ranBaseCase: false };
  }
  const parent = popped[popped.length - 1];
  const newParent: CallFrame = {
    path: parent.path,
    childrenLeft: parent.childrenLeft,
    partial: parent.partial + total,
  };
  return {
    stack: [...popped.slice(0, -1), newParent],
    finished: finishedNext,
    active: newParent.path,
    ranBaseCase: false,
  };
}

/* Steps 4-7 — animated recursion */
// Classify a single recursion transition into the algorithm.py lines it maps to.
// We pick the MOST meaningful label per frame so the highlight changes as the
// walk visits leaves (base_*) vs. descends into / sums folders (recursive_call /
// aggregate / folder_return) — instead of being pinned to one line for the run.
function linesForStep(before: RecursionState, after: RecursionState): (number | string)[] {
  // A file hit its base case: we tested `type == "file"` and returned its size.
  if (after.ranBaseCase) return [LINE_BASE_CASE, LINE_BASE_CASE_RETURN];
  // Stack grew: a folder descended into one of its children (recursive call).
  if (after.stack.length > before.stack.length) return [LINE_RECURSIVE_CALL];
  // Stack shrank (and no base case): a folder finished — sum children, return up.
  if (after.stack.length < before.stack.length || after.active === null)
    return [LINE_AGGREGATE_SUM, LINE_FOLDER_RETURN];
  return [];
}

interface RecursionFrameState extends RecursionState {
  done: boolean;
}

function RecursiveComputeViz({ onActiveLine }: { onActiveLine?: (lines: (number | string)[]) => void }) {
  const initial = (): RecursionFrameState => ({
    stack: [],
    finished: {},
    active: null,
    ranBaseCase: false,
    done: false,
  });

  // Pure reducer: one recursion visit per frame. Reuses the existing walk
  // (`runOneStep`) and classifies the transition into @sync labels via
  // `linesForStep`. No setState / emit here — the wrapper emits post-commit.
  const step = (s: RecursionFrameState): AlgoFrame<RecursionFrameState> => {
    const next = runOneStep(s);
    const active = linesForStep(s, next);
    const done = next.finished[TREE.name] !== undefined;
    return { state: { ...next, done }, active, done };
  };

  return (
    <AnimatedAlgorithmView<RecursionFrameState>
      initial={initial}
      step={step}
      onActiveLine={onActiveLine}
      initialActive={[LINE_SIG]}
      intervalMs={520}
      playLabel="Play through"
      render={(state, { done }) => (
        <div className="flex flex-col items-center gap-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            recurse in · return up · stack drains
          </div>
          <div className="flex flex-row gap-6 items-start">
            <div className="flex flex-col gap-1 w-[300px]">
              {FLAT.map((f) => {
                const isActive = state.active === f.path;
                const value = state.finished[f.path];
                const isOnStack = state.stack.some((s) => s.path === f.path);
                return (
                  <NodeRow
                    key={f.path}
                    flat={f}
                    state={
                      isActive ? "active" : value !== undefined ? "done" : isOnStack ? "active" : "idle"
                    }
                    computed={value !== undefined ? value : null}
                  />
                );
              })}
            </div>
            <StackPanel
              title="call stack"
              items={state.stack.map((frame) => ({
                key: frame.path,
                label: frame.path.split("/").slice(-1)[0],
                sub: `partial: ${frame.partial}MB`,
                tone: "accent" as const,
              }))}
              emptyLabel="empty"
              topOnTop={true}
              widthPx={200}
            />
          </div>
          {done && (
            <div className="font-mono text-xs text-[var(--diff-easy)]">
              ✓ {state.finished[TREE.name]}MB total
            </div>
          )}
        </div>
      )}
    />
  );
}
