/**
 * Maps each topic's derivation step (1–7) to the line numbers of its
 * `algorithm.py` that the step is about — so the code drawer highlights the
 * matching lines as the reader moves through (or revisits) the lesson, the
 * "code synced to the visualization" the design calls for.
 *
 * Keyed by `"<category>/<topic>"`. Lines are 1-indexed. A topic with no entry
 * falls back to the manual code scrubber (no auto-sync).
 */
// Tokens may be `@sync:` LABELS (preferred — resolved against algorithm.py) or
// legacy raw line numbers (still accepted during the migration to labels).
export type StepCodeLines = import("@/shared/code/syncAnchors").TopicSyncMap;

export const codeMaps: Record<string, StepCodeLines> = {
  // Algorithms
  "algorithms/binary-search": { 1: ["sig"], 2: ["sig"], 3: ["loop", "mid"], 4: ["init", "loop", "mid"], 5: ["compare", "found"], 6: ["less", "lo_update", "greater", "hi_update"], 7: ["loop", "notfound"] },
  "algorithms/sliding-window": { 1: ["sig"], 2: ["sig"], 3: ["init_window"], 4: ["slide"], 5: ["slide"], 6: ["init_window", "loop", "slide"], 7: ["loop", "slide", "record"] },
  "algorithms/two-pointers": { 1: ["sig"], 2: ["sig"], 3: ["init", "init_right"], 4: ["compute", "compare", "less", "greater"], 5: ["loop", "move_left", "move_right"], 6: ["loop", "compute"], 7: ["found", "notfound"] },
  "algorithms/sliding-window-variable": { 1: ["sig"], 2: ["sig"], 3: ["expand", "check"], 4: ["check", "contract"], 5: ["check", "contract", "record"], 6: ["record", "update"], 7: ["update", "result"] },
  "algorithms/monotonic-stack": { 1: ["sig", "init_answer"], 2: ["sig", "init_answer", "init_stack"], 3: ["loop", "push"], 4: ["while_pop", "record", "push"], 5: ["record", "push"], 6: ["while_pop", "record", "push"], 7: ["while_pop", "done"] },
  "algorithms/activity-selection": { 1: ["sig"], 2: ["sig"], 3: ["sort", "loop", "compatible"], 4: ["sort", "last_end", "compatible", "update"], 5: ["sort", "loop"], 6: ["sort", "compatible"], 7: ["compatible", "select", "update"] },
  "algorithms/recursion": { 1: ["sig"], 2: ["aggregate"], 3: ["recursive_call", "aggregate"], 4: ["base_case", "base_return", "recursive_call"], 5: ["base_case", "base_return", "recursive_call"], 6: ["recursive_call", "aggregate", "folder_return"], 7: ["base_case", "base_return", "recursive_call", "aggregate", "folder_return"] },
  "algorithms/dfs": { 1: ["sig"], 2: ["sig", "visited"], 3: ["visit", "recurse"], 4: ["sig", "found"], 5: ["visit", "neighbors"], 6: ["neighbors"], 7: ["recurse", "found", "backtrack"] },
  "algorithms/bfs": { 1: ["sig"], 2: ["rows", "cols"], 3: ["init_queue", "loop", "dequeue"], 4: ["loop", "dequeue", "visit", "found"], 5: ["seen_check", "mark", "enqueue"], 6: ["seen_check", "mark"], 7: ["loop", "dequeue"] },
  "algorithms/dp-1d": { 1: ["sig"], 2: ["sig", "recurrence"], 3: ["base_check", "base_return"], 4: ["init_table", "loop", "recurrence"], 5: ["loop", "recurrence", "answer"], 6: ["init_table", "recurrence"], 7: ["loop", "recurrence", "answer"] },
  "algorithms/backtracking": { 1: ["sig"], 2: ["sig", "init"], 3: ["place", "recurse", "backtrack"], 4: ["recurse"], 5: ["backtrack"], 6: ["loop", "is_safe"], 7: ["record_solution", "record_append"] },
  "algorithms/mergesort": { 1: ["sig", "base"], 2: ["sig", "base"], 3: ["split", "recurse_left", "recurse_right"], 4: ["split", "recurse_left", "recurse_right"], 5: ["recurse_left", "recurse_right", "merge_call"], 6: ["merge_loop", "merge_compare", "merge_take"], 7: ["merge_compare", "merge_take", "merge_tail"] },

  // Data structures
  "data-structures/arrays": { 1: ["index_read"], 2: ["index_read"], 3: ["index_read"], 4: ["append"], 5: ["insert_mid", "delete"], 6: ["loop", "loop_body"], 7: ["append", "insert_mid", "delete", "length"] },
  "data-structures/strings": { 1: ["find"], 2: ["find"], 3: ["slice", "find"], 4: ["index_read", "rebuild", "concat"], 5: ["index_read", "slice", "concat"], 6: ["concat", "find"], 7: ["source", "index_read", "length"] },
  "data-structures/stacks-queues": { 1: ["sig"], 2: ["pop"], 3: ["push", "pop"], 4: ["peek"], 5: ["enqueue"], 6: ["dequeue"], 7: ["qinit", "enqueue", "dequeue"] },
  "data-structures/linked-lists": { 1: ["sig", "insert_new"], 2: ["node_class", "node_value", "node_next"], 3: ["insert_new", "insert_relink"], 4: ["node_class", "node_value", "node_next"], 5: ["insert_new", "insert_relink", "remove_relink"], 6: ["traverse_init", "traverse_loop", "traverse_advance"], 7: ["node_next", "insert_new", "insert_relink"] },
  "data-structures/sets-tuples": { 1: ["set_def"], 2: ["set_def", "set_add", "set_in"], 3: ["set_add", "set_add_dup", "tuple_def"], 4: ["set_def", "tuple_def"], 5: ["set_in", "set_ops", "tuple_unpack"], 6: ["set_add", "set_in", "tuple_def"], 7: ["set_ops", "tuple_def", "tuple_key"] },
  "data-structures/hash-maps": { 1: ["dict_init"], 2: ["dict_init"], 3: ["hm_slot"], 4: ["hm_put_slot", "hm_put_scan", "hm_put_append"], 5: ["hm_put_scan", "hm_put_append"], 6: ["dict_init", "insert", "lookup"], 7: ["lookup"] },
  "data-structures/trees": { 1: ["node_class"], 2: ["node_class"], 3: ["dfs_visit", "dfs_children", "dfs_recurse"], 4: ["bst_start", "bst_eq", "bst_left", "bst_right"], 5: ["bst_start", "bst_eq", "bst_left", "bst_right"], 6: ["node_class", "dfs_visit"], 7: ["node_class", "dfs_visit"] },
  "data-structures/graphs": { 1: ["add_edge_a", "add_edge_b"], 2: ["add_edge_a", "add_edge_b"], 3: ["bfs_neighbors"], 4: ["bfs_seen", "bfs_append", "bfs_neighbors"], 5: ["bfs_seen", "bfs_append", "bfs_neighbors"], 6: ["sig", "neighbors"], 7: ["sig", "bfs_neighbors", "dfs_neighbors"] },
};
