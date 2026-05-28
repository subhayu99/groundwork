export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DifficultyLevel = "foundation" | "easy" | "medium" | "hard";
export type Tier = "free" | "premium" | "pro";

export type PrincipleKey =
  | "information-reuse"
  | "search-space-pruning"
  | "monotonicity-and-invariants"
  | "decomposition"
  | "trade-space-for-time"
  | "amortization"
  | "greedy-choice";

export interface CardContent {
  label: string;
  title: string;
  body: React.ReactNode | (() => React.ReactNode);
  /** Optional "read more" expansion content shown after click */
  expand?: React.ReactNode | (() => React.ReactNode);
  /** Optional action button label (defaults provided by engine) */
  actionLabel?: string;
}

export interface DerivationStep {
  step: StepNumber;
  cards: CardContent[];
  /** Optional visualization element specific to this step */
  visualization?: React.ReactNode;
}

export interface TopicMeta {
  key: string;
  name: string;
  category: string;
  principles: PrincipleKey[];
  prerequisites: string[];
  tier: Tier;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  /** Optional reference to a prior topic to bridge from in derivation */
  bridgeFrom?: string;
}

export interface CategoryMeta {
  key: string;
  name: string;
  description: string;
  order: number;
}
