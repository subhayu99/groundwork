import type { LessonSpec } from "./types";
import { binarySearchLesson } from "@/categories/algorithms/topics/binary-search/lesson-spec";
import { treesLesson } from "@/categories/data-structures/topics/trees/lesson-spec";
import { graphsLesson } from "@/categories/data-structures/topics/graphs/lesson-spec";
import { dfsLesson } from "@/categories/algorithms/topics/dfs/lesson-spec";
import { stacksQueuesLesson } from "@/categories/data-structures/topics/stacks-queues/lesson-spec";

/**
 * Topics converted to the annotated-canvas form. When a topic is here, the
 * lesson page renders <LessonRuntime> instead of the old card+visualizer layout
 * ("replace on the branch"). Add an entry as each topic is converted.
 */
export const lessonSpecs: Record<string, LessonSpec> = {
  "algorithms/binary-search": binarySearchLesson,
  "data-structures/trees": treesLesson,
  "data-structures/graphs": graphsLesson,
  "algorithms/dfs": dfsLesson,
  "data-structures/stacks-queues": stacksQueuesLesson,
};

export function getLessonSpec(category: string, topic: string): LessonSpec | undefined {
  return lessonSpecs[`${category}/${topic}`];
}
