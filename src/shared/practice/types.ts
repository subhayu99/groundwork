import type { ReactNode } from "react";

export type ProblemDifficulty = "easy" | "medium" | "hard";

export interface ProblemExample {
  /** Compact JSON-like input string the reader can mentally trace. */
  input: string;
  /** Expected output string. */
  output: string;
  /** Optional one-line walkthrough of why the output is what it is. */
  note?: string;
}

export interface PracticeProblem {
  /** Stable kebab-case slug. Lives in the URL. */
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  /** A one-line teaser shown in the problem list. */
  teaser: string;
  /** The full problem statement. Rich JSX so we can highlight constraints. */
  prompt: ReactNode;
  /** Worked examples — at least one, ideally two. */
  examples: ProblemExample[];
  /** Constraints (size limits, value ranges) — kept brief. */
  constraints?: string[];
  /** Progressive hints. Order matters — earliest is least spoilery. */
  hints: ReactNode[];
  /** Python solution code, copied verbatim into the code drawer. */
  solution: string;
  /** Optional brief walkthrough of how the solution works. */
  solutionWalkthrough?: ReactNode;
}
