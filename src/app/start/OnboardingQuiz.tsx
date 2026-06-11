"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudience } from "@/shared/audience/useAudience";
import { listAllTopics } from "@/categories/registry";
import { TopicTierMap } from "@/app/learn/TopicTierMap";
import {
  ENTRY_TOPIC,
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

  // The consequence line for the selected experience — computed from the live
  // registry (entry name, hidden/visible counts) so it can never drift from
  // what the map below actually does.
  const experienceEffect = useMemo(() => {
    if (!experience) return undefined;
    const entry = ENTRY_TOPIC[experience];
    const entryName = topics.find((t) => t.key === entry.topic)?.name ?? entry.topic;
    const hidden = personalizationFor(experience, topics).assumedKeys.size;
    return hidden === 0
      ? `Start at ${entryName} — the full ${topics.length}-topic map.`
      : `Start at ${entryName} — ${hidden} known topics hidden, ${topics.length - hidden} on your map.`;
  }, [experience, topics]);

  const complete = !!(experience && register && goal);

  // ── keep the payoff in view ──
  // The map is capped to a scrollable band (so the commit row + map top read
  // together, and mobile never becomes a 3000px wall). When the answer that
  // moves the ring changes (experience → startKey), nudge the band so the
  // "start here" node is visible without the learner hunting for it. We can't
  // touch TopicTierMap (sibling-owned), so we find the ringed node by the DOM
  // it already emits: the SVG node carries aria-label "… — your starting point"
  // and the mobile card carries a "start here" marker — both inside our band.
  const bandRef = useRef<HTMLDivElement>(null);
  const startKey = preview?.startKey;
  useEffect(() => {
    if (!startKey) return;
    const band = bandRef.current;
    if (!band) return;
    // Defer one frame so the map has re-rendered with the new ring first.
    const raf = requestAnimationFrame(() => {
      // The map renders BOTH layouts into the DOM and hides one with CSS
      // (desktop SVG = `hidden lg:block`, mobile cards = `lg:hidden`). The
      // hidden layout still resolves selectors but its nodes have a zero box,
      // so we gather every candidate ring marker and pick the first that is
      // actually laid out. Desktop = the SVG node whose aria-label ends in
      // "your starting point"; mobile = the start card (an <a> carrying the
      // "start here" marker text).
      const candidates: Element[] = [
        ...band.querySelectorAll('[aria-label*="your starting point"]'),
        ...Array.from(band.querySelectorAll("a")).filter((a) =>
          /start here/i.test(a.textContent ?? ""),
        ),
      ];
      const target = candidates.find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!target) return;
      // Scroll the BAND only (not the page): centre the ring within the band by
      // diffing bounding rects. `scrollIntoView` on an SVG <g> is flaky and can
      // bubble up to scroll the whole window, so we drive band.scrollTop directly.
      const bandRect = band.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta =
        targetRect.top - bandRect.top - (band.clientHeight - targetRect.height) / 2;
      const next = Math.max(
        0,
        Math.min(band.scrollTop + delta, band.scrollHeight - band.clientHeight),
      );
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      band.scrollTo({ top: next, behavior: reduce ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [startKey]);

  const begin = () => {
    if (!experience || !register || !goal) return;
    saveProfile({ experience, register, goal });
    router.push(entryHref({ experience, register, goal, updatedAt: 0 }));
  };

  return (
    <div className="flex flex-col gap-7">
      {/* ── the three questions — one compact row each ── */}
      <div className="flex flex-col gap-5">
        <QuestionRow label="Coding background" options={EXPERIENCE_OPTIONS} value={experience} onPick={setExperience} effect={experienceEffect} />
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
              ? <>ringed = where you&rsquo;ll start · topics your background already covers are tucked away (one tap brings them back)</>
              : <>answer the first question and watch the map adapt to you</>}
          </div>
        </div>
        {/* THE BAND — the map is capped to a scrollable strip so the commit row
            above and the map's top edge read together (the payoff is no longer
            below the fold), and on mobile the tier stack scrolls inside here
            instead of pushing the page into a multi-thousand-pixel wall. */}
        <div
          ref={bandRef}
          className="relative max-h-[70vh] sm:max-h-[60vh] overflow-y-auto overscroll-contain rounded-2xl"
          aria-label="Topic map preview — scrolls"
        >
          <TopicTierMap personalize={preview} />
        </div>
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
  effect,
}: {
  label: string;
  options: QuizOption<V>[];
  value: V | null;
  onPick: (v: V) => void;
  /** Overrides the picked option's static `effect` (used where the consequence
   *  is computed live, e.g. the experience row's entry + map counts). */
  effect?: string;
}) {
  const consequence = effect ?? options.find((o) => o.value === value)?.effect;
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
                title={o.hint}
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
        {/* ONE line under the row — the consequence of the tap. The "who am I"
            hint lives on hover (title) so the eye meets a single short line.
            For the style row the line is WRITTEN IN that style — picking previews it. */}
        <div className="mt-1 text-[12px] leading-snug min-h-[1.1em]">
          {consequence ? (
            <span className="text-[var(--accent-ink)]"><span aria-hidden="true">→ </span>{consequence}</span>
          ) : (
            <span className="text-[var(--text-faint)]">pick one</span>
          )}
        </div>
      </div>
    </div>
  );
}
