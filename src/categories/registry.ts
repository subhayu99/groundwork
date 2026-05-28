import { CategoryMeta, TopicMeta } from "@/shared/derivation/types";

import { meta as algorithmsMeta } from "./algorithms/meta";
import { meta as dataStructuresMeta } from "./data-structures/meta";

// Data Structures
import { meta as arraysMeta } from "./data-structures/topics/arrays/meta";
import { meta as stringsMeta } from "./data-structures/topics/strings/meta";
import { meta as stacksQueuesMeta } from "./data-structures/topics/stacks-queues/meta";
import { meta as linkedListsMeta } from "./data-structures/topics/linked-lists/meta";

// Algorithms
import { meta as slidingWindowMeta } from "./algorithms/topics/sliding-window/meta";
import { meta as twoPointersMeta } from "./algorithms/topics/two-pointers/meta";

const categories: CategoryMeta[] = [dataStructuresMeta, algorithmsMeta];

const topics: TopicMeta[] = [
  // Data Structures (foundations)
  arraysMeta,
  stringsMeta,
  stacksQueuesMeta,
  linkedListsMeta,
  // Algorithms
  twoPointersMeta,
  slidingWindowMeta,
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
  return topics;
}
