# Peer Review — Algorithms / DFS lesson conversion

Files reviewed:
- `src/categories/algorithms/topics/dfs/lesson-spec.tsx` (converted lesson)
- `src/categories/algorithms/topics/dfs/derivation.tsx` (ground truth narration)
- `src/categories/algorithms/topics/dfs/algorithm.py` (ground-truth code + real @sync labels)

Real @sync anchors in algorithm.py: `sig, visited, found, visit, neighbors, recurse, backtrack`.

**Verdict: minor-fixes.** The conversion is faithful, the wedge interaction and generalization
step survive intact, every `codeLabels` entry maps to a real @sync anchor, and the two hardest
jargon terms (`O(...)`, `stack`) are actually taught in plain words at first use. The defects are
a stale code comment that misstates the neighbour order, a couple of undefined-jargon slips
("caller", "returns a trail"), and two narration blocks that run past the ~45-word ceiling.

---

## CODE COHERENCE — codeLabels vs @sync (all valid)

Every `codeLabels` array references real anchors. No invented labels. Per-beat mapping is sound:

| beat | codeLabels | assessment |
|------|-----------|------------|
| setup | `["sig"]` | OK — signature intro |
| obvious | `[]` | OK — brute force, no code yet |
| wedge | `["recurse","visit"]` | OK — stepping marks visited + recurses |
| derive | `["found","visit","neighbors","recurse","backtrack"]` | OK — the three-case body, all inner lines |
| operations | `["visited","recurse"]` | OK — visited set + call-stack growth |
| general | `["neighbors","recurse"]` | OK |
| name | `["found"]` | OK |

No mismatches found in the static label sets. The live `onActiveLine` calls in `ManualWalk`
(`found`, `recurse/visit`, `backtrack`) and `dfsStep` also use only real anchors.

---

## ISSUES

### 1. [MEDIUM · correctness] `derive` narration is 70 words and uses raw code syntax
Beat `derive`, body. The block is ~70 words (ceiling ~45) and opens with `explore(cell, trail)`
plus uses "if one returns a trail" and "your caller". "caller" is undefined CS jargon at first
use; a 15-year-old does not know a function has a "caller". Recursion itself IS defined inline
(good), so the only fixes are length + "caller".

Fix — split and replace "caller" with "the cell you came from":
> Name the move `explore(cell, trail)` — the `trail` is the cells walked so far. Three cases.
> On **G**: hand back the trail. On any other cell: mark it visited, then ask each open,
> unvisited neighbour the same question — if one hands back a trail, you're done. Out of
> neighbours: hand back nothing, and the cell you came from tries its next direction. A problem
> solved by solving smaller copies of itself is **recursion**.

### 2. [MEDIUM · writing] `operations` narration is ~75 words
Beat `operations`, body. Content is correct and `O(cells + walls)` and `stack` are both taught
in plain words (good), but the single block runs long and is hard to parse in one breath.

Fix — break into two sentences and trim:
> How the work grows as the maze gets bigger is written **O(cells + walls)** — here just a few
> dozen checks, because the visited mark means each cell is the current cell at most once.
> The memory comes from the **stack**: the pile of paused steps waiting to resume, newest first.
> The live trail **is** that stack — a 20-cell detour piles 20 deep before it retreats.

### 3. [LOW · correctness] Stale code comment: DIRS order does not "mirror" algorithm.py
`lesson-spec.tsx` line 41 comment: *"DFS direction order: right, down, left, up — mirrors
algorithm.py's neighbour loop."* The lesson `DIRS` is `[[0,1],[1,0],[0,-1],[-1,0]]` (right, down,
left, up), but algorithm.py's loop is `((-1,0),(1,0),(0,-1),(0,1))` (up, down, left, right). They
do NOT mirror each other. This is a code comment, not learner-facing narration, so it cannot
mislead a student — but it is a false claim in the source and will confuse the next editor, and
the animated walk order genuinely differs from the @sync'd code the drawer shows.

Fix — either reorder `DIRS` to `[[-1,0],[1,0],[0,-1],[0,1]]` to actually match the Python, or
correct the comment to: *"DFS direction order: right, down, left, up. (algorithm.py uses
up/down/left/right; any fixed order is valid DFS.)"*

### 4. [LOW · beginner-safety] "returns a trail" / "hand back" lean on call-return mechanics
Beats `derive` (and echoed implicitly elsewhere). "returns a trail" assumes the learner knows a
function "returns" a value. It is mostly softened to "hand back the trail" (good, plain), but one
instance still says "if one returns a trail". Make it consistent with the plain phrasing.

Fix: change "if one returns a trail, you're done" → "if one hands back a trail, you're done"
(folded into the Issue 1 rewrite above).

---

## FAITHFULNESS — preserved

- Wedge interaction (click-to-step + back-up + the "smaller copy of the same question" note)
  is intact and matches derivation step 3.
- Derivation's three-case decomposition is preserved (derive beat).
- Generalization step (folders / friends / webpages / sudoku / connected groups) is preserved
  (general beat) and the "anything with neighbours" framing matches step 6.
- Pattern-signal naming (path/connect, visit-every-connected, try-undo-try, calls-itself) matches
  step 7.
- Dropped from step 5: the heap / explicit-stack "different bookkeeping" paragraph. This is an
  acceptable simplification — "heap" would itself need teaching and is not core to DFS.

## BEGINNER-SAFETY — terms that ARE taught (no action needed, noting the good calls)
- `O(cells + walls)` — taught: "How the work grows as the maze gets bigger is written…".
- `stack` — taught: "the pile of paused calls waiting to resume, newest first".
- `recursion` — taught: "A problem solved by solving smaller copies of itself".
- `node` — taught: "(just a thing-with-links: a dot)".
- `1,048,576` blind sequences = 4^10, matches "over a million for just ten steps". Correct.
