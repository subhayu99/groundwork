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

// Trees
import { meta as treesMeta } from "./trees/meta";
import { treesSteps } from "./trees/derivation";
import { TreesVisualizer } from "./trees/visualizer";
import treesPy from "./trees/algorithm.py";

// Graphs
import { meta as graphsMeta } from "./graphs/meta";
import { graphsSteps } from "./graphs/derivation";
import { GraphsVisualizer } from "./graphs/visualizer";
import graphsPy from "./graphs/algorithm.py";

// Next-steps (Step 08) content
import { arraysNextSteps } from "./arrays/next-steps";
import { stringsNextSteps } from "./strings/next-steps";
import { stacksQueuesNextSteps } from "./stacks-queues/next-steps";
import { linkedListsNextSteps } from "./linked-lists/next-steps";
import { hashMapsNextSteps } from "./hash-maps/next-steps";
import { setsTuplesNextSteps } from "./sets-tuples/next-steps";
import { treesNextSteps } from "./trees/next-steps";
import { graphsNextSteps } from "./graphs/next-steps";

// Practice problems
import { arraysProblems } from "./arrays/problems";
import { stringsProblems } from "./strings/problems";
import { stacksQueuesProblems } from "./stacks-queues/problems";
import { linkedListsProblems } from "./linked-lists/problems";
import { hashMapsProblems } from "./hash-maps/problems";
import { setsTuplesProblems } from "./sets-tuples/problems";
import { treesProblems } from "./trees/problems";
import { graphsProblems } from "./graphs/problems";

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
    nextSteps: arraysNextSteps,
    problems: arraysProblems,
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
    nextSteps: stringsNextSteps,
    problems: stringsProblems,
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
    nextSteps: stacksQueuesNextSteps,
    problems: stacksQueuesProblems,
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
    nextSteps: linkedListsNextSteps,
    problems: linkedListsProblems,
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
    nextSteps: hashMapsNextSteps,
    problems: hashMapsProblems,
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
    nextSteps: setsTuplesNextSteps,
    problems: setsTuplesProblems,
  },
  trees: {
    meta: treesMeta,
    steps: treesSteps,
    Visualizer: TreesVisualizer,
    pythonCode: treesPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Click a node first",
      enabledLabel: "Each node points to its kids",
    },
    nextSteps: treesNextSteps,
    problems: treesProblems,
  },
  graphs: {
    meta: graphsMeta,
    steps: graphsSteps,
    Visualizer: GraphsVisualizer,
    pythonCode: graphsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Click a person first",
      enabledLabel: "Nodes plus edges",
    },
    nextSteps: graphsNextSteps,
    problems: graphsProblems,
  },
};

export function getDataStructureTopicBundle(topicKey: string): TopicBundle | undefined {
  return dataStructureBundles[topicKey];
}

export function listDataStructureTopicBundles(): TopicBundle[] {
  return Object.values(dataStructureBundles);
}
