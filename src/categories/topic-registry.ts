import type { TopicBundle } from "./algorithms/topics";
import { getAlgorithmTopicBundle, listAlgorithmTopicBundles } from "./algorithms/topics";
import { getDataStructureTopicBundle, listDataStructureTopicBundles } from "./data-structures/topics";

export function getTopicBundle(categoryKey: string, topicKey: string): TopicBundle | undefined {
  if (categoryKey === "algorithms") return getAlgorithmTopicBundle(topicKey);
  if (categoryKey === "data-structures") return getDataStructureTopicBundle(topicKey);
  return undefined;
}

export function listAllTopicBundles(): TopicBundle[] {
  return [...listDataStructureTopicBundles(), ...listAlgorithmTopicBundles()];
}
