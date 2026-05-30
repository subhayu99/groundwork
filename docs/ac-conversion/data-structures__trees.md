# Annotated-Canvas Conversion — Data Structures · Trees

Source lesson: `src/categories/data-structures/topics/trees/`
Reference form: `src/app/sandbox/annotated-canvas/page.tsx`
Contract: `src/shared/lesson/types.ts` (`LessonSpec` / `LessonBeat`)

Canvas: reuse the prototype box `{ width: 860, height: 470 }`. The org-chart tree
and BST both render through the existing `TreeSVG` layout from `visualizer.tsx`;
that layout centers a tree in a `width × height` box, so wrap it in a `<g>` and
translate it to sit center-canvas, leaving the panel margins free.

`codeSource` = the real `algorithm.py`. Available `@sync` labels (read from the file):
`node_class`, `dfs_visit`, `dfs_children`, `dfs_recurse`,
`bst_class`, `bst_insert_empty`, `bst_insert_new`, `bst_insert_left`, `bst_insert_right`,
`bst_start`, `bst_loop`, `bst_eq`, `bst_left`, `bst_right`.

One beat per derivation step (7 total). Steps 1-2 use the flat-list visual (no tree
code yet), step 3 is the interactive wedge (general-tree DFS), steps 4-5 introduce the
node structure and the BST search, step 6 generalizes, step 7 names it.

---

### Beat 1 — The setup · A company has people. People have managers.
- **narration**: Open a folder: it holds files and more folders, which hold more folders. Reply to a comment, someone replies to your reply. These don't form a line — they *branch*. A flat list can't say "what's inside what" or "who reports to whom."
- **visual**: `array` — the flat two-column table from `FlatListViz` (name / manager rows for Ana, Bo, Cara, Dax, Eli, Fawn, Grace, Harper, Ivy, June). All rows toned plain/`idle`. This is the "before" state the lesson argues against.
- **panel**: top (clear of the table, which sits mid-canvas).
- **arrow**: none.
- **codeLabels**: `[]` (setup — no code yet).
- **interaction**: none.

### Beat 2 — The obvious thing · Flatten it into a list. Watch the structure die.
- **narration**: Store everyone in a flat list with a "manager" column. "Who does Bo report to?" is one fast lookup. But "everyone *under* Bo" forces you to scan every single row. The data's real shape is a hierarchy; storing it row-by-row fights that shape on every such query.
- **visual**: `array` — same flat table. Tone the single "Bo → Ana" lookup row `active` (the cheap query); then tone every row that is a descendant of Bo (Cara, Dax, Eli, Fawn, Grace) `visited`/scanned to show the subtree question forces a full walk. Rows outside Bo's subtree dimmed.
- **panel**: bottom.
- **arrow**: bracket/arrow spanning the highlighted descendant rows, labeled "to find everyone under Bo, walk them all."
- **codeLabels**: `[]` (still naive list — the tree code hasn't entered).
- **interaction**: none.

### Beat 3 — The wedge · Click a node. See only its branch light up.
- **narration**: Here's a small org chart. A **node** is just one person-box; each node remembers only its direct reports — that single link to another node is called a **pointer**. Click anyone in the middle: only their branch lights up. You didn't search the company — you followed pointers down.
- **visual**: `tree` — the `ORG_CHART` rendered via `ClickableTreeViz`/`TreeSVG`. Before the click: all nodes `idle`. After the user clicks a node, that node plus its whole subtree go `active`; everything else dims to `muted`. (This is exactly the existing interactive component; it already calls `onActiveLine` with the DFS labels on click.)
- **panel**: left (org chart is wide; keep the right side clear for branching).
- **arrow**: none before interaction; the lit subtree *is* the payoff. Optionally an arrow from the panel to the clicked node once active.
- **panel2 (note)**: bottom-left — "The wedge question: what does *a child* look like here, and how is it different from a *sibling*?" (preserve verbatim intent from the lesson).
- **codeLabels**: emitted live by the visual on click: `dfs_visit`, `dfs_children`, `dfs_recurse` (subtree highlight = a pre-order DFS: visit this node, then recurse into each child). Static fallback before click: `[]`.
- **interaction**: **wedge** — user MUST click a node to light a subtree before "Next" unlocks. (Preserve the existing gating wedge.)

### Beat 4 — The structure · Nodes with pointers to children. No cycles.
- **narration**: A **tree** is just nodes — like a chain where each box held one "next," but now a box can hold *several* child links. One special start box is the **root**; reach everything else by following links downward. No box ever points back up (that loop-back would make it a **graph**). A **binary tree** caps each node at two children, called *left* and *right*.
- **visual**: `tree` — the `ORG_CHART` again, static, all nodes `idle`/`live`. Tone the root (Ana) `active` and label it "root." Draw the downward child edges in the accent tone to emphasize "links point down, never up." Optionally show one node with its two child slots highlighted to foreshadow left/right.
- **panel**: top.
- **arrow**: from the panel to the root node, labeled "root — the single entry point."
- **codeLabels**: `node_class` (the `TreeNode` with `value` + `children` list — the literal "node with child pointers").
- **interaction**: none.

### Beat 5 — The operations · Walk the whole tree, or take a sorted shortcut.
- **narration**: **Traversal** = visit every node once; cost grows in lockstep with node count — written **O(n)** ("n" = number of nodes, so 10× the nodes ≈ 10× the work). A **Binary Search Tree** keeps smaller values left, larger right, so each lookup is a chain of left/right turns — **O(log n)** (cost barely grows; doubling the tree adds just one step) when balanced. A **hash map** (a lookup table) gets values **O(1)** — instantly — so reach for a BST only when you also need things kept in *order*.
- **visual**: `tree` — switch to the BST from `BSTViz` (`BST_ROOT`, values 50/30/70/20/40/60/80/10/35/65). Animate or show the search path for a target (e.g. 35): the visited nodes along root→…→target tone `active`, the rest `muted`; show the "path: 50 → 30 → 40 → 35" trail and "4 comparisons" stat. The branch buttons let the user re-target.
- **panel**: top (BST is tall; keep panel above the root).
- **arrow**: from the panel's "left/right turns" phrase to the first branching node (root 50), showing the left-vs-right decision.
- **codeLabels**: emitted live by `BSTViz`: `bst_start` always; plus `bst_eq` on a match, `bst_left` when the search went left, `bst_right` when it went right. Static fallback: `bst_start`, `bst_left`, `bst_right`. (Optionally also surface `dfs_visit`/`dfs_recurse` while narrating traversal — but the docked visual here is the BST, so prefer the `bst_*` labels.)
- **interaction**: **playback** (auto-animates the search path; user may re-pick a target via the value buttons — but no gate).

### Beat 6 — When it fits · Hierarchy. Decisions. Sorted lookups with range queries.
- **narration**: Reach for a **tree** whenever the data is genuinely nested: file systems, web-page structure, game scene graphs, parser syntax trees, ML decision trees, e-commerce category nesting. Reach for a **BST** (or a balanced cousin like AVL / red-black) when you need fast lookups *and* sorted order or range queries — databases use B-trees, a wide-branching BST.
- **visual**: `tree` — the `ORG_CHART` (or BST) shown whole and calm, all nodes `idle`. Around/below the canvas, list the "fits" as labeled chips: file system · DOM · scene graph · syntax tree · decision tree · category nesting (tree); range query · sorted iteration · next-larger (BST). No path highlight — this is the "where it lives in the world" beat.
- **panel**: bottom (so the chip list sits beside the tree, not over it).
- **arrow**: none.
- **codeLabels**: `bst_insert_left`, `bst_insert_right` (insert keeps the smaller-left / larger-right invariant that makes ordered queries possible — ties the "ordering" claim to real code). Or `[]` if you prefer a pure recap beat.
- **interaction**: none.

### Beat 7 — The structure · Tree.
- **narration**: That's the name: a **tree**. Variants you'll meet — *binary trees*, *binary search trees*, *heaps* (a tree-shaped priority queue), *tries* (a tree of prefix letters), *B-trees* (the engine behind database indexes) — but all share one skeleton: nodes holding child links, rooted at the top. The Code panel has two tiny Python sketches: a general tree and a BST.
- **visual**: `tree` — the `SummaryTreeViz`: the `ORG_CHART` rendered plainly, plus the complexity recap grid (traverse all = O(n); BST lookup balanced = O(log n); BST lookup worst = O(n); insert/delete = O(log n) avg). Tone the tree `idle`; the recap grid is the takeaway.
- **panel**: top.
- **arrow**: none (or a soft arrow from "rooted at the top" to the root node).
- **codeLabels**: `node_class`, `bst_class` (the two skeletons named in the narration — general `TreeNode` and `BSTNode`).
- **interaction**: none.

---

## Notes

- **Wedge preserved (Beat 3).** Step 3 is the only gating interaction in the source
  (`ClickableTreeViz` + `onWedgeInteraction`). It must stay a `wedge`: the user clicks a
  node, a subtree lights, and only then does "Next" unlock. The existing component already
  emits the correct DFS `@sync` labels on click, so the live `onActiveLine` overrides the
  static `codeLabels` exactly as the contract intends.

- **Two algorithms, one file.** `algorithm.py` holds *both* a general-tree `dfs()` and a
  `bst_contains()`/`bst_insert()`. Beat 3 lights the `dfs_*` labels (subtree walk = pre-order
  DFS); Beats 5-7 light the `bst_*` labels. Don't cross them — the visualizer comments are
  explicit that `dfs_*` belong to the general tree and `bst_*` to the BST.

- **Visual swaps mid-lesson.** The canvas changes *what* it shows across beats: flat table
  (1-2) → clickable org tree (3-4) → BST search (5) → org/BST recap (6-7). The reference
  prototype keeps one array throughout; here the primitive is consistently `tree`/`array`
  but the *dataset* changes. Keep the `TreeSVG` layout (it auto-centers) and translate it to
  canvas center; the panels then have predictable top/bottom margins.

- **Mobile / dense visual.** The `ORG_CHART` is 4 levels deep and ~10 nodes wide → wide SVG.
  On narrow screens it will need horizontal room; rely on the prototype's `scale` fit logic
  (`Math.min(w/VW, h/VH)`) and prefer **top/bottom** panels for the tree beats so the wide
  layout isn't crowded left/right. The BST (Beat 5) is taller than wide — top panel works,
  and the value-buttons row should wrap (it already does in `BSTViz`).

- **CONTENT — unexplained jargon in the SOURCE lesson (fix in narration, done above):**
  - Step 4 uses **node**, **pointer**, **root**, **cycle**, **graph**, **binary tree** —
    source defines root/cycle/binary but leans on *node*/*pointer* from the prerequisite
    linked-lists lesson. For a true zero-CS beginner, Beat 3/4 narration now teaches *node*
    and *pointer* in-plain-words on first use (done above).
  - Step 5 source writes **O(n)**, **O(log n)**, **O(1)** with parenthetical glosses, plus
    **hash map**, **subtree**, **balanced**, **AVL**, **red-black**. The glosses are decent
    but "hash map" appears with no plain-words unpacking. Beat 5 narration above adds "a
    lookup table" for hash map and re-states each Big-O gloss on first use in this beat.
  - Step 7 source uses **heap**, **trie**, **B-tree**, **priority queue** — all glossed
    briefly in source; kept and lightly clarified.

- **CONTENT — minor wording, not a bug:** Step 5's BST gloss says "doubling the size of the
  tree only adds one more step." That's the right intuition for O(log n); kept. No false
  claims spotted. The "O(1) = instant" gloss for hash maps is a beginner-friendly
  simplification (amortized average case) — acceptable at this tier, flagged here for honesty.

- **Code label honesty.** Beats 1-2 are pre-code (flat list), so `codeLabels: []` is correct —
  the reference prototype uses the function signature label for setup beats, but trees has no
  single signature beat; the first real code is `node_class` at Beat 4 and the DFS walk at
  Beat 3's interaction. Don't invent a label for the flat-list beats.

---

## Peer review

- **verdict: needs-work**

Faithfulness, correctness, and coherence are largely solid: the @sync labels all exist in
`algorithm.py`, the BST dataset/path math checks out (find 35 ⇒ 50→30→40→35, 4 comparisons),
the `dfs_*` vs `bst_*` separation is respected, and the rewritten narration genuinely improves
beginner-safety over the source (it drops the unexplained "depth-first/breadth-first" pair the
source step 5 leaned on). But several beats describe canvas features the **contract types** and
**existing components** cannot render as written. Concrete fixes:

- **Beat 2 (and 1) — FlatListViz cannot tone individual rows.** The narration/visual asks to
  tone the "Bo → Ana" row `active` and Bo's five descendants (Cara, Dax, Eli, Fawn, Grace)
  `visited`, rest `muted`. But the existing `FlatListViz` (visualizer.tsx L56-90) renders every
  row with the *same* static classes and exposes **no** `highlightedIds`/tone prop. As-is this
  beat is unbuildable. Fix: either (a) add a `highlightedRows`/tone prop to `FlatListViz` and
  say so explicitly in the doc, or (b) drop the per-row toning and keep the beat as a plain
  "before" table with the contrast carried entirely by the panel text.

- **Beat 2 — "bracket/arrow spanning the highlighted descendant rows."** `LessonArrow`
  (types.ts L40-45) is a single straight connector (`x1,y1,x2,y2`) with **no bracket primitive
  and no label field**. A row-spanning labeled bracket cannot be expressed. Fix: replace with a
  single straight arrow from the bottom panel to the descendant-row region, and move the text
  "to find everyone under Bo, walk them all" **into the panel body** (arrows carry no text).

- **Beats 2/4/5 — labeled arrows are not supported by the contract.** Every "arrow … labeled
  '…'" (Beat 4 "root — the single entry point", Beat 5 "left/right turns → root 50", Beat 2
  bracket label) assumes arrows carry text. `LessonArrow` has no `label`. Fix: keep the arrow as
  pure geometry and put each label in the panel that the arrow originates from.

- **Beat 3 — wedge wiring needs an adapter note.** The contract's `BeatVisualApi.onInteractionDone`
  (types.ts L18) is the gating callback, but the existing `ClickableTreeViz` prop is
  `onInteraction` (visualizer.tsx L94) and `phasedVisualizer` passes `onWedgeInteraction`. The
  doc references `onWedgeInteraction`/`onActiveLine` (the phasedVisualizer names), not the AC
  contract names. Fix: state that the AC render-fn must wrap the component as
  `(api) => <ClickableTreeViz onInteraction={api.onInteractionDone} onActiveLine={api.onActiveLine} />`
  so the gate actually fires.

- **Beat 4 — visual diverges from source AND from this doc's own Notes.** Beat 4's visual says
  "ORG_CHART again, static, root toned active." But the source `phasedVisualizer` shows the **BST**
  at step 4 (`{ until: 5, render: BSTViz }`, L51), and this doc's own Notes (L96) claim the swap
  is "clickable org tree (3-4) → BST search (5)" — internally inconsistent with Beat 5 also
  being the BST. AC is allowed to re-author the visual sequence, but pick one story and make
  Beat 4's visual line, the Notes swap-summary (L96), and the `node_class` codeLabel agree.
  (Showing ORG_CHART at Beat 4 is the better choice since the narration is about *node structure*,
  not search — just fix the Notes line to match.)

- **Beat 4 — "ORG_CHART root toned active" needs a tone prop on the static tree.** `TreeSVG`/
  `SummaryTreeViz` render ORG_CHART with `highlightedIds` only for the clickable/BST paths; a
  plain "root = Ana active, child edges in accent" static render isn't a mode that exists yet.
  Either reuse `TreeSVG root={ORG_CHART} highlightedIds={new Set(["ceo"])}` (state this) or note
  the small viz addition. Don't describe a toned root as if it's free.

- **Beat 7 (and source) — "priority queue" is unexplained jargon.** Narration glosses
  *heap* as "a tree-shaped **priority queue**" — but for a 15-year-old with zero CS, "priority
  queue" is itself an undefined term, so the gloss explains the unknown with the unknown. The
  doc's own Notes (L117) claim it was "lightly clarified," but it isn't. Fix: gloss inline, e.g.
  "*heaps* (a tree that always keeps the biggest — or smallest — item ready at the top)."

- **Beat 5 — "balanced" used before it's defined.** "O(log n) … when balanced" and Beat 6's
  "balanced cousin (AVL / red-black)" lean on *balanced* without a plain-words meaning. Minor,
  but a true zero-CS reader won't know what an unbalanced tree is. Fix: one clause on first use,
  e.g. "balanced (no branch much longer than the others)."

- **Nit — Beat 5 static-fallback label set.** Doc lists the static fallback as
  `bst_start, bst_left, bst_right`, but for the **default** target (35, which is found) the live
  emit is `[bst_start, bst_eq, bst_left, bst_right]`. Since the visual mounts already emitting,
  the static fallback is essentially never shown here; fine to keep, but note it's a fallback
  only, and consider adding `bst_eq` so the static set matches the default-found case.
