# Annotated-Canvas Conversion — Depth-First Search

Topic: `algorithms/dfs` · 7 derivation steps → 7 beats.
Visual core stays a **5×5 maze grid** (the `grid` primitive); the explanation moves onto the plane as a panel with an arrow to the exact cell/trail it describes; `algorithm.py` docks on the right with the active `@sync` line(s) following the beat.

Canvas: 5×5 grid of cells. Tones reused from the current visualizer: `wall`, `start` (S), `goal` (G), `active` (the cell the walker is on, "•"), `trail` (the live path back to start), `visited` (a cell tried and abandoned), `idle` (open, untouched). Keep S top-left `(0,0)`, G bottom-right `(4,4)`.

`@sync` labels that actually exist in `algorithm.py`: `sig`, `visited`, `found`, `visit`, `neighbors`, `recurse`, `backtrack`.

---

### Beat 1 — The setup · A small maze. Get to the corner.
- **narration:** On the right is a 5×5 grid. You start top-left (S), the goal is bottom-right (G). Grey cells are walls — you can't pass through. You may step one cell up, down, left, or right. Is there a way through? Your eye finds it instantly; a computer can only look at one cell at a time.
- **visual:** grid — full 5×5 maze. S highlighted at top-left, G highlighted at bottom-right, walls toned grey, every other cell idle. Nothing visited yet.
- **panel:** top
- **arrow:** from the panel down to the **S cell** (the starting corner the narration names).
- **codeLabels:** `["sig"]` (just the function signature — the problem statement, nothing running yet)
- **interaction:** none

### Beat 2 — The obvious thing · Try every sequence of moves. There are too many.
- **narration:** Brute force means writing out every possible move-sequence and checking each against the maze — four choices each step, exploding into millions even here. Be smarter: never re-enter a cell you've already left (re-walking it explores nothing new), and if a cell's neighbours all dead-end, turn around.
- **visual:** grid — same maze, but show the explosion. Dim the maze slightly (toned) and overlay a count callout: "blind move-sequences of length 10 = 4^10 ≈ 1,048,576" in the hard/red tone vs "cells in the maze = 25" in the easy/green tone. (4^10 = "4 multiplied by itself 10 times.")
- **panel:** bottom
- **arrow:** none (this beat argues about the whole maze, not one cell — a bracket-style callout over the grid instead of a single arrow).
- **codeLabels:** `[]` (the naive idea is not in the real code; nothing lights up)
- **interaction:** none

### Beat 3 — The wedge · Pick a direction. Dig as deep as you can. Back up when stuck.
- **narration:** Your turn. Click an open neighbour to step into it — each cell you enter gets marked. When you can't go anywhere new, hit "back up": you retreat one cell and try another direction. That retreat is the whole idea. The wedge: the maze from any cell is just a smaller copy of the same question — *can I reach G from here?*
- **visual:** grid — **interactive** manual walker. The current cell shows "•" (active); the live path back to S is toned `trail`; abandoned cells are `visited`; clickable open neighbours are highlighted as candidates. A "back up" and reset control sit under the grid. Live counters: steps taken, cells visited.
- **panel:** top (main) + a small **note** panel for the wedge sentence (the recursive self-similarity claim), placed bottom so it doesn't cover the clickable cells.
- **arrow:** from the main panel to the **active "•" cell** (the cell the user is standing on / deciding from).
- **codeLabels:** `["recurse", "visit"]` when the user steps into a neighbour; `["found"]` if they reach G; `["backtrack"]` when they press back up. (The live visual emits these via `onActiveLine`; static fallback `["recurse", "visit"]`.)
- **interaction:** wedge — PRESERVED. The user must step/back-up at least once before "Next" unlocks.

### Beat 4 — The derivation · Standing at a cell, ask each neighbour.
- **narration:** Name the move: `find_path_from(cell, trail)` — `trail` is the list of cells walked so far. Three cases. On the goal: hand back the trail. On any other cell: mark it visited, then for each open, unvisited neighbour, ask it the same question; if it returns a trail, you're done; if not, try the next. Out of neighbours: return nothing, and whoever called you tries their next direction. This is *decomposition* — the big maze solved by solving each neighbour's smaller maze.
- **visual:** grid — auto-play DFS begins (or a paused frame mid-dive). Walker "•" sits a few cells in, `trail` connecting it back to S, one branch already `visited` (a tried-and-abandoned spur). Show the three labelled cases as small tags pointing at: the active cell (mark visited), an open neighbour (recurse), a dead-end spur (return nothing / back up).
- **panel:** top
- **arrow:** from the panel to the **active "•" cell** (the "standing at a cell" the narration centers on).
- **codeLabels:** `["found", "visit", "neighbors", "recurse", "backtrack"]` (the full body of `explore` — this beat narrates every branch of the helper).
- **interaction:** playback (auto-animates the dive-and-retreat).

### Beat 5 — The operations · Each cell handled once. Stack as deep as the longest detour.
- **narration:** Because we mark cells visited, each becomes the "current" cell at most once, and from each we glance at four neighbours — so total work is O(cells + walls): the effort grows in step with the maze's size plus its connections, a few dozen checks here. (O(...) just means "how the work scales as the maze grows.") Memory: each cell on the current trail adds one stack frame — a stack is the pile of paused calls waiting to resume, last-in-first-out. A 20-cell detour stacks 20 deep before retreating.
- **visual:** grid — auto-play continues, but spotlight the **stack depth**. Tone the live `trail` brightly and label it "stack = current trail" with a depth counter; keep `visited` cells dim to show "each touched once." A side note: deep/twisty mazes can swap recursion for an explicit list of cells to visit — same walk, different bookkeeping.
- **panel:** bottom (so the trail up the grid stays visible)
- **arrow:** bracket/arrow spanning the **live trail** (S → current cell) labelled "stack depth = this trail's length."
- **codeLabels:** `["visited", "recurse"]` (`visited` set = the "handled once" guarantee; `recurse` = the call that deepens the stack).
- **interaction:** playback

### Beat 6 — The generalization · Not just grids. Anything with neighbours.
- **narration:** A "cell" can be anything with neighbours — a folder with subfolders, a friend with friends, a webpage with links. The walker doesn't care. Same walk crawls a whole website, finds connected groups in a social graph, detects cycles in a dependency tree, hunts a file in folders, or solves a sudoku. Whenever the question is "can I reach X?" or "what can I reach from here?", this is the walk.
- **visual:** swap the grid for a small **graph/tree** primitive — a handful of nodes (a "node" is just a thing-with-neighbours: a dot) connected by edges, with the DFS dive highlighting one deep branch first before the others, mirroring the maze behaviour. Tiny icon row beneath: folder, web page, social graph, dependency tree — the same shape, different stories.
- **panel:** left (the graph sits right, the panel reads beside it)
- **arrow:** from the panel to the **deepest highlighted node** of the graph (the "dig deep first" branch).
- **codeLabels:** `["neighbors", "recurse"]` (the only grid-specific bit was the 4 directions; here we generalise "for each neighbour, recurse" — exactly these two lines carry over).
- **interaction:** playback (animate the same dive-deep order on the graph) — or `none` if rendered static.

### Beat 7 — The pattern · Depth-First Search.
- **narration:** That's the name. *Depth-first* because at each step we go as deep as we can before turning around. (The opposite habit — checking everything nearby before anything far — is a different walk you'll meet next.) You'll spot DFS when you hear: "is there a path / can I reach / does it connect?", "visit every connected thing", or "try a choice, undo it, try the next" (sudoku, n-queens) — and when the natural answer is recursive: each step looks like the original problem.
- **visual:** grid — the **solved maze**: full `trail` from S to G lit in the success/green tone, the abandoned `visited` spurs dimmed, a "✓ reached G · trail length N" badge. Below, the pattern-signal bullets. Optional: a hint that the docked code's recursive helper does the real work; the rest just sets up the visited set and kicks off the walk.
- **panel:** top
- **arrow:** from the panel to the **G cell** (the corner now reached — the payoff).
- **codeLabels:** `["found"]` (the line that returns the completed trail — the moment the search succeeds). Optionally also `["sig"]` to nod at the public entry point.
- **interaction:** none (terminal beat / "Mark complete").

---

## Notes

- **Wedge preserved (Beat 3):** the manual click-to-walk + "back up" interaction is the topic's core teaching moment and stays a true gate — "Next" must wait for at least one step or back-up. The existing `ManualWalkViz` already wires `onInteraction` → `onInteractionDone` and `onActiveLine`; map those straight onto the contract's `BeatVisualApi`.

- **Jargon taught on first use (content rule):** I introduced plain-words clauses for terms the original lesson used bare or never unpacked:
  - **`trail` / the `(cell, trail)` argument** (Beat 4) — "the list of cells walked so far." Original step 4 wrote `find_path_from(cell, trail)` with no gloss on what `trail` is.
  - **O(cells + walls)** (Beat 5) — original step 5 dropped `O(cells + walls)` and the cost grows in step with the maze; I add "O(...) just means how the work scales as the maze grows," because Big-O appears here for the first time in this lesson.
  - **stack / stack frame / LIFO** (Beat 5) — original step 5 says "the function calls stack up" and "the stack gets twenty deep" without ever defining a stack. Added "the pile of paused calls waiting to resume, last-in-first-out."
  - **node** (Beat 6) — generalization introduces graphs; "a node is just a thing-with-neighbours: a dot."
  - **recursion / "the recursion writes itself"** (Beat 4) — keep the lesson's phrasing but lead with "ask it the same question," so a beginner sees the self-call before the word *recursive* lands in Beat 7.

- **Visual-primitive switch (Beat 6):** beats 1–5 and 7 are the maze `grid`; Beat 6 switches to a `graph`/`tree` to make "anything with neighbours" literal. This is the one beat that changes primitive — flag it for the implementer so the canvas swap animates cleanly rather than morphing the grid.

- **Mobile / dense visual:** Beat 3's grid has clickable candidate cells AND two stacked panels (main + wedge note) — on a phone the panels must dock top/bottom (never overlay the tappable cells), and tap targets stay ≥40px (the current `CELL_PX` is 56, fine). Beat 5's trail-spanning bracket label can collide with the grid on narrow widths — shorten to "stack depth" on mobile.

- **Content bug spotted (Beat 2 / step 2):** the prose says "four choices at every step" and the visual callout uses `4^10`, but the maze only allows up/down/left/right *into open, in-bounds, unvisited* cells — from a corner there are at most 2 real moves, and the walker never revisits. The `4^10` figure is the deliberately-naive "blind brute force" count (which is the point of the beat), but the narration should keep it explicitly framed as the *blind* count so a beginner doesn't think real DFS does a million checks. I kept that framing ("blind move-sequences"). Worth a one-line clarification in the final copy.

- **Counter naming drift:** the manual walker (Beat 3) labels its depth metric "steps"/"visited," while the auto walker (Beats 4–5) labels it "stack depth"/"visited." Since Beat 5 teaches that the trail *is* the stack, consider unifying the Beat 3 "steps" counter to "trail depth" so the same quantity isn't named two ways across beats.

- **`@sync` label coverage:** every label in `algorithm.py` (`sig`, `visited`, `found`, `visit`, `neighbors`, `recurse`, `backtrack`) is used by at least one beat. `neighbors` (the `for dr, dc in (...)` loop) is light in the live visualizer's `lineForStep` mapping; surface it explicitly on Beats 4 and 6 where the narration is literally "for each neighbour."

---

## Peer review
- **verdict:** good

- **issues:**
  - **Beat 3 — "highlighted as candidates" overstates the primitive.** The built `ManualWalkViz` does not paint open neighbours a distinct candidate tone; it leaves them `idle` and uses `cellDisabled` to grey out everything that is *not* a legal next step (`cellDisabled={(r, c) => !isCandidate(r, c)}`). FIX: reword the visual to "the four legal next cells stay tappable while every other cell is dimmed/disabled," or add a real candidate tone to `mazeCell` if a positive highlight is wanted. As written, an implementer will look for a highlight that isn't there.
  - **Beats 1, 4, 6 — separate "live `@sync`" from "static codeLabel," or the highlight will look broken.** The live emitters only fire a subset: `MazeStaticViz` (steps 1–2) emits *nothing* via `onActiveLine`, and `AutoDfsViz.lineForStep` only ever returns `found` / `backtrack` / `recurse+visit` — it never emits `sig`, `visited` (the set decl), or `neighbors`. So Beat 1 `["sig"]`, Beat 4's `["...,"neighbors",...]`, Beat 5's `["visited",...]`, and Beat 6's `["neighbors",...]` can only be rendered as *static* codeLabels, not driven by the live visual. FIX: in each of those beats, mark the listed labels as static highlights and note the live `onActiveLine` stream is the narrower set; otherwise the docked highlight will silently disagree with the codeLabels and read as a bug. (Note 89 already half-acknowledges this for `neighbors` — make it explicit per-beat.)
  - **Beat 2 — keep the "blind" framing inside the narration, not just the Notes.** The doc's own content-bug note (line 85) is correct: `4^10` is the blind brute-force count, but a 15-year-old reading "four choices each step, exploding into millions even here" right next to a maze where a corner has at most 2 legal moves can conclude real DFS does ~1M checks. FIX: in the Beat 2 narration string, bind the number to the word "blind" once more ("blind = ignoring walls and the no-revisit rule") so the contrast with "cells = 25" lands without re-reading.
  - **Beat 5 — "glance at four neighbours" is faithful to source but worth one beginner guardrail.** Source step 5 says the same, and `O(cells + walls)` is correctly glossed. No correctness error. Minor: the parenthetical "(O(...) just means how the work scales as the maze grows)" is good; keep it *before* the symbol's first appearance in the rendered narration, not after, so the beginner meets the plain words first.
  - **Beat 6 — confirm the primitive swap is GraphViz/Scene, and that the "dive deep" highlight is a tone, not an animation you must hand-roll.** Feasible: `GraphViz` is a thin adapter over `Scene`, nodes take a `tone` and `onNodeClick`, so highlighting the deepest branch and animating the dive via `AnimatedAlgorithmView` frames is supported. The "tiny icon row" (folder / web page / social graph / dependency tree) is plain panel JSX, not a viz primitive — label it as panel content so no one hunts for an icon primitive. No blocker; just name it.
  - **Counter-naming drift (carry-over, real).** Beat 3 shows `steps: {trail.length-1}` while Beats 4–5 show `stack depth: {stack.length}`. Beat 5 then teaches "the trail *is* the stack." These are off-by-one different quantities (`trail.length-1` vs `stack.length`) AND named differently. FIX as the Notes suggest — unify to "trail depth" — but also reconcile the off-by-one so the number a learner saw walking manually matches the "stack depth" number they're told is the same thing.

  - **Faithfulness / wedge / generalization: all preserved.** The wedge (Beat 3 manual click-to-walk + "back up" as a true gate) is intact and maps onto the existing `onInteraction`/`onActiveLine` wiring. Decomposition (Beat 4), the `O(cells+walls)` + stack story (Beat 5), and the "anything with neighbours" generalization (Beat 6 → graph) are all faithful to `derivation.tsx` and `algorithm.py`. All seven `@sync` labels exist in the source. Complexity claim is correct.
