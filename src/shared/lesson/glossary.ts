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
    "a little more than one pass over the list — like making an O(n) sweep about log n times; the usual cost of a good sort.",

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
    "a marker that simply remembers a position in the list, like a finger held on one card.",
};
