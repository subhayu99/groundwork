"use client";

import Link from "next/link";
import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics } from "@/categories/registry";

export function ResumeBanner() {
  const { state } = useProgress();

  // Avoid hydration mismatch: render nothing until progress is loaded.
  if (!state) return null;

  const allTopics = listAllTopics();
  const t = allTopics.find((topic) => {
    const d = state.categories[topic.category]?.[topic.key]?.derivation;
    return d && d.currentStep > 1 && !d.completed;
  });

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
