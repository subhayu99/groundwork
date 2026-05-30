# Annotated-Canvas conversion — Backtracking (N-Queens)

Topic: `algorithms/backtracking` · 7 derivation steps → 7 beats.
Canvas: a 6×6 chessboard (grid primitive). The lesson keeps its wedge (step 3, manual placement) and its generalization (step 6). The board lives center-canvas; panels sit in the wide margins above/below/beside it so they never cover the squares.

Real `@sync` labels available in `algorithm.py`:
`sig`, `init`, `record_solution`, `record_append`, `loop`, `is_safe`, `place`, `recurse`, `backtrack`.

Canvas note: unlike the binary-search reference (one horizontal row of cells, panels top/bottom), a 6×6 board is a tall square block in the middle. So most panels go **left** or **right** of the board, with a couple **top/bottom** where the board leaves room. Arrows point at a specific square or at the row being decided.

---

### Beat 1 — The setup · Six queens. Six rows. Nobody attacks anybody.
- **narration**: A 6×6 chessboard, six queens to place. A queen attacks along its whole row, its whole column, and both diagonals — straight lines as far as they reach. Goal: place all six so no two ever sit in each other's line of fire.
- **visual**: grid — empty 6×6 board, all cells idle/toned neutral. One demo queen dropped on, say, row 0 col 2 (tone "good"), with every square it attacks (its row, column, both diagonals) toned "bad" so a beginner literally sees what "attacks" means.
- **panel**: left (board sits right-of-center, panel fills the left margin).
- **arrow**: from the panel to the demo queen's square, plus the beginner can read the lit "bad" squares as its line of fire.
- **codeLabels**: `["sig"]` (just the function header — `n_queens(n)`; nothing computed yet).
- **interaction**: none

---

### Beat 2 — The obvious thing · Try every placement. The numbers explode.
- **narration**: Brute force: try every way to drop 6 queens and keep the legal ones. Since no two share a row, each row holds exactly one queen — so really we pick one column per row: 6×6×6×6×6×6 = 46,656 boards to test. Doable, but mostly wasted work.
- **visual**: grid — empty board, faint. Overlay one full but ILLEGAL placement (one queen per row, two of them clashing on a column/diagonal, those two toned "bad") to show "most of these 46,656 can't possibly work." A big count `6^6 = 46,656` floats below the board.
- **panel**: bottom (the count line) + the main text panel right.
- **arrow**: from the panel to the two clashing queens ("dead on arrival the moment they share a column").
- **codeLabels**: `[]` (naive/counting beat — no real code line yet; this is the brute-force strawman the algorithm replaces).
- **interaction**: none

---

### Beat 3 — The wedge · Build a partial answer. Check as you go. Undo when stuck.
- **narration**: Your turn. Click a safe square in the next empty row — squares a placed queen attacks light up red and refuse the click. Fill rows top-down. Hit a row with no safe square left? That branch is dead: press undo, try a different column in the row above.
- **visual**: grid — INTERACTIVE board. Clicking a column in the current row places a queen there (tone "good") and lights every newly-attacked square "bad"; attacked squares are click-disabled. An "undo" button removes the last queen. A live `placed: k of 6` counter; "✗ no safe square in row k" warning when a row is fully blocked.
- **panel**: left (main instructions) + a small **note** panel bottom carrying the wedge line: "Don't finish a guess before checking it can still win. Check every step. Quit the branch the moment it can't reach a full board."
- **arrow**: from the instruction panel to the current active row (the row awaiting a click).
- **codeLabels**: `["loop","is_safe"]` while scanning/validating a click; `["place"]` on a successful drop; `["backtrack"]` on undo; `["record_solution","record_append"]` if the 6th queen completes a board. (Emitted live by the visual via `onActiveLine`; static fallback `["loop","is_safe"]`.)
- **interaction**: wedge — PRESERVED. User must place/undo at least once before "Next" unlocks.

---

### Beat 4 — The derivation · Place row by row. Recurse. Undo on dead end.
- **narration**: Write `place(placed)`, where `placed` lists the chosen column of each filled row. Base case: 6 entries means the board is full — save it. Otherwise the next row is row number `len(placed)` ("how many are placed so far"). For each safe column: add it, call `place` again one row deeper (recurse = a function calling itself on a smaller job), then remove it — that pop is the undo that frees us to try the next column.
- **visual**: grid — board mid-search, 3 queens placed (good), the safe candidate squares of row 3 toned "active", a faint ghost queen sliding off row 3 to mime the append→recurse→pop loop. A tiny side-stack of 3 frames (one per filled row) hints at the recursion depth.
- **panel**: right (text) + small **note** bottom: "The principle — search-space pruning: rejecting a column skips every board that would've started with it, a whole subtree we never build."
- **arrow**: from the panel to row 3's active candidate squares (the row currently being decided).
- **codeLabels**: `["record_solution","record_append","loop","is_safe","place","recurse","backtrack"]` — this beat narrates the whole function body; the docked code shows base case, the loop, the safe-check prune, place, recurse, and pop together.
- **interaction**: none

---

### Beat 5 — The operations · Worst case is still huge. In practice we cut deep.
- **narration**: Blindly we'd build 6^6 = 46,656 boards. With the safety check the search touches only a few hundred — it fails early. Worst-case is still "exponential" (work that balloons as the board grows), but the prune bites hard here. Memory is tiny: the chain of paused `place` calls is at most 6 deep, holding one list of 6.
- **visual**: grid — board frozen on a "dead end": a row fully red with ✗, plus a small bar/cascade beside the board comparing `46,656 blind` vs `~few hundred pruned`. A depth meter showing the call chain capped at 6.
- **panel**: top (the two counts read clean above the board) + main text right.
- **arrow**: from the panel to the dead-end row (the moment the prune fires and a whole subtree is abandoned).
- **codeLabels**: `["is_safe","backtrack"]` — the prune (`is_safe`) and the undo (`backtrack`) are the two operations that do the cutting this beat is counting.
- **interaction**: playback — auto-run the full backtracking sweep (place row-by-row, prune, count solutions) so the beginner watches attempts climb and solutions tick to 4.

---

### Beat 6 — The generalization · Anywhere you build an answer piece-by-piece with a check.
- **narration**: This was never about chess. The shape is: build an answer one choice at a time, and the instant a partial answer becomes impossible, drop every continuation of it. Same shape, new stories — sudoku, graph coloring, generating all valid bracket strings, all subsets summing to a target, a knight's tour.
- **visual**: custom — fade the chessboard to the background and surface 3–4 small "same shape" thumbnails (a mini sudoku cell, a 2-color graph, a bracket string `(())`, a subset tally). Each shows the same place→check→undo motion. The board stays faint to anchor that it's one instance of a pattern.
- **panel**: bottom (the gallery sits center; panel reads beneath) + small note: "The check is what separates this from blind guessing. Better check → bigger prune → faster search."
- **arrow**: none (gallery beat — the panel addresses the whole set, not one element).
- **codeLabels**: `["is_safe"]` — the safe-check is the only problem-specific piece; swapping it is how the same skeleton solves sudoku, coloring, etc.
- **interaction**: none

---

### Beat 7 — The pattern · Backtracking.
- **narration**: The name is backtracking: depth-first search with a check at every step. The "back" is the undo — the recursion drops its frame and the caller tries its next option. Spot it when you must "find all / count all / is there any" arrangement fitting a rule, you can test a half-built answer mid-way, and the answer is built by a sequence of choices.
- **visual**: grid — board showing one COMPLETE valid solution (six queens, all "good", zero red), a small "solutions: 4" tally, and the four pattern-signal bullets listed beside it.
- **panel**: right (the name + the four signal bullets).
- **arrow**: from the panel to the completed board (a finished, conflict-free placement — the goal reached).
- **codeLabels**: `["record_solution","record_append"]` — the line that fires when a full board is found and saved is the payoff of the whole pattern.
- **interaction**: none

---

## Notes

- **Wedge preserved (Beat 3).** It is the only gating beat — user must place/undo before advancing. The visualizer's `ManualPlaceViz` already drives `onWedgeInteraction` + `onActiveLine`; the AC form should reuse that interactive render as the beat's `visual` render-fn (returns `BeatVisualApi`).
- **Beat 2 has no real code line** — it's the brute-force strawman the algorithm exists to beat. Listed `codeLabels: []` rather than forcing a fake highlight. (The original visualizer's `EmptyBoardViz` also shows no active line for steps 1–2.) Beat 1 uses `["sig"]` only because the function header is genuinely the "setup."
- **Mobile / dense visual:** the 6×6 board is a square block, so unlike binary search there's little room top/bottom — favor **left/right** panels at desktop width. On mobile (stacked), panels should flow above/below the board; the candidate-square highlights stay legible because cells are 44px. Keep the demo "line of fire" overlay (Beat 1) subtle so the board doesn't read as all-red.
- **Jargon taught in-lesson (first appearance, plain words):** "attacks"/line of fire (Beat 1, shown visually), brute force (Beat 2), recursion = a function calling itself on a smaller job + `len(placed)` = how many placed so far (Beat 4), pop/undo (Beat 4), search-space pruning + subtree (Beat 4), exponential = work that balloons as the input grows (Beat 5), the call stack as "chain of paused calls" (Beat 5), depth-first search (Beat 7). The reference `algorithm.py` uses `placed[:]` (a copy) — if the code panel surfaces it, the narration around Beat 4/7 should gloss "save a copy so later undos don't erase it."
- **Content check / minor bug:** the original derivation step 2 claims the brute-force is "millions of combinations" for picking 6 of 36 squares — C(36,6) ≈ 1.95M, which is fine, but it then pivots to 6^6 = 46,656 as the real number. The beat narration keeps only the 46,656 figure (the column-per-row count the visualizer shows) to avoid throwing two big numbers at a beginner; the millions figure is dropped as it's a different (and abandoned) counting model. Also the visualizer footnote says "actual solutions: 4" for the 6×6 board — N-queens for n=6 indeed has 4 distinct solutions, so that's correct and Beat 7's tally should read **4**, not the often-misremembered larger counts.
- **`codeLabels` faithfulness:** the live visualizer emits multi-label regions (e.g. `["loop","is_safe"]` as one coherent prune region, `["place","recurse"]` together). Beats mirror that so the docked highlight matches what the animation lights, rather than one line at a time.

---

## Peer review
- **verdict: needs-work**

Strong overall: every `@sync` label cited (`sig, init, loop, is_safe, place, recurse, backtrack, record_solution, record_append`) exists in `algorithm.py`; the codeLabels match the *exact* multi-label regions the live `ManualPlaceViz`/`AutoBacktrackViz` emit (`["loop","is_safe"]`, `["place","recurse"]`, `["record_solution","record_append"]`, `["backtrack"]`); tones used (good/bad/active/idle/muted) all exist in `tones.ts`; N=6 → 4 solutions and 6^6 = 46,656 are both verified correct; the wedge (Beat 3) and generalization (Beat 6) are preserved; jargon is glossed in-lesson. But there are real blockers and gaps:

- **Beat 1–7 / FEASIBILITY (blocker): "grid primitive" does not exist on the canvas plane.** The AC runtime renders each beat's `visual` as **SVG** (`BeatVisual` = "an `<svg>` group's contents", per `src/shared/lesson/types.ts`; `canvas.tsx` exports only SVG `Arrow`, `Bracket`, `Pill`, `CellRow` (1-D row), `rowGeom`). `GridViz`/`ArrayViz` render HTML `<div>`/`<button>` and are used by NO lesson. The plan's framing "Canvas: a 6×6 chessboard (grid primitive)" and "**visual**: grid" on every board beat is not directly buildable. CONCRETE FIX: either (a) state the board is authored from scratch as a 2-D SVG cell grid (extend `CellRow`/`rowGeom` to N rows) with the same tone palette, or (b) wrap `GridViz` in `<foreignObject>` and verify clicks/`cellDisabled` work inside the SVG plane. Pick one and spell it out — don't imply GridViz drops in.

- **Beat 3 / FEASIBILITY (blocker): wrong API name + reuse claim is inconsistent with (1).** The Notes say reuse `ManualPlaceViz` which "drives `onWedgeInteraction`". The actual `BeatVisualApi` (types.ts) exposes **`onInteractionDone`**, not `onWedgeInteraction`; the wedge-callback name only matches the *old visualizer's* `onInteraction` prop. CONCRETE FIX: rename to `onInteractionDone` and note that `ManualPlaceViz` is an HTML component, so reusing it inside the SVG canvas still requires the `<foreignObject>` path from issue (1) — reconcile the two notes.

- **Beat 1 / CORRECTNESS: narration vs ground truth on what a queen attacks.** Narration says "attacks along its whole row, its whole column, and both diagonals." True for chess, but the real `safe()` in `algorithm.py` checks only **column + diagonal** (row is implicitly excluded because one queen per row). Fine to teach the full chess rule, but Beat 4's `safe` only tests `same_col`/`same_diag`. CONCRETE FIX: in Beat 4 narration add one clause — "we never check the row because each row holds exactly one queen by construction" — so the lit `is_safe` line matches the stated rule.

- **Beat 4 / BEGINNER-SAFETY: `len(placed)` introduced as "the next row is row number `len(placed)`" but `placed` is never grounded as concrete numbers first.** A 15-year-old sees `place(placed)` and a "list of the chosen column of each filled row" but no example. CONCRETE FIX: borrow the docstring example from `algorithm.py` — show `placed = [1, 3]` means "row 0 queen in col 1, row 1 in col 3, so the next row is row 2" — before using `len(placed)`.

- **Beat 4 / BEGINNER-SAFETY: `placed[:]` / "save a copy" is buried in Notes, not in a beat.** The Notes flag it but no beat actually glosses it; if the docked code panel shows line `solutions.append(placed[:])` (it will — `record_append`), a beginner hits `[:]` cold in Beat 4 AND Beat 7. CONCRETE FIX: add the one-line gloss ("`placed[:]` = a snapshot copy, so later undos don't erase a saved solution") into Beat 7 narration (where `record_append` is the payoff), not just Notes.

- **Beat 5 / COHERENCE: narration says "a few hundred" / "hundreds" but the visual bar says "~few hundred pruned" while interaction auto-runs the real sweep.** The real n=6 search visits well under a few hundred *solutions* (4) but the count of `place` calls / partial boards is the figure shown. CONCRETE FIX: label the bar precisely — "partial boards built: ~hundreds" vs "46,656 blind placements" — so the two numbers are the same unit (placements/boards), not boards-vs-solutions. Also confirm the playback actually surfaces the running count the narration promises ("attempts climb, solutions tick to 4").

- **Beat 5 / CORRECTNESS (minor): "exponential" gloss.** Notes define exponential as "work that balloons as the input grows" — acceptable, but the beat narration's parenthetical "(work that balloons as the board grows)" should say *input/board size n*, not "the board," since for fixed n=6 nothing grows. Tiny wording fix for precision.

- **Beat 6 / FEASIBILITY: `visual: custom` gallery of 3–4 SVG thumbnails (sudoku cell, 2-color graph, bracket string, subset tally).** No primitive supplies these; each is a bespoke SVG. That's allowed (binary-search Beat 5 is also `custom`), but the plan should say "hand-authored SVG thumbnails, no primitive reuse" so the implementer budgets for it rather than expecting a component.

- **Beat 2 / minor: `6^6` rendered as `6^6` in the floating count.** The derivation.tsx uses `6<sup>6</sup>`. Ensure the canvas `Pill`/`<text>` renders the superscript (SVG `<text>` won't honor `<sup>`); spell it "6×6×6×6×6×6 = 46,656" or use a baseline-shifted tspan. CONCRETE FIX: specify the SVG-safe rendering of the exponent.
