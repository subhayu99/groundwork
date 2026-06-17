import Link from "next/link";
import type { StudyPlan, PlanMilestone } from "@/shared/journey/plans";

/**
 * PlanTimeline — a PURE presentational vertical timeline over a StudyPlan.
 *
 * Props are exactly { plan: StudyPlan }; no hooks, no data fetching, no router
 * reads — so it renders identically on server and client and is trivially
 * testable. Each milestone is a list item carrying its 1-based number, topic
 * name, the topic's own minutes, the running cumulative time, and a done check.
 *
 * The cumulative time is read straight from the milestone (the `planFor`
 * contract guarantees it is non-decreasing); this component never recomputes it.
 *
 * Aesthetic: restrained mono + teal — mono uppercase micro-labels, hairline
 * connectors, a teal accent on completed nodes. Matches the principles/landing
 * shells (var(--text), var(--text-muted), var(--accent-ink), var(--line-*)).
 */

/** Human time: "1h 20m" / "1h" / "45m". */
function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

export function PlanTimeline({ plan }: { plan: StudyPlan }) {
  return (
    <ol className="relative">
      {plan.milestones.map((m, i) => (
        <MilestoneRow
          key={m.topicKey}
          milestone={m}
          n={i + 1}
          isLast={i === plan.milestones.length - 1}
        />
      ))}
    </ol>
  );
}

function MilestoneRow({
  milestone,
  n,
  isLast,
}: {
  milestone: PlanMilestone;
  n: number;
  isLast: boolean;
}) {
  const { name, href, minutes, cumulativeMinutes, done } = milestone;

  return (
    <li className="relative flex gap-4 pb-3 last:pb-0">
      {/* Spine + numbered node */}
      <div className="relative flex flex-col items-center">
        <span
          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors ${
            done
              ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--accent-ink)]"
              : "border-[var(--line-strong)] bg-[var(--bg-card)] text-[var(--text-muted)]"
          }`}
        >
          {done ? (
            <CheckMark />
          ) : (
            <span aria-hidden="true">{n}</span>
          )}
          {/* Numbers stay in the accessible tree even when a check is shown, so
              tests and screen readers can still find the milestone's position. */}
          {done && <span className="sr-only">{n}</span>}
        </span>
        {/* Connector to the next node (omitted on the last row). */}
        {!isLast && (
          <span
            aria-hidden="true"
            className="mt-1 w-px flex-1 bg-[var(--line-faint)]"
          />
        )}
      </div>

      {/* Body card */}
      <Link
        href={href}
        className="group mb-1 block flex-1 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:border-[var(--line-strong)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            data-testid="milestone-name"
            className="font-semibold leading-snug text-[var(--text)]"
          >
            {name}
          </h3>
          {done && (
            <span
              role="img"
              aria-label="done"
              title="Completed"
              className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]"
            >
              done
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
          <span>{formatMinutes(minutes)}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="text-[var(--text-muted)]">
            {formatMinutes(cumulativeMinutes)} in
          </span>
        </div>
      </Link>
    </li>
  );
}

/** Small teal check glyph for completed milestone nodes (decorative). */
function CheckMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 6.5" />
    </svg>
  );
}
