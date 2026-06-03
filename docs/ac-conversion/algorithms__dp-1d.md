# Annotated-canvas conversion — algorithms/dp-1d (Dynamic Programming)

Source lesson: 7 derivation steps (`derivation.tsx`), 3 visual phases (`visualizer.tsx`),
real code `algorithm.py`. Canvas design size: **860 × 470** (match the reference).

Code `@sync` labels available in `algorithm.py`:
`sig` · `base_check` · `base_return` · `init_table` · `loop` · `recurrence` · `answer`.

The visualizer has three visual phases mapped onto the 7 steps:
- Steps 1–2 → **StaircaseViz** (the staircase + naive call counter)
- Step 3 → **RecursionTreeViz** (toggleable memoization — the WEDGE)
- Steps 4–7 → **TabulationViz** (the dp array filling in, auto-playing)

Each derivation step becomes one beat below.

---

### Beat 1 — The setup · How many ways to climb the stairs?
- **narration**: You're at the bottom of an 8-step staircase. Each move you hop up 1 step or 2. How many different routes reach the top? For 1 step there's 1 way; for 2 steps, 2 ways; for 3 steps, 3 ways. For 8, too many to count by hand.
- **visual**: custom (staircase). Eight stacked treads labelled "step 1"…"step 8" climbing left-to-right, plus a small caption strip "8 steps · 1 or 2 at a time". No call-count numbers yet — keep it clean for the setup. All treads in idle tone.
- **panel**: top (clear of the staircase, which sits centre-low).
- **arrow**: from the panel down to the top tread (step 8) — "reach the top".
- **codeLabels**: `["sig"]` (just the function signature: "this is the question we're answering").
- **interaction**: none.

### Beat 2 — The obvious thing · Recursion does the same work over and over
- **narration**: Standing on step n, only your last move matters: you came from n−1 (a 1-hop) or n−2 (a 2-hop). So ways(n) = ways(n−1) + ways(n−2). A tiny rule — but computing ways(8) re-asks ways(6), ways(5)… the same questions, again and again. ("Recursion" = a rule that calls itself on a smaller case.)
- **visual**: custom (same staircase) with the naive call counter revealed below: "actual answer for 8 stairs = 34 routes" in the easy/green tone, and "naive recursive calls to count them = 67" in the hard/red tone, with the note "most of which compute the same sub-answer over and over." Tone the staircase down slightly so the numbers read.
- **panel**: top.
- **arrow**: from panel to the red call-count number — "this is the waste."
- **codeLabels**: `["sig"]` (the rule lives in the signature/docstring; the loop body isn't the point yet).
- **interaction**: none.

### Beat 3 — The wedge · Solve each subproblem once, then look it up
- **narration**: Here's the recursion tree for ways(6). Press play and watch how often the SAME call appears. Now toggle "remember answers": the second time a call comes back, we hand over the answer we already wrote down instead of recomputing. The tree collapses. (A "tree" here just means the branching picture of who-calls-whom.)
- **visual**: tree (RecursionTreeViz). Nodes are the values 6,5,4,3,2,1,0 with edges to their two children; repeated/reused nodes light up in the good/green tone once "remember answers" is on. Live "nodes computed" counter (red→green as it shrinks) and the toggle button "remember answers" / "naive".
- **panel**: top-left (tree fans out wide and tall; keep text off the branches).
- **arrow**: to a repeated node (e.g. one of the duplicate `2` leaves) — "computed twice = waste."
- **codeLabels**: `[]` (this beat is the memoization *idea* on the recursion tree, not the tabulated loop in `algorithm.py` — no honest line maps here; keep code panel quiet or on `sig`).
- **interaction**: **wedge** — user MUST toggle "remember answers" before continuing. (PRESERVE: this is the lesson's existing gating interaction via `onWedgeInteraction` / `onInteractionDone`.)

### Beat 4 — The derivation · Two flavours, same answer
- **narration**: Top-down: keep the recursive rule, add a notebook — before working, check if the answer's written down; after, store it. Bottom-up: drop recursion, fill a table from the smallest case up. dp[0]=1, dp[1]=1, then dp[i]=dp[i−1]+dp[i−2]. (dp[i] just means "ways to reach step i"; the [i] picks one slot.) The two values you need are already there.
- **visual**: array (TabulationViz, paused at start). A row of cells dp[0]…dp[8]; dp[0] and dp[1] filled with 1 (base values, easy tone), the rest showing "·" (empty). Caption "bottom-up · fill dp[i] = dp[i-1] + dp[i-2]".
- **panel**: top.
- **arrow**: bracket/arrow spanning dp[0] and dp[1] — "the two base values you start from."
- **codeLabels**: `["init_table"]` (`a, b = 1, 1` — the two base values; this is exactly dp[0], dp[1]).
- **interaction**: none (the auto-play happens on the next beat).

### Beat 5 — The operations · From exponential to one quick pass
- **narration**: Naive recursion roughly doubles its work per extra step — ways(40) calls itself a billion times. The table way computes each slot from 0 to n exactly once, one addition each: that's O(n) — "O(n)" means the work grows in step with the number of stairs n. Top-down stores n+1 answers; bottom-up keeps only the last two — O(1), a fixed amount however tall the staircase.
- **visual**: array (TabulationViz, **auto-playing**). The dp cells fill left-to-right one per frame; the just-filled cell glows in the sky/accent tone, filled cells in green, empty as "·". Live readout "ways to climb {i} stairs = {value}", and a ✓ when dp[8] lands.
- **panel**: bottom (so it never covers the filling row).
- **arrow**: to the currently-filling cell — "each slot: one addition, computed once."
- **codeLabels**: `["loop", "recurrence", "answer"]` — the live line marches from `loop` (the boundary `for _ in range(2, n+1)`) through `recurrence` (`a, b = b, a+b`) and lands on `answer` (`return b`) as the table finishes. (Visual emits these via `onActiveLine`.)
- **interaction**: **playback** (auto-animates; preserve AnimatedAlgorithmView's play-through).

### Beat 6 — The generalization · Wherever n depends on smaller n
- **narration**: The stairs aren't special. Any problem with a small self-referential rule whose pieces keep overlapping gets the same speed-up. Same shape, different stories: edit distance between two words, fewest coins for an amount, packing a bag under a weight limit, the cheapest path across a grid of costs. You need overlapping sub-parts and one fixed answer per part.
- **visual**: custom (gallery). The filled dp row from beat 5 shrinks to a small thumbnail top-left; beside it, 3–4 small iconic mini-canvases for the example problems (two words → edit grid; coins; a bag; a cost grid), each toned idle, captioned. The point: same skeleton, different story.
- **panel**: top.
- **arrow**: none (the panel names a family; arrows to four tiny icons would clutter — use captions under each icon instead).
- **codeLabels**: `["recurrence"]` (the one recurrence line is the transferable core — "this single line is what changes per problem").
- **interaction**: none.

### Beat 7 — The pattern · Dynamic Programming
- **narration**: That's the name — misleading, since nothing is "dynamic" in the everyday sense. It just means: solve overlapping subproblems once, write them down, look them up. You'll spot it on "number of ways / minimum cost / maximum value" problems where naive recursion explodes because the same call repeats, and where greedy fails because future choices depend on past ones.
- **visual**: array (final dp row, fully filled, all green, dp[8] = 34 marked ✓) plus the four "pattern signals" as a small bulleted list rendered inside the panel. The completed table is the trophy.
- **panel**: bottom (list of signals); title panel "Dynamic Programming." top.
- **arrow**: from the bottom panel up to the final dp[8] cell — "this number, computed in one pass."
- **codeLabels**: `["answer"]` (the `return b` — the looked-up final answer) plus open-drawer note that the memoized recursive form lives in the file's comment.
- **interaction**: none (final beat; "Mark complete").

---

## Notes

**Numbers to verify on render.** The lesson defines ways(0)=1, ways(1)=1, so the sequence is
1,1,2,3,5,8,13,21,34 → **ways(8) = 34**, not the "34 distinct routes" being separate from the
Fibonacci shift. The visualizer's `DP_VALUES` and `waysTrue` both produce 34 for N=8, and
`naiveCalls(8) = 67`. Use the live computed values (34 routes, 67 naive calls) in beats 1–2,
don't hard-code different numbers in the panel text.

**Indexing caution (the one real subtlety).** `algorithm.py` stores only `a, b` (two ints),
where after the loop `b = ways(n)`. The canvas, however, shows a *full* dp[0..n] array. That's
a deliberate teaching choice (the array makes "each slot once" visible), but the code's `a, b`
two-variable form is the O(1)-memory version. Beat 4/5 narration already flags this ("bottom-up
needs just the last two"), so the array-vs-two-vars mismatch is intentional — call it out in the
code panel caption if it confuses, but do NOT "fix" the array to two cells; the array is the
pedagogy.

**Beat 3 has no honest code line.** The recursion-tree/memoization beat illustrates an idea that
isn't in `algorithm.py` (the file ships the tabulated loop, with the memoized recursive form only
in a *comment*). `codeLabels: []` is correct here — don't fake-map it onto `loop`/`recurrence`,
which would mislead. Optionally light `sig` so the panel isn't blank.

**Wedge must be preserved.** Beat 3's toggle is the lesson's gating interaction. In the current
visualizer it's wired through `onWedgeInteraction` → the new contract's `onInteractionDone`.
Mark `interaction: "wedge"` and ensure "Next" stays disabled until the user toggles
"remember answers". This is the single most important interaction in the lesson — do not
downgrade it to autoplay.

**Jargon taught, first-appearance only (content rule).** Within this lesson the following are
introduced in plain words the first time they appear, then used freely:
recursion (a rule that calls itself on a smaller case), tree (the branching picture of
who-calls-whom), dp[i] / the [i] index (one slot = "ways to reach step i"), O(n) (work grows
in step with n), O(1) (a fixed amount regardless of n). "Memoization" is taught implicitly as
"remember answers / write it down and look it up" — keep that plain-language framing rather than
introducing the term cold.

**Mobile / dense visual.** Beat 3's tree for ways(6) is the widest/tallest visual (it computes W,
H dynamically and can exceed the 860×470 box). On narrow screens it may need horizontal scroll or
a smaller depth; consider ways(5) on mobile. Beat 6's 4-icon gallery is also dense — stack the
icons vertically under a stacked panel on mobile rather than 4-across.

**No content bug found** in the claims themselves — the recurrence, the 34 answer, the O(n)/O(1)
costs, and the "greedy fails" signal are all correct. The only watch-item is the array-vs-two-vars
representation gap above, which is intentional pedagogy, not a bug.
