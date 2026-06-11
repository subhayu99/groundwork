import type { AudienceProfile } from "@/shared/audience/types";

/**
 * v1 → v2 (L0.5): adds per-topic `review` (recall scheduling) and state-level
 * `meta` (visit history — raw material for streaks/daily goal in L4.1).
 *
 * THE RULE (H10): no code path may ever silently drop a user's `categories`
 * data. Version mismatches go through `migrate()` (see migrate.ts), which
 * salvages every field that parses — never returns empty state when topic
 * data exists.
 */
export const PROGRESS_SCHEMA_VERSION = 2;

/** Review outcomes kept per topic — capped to the most recent N on write. */
export const MAX_REVIEW_OUTCOMES = 20;

/** Distinct visit days kept in meta — capped to the most recent N on write. */
export const MAX_VISIT_DAYS = 366;

/** One recall attempt (from the L4.1 recall deck / re-derivation shelf). */
export interface ReviewOutcome {
  /** Epoch ms of the attempt. */
  at: number;
  correct: boolean;
}

/**
 * Per-topic recall scheduling (v2). Written by the L4 recall surfaces; the
 * model ships first so progress saved today already has a home for it.
 */
export interface ReviewState {
  /** Epoch ms of the most recent recall attempt. */
  lastRecallAt?: number;
  /** Epoch ms when this topic next comes due for review. */
  nextDueAt?: number;
  /** Consecutive correct recalls (resets on a miss). */
  streak?: number;
  /** Most recent attempts, oldest→newest, capped at MAX_REVIEW_OUTCOMES. */
  outcomes?: ReviewOutcome[];
}

export interface TopicProgress {
  derivation: {
    currentStep: number;
    completedSteps: number[];
    revealedHints: number[];
    completed: boolean;
  };
  problems: Record<string, ProblemAttempt>;
  customInputs: SavedInput[];
  /** Epoch ms of the last write to this topic — drives "continue where you left
   *  off" by recency (undefined on records saved before this field existed). */
  lastTouched?: number;
  /** Recall scheduling for this topic (v2; absent until first reviewed). */
  review?: ReviewState;
}

export interface ProblemAttempt {
  attempted: boolean;
  hintsUsed?: number;
  solved?: boolean;
}

export interface SavedInput {
  label: string;
  data: unknown;
}

/**
 * Visit history (v2) — the raw material for streaks / daily goal later (L4.1).
 * Stamped by `ProgressStore.touchVisit()` from useProgress's mount effect,
 * NEVER inside `load()` (load stays pure: read-only, no writes).
 */
export interface ProgressMeta {
  /** Epoch ms of the first recorded visit. */
  firstSeenAt?: number;
  /** Epoch ms of the most recent visit stamp. */
  lastVisitAt?: number;
  /** Local-calendar ISO dates ("YYYY-MM-DD"), deduped, sorted ascending,
   *  capped at MAX_VISIT_DAYS (most recent kept). */
  visitDays?: string[];
}

export interface ProgressState {
  version: number;
  lastUpdated: string;
  categories: Record<string, Record<string, TopicProgress>>;
  /** The learner's onboarding profile (experience / register / goal). Undefined
   *  until they complete or skip the questionnaire. Domain-agnostic + durable so
   *  future domains reuse it without re-onboarding. */
  audience?: AudienceProfile;
  settings: {
    theme: "system" | "light" | "dark";
    animationSpeed: "slow" | "normal" | "fast";
    codeLanguage: "python";
    /** Motion preference. "system" follows the OS; "reduce" forces minimal motion. */
    reduceMotion?: "system" | "reduce";
  };
  /** Visit history (v2; absent until the first touchVisit). */
  meta?: ProgressMeta;
}

export function emptyProgressState(): ProgressState {
  return {
    version: PROGRESS_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    categories: {},
    settings: {
      theme: "system",
      animationSpeed: "normal",
      codeLanguage: "python",
      reduceMotion: "system",
    },
  };
}

export function emptyTopicProgress(): TopicProgress {
  return {
    derivation: {
      currentStep: 1,
      completedSteps: [],
      revealedHints: [],
      completed: false,
    },
    problems: {},
    customInputs: [],
  };
}
