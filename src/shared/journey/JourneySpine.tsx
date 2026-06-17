"use client";

import Link from "next/link";
import { STAGES, journeyProgress, type JourneyStage } from "@/shared/journey/spine";
import { useProgress } from "@/shared/progress/useProgress";

/**
 * JourneySpine — the named four-stage arc, rendered. This is the spine of the
 * Front-Door Wave: it does not re-order or re-define anything (the data lives in
 * @/shared/journey/spine, the FROZEN contract), it just *shows* the journey and
 * answers "where am I."
 *
 * Two variants:
 *   - `full`: a numbered horizontal ribbon of all four STAGES, in journey order.
 *     Each stage shows its number, name, and one-line promise, and links to
 *     stage.href. Plain and structural — the map, not a billboard.
 *   - `compact`: the same four stages, condensed, promises hidden. The
 *     `currentStage` is visually lit. Use it as a slim "you are here" rail above
 *     a surface.
 *
 * `showProgress` (compact only in practice) reads the learner's saved progress
 * via the existing useProgress hook and shows the platform-wide "done/total"
 * count on the CURRENT stage. Because that count depends on client-only saved
 * state, the component renders the STATIC compact form first (no count) and only
 * adds the number once `state` has loaded — so server and first client render
 * agree (no hydration mismatch). The rollup tolerates empty/partial state and
 * never throws (H10), so newcomers with no saved data render cleanly.
 *
 * Covered by src/tests/journey-spine-ui.test.tsx (full order/names/promises/
 * hrefs; compact lights currentStage; showProgress with no saved data).
 */

export interface JourneySpineProps {
  variant: "full" | "compact";
  /** The stage key to light in `compact` (e.g. "structures"). */
  currentStage?: string;
  /** Read saved progress and show "done/total" on the current stage. */
  showProgress?: boolean;
}

export function JourneySpine({ variant, currentStage, showProgress }: JourneySpineProps) {
  // The hook returns null before mount; we read it unconditionally (hooks rule)
  // but only USE it when showProgress is on. `overall` stays null pre-mount or
  // when progress isn't requested, which keeps the count off the static render.
  const { state } = useProgress();

  let overall: { done: number; total: number } | null = null;
  if (showProgress && state) {
    const rows = journeyProgress(state);
    // overallDone / overallTotal are identical on every row — read the first.
    const row = rows[0];
    if (row) overall = { done: row.overallDone, total: row.overallTotal };
  }

  if (variant === "full") return <FullSpine />;

  return <CompactSpine currentStage={currentStage} overall={overall} />;
}

/* ── full: the numbered ribbon ─────────────────────────────────────────────── */

function FullSpine() {
  return (
    <nav
      aria-label="The journey"
      data-journey-spine="full"
      className="w-full"
    >
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <li key={stage.key}>
            <Link
              href={stage.href}
              data-stage={stage.key}
              className="group block h-full rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--line-strong)]"
            >
              <div className="flex items-baseline gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-sm text-[var(--accent-ink)] tabular-nums"
                >
                  {stage.n}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
                  Stage {stage.n} of {stage.total}
                </span>
              </div>
              <div className="mt-1 font-semibold leading-snug text-[var(--text)] group-hover:text-[var(--accent-ink)]">
                {stage.name}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {stage.promise}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── compact: the slim "you are here" rail ─────────────────────────────────── */

function CompactSpine({
  currentStage,
  overall,
}: {
  currentStage?: string;
  overall: { done: number; total: number } | null;
}) {
  return (
    <nav
      aria-label="The journey"
      data-journey-spine="compact"
      className="w-full"
    >
      <ol className="flex flex-wrap items-stretch gap-1.5 font-mono text-[12px]">
        {STAGES.map((stage) => {
          const isCurrent = stage.key === currentStage;
          return (
            <li key={stage.key} className="contents">
              <CompactStage
                stage={stage}
                isCurrent={isCurrent}
                overall={isCurrent ? overall : null}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CompactStage({
  stage,
  isCurrent,
  overall,
}: {
  stage: JourneyStage;
  isCurrent: boolean;
  overall: { done: number; total: number } | null;
}) {
  return (
    <Link
      href={stage.href}
      data-stage={stage.key}
      data-current={isCurrent ? "true" : "false"}
      aria-current={isCurrent ? "step" : undefined}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-colors",
        isCurrent
          ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
          : "border-[var(--line-faint)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
      ].join(" ")}
    >
      <span aria-hidden="true" className="tabular-nums opacity-70">
        {stage.n}
      </span>
      <span className={isCurrent ? "font-medium" : undefined}>{stage.name}</span>
      {overall ? (
        <span
          className="tabular-nums text-[11px] opacity-80"
          aria-label={`${overall.done} of ${overall.total} topics done`}
        >
          {overall.done}/{overall.total}
        </span>
      ) : null}
    </Link>
  );
}
