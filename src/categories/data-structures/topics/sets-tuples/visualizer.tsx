"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NAME_POOL = ["alice", "bob", "cara", "dan", "eli", "fawn"];

// algorithm.py lines for the set operation being demonstrated (1-indexed, actual lines).
const LINE_SET_ADD = 6; // logged_in.add("alice")
const LINE_SET_ADD_DEDUP = 8; // logged_in.add("alice")  # silently ignored — already in
const LINE_SET_MEMBERSHIP = 10; // print("alice" in logged_in)  # True — O(1) average
const LINE_SET_DISCARD = 13; // logged_in.discard("bob")  # O(1), no error if missing

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: number[]) => void;
}

export function SetsTuplesVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <ListScanViz />;
  return <SetTupleViz onInteraction={step === 3 ? onWedgeInteraction : undefined} onActiveLine={onActiveLine} />;
}

/* Step 1-2 — list-based membership = scan */
function ListScanViz() {
  const [users, setUsers] = useState<string[]>(["alice", "bob"]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const addAlice = () => {
    setUsers((u) => [...u, "alice"]);
    setDuplicateCount((c) => c + 1);
  };
  const addNew = () => {
    const fresh = NAME_POOL.find((n) => !users.includes(n));
    if (fresh) setUsers((u) => [...u, fresh]);
  };
  const reset = () => {
    setUsers(["alice", "bob"]);
    setDuplicateCount(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        plain list · no uniqueness rule
      </div>
      <div className="flex flex-wrap items-center gap-1 max-w-[420px] justify-center">
        <AnimatePresence>
          {users.map((u, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.22 }}
              className="font-mono text-sm rounded-md border-2 border-[var(--line)] bg-[var(--bg-card)] px-3 py-1 text-[var(--text)]"
            >
              {u}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="font-mono text-xs text-[var(--text-muted)]">
        list length: <span className="text-[var(--text)]">{users.length}</span>
        <span className="mx-3">·</span>
        duplicates accepted: <span className="text-[var(--diff-med)]">{duplicateCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]">↺</button>
        <button onClick={addAlice} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[color-mix(in_oklab,var(--diff-med)_50%,transparent)] text-[var(--diff-med)] bg-[color-mix(in_oklab,var(--diff-med)_12%,transparent)]">
          add &ldquo;alice&rdquo; again
        </button>
        <button onClick={addNew} className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]">
          add a new user
        </button>
      </div>
    </div>
  );
}

/* Step 3+ — side-by-side set and tuple */
function SetTupleViz({ onInteraction, onActiveLine }: { onInteraction?: () => void; onActiveLine?: (lines: number[]) => void }) {
  const [members, setMembers] = useState<string[]>(["alice", "bob"]);
  const [tuple] = useState<[string, number, number]>(["2026-05-28", 47.5, 22.1]);
  const [tupleError, setTupleError] = useState<string | null>(null);

  const addMember = (n: string) => {
    onInteraction?.();
    setMembers((m) => {
      const duplicate = m.includes(n);
      // add on a present element is the silently-ignored dedup line; otherwise a fresh add.
      onActiveLine?.(duplicate ? [LINE_SET_ADD_DEDUP] : [LINE_SET_ADD]);
      return duplicate ? m : [...m, n];
    });
  };
  const removeMember = (n: string) => {
    onInteraction?.();
    onActiveLine?.([LINE_SET_DISCARD]);
    setMembers((m) => m.filter((x) => x !== n));
  };
  const testMembership = () => {
    onInteraction?.();
    onActiveLine?.([LINE_SET_MEMBERSHIP]);
  };

  const flashTupleError = (msg: string) => {
    onInteraction?.();
    setTupleError(msg);
    setTimeout(() => setTupleError(null), 1500);
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-[640px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        two containers, two contracts
      </div>

      {/* Set */}
      <div className="w-full flex flex-col items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-5">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--accent-ink)] self-start">set · unique members</div>
        <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center w-full">
          <AnimatePresence>
            {members.map((n) => (
              <motion.span
                key={n}
                layout
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.22 }}
                className="font-mono text-xs rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] px-3 py-1"
              >
                {n}
              </motion.span>
            ))}
          </AnimatePresence>
          {members.length === 0 && <span className="font-mono text-[10px] text-[var(--text-faint)]">empty</span>}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-muted)]">
          size: {members.length}
          <span className="mx-2">·</span>
          <button onClick={testMembership} className="font-mono text-[11px] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]">
            &ldquo;alice&rdquo; in set
          </button>: <span className={members.includes("alice") ? "text-[var(--diff-easy)]" : "text-[var(--diff-hard)]"}>{members.includes("alice") ? "True" : "False"}</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {NAME_POOL.map((n) => (
            <button
              key={n}
              onClick={() => addMember(n)}
              className="px-2.5 py-1 rounded-md font-mono text-[11px] border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hi)]"
            >
              + {n}
            </button>
          ))}
          {members.length > 0 && (
            <button
              onClick={() => removeMember(members[members.length - 1])}
              className="px-2.5 py-1 rounded-md font-mono text-[11px] border border-[color-mix(in_oklab,var(--diff-hard)_50%,transparent)] text-[var(--diff-hard)] bg-[color-mix(in_oklab,var(--diff-hard)_10%,transparent)]"
            >
              − remove last
            </button>
          )}
        </div>
      </div>

      {/* Tuple */}
      <div className="w-full flex flex-col items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-5">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--accent-ink)] self-start">tuple · fixed packet</div>
        <div className="font-mono text-sm flex items-center gap-1">
          <span className="text-[var(--text-faint)]">(</span>
          {tuple.map((v, i) => (
            <span key={i} className="flex items-center">
              <span className="rounded-md border border-[var(--line)] bg-[var(--bg-card-hi)] px-2 py-1 text-[var(--text)]">{String(v)}</span>
              {i < tuple.length - 1 && <span className="text-[var(--text-faint)] mx-1">,</span>}
            </span>
          ))}
          <span className="text-[var(--text-faint)]">)</span>
        </div>
        <div className="font-mono text-[11px] text-[var(--text-muted)]">
          tuple[0] = <span className="text-[var(--diff-easy)]">{tuple[0]}</span>
          <span className="mx-2">·</span>
          len = {tuple.length}
        </div>
        <motion.div
          animate={{ opacity: tupleError ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-[11px] text-[var(--diff-hard)] h-4"
        >
          {tupleError}
        </motion.div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => flashTupleError("TypeError: 'tuple' object does not support item assignment")}
            className="px-2.5 py-1 rounded-md font-mono text-[11px] border border-[color-mix(in_oklab,var(--diff-hard)_50%,transparent)] text-[var(--diff-hard)] bg-[color-mix(in_oklab,var(--diff-hard)_10%,transparent)]"
          >
            try: tuple[0] = ...
          </button>
          <button
            onClick={() => flashTupleError("TypeError: cannot add items to a tuple")}
            className="px-2.5 py-1 rounded-md font-mono text-[11px] border border-[color-mix(in_oklab,var(--diff-hard)_50%,transparent)] text-[var(--diff-hard)] bg-[color-mix(in_oklab,var(--diff-hard)_10%,transparent)]"
          >
            try: tuple.append(...)
          </button>
        </div>
      </div>
    </div>
  );
}
