import type { ReactNode } from "react";

/**
 * AUDIENCE MODEL — the durable, domain-agnostic learner profile.
 *
 * A questionnaire captures three independent things; together they decide WHERE a
 * learner starts and HOW each lesson is pitched. The profile is global (not tied to
 * any one domain), so as new domains plug in later — system design, networking, … —
 * the onboarding never has to change.
 *
 *   • experience → the ENTRY POINT and recommended path (routing)
 *   • register   → the content PITCH (abstraction / scaffolding / rigor)
 *   • goal       → what's recommended next + pacing (a soft modifier, not a 4th copy)
 */

/** Domain familiarity → routing. */
export type Experience = "new-to-code" | "code-some" | "knows-dsa";

/** Why they're here → recommendations / pacing (does NOT multiply content). */
export type Goal = "understand" | "interview" | "refresh";

/**
 * The content REGISTER — how a lesson's prose is pitched. Chosen from the quiz's
 * "how do you want it explained" (stage/background) question. These are the only
 * dimension that varies the prose, so content stays 3 variants, never 3×3×3.
 *
 *   intuitive  — concrete, everyday, heavily scaffolded (a sharp 10th-grader)
 *   structured — ideas + moderate formalism, notation introduced gently (college / early-career)
 *   rigorous   — terse, precise, invariants + exact complexity (experienced / interview)
 */
export type Register = "intuitive" | "structured" | "rigorous";

export const REGISTERS: Register[] = ["intuitive", "structured", "rigorous"];

/** Fallback pitch when a learner hasn't onboarded yet. */
export const DEFAULT_REGISTER: Register = "structured";

export interface AudienceProfile {
  experience: Experience;
  register: Register;
  goal: Goal;
  /** epoch ms the profile was set/updated (so we know they've onboarded). */
  updatedAt: number;
}

/* ── Register-aware content ──────────────────────────────────────────────────
 * A piece of lesson prose is EITHER a plain value (the shared `base`) OR a tagged
 * map of per-register variants. The tag (`__register`) is what lets us tell a
 * variant-map apart from a plain JSX node (both are objects). Author with `reg(...)`;
 * resolve at render with `pickRegister(...)`. A missing register falls back to base,
 * so a half-converted lesson always renders.
 */
export interface RegisterMap<T> {
  readonly __register: true;
  base: T;
  intuitive?: T;
  structured?: T;
  rigorous?: T;
}

export type Registered<T> = T | RegisterMap<T>;

/** Wrap per-register variants. `base` is required and is the universal fallback. */
export function reg<T>(map: { base: T; intuitive?: T; structured?: T; rigorous?: T }): RegisterMap<T> {
  return { __register: true, ...map };
}

export function isRegisterMap<T>(v: Registered<T> | undefined): v is RegisterMap<T> {
  return typeof v === "object" && v !== null && (v as RegisterMap<T>).__register === true;
}

/** Resolve a (possibly register-mapped) value for the active register, base-fallback. */
export function pickRegister<T>(v: Registered<T> | undefined, register: Register): T | undefined {
  if (v === undefined) return undefined;
  if (isRegisterMap(v)) return v[register] ?? v.base;
  return v;
}

/** Convenience for the common prose case. */
export type RegisteredNode = Registered<ReactNode>;
