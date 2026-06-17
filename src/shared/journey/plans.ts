/**
 * GOAL-DRIVEN STUDY PLANS — lights up the (previously dead) `Goal` wiring.
 *
 * Front-Door Wave (2026-06). FROZEN CONTRACT — see docs/contracts/JOURNEY-SPINE.md.
 * A plan is a computed, time-boxed sequence of milestones over the registry
 * topics, shaped by the learner's goal. v1 is computed-and-displayed (no
 * persistence). Consumers import these types; none redefine them.
 *
 * Three shapes:
 *   understand → the full path: ALL topics in registry order, nothing trimmed.
 *   interview  → ALL algorithms topics + the interview-relevant DS topics
 *                [arrays, strings, hash-maps, linked-lists, trees, graphs],
 *                ordered by tier then registry order, EXCLUDING programming-basics.
 *   refresh    → ONE topic per principle (the canonical exemplar of each of the
 *                seven ideas per TRACK-NARRATIVES), shortest pass, ordered by the
 *                principle's number (idea 1..7).
 *
 * Invariants (enforced by tests):
 *   - cumulativeMinutes is the running sum of `minutes` → non-decreasing.
 *   - totalMinutes === sum of milestone minutes === last cumulativeMinutes.
 *   - `done` is read from ProgressState (tolerant of empty/partial state).
 */

import type { Goal } from "@/shared/audience/types";
import type { ProgressState } from "@/shared/progress/types";
import type { TopicMeta, PrincipleKey, Tier } from "@/shared/derivation/types";
import { stageForTopic } from "@/shared/journey/spine";

export interface PlanMilestone {
  topicKey: string;
  name: string;
  href: string;
  /** This topic's own estimated minutes. */
  minutes: number;
  /** Running sum of minutes through this milestone (non-decreasing). */
  cumulativeMinutes: number;
  /** The journey stage this topic belongs to (spine key), "" if unmapped. */
  stageKey: string;
  /** Completed in the supplied ProgressState. */
  done: boolean;
}

export interface StudyPlan {
  goal: Goal;
  title: string;
  subtitle: string;
  /** Sum of all milestone minutes. */
  totalMinutes: number;
  milestones: PlanMilestone[];
}

/** Data-structures topics that earn an interview slot (the rest are skipped). */
const INTERVIEW_DS_TOPICS: readonly string[] = [
  "arrays",
  "strings",
  "hash-maps",
  "linked-lists",
  "trees",
  "graphs",
];

/**
 * The canonical exemplar topic for each of the seven ideas, per
 * docs/contracts/TRACK-NARRATIVES.md (the clearest algorithmic teacher of each
 * principle). The `refresh` pass walks these in idea order (1..7) — one topic
 * per principle, the shortest re-derivation tour. Order here IS idea order.
 */
const REFRESH_EXEMPLAR_BY_PRINCIPLE: ReadonlyArray<{
  principle: PrincipleKey;
  topicKey: string;
}> = [
  // 1 — reuse yesterday's sum instead of re-adding the whole window.
  { principle: "information-reuse", topicKey: "sliding-window" },
  // 2 — ask the middle, throw half away. The purest "eliminate, don't check".
  { principle: "search-space-pruning", topicKey: "binary-search" },
  // 3 — sorted order steers the fingers; the kept promise skips most pairs.
  { principle: "monotonicity-and-invariants", topicKey: "two-pointers" },
  // 4 — trust the smaller call. The canonical decomposition.
  { principle: "decomposition", topicKey: "recursion" },
  // 5 — spend memory on a filing system; membership stops depending on size.
  { principle: "trade-space-for-time", topicKey: "hash-maps" },
  // 6 — each element pays at most once on, once off: cheap on average.
  { principle: "amortization", topicKey: "monotonic-stack" },
  // 7 — earliest finish, proven safe, never reconsidered.
  { principle: "greedy-choice", topicKey: "activity-selection" },
];

/** free < premium < pro — used to order the interview path by tier. */
const TIER_RANK: Record<Tier, number> = { free: 0, premium: 1, pro: 2 };

function isCompleted(state: ProgressState | undefined, t: TopicMeta): boolean {
  return state?.categories?.[t.category]?.[t.key]?.derivation?.completed === true;
}

/** Build milestones from an ordered topic list, stamping cumulative time + done. */
function toMilestones(ordered: TopicMeta[], state: ProgressState): PlanMilestone[] {
  let cumulative = 0;
  return ordered.map((t) => {
    cumulative += t.estimatedMinutes;
    return {
      topicKey: t.key,
      name: t.name,
      href: `/categories/${t.category}/${t.key}`,
      minutes: t.estimatedMinutes,
      cumulativeMinutes: cumulative,
      stageKey: stageForTopic(t.key)?.key ?? "",
      done: isCompleted(state, t),
    };
  });
}

/** All topics, registry order. */
function understandOrder(topics: TopicMeta[]): TopicMeta[] {
  return [...topics];
}

/**
 * Interview path: algorithms (all) + the six interview-relevant DS topics,
 * EXCLUDING programming-basics, ordered by tier then registry order. Registry
 * order is preserved within a tier via a stable sort over the registry-ordered
 * candidate list.
 */
function interviewOrder(topics: TopicMeta[]): TopicMeta[] {
  const candidates = topics.filter((t) => {
    if (t.category === "algorithms") return true;
    if (t.category === "data-structures") return INTERVIEW_DS_TOPICS.includes(t.key);
    return false; // programming-basics (and anything else) excluded
  });
  // Stable sort by tier rank; equal ranks keep registry order.
  return candidates
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const r = TIER_RANK[a.t.tier] - TIER_RANK[b.t.tier];
      return r !== 0 ? r : a.i - b.i;
    })
    .map((x) => x.t);
}

/**
 * Refresh path: one canonical exemplar per principle (idea 1..7), the shortest
 * re-derivation pass. Any exemplar missing from the supplied topic list is
 * skipped (never throws) — but with the full registry all seven resolve.
 */
function refreshOrder(topics: TopicMeta[]): TopicMeta[] {
  const byKey = new Map(topics.map((t) => [t.key, t]));
  const out: TopicMeta[] = [];
  for (const { topicKey } of REFRESH_EXEMPLAR_BY_PRINCIPLE) {
    const meta = byKey.get(topicKey);
    if (meta) out.push(meta);
  }
  return out;
}

const COPY: Record<Goal, { title: string; subtitle: string }> = {
  understand: {
    title: "The full path",
    subtitle: "Every idea, derived in order — nothing skipped.",
  },
  interview: {
    title: "Interview-ready",
    subtitle: "The techniques and the structures they run on — straight to the patterns that get asked.",
  },
  refresh: {
    title: "A fast refresher",
    subtitle: "One exemplar per core idea — re-derive each, then you're warm.",
  },
};

/**
 * Build the study plan for a goal. NEVER throws on empty/partial state.
 * `topics` is the registry topic list (caller passes `listAllTopics()`), kept
 * as a parameter so the function stays pure and trivially testable.
 */
export function planFor(goal: Goal, state: ProgressState, topics: TopicMeta[]): StudyPlan {
  const ordered =
    goal === "interview"
      ? interviewOrder(topics)
      : goal === "refresh"
        ? refreshOrder(topics)
        : understandOrder(topics);

  const milestones = toMilestones(ordered, state);
  const totalMinutes = milestones.reduce((acc, m) => acc + m.minutes, 0);

  return {
    goal,
    title: COPY[goal].title,
    subtitle: COPY[goal].subtitle,
    totalMinutes,
    milestones,
  };
}
