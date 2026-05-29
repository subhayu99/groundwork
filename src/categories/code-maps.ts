/**
 * Maps each topic's derivation step (1–7) to the line numbers of its
 * `algorithm.py` that the step is about — so the code drawer highlights the
 * matching lines as the reader moves through (or revisits) the lesson, the
 * "code synced to the visualization" the design calls for.
 *
 * Keyed by `"<category>/<topic>"`. Lines are 1-indexed. A topic with no entry
 * falls back to the manual code scrubber (no auto-sync).
 */
export type StepCodeLines = Record<number, number[]>;

export const codeMaps: Record<string, StepCodeLines> = {
  // Algorithms
  "algorithms/binary-search": { 1: [1, 2], 2: [1, 2], 3: [9, 10], 4: [6, 7, 9, 10], 5: [11, 12], 6: [13, 14, 15, 16], 7: [9, 18] },
  "algorithms/sliding-window": { 1: [1, 2], 2: [1, 2], 3: [13], 4: [14], 5: [14], 6: [10, 11, 14], 7: [10, 14, 15] },
  "algorithms/two-pointers": { 1: [1, 2], 2: [2, 4, 5], 3: [7, 8], 4: [11, 12, 14, 16], 5: [10, 15, 17], 6: [10, 11], 7: [13, 19] },
  "algorithms/sliding-window-variable": { 1: [1, 2], 2: [1, 2], 3: [13, 16], 4: [16, 17], 5: [16, 17, 19], 6: [19, 20], 7: [20, 22] },
  "algorithms/monotonic-stack": { 1: [1, 2], 2: [1, 2, 3], 3: [9, 10], 4: [15, 16, 17], 5: [16, 17], 6: [15, 16, 17], 7: [15, 18] },
  "algorithms/activity-selection": { 1: [1, 2], 2: [2, 4, 5], 3: [8, 13, 14], 4: [8, 11, 14, 16], 5: [8, 13], 6: [8, 14], 7: [14, 15, 16] },
  "algorithms/recursion": { 1: [1, 2], 2: [4, 5, 6], 3: [13, 14, 15], 4: [10, 11, 15], 5: [10, 11, 15], 6: [13, 14, 15], 7: [10, 11, 15] },
  "algorithms/dfs": { 1: [4, 5], 2: [5, 8, 13], 3: [20, 27], 4: [15, 17, 18], 5: [20, 23, 26], 6: [23, 24, 26], 7: [27, 28, 29, 34] },
  "algorithms/bfs": { 1: [6, 7, 8], 2: [9, 10, 11], 3: [20, 22, 23], 4: [22, 23, 25, 26], 5: [31, 32, 33], 6: [16, 17, 32], 7: [40, 41, 42] },
  "algorithms/dp-1d": { 1: [1, 2], 2: [1, 4, 5], 3: [12, 13], 4: [15, 16, 17], 5: [16, 17, 18], 6: [15, 17], 7: [16, 17, 18] },
  "algorithms/backtracking": { 1: [1, 2, 3], 2: [4, 5, 6], 3: [30, 31, 32], 4: [31], 5: [32], 6: [9, 29], 7: [21, 22] },
  "algorithms/mergesort": { 1: [1, 2], 2: [1, 2, 3], 3: [9, 10], 4: [12, 13, 14], 5: [13, 14, 16], 6: [29, 30, 31], 7: [16, 38, 39] },

  // Data structures
  "data-structures/arrays": { 1: [1, 3], 2: [3, 6], 3: [5, 6], 4: [5, 6], 5: [6, 9, 12], 6: [12, 15], 7: [6, 18, 22] },
  "data-structures/strings": { 1: [1, 3], 2: [6, 9], 3: [11, 12], 4: [3, 20, 21], 5: [6, 12, 15], 6: [17, 18], 7: [20, 21, 22] },
  "data-structures/stacks-queues": { 1: [1, 6], 2: [4, 6, 11], 3: [7, 10, 11], 4: [3, 6, 14], 5: [7, 10, 11], 6: [3, 14], 7: [19, 20, 23] },
  "data-structures/linked-lists": { 1: [11, 12], 2: [6, 7, 8], 3: [13, 14], 4: [5, 6, 7, 8], 5: [13, 14, 23], 6: [29, 30, 33], 7: [8, 13, 14] },
  "data-structures/sets-tuples": { 1: [5, 24], 2: [5, 25, 31], 3: [6, 8, 32], 4: [5, 6, 24], 5: [10, 17, 18, 19], 6: [6, 10, 24], 7: [16, 24, 32] },
  "data-structures/hash-maps": { 1: [1, 4], 2: [9, 10], 3: [27, 31], 4: [27, 28], 5: [5, 6, 7], 6: [13, 21], 7: [4, 10] },
  "data-structures/trees": { 1: [5, 6, 7, 8], 2: [6, 7, 8], 3: [8, 14], 4: [28, 29], 5: [13, 14, 15], 6: [30, 31, 32, 33], 7: [16, 34] },
  "data-structures/graphs": { 1: [10, 24], 2: [10, 24], 3: [4, 32, 49], 4: [4, 6, 11], 5: [25, 33, 41], 6: [32, 33, 49], 7: [6, 11, 12] },
};
