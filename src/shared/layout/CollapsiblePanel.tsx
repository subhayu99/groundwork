"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface CollapsiblePanelProps {
  children: React.ReactNode;
  /** Compact content shown when collapsed (e.g., step number dots) */
  collapsed?: React.ReactNode;
  /** Width in pixels for expanded state */
  expandedWidth?: number;
  /** Width in pixels for collapsed state */
  collapsedWidth?: number;
}

export function CollapsiblePanel({
  children,
  collapsed,
  expandedWidth = 480,
  collapsedWidth = 56,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      animate={{ width: isOpen ? expandedWidth : collapsedWidth }}
      transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
      className="relative border-r border-[var(--line-faint)] bg-[var(--bg-elevated)] overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse panel" : "Expand panel"}
        className="absolute top-4 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center border border-[var(--line)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hi)] text-xs text-[var(--text-muted)]"
      >
        {isOpen ? "←" : "→"}
      </button>

      <div className="h-full overflow-y-auto">
        {isOpen ? <div className="p-6 pr-12">{children}</div> : <div className="py-6">{collapsed}</div>}
      </div>
    </motion.aside>
  );
}
