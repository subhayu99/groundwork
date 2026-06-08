"use client";

import Link from "next/link";
import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics } from "@/categories/registry";

export function ResumeBanner() {
  const { state } = useProgress();

  // Avoid hydration mismatch: render nothing until progress is loaded.
  if (!state) return null;

  const allTopics = listAllTopics();
  // Most-recently-touched in-progress topic wins (falls back to registry order for
  // records saved before lastTouched existed).
  const t = allTopics
    .filter((topic) => {
      const d = state.categories[topic.category]?.[topic.key]?.derivation;
      return d && d.currentStep > 1 && !d.completed;
    })
    .sort((a, b) => {
      const ta = state.categories[a.category]?.[a.key]?.lastTouched ?? 0;
      const tb = state.categories[b.category]?.[b.key]?.lastTouched ?? 0;
      return tb - ta;
    })[0];

  if (!t) return null;

  return (
    <Link
      href={`/categories/${t.category}/${t.key}`}
      className="block rounded-xl border border-[var(--accent-line)] bg-[var(--bg-card-hi)] px-4 py-3 hover:border-[var(--line-strong)] transition-colors"
    >
      <div className="text-[10px] font-mono uppercase text-[var(--text-faint)]">resume</div>
      <div className="text-[var(--text)]">
        Continue where you left off &middot; {t.name} &rarr;
      </div>
    </Link>
  );
}
