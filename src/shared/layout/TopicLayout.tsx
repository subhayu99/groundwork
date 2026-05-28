"use client";

import { ReactNode, useState } from "react";
import { ScrubbableCode } from "@/shared/code/ScrubbableCode";

interface TopicLayoutProps {
  cards: ReactNode;
  visualization: ReactNode;
  /** Raw Python source. When present, the drawer renders a scrubbable code viewer. */
  code?: string;
  codeDrawerLocked?: boolean;
  codeFilename?: string;
}

type MobileTab = "cards" | "visual" | "code";

/**
 * Responsive topic layout.
 *
 * Desktop (md+): a fixed cards sidebar (collapsible) on the left and a right
 * column holding the visualization with the code drawer pinned to its bottom.
 *
 * Mobile (< md): a single column with a Cards / Visual / Code tab bar. Only the
 * active panel is shown; the cards and visualization stay mounted (hidden via
 * CSS) so their scroll position and animation state survive tab switches.
 */
export function TopicLayout({ cards, visualization, code, codeDrawerLocked, codeFilename }: TopicLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("cards");

  const tabs: { key: MobileTab; label: string; show: boolean }[] = [
    { key: "cards", label: "Lesson", show: true },
    { key: "visual", label: "Visual", show: true },
    { key: "code", label: "Code", show: Boolean(code) },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-[var(--line-faint)] bg-[var(--bg-elevated)]">
        {tabs
          .filter((t) => t.show)
          .map((t) => {
            const active = mobileTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setMobileTab(t.key)}
                className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                  active
                    ? "text-[var(--text)] border-b-2 border-[var(--accent)] bg-[var(--bg-card)]"
                    : "text-[var(--text-faint)] border-b-2 border-transparent hover:text-[var(--text-muted)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
      </div>

      {/* Cards / lesson panel */}
      <aside
        className={`${mobileTab === "cards" ? "flex" : "hidden"} md:flex flex-col flex-1 md:flex-none w-full ${
          cardsCollapsed ? "md:w-[52px]" : "md:w-[420px]"
        } md:transition-[width] md:duration-300 relative border-r border-[var(--line-faint)] bg-[var(--bg-elevated)] overflow-hidden`}
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

        {/* Cards content */}
        <div
          className={`${cardsCollapsed ? "md:hidden" : ""} h-full overflow-y-auto p-6 md:pr-12`}
        >
          {cards}
        </div>
      </aside>

      {/* Right column: visualization + code */}
      <div
        className={`${mobileTab !== "cards" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}
      >
        {/* Visualization */}
        <main
          className={`${mobileTab === "visual" ? "flex" : "hidden"} md:flex flex-1 items-center justify-center overflow-auto p-6 md:p-8 relative`}
        >
          {visualization}
        </main>

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
              <span>{codeDrawerLocked ? "unlocks after step 6" : drawerOpen ? "▼ hide" : "▲ show"}</span>
            </button>
            {drawerOpen && !codeDrawerLocked && (
              <div className="max-h-[60vh] overflow-auto px-4 pb-5">
                <ScrubbableCode code={code} filename={codeFilename} />
              </div>
            )}
          </div>
        )}

        {/* Code — mobile full panel (only mounts when the Code tab is active) */}
        {code && mobileTab === "code" && (
          <div className="md:hidden flex-1 overflow-auto p-4">
            {codeDrawerLocked ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
                  locked
                </span>
                <p className="text-sm text-[var(--text-muted)]">
                  The code unlocks after you reach step 6 of the derivation.
                </p>
              </div>
            ) : (
              <ScrubbableCode code={code} filename={codeFilename} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
