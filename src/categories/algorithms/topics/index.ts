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
};

export function getAlgorithmTopicBundle(topicKey: string): TopicBundle | undefined {
  return algorithmBundles[topicKey];
}

export function listAlgorithmTopicBundles(): TopicBundle[] {
  return Object.values(algorithmBundles);
}
