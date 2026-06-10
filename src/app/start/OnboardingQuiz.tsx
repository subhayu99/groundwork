"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudience } from "@/shared/audience/useAudience";
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  REGISTER_OPTIONS,
  entryHref,
  type QuizOption,
} from "@/shared/audience/policy";
import type { Experience, Goal, Register } from "@/shared/audience/types";

/**
 * THE FRONT DOOR — three quick questions that set the learner profile:
 * where you start (experience), how lessons are pitched (register), and what
 * we optimize your path for (goal). Skippable, editable any time in settings,
 * and deliberately domain-agnostic so future tracks (system design, networking,
 * …) reuse the same answers — onboarding never has to change.
 */
export function OnboardingQuiz() {
  const router = useRouter();
  const { profile, onboarded, loaded, saveProfile } = useAudience();

  // Prefill from an existing profile so "retake" edits rather than restarts.
  const [experience, setExperience] = useState<Experience | null>(profile?.experience ?? null);
  const [register, setRegister] = useState<Register | null>(profile?.register ?? null);
  const [goal, setGoal] = useState<Goal | null>(profile?.goal ?? null);
  // Late-loading localStorage: hydrate the picks once the stored profile arrives,
  // but never clobber a choice the user has already tapped this visit.
  const [hydrated, setHydrated] = useState(false);
  if (loaded && !hydrated) {
    setHydrated(true);
    if (profile) {
      setExperience((v) => v ?? profile.experience);
      setRegister((v) => v ?? profile.register);
      setGoal((v) => v ?? profile.goal);
    }
  }

  const complete = !!(experience && register && goal);

  const begin = () => {
    if (!experience || !register || !goal) return;
    saveProfile({ experience, register, goal });
    router.push(entryHref({ experience, register, goal, updatedAt: 0 }));
  };

  return (
    <div className="flex flex-col gap-10">
      <Question
        kicker="01 · where you're coming from"
        title="How much have you coded?"
        options={EXPERIENCE_OPTIONS}
        value={experience}
        onPick={setExperience}
      />
      <Question
        kicker="02 · how it should be explained"
        title="How do you like ideas explained?"
        options={REGISTER_OPTIONS}
        value={register}
        onPick={setRegister}
      />
      <Question
        kicker="03 · what you're here for"
        title="What's the goal?"
        options={GOAL_OPTIONS}
        value={goal}
        onPick={setGoal}
      />

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          onClick={begin}
          disabled={!complete}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {onboarded ? "Save & continue →" : "Start learning →"}
        </button>
        <Link
          href="/learn"
          className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          skip — browse the map
        </Link>
        {onboarded && (
          <span className="basis-full text-[12.5px] text-[var(--text-faint)]">
            You&rsquo;re already set up — saving updates your profile. Change it any time in settings.
          </span>
        )}
      </div>
    </div>
  );
}

function Question<V extends string>({
  kicker,
  title,
  options,
  value,
  onPick,
}: {
  kicker: string;
  title: string;
  options: QuizOption<V>[];
  value: V | null;
  onPick: (v: V) => void;
}) {
  return (
    <fieldset>
      <legend className="contents">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent-ink)] mb-1">{kicker}</div>
        <div className="text-lg font-semibold text-[var(--text)] mb-3">{title}</div>
      </legend>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={title}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(o.value)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                on
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)]"
              }`}
            >
              <div className={`font-semibold mb-0.5 ${on ? "text-[var(--accent-ink)]" : "text-[var(--text)]"}`}>
                {o.label}
              </div>
              <div className="text-[13px] leading-snug text-[var(--text-muted)]">{o.hint}</div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
