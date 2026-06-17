/**
 * "Next Steps" content shape — rendered as Step 08 after the 7-step derivation.
 *
 * Authoring rules (same hard rules as the derivation):
 * - Plain language. No CS jargon a 10th-grader wouldn't know. No Big-O here.
 * - `relatedTopics[].href` must point at a topic that ACTUALLY EXISTS:
 *   `/categories/<category>/<topicKey>` (categories: `algorithms`, `data-structures`).
 * - `practiceProblems[].link` is an external pointer (e.g. LeetCode); optional.
 *   In-app practice (the `/practice` route) is linked automatically by the
 *   renderer when the topic ships a `problems.tsx`.
 */
export interface NextStepsContent {
  /** One or two plain sentences: what you can now do that you couldn't before. */
  recap?: string;
  practiceProblems: Array<{
    name: string;
    difficulty: "easy" | "medium" | "hard";
    /** External link (LeetCode, etc.). Optional. */
    link?: string;
    /** Plain-language nudges, increasing in directness. */
    hints: string[];
  }>;
  realWorld: Array<{ title: string; description: string }>;
  relatedTopics: Array<{ name: string; href: string; reason: string }>;
  resources: Array<{ title: string; type: "video" | "article" | "book"; url?: string }>;
  /**
   * INTERVIEW PAYOFF (Front-Door Wave 2026-06). Optional, authored only for
   * interview-relevant topics (algorithms + the six DS topics arrays, strings,
   * hash-maps, linked-lists, trees, graphs). Foundations topics omit it ON
   * PURPOSE — an "interview angle" for `variables` would be noise. Surfaced in
   * the completion ceremony prominently when the learner's goal is "interview".
   *   askedAs   — how the idea typically shows up in an interview prompt.
   *   tip       — the one move that signals you actually understand it.
   *   companies — optional, illustrative (NOT exhaustive / authoritative).
   */
  interviewAngle?: { askedAs: string; tip: string; companies?: string[] };
}
