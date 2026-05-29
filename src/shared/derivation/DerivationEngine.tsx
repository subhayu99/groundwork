"use client";

import { useEffect, useState } from "react";
import { Card, CardState } from "./Card";
import { DerivationStep } from "./types";
import { useProgress } from "@/shared/progress/useProgress";
import { emitEvent } from "@/shared/analytics/events";

interface StepGating {
  disabled?: boolean;
  label?: string;
}

interface DerivationEngineProps {
  categoryKey: string;
  topicKey: string;
  steps: DerivationStep[];
  /** Called when the user completes the final step */
  onComplete?: () => void;
  /** Called when the active step changes */
  onStepChange?: (step: number) => void;
  /** Optional per-step gating: override action button enabled state and label.
   *  Keyed by step number. */
  stepGating?: Record<number, StepGating>;
}

export function DerivationEngine({
  categoryKey,
  topicKey,
  steps,
  onComplete,
  onStepChange,
  stepGating,
}: DerivationEngineProps) {
  const { getTopic, updateTopic } = useProgress();
  const topicProgress = getTopic(categoryKey, topicKey);
  // On a completed topic, start with NO card auto-expanded (all render "done"),
  // so the final step isn't re-opened with a live "Mark complete" button on
  // reload. Mid-lesson, mirror the saved currentStep as the active card.
  const [activeStep, setActiveStep] = useState(
    topicProgress.derivation.completed ? steps.length + 1 : topicProgress.derivation.currentStep,
  );
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const completed = topicProgress.derivation.completed;
  const currentStep = topicProgress.derivation.currentStep;
  useEffect(() => {
    // Once progress loads: a completed topic opens with NO card auto-expanded
    // (all "done"); an in-progress topic mirrors the saved step. Revisiting a
    // card (setActiveStep) sticks because these deps don't change on revisit.
    setActiveStep(completed ? steps.length + 1 : currentStep);
  }, [currentStep, completed, steps.length]);

  useEffect(() => {
    onStepChange?.(activeStep);
  }, [activeStep, onStepChange]);

  const advanceStep = () => {
    const next = activeStep + 1;
    if (next > steps.length) {
      updateTopic(categoryKey, topicKey, (tp) => ({
        ...tp,
        derivation: {
          ...tp.derivation,
          currentStep: steps.length,
          completedSteps: Array.from(new Set([...tp.derivation.completedSteps, activeStep])),
          completed: true,
        },
      }));
      emitEvent({ type: "topic_completed", category: categoryKey, topic: topicKey });
      onComplete?.();
      // Collapse the last card to "done" (currentStep stays put, so the sync
      // effect won't reopen it) — clear feedback that completion registered,
      // alongside the Next Steps panel the lesson page now reveals.
      setActiveStep(steps.length + 1);
      return;
    }

    updateTopic(categoryKey, topicKey, (tp) => ({
      ...tp,
      derivation: {
        ...tp.derivation,
        currentStep: next,
        completedSteps: Array.from(new Set([...tp.derivation.completedSteps, activeStep])),
      },
    }));
    emitEvent({
      type: "step_completed",
      category: categoryKey,
      topic: topicKey,
      step: activeStep,
    });
    setActiveStep(next);
    setActiveCardIndex(0);
  };

  const revisitStep = (step: number) => {
    setActiveStep(step);
    setActiveCardIndex(0);
  };

  const isTopicCompleted = topicProgress.derivation.completed;

  const renderCardState = (stepNumber: number): CardState => {
    // The currently-focused step is always active (expanded), even on a
    // completed topic — that's how a user revisits a card and reads it.
    if (stepNumber === activeStep) return "active";
    if (stepNumber < activeStep) return "done";
    // After completion, future steps are visible but collapsed so the
    // user can click any one to expand it. Before completion they stay hidden.
    if (isTopicCompleted) return "done";
    return "upcoming";
  };

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const state = renderCardState(step.step);
        if (state === "upcoming") return null;
        const card = step.cards[state === "active" ? activeCardIndex : 0];

        const gating = stepGating?.[step.step];
        const isLastCardInStep = activeCardIndex >= step.cards.length - 1;
        const effectiveLabel =
          gating?.label ?? card.actionLabel ?? "Continue";

        return (
          <Card
            key={step.step}
            step={String(step.step).padStart(2, "0")}
            label={card.label}
            title={card.title}
            state={state}
            body={typeof card.body === "function" ? card.body() : card.body}
            expand={card.expand ? (typeof card.expand === "function" ? card.expand() : card.expand) : undefined}
            onRevisit={state === "done" ? () => revisitStep(step.step) : undefined}
            action={
              state === "active" ? (
                <ActionButton
                  label={effectiveLabel}
                  disabled={gating?.disabled ?? false}
                  onClick={() => {
                    if (!isLastCardInStep) {
                      setActiveCardIndex((i) => i + 1);
                    } else {
                      advanceStep();
                    }
                  }}
                />
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-no-revisit
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--accent-soft)]"
    >
      <span>{label}</span>
      <span>→</span>
    </button>
  );
}
