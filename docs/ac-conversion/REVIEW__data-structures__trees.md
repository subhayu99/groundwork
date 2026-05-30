# Tough Review — data-structures / trees

Files reviewed:
- `src/categories/data-structures/topics/trees/lesson-spec.tsx` (converted)
- `src/categories/data-structures/topics/trees/derivation.tsx` (ground truth narration)
- `src/categories/data-structures/topics/trees/algorithm.py` (ground truth code + @sync labels)

Real @sync labels in algorithm.py:
`node_class, dfs_visit, dfs_children, dfs_recurse, bst_class, bst_insert_empty, bst_insert_new, bst_insert_left, bst_insert_right, bst_start, bst_loop, bst_eq, bst_left, bst_right`

Verdict: **needs-work** — the lesson is faithful, the wedge/playback interactions are intact, and every codeLabel string is a real @sync anchor. But two beats dump CS jargon and Big-O on a 15-year-old without first-use plain-words teaching, and one beat's codeLabels point at insertion code the narration never discusses.

---

## HIGH — beginner-safety

### H1. Beat `operations` — "O(n)" / "O(log n)" used as the lead, before "Big-O" is ever introduced
Phrase: *"Visiting every node costs **O(n)** … A Binary Search Tree … **O(log n)** — doubling the tree adds just one step"*

The notation is partly glossed ("n" is the node count; "doubling adds one step"), which is good — but the raw symbols `O(n)` and `O(log n)` are thrown at the reader as if already known, and the word **log** is never explained. A zero-CS 15-year-old does not know what `O(...)` means or what a logarithm is. The derivation itself softens this with inline parentheticals ("cost grows in step with the number of nodes", "cost grows very slowly").

Fix: lead with the plain idea, keep the symbol as a labelled aside:
*"Visiting every box means touching all of them, so the work grows in step with the number of boxes — twice the boxes, twice the work. (Shorthand: **O(n)**, where n is the box count.) A **Binary Search Tree** keeps smaller values left and larger right, so a lookup is just a chain of left/right turns. Doubling the tree adds only one more turn — that 'add one step when you double' growth is so slow it has its own shorthand, **O(log n)**, if the tree is balanced (no branch much longer than the rest)."*

### H2. Beat `fits` — "O(1)" used without ever defining it; "hash map" glossed but Big-O is not
Phrase: *"a **hash map** (a lookup table) finds one value instantly, **O(1)**"*

"hash map" is helpfully glossed as "a lookup table" — good. But `O(1)` is dropped raw. A beginner has no anchor for it. The derivation glosses it inline as "(instant)".

Fix: *"a **hash map** (a lookup table) jumps straight to one value in a single step no matter how big it gets — that 'always one step' speed is written **O(1)** — but it keeps nothing in order."*

---

## MEDIUM

### M1. Beat `fits` — codeLabels don't match the narration (CODE COHERENCE)
codeLabels: `["bst_insert_left", "bst_insert_right"]`.
Both are real @sync anchors, but they live in `bst_insert()` (lines 30, 32) — the *insertion* routine. This beat's narration is entirely about *when to choose* a tree vs a BST vs a hash map; it never mentions or shows insertion. The reader following the synced code highlight will be staring at insert branching that the prose never explains. This is a label/narration mismatch.

Fix options:
- Best: drop the codeLabels for this beat (`codeLabels: []`) — it is a "when to reach for it" beat with no specific code to anchor.
- Or, if a code anchor is wanted, point at the two class definitions the beat contrasts: `["bst_class"]` (the ordered structure) — but `[]` is cleaner since the beat is about selection, not mechanics.

### M2. Beat `wedge` — "pointer" introduced but only half-defined; "node" is fine
Phrase: *"that single link from one node to another is a **pointer**"*

"node" is cleanly taught ("Each box here is a node — one person") — good. "pointer" is defined as "that single link from one node to another", which is acceptable, but the sentence is doing two jobs at once ("A node remembers only its direct reports; that single link … is a pointer") and a beginner may not connect "remembers its direct reports" with "a link." Minor.

Fix (tighten): *"Each box is a **node** — one person. A node only knows who reports directly to it; each of those 'knows-about' arrows is called a **pointer**. Click anyone: only their branch lights. You didn't search the company — you followed the arrows down."*

### M3. Beat `operations` — "balanced" is used as the load-bearing condition but only parenthetically defined
Phrase: *"if it's balanced (no branch much longer than the others)"*

The parenthetical is actually a decent plain-words gloss — keep it. The issue is ordering: the O(log n) claim is asserted, then the critical caveat that makes it true is tucked in a trailing parenthetical. For a beginner the caveat should not feel optional. Minor, folded into the H1 rewrite above.

### M4. Beat `structure` — "graph" introduced as a term without a one-line plain meaning
Phrase: *"No box ever points back up; that loop-back would make it a **graph**."*

Faithful to the derivation (which says the same). But "graph" is bolded like a taught term yet never defined — a beginner reads it as jargon. The derivation has the identical issue, so this is inherited, not introduced. Low-medium.

Fix: *"No box ever points back up. The moment links can loop back, it's no longer a tree — it's the more tangled cousin called a **graph**."*

---

## LOW

### L1. Beat `operations` caption vs panel — consistent, good
The visual caption ("found 35 in N steps — never touched the other half") reinforces the O(log n) "skip half" intuition that the panel only states abstractly. Good pairing; no change. (Noting as a positive.)

### L2. Beat `name` — "heaps … keeps the biggest (or smallest) item ready at the top"
Accurate and beginner-safe gloss; better than the derivation's "tree-shaped priority queue" (which uses the undefined term "priority queue"). Improvement over ground truth. No change.

### L3. Faithfulness check — PASS
- Wedge interaction (click a person → branch lights, "you followed pointers, didn't search") preserved.
- Generalization step (beat `name`: "all share one skeleton: nodes holding child links, rooted at the top") preserved and matches derivation step 7.
- Real idea (hierarchy you can walk; BST = ordered shortcut; reach for BST only when you need ordering) all present.
- One faithful trim: derivation lists DFS vs BFS explicitly; the lesson collapses traversal to "visit every node = O(n)" and lets the wedge/dfs labels carry it. Acceptable simplification, and the `dfs_visit/dfs_children/dfs_recurse` highlight in the wedge beat covers traversal mechanics.

### L4. Content correctness — PASS
- BST orientation (smaller left, larger right) matches algorithm.py and BST layout data.
- Complexity recap grid is correct: walk = O(n), balanced lookup = O(log n), lopsided = O(n), insert/delete = O(log n) avg. All accurate.
- "Databases use B-trees: a wide-branching BST" matches derivation. Correct.

### L5. Writing / length — PASS with one watch
Beat `operations` body is ~62 words and beat `fits` body is ~58 words — both over the ~45-word guideline and both made denser by the un-glossed Big-O. The H1/H2 rewrites above naturally split these into shorter clauses; applying them also brings length back in line. No other run-ons.

---

## Summary of required changes
1. (H1) Rewrite `operations` body to teach O(n)/O(log n)/"log" in plain words before the symbol.
2. (H2) Rewrite `fits` body to define O(1) in plain words at first use.
3. (M1) Change `fits` codeLabels from `["bst_insert_left","bst_insert_right"]` to `[]` (beat is about selection, not insertion mechanics).
4. (M2/M4) Minor tightening of `wedge` ("pointer") and `structure` ("graph") wording.
