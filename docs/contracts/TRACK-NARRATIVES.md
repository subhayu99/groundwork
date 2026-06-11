# TRACK NARRATIVES (L0.12 · gates the L1 wave)

What each track is a story OF, what every topic stands on, and which of the seven
ideas each topic stamps. L1 agents: your topic's `bridgeFrom` line and `principle`
stamp come FROM THIS FILE — don't re-derive them. Topic order and prerequisites
below are read from `src/categories/registry.ts` + each topic's `meta.ts`; the seven
principles from `src/principles/registry.ts`.

The seven ideas (registry order = the `n` in "idea n of 7"):

| n | key | universal framing |
|---|---|---|
| 1 | `information-reuse` | Don't re-figure-out what you already figured out. |
| 2 | `search-space-pruning` | Eliminate half the possibilities instead of checking each one. |
| 3 | `monotonicity-and-invariants` | Maintain a guarantee that lets you skip work. |
| 4 | `decomposition` | Solve a smaller version of the same problem. |
| 5 | `trade-space-for-time` | Write it down so you can look it up instantly. |
| 6 | `amortization` | Pay a little extra sometimes so the average is cheap. |
| 7 | `greedy-choice` | The locally best choice is globally best — when you can prove it. |

---

## Track 1 — Programming Basics (9 topics)

**The arc: from naming one value to writing a procedure that survives the real world.**

The track builds ONE program-shaped skill, a layer at a time. `variables` opens the
whole platform: a name that remembers a value, so nothing is figured out twice.
`constants` and `data-types` harden that move — a name can carry a promise (never
changes) and a guarantee (what kind of thing it is). `operators` makes stored values
combine into new ones; `conditionals` is the first real power: a yes/no test that
makes the computer take one road and abandon the other. `while-loops` turns one
decision into repetition with a stop-promise; `for-loops` tames repetition over a
collection and introduces the accumulator — the running answer carried through the
loop. `functions` folds everything so far into a named, reusable step; `try-except`
admits the world misbehaves and keeps the procedure standing when it does. By the
close, the learner can read every line of `algorithm.py` that the rest of the
platform will show them — that is this track's promise to the other two.

## Track 2 — Data Structures (8 topics)

**The arc: every structure is a deal — what you pay to store, what you get back instantly.**

`arrays` is the foundation stone and the bridge out of basics: once you can loop over
a collection, here is the structure underneath — a numbered row of boxes where
position `i` costs one step, always. `strings` is the same row wearing text's
clothes, with one twist (immutability) that makes costs honest. `stacks-queues`
restrict the row on purpose: take only from the top / only from the front, and order
becomes a guarantee you can build on. `linked-lists` break the row apart — boxes that
point to boxes — trading instant position for cheap splicing, and quietly introducing
the shape that recursion loves: a chain is a head plus a smaller chain.
`hash-maps` are the track's thunderclap: spend memory on a clever filing system and
"is it here?" stops depending on size at all. `sets-tuples` are that same deal
stripped to membership, plus the unchangeable record. `trees` let chains branch —
hierarchy, and halves you can throw away. `graphs` finish it: anything can point to
anything, and every earlier structure (maps for neighbours, queues/stacks for
walking) becomes the toolkit for exploring a web. The track ends where algorithms
begin: structures chosen, costs known.

## Track 3 — Algorithms (12 topics)

**The arc: the seven ideas in action — every algorithm is a disciplined way to NOT do work.**

The track opens with the array-walkers: `two-pointers` (let a kept promise — sorted
order — steer two fingers so most pairs are never looked at), `binary-search` (ask
the middle, throw half away — the purest "eliminate, don't check"), and
`sliding-window` / `sliding-window-variable` (reuse yesterday's sum instead of
re-adding; stretch and shrink while keeping the window's promise true).
`monotonic-stack` shows a subtler ledger: each item pays at most once on, once off —
expensive moments, cheap average. `activity-selection` is the lone pure-greedy story:
prove the earliest-finish choice safe, then never look back. Then the track changes
gear into self-similar problems: `recursion` (trust the smaller call), `dfs` (recurse
through a space — go deep, back up), `bfs` (same exploration, queue instead of stack,
and depth becomes distance — shortest paths fall out), `dp-1d` (recursion meets the
hash-map: remember sub-answers, exponential collapses to linear), `backtracking`
(dfs over choices, pruning dead branches wholesale), and `mergesort` (decomposition
made total: split to trivial, merge with two pointers — the track's ideas reunited
in one algorithm). Finish the track and the seven stamps are all collected at least
once — the thesis made visible.

---

## The `bridgeFrom` convention

`spec.bridgeFrom` is **one register-aware line** (≤ ~120 chars per variant), rendered
on beat 1 (scene layout), that recalls **the bridge anchor's takeaway** — the idea
the learner just banked — and tips it forward into this lesson:

- Shape: *"[anchor's takeaway, recalled in this register's voice] — [what this
  lesson does to it]."*
- It references the anchor's **idea**, not just its name. ("You can find anything in
  a sorted row by halving" — not "After Binary Search…".)
- Author via `reg({ base, intuitive, rigorous })`: base = structured tone;
  intuitive re-says the recall in everyday words; rigorous compresses it to the
  formal hook. Same recalled fact in all three.
- The **anchor is fixed in the table below** (derived from `meta.ts` prerequisites:
  the latest prerequisite in learn order; where the track's previous topic is the
  sharper contrast — bfs after dfs — the table says so). Don't pick your own.
- First-in-platform (`variables`) has **no** `bridgeFrom` — it is the front door.
- Cross-track anchors are deliberate (arrays ← for-loops): they stitch the tracks
  into one curriculum.

## The PrincipleStamp mapping — all 29 topics

`spec.principle = { key, n, total: 7 }` (chip links to `/principles/{key}`). The
`key`/`n` per topic are FIXED below. Where `meta.ts` lists principles, the primary is
`meta.principles[0]` (secondaries noted); where `meta.principles` is empty
(all of programming-basics + four data structures), the assignment is this
contract's call — flagged ⚑ — chosen as the principle the topic most honestly
*seeds*. The stamp copy for ⚑ topics should read as foreshadowing ("the seed of idea
n of 7"), not as a claim the topic IS the algorithmic idea.

| # | topic (key) | track | bridge anchor | principle (primary) | n/7 | rationale |
|---|---|---|---|---|---|---|
| 1 | `variables` | basics | — (front door) | `information-reuse` ⚑ | 1 | a name remembers a computed value — never figure it out twice |
| 2 | `constants` | basics | `variables` | `monotonicity-and-invariants` ⚑ | 3 | a value that is a kept promise — the first invariant |
| 3 | `data-types` | basics | `variables` | `monotonicity-and-invariants` ⚑ | 3 | a type is a standing guarantee about what a value can do |
| 4 | `operators` | basics | `variables` | `decomposition` ⚑ | 4 | big expressions evaluate as small ones combined |
| 5 | `conditionals` | basics | `operators` | `search-space-pruning` ⚑ | 2 | one test abandons a whole branch of what-could-run |
| 6 | `while-loops` | basics | `conditionals` | `monotonicity-and-invariants` ⚑ | 3 | the guard + progress toward it is what proves the loop stops |
| 7 | `for-loops` | basics | `while-loops` | `information-reuse` ⚑ | 1 | the accumulator carries everything learned so far through the loop |
| 8 | `functions` | basics | `conditionals` | `decomposition` ⚑ | 4 | a program becomes smaller named problems |
| 9 | `try-except` | basics | `functions` | `amortization` ⚑ | 6 | keep the common path cheap; the rare failure pays |
| 10 | `arrays` | data-structures | `for-loops` (cross-track) | `trade-space-for-time` ⚑ | 5 | pay contiguous layout, get position `i` in one step |
| 11 | `strings` | data-structures | `arrays` | `monotonicity-and-invariants` ⚑ | 3 | immutability is an enforced invariant — and why edits cost a copy |
| 12 | `stacks-queues` | data-structures | `arrays` | `monotonicity-and-invariants` | 3 | from meta — LIFO/FIFO order is a guarantee you build on |
| 13 | `linked-lists` | data-structures | `arrays` | `decomposition` ⚑ | 4 | a chain is a head plus a smaller chain — the first recursive shape |
| 14 | `hash-maps` | data-structures | `arrays` | `trade-space-for-time` | 5 | from meta — spend memory, membership stops depending on size |
| 15 | `sets-tuples` | data-structures | `hash-maps` | `trade-space-for-time` | 5 | from meta — the hash deal stripped to membership |
| 16 | `trees` | data-structures | `linked-lists` | `decomposition` | 4 | from meta — a tree is a node plus smaller trees |
| 17 | `graphs` | data-structures | `trees` | `trade-space-for-time` ⚑ | 5 | adjacency list: write the connections down once, look them up instantly |
| 18 | `two-pointers` | algorithms | `arrays` | `monotonicity-and-invariants` | 3 | from meta — sorted order steers the fingers; most pairs never checked |
| 19 | `binary-search` | algorithms | `arrays` | `search-space-pruning` | 2 | from meta — ask the middle, half the world dies |
| 20 | `sliding-window` | algorithms | `arrays` | `information-reuse` | 1 | from meta (secondary: 3) — reuse yesterday's sum: subtract the leaver, add the joiner |
| 21 | `sliding-window-variable` | algorithms | `sliding-window` | `information-reuse` | 1 | from meta (secondary: 3) — same reuse; the invariant now drives the shrink |
| 22 | `monotonic-stack` | algorithms | `stacks-queues` | `amortization` | 6 | from meta — each element pays once on, once off |
| 23 | `activity-selection` | algorithms | `arrays` | `greedy-choice` | 7 | from meta — earliest finish, proven safe, never reconsidered |
| 24 | `recursion` | algorithms | `trees` | `decomposition` | 4 | from meta — trust the smaller call |
| 25 | `dfs` | algorithms | `recursion` | `decomposition` | 4 | from meta — recursion walking a space: go deep, back up |
| 26 | `bfs` | algorithms | `dfs` (track contrast; queue ← `stacks-queues`) | `monotonicity-and-invariants` | 3 | from meta — the frontier's promise: nearer is always dequeued first |
| 27 | `dp-1d` | algorithms | `recursion` | `information-reuse` | 1 | from meta (secondary: 4) — remember sub-answers; exponential collapses |
| 28 | `backtracking` | algorithms | `dfs` | `search-space-pruning` | 2 | from meta (secondary: 4) — abandon dead branches wholesale |
| 29 | `mergesort` | algorithms | `recursion` | `decomposition` | 4 | from meta — split to trivial, merge with two pointers |

Sanity: 29 rows; all 7 principles used (1×5, 2×3, 3×7, 4×7, 5×4, 6×2, 7×1).

**Category chapter pages (L2.5) consume the three arcs above; the completion
ceremony (L2.6) and `/progress` ideas-collected (L2.4) consume the stamp column.**
If a stamp assignment proves wrong while authoring (the lesson's actual content
argues for a different primary), do NOT silently diverge: flag it in the PR's
Assumptions block and update THIS table in the same PR.
