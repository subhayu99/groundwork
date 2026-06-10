import type { AudienceProfile, Experience, Goal, Register } from "./types";
import { DEFAULT_REGISTER } from "./types";

/**
 * AUDIENCE POLICY — the questionnaire's options, the per-register voice specs (the
 * single source of truth that keeps generated prose cohesive), and the rules that
 * turn a profile into routing + a content register.
 *
 * Everything here is domain-agnostic. A future domain reuses the same profile and
 * only adds its own entry rule — the onboarding itself never changes.
 */

export interface QuizOption<V extends string> {
  value: V;
  /** Short chip shown as the choice. */
  label: string;
  /** One-line plain-language explanation under the label. */
  hint: string;
}

/** Q1 — domain familiarity (routing). */
export const EXPERIENCE_OPTIONS: QuizOption<Experience>[] = [
  { value: "new-to-code", label: "New to coding", hint: "I haven't really written code before." },
  { value: "code-some", label: "I can code", hint: "I write code, but data structures & algorithms are fuzzy." },
  { value: "knows-dsa", label: "I know DSA", hint: "I've done this before — I want depth, or to sharpen up." },
];

/** Q2 — how it should be explained (sets the content register). Worded as
 *  background/comfort, NOT school/college, so it generalizes to any domain. */
export const REGISTER_OPTIONS: QuizOption<Register>[] = [
  { value: "intuitive", label: "Keep it concrete", hint: "Everyday analogies first, take it slow, explain every term." },
  { value: "structured", label: "Balanced", hint: "Mix the intuition with the real structure and notation." },
  { value: "rigorous", label: "Go rigorous", hint: "Be terse and precise — invariants, exact costs, edge cases." },
];

/** Q3 — why they're here (recommendations / pacing). */
export const GOAL_OPTIONS: QuizOption<Goal>[] = [
  { value: "understand", label: "Understand deeply", hint: "I'm here to really get it, no deadline." },
  { value: "interview", label: "Interview prep", hint: "Breadth + practice, and fast." },
  { value: "refresh", label: "Refresh", hint: "I knew this once — re-derive the intuition." },
];

/**
 * The VOICE SPEC per register — the contract every prose generator (and human)
 * follows so all topics read as one coherent voice within a register. Used by the
 * Phase-3 fan-out that authors `reg(...)` variants.
 */
export const REGISTER_VOICE: Record<Register, string> = {
  intuitive:
    "Concrete and everyday. Open with a physical, real-world analogy; keep sentences short; introduce no notation or jargon without an immediate plain-language gloss; prefer 'how many times you look' over 'O(n)'. Maximum scaffolding, slowest pace. Reader: a sharp 10th-grader with zero coding background.",
  structured:
    "Balance the intuition with the idea's actual structure. Introduce notation and Big-O, each with a one-line plain meaning the first time. Moderate pace, some formalism, fewer analogies. Reader: a college student or early-career developer.",
  rigorous:
    "Terse and precise. State the invariant, the exact complexity, the edge cases, and a one-line proof sketch. Assume comfort with notation; drop the hand-holding and the analogies. Fast. Reader: an experienced practitioner or someone in interview prep.",
};

/** Entry point per experience level (the first lesson the quiz drops you into). */
export const ENTRY_TOPIC: Record<Experience, { category: string; topic: string }> = {
  "new-to-code": { category: "programming-basics", topic: "variables" },
  "code-some": { category: "data-structures", topic: "arrays" },
  "knows-dsa": { category: "algorithms", topic: "binary-search" },
};

/** Resolve the active content register from a profile (or the default pre-onboarding). */
export function resolveRegister(profile: AudienceProfile | undefined): Register {
  return profile?.register ?? DEFAULT_REGISTER;
}

/** Where a profile should start. */
export function entryHref(profile: AudienceProfile | undefined): string {
  const e = profile?.experience ?? "new-to-code";
  const { category, topic } = ENTRY_TOPIC[e];
  return `/categories/${category}/${topic}`;
}
