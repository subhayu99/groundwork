"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export type CardState = "upcoming" | "active" | "done";

interface CardProps {
  step: string;
  label: string;
  title: string;
  state: CardState;
  body: React.ReactNode;
  /** Optional expanded prose shown after clicking "read more" */
  expand?: React.ReactNode;
  action?: React.ReactNode;
  onRevisit?: () => void;
}

export function Card({ step, label, title, state, body, expand, action, onRevisit }: CardProps) {
  const [showExpand, setShowExpand] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (state !== "done" || !onRevisit) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [data-no-revisit]")) return;
    onRevisit();
  };

  const isCollapsed = state === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
      onClick={handleClick}
      role={state === "done" ? "button" : undefined}
      tabIndex={state === "done" ? 0 : undefined}
      onKeyDown={(e) => {
        if (state === "done" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onRevisit?.();
        }
      }}
      className={`
        relative rounded-2xl border p-5 mb-3 transition-all
        ${state === "active" ? "bg-[var(--bg-card-hi)] border-[var(--accent-line)]" : ""}
        ${state === "done" ? "bg-[var(--bg-card)] border-[var(--line-faint)] cursor-pointer hover:border-[var(--line)]" : ""}
        ${state === "upcoming" ? "bg-[var(--bg-card)] border-[var(--line-faint)] opacity-50" : ""}
      `}
      data-state={state}
      data-comment-anchor={`step-${step}`}
    >
      {state === "done" && (
        <span className="absolute top-3 right-4 text-[10px] font-mono text-[var(--text-faint)]">
          ↺ revisit
        </span>
      )}

      <div className="flex items-center gap-2.5 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[10px] font-mono text-[var(--accent-ink)]">
          {step}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
      </div>

      <h3 className={`font-semibold text-[var(--text)] mb-2 ${isCollapsed ? "text-sm" : "text-lg"}`}>
        {title}
      </h3>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32 }}
            className="text-sm text-[var(--text-muted)] leading-relaxed overflow-hidden"
          >
            <div className="space-y-2">{body}</div>

            {expand && (
              <>
                {!showExpand && (
                  <button
                    data-no-revisit
                    onClick={() => setShowExpand(true)}
                    className="mt-3 text-xs font-mono text-[var(--accent)] hover:underline"
                  >
                    Read more →
                  </button>
                )}
                {showExpand && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 space-y-2"
                  >
                    {expand}
                  </motion.div>
                )}
              </>
            )}

            {action && <div className="mt-4 flex items-center gap-3">{action}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
