/**
 * NOTATION BRIDGE — plain-language glosses for the notation that first appears
 * in lessons. Each entry is ONE 10th-grade sentence, no jargon, so a reader with
 * no coding background can tap a term and keep going without getting stuck.
 *
 * Keys are matched case-insensitively by <Term> (see Term.tsx), so write keys in
 * their natural notation. Keep every value to a single plain sentence.
 */
export const GLOSSARY: Record<string, string> = {
  // ── Big-O cost shapes ──────────────────────────────────────────────────────
  "O(n)":
    "the work grows in step with the number of items — twice the list, twice the effort.",
  "O(n^2)":
    "the work grows with the number of items squared — twice the list means about four times the effort.",
  "O(n²)":
    "the work grows with the number of items squared — twice the list means about four times the effort.",
  "O(1)":
    "the work stays the same no matter how big the list gets — one step, every time.",
  "O(log n)":
    "the work grows by just one extra step each time the list doubles — so even a million items take only about twenty steps.",
  "O(n log n)":
    "a bit more than one pass over the list — for a million items, about twenty million steps; the usual cost of a good sort.",
  "O(V+E)":
    "the work grows with the number of nodes (V) plus the number of connections (E) — you touch each one once.",
  "O(V + E)":
    "the work grows with the number of nodes (V) plus the number of connections (E) — you touch each one once.",
  "O(cells + connections)":
    "the work grows with the number of cells plus the number of links between them — each gets looked at just once.",
  // composite sums — keyed in every spelling the lessons actually use (Term
  // matches the exact string, so spaced and unspaced variants each need a key).
  "O(n+m)":
    "the work grows with the sizes of the two inputs added together — every item in both gets touched once.",
  "O(n + m)":
    "the work grows with the sizes of the two inputs added together — every item in both gets touched once.",
  "O(m + n)":
    "the work grows with the sizes of the two inputs added together — every item in both gets touched once.",
  "O(j−i)":
    "the work grows with the size of the slice you take — just the stretch from position i up to j, one step per item copied.",
  "O(j-i)":
    "the work grows with the size of the slice you take — just the stretch from position i up to j, one step per item copied.",
  "O(j − i)":
    "the work grows with the size of the slice you take — just the stretch from position i up to j, one step per item copied.",
  "O(rows × cols)":
    "the work grows with the total number of squares in the grid — rows times columns, each visited once.",
  "O(r × c)":
    "the work grows with the total number of squares in the grid — rows times columns, each visited once.",
  "O(|A|+|B|)":
    "the work grows with the two set sizes added together (|A| just means how many items A holds) — every item in both gets touched.",
  "O(min(|A|,|B|))":
    "the work grows with the size of the smaller of the two sets — you only scan the little one and look the rest up.",
  "O(|A|)":
    "the work grows with the number of items in set A alone — one look at each.",

  // ── Notation that shows up in code ─────────────────────────────────────────
  "arr[i]":
    "the item at position i in the list (counting from 0, so arr[0] is the first one).",
  "//":
    "divide and drop the remainder, keeping only the whole number (7 // 2 = 3).",
  "lo":
    "a marker for the lowest position still worth searching — the start of what's left.",
  "hi":
    "a marker for the highest position still worth searching — the end of what's left.",
  "mid":
    "the position halfway between lo and hi — the middle item you check each round.",
  "L":
    "a marker (the left finger) for the position you're looking at from the left end.",
  "R":
    "a marker (the right finger) for the position you're looking at from the right end.",

  // ── Concept words ──────────────────────────────────────────────────────────
  "monotonicity":
    "the property that answers only ever change one way as you turn a dial — once it flips from no to yes, it stays yes.",
  "invariant":
    "a fact that stays true every single round, so you can trust it no matter how far along you are.",
  "amortization":
    "spreading a few expensive steps across many cheap ones, so the average cost per step stays small.",
  "recursion":
    "solving a problem by having it call a smaller copy of itself, until the copy is tiny enough to answer directly.",
  "pointer":
    "a stored link — either an index marking a position in a list (a finger on one card), or a reference to where another object lives in memory.",
  "monotonic":
    "only ever moving one way — never going up then down, or down then up.",
  "amortized":
    "spreading a few expensive steps across many cheap ones, so the average cost per step stays small.",
  "decomposition":
    "breaking a problem into smaller sub-problems you can solve one at a time.",
  "greedy":
    "taking the choice that looks best right now at every step, hoping the whole answer comes out best.",
  "dynamic programming":
    "solving a big problem by working out each smaller piece once and saving the answer to reuse.",
  "accumulator":
    "a single variable you keep adding to as a loop runs, holding the running total so far.",
  "call stack":
    "the running pile of function calls still waiting to finish; the newest sits on top and finishes first.",
  "frame":
    "the private workspace for one function call — its own copy of the inputs and local names.",

  // ── Programming basics ──────────────────────────────────────────────────────
  "assignment":
    "storing a value into a name with =, read right-to-left: work out the right side, then put it in the name on the left.",
  "string":
    "a piece of text, written inside quotes — like \"Ada\" or \"hello\".",
  "boolean":
    "a value that is either True or False — the answer to a yes/no question.",
  "condition":
    "a yes/no test (it works out to True or False) that decides whether a block of code runs.",
  "constant":
    "a value you decide never changes; by convention its name is written in CAPITALS.",
  "integer":
    "a whole number with no decimal point, like 7 or -3.",
  "operator":
    "a symbol that combines values — like + (add), > (greater than), or the word 'and'.",
  "expression":
    "any piece of code that works out to a single value, like 3 + 4 or score > 10.",
  "loop":
    "a block of code that runs again and again, instead of being written out many times.",
  "function":
    "a named set of steps you can reuse: hand it inputs and it hands back a result.",
  "parameter":
    "a named blank in a function definition, waiting for a value when the function is called.",
  "argument":
    "the actual value you pass to a function when you call it; it fills a parameter.",
  "exception":
    "an error raised while the program runs (like dividing by zero) that stops it — unless caught.",
  "if":
    "a branch that runs its block only when its yes/no test is true; otherwise that block is skipped.",
  "float":
    "a number with a decimal point, like 70.0 or 3.14 (short for floating-point).",
  "convention":
    "a shared habit, not a rule the computer enforces — the code still runs if you break it.",
  "infinite loop":
    "a loop whose stop-condition never becomes true, so it runs forever.",
  "block":
    "a group of lines that belong together, marked in Python by being indented the same amount.",
  "indented":
    "shifted right by spaces to show the lines belong inside the block above them.",

  // ── Data structures ─────────────────────────────────────────────────────────
  "hash map":
    "a lookup table that jumps straight to a value by its key, without scanning — like a dictionary.",
  "hash set":
    "a collection that stores only keys (no values) and can tell in one step whether something is in it.",
  "dynamic array":
    "a list that grows as you add items, making room automatically when it runs out.",
  "stack":
    "a pile where you only add to and take from the top — last in, first out.",
  "LIFO":
    "last in, first out — the most recently added item is the first one taken back off, like a stack of plates.",
  "FIFO":
    "first in, first out — items leave in the same order they arrived, like a queue at a counter.",
  "deque":
    "a double-ended queue: you can add or remove items from either end.",
  "node":
    "one item in a structure that also links to its neighbours — like a box that points to the next box.",
  "graph":
    "a set of items (nodes) joined by connections (edges) — like cities linked by roads.",
  "memory locality":
    "keeping data that's used together close together in memory, so the computer fetches it faster.",
};
