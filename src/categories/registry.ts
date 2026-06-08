import { CategoryMeta, TopicMeta } from "@/shared/derivation/types";

import { meta as algorithmsMeta } from "./algorithms/meta";
import { meta as dataStructuresMeta } from "./data-structures/meta";
import { meta as programmingBasicsMeta } from "./programming-basics/meta";

// Programming Basics
import { meta as variablesMeta } from "./programming-basics/topics/variables/meta";
import { meta as constantsMeta } from "./programming-basics/topics/constants/meta";
import { meta as dataTypesMeta } from "./programming-basics/topics/data-types/meta";
import { meta as operatorsMeta } from "./programming-basics/topics/operators/meta";
import { meta as conditionalsMeta } from "./programming-basics/topics/conditionals/meta";
import { meta as whileLoopsMeta } from "./programming-basics/topics/while-loops/meta";
import { meta as forLoopsMeta } from "./programming-basics/topics/for-loops/meta";
import { meta as functionsMeta } from "./programming-basics/topics/functions/meta";
import { meta as tryExceptMeta } from "./programming-basics/topics/try-except/meta";

// Data Structures
import { meta as arraysMeta } from "./data-structures/topics/arrays/meta";
import { meta as stringsMeta } from "./data-structures/topics/strings/meta";
import { meta as stacksQueuesMeta } from "./data-structures/topics/stacks-queues/meta";
import { meta as linkedListsMeta } from "./data-structures/topics/linked-lists/meta";
import { meta as hashMapsMeta } from "./data-structures/topics/hash-maps/meta";
import { meta as setsTuplesMeta } from "./data-structures/topics/sets-tuples/meta";
import { meta as treesMeta } from "./data-structures/topics/trees/meta";
import { meta as graphsMeta } from "./data-structures/topics/graphs/meta";

// Algorithms
import { meta as slidingWindowMeta } from "./algorithms/topics/sliding-window/meta";
import { meta as twoPointersMeta } from "./algorithms/topics/two-pointers/meta";
import { meta as binarySearchMeta } from "./algorithms/topics/binary-search/meta";
import { meta as slidingWindowVariableMeta } from "./algorithms/topics/sliding-window-variable/meta";
import { meta as monotonicStackMeta } from "./algorithms/topics/monotonic-stack/meta";
import { meta as activitySelectionMeta } from "./algorithms/topics/activity-selection/meta";
import { meta as recursionMeta } from "./algorithms/topics/recursion/meta";
import { meta as dfsMeta } from "./algorithms/topics/dfs/meta";
import { meta as bfsMeta } from "./algorithms/topics/bfs/meta";
import { meta as dp1dMeta } from "./algorithms/topics/dp-1d/meta";
import { meta as backtrackingMeta } from "./algorithms/topics/backtracking/meta";
import { meta as mergesortMeta } from "./algorithms/topics/mergesort/meta";

const categories: CategoryMeta[] = [programmingBasicsMeta, dataStructuresMeta, algorithmsMeta];

const topics: TopicMeta[] = [
  // Programming Basics (before any data structure or algorithm)
  variablesMeta,
  constantsMeta,
  dataTypesMeta,
  operatorsMeta,
  conditionalsMeta,
  whileLoopsMeta,
  forLoopsMeta,
  functionsMeta,
  tryExceptMeta,
  // Data Structures (foundations)
  arraysMeta,
  stringsMeta,
  hashMapsMeta,
  setsTuplesMeta,
  stacksQueuesMeta,
  linkedListsMeta,
  treesMeta,
  graphsMeta,
  // Algorithms
  twoPointersMeta,
  binarySearchMeta,
  slidingWindowMeta,
  slidingWindowVariableMeta,
  monotonicStackMeta,
  activitySelectionMeta,
  recursionMeta,
  dfsMeta,
  bfsMeta,
  dp1dMeta,
  backtrackingMeta,
  mergesortMeta,
];

export function listCategories(): CategoryMeta[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

export function getCategory(key: string): CategoryMeta | undefined {
  return categories.find((c) => c.key === key);
}

export function listTopicsInCategory(categoryKey: string): TopicMeta[] {
  return topics.filter((t) => t.category === categoryKey);
}

export function getTopic(categoryKey: string, topicKey: string): TopicMeta | undefined {
  return topics.find((t) => t.category === categoryKey && t.key === topicKey);
}

export function listAllTopics(): TopicMeta[] {
  return [...topics];
}
