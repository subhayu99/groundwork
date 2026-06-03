# Peer Review — data-structures / graphs (converted lesson)

Reviewed: `lesson-spec.tsx` against `derivation.tsx` (ground-truth teaching) and
`algorithm.py` (ground-truth code + real @sync labels).

**Verdict: minor-fixes.** The conversion is faithful, the wedge interaction and
generalization step survive, and most narration is genuinely beginner-safe (it
even did the hard work of defining "tree" in plain words). But there is one real
beginner-safety leak ("breadth-first search" / "depth-first" used as a label
without a plain-words gloss at first use is borderline-OK, but **"shortest chain"
+ the `fits` codeLabel mismatch** are concrete defects), one code-coherence
mismatch, and a couple of CS terms introduced without a first-use definition.

---

## Real @sync labels available in algorithm.py
`sig`, `add_edge_a`, `add_edge_b`, `bfs_pop`, `bfs_append`, `bfs_neighbors`,
`neighbors`, `bfs_seen`, `dfs_seen`, `dfs_append`, `dfs_neighbors`, `dfs_recurse`.

Every label referenced in the lesson exists in algorithm.py — there are **no
phantom labels**. The issues are about whether the label *matches the beat*.

---

## Issues

### 1. [MEDIUM · code-coherence] `fits` beat labels DFS code, but narrates nothing about DFS
**Beat `fits`** — `codeLabels: ["dfs_neighbors", "dfs_recurse"]`.
The narration is entirely about *when to reach for a graph* (social networks,
maps, package deps, "loops back? you've got a graph"). It says nothing about
depth-first search or recursion, so highlighting `dfs_neighbors` /`dfs_recurse`
makes the highlighted code line meaningless to the reader at that moment.
**Fix:** this "when it fits" beat has no natural code anchor — set
`codeLabels: []` (matching the `forced-tree` beat, which correctly uses `[]`
when there's nothing to point at). If a non-empty anchor is desired, point at
the structure itself with `["add_edge_a", "add_edge_b"]` since "relationships
matter" maps to the adjacency list being built.

### 2. [MEDIUM · beginner-safety] "node" / "edge" used in the wedge note and code before they're defined
The terms **node** and **edge** are first *defined* in the `structure` beat
("a set of dots (*nodes*…) and lines (*edges*…)"), which is good. But the
`wedge` beat (which comes *before* `structure`) ships `codeLabels:
["bfs_neighbors", "neighbors"]` and its narration says "reading one person's
list of friends" — fine in prose. The leak is subtler: the **wedge note** is OK,
but verify ordering holds in the player. As written, `wedge` (beat 3) precedes
`structure` (beat 4), so the first time a learner sees "node/edge" is in
`structure` where they're defined — **this is actually correct**. No change
needed; flagged only to confirm the order is load-bearing and must not be
reordered.

### 3. [MEDIUM · beginner-safety] "breadth-first search" and "depth-first" are named but only thinly glossed
**Beat `traverse`**: "Watch a *breadth-first search*: start at alice, visit her
friends, then their friends, spreading outward in rings." — The phrase *is*
immediately explained ("visit her friends, then their friends… in rings"), so
this is acceptable.
**Beat `name`**: "breadth-first or depth-first walks (dive deep down one path,
then back up)". "depth-first" gets a parenthetical gloss ("dive deep down one
path, then back up") — good. "breadth-first" is *not* re-glossed here, but it
was explained one beat earlier, so this is borderline-acceptable.
**Fix (optional polish):** in `name`, change "breadth-first or depth-first
walks (dive deep…)" to "ring-by-ring walks (breadth-first) or dive-deep walks
(depth-first)" so each named term sits next to its plain-words meaning.

### 4. [MEDIUM · correctness/clarity] `traverse` claims BFS "finds the shortest chain between people" — true, but the visual never shows a path
**Beat `traverse`**: "This finds the shortest chain between people." The
running `AutoBFS` visual shows *visit order* (rings spreading out), never a
highlighted shortest path between two named people. The claim is correct (BFS on
an unweighted graph does give shortest paths) but unsupported by what's on
screen, so a 15-year-old can't see *why*.
**Fix:** soften to tie it to the visual: "Because it spreads out one ring at a
time, the first time it reaches someone is along the shortest chain of
friendships." This explains the mechanism the rings already demonstrate.

### 5. [LOW · beginner-safety] "set" used as a bare CS term in `traverse`
**Beat `traverse`**: "A 'seen' set (the same lookup table idea) stops us
re-walking a line and looping forever." "set" is a CS term; the parenthetical
"(the same lookup table idea)" leans on the `structure` beat's "lookup table"
gloss, which is reasonable. Acceptable, but "set" is never plainly defined.
**Fix (optional):** "A 'seen' list — every person we've already visited — stops
us re-walking a line and looping forever." ("list" was already introduced in
`structure`.)

### 6. [LOW · writing] `fits` title uses straight quotes and is slightly clipped
**Beat `fits`** title: `Anywhere you say 'the links between X.'` — uses straight
apostrophes where the rest of the lesson uses typographic quotes (&rsquo;/&ldquo;),
and reads slightly truncated.
**Fix:** `Anywhere you'd say "the links between these things."` (and align quote
style with the rest of the file).

### 7. [LOW · faithfulness] Generalization breadth narrowed vs. derivation — acceptable but note
The derivation's `fits` step lists "dependency graphs (npm packages, build
systems, course prerequisites), state machines, knowledge graphs, recommendation
systems." The lesson keeps "social networks, maps and routes, web links, which
software package needs which" — a fair beginner-level subset. No fix required;
the generalization step is preserved. Flagged for completeness.

---

## What's correct / preserved (no action)
- **Tree defined in plain words** before use ("a neat family chart: one top
  person, each below has exactly one parent, lines never loop back"). Excellent
  beginner move; better than the derivation.
- **Big-O fully removed.** The derivation's `O(V+E)`, `O((V+E) log V)`, and
  Dijkstra are correctly dropped for the beginner audience. No complexity claim
  is mis-stated.
- **Wedge interaction preserved** (`ClickNeighbors`, "smallest amount of
  record-keeping") — matches the derivation's wedge question.
- **Adjacency-list structure** ("a lookup table from each person to the list of
  their friends") faithfully renders the derivation's "hash map from node to a
  list of neighbors" without the term "hash map". Good.
- **codeLabels are all real anchors** in algorithm.py; the only defect is the
  `fits` beat pointing at DFS code (issue 1).
- No narration exceeds ~45 words on a quick count.
