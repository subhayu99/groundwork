import type { TopicBundle } from "../../algorithms/topics";

const dataStructureBundles: Record<string, TopicBundle> = {
  // Topics registered here as they're built (arrays, strings, hash-maps, etc.)
};

export function getDataStructureTopicBundle(topicKey: string): TopicBundle | undefined {
  return dataStructureBundles[topicKey];
}

export function listDataStructureTopicBundles(): TopicBundle[] {
  return Object.values(dataStructureBundles);
}
