"use client";

import { useState } from "react";
import type { BeatVisualApi } from "./types";

/**
 * PredictGate — the recognition-tap prediction primitive for wedge beats.
 *
 * "What happens next?" + 2-4 tappable choice pills. One tap is the REAL gating
 * interaction: it reveals gentle feedback (correct → accent ring + "exactly";
 * wrong → soft muted highlight, the choice's one-line `note`, and the correct
 * pill revealed subtly) and then calls `api.onInteractionDone()` REGARDLESS of
 * correctness — gates exist for engagement, never punishment, so one tap always
 * unlocks "Next" after feedback. Never ask for typing or arithmetic here
 * (zero-grunt-work rule): recognition taps only.
 *
 * This is HTML (not SVG): host it inside a beat's `visual` render-fn via
 * <foreignObject> on the canvas, or inside any HTML region the visual controls.
 * The root opts back into pointer events because the layouts' panel layers are
 * `pointer-events-none`.
 *
 * Covered by src/tests/predict.test.tsx (choice → feedback → onInteractionDone,
 * for both correct and wrong taps, and first-tap-decides). Manual check: open a
 * wedge beat using this gate — "Next" stays locked until a pill is tapped, then
 * unlocks whether or not the tap was correct, and the feedback line appears.
 */
export interface PredictChoice {
  id: string;
  label: string;
  correct?: boolean;
  /** One-line explanation shown when this (wrong) choice is picked. */
  note?: string;
}

export interface PredictGateProps {
  question: string;
  /** 2-4 recognition choices. */
  choices: PredictChoice[];
  api: BeatVisualApi;
  onRevealed?: (chosenId: string, correct: boolean) => void;
}

export function PredictGate({ question, choices, api, onRevealed }: PredictGateProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const revealed = chosen !== null;
  const chosenChoice = revealed ? choices.find((c) => c.id === chosen) : undefined;
  const choseCorrect = !!chosenChoice?.correct;

  const pick = (c: PredictChoice) => {
    if (revealed) return; // the first tap decides — the gate is already open
    setChosen(c.id);
    onRevealed?.(c.id, !!c.correct);
    api.onInteractionDone();
  };

  return (
    <div data-predict-gate className="pointer-events-auto rounded-xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3.5 py-3">
      <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">predict</div>
      <div className="mt-0.5 text-[13px] leading-snug font-medium text-[var(--text)]">{question}</div>
      <div role="group" aria-label={question} className="mt-2.5 flex flex-wrap gap-2">
        {choices.map((c) => {
          const isChosen = chosen === c.id;
          // After the reveal: the pick keeps its state; the correct pill surfaces
          // subtly even when it wasn't picked. No reds, no shake — gentle only.
          const tone = !revealed
            ? "border-[var(--line)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
            : isChosen && c.correct
              ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-card)]"
              : isChosen
                ? "border-[var(--line-strong)] bg-[var(--bg-inset)] text-[var(--text)]"
                : c.correct
                  ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                  : "border-[var(--line-faint)] text-[var(--text-faint)]";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              disabled={revealed}
              aria-pressed={isChosen}
              className={`min-h-[40px] px-3.5 rounded-full border text-[13px] leading-snug text-left transition-colors disabled:cursor-default ${tone}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {/* feedback — role=status so the result is announced without stealing focus */}
      <div role="status" className="min-h-0">
        {revealed && (
          <p className="mt-2 text-[12.5px] leading-snug text-[var(--text-muted)]">
            {choseCorrect ? (
              <>
                <span className="font-medium not-italic text-[var(--accent-ink)]">exactly</span>
                {chosenChoice?.note ? <> &mdash; {chosenChoice.note}</> : null}
              </>
            ) : (
              <>
                {chosenChoice?.note ?? "not quite"} <span className="text-[var(--text-faint)]">&mdash; the highlighted one is what happens.</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
