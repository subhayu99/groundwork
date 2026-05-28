"use client";

import { useEffect, useState } from "react";
import { Chrome } from "@/shared/layout/Chrome";
import { TopicLayout } from "@/shared/layout/TopicLayout";
import { DerivationEngine } from "@/shared/derivation/DerivationEngine";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { AccessGate } from "@/shared/access/AccessGate";
import { getCategory } from "@/categories/registry";
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

  const { meta: topic, steps, Visualizer, pythonCode, wedgeStep, wedgeGating, unlockCodeAtStep } = bundle;
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
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)]"
                    >
                      {p.replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[10px] font-mono text-[var(--text-faint)]">
                  ~{topic.estimatedMinutes} min derivation
                </div>
              </div>
              <DerivationEngine
                categoryKey={categoryKey}
                topicKey={topicKey}
                steps={steps}
                onStepChange={setCurrentStep}
                stepGating={stepGating}
              />
            </>
          }
          visualization={
            <Visualizer step={currentStep} onWedgeInteraction={() => setWedgeInteracted(true)} />
          }
          codeDrawer={<CodeHighlight code={pythonCode} filename="algorithm.py" />}
          codeDrawerLocked={!everCompleted && currentStep < unlockAt}
        />
      </div>
    </AccessGate>
  );
}
