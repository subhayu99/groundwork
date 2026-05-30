# Annotated-Canvas Conversion — Linked Lists

Topic: `data-structures/linked-lists` · 7 derivation steps → 7 beats.
Canvas model matches `src/app/sandbox/annotated-canvas/page.tsx`: visual lives in an SVG
coordinate box, the step's explanation becomes a text panel placed on the plane with an
arrow to the element it describes, and the real `algorithm.py` docks beside the canvas with
the active line(s) following the beat.

Code anchors available in `algorithm.py`:
`node_class`, `node_value`, `node_next`, `sig` (insert_after signature),
`insert_new`, `insert_relink`, `remove_relink`, `traverse_init`, `traverse_loop`, `traverse_advance`.

---

### Beat 1 — The setup · Add one item to a sorted list, without disturbing the rest
- **narration**: You keep friends in alphabetical order. New friend Charlie arrives between B and D. Everyone from D onward must slide down one spot to open a gap. Fine for ten names — painful for ten million. Can we add Charlie without bothering people who don't care he exists?
- **visual**: `array` — a row of sorted name/number cells `[A, B, D, E, F, G, H]` (use the existing `[1,2,4,5,7,8,10]` row from `ArrayShiftViz`, the gap where `3` belongs sitting between cells 2 and 4). All cells toned "live/idle"; the gap position faintly marked. Nothing moves yet — this beat poses the question.
- **panel**: top
- **arrow**: from the panel down to the gap between the 2nd and 3rd cells (where Charlie/`3` wants to land).
- **codeLabels**: `[]` (setup — no code yet)
- **interaction**: none

### Beat 2 — The obvious thing · Arrays force a domino effect
- **narration**: In an array, an address is just a position in line. Drop Charlie at slot 2 and slot 3 must become Dana, slot 4 Eli, slot 5 Frank — every later name physically shifts right. One insertion, n shoves (n = how many names sit after Charlie). The facts didn't change; the fixed positions forced the work. What if positions weren't fixed?
- **visual**: `array` — same row, now mid-insert: cell `3` enters at index 2 toned "entering/mid", and every cell from old-index-2 onward toned "visited/shifted" with a right-shift motion. A live "total shifts paid: n" counter beneath (reuse `ArrayShiftViz`'s `shifts` readout). Playback animates the cascade of shoves.
- **panel**: bottom
- **arrow**: from the panel up to the first shifted cell (the leftmost cell that had to move right).
- **codeLabels**: `[]` (this is the naive array cost — the .py is the linked-list answer, not shown yet)
- **interaction**: playback (auto-animate the shift cascade)

### Beat 3 — The wedge · Each card points to the next
- **narration**: Now meet cards joined by arrows. Each card holds a value AND an arrow saying where the next card lives — that arrow is called a "pointer." Order lives in the arrows, not in where cards sit on screen. Click "insert after 2," then "remove the 3rd card," and count: how many existing cards actually had to change?
- **visual**: `custom` (linked-list chain) — `head → [1] → [2] → [4] → [5] → [7] → ∅` as boxes joined by arrows (reuse `LinkedListViz`). `∅` is labelled "empty — the end of the chain." Action buttons (`insert 3 after 2`, `insert 6 after 5`, `remove the 3rd node`) sit under the chain. On a click, the touched node(s) glow and a "Pointer edits" counter ticks (1 for remove, 2 for insert) while neighbours stay calm.
- **panel**: top (main explanation) + a `note` panel for the wedge question
- **arrow**: from the wedge-question note panel to the single arrow (pointer) between two cards that gets rerouted on insert.
- **codeLabels**: emits live via the visual — `insert_new`, `insert_relink` on an insert click; `remove_relink` on a remove click. Static fallback: `["insert_new", "insert_relink"]`.
- **interaction**: wedge (PRESERVED — user must perform at least one insert/remove before "Next" unlocks)

### Beat 4 — The structure · Nodes: each holds a value and the address of the next
- **narration**: A linked list is a chain of small boxes called "nodes." Each node carries a value plus a pointer to the next node. To read the list you start at the first node — the "head" — and follow arrows until you hit `None` (Python's word for "nothing here," the end). The trade: no jumping straight to the 487th item, but cheap edits anywhere you're already standing.
- **visual**: `custom` — same chain, now expanded/annotated: one node enlarged to show its two compartments, `value` and `next`. The `head →` label highlighted at the left; the final `→ ∅` relabelled `→ None`. Neighbouring nodes dimmed/toned to spotlight the one anatomy node.
- **panel**: left
- **arrow**: from the panel to the `next` compartment of the enlarged node (the pointer that holds "the address of the next box").
- **codeLabels**: `["node_class", "node_value", "node_next"]`
- **interaction**: none

### Beat 5 — The operations · Cheap edits, expensive lookups
- **narration**: Insert after a node you're standing on: O(1) — "instant; same cost no matter how long the list" — just two pointers rewired. Remove the next node: O(1), one pointer rewired; the orphaned node gets cleaned up. But find a value, or jump to position k: O(n) — "cost grows with the list's length" — because you must walk from the head; there's no shortcut.
- **visual**: `custom` — split focus on the same chain. Left/insert region shows the 2-pointer rewire glowing green (O(1)); a separate "find 7" walk lights nodes one-by-one head→tail in amber to dramatise O(n). A small cost table appears: `insert O(1)`, `remove O(1)`, `find O(n)`, `index O(n)`.
- **panel**: right
- **arrow**: from the panel to the head node (where every O(n) walk is forced to begin).
- **codeLabels**: `["insert_relink", "remove_relink", "traverse_init", "traverse_loop", "traverse_advance"]`
- **interaction**: playback (auto-walk the find to show the linear scan)

### Beat 6 — When it fits · Heavy mid-edits, no random access — and it's how other structures think
- **narration**: Honest take: in everyday Python you rarely reach for a raw linked list — jobs needing O(1) middle edits usually use a deque, an ordered map, or a tree instead. You still learn it because it's the mental model underneath them all: a tree is nodes pointing to several children; a graph is nodes pointing anywhere. Master the chain, and those come free.
- **visual**: `custom` / `tree` — the flat chain on the left morphs into a tiny branching tree on the right (one node sprouting two children), with a faint "graph" hint (a node with arrows to two arbitrary others). The linked-list chain stays toned as the "base case"; the tree/graph toned as "built from the same node idea."
- **panel**: bottom
- **arrow**: from the panel to a single node that has two outgoing arrows (the moment the chain generalises into a tree).
- **codeLabels**: `["node_class", "node_next"]` (the node-with-a-pointer is the shared building block)
- **interaction**: none

### Beat 7 — The structure · Linked List
- **narration**: That's the name. "Singly linked" means each node has one arrow (to next). "Doubly linked" means two arrows (to next AND previous) so you can walk backwards and unlink a node without knowing the one before it. The big idea: position is not address — order is whatever the arrows say, and an insert or remove costs exactly one pointer swap.
- **visual**: `custom` (summary) — clean final chain `head → [3] → [1] → [4] → [1] → [5] → None` (reuse `SummaryViz`). Beside it the cost recap grid: `insert after node O(1)`, `remove next node O(1)`, `access by index O(n)`, `find a value O(n)`, `memory locality poor`. Below, a small singly-vs-doubly diagram: one chain with single arrows, one with paired forward/back arrows.
- **panel**: top
- **arrow**: from the panel to the paired forward/back arrows on the doubly-linked sample (what "two pointers" looks like).
- **codeLabels**: `["sig"]` (the `insert_after` signature names the central O(1) operation) — drawer/code reveal cue.
- **interaction**: none

---

## Notes

- **Wedge preserved (Beat 3).** The current lesson's only gating interaction is step 3's
  "insert after 2 / remove 4, then count what moved." Keep it as `interaction: "wedge"` —
  "Next" must stay locked until the user clicks at least one insert/remove. The visual already
  emits the right `@sync` labels via `onActiveLine` (`insert_new`/`insert_relink` for insert,
  `remove_relink` for remove); let those live emissions override the static `codeLabels`.
- **Generalization preserved (Beat 6).** Step 6 is the "and it's how other structures think"
  generalization (tree = nodes with several children, graph = nodes pointing anywhere). Keep the
  chain→tree/graph morph; this is the topic's payoff, not filler.

### Jargon taught on first use (content rule)
The current lesson uses several terms/symbols a true beginner won't know. Each is now defined
in plain words at first appearance:
- **pointer / arrow** (Beat 3) — "an arrow saying where the next card lives."
- **node** (Beat 4) — "a small box holding a value plus a pointer to the next."
- **head** (Beat 4) — "the first node; where you start reading."
- **`None`** (Beat 4) — "Python's word for 'nothing here,' marking the end."
- **O(1)** (Beat 5) — "instant; same cost no matter how long the list."
- **O(n)** (Beat 5) — "cost grows in step with the list's length."
- **singly / doubly linked** (Beat 7) — defined inline (one arrow vs. two).

### Content bugs / risks spotted in the current lesson
1. **Unexplained symbols in the original derivation.** The source `derivation.tsx` introduces
   `None`, `list[487]`, `O(1)`, and `O(n)` with no beginner-level gloss (step 4 says "there's no
   `list[487]`" assuming the reader knows array indexing; steps 4–5 use `O(1)`/`O(n)` cold). The
   plan above fixes this by teaching each on first use. **Original violates the content rule.**
2. **`∅` vs `None` mismatch.** The visual draws the list end as `→ ∅` (math empty-set symbol)
   while the prose and code say `None`. A 15-year-old won't read `∅` as "end of list." Beat 4
   relabels the terminator `None` to match the code; if `∅` is kept anywhere, label it once.
3. **"The orphan gets collected" (step 5)** assumes the reader knows garbage collection. Reworded
   to "the orphaned node gets cleaned up" — still imprecise but no undefined jargon; avoid the
   term "garbage collection" entirely in this lesson.
4. **`find`/traversal code is never surfaced in the current step→viz mapping.** `algorithm.py`
   has `traverse_init/loop/advance` anchors but the old visualizer only wires insert/remove lines.
   Beat 5 now lights those traversal lines while auto-walking the O(n) find, so the docked code
   and the "expensive lookups" claim actually line up.
5. **Mobile / dense visual.** Beats 5 and 7 pack a chain + a cost table (+ a singly/doubly diagram
   in 7). On narrow screens stack the table BELOW the chain (panel `bottom`/`right` already avoids
   covering the action) and let the canvas-scale logic in `page.tsx` shrink to fit; don't render
   the table and chain side-by-side under ~640px.
6. **Counter semantics carry over.** `LinkedListViz` increments "Pointer edits" by 2 on insert and
   1 on remove — that's the whole wedge payoff (few things move). Preserve those exact numbers; the
   narration's "two pointers" / "one pointer" claims depend on them.

## Peer review
- **verdict: needs-work**
- **issues:**

  - **Beat 5 — FEASIBILITY (biggest gap): the "auto-walk the find" is a NEW build, not a reuse.**
    Beat 5 says "a separate 'find 7' walk lights nodes one-by-one head→tail in amber" and emits
    `traverse_init/loop/advance`. I checked `visualizer.tsx`: the existing components
    (`ArrayShiftViz`, `LinkedListViz`, `SummaryViz`) contain **no traversal animation** — there is
    no per-node stepping, no amber walk, and `onActiveLine` is only ever called with insert/remove
    lines. The only `find` in the file is JS `Array.prototype.find` for lookup, not a visual walk.
    Note #4 honestly admits traversal "is never surfaced," but the beat body still implies reuse
    ("split focus on the same chain"). FIX: explicitly mark the find-walk as net-new work in Beat 5
    (a small `useEffect` interval that advances a `cursor` index, tones the current node amber, and
    fires `onActiveLine(["traverse_advance"])` per step), or drop the traverse codeLabels from this
    beat. Don't label it a reuse.

  - **Beats 1, 2, 3, 7 — FEASIBILITY: the named "reuse" components don't render as SVG, and the AC
    sandbox has no visual-type dispatcher.** `page.tsx` defines `Beat.svg: React.ReactNode` and a
    bespoke `Cells`/`Arrow`/`Bracket` SVG toolkit hand-built for the *binary-search* demo. There is
    no `array`/`custom`/`tree` switch to select. Separately, `LinkedListViz`/`SummaryViz` draw nodes
    as **HTML `<div>`s**, not SVG, so they can't drop straight into the `<svg>` plane. FIX: state in
    the plan that the linked-list/array beats either (a) get re-authored as SVG using the existing
    `Cells`/`Arrow` primitives, or (b) render the existing HTML viz as a `foreignObject`/HTML overlay
    inside the canvas. As written, "reuse `LinkedListViz`" inside an SVG box is not buildable as-is.

  - **Beat 6 — FEASIBILITY: there is no `TreeViz`/`Scene` usage in this topic, and `tree` is not a
    supported AC visual.** The chain→tree/graph morph ("one node sprouting two children" + a graph
    hint) must be authored from scratch with `Arrow`/node primitives. `src/shared/viz/TreeViz.tsx`
    exists but is not wired into the AC page or this topic. FIX: note that Beat 6 is a custom SVG
    morph, not a `TreeViz` instance; specify the two-child node + two-arrow graph hint as bespoke
    geometry.

  - **Beat 3 vs viz buttons — COHERENCE: narration says "remove the 3rd card" / earlier plan text
    says nothing, but the original derivation says "remove 4," while the live button is labelled
    "remove the 3rd node" (operating on `nodes[2]`).** With the chain `[1][2][4][5][7]`, the 3rd node
    holds value 4, so "remove the 3rd card" and "remove 4" are the same node — OK — but the wording
    drifts across plan/derivation/button. FIX: pick ONE phrasing ("remove the 3rd card") everywhere
    in Beat 3 narration and the button, and make sure the chain shown is exactly `[1][2][4][5][7]` so
    "3rd card = 4" holds.

  - **Beat 3 — CORRECTNESS of codeLabels timing.** Static fallback is `["insert_new","insert_relink"]`
    (insert path) but the wedge lets the user click *remove* first, which emits `remove_relink`. If
    the user removes before inserting, the docked code shows the insert lines lit while the remove
    line ran. The plan says "let live emissions override the static `codeLabels`" — good — but make
    sure the static fallback isn't shown after a remove-first interaction. FIX: clarify that on first
    interaction the static fallback is discarded entirely; never show insert lines for a remove click.

  - **Beat 2 — BEGINNER-SAFETY: "n shoves (n = how many names sit after Charlie)" introduces the
    symbol `n` cold.** This is the first appearance of `n` and it's used as a variable before `O(n)`
    is defined in Beat 5. The gloss "(n = how many names sit after Charlie)" is good but slightly
    narrow — in Beat 5 `n` becomes "the list's length," a different quantity. FIX: either align the
    two definitions (use "the number of items after the insertion point" consistently) or add one
    clause in Beat 5 noting `n` now means total length. A 15-year-old will otherwise think `n` changed
    meaning silently.

  - **Beat 5 — BEGINNER-SAFETY: "the orphaned node gets cleaned up" still implies an agent the reader
    doesn't know.** Note #3 correctly bans "garbage collection," but "gets cleaned up" still raises
    "cleaned up by whom?" for a true beginner. Minor. FIX: "nothing points to it anymore, so it just
    disappears from the list" — describe the *state* (unreachable) rather than an unnamed cleanup
    actor.

  - **Beat 5 — BEGINNER-SAFETY: "jump to position k" introduces `k` undefined.** Beat 5 narration uses
    `k` ("jump to position k") with no gloss, right after `n`. Two single-letter variables in one beat
    with no definition for `k`. FIX: say "jump to the 50th item" or "position number k (some position
    you name)"; don't ship a bare `k`.

  - **Beat 7 — FAITHFULNESS/CORRECTNESS: the summary chain values don't match the lesson's working
    chain.** Beat 7 shows `head → [3] → [1] → [4] → [1] → [5] → None` (the `SummaryViz` sample), but
    Beats 3–6 use `[1][2][4][5][7]`. Switching the demo data at the summary undercuts the "same chain
    throughout" mental model and could confuse a beginner who's tracking specific values. FIX: either
    keep the summary chain consistent with the working chain, or add a one-line "(new example)" cue.
    (Low severity — values are arbitrary — but flagged for coherence.)

  - **Note #2 / Beat 4 — COHERENCE: the `∅`→`None` relabel is correct and load-bearing, but the viz
    currently hard-codes `→ ∅` in TWO places** (`LinkedListViz` end-cap and `SummaryViz` end-cap). FIX:
    the plan should say BOTH end-caps must be changed to `None` (Beat 4 and Beat 7), not just "Beat 4
    relabels." Otherwise the summary in Beat 7 still shows `∅` while Beat 7 narration says `None`.

  - **GOOD (kept honest):** wedge gating preserved with correct counts (viz really does +2 insert / +1
    remove and labels it "Pointer edits"); all 10 `codeLabels` map to real `@sync` anchors in
    `algorithm.py` (verified `node_class/value/next`, `sig`, `insert_new`, `insert_relink`,
    `remove_relink`, `traverse_init/loop/advance`); jargon-on-first-use table is thorough; the
    generalization (Beat 6) is correctly identified as the payoff, not filler; the cost table in
    Beats 5/7 matches the viz's real table exactly (`insert O(1)`, `remove O(1)`, `access by index
    O(n)`, `find O(n)`, `memory locality poor`).
