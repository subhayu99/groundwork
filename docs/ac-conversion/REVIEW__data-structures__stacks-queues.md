# Tough Review — data-structures / stacks-queues

Scope: `lesson-spec.tsx` narration + per-beat `codeLabels` vs `derivation.tsx` (ground truth ideas) and `algorithm.py` (ground-truth code + real `@sync` labels).

Real `@sync` anchors in algorithm.py: `sig`, `push`, `pop`, `peek`, `qinit`, `enqueue`, `dequeue`. Every `codeLabels` value used in the lesson resolves to one of these — no phantom anchors. Good.

## Verdict: minor-fixes

The conversion is faithful: it keeps the wedge ("touch only the ends, what becomes free?"), the LIFO/FIFO contrast, the deque-vs-list cost point, and the generalization to a named pattern. The main problems are beginner-safety: several CS terms appear before (or without) a plain-words gloss, and one term (DFS/BFS) is never expanded at all.

---

### HIGH — beat `fits`: DFS / BFS used with zero plain-words explanation
Narration: "...the call stack..., recursion..., **DFS**. Pick a queue for the longest-waiter: scheduling, print jobs, **BFS**."
`call stack` and `recursion` get inline glosses, but `DFS` and `BFS` are dropped raw — acronyms a zero-CS 15-year-old cannot decode. The visual chips say "DFS (dive deep)" / "BFS (spread wide)" but the narration never connects to them.
Fix: expand inline, matching the chips: "...DFS (going as deep as you can before backing up)." and "...BFS (exploring everything one ring out at a time)." Or at minimum: "DFS and BFS — two ways of walking a maze, depth-first vs breadth-first."

### HIGH — beat `obvious`: `O(1)` / `O(n)` introduced as bare symbols
Narration: "...we call instant, length-independent cost `O(1)`. ...that cost grows with the count — `O(n)`."
`O(1)` is *partly* glossed ("instant, length-independent cost") so it scrapes by, but `O(n)` is attached only to "cost grows with the count," which is fine — however the *notation itself* (`O(...)`, the `n`) is never explained as "n = the number of items." A zero-CS reader sees `O(n)` as math noise.
Fix: add one clause at first use: "...— a cost that grows with the count of items (call that count `n`), written `O(n)`. The `O(1)` from before means the cost never grows at all." This makes the notation legible before it's reused in `operations`.

### MEDIUM — beat `setup`: term **stack**/**queue** not yet introduced, but that's intentional; real issue is "browser keeps your pages"
Narration is clean and term-safe (no jargon). No fix needed for safety. Faithfulness note only: derivation says "The newest page should come back first" — lesson says "back returns the newest one first." Equivalent. OK.

### MEDIUM — beat `operations`: **deque** glossed well, but `O(n)` reused assuming the `obvious` fix
Narration: "...not a plain list whose front-removal is `O(n)`."
`deque` is nicely glossed ("say 'deck': a row built to be fast at both ends"). The remaining `O(n)` is safe *only if* the `obvious` beat first defines what `O(n)` means (see HIGH above). If you apply the `obvious` fix, this is fine as-is.
Fix: none beyond the `obvious` fix. If you choose not to fix `obvious`, add "(its cost grows with the line length)" after this `O(n)` too.

### MEDIUM — beat `structure` & `fits`: codeLabels `["sig", "qinit"]` are weak anchors for what's shown
Beat `structure` narration defines LIFO (stack add/remove at top) and FIFO (queue add back / remove front). Highlighting `sig` (`history = []`) and `qinit` (`orders = deque()`) only shows the *declarations*, not the LIFO/FIFO behavior the narration is about. The behavior lines are `push`/`pop` (stack) and `enqueue`/`dequeue` (queue).
Fix: change `structure` codeLabels to `["sig", "qinit"]` → keep `sig`/`qinit` for "here are the two containers," that's actually defensible as the *introduction* of the two structures. LOW-confidence; acceptable. For beat `fits` ("when it fits"), `["sig","qinit"]` is similarly just pointing at the two containers — acceptable but bland; consider `["push","dequeue"]` to echo "newest-next vs oldest-next." Optional.

### LOW — `AutoStack` highlights `peek` on the empty stack
`lesson-spec.tsx` AutoStack: when the stack is empty it runs `api.onActiveLine(["peek"])` with note "empty — LIFO done". The `peek` line is `peek = history[-1]`, which on an empty list would raise. Highlighting it at the "empty" moment is mildly misleading — peek is a *look at the top*, not an *empty* signal.
Fix: drop the `["peek"]` highlight in the empty branch (leave the last `pop` highlighted), or keep `peek` highlighted only during the fill/idle phase, not at empty.

### LOW — beat `obvious` faithfulness drift: "removing from the end" dropped
Derivation step 2 explicitly teaches *both* "adding at the end is instant" AND "removing from the end, same thing" before contrasting the front. The lesson only says "Adding at the end is one move... But removing the front slides everyone left." Minor: the symmetry (end cheap both ways) is lost, slightly weakening the "same array, two costs" punchline.
Fix (optional): "Adding *or removing at the end* is one move... But removing the *front* slides everyone left."

### LOW — word counts
All panel `body` blocks are under ~45 words and read cleanly. `operations` is the longest (~52 words counting the parenthetical glosses) and is borderline run-on:
"On a stack, push, pop, and peek (look at the top without taking it) are all O(1). A queue's add/remove are O(1) too — if you use a deque (say 'deck': a row built to be fast at both ends), not a plain list whose front-removal is O(n)."
Fix (optional): split into two sentences at "A queue's add/remove..." to drop under 45 and ease the double-parenthetical load.

---

## Faithfulness check (passes)
- Wedge interaction preserved (push/pop on stack both touch top; add/remove on queue touch opposite ends) — and the lesson *improves* on derivation by making both stack AND queue interactive in `PushPopStack`. Good.
- Wedge question preserved: "if you promise to only ever touch the ends, what suddenly becomes free?"
- LIFO/FIFO defined in plain words ("last in, first out" / "first in, first out"). Good.
- deque-vs-list O(n) trap preserved.
- Generalization to "two contracts on a plain row, and the contract is what keeps every move instant" preserved in `name` beat — matches derivation step 7.
- "no middle / random access" idea: derivation states it twice (steps 5 & 6); lesson keeps the visual `✗ no middle` in `fits` but drops it from narration. Acceptable (visual carries it), but a half-line in `operations` ("there's no looking inside — only the ends") would match derivation more fully. Optional.

## Code coherence (passes, minor)
- All `codeLabels` map to real `@sync` anchors.
- `wedge` codeLabels `["push","pop"]` cover the stack; the queue ops are driven live via `onActiveLine(["enqueue"])` / `["dequeue"]` in the handlers, so they light up on click even though not in the static panel list. Coherent.
- `peek`-on-empty highlight (LOW above) is the only mismatch.
