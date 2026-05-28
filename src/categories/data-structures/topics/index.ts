import type { TopicBundle } from "../../algorithms/topics";

// Arrays & Lists
import { meta as arraysMeta } from "./arrays/meta";
import { arraysSteps } from "./arrays/derivation";
import { ArraysVisualizer } from "./arrays/visualizer";
import arraysPy from "./arrays/algorithm.py";

// Strings
import { meta as stringsMeta } from "./strings/meta";
import { stringsSteps } from "./strings/derivation";
import { StringsVisualizer } from "./strings/visualizer";
import stringsPy from "./strings/algorithm.py";

const dataStructureBundles: Record<string, TopicBundle> = {
  arrays: {
    meta: arraysMeta,
    steps: arraysSteps,
    Visualizer: ArraysVisualizer,
    pythonCode: arraysPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Move the slider first",
      enabledLabel: "Storage decides speed",
    },
  },
  strings: {
    meta: stringsMeta,
    steps: stringsSteps,
    Visualizer: StringsVisualizer,
    pythonCode: stringsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Slide the highlight first",
      enabledLabel: "Same machinery, different content",
    },
  },
};

export function getDataStructureTopicBundle(topicKey: string): TopicBundle | undefined {
  return dataStructureBundles[topicKey];
}

export function listDataStructureTopicBundles(): TopicBundle[] {
  return Object.values(dataStructureBundles);
}
