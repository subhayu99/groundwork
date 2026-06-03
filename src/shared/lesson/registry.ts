import type { LessonSpec } from "./types";
import { variablesLesson } from "@/categories/programming-basics/topics/variables/lesson-spec";
import { constantsLesson } from "@/categories/programming-basics/topics/constants/lesson-spec";
import { dataTypesLesson } from "@/categories/programming-basics/topics/data-types/lesson-spec";
import { operatorsLesson } from "@/categories/programming-basics/topics/operators/lesson-spec";
import { conditionalsLesson } from "@/categories/programming-basics/topics/conditionals/lesson-spec";
import { whileLoopsLesson } from "@/categories/programming-basics/topics/while-loops/lesson-spec";
import { forLoopsLesson } from "@/categories/programming-basics/topics/for-loops/lesson-spec";
import { functionsLesson } from "@/categories/programming-basics/topics/functions/lesson-spec";
import { tryExceptLesson } from "@/categories/programming-basics/topics/try-except/lesson-spec";
import { binarySearchLesson } from "@/categories/algorithms/topics/binary-search/lesson-spec";
import { twoPointersLesson } from "@/categories/algorithms/topics/two-pointers/lesson-spec";
import { slidingWindowLesson } from "@/categories/algorithms/topics/sliding-window/lesson-spec";
import { slidingWindowVariableLesson } from "@/categories/algorithms/topics/sliding-window-variable/lesson-spec";
import { monotonicStackLesson } from "@/categories/algorithms/topics/monotonic-stack/lesson-spec";
import { recursionLesson } from "@/categories/algorithms/topics/recursion/lesson-spec";
import { dfsLesson } from "@/categories/algorithms/topics/dfs/lesson-spec";
import { bfsLesson } from "@/categories/algorithms/topics/bfs/lesson-spec";
import { backtrackingLesson } from "@/categories/algorithms/topics/backtracking/lesson-spec";
import { dp1dLesson } from "@/categories/algorithms/topics/dp-1d/lesson-spec";
import { mergesortLesson } from "@/categories/algorithms/topics/mergesort/lesson-spec";
import { activitySelectionLesson } from "@/categories/algorithms/topics/activity-selection/lesson-spec";
import { arraysLesson } from "@/categories/data-structures/topics/arrays/lesson-spec";
import { stringsLesson } from "@/categories/data-structures/topics/strings/lesson-spec";
import { stacksQueuesLesson } from "@/categories/data-structures/topics/stacks-queues/lesson-spec";
import { hashMapsLesson } from "@/categories/data-structures/topics/hash-maps/lesson-spec";
import { setsTuplesLesson } from "@/categories/data-structures/topics/sets-tuples/lesson-spec";
import { treesLesson } from "@/categories/data-structures/topics/trees/lesson-spec";
import { graphsLesson } from "@/categories/data-structures/topics/graphs/lesson-spec";
import { linkedListsLesson } from "@/categories/data-structures/topics/linked-lists/lesson-spec";

/**
 * Topics converted to the annotated-canvas form. When a topic is here, the
 * lesson page renders <LessonRuntime> instead of the old card+visualizer layout
 * ("replace on the branch"). Add an entry as each topic is converted.
 */
export const lessonSpecs: Record<string, LessonSpec> = {
  "programming-basics/variables": variablesLesson,
  "programming-basics/constants": constantsLesson,
  "programming-basics/data-types": dataTypesLesson,
  "programming-basics/operators": operatorsLesson,
  "programming-basics/conditionals": conditionalsLesson,
  "programming-basics/while-loops": whileLoopsLesson,
  "programming-basics/for-loops": forLoopsLesson,
  "programming-basics/functions": functionsLesson,
  "programming-basics/try-except": tryExceptLesson,
  "algorithms/binary-search": binarySearchLesson,
  "algorithms/two-pointers": twoPointersLesson,
  "algorithms/sliding-window": slidingWindowLesson,
  "algorithms/sliding-window-variable": slidingWindowVariableLesson,
  "algorithms/monotonic-stack": monotonicStackLesson,
  "algorithms/recursion": recursionLesson,
  "algorithms/dfs": dfsLesson,
  "algorithms/bfs": bfsLesson,
  "algorithms/backtracking": backtrackingLesson,
  "algorithms/dp-1d": dp1dLesson,
  "algorithms/mergesort": mergesortLesson,
  "algorithms/activity-selection": activitySelectionLesson,
  "data-structures/arrays": arraysLesson,
  "data-structures/strings": stringsLesson,
  "data-structures/stacks-queues": stacksQueuesLesson,
  "data-structures/hash-maps": hashMapsLesson,
  "data-structures/sets-tuples": setsTuplesLesson,
  "data-structures/trees": treesLesson,
  "data-structures/graphs": graphsLesson,
  "data-structures/linked-lists": linkedListsLesson,
};

export function getLessonSpec(category: string, topic: string): LessonSpec | undefined {
  return lessonSpecs[`${category}/${topic}`];
}
