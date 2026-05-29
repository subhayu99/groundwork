"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chrome } from "@/shared/layout/Chrome";
import { TopicLayout } from "@/shared/layout/TopicLayout";
import { DerivationEngine } from "@/shared/derivation/DerivationEngine";
import { NextStepsSection } from "@/shared/next-steps/NextStepsSection";
import { AccessGate } from "@/shared/access/AccessGate";
import { getCategory } from "@/categories/registry";
import { getPrinciple } from "@/principles/registry";
import { getTopicBundle } from "@/categories/topic-registry";
import { emitEvent } from "@/shared/analytics/events";
import { useProgress } from "@/shared/progress/useProgress";
import { notFound } from "next/navigation";

interface Props {
  categoryKey: string;
  topicKey: string;
}

export function TopicPageClient({ categoryKey, topicKey }: Props) {
  const cat = getCategory(categoryKey);
  const bundle = getTopicBundle(categoryKey, topicKey);
  const [currentStep, setCurrentStep] = useState(1);
  const [wedgeInteracted, setWedgeInteracted] = useState(false);
  const { getTopic: getTopicProgress } = useProgress();
  const topicProgress = getTopicProgress(categoryKey, topicKey);
  const everCompleted = topicProgress.derivation.completed;

  useEffect(() => {
    emitEvent({ type: "topic_opened", category: categoryKey, topic: topicKey });
  }, [categoryKey, topicKey]);

  if (!cat || !bundle) notFound();

  const { meta: topic, steps, Visualizer, pythonCode, wedgeStep, wedgeGating, unlockCodeAtStep, problems, nextSteps } = bundle;
  const problemCount = problems?.length ?? 0;
  const unlockAt = unlockCodeAtStep ?? steps.length;

  const stepGating = wedgeStep && wedgeGating
    ? {
        [wedgeStep]: {
          disabled: !wedgeInteracted,
          label: wedgeInteracted ? wedgeGating.enabledLabel : wedgeGating.disabledLabel,
        },
      }
    : undefined;

  return (
    <AccessGate tier={topic.tier}>
      <div className="h-screen flex flex-col">
        <Chrome
          breadcrumb={[
            { label: cat.name, href: `/categories/${categoryKey}` },
            { label: topic.name },
          ]}
          difficulty={topic.difficulty === "foundation" ? undefined : topic.difficulty}
          stepCount={steps.length}
          currentStep={currentStep}
        />
        <TopicLayout
          cards={
            <>
              <div className="mb-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
                  {cat.name} · topic
                </div>
                <h1 className="text-3xl font-semibold text-[var(--text)]">{topic.name}</h1>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {topic.principles.map((p) => (
                    <Link
                      key={p}
                      href={`/principles/${p}`}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)] hover:border-[var(--line-strong)] transition-colors"
                    >
                      {getPrinciple(p)?.displayName ?? p.replaceAll("-", " ")}
                    </Link>
                  ))}
                </div>
                <div className="mt-2 text-[10px] font-mono text-[var(--text-faint)] flex items-center gap-3 flex-wrap">
                  <span>~{topic.estimatedMinutes} min derivation</span>
                  {problemCount > 0 && (
                    <Link
                      href={`/categories/${categoryKey}/${topicKey}/practice`}
                      className="text-[var(--accent-ink)] hover:underline"
                    >
                      · {problemCount} practice problem{problemCount === 1 ? "" : "s"} →
                    </Link>
                  )}
                </div>
              </div>
              <DerivationEngine
                categoryKey={categoryKey}
                topicKey={topicKey}
                steps={steps}
                onStepChange={setCurrentStep}
                stepGating={stepGating}
              />
              {nextSteps && everCompleted && (
                <NextStepsSection
                  content={nextSteps}
                  categoryKey={categoryKey}
                  topicKey={topicKey}
                  hasInAppPractice={problemCount > 0}
                />
              )}
            </>
          }
          visualization={
            <Visualizer step={currentStep} onWedgeInteraction={() => setWedgeInteracted(true)} />
          }
          code={pythonCode}
          codeDrawerLocked={!everCompleted && currentStep < unlockAt}
          codeFilename={`${topicKey.replaceAll("-", "_")}.py`}
        />
      </div>
    </AccessGate>
  );
}
