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

// Stacks & Queues
import { meta as stacksQueuesMeta } from "./stacks-queues/meta";
import { stacksQueuesSteps } from "./stacks-queues/derivation";
import { StacksQueuesVisualizer } from "./stacks-queues/visualizer";
import stacksQueuesPy from "./stacks-queues/algorithm.py";

// Linked Lists
import { meta as linkedListsMeta } from "./linked-lists/meta";
import { linkedListsSteps } from "./linked-lists/derivation";
import { LinkedListsVisualizer } from "./linked-lists/visualizer";
import linkedListsPy from "./linked-lists/algorithm.py";

// Hash Maps
import { meta as hashMapsMeta } from "./hash-maps/meta";
import { hashMapsSteps } from "./hash-maps/derivation";
import { HashMapsVisualizer } from "./hash-maps/visualizer";
import hashMapsPy from "./hash-maps/algorithm.py";

// Sets & Tuples
import { meta as setsTuplesMeta } from "./sets-tuples/meta";
import { setsTuplesSteps } from "./sets-tuples/derivation";
import { SetsTuplesVisualizer } from "./sets-tuples/visualizer";
import setsTuplesPy from "./sets-tuples/algorithm.py";

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
  "stacks-queues": {
    meta: stacksQueuesMeta,
    steps: stacksQueuesSteps,
    Visualizer: StacksQueuesVisualizer,
    pythonCode: stacksQueuesPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Push or enqueue something first",
      enabledLabel: "Restrict, then optimize",
    },
  },
  "linked-lists": {
    meta: linkedListsMeta,
    steps: linkedListsSteps,
    Visualizer: LinkedListsVisualizer,
    pythonCode: linkedListsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Insert or remove something first",
      enabledLabel: "Pointers are the trick",
    },
  },
  "hash-maps": {
    meta: hashMapsMeta,
    steps: hashMapsSteps,
    Visualizer: HashMapsVisualizer,
    pythonCode: hashMapsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Type a name first",
      enabledLabel: "Compute the address",
    },
  },
  "sets-tuples": {
    meta: setsTuplesMeta,
    steps: setsTuplesSteps,
    Visualizer: SetsTuplesVisualizer,
    pythonCode: setsTuplesPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Try the set or tuple first",
      enabledLabel: "Identity vs grouping",
    },
  },
};

export function getDataStructureTopicBundle(topicKey: string): TopicBundle | undefined {
  return dataStructureBundles[topicKey];
}

export function listDataStructureTopicBundles(): TopicBundle[] {
  return Object.values(dataStructureBundles);
}
