"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudience } from "@/shared/audience/useAudience";
import { listAllTopics } from "@/categories/registry";
import { TopicTierMap } from "@/app/learn/TopicTierMap";
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  REGISTER_OPTIONS,
  entryHref,
  personalizationFor,
  type QuizOption,
} from "@/shared/audience/policy";
import type { Experience, Goal, Register } from "@/shared/audience/types";

/**
 * THE FRONT DOOR — three compact questions with the topic map LIVE underneath:
 * every tap re-personalizes the map (your starting point ringed, tracks your
 * background covers rendered quiet), so you see exactly what your answers mean
 * before committing. Answers persist to the device (localStorage) — an account
 * can sync them later — and stay editable in settings. Domain-agnostic, so
 * future tracks (system design, networking, …) plug in without changing this.
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

  const topics = useMemo(() => listAllTopics(), []);
  // The live preview — recomputed on every answer change; undefined until the
  // first question is answered (the map shows its generic view till then).
  const preview = useMemo(
    () => (experience ? personalizationFor(experience, topics) : undefined),
    [experience, topics],
  );

  const complete = !!(experience && register && goal);

  const begin = () => {
    if (!experience || !register || !goal) return;
    saveProfile({ experience, register, goal });
    router.push(entryHref({ experience, register, goal, updatedAt: 0 }));
  };

  return (
    <div className="flex flex-col gap-7">
      {/* ── the three questions — one compact row each ── */}
      <div className="flex flex-col gap-5">
        <QuestionRow label="Coding background" options={EXPERIENCE_OPTIONS} value={experience} onPick={setExperience} />
        <QuestionRow label="Explanation style" options={REGISTER_OPTIONS} value={register} onPick={setRegister} />
        <QuestionRow label="Your goal" options={GOAL_OPTIONS} value={goal} onPick={setGoal} />
      </div>

      {/* ── commit row ── */}
      <div className="flex flex-wrap items-center gap-4">
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
          skip for now
        </Link>
        <span className="text-[12px] text-[var(--text-faint)]">
          Saved on this device · change any time in settings
        </span>
      </div>

      {/* ── THE LIVE MAP — re-personalizes with every answer ── */}
      <div className="border-t border-[var(--line-faint)] pt-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent-ink)]">
            your map · updates as you answer
          </div>
          <div className="text-[12.5px] text-[var(--text-muted)]">
            {preview
              ? <>ringed = where you&rsquo;ll start · faded = assumed from your background (always open for a refresh)</>
              : <>answer the first question and watch the map adapt to you</>}
          </div>
        </div>
        <TopicTierMap personalize={preview} />
      </div>
    </div>
  );
}

/** One compact question: short label on the left, segmented options beside it,
 *  the selected option's one-line hint underneath. */
function QuestionRow<V extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: QuizOption<V>[];
  value: V | null;
  onPick: (v: V) => void;
}) {
  const picked = options.find((o) => o.value === value);
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-5">
      <div className="sm:w-44 shrink-0 sm:pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
        {label}
      </div>
      <div className="min-w-0">
        <div className="inline-flex flex-wrap rounded-lg border border-[var(--line)] bg-[var(--bg-card)] p-1 gap-1" role="radiogroup" aria-label={label}>
          {options.map((o) => {
            const on = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(o.value)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-md text-[12.5px] transition-colors ${
                  on
                    ? "bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)] font-medium"
                    : "border border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="mt-1 text-[12px] leading-snug text-[var(--text-faint)] min-h-[1.1em]">
          {picked ? picked.hint : "pick one"}
        </div>
      </div>
    </div>
  );
}
