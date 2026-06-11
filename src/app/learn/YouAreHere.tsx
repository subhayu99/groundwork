"use client";

import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics } from "@/categories/registry";

/**
 * One-line "you are here" orientation under the map header: how many topics are
 * done and the single best thing to do next. The next-node pick mirrors the
 * map's own affordance order (resume an in-progress topic first; otherwise the
 * first startable one), reading the same store via the shared hook — no shelf
 * of its own, just a sentence so the map answers "what do I do next" up top.
 */
export function YouAreHere() {
  const { state } = useProgress();

  // Progress is client-only; render nothing until it loads (matches the
  // static-export HTML, so no hydration mismatch — same guard as ResumeBanner).
  if (!state) return null;

  const all = listAllTopics();
  const done = all.filter(
    (t) => state.categories[t.category]?.[t.key]?.derivation.completed,
  ).length;

  const completedKey = (t: { category: string; key: string }) =>
    !!state.categories[t.category]?.[t.key]?.derivation.completed;

  // Next: most-recently-touched in-progress topic (same rule as the continue
  // ring / ResumeBanner); else the first topic whose prereqs are all done.
  const lastTouched = (t: { category: string; key: string }) =>
    state.categories[t.category]?.[t.key]?.lastTouched ?? 0;
  const inProgress = all
    .filter((t) => {
      const d = state.categories[t.category]?.[t.key]?.derivation;
      return d && d.currentStep > 1 && !d.completed;
    })
    .sort((a, b) => lastTouched(b) - lastTouched(a))[0];

  const startable = all.find(
    (t) =>
      !completedKey(t) &&
      (t.prerequisites.length === 0 ||
        t.prerequisites.every((p) =>
          all.some((x) => x.key === p && completedKey(x)),
        )),
  );

  const next = inProgress ?? startable;

  return (
    <p className="text-sm text-[var(--text-muted)] mb-6 -mt-3">
      <span className="font-mono text-[var(--text-faint)]">
        {done} of {all.length} done
      </span>
      {next && (
        <>
          {" · "}
          {inProgress ? "continue" : "next"}:{" "}
          <span className="text-[var(--text)]">{next.name}</span>
        </>
      )}
    </p>
  );
}
