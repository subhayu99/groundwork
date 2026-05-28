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
  const [activeStep, setActiveStep] = useState(topicProgress.derivation.currentStep);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    setActiveStep(topicProgress.derivation.currentStep);
  }, [topicProgress.derivation.currentStep]);

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
    if (isTopicCompleted) return "done";
    if (stepNumber < activeStep) return "done";
    if (stepNumber === activeStep) return "active";
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
