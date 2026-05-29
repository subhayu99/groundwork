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
