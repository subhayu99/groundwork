"use client";

import { ReactNode, useState } from "react";
import { ScrubbableCode } from "@/shared/code/ScrubbableCode";
import { FitViewport } from "./FitViewport";
import { useIsMobile } from "./useIsMobile";

interface TopicLayoutProps {
  cards: ReactNode;
  visualization: ReactNode;
  /** Raw Python source. When present, the drawer renders a scrubbable code viewer. */
  code?: string;
  codeDrawerLocked?: boolean;
  codeFilename?: string;
  /** Code lines (1-indexed) for the current step — syncs the highlight to the visualization. */
  codeActiveLines?: number[];
  /** Lines reached so far — others render dimmed (progressive reveal). */
  codeRevealedLines?: number[];
}

/**
 * Responsive topic layout — single DOM, reflowed by breakpoint (the cards and
 * visualizer mount exactly once; we never duplicate them).
 *
 * Desktop (md+): a collapsible cards sidebar on the LEFT and a right column with
 * the visualization on top and the code drawer pinned to its bottom.
 *
 * Mobile (< md): a single column — the visualization is a fixed-height panel at
 * the TOP (so it stays in view) and the lesson cards scroll BENEATH it, so you
 * read the card and watch the synced visual together. The visual can be
 * collapsed to reclaim reading room; the code is a collapsible block at the end
 * of the lesson. (Flex `order` swaps the two regions between the layouts.)
 */
export function TopicLayout({ cards, visualization, code, codeDrawerLocked, codeFilename, codeActiveLines, codeRevealedLines }: TopicLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mobileCodeOpen, setMobileCodeOpen] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [visualCollapsed, setVisualCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* VISUAL (+ desktop code drawer) — top on mobile, right column on desktop */}
      <div className="order-1 md:order-2 flex flex-col md:flex-1 overflow-hidden">
        <main
          className={`flex items-center justify-center overflow-hidden relative bg-[var(--bg)] transition-[height] duration-200 p-3 md:p-8 ${
            visualCollapsed ? "h-0" : "h-[42vh]"
          } md:h-auto md:flex-1`}
        >
          <FitViewport fitHeight={isMobile}>{visualization}</FitViewport>
        </main>

        {/* Mobile-only: collapse the visual to give the lesson more room */}
        <button
          onClick={() => setVisualCollapsed((c) => !c)}
          className="md:hidden flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-muted)] border-b border-[var(--line-faint)] bg-[var(--bg-elevated)]"
        >
          {visualCollapsed ? "▾ show visual" : "▴ hide visual"}
        </button>

        {/* Code — desktop drawer */}
        {code && (
          <div className="hidden md:block border-t border-[var(--line-faint)] bg-[var(--bg-elevated)]">
            <button
              disabled={codeDrawerLocked}
              onClick={() => !codeDrawerLocked && setDrawerOpen(!drawerOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 text-xs font-mono ${
                codeDrawerLocked
                  ? "text-[var(--text-faint)] cursor-not-allowed"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>python · {codeFilename ?? "algorithm.py"}</span>
              <span>{codeDrawerLocked ? "unlocks when you finish the derivation" : drawerOpen ? "▼ hide" : "▲ show"}</span>
            </button>
            {drawerOpen && !codeDrawerLocked && (
              <div className="max-h-[60vh] overflow-auto px-4 pb-5">
                <ScrubbableCode code={code} filename={codeFilename} activeLines={codeActiveLines} revealedLines={codeRevealedLines} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARDS / lesson — below the visual on mobile, left sidebar on desktop */}
      <aside
        className={`order-2 md:order-1 flex flex-col flex-1 md:flex-none w-full ${
          cardsCollapsed ? "md:w-[52px]" : "md:w-[420px]"
        } md:transition-[width] md:duration-300 relative md:border-r border-[var(--line-faint)] bg-[var(--bg-elevated)] overflow-hidden`}
      >
        {/* Desktop-only collapse toggle */}
        <button
          onClick={() => setCardsCollapsed((c) => !c)}
          aria-label={cardsCollapsed ? "Expand lesson panel" : "Collapse lesson panel"}
          className="hidden md:flex absolute top-4 right-3 z-10 w-7 h-7 rounded-full items-center justify-center border border-[var(--line)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hi)] text-xs text-[var(--text-muted)]"
        >
          {cardsCollapsed ? "→" : "←"}
        </button>

        {/* Collapsed placeholder (desktop only) */}
        <div
          className={`${cardsCollapsed ? "md:flex" : "md:hidden"} hidden flex-col items-center pt-16 text-[10px] font-mono uppercase tracking-widest text-[var(--text-faint)]`}
          style={{ writingMode: "vertical-rl" }}
        >
          lesson
        </div>

        {/* Cards content (+ mobile code at the end of the lesson) */}
        <div className={`${cardsCollapsed ? "md:hidden" : ""} flex-1 overflow-y-auto p-5 md:p-6 md:pr-12`}>
          {cards}

          {code && (
            <div className="md:hidden mt-6 pt-4 border-t border-[var(--line-faint)]">
              <button
                disabled={codeDrawerLocked}
                onClick={() => !codeDrawerLocked && setMobileCodeOpen((o) => !o)}
                className={`w-full flex items-center justify-between text-xs font-mono py-2 ${
                  codeDrawerLocked ? "text-[var(--text-faint)] cursor-not-allowed" : "text-[var(--text-muted)]"
                }`}
              >
                <span>python · {codeFilename ?? "algorithm.py"}</span>
                <span>{codeDrawerLocked ? "🔒 finish to unlock" : mobileCodeOpen ? "▾ hide" : "▸ show code"}</span>
              </button>
              {mobileCodeOpen && !codeDrawerLocked && (
                <div className="mt-3">
                  <ScrubbableCode code={code} filename={codeFilename} activeLines={codeActiveLines} revealedLines={codeRevealedLines} />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
