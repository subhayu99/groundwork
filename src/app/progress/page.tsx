"use client";

import { Chrome } from "@/shared/layout/Chrome";
import { useProgress } from "@/shared/progress/useProgress";
import { listAllTopics } from "@/categories/registry";
import { useRef } from "react";

export default function ProgressPage() {
  const { state, exportJson, importJson } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allTopics = listAllTopics();

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

      <main className="flex-1 max-w-4xl mx-auto px-8 py-12 w-full">
        <h1 className="text-3xl font-semibold text-[var(--text)] mb-2">Your progress</h1>
        <p className="text-[var(--text-muted)] mb-8">
          {completed.length} of {allTopics.length} topics completed
        </p>

        <div className="flex gap-3 mb-12">
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

        <div className="space-y-3">
          {allTopics.map((t) => {
            const tp = state.categories[t.category]?.[t.key];
            const isCompleted = tp?.derivation.completed ?? false;
            const currentStep = tp?.derivation.currentStep ?? 0;
            return (
              <div
                key={`${t.category}/${t.key}`}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)]"
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
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
