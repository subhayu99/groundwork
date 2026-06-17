import type { NextStepsContent } from "@/shared/next-steps/types";

// data-structures topics
import { arraysNextSteps } from "@/categories/data-structures/topics/arrays/next-steps";
import { stringsNextSteps } from "@/categories/data-structures/topics/strings/next-steps";
import { stacksQueuesNextSteps } from "@/categories/data-structures/topics/stacks-queues/next-steps";
import { linkedListsNextSteps } from "@/categories/data-structures/topics/linked-lists/next-steps";
import { hashMapsNextSteps } from "@/categories/data-structures/topics/hash-maps/next-steps";
import { setsTuplesNextSteps } from "@/categories/data-structures/topics/sets-tuples/next-steps";
import { treesNextSteps } from "@/categories/data-structures/topics/trees/next-steps";
import { graphsNextSteps } from "@/categories/data-structures/topics/graphs/next-steps";

// algorithms topics
import { twoPointersNextSteps } from "@/categories/algorithms/topics/two-pointers/next-steps";
import { binarySearchNextSteps } from "@/categories/algorithms/topics/binary-search/next-steps";
import { slidingWindowNextSteps } from "@/categories/algorithms/topics/sliding-window/next-steps";
import { slidingWindowVariableNextSteps } from "@/categories/algorithms/topics/sliding-window-variable/next-steps";
import { monotonicStackNextSteps } from "@/categories/algorithms/topics/monotonic-stack/next-steps";
import { activitySelectionNextSteps } from "@/categories/algorithms/topics/activity-selection/next-steps";
import { recursionNextSteps } from "@/categories/algorithms/topics/recursion/next-steps";
import { dfsNextSteps } from "@/categories/algorithms/topics/dfs/next-steps";
import { bfsNextSteps } from "@/categories/algorithms/topics/bfs/next-steps";
import { dp1dNextSteps } from "@/categories/algorithms/topics/dp-1d/next-steps";
import { backtrackingNextSteps } from "@/categories/algorithms/topics/backtracking/next-steps";
import { mergesortNextSteps } from "@/categories/algorithms/topics/mergesort/next-steps";

/**
 * "Go deeper" external-resource index for the COMPLETION CEREMONY (L2.8).
 *
 * Each topic's `next-steps.ts` already authors a `resources` list (external
 * articles/videos). The classic layout surfaced them via `NextStepsSection`;
 * the scene layout (now every topic) had no place for them. Rather than thread
 * a new prop through the un-owned topic page, we re-key JUST the `resources`
 * slice of that already-authored content by the lesson's `category/topic` slug,
 * so the scene's completion ceremony can render the same links it always meant
 * to — read-only, no duplication of the resource data itself.
 *
 * Keyed identically to the lesson registry (`<category>/<topic>`); topics with
 * no `next-steps.ts` (e.g. programming-basics) are simply absent → no row.
 */
export type LessonResource = NextStepsContent["resources"][number];

const RESOURCES_BY_SLUG: Record<string, NextStepsContent["resources"]> = {
  // data-structures
  "data-structures/arrays": arraysNextSteps.resources,
  "data-structures/strings": stringsNextSteps.resources,
  "data-structures/stacks-queues": stacksQueuesNextSteps.resources,
  "data-structures/linked-lists": linkedListsNextSteps.resources,
  "data-structures/hash-maps": hashMapsNextSteps.resources,
  "data-structures/sets-tuples": setsTuplesNextSteps.resources,
  "data-structures/trees": treesNextSteps.resources,
  "data-structures/graphs": graphsNextSteps.resources,
  // algorithms
  "algorithms/two-pointers": twoPointersNextSteps.resources,
  "algorithms/binary-search": binarySearchNextSteps.resources,
  "algorithms/sliding-window": slidingWindowNextSteps.resources,
  "algorithms/sliding-window-variable": slidingWindowVariableNextSteps.resources,
  "algorithms/monotonic-stack": monotonicStackNextSteps.resources,
  "algorithms/activity-selection": activitySelectionNextSteps.resources,
  "algorithms/recursion": recursionNextSteps.resources,
  "algorithms/dfs": dfsNextSteps.resources,
  "algorithms/bfs": bfsNextSteps.resources,
  "algorithms/dp-1d": dp1dNextSteps.resources,
  "algorithms/backtracking": backtrackingNextSteps.resources,
  "algorithms/mergesort": mergesortNextSteps.resources,
};

/** External "go deeper" resources for a `<category>/<topic>` slug, or [] if none. */
export function getLessonResources(slug: string | undefined): NextStepsContent["resources"] {
  if (!slug) return [];
  return RESOURCES_BY_SLUG[slug] ?? [];
}

/**
 * INTERVIEW ANGLE index for the COMPLETION CEREMONY (Front-Door Wave 2026-06).
 *
 * Mirrors RESOURCES_BY_SLUG exactly: re-keys JUST the optional `interviewAngle`
 * slice of each topic's already-authored `next-steps.ts` by its
 * `<category>/<topic>` slug, so the scene's completion ceremony can surface it
 * (prominently when the learner's goal is "interview") WITHOUT threading a new
 * prop through the un-owned topic page. Only interview-relevant topics author an
 * angle (the 12 algorithms + arrays, strings, hash-maps, linked-lists, trees,
 * graphs); foundations topics have no `next-steps.ts` at all and are simply
 * absent here — `getInterviewAngle` returns undefined for them.
 */
export type LessonInterviewAngle = NonNullable<NextStepsContent["interviewAngle"]>;

const INTERVIEW_ANGLE_BY_SLUG: Record<string, LessonInterviewAngle | undefined> = {
  // data-structures (the six interview-relevant topics; stacks-queues & sets-tuples author none)
  "data-structures/arrays": arraysNextSteps.interviewAngle,
  "data-structures/strings": stringsNextSteps.interviewAngle,
  "data-structures/linked-lists": linkedListsNextSteps.interviewAngle,
  "data-structures/hash-maps": hashMapsNextSteps.interviewAngle,
  "data-structures/trees": treesNextSteps.interviewAngle,
  "data-structures/graphs": graphsNextSteps.interviewAngle,
  // algorithms (all twelve)
  "algorithms/two-pointers": twoPointersNextSteps.interviewAngle,
  "algorithms/binary-search": binarySearchNextSteps.interviewAngle,
  "algorithms/sliding-window": slidingWindowNextSteps.interviewAngle,
  "algorithms/sliding-window-variable": slidingWindowVariableNextSteps.interviewAngle,
  "algorithms/monotonic-stack": monotonicStackNextSteps.interviewAngle,
  "algorithms/activity-selection": activitySelectionNextSteps.interviewAngle,
  "algorithms/recursion": recursionNextSteps.interviewAngle,
  "algorithms/dfs": dfsNextSteps.interviewAngle,
  "algorithms/bfs": bfsNextSteps.interviewAngle,
  "algorithms/dp-1d": dp1dNextSteps.interviewAngle,
  "algorithms/backtracking": backtrackingNextSteps.interviewAngle,
  "algorithms/mergesort": mergesortNextSteps.interviewAngle,
};

/** The authored interview angle for a `<category>/<topic>` slug, or undefined. */
export function getInterviewAngle(slug: string | undefined): LessonInterviewAngle | undefined {
  if (!slug) return undefined;
  return INTERVIEW_ANGLE_BY_SLUG[slug];
}
