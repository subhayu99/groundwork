"use client";

import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { useProgress } from "@/shared/progress/useProgress";
import type { ProblemDifficulty } from "@/shared/practice/types";

interface ProblemSummary {
  id: string;
  title: string;
  teaser: string;
  difficulty: ProblemDifficulty;
}

interface Props {
  categoryKey: string;
  topicKey: string;
  categoryName: string;
  topicName: string;
  problems: ProblemSummary[];
}

export function PracticeListClient({
  categoryKey,
  topicKey,
  categoryName,
  topicName,
  problems,
}: Props) {
  const { getTopic } = useProgress();
  const tp = getTopic(categoryKey, topicKey);

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome
        breadcrumb={[
          { label: categoryName, href: `/categories/${categoryKey}` },
          { label: topicName, href: `/categories/${categoryKey}/${topicKey}` },
          { label: "Practice" },
        ]}
      />

      <main className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-12 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          {topicName} · practice
        </div>
        <h1 className="text-3xl font-semibold text-[var(--text)] mb-4">Problems</h1>
        <p className="text-base text-[var(--text-muted)] mb-8 max-w-xl">
          Try each problem before opening the hints. The hints unfold one at a time so you can
          stop early. The full solution is hidden behind one last reveal.
        </p>

        {problems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-card)] px-6 py-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-2">
              coming soon
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              No practice problems for this topic yet. The derivation is the lesson — practice
              questions are being written and will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p) => {
              const attempt = tp.problems[p.id];
              const diffColor =
                p.difficulty === "easy"
                  ? "var(--diff-easy)"
                  : p.difficulty === "medium"
                  ? "var(--diff-med)"
                  : "var(--diff-hard)";
              return (
                <Link
                  key={p.id}
                  href={`/categories/${categoryKey}/${topicKey}/practice/${p.id}`}
                  className="block rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <h3 className="font-semibold text-[var(--text)] text-base">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {attempt?.solved && (
                        <span className="text-[10px] font-mono text-[var(--diff-easy)]">
                          ✓ solved
                        </span>
                      )}
                      {!attempt?.solved && attempt?.attempted && (
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">
                          attempted
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase"
                        style={{
                          color: diffColor,
                          borderColor: `color-mix(in oklab, ${diffColor} 50%, transparent)`,
                          background: `color-mix(in oklab, ${diffColor} 10%, transparent)`,
                          border: "1px solid",
                        }}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{p.teaser}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
