import type { LessonSpec } from "./types";
import { binarySearchLesson } from "@/categories/algorithms/topics/binary-search/lesson-spec";

/**
 * Topics converted to the annotated-canvas form. When a topic is here, the
 * lesson page renders <LessonRuntime> instead of the old card+visualizer layout
 * ("replace on the branch"). Add an entry as each topic is converted.
 */
export const lessonSpecs: Record<string, LessonSpec> = {
  "algorithms/binary-search": binarySearchLesson,
};

export function getLessonSpec(category: string, topic: string): LessonSpec | undefined {
  return lessonSpecs[`${category}/${topic}`];
}
