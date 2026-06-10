import type { AudienceProfile } from "@/shared/audience/types";

export const PROGRESS_SCHEMA_VERSION = 1;

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
