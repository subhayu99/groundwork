"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  label: string;
  /** Short text shown next to the label before the section opens. */
  preview?: string;
  /** Accent the header so spoiler-heavy sections (solution) read as "intentional reveal". */
  accent?: "default" | "warning";
  defaultOpen?: boolean;
  onOpen?: () => void;
  children: ReactNode;
}

export function CollapsibleSection({
  label,
  preview,
  accent = "default",
  defaultOpen = false,
  onOpen,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    if (!open) onOpen?.();
    setOpen((o) => !o);
  };

  const headerColor =
    accent === "warning" ? "text-[var(--diff-med)]" : "text-[var(--text)]";

  return (
    <div className="rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span className="flex items-center gap-3">
          <span
            className={`font-mono text-[10px] uppercase tracking-wider ${headerColor}`}
          >
            {label}
          </span>
          {preview && !open && (
            <span className="text-xs text-[var(--text-faint)] truncate max-w-[300px]">
              {preview}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-[var(--text-muted)] text-xs font-mono"
        >
          ›
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
