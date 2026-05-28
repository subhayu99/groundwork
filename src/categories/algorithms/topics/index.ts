import type { ComponentType } from "react";
import type { DerivationStep, TopicMeta } from "@/shared/derivation/types";

export interface TopicBundle {
  meta: TopicMeta;
  steps: DerivationStep[];
  Visualizer: ComponentType<{ step: number; onWedgeInteraction?: () => void }>;
  pythonCode: string;
  /** Step at which the code drawer unlocks. Defaults to last step. */
  unlockCodeAtStep?: number;
  /** Step that triggers the wedge gating mechanism. 0 disables. */
  wedgeStep?: number;
  wedgeGating?: { disabledLabel: string; enabledLabel: string };
}

// Sliding Window (fixed)
import { meta as slidingWindowMeta } from "./sliding-window/meta";
import { slidingWindowSteps } from "./sliding-window/derivation";
import { SlidingWindowVisualizer } from "./sliding-window/visualizer";
import slidingWindowPy from "./sliding-window/algorithm.py";

// Two Pointers
import { meta as twoPointersMeta } from "./two-pointers/meta";
import { twoPointersSteps } from "./two-pointers/derivation";
import { TwoPointersVisualizer } from "./two-pointers/visualizer";
import twoPointersPy from "./two-pointers/algorithm.py";

// Binary Search
import { meta as binarySearchMeta } from "./binary-search/meta";
import { binarySearchSteps } from "./binary-search/derivation";
import { BinarySearchVisualizer } from "./binary-search/visualizer";
import binarySearchPy from "./binary-search/algorithm.py";

// Sliding Window (Variable)
import { meta as slidingWindowVariableMeta } from "./sliding-window-variable/meta";
import { slidingWindowVariableSteps } from "./sliding-window-variable/derivation";
import { SlidingWindowVariableVisualizer } from "./sliding-window-variable/visualizer";
import slidingWindowVariablePy from "./sliding-window-variable/algorithm.py";

// Monotonic Stack
import { meta as monotonicStackMeta } from "./monotonic-stack/meta";
import { monotonicStackSteps } from "./monotonic-stack/derivation";
import { MonotonicStackVisualizer } from "./monotonic-stack/visualizer";
import monotonicStackPy from "./monotonic-stack/algorithm.py";

// Activity Selection
import { meta as activitySelectionMeta } from "./activity-selection/meta";
import { activitySelectionSteps } from "./activity-selection/derivation";
import { ActivitySelectionVisualizer } from "./activity-selection/visualizer";
import activitySelectionPy from "./activity-selection/algorithm.py";

// Recursion
import { meta as recursionMeta } from "./recursion/meta";
import { recursionSteps } from "./recursion/derivation";
import { RecursionVisualizer } from "./recursion/visualizer";
import recursionPy from "./recursion/algorithm.py";

// Depth-First Search
import { meta as dfsMeta } from "./dfs/meta";
import { dfsSteps } from "./dfs/derivation";
import { DfsVisualizer } from "./dfs/visualizer";
import dfsPy from "./dfs/algorithm.py";

// Breadth-First Search
import { meta as bfsMeta } from "./bfs/meta";
import { bfsSteps } from "./bfs/derivation";
import { BfsVisualizer } from "./bfs/visualizer";
import bfsPy from "./bfs/algorithm.py";

const algorithmBundles: Record<string, TopicBundle> = {
  "two-pointers": {
    meta: twoPointersMeta,
    steps: twoPointersSteps,
    Visualizer: TwoPointersVisualizer,
    pythonCode: twoPointersPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Move the pointers first",
      enabledLabel: "I see the pattern",
    },
  },
  "binary-search": {
    meta: binarySearchMeta,
    steps: binarySearchSteps,
    Visualizer: BinarySearchVisualizer,
    pythonCode: binarySearchPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Click a cell first",
      enabledLabel: "Halve, then halve again",
    },
  },
  "sliding-window": {
    meta: slidingWindowMeta,
    steps: slidingWindowSteps,
    Visualizer: SlidingWindowVisualizer,
    pythonCode: slidingWindowPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Drag the window first",
      enabledLabel: "I think I see it",
    },
  },
  "sliding-window-variable": {
    meta: slidingWindowVariableMeta,
    steps: slidingWindowVariableSteps,
    Visualizer: SlidingWindowVariableVisualizer,
    pythonCode: slidingWindowVariablePy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Expand or contract first",
      enabledLabel: "Two motions, one rule",
    },
  },
  "monotonic-stack": {
    meta: monotonicStackMeta,
    steps: monotonicStackSteps,
    Visualizer: MonotonicStackVisualizer,
    pythonCode: monotonicStackPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Send a day first",
      enabledLabel: "The stack does the work",
    },
  },
  "activity-selection": {
    meta: activitySelectionMeta,
    steps: activitySelectionSteps,
    Visualizer: ActivitySelectionVisualizer,
    pythonCode: activitySelectionPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Sort by end first",
      enabledLabel: "Take the earliest finish",
    },
  },
  recursion: {
    meta: recursionMeta,
    steps: recursionSteps,
    Visualizer: RecursionVisualizer,
    pythonCode: recursionPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Ask a folder first",
      enabledLabel: "Smaller version, same shape",
    },
  },
  dfs: {
    meta: dfsMeta,
    steps: dfsSteps,
    Visualizer: DfsVisualizer,
    pythonCode: dfsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Take a step first",
      enabledLabel: "Deep, then back up",
    },
  },
  bfs: {
    meta: bfsMeta,
    steps: bfsSteps,
    Visualizer: BfsVisualizer,
    pythonCode: bfsPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Spread a ring first",
      enabledLabel: "Closest first wins",
    },
  },
};

export function getAlgorithmTopicBundle(topicKey: string): TopicBundle | undefined {
  return algorithmBundles[topicKey];
}

export function listAlgorithmTopicBundles(): TopicBundle[] {
  return Object.values(algorithmBundles);
}
