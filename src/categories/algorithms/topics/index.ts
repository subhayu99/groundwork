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
};

export function getAlgorithmTopicBundle(topicKey: string): TopicBundle | undefined {
  return algorithmBundles[topicKey];
}

export function listAlgorithmTopicBundles(): TopicBundle[] {
  return Object.values(algorithmBundles);
}
