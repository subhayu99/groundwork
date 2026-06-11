"use client";

import { Chrome } from "@/shared/layout/Chrome";
import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics, listCategories, listTopicsInCategory } from "@/categories/registry";
import { listPrinciples } from "@/principles/registry";
import { getLessonSpec } from "@/shared/lesson/registry";
import { useRef } from "react";
import Link from "next/link";

export default function ProgressPage() {
  const { state, exportJson, importJson } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allTopics = listAllTopics();
  const categories = listCategories();
  const principles = listPrinciples();

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col">
        <Chrome />
        <main className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          loading…
        </main>
      </div>
    );
  }

  const completed = allTopics.filter((t) => {
    return state.categories[t.category]?.[t.key]?.derivation.completed;
  });

  // Continue where you left off — same store fields ResumeBanner uses: an
  // in-progress topic (currentStep > 1, not completed), most-recently-touched wins.
  const resumeTopic = allTopics
    .filter((t) => {
      const d = state.categories[t.category]?.[t.key]?.derivation;
      return d && d.currentStep > 1 && !d.completed;
    })
    .sort((a, b) => {
      const ta = state.categories[a.category]?.[a.key]?.lastTouched ?? 0;
      const tb = state.categories[b.category]?.[b.key]?.lastTouched ?? 0;
      return tb - ta;
    })[0];

  // Per-track progress: completed / total within each category.
  const trackProgress = categories.map((cat) => {
    const inCat = listTopicsInCategory(cat.key);
    const done = inCat.filter(
      (t) => state.categories[cat.key]?.[t.key]?.derivation.completed,
    ).length;
    return { cat, done, total: inCat.length };
  });

  // Ideas collected: a principle lights when ANY completed topic's lesson-spec
  // principle stamp (lessonSpec.principle?.key) matches it.
  const collectedKeys = new Set<string>();
  for (const t of completed) {
    const spec = getLessonSpec(t.category, t.key);
    const key = spec?.principle?.key;
    if (key) collectedKeys.add(key);
  }
  const collectedCount = principles.filter((p) => collectedKeys.has(p.key)).length;

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `fp-progress-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      importJson(text);
      alert("Progress imported.");
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "Home", href: "/" }, { label: "Progress" }]} />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-5 md:px-8 py-12 w-full">
        <h1 className="text-3xl font-semibold text-[var(--text)] mb-2">Your progress</h1>
        <p className="text-[var(--text-muted)] mb-8">
          {completed.length} of {allTopics.length} topics completed
        </p>

        {/* Continue where you left off — the returning learner's first move. */}
        {resumeTopic ? (
          <Link
            href={`/categories/${resumeTopic.category}/${resumeTopic.key}`}
            className="block rounded-xl border border-[var(--accent-line)] bg-[var(--bg-card-hi)] px-5 py-4 mb-12 hover:border-[var(--line-strong)] transition-colors"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
              continue where you left off
            </div>
            <div className="text-lg text-[var(--text)]">
              {resumeTopic.name} &rarr;
            </div>
            <div className="text-xs font-mono text-[var(--text-faint)] mt-1">
              {resumeTopic.category}
            </div>
          </Link>
        ) : (
          <Link
            href="/learn"
            className="block rounded-xl border border-[var(--accent-line)] bg-[var(--bg-card-hi)] px-5 py-4 mb-12 hover:border-[var(--line-strong)] transition-colors"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
              {completed.length > 0 ? "pick up the next idea" : "start here"}
            </div>
            <div className="text-lg text-[var(--text)]">
              {completed.length > 0 ? "Open the map" : "Begin at the foundation"} &rarr;
            </div>
          </Link>
        )}

        {/* Per-track progress bars. */}
        <section className="mb-12">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            tracks
          </div>
          <div className="space-y-5">
            {trackProgress.map(({ cat, done, total }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={cat.key}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text)]">{cat.name}</span>
                    <span className="text-xs font-mono text-[var(--text-faint)]">
                      {done}/{total}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-[var(--line-faint)] overflow-hidden"
                    role="progressbar"
                    aria-label={`${cat.name} progress`}
                    aria-valuenow={done}
                    aria-valuemin={0}
                    aria-valuemax={total}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ideas collected — the seven-ideas thesis, lit by completed-topic stamps. */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
              ideas collected
            </span>
            <span className="text-xs font-mono text-[var(--text-faint)]">
              {collectedCount}/{principles.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {principles.map((p) => {
              const lit = collectedKeys.has(p.key);
              return (
                <Link
                  key={p.key}
                  href={`/principles/${p.key}`}
                  aria-label={`${p.name}${lit ? " — collected" : " — not yet"}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    lit
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)] hover:border-[var(--line-strong)]"
                      : "border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block w-2 h-2 rotate-45 shrink-0 ${
                      lit ? "bg-[var(--accent-sky)]" : "bg-[var(--line-strong)]"
                    }`}
                  />
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium truncate ${
                        lit ? "text-[var(--accent-ink)]" : "text-[var(--text-subtle)]"
                      }`}
                    >
                      {p.name}
                    </span>
                    <span className="block text-xs text-[var(--text-faint)] truncate">
                      {p.displayName}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Due for review — shelf slot (L4 owns the recall loop). */}
        <section className="mb-12">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-3">
            due for review
          </div>
          <div className="rounded-xl border border-dashed border-[var(--line-faint)] bg-[var(--bg-card)] px-5 py-4">
            <p className="text-sm text-[var(--text-muted)]">
              Recall checks for what you&rsquo;ve derived are coming soon.
            </p>
          </div>
        </section>

        {/* Full topic detail list (kept). */}
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
          all topics
        </div>
        <div className="space-y-3 mb-12">
          {allTopics.map((t) => {
            const tp = state.categories[t.category]?.[t.key];
            const isCompleted = tp?.derivation.completed ?? false;
            const currentStep = tp?.derivation.currentStep ?? 0;
            return (
              <Link
                key={`${t.category}/${t.key}`}
                href={`/categories/${t.category}/${t.key}`}
                className="block flex items-center justify-between p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors"
              >
                <div>
                  <div className="font-medium text-[var(--text)]">{t.name}</div>
                  <div className="text-xs font-mono text-[var(--text-faint)] mt-1">{t.category}</div>
                </div>
                <div className="font-mono text-xs">
                  {isCompleted ? (
                    <span className="text-[var(--diff-easy)]">complete</span>
                  ) : currentStep > 0 ? (
                    <span className="text-[var(--accent)]">step {currentStep}</span>
                  ) : (
                    <span className="text-[var(--text-faint)]">not started</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
          >
            Export progress (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            Import progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </main>
    </div>
  );
}
