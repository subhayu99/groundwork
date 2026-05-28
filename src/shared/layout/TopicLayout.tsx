"use client";

import { ReactNode, useState } from "react";
import { CollapsiblePanel } from "./CollapsiblePanel";

interface TopicLayoutProps {
  cards: ReactNode;
  visualization: ReactNode;
  codeDrawer?: ReactNode;
  codeDrawerLocked?: boolean;
}

export function TopicLayout({ cards, visualization, codeDrawer, codeDrawerLocked }: TopicLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden">
      <CollapsiblePanel
        expandedWidth={420}
        collapsed={
          <div className="flex flex-col items-center gap-2 text-[10px] font-mono text-[var(--text-faint)]">
            cards
          </div>
        }
      >
        {cards}
      </CollapsiblePanel>

      {/* Right column: viz on top, code drawer pinned to the bottom of just this column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex items-center justify-center overflow-auto p-8 relative">
          {visualization}
        </main>

        {codeDrawer && (
          <div className="border-t border-[var(--line-faint)] bg-[var(--bg-elevated)]">
            <button
              disabled={codeDrawerLocked}
              onClick={() => !codeDrawerLocked && setDrawerOpen(!drawerOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 text-xs font-mono ${
                codeDrawerLocked ? "text-[var(--text-faint)] cursor-not-allowed" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>python · algorithm.py</span>
              <span>{codeDrawerLocked ? "unlocks after step 6" : drawerOpen ? "▼ hide" : "▲ show"}</span>
            </button>
            {drawerOpen && !codeDrawerLocked && (
              <div className="max-h-[60vh] overflow-auto px-4 pb-5">{codeDrawer}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
