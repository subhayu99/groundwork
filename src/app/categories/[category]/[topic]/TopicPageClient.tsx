"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chrome } from "@/shared/layout/Chrome";
import { TopicLayout } from "@/shared/layout/TopicLayout";
import { DerivationEngine } from "@/shared/derivation/DerivationEngine";
import { NextStepsSection } from "@/shared/next-steps/NextStepsSection";
import { AccessGate } from "@/shared/access/AccessGate";
import { getCategory, getTopic, listAllTopics } from "@/categories/registry";
import { getPrinciple } from "@/principles/registry";
import { getTopicBundle } from "@/categories/topic-registry";
import { codeMaps } from "@/categories/code-maps";
import { prepareCode, resolveLines } from "@/shared/code/syncAnchors";
import { emitEvent } from "@/shared/analytics/events";
import { useProgress } from "@/shared/progress/useProgress";
import { notFound } from "next/navigation";
import { getLessonSpec } from "@/shared/lesson/registry";
import { LessonRuntime } from "@/shared/lesson/LessonRuntime";

interface Props {
  categoryKey: string;
  topicKey: string;
}

export function TopicPageClient({ categoryKey, topicKey }: Props) {
  const cat = getCategory(categoryKey);
  const meta = getTopic(categoryKey, topicKey);
  // The classic bundle (steps/visualizer/problems) only exists for the original
  // two categories; a scene lesson needs just `meta` + its LessonSpec, so this may
  // be undefined for new tracks (e.g. programming-basics) and that's fine.
  const bundle = getTopicBundle(categoryKey, topicKey);
  const [currentStep, setCurrentStep] = useState(1);
  const [wedgeInteracted, setWedgeInteracted] = useState(false);
  // Live code line(s) emitted by the visualizer as it animates / on interaction,
  // as @sync labels (or legacy line numbers). Overrides the coarse step→line
  // map; reset when the step changes.
  const [liveLines, setLiveLines] = useState<(number | string)[] | null>(null);
  useEffect(() => setLiveLines(null), [currentStep]);
  const { getTopic: getTopicProgress, updateTopic } = useProgress();
  const topicProgress = getTopicProgress(categoryKey, topicKey);
  const everCompleted = topicProgress.derivation.completed;

  useEffect(() => {
    emitEvent({ type: "topic_opened", category: categoryKey, topic: topicKey });
  }, [categoryKey, topicKey]);

  if (!cat || !meta) notFound();

  // Converted topics render the new annotated-canvas lesson (replace on branch).
  // Practice problems ride along (shown below the floating code panel — no second
  // page); finishing the last beat marks the topic complete in progress.
  const lessonSpec = getLessonSpec(categoryKey, topicKey);
  if (lessonSpec) {
    const practice = (bundle?.problems ?? []).map((p) => ({
      title: p.title,
      href: `/categories/${categoryKey}/${topicKey}/practice/${p.id}`,
      difficulty: p.difficulty,
    }));
    const all = listAllTopics();
    const idx = all.findIndex((t) => t.category === categoryKey && t.key === topicKey);
    const prevT = idx > 0 ? all[idx - 1] : undefined;
    const nextT = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined;
    const nav = {
      homeHref: "/",
      categoryName: cat.name,
      categoryHref: `/categories/${categoryKey}`,
      prev: prevT ? { name: prevT.name, href: `/categories/${prevT.category}/${prevT.key}` } : undefined,
      next: nextT ? { name: nextT.name, href: `/categories/${nextT.category}/${nextT.key}` } : undefined,
    };
    const prerequisites = (meta.prerequisites ?? [])
      .map((k) => {
        const t = all.find((x) => x.key === k);
        if (!t) return null;
        return {
          name: t.name,
          href: `/categories/${t.category}/${t.key}`,
          completed: getTopicProgress(t.category, t.key).derivation.completed,
        };
      })
      .filter(Boolean) as { name: string; href: string; completed: boolean }[];
    return (
      <LessonRuntime
        spec={lessonSpec}
        practice={practice}
        nav={nav}
        prerequisites={prerequisites}
        initiallyCompleted={everCompleted}
        onComplete={() => {
          emitEvent({ type: "topic_completed", category: categoryKey, topic: topicKey });
          // Full credit on completion REGARDLESS of register depth: a rigorous
          // learner's 3-beat cut and an intuitive learner's full derivation both
          // complete the TOPIC, so we stamp the unfiltered beat count — never a
          // filtered subtotal that would read as "3 of 7".
          updateTopic(categoryKey, topicKey, (tp) => ({
            ...tp,
            derivation: {
              ...tp.derivation,
              completed: true,
              currentStep: lessonSpec.beats.length,
              completedSteps: Array.from(
                new Set([
                  ...tp.derivation.completedSteps,
                  ...lessonSpec.beats.map((_, i) => i + 1),
                ]),
              ),
            },
          }));
        }}
      />
    );
  }

  // Classic (non-scene) topics require the full bundle.
  if (!bundle) notFound();
  const { meta: topic, steps, Visualizer, pythonCode, wedgeStep, wedgeGating, unlockCodeAtStep, naiveThroughStep, problems, nextSteps } = bundle;
  const problemCount = problems?.length ?? 0;
  const unlockAt = unlockCodeAtStep ?? steps.length;

  // Strip @sync anchors for display; build the label→line index (single source
  // of truth = the .py). Resolution is tolerant of legacy raw line numbers.
  const { code: displayCode, labelToLine } = prepareCode(pythonCode);
  const stepCodeLines = codeMaps[`${categoryKey}/${topicKey}`];

  // Naive phase: steps that show a brute-force demo NOT in the final code. There
  // we suppress the coarse step→line fallback so the panel never highlights a
  // line that contradicts the slow demo on screen (e.g. a crawl "lighting up"
  // the direct-index line). A live emit, if any, still wins.
  const naiveThrough = naiveThroughStep ?? 2;
  const inNaivePhase = currentStep <= naiveThrough;
  const codeFallback = inNaivePhase
    ? undefined
    : stepCodeLines?.[Math.min(currentStep, steps.length)];

  // Progressive reveal: dim lines for steps not yet reached. A completed topic
  // reveals everything; otherwise reveal up to the furthest step reached.
  const revealedThrough = everCompleted
    ? steps.length
    : Math.max(currentStep, ...topicProgress.derivation.completedSteps, 1);
  const codeRevealedLines = stepCodeLines
    ? resolveLines(
        Object.entries(stepCodeLines)
          .filter(([s]) => Number(s) <= revealedThrough)
          .flatMap(([, ls]) => ls),
        labelToLine,
      )
    : undefined;

  const allTopics = listAllTopics();
  const currentIndex = allTopics.findIndex(
    (t) => t.category === categoryKey && t.key === topicKey,
  );
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex >= 0 && currentIndex < allTopics.length - 1
      ? allTopics[currentIndex + 1]
      : null;

  // The wedge counts as passed if the user just interacted, OR if they've
  // already cleared it before (the topic is complete, or this step is recorded
  // as completed). Without this, revisiting/reloading a finished topic re-locks
  // the gate and demands the interaction again.
  const wedgePassed =
    wedgeInteracted ||
    everCompleted ||
    (wedgeStep ? topicProgress.derivation.completedSteps.includes(wedgeStep) : false);

  const stepGating = wedgeStep && wedgeGating
    ? {
        [wedgeStep]: {
          disabled: !wedgePassed,
          label: wedgePassed ? wedgeGating.enabledLabel : wedgeGating.disabledLabel,
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
                {topic.prerequisites.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                      builds on
                    </span>
                    {topic.prerequisites.map((key) => {
                      const pre = allTopics.find((t) => t.key === key);
                      return pre ? (
                        <Link
                          key={key}
                          href={`/categories/${pre.category}/${pre.key}`}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--bg-card)] border border-[var(--line-faint)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)] transition-colors"
                        >
                          {pre.name}
                        </Link>
                      ) : null;
                    })}
                  </div>
                )}
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
              <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-[var(--line-faint)]">
                {prevTopic ? (
                  <Link
                    href={`/categories/${prevTopic.category}/${prevTopic.key}`}
                    className="flex flex-col justify-center min-h-[44px] py-2"
                  >
                    <span className="text-[10px] font-mono uppercase text-[var(--text-faint)]">
                      previous
                    </span>
                    <span className="text-sm text-[var(--text)] hover:text-[var(--accent-ink)]">
                      ← {prevTopic.name}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {nextTopic ? (
                  <Link
                    href={`/categories/${nextTopic.category}/${nextTopic.key}`}
                    className="flex flex-col justify-center min-h-[44px] py-2 text-right"
                  >
                    <span className="text-[10px] font-mono uppercase text-[var(--text-faint)]">
                      next
                    </span>
                    <span className="text-sm text-[var(--text)] hover:text-[var(--accent-ink)]">
                      {nextTopic.name} →
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </>
          }
          visualization={
            <Visualizer
              step={currentStep}
              onWedgeInteraction={() => setWedgeInteracted(true)}
              onActiveLine={setLiveLines}
            />
          }
          code={displayCode}
          codeDrawerLocked={false}
          codeFilename={`${topicKey.replaceAll("-", "_")}.py`}
          codeActiveLines={resolveLines(liveLines ?? codeFallback, labelToLine)}
          codeRevealedLines={codeRevealedLines}
          codeHint={inNaivePhase && !liveLines ? "Deriving the real approach — the code lights up as you build it" : undefined}
        />
      </div>
    </AccessGate>
  );
}
