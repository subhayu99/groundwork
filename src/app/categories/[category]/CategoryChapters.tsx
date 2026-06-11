"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProgress } from "@/shared/progress/useProgress";
import { getPrinciple } from "@/principles/registry";
import type { TopicMeta } from "@/shared/derivation/types";

const diffColor = (d: TopicMeta["difficulty"]) =>
  d === "easy"
    ? "var(--diff-easy)"
    : d === "medium"
    ? "var(--diff-med)"
    : d === "hard"
    ? "var(--diff-hard)"
    : "var(--text-muted)";

interface Chapter {
  topic: TopicMeta;
  /** One-line, jargon-free description of what the chapter does. */
  blurb: string;
  /** Prerequisite display names, in learn order ("builds on" line). */
  buildsOn: string[];
}

interface Props {
  categoryKey: string;
  categoryName: string;
  /** 3-5 sentence plain-language track intro (adapted from TRACK-NARRATIVES). */
  intro: string;
  chapters: Chapter[];
}

export function CategoryChapters({ categoryKey, categoryName, intro, chapters }: Props) {
  const { state } = useProgress();
  // Guard completion reads until mounted so the server/static markup and the
  // first client render agree (same pattern as TopicTierMap / ResumeBanner).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const completed = (t: TopicMeta) =>
    !!(mounted && state?.categories[t.category]?.[t.key]?.derivation.completed);
  const currentStep = (t: TopicMeta) =>
    mounted ? state?.categories[t.category]?.[t.key]?.derivation.currentStep ?? 0 : 0;

  const doneCount = chapters.filter((c) => completed(c.topic)).length;

  return (
    <main id="main-content" className="flex-1 max-w-4xl mx-auto px-5 md:px-8 py-16 w-full">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
        track
      </div>
      <h1 className="text-4xl font-semibold text-[var(--text)] mb-4">{categoryName}</h1>

      {/* The track story — plain language, sets up the chapters below. */}
      <p className="text-base leading-relaxed text-[var(--text-muted)] mb-8 max-w-2xl">{intro}</p>

      {chapters.length === 0 ? (
        <p className="text-sm font-mono text-[var(--text-faint)]">coming soon</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
              {chapters.length} chapters · learn in order
            </div>
            {doneCount > 0 && (
              <div className="text-[11px] font-mono text-[var(--diff-easy)]">
                {doneCount}/{chapters.length} done
              </div>
            )}
          </div>

          <ol className="space-y-3">
            {chapters.map((c, i) => {
              const t = c.topic;
              const done = completed(t);
              const step = currentStep(t);
              return (
                <li key={t.key}>
                  <Link
                    href={`/categories/${categoryKey}/${t.key}`}
                    aria-label={`Chapter ${i + 1}: ${t.name}${done ? " (completed)" : ""}`}
                    className="group flex gap-4 p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors"
                  >
                    {/* chapter number / completion stamp */}
                    <div className="flex-none">
                      <span
                        aria-hidden
                        className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs"
                        style={
                          done
                            ? {
                                color: "var(--accent-ink)",
                                background: "var(--accent-soft)",
                                border: "1px solid var(--accent-line)",
                              }
                            : {
                                color: "var(--text-muted)",
                                border: "1px solid var(--line)",
                              }
                        }
                      >
                        {done ? "✓" : i + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                        <span
                          className="flex-none px-2 py-0.5 rounded-full text-[10px] font-mono uppercase"
                          style={{ color: diffColor(t.difficulty) }}
                        >
                          {t.difficulty}
                        </span>
                      </div>

                      {/* one-line description */}
                      <p className="text-sm text-[var(--text-muted)] leading-snug">{c.blurb}</p>

                      {/* builds on (prerequisites by name) */}
                      {c.buildsOn.length > 0 && (
                        <p className="mt-1.5 text-[11px] font-mono text-[var(--text-faint)]">
                          {"builds on "}
                          {c.buildsOn.map((name, j) => (
                            <span key={name}>
                              {j > 0 && ", "}
                              <span className="text-[var(--text-muted)]">{name}</span>
                            </span>
                          ))}
                        </p>
                      )}

                      {/* principle stamps + in-progress marker */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {t.principles.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)]"
                          >
                            {getPrinciple(p)?.displayName ?? p.replaceAll("-", " ")}
                          </span>
                        ))}
                        {!done && step > 0 && (
                          <span className="text-[10px] font-mono text-[var(--accent)]">
                            {"in progress · step "}
                            {step}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </main>
  );
}
