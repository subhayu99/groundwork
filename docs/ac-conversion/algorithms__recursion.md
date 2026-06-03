# Annotated-Canvas Conversion — algorithms / recursion

Topic: **Recursion** ("How big is your Downloads folder?")
Source lesson: `src/categories/algorithms/topics/recursion/` (7 derivation steps)
Reference form: `src/app/sandbox/annotated-canvas/page.tsx`
Code source: `src/categories/algorithms/topics/recursion/algorithm.py`

**The shared visual object** across every beat is the same `Downloads` folder tree, drawn
as an indented list of rows (the existing `NodeRow` look — file rows show a size, folder
rows show a computed total or `?`). Items: `Downloads/` › `resume.pdf 2`, `photos/` ›
(`beach.jpg 4`, `party.jpg 3`), `projects/` › (`notes.txt 1`, `code/` › `app.zip 8`),
`scratch.txt 1`. Total = **19MB**. A **call-stack panel** appears on the right for the
recursive beats. Keep the tree fixed in the same canvas position across beats so only the
highlighting/markers change between beats.

`@sync` labels available in `algorithm.py`: `sig`, `base_case`, `base_return`,
`recursive_call`, `aggregate`, `folder_return`.

---

### Beat 1 — The setup · How big is your Downloads folder?
- **narration**: Your phone says Downloads is 19MB. But the files are hidden inside folders, inside more folders. To get one number you must add up every file — yet you can't see them all at once. How does the phone do it?
- **visual**: tree (indented folder list). Whole tree shown `idle` / live. Every file row shows its size; every folder row shows `?` (unknown total). Nothing highlighted yet.
- **panel**: top
- **arrow**: from the panel down to the `Downloads/` root row (the `?` it wants to fill).
- **codeLabels**: `["sig"]`  (the `folder_size(node)` signature — the question we're about to answer)
- **interaction**: none

---

### Beat 2 — The obvious thing · Loops inside loops inside loops
- **narration**: The naive plan: a loop walks the top items, adding file sizes. Hit a folder? loop inside it. Hit another folder? loop again. You can hand-write two or three levels — but folders nest as deep as they like, and you can't write a loop for a depth you don't know.
- **visual**: tree. Animate a scan that only touches **file** rows (top level first), toning each visited file `done` and ticking a running total; folder rows stay `idle` with `?`. The scan visibly stalls / can't reach files buried inside `code/` — showing the naive loop can't get deep. (Mirrors the existing `NaiveCountViz`.) Running-total readout at the bottom.
- **panel**: bottom
- **arrow**: from the panel up to the deepest hidden file (`code/app.zip`) — the one the flat loop can't reach.
- **codeLabels**: `[]`  (naive/setup — no real algorithm line yet; this is the approach we reject)
- **interaction**: playback (auto-scans files, same as current step)

---

### Beat 3 — The wedge · Open the folder — it's a smaller copy of the same problem
- **narration**: Click any folder to peek inside. You always find the same shape: some files with sizes, some more folders. So a folder's total is just its own files plus each subfolder's total. Each subfolder is **the same problem, on fewer items.**
- **visual**: tree, interactive. Each folder row has an **"ask"** button. Clicking a folder fills in its total (`done`, shows e.g. `photos/ = 7MB`) and reveals its children. The user must click at least one folder to see the "smaller same problem" before continuing. (This is the existing `ManualExploreViz`.)
- **panel**: left (instruction) + a small **note** panel bottom-center carrying the wedge line.
- **arrow**: from the note panel to a folder row the user just "asked" (e.g. `photos/`), pointing at its newly-filled total.
- **codeLabels**: `["recursive_call", "aggregate"]`  (asking a folder = recurse into children, then sum them)
- **interaction**: **wedge** — PRESERVE: user must click a folder's "ask" before "Next" unlocks.

---

### Beat 4 — The derivation · Write the rule — the function calls itself
- **narration**: Define `folder_size(node)` — a recipe that takes one item. Two cases. **File:** return its size, stop. **Folder:** for each child, call `folder_size(child)` (the recipe asks itself on a smaller piece), then add the answers. It can't loop forever because every call is on a *strictly smaller* item — a child, never the folder itself.
- **visual**: tree + call-stack panel (right). Static snapshot mid-recursion: the path `Downloads/ › projects/ › code/` shown stacked (`active`/on-stack), `app.zip` about to return its size. Stack panel shows three frames with their `partial` totals. Marker callouts: tag the file branch "base case → return size" and the folder branch "recursive case → call self + sum".
- **panel**: top
- **arrow**: one arrow to the active folder row descending into a child (the recursive call); a second short bracket/label on the file row marked "base case — stop."
- **codeLabels**: `["base_case", "base_return", "recursive_call", "aggregate"]`  (both cases of the rule)
- **interaction**: playback (auto-plays the full recurse-in / return-up walk; the existing `RecursiveComputeViz`)

---

### Beat 5 — The operations · Each file and folder is touched once
- **narration**: Every item — file or folder — is looked at exactly once. That's **O(n)**: the work grows in step with how many items the tree holds (n = the item count). Memory: each open call waits on its children, so calls pile up in a **call stack** — a to-do list where the newest waiting job sits on top. The stack only gets as tall as the deepest folder nesting.
- **visual**: tree fully resolved (every row `done`, every folder showing its real total, root = `19MB ✓`). Call-stack panel shown at its **peak depth** (the `Downloads › projects › code › app.zip` chain, 4 frames) with a bracket labeled "stack height = deepest nesting." A small "touched once" tick on each row.
- **panel**: right (so it doesn't cover the stack illustration… place it where it won't cover the stack; use bottom if the stack sits right).
- **arrow**: bracket/arrow from the panel to the call-stack panel's height (depth = 4 here).
- **codeLabels**: `["recursive_call", "folder_return"]`  (the descend-and-return that drives both the one-touch count and the stack depth)
- **interaction**: none

---

### Beat 6 — The generalization · Tree-shaped data is everywhere
- **narration**: The same trick fits anything that branches into smaller copies of itself. A JSON object holds objects. An HTML box holds boxes. The math `(2 + (3 * (4 - 1)))` is expressions inside expressions. Org charts, nested comments, file trees — all solved the same way: answer me by answering my parts.
- **visual**: custom — three small side-by-side mini-trees sharing the *same shape* as the Downloads tree: (a) a JSON `{}` nesting `{}`, (b) an HTML `<div>` nesting `<div>`, (c) the expression `(2 + (3 * (4 - 1)))` as a small tree. The Downloads tree dims to a faint ghost behind/beside them to signal "same shape."
- **panel**: top
- **arrow**: a single arrow (or three short ones) from the panel to the shared nesting point each mini-tree has in common.
- **codeLabels**: `[]`  (conceptual generalization — no specific line; the whole rule applies, nothing new lights)
- **interaction**: none

---

### Beat 7 — The pattern · Recursion
- **narration**: That's the name: **recursion** — a function that calls itself on a smaller version of the same problem. Two non-negotiable parts: a **base case** (a piece so small the answer is obvious — a file knows its own size) and a **recursive case** (shrink to strictly smaller copies, combine, return). Spot it when data is nested and a whole's answer depends on its parts.
- **visual**: tree fully resolved (`19MB ✓` at root). Two labeled callouts pinned to the canvas: one bracket on a file row = "base case," one bracket on a folder row = "recursive case." The full `algorithm.py` is docked beside the canvas, all lines now meaningful.
- **panel**: bottom (room for the two-part definition + the pattern-signal bullets).
- **arrow**: two arrows — one to the file row labeled "base case," one to a folder row labeled "recursive case."
- **codeLabels**: `["base_case", "base_return", "recursive_call", "aggregate", "folder_return"]`  (the whole rule — every line lights as the pattern is named)
- **interaction**: none

---

## Notes

- **Wedge preserved**: Beat 3 keeps the gating click-a-folder interaction from the live
  lesson (`ManualExploreViz` / `onWedgeInteraction`). "Next" must stay locked until the
  user asks at least one folder. This is the moment the learner *discovers* the
  self-similarity rather than being told it — do not downgrade it to `playback`.

- **Generalization preserved**: Beat 6 is the lesson's real generalization step (JSON /
  HTML / math expressions / org charts). Keep all four families; they're what makes the
  "tree-shaped data is everywhere" claim land.

- **Jargon taught on first use (content rule)**:
  - `folder_size(node)` / "function" — introduced in Beat 4 as "a recipe that takes one
    item," and `node` as "one item (a file or a folder)." The source jumps straight to
    `folder_size(node)` with no gloss of *function* or *node* — fixed here.
  - **O(n)** — first appears Beat 5; glossed in-clause as "work grows in step with how
    many items the tree holds." The source's parenthetical is decent but assumes the
    reader knows what O(...) notation *is*; the narration says it plainly.
  - **call stack / stack** — first real use Beat 5; glossed as "a to-do list where the
    newest waiting job sits on top." The source says "the function calls stack up" without
    ever defining a stack — fixed.
  - **base case / recursive case** — named in Beat 4, fully defined in Beat 7.
  - **recursion** — deliberately withheld until Beat 7 (the reveal); narration before then
    says "the function calls itself" in plain words, matching the lesson's structure.

- **Code-syntax note**: the real `algorithm.py` uses `node["type"]` / `node["size"]`
  (dict access). If any narration quotes a line, gloss the first bracket access as
  "look up the item's type/size." None of the planned narration surfaces raw `["..."]`,
  so no extra teaching is needed unless the code panel's highlighted line is read aloud.

- **Content bug spotted (depth claim)**: derivation step 5 says "If your tree is balanced
  and 30 levels deep, that's 30 calls on the stack at peak." Stack depth equals the
  *deepest path*, which for a balanced tree is its height (~log of the item count), so 30
  levels does give ~30 frames — the number is fine, but "balanced" is a red herring
  (depth, not balance, sets stack height). I dropped the "balanced, 30 levels" line from
  the Beat 5 narration to avoid implying balance matters; the on-canvas stack shows the
  actual peak depth (4) for this concrete tree instead, which is truer and less abstract.

- **Visual density / mobile**: Beats 4–5 show the tree **and** the call-stack panel
  side-by-side. On narrow (mobile) widths the reference page stacks columns vertically —
  the stack panel should drop below the tree, and panels should switch from left/right to
  top/bottom so they never cover either. Beat 6's three mini-trees are the densest frame;
  on mobile, render them stacked vertically (or show two + "…") rather than three across.

- **Total value**: confirmed **19MB** from `algorithm.py`'s tree (2+4+3+1+8+1). Use this
  everywhere; the prose's opening "14.2 GB" in derivation step 1 is just flavor for the
  real-phone framing and does NOT match the demo tree — the on-canvas number must read
  **19MB** to stay consistent with the visual (another small content inconsistency in the
  source: the setup card says `14.2 GB` but the worked example totals 19MB).
