"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/shared/layout/useIsMobile";

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}

/* @sync labels — resolved against algorithm.py (single source of truth) */
const LINE_PUSH = "push"; // history.append("home")  — push
const LINE_POP = "pop"; // history.pop()           — pop
const LINE_ENQUEUE = "enqueue"; // orders.append("latte")  — enqueue
const LINE_DEQUEUE = "dequeue"; // orders.popleft()        — dequeue

export function StacksQueuesVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <NaiveArrayViz />;
  return (
    <StackQueueViz
      onInteraction={step === 3 ? onWedgeInteraction : undefined}
      onActiveLine={onActiveLine}
    />
  );
}

const POOL = ["home", "inbox", "draft", "sent", "page", "post", "feed", "stats"];

let nextIdRef = { current: 100 };
function nextLabel() {
  return POOL[nextIdRef.current++ % POOL.length];
}

interface Item { id: number; label: string }

/* Steps 1-2 — show the array.pop(0) cost */
function NaiveArrayViz() {
  const [arr, setArr] = useState<Item[]>([
    { id: 1, label: "latte" },
    { id: 2, label: "mocha" },
    { id: 3, label: "americano" },
    { id: 4, label: "drip" },
    { id: 5, label: "espresso" },
  ]);
  const [shifts, setShifts] = useState(0);
  const [shifting, setShifting] = useState<number[]>([]);

  const popFront = () => {
    if (arr.length === 0) return;
    const idxs = arr.slice(1).map((_, i) => i + 1);
    setShifting(idxs);
    setShifts((s) => s + arr.length - 1);
    setTimeout(() => {
      setArr((a) => a.slice(1));
      setShifting([]);
    }, 480);
  };

  const popBack = () => {
    if (arr.length === 0) return;
    setArr((a) => a.slice(0, -1));
  };

  const pushBack = () => {
    setArr((a) => [...a, { id: Date.now(), label: nextLabel() }]);
  };

  const reset = () => {
    setArr([
      { id: 1, label: "latte" },
      { id: 2, label: "mocha" },
      { id: 3, label: "americano" },
      { id: 4, label: "drip" },
      { id: 5, label: "espresso" },
    ]);
    setShifts(0);
    setShifting([]);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        plain array — try the same operation at each end
      </div>

      <div className="flex items-center gap-1 md:gap-2 min-h-[80px]">
        <span className="font-mono text-[10px] text-[var(--text-faint)] mr-1 md:mr-2">front →</span>
        <AnimatePresence initial={false}>
          {arr.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: shifting.includes(i) ? -4 : 0,
                backgroundColor: shifting.includes(i)
                  ? "color-mix(in oklab, var(--diff-med) 22%, var(--bg-card))"
                  : "var(--bg-card)",
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.28 }}
              className="rounded-lg border-2 border-[var(--line)] px-2 md:px-4 h-12 md:h-14 flex items-center justify-center font-mono text-xs md:text-sm text-[var(--text)]"
            >
              {item.label}
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="font-mono text-[10px] text-[var(--text-faint)] ml-2">← back</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="font-mono text-xs text-[var(--text-muted)]">
          total shifts paid: <span className="text-[var(--diff-med)]">{shifts}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={popFront} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)]">
            pop front · O(n)
          </button>
          <button onClick={popBack} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-easy)_50%,transparent)] text-[var(--diff-easy)] bg-[color-mix(in_oklab,var(--diff-easy)_12%,transparent)]">
            pop back · O(1)
          </button>
          <button onClick={pushBack} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">
            push back
          </button>
          <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}

/* Steps 3-7 — side-by-side Stack and Queue */
function StackQueueViz({
  onInteraction,
  onActiveLine,
}: {
  onInteraction?: () => void;
  onActiveLine?: (lines: (number | string)[]) => void;
}) {
  const isMobile = useIsMobile();
  const [stack, setStack] = useState<Item[]>([]);
  const [queue, setQueue] = useState<Item[]>([]);
  const [lastStackOp, setLastStackOp] = useState<string | null>(null);
  const [lastQueueOp, setLastQueueOp] = useState<string | null>(null);

  const touch = () => onInteraction?.();

  const stackPush = () => {
    const label = nextLabel();
    setStack((s) => [...s, { id: Date.now() + Math.random(), label }]);
    setLastStackOp(`push(${label}) · O(1)`);
    onActiveLine?.([LINE_PUSH]);
    touch();
  };
  const stackPop = () => {
    setStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      setLastStackOp(`pop() → ${last.label} · O(1)`);
      return s.slice(0, -1);
    });
    onActiveLine?.([LINE_POP]);
    touch();
  };

  const queueEnqueue = () => {
    const label = nextLabel();
    setQueue((q) => [...q, { id: Date.now() + Math.random(), label }]);
    setLastQueueOp(`enqueue(${label}) · O(1)`);
    onActiveLine?.([LINE_ENQUEUE]);
    touch();
  };
  const queueDequeue = () => {
    setQueue((q) => {
      if (q.length === 0) return q;
      const first = q[0];
      setLastQueueOp(`dequeue() → ${first.label} · O(1)`);
      return q.slice(1);
    });
    onActiveLine?.([LINE_DEQUEUE]);
    touch();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        same buttons, two contracts
      </div>

      <div className={isMobile ? "flex flex-col items-center gap-8" : "grid grid-cols-2 gap-12"}>
        {/* Stack */}
        <div className="flex flex-col items-center gap-3">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--accent-ink)]">stack · lifo</div>
          <div className={`flex flex-col-reverse items-center gap-1 justify-end ${isMobile ? "min-h-[160px]" : "min-h-[260px]"}`}>
            <span className="font-mono text-[10px] text-[var(--text-faint)]">↑ top</span>
            <AnimatePresence initial={false}>
              {stack.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.7 }}
                  transition={{ duration: 0.28 }}
                  className="rounded-md border-2 border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-sky)_12%,var(--bg-card))] px-4 h-10 flex items-center font-mono text-sm text-[var(--text)]"
                  style={{ width: 140 }}
                >
                  {item.label}
                </motion.div>
              ))}
            </AnimatePresence>
            {stack.length === 0 && (
              <span className="font-mono text-[10px] text-[var(--text-faint)]">empty</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={stackPush} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">push</button>
            <button onClick={stackPop} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">pop</button>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-muted)] h-4">
            {lastStackOp ?? "—"}
          </div>
        </div>

        {/* Queue */}
        <div className="flex flex-col items-center gap-3">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--accent-ink)]">queue · fifo</div>
          <div className={`flex items-center justify-center gap-1 ${isMobile ? "min-h-[120px]" : "min-h-[260px]"}`}>
            <span className="font-mono text-[10px] text-[var(--text-faint)]">front →</span>
            <div className="flex items-center gap-1">
              <AnimatePresence initial={false}>
                {queue.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.7 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.7 }}
                    transition={{ duration: 0.28 }}
                    className="rounded-md border-2 border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-pink)_12%,var(--bg-card))] px-3 h-10 flex items-center font-mono text-sm text-[var(--text)]"
                  >
                    {item.label}
                  </motion.div>
                ))}
              </AnimatePresence>
              {queue.length === 0 && (
                <span className="font-mono text-[10px] text-[var(--text-faint)]">empty</span>
              )}
            </div>
            <span className="font-mono text-[10px] text-[var(--text-faint)]">← back</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={queueEnqueue} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">enqueue</button>
            <button onClick={queueDequeue} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">dequeue</button>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-muted)] h-4">
            {lastQueueOp ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
