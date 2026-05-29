import type { ComponentType } from "react";
import type { DerivationStep, TopicMeta } from "@/shared/derivation/types";
import type { PracticeProblem } from "@/shared/practice/types";
import type { NextStepsContent } from "@/shared/next-steps/types";

export interface TopicBundle {
  meta: TopicMeta;
  steps: DerivationStep[];
  Visualizer: ComponentType<{
    step: number;
    onWedgeInteraction?: () => void;
    /** Emit the algorithm.py line(s) the current operation maps to, for live
     *  frame-by-frame code highlighting. Optional per visualizer. */
    onActiveLine?: (lines: number[]) => void;
  }>;
  pythonCode: string;
  /** Step at which the code drawer unlocks. Defaults to last step. */
  unlockCodeAtStep?: number;
  /** Step that triggers the wedge gating mechanism. 0 disables. */
  wedgeStep?: number;
  wedgeGating?: { disabledLabel: string; enabledLabel: string };
  /** Practice problems for this topic. Optional — topics opt in. */
  problems?: PracticeProblem[];
  /** Step 08 "Next Steps" content, rendered after the derivation completes. */
  nextSteps?: NextStepsContent;
}

// Sliding Window (fixed)
import { meta as slidingWindowMeta } from "./sliding-window/meta";
import { slidingWindowSteps } from "./sliding-window/derivation";
import { SlidingWindowVisualizer } from "./sliding-window/visualizer";
import slidingWindowPy from "./sliding-window/algorithm.py";
import { slidingWindowProblems } from "./sliding-window/problems";

// Two Pointers
import { meta as twoPointersMeta } from "./two-pointers/meta";
import { twoPointersSteps } from "./two-pointers/derivation";
import { TwoPointersVisualizer } from "./two-pointers/visualizer";
import twoPointersPy from "./two-pointers/algorithm.py";
import { twoPointersProblems } from "./two-pointers/problems";

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

// Dynamic Programming (1D)
import { meta as dp1dMeta } from "./dp-1d/meta";
import { dp1dSteps } from "./dp-1d/derivation";
import { Dp1dVisualizer } from "./dp-1d/visualizer";
import dp1dPy from "./dp-1d/algorithm.py";
import { dp1dProblems } from "./dp-1d/problems";

// Backtracking
import { meta as backtrackingMeta } from "./backtracking/meta";
import { backtrackingSteps } from "./backtracking/derivation";
import { BacktrackingVisualizer } from "./backtracking/visualizer";
import backtrackingPy from "./backtracking/algorithm.py";

// Mergesort
import { meta as mergesortMeta } from "./mergesort/meta";
import { mergesortSteps } from "./mergesort/derivation";
import { MergesortVisualizer } from "./mergesort/visualizer";
import mergesortPy from "./mergesort/algorithm.py";

// Next-steps (Step 08) content
import { twoPointersNextSteps } from "./two-pointers/next-steps";
import { binarySearchNextSteps } from "./binary-search/next-steps";
import { slidingWindowNextSteps } from "./sliding-window/next-steps";
import { slidingWindowVariableNextSteps } from "./sliding-window-variable/next-steps";
import { monotonicStackNextSteps } from "./monotonic-stack/next-steps";
import { activitySelectionNextSteps } from "./activity-selection/next-steps";
import { recursionNextSteps } from "./recursion/next-steps";
import { dfsNextSteps } from "./dfs/next-steps";
import { bfsNextSteps } from "./bfs/next-steps";
import { dp1dNextSteps } from "./dp-1d/next-steps";
import { backtrackingNextSteps } from "./backtracking/next-steps";
import { mergesortNextSteps } from "./mergesort/next-steps";

// Practice problems (the topics that ship them)
import { binarySearchProblems } from "./binary-search/problems";
import { slidingWindowVariableProblems } from "./sliding-window-variable/problems";
import { monotonicStackProblems } from "./monotonic-stack/problems";
import { activitySelectionProblems } from "./activity-selection/problems";
import { recursionProblems } from "./recursion/problems";
import { dfsProblems } from "./dfs/problems";
import { bfsProblems } from "./bfs/problems";
import { backtrackingProblems } from "./backtracking/problems";
import { mergesortProblems } from "./mergesort/problems";

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
    problems: twoPointersProblems,
    nextSteps: twoPointersNextSteps,
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
    nextSteps: binarySearchNextSteps,
    problems: binarySearchProblems,
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
    problems: slidingWindowProblems,
    nextSteps: slidingWindowNextSteps,
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
    nextSteps: slidingWindowVariableNextSteps,
    problems: slidingWindowVariableProblems,
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
    nextSteps: monotonicStackNextSteps,
    problems: monotonicStackProblems,
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
    nextSteps: activitySelectionNextSteps,
    problems: activitySelectionProblems,
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
    nextSteps: recursionNextSteps,
    problems: recursionProblems,
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
    nextSteps: dfsNextSteps,
    problems: dfsProblems,
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
    nextSteps: bfsNextSteps,
    problems: bfsProblems,
  },
  "dp-1d": {
    meta: dp1dMeta,
    steps: dp1dSteps,
    Visualizer: Dp1dVisualizer,
    pythonCode: dp1dPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Toggle remembering first",
      enabledLabel: "Write it down once",
    },
    problems: dp1dProblems,
    nextSteps: dp1dNextSteps,
  },
  backtracking: {
    meta: backtrackingMeta,
    steps: backtrackingSteps,
    Visualizer: BacktrackingVisualizer,
    pythonCode: backtrackingPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Place a queen first",
      enabledLabel: "Check, then choose",
    },
    nextSteps: backtrackingNextSteps,
    problems: backtrackingProblems,
  },
  mergesort: {
    meta: mergesortMeta,
    steps: mergesortSteps,
    Visualizer: MergesortVisualizer,
    pythonCode: mergesortPy,
    wedgeStep: 3,
    wedgeGating: {
      disabledLabel: "Split or merge first",
      enabledLabel: "Halves, then merge",
    },
    nextSteps: mergesortNextSteps,
    problems: mergesortProblems,
  },
};

export function getAlgorithmTopicBundle(topicKey: string): TopicBundle | undefined {
  return algorithmBundles[topicKey];
}

export function listAlgorithmTopicBundles(): TopicBundle[] {
  return Object.values(algorithmBundles);
}
