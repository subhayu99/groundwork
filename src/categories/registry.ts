import { CategoryMeta, TopicMeta } from "@/shared/derivation/types";

import { meta as algorithmsMeta } from "./algorithms/meta";
import { meta as dataStructuresMeta } from "./data-structures/meta";

import { meta as slidingWindowMeta } from "./algorithms/topics/sliding-window/meta";

const categories: CategoryMeta[] = [dataStructuresMeta, algorithmsMeta];

const topics: TopicMeta[] = [slidingWindowMeta];

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
