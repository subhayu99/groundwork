"use client";

import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { PlanTimeline } from "@/shared/journey/PlanTimeline";
import { planFor } from "@/shared/journey/plans";
import { useAudience } from "@/shared/audience/useAudience";
import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics } from "@/categories/registry";
import { emptyProgressState } from "@/shared/progress/types";
import type { Goal } from "@/shared/audience/types";

/**
 * /plan — the learner's goal-shaped study plan.
 *
 * Reads the saved profile (its `goal`) via useAudience and the raw progress
 * state via useProgress (to stamp each milestone's `done`), then computes the
 * plan from the frozen `planFor` contract over the full registry. The goal
 * defaults to "understand" (the full path) when the learner hasn't onboarded
 * or hasn't expressed one — so the page is meaningful for newcomers too.
 *
 * `loaded` gates the first paint so the plan doesn't flash in before
 * localStorage is read (avoids a hydration mismatch), mirroring Chrome's chip.
 */
export default function PlanPage() {
  const { profile, loaded } = useAudience();
  const { state } = useProgress();

  if (!loaded || !state) {
    return (
      <div className="min-h-screen flex flex-col">
        <Chrome breadcrumb={[{ label: "Your plan" }]} />
        <main
          id="main-content"
          className="flex-1 flex items-center justify-center font-mono text-sm text-[var(--text-muted)]"
        >
          loading…
        </main>
      </div>
    );
  }

  const goal: Goal = profile?.goal ?? "understand";
  const plan = planFor(goal, state ?? emptyProgressState(), listAllTopics());
  const firstMilestone = plan.milestones[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "Your plan" }]} />

      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-16 w-full"
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          your study plan
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-2">{plan.title}</h1>
        <p className="text-base text-[var(--text-muted)] mb-3 max-w-2xl">{plan.subtitle}</p>

        <div className="mb-12 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
          <span>{plan.milestones.length} milestones</span>
          <span aria-hidden="true">&middot;</span>
          <span className="text-[var(--text-muted)]">{formatMinutes(plan.totalMinutes)} total</span>
        </div>

        <PlanTimeline plan={plan} />

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--line-faint)] pt-8">
          {firstMilestone && (
            <Link
              href={firstMilestone.href}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              Start &ldquo;{firstMilestone.name}&rdquo; &rarr;
            </Link>
          )}
          <Link
            href="/learn"
            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            &larr; back to the map
          </Link>
        </div>
      </main>
    </div>
  );
}

/** Human time: "1h 20m" / "1h" / "45m". */
function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}
