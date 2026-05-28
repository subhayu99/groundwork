"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@/shared/progress/useProgress";
import type { PracticeProblem } from "./types";
import { CollapsibleSection } from "./CollapsibleSection";
import { CodeBlock } from "./CodeBlock";

interface Props {
  categoryKey: string;
  topicKey: string;
  topicName: string;
  problem: PracticeProblem;
}

export function ProblemView({ categoryKey, topicKey, topicName, problem }: Props) {
  const { getTopic, updateTopic } = useProgress();
  const topicProgress = getTopic(categoryKey, topicKey);
  const attempt = topicProgress.problems[problem.id] ?? { attempted: false };
  const [solved, setSolved] = useState(Boolean(attempt.solved));

  useEffect(() => {
    setSolved(Boolean(attempt.solved));
  }, [attempt.solved]);

  // Mark attempted as soon as the page renders (the user is, well, attempting).
  useEffect(() => {
    if (attempt.attempted) return;
    updateTopic(categoryKey, topicKey, (tp) => ({
      ...tp,
      problems: {
        ...tp.problems,
        [problem.id]: { ...attempt, attempted: true },
      },
    }));
    // We intentionally run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noteHintRevealed = (hintIdx: number) => {
    updateTopic(categoryKey, topicKey, (tp) => {
      const prev = tp.problems[problem.id] ?? { attempted: true };
      const hintsUsed = Math.max(prev.hintsUsed ?? 0, hintIdx + 1);
      return {
        ...tp,
        problems: { ...tp.problems, [problem.id]: { ...prev, hintsUsed } },
      };
    });
  };

  const markSolved = () => {
    setSolved(true);
    updateTopic(categoryKey, topicKey, (tp) => ({
      ...tp,
      problems: {
        ...tp.problems,
        [problem.id]: { ...(tp.problems[problem.id] ?? { attempted: true }), solved: true },
      },
    }));
  };

  const diffColor =
    problem.difficulty === "easy"
      ? "var(--diff-easy)"
      : problem.difficulty === "medium"
      ? "var(--diff-med)"
      : "var(--diff-hard)";

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 w-full">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
        {topicName} · practice
      </div>

      <div className="flex items-start justify-between gap-6 mb-3">
        <h1 className="text-3xl font-semibold text-[var(--text)]">{problem.title}</h1>
        <span
          className="mt-2 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
          style={{
            color: diffColor,
            borderColor: `color-mix(in oklab, ${diffColor} 50%, transparent)`,
            background: `color-mix(in oklab, ${diffColor} 12%, transparent)`,
          }}
        >
          {problem.difficulty}
        </span>
      </div>

      <div className="text-base text-[var(--text-muted)] mb-6 leading-relaxed">
        {problem.prompt}
      </div>

      {problem.constraints && problem.constraints.length > 0 && (
        <div className="mb-6 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-2">
            constraints
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-muted)]">
            {problem.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          examples
        </div>
        {problem.examples.map((ex, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] px-4 py-3"
          >
            <div className="font-mono text-xs grid grid-cols-[60px_1fr] gap-y-1 gap-x-3">
              <span className="text-[var(--text-faint)]">input</span>
              <span className="text-[var(--text)]">{ex.input}</span>
              <span className="text-[var(--text-faint)]">output</span>
              <span className="text-[var(--diff-easy)]">{ex.output}</span>
              {ex.note && (
                <>
                  <span className="text-[var(--text-faint)]">why</span>
                  <span className="text-[var(--text-muted)]">{ex.note}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          hints · earliest first
        </div>
        {problem.hints.map((hint, i) => (
          <CollapsibleSection
            key={i}
            label={`hint ${i + 1}`}
            preview="click to reveal"
            onOpen={() => noteHintRevealed(i)}
          >
            {hint}
          </CollapsibleSection>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          solution
        </div>
        <CollapsibleSection
          label="show solution"
          preview="full answer with copy"
          accent="warning"
        >
          {problem.solutionWalkthrough && (
            <div className="mb-4 text-sm text-[var(--text-muted)] leading-relaxed">
              {problem.solutionWalkthrough}
            </div>
          )}
          <CodeBlock code={problem.solution} filename={`${problem.id.replaceAll("-", "_")}.py`} />
        </CollapsibleSection>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--line-faint)]">
        <a
          href={`/categories/${categoryKey}/${topicKey}/practice`}
          className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ← back to {topicName.toLowerCase()} problems
        </a>
        <button
          onClick={markSolved}
          disabled={solved}
          className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {solved ? "✓ marked solved" : "mark solved"}
        </button>
      </div>
    </div>
  );
}
