"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { NextStepsContent } from "./types";

interface NextStepsSectionProps {
  content: NextStepsContent;
  categoryKey: string;
  topicKey: string;
  /** When true, the topic ships in-app practice problems → link the practice route. */
  hasInAppPractice: boolean;
}

const diffColor: Record<string, string> = {
  easy: "var(--diff-easy)",
  medium: "var(--diff-med)",
  hard: "var(--diff-hard)",
};

/**
 * Step 08 — "Next Steps". A summary panel rendered in the lesson column once the
 * 7-step derivation is complete. Not part of the Socratic DerivationEngine (no
 * gating, no action button) — it's a launchpad: recap, practice, where the idea
 * shows up in the real world, related topics, and outside resources.
 */
export function NextStepsSection({
  content,
  categoryKey,
  topicKey,
  hasInAppPractice,
}: NextStepsSectionProps) {
  const { recap, practiceProblems, realWorld, relatedTopics, resources } = content;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.65, 0.3, 1] }}
      className="relative rounded-2xl border border-[var(--accent-line)] bg-[var(--bg-card-hi)] p-5 mt-3"
      data-comment-anchor="step-08"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[10px] font-mono text-[var(--accent-ink)]">
          08
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          next steps
        </span>
      </div>

      <h3 className="font-semibold text-[var(--text)] text-lg mb-3">
        You&rsquo;ve got the idea. Here&rsquo;s where it takes you.
      </h3>

      {recap && (
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">{recap}</p>
      )}

      {/* Practice */}
      {(practiceProblems.length > 0 || hasInAppPractice) && (
        <Section title="practice">
          {hasInAppPractice && (
            <Link
              href={`/categories/${categoryKey}/${topicKey}/practice`}
              className="flex items-center min-h-[44px] rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2.5 mb-2 text-sm text-[var(--accent-ink)] hover:border-[var(--line-strong)] transition-colors"
            >
              Try the guided practice problems in here →
            </Link>
          )}
          <ul className="space-y-2">
            {practiceProblems.map((p) => (
              <li
                key={p.name}
                className="rounded-lg border border-[var(--line-faint)] bg-[var(--bg-card)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text)] hover:text-[var(--accent-ink)] hover:underline"
                    >
                      {p.name} ↗
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--text)]">{p.name}</span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase shrink-0"
                    style={{ color: diffColor[p.difficulty] ?? "var(--text-muted)" }}
                  >
                    {p.difficulty}
                  </span>
                </div>
                {p.hints.length > 0 && (
                  <details className="mt-1.5">
                    <summary className="inline-flex items-center min-h-[32px] text-xs font-mono text-[var(--text-faint)] cursor-pointer hover:text-[var(--text-muted)] select-none">
                      hints
                    </summary>
                    <ol className="mt-1.5 ml-4 list-decimal space-y-1 text-xs text-[var(--text-muted)] leading-relaxed">
                      {p.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ol>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Related topics */}
      {relatedTopics.length > 0 && (
        <Section title="where to go next">
          <div className="space-y-2">
            {relatedTopics.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="block rounded-lg border border-[var(--line-faint)] bg-[var(--bg-card)] px-3 py-2.5 hover:border-[var(--line-strong)] transition-colors group"
              >
                <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent-ink)]">
                  {t.name} →
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
                  {t.reason}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Real world */}
      {realWorld.length > 0 && (
        <Section title="where this shows up in the real world">
          <div className="space-y-2.5">
            {realWorld.map((r) => (
              <div key={r.title}>
                <div className="text-sm font-medium text-[var(--text)]">{r.title}</div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <Section title="go deeper">
          <ul className="space-y-1.5">
            {resources.map((r) => (
              <li key={r.title} className="text-sm">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--accent-ink)] hover:underline"
                  >
                    <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] mr-2">
                      {r.type}
                    </span>
                    {r.title} ↗
                  </a>
                ) : (
                  <span className="text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] mr-2">
                      {r.type}
                    </span>
                    {r.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
