## dfs
route: `/categories/algorithms/dfs/` · diagram shape: box

The captured run renders the structured register: 5 beats (setup, wedge "The instinct", derive "The derivation", operations, name "The pattern"). The top bar reads "DEPTH-FIRST SEARCH · ESCAPE THE MAZE", a pill "IDEA 4 OF 7", a "step N/5" counter, and the current beat label. The header has a MAP control and a back arrow. A "BUILDS ON" prereq strip shows three pills: Arrays & Lists, Graphs, Recursion (with a dismiss × on the right). Left/right gutters carry "BACK" and the next-action label; below the main panel sit the WHY? · CODE · RECAP chips and a row of progress dots.

### Beat 1 — The setup
![dfs beat1 desktop](img/dfs/beat1-d.png)
![dfs beat1 mobile](img/dfs/beat1-m.png)
The diagram is a 5×5 grid of square cells inside a large rounded panel: S labels the top-left cell, G the bottom-right, both outlined. The remaining cells render as empty dark boxes; a small blue down-arrow points into the S cell from above, and a − / + zoom control sits in the panel's bottom-right corner. Below the diagram the caption reads "THE SETUP", title "A small maze. Reach the corner.", and body text explaining the 5×5 grid, S start, G goal, walls, and one-cell moves. The right gutter shows the next action "WALK IT BY HAND"; this beat is non-gated, so the learner advances with the next arrow. The progress dots show the first of five filled. On mobile the layout stacks vertically with a bottom bar showing "back", "1 / 5", and a "Walk it by hand →" button.

### Beat 2 — The instinct
![dfs beat2 desktop](img/dfs/beat2-d.png)
![dfs beat2 mobile](img/dfs/beat2-m.png)
This is the wedge-gated beat (interaction: "wedge"). The same 5×5 grid renders with the S cell highlighted (active tone) at depth 0. A note card overlaps the grid's left ("The instinct: the maze from any cell is a smaller copy of the same question: can I reach G from here?"). To the right of the grid a status line reads "depth 0 · visited 1" above two buttons, "← back up" and "↺ reset". The main caption is "THE INSTINCT" / "Pick a direction. Dig deep. Back up when stuck." with body text instructing the learner to click a lit neighbour to step into it (each entered cell is marked) and press back up to retreat. The learner clears the gate by interacting with the maze: the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE" sits under the dots and the right gutter shows "LOCKED" until an interaction fires. On mobile the diagram's right-side controls are clipped off-screen, the bottom bar reads "2 / 5" with the next action "Make it a rule →" rendered disabled/greyed; the mobile capture stopped here (gate not cleared on mobile).

### Beat 3 — The derivation
![dfs beat3 desktop](img/dfs/beat3-d.png)
![dfs beat3 mobile](img/dfs/beat3-m.png)
This beat runs an automatic DFS playback (interaction: "playback"). The capture shows the playback at its starting frame: only the S cell is highlighted (active) with the status line "depth 0 · visited 1" and a "↺ replay" button to the right of the grid. Per the spec the walker then dives and backtracks on its own via a timed step loop (about 600ms a step) with the visited count climbing; replay restarts it. The caption "THE DERIVATION" / "Standing at a cell, ask each neighbour." sits below, with body text naming the move `explore(cell, trail)`, the goal/elsewhere/out-of-neighbours cases, and the term "recursion" rendered as a linked term. The right gutter action is "COUNT THE WORK"; progress shows the middle dot filled. Non-gated.

### Beat 4 — The operations
![dfs beat4 desktop](img/dfs/beat4-d.png)
![dfs beat4 mobile](img/dfs/beat4-m.png)
This beat opens on a prediction gate (interaction: "wedge", implemented as a PredictGate). The grid shows a walked trail across the top row (S plus three green trail cells, the fourth tinted as the current dead-end cell) with a faint caption above the grid "stuck: wall right, wall below, walked ground behind". A "PREDICT" card overlays the grid's left with the question "The walker must back up out of this dead end — what happens to the mark on the cell it leaves?" and three choices: "erased — backing up undoes the visit", "it stays — that cell is never explored again" (the correct one), and "it stays only because this is a dead end". Tapping a choice fires the gate and, after a short reading pause, the AutoDfs playback runs with the stack bracket on. The main caption is "THE OPERATIONS" / "Each cell once. Memory grows with the deepest detour." with body covering O(cells + connections) work and the stack as memory. The right gutter shows "LOCKED" and the under-dots prompt reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE"; selecting a prediction clears the gate.

### Beat 5 — The pattern
![dfs beat5 desktop](img/dfs/beat5-d.png)
![dfs beat5 mobile](img/dfs/beat5-m.png)
The closing beat. The grid shows the full solved path traced from S to G: the top row, a dive down through the middle column to the bottom-right, and the goal cell, all outlined green, plus two grey visited (off-path) cells; a blue vertical arrow runs down the right column into G. The caption "THE PATTERN" / "Depth-First Search." names the algorithm, with body text explaining "depth-first" and the cues (is there a path / does it connect, visit every connected thing, try-undo-retry, the answer calls itself). All five progress dots are present with the last filled, and the right gutter action reads "FINISH".

### Code drawer
![dfs code drawer desktop](img/dfs/drawer-code-d.png)
Opened on beat 5, the drawer panel ("THE CODE SO FAR") slides over the right half of the screen. It is labelled "OPTIONAL · algorithm.py · the lesson works without it" and shows numbered Python source for `find_path` / `explore`: the `Cell = tuple[int, int]` alias, a docstring, `rows`/`cols`/`visited` setup, the recursive `explore(r, c, trail)` helper with the goal base case (`if (r, c) == end: return trail`), `visited.add((r, c))`, and the four-neighbour loop with the recursive call. Line 17 (the goal base case) is highlighted with a left-margin marker. The grid diagram and the lesson caption remain visible to the left of the drawer.
