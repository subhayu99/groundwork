import type { TopicBundle } from "./algorithms/topics";
import type { PracticeProblem } from "@/shared/practice/types";
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

export function listPracticeProblems(categoryKey: string, topicKey: string): PracticeProblem[] {
  return getTopicBundle(categoryKey, topicKey)?.problems ?? [];
}

export function getPracticeProblem(
  categoryKey: string,
  topicKey: string,
  problemId: string,
): PracticeProblem | undefined {
  return listPracticeProblems(categoryKey, topicKey).find((p) => p.id === problemId);
}
