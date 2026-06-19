## bfs
route: `/categories/algorithms/bfs/` · diagram shape: box

The captured run is the structured-register sequence of five beats (setup, the instinct, the derivation, the operations, the pattern); the spec's full intuitive arc also includes "the obvious thing" and "the generalization", which are not in this capture. The header reads "BREADTH-FIRST SEARCH · THE FEWEST STEPS OUT" with an "IDEA 3 OF 7" pill and a "step N/5" progress marker. Wedge beats are shown in their initial pre-interaction (LOCKED) state because the dot-jump does not perform the interaction.

### Beat 1 — The setup
![bfs beat1 desktop](img/bfs/beat1-d.png)
![bfs beat1 mobile](img/bfs/beat1-m.png)

The progress marker reads "step 1/5 · THE SETUP". A "BUILDS ON" prereq row shows three diamond pills: Arrays & Lists, Graphs, Stacks & Queues. The diagram is a 5x5 grid of box cells with "S" in the top-left cell and "G" in the bottom-right cell, both drawn with outlined borders; a vertical blue arrow descends the rightmost column into the G cell. A minus/plus zoom control sits at the grid's bottom-right. The main panel below carries caption "THE SETUP", title "Same maze. New question: how few steps?", and body text describing the 5x5 grid, S/G positions, walls, and the shift from "is there a way out?" to "what's the fewest steps?". Under the panel are "WHY? · CODE · RECAP" chips and five progress dots with the first filled. The right side-nav shows a forward chevron "EXPLORE BY DISTANCE...", the left a "BACK" chevron. Interaction type is none. On mobile the prereq pills wrap to two lines, the grid stacks above the panel text, and a bottom action bar shows "Back", a "1 /..." counter, and a primary "Explore by distance instead →" button.

### Beat 2 — The instinct
![bfs beat2 desktop](img/bfs/beat2-d.png)
![bfs beat2 mobile](img/bfs/beat2-m.png)

The progress marker reads "step 2/5 · THE INSTINCT". The diagram is the same 5x5 grid; the S cell now carries a sub-number "0" beneath its "S" label, marking distance 0. To the right of the grid a status line "ring 0 · reached 1" sits above three stacked control buttons: "▶ play", "step ring", and "↺ reset". An overlaid note card to the left reads "The instinct: a cell two steps away can never light before a one-step cell. So the first touch of G is the shortest: nothing closer was skipped." The main panel has caption "THE INSTINCT", title "Spread a ripple outward, one ring at a time.", and body text telling the learner to use ▶ play or step ring, explaining the small number on each cell is its distance and the first touch of G is the answer. Interaction type is wedge: pressing play runs the ripple automatically, or step ring advances one distance ring at a time, lighting cells one step from S, then two, then three, and writing each cell's distance; each press fires the interaction-done signal that unlocks the forward nav. Shown pre-interaction, so the right side-nav is a padlock labeled "LOCKED" and a prompt reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". On mobile the note card is not shown, the grid sits above the panel, and the bottom action bar shows "Back", a "2 /..." counter, and a "Why the first touch wins →" button.

### Beat 3 — The derivation
![bfs beat3 desktop](img/bfs/beat3-d.png)
![bfs beat3 mobile](img/bfs/beat3-m.png)

The progress marker reads "step 3/5 · THE DERIVATION". The diagram shows the maze with S at distance 0 and a status line "S waits in the line at distance 0", with a PREDICT gate panel overlaid on the right (hosted on the canvas via a foreignObject) and a blue arrow pointing down into the queue region. The gate asks "Discovered cells wait in a line; we always serve the front. Where must newcomers join so the closest is always served first?" with three tappable choice pills: "at the back — first found, first served" (the correct choice), "at the front — newest first", and "anywhere — order won't matter". The main panel has caption "THE DERIVATION", title "A queue holds 'the next ring to look at'.", and body text describing the queue as a waiting line (join at the back, leave from the front), seeding S at distance 0, marking open unseen neighbours seen, and sending them to the back at distance one higher. Interaction type is wedge: tapping a pill is the gating action; after a short reading pause an AutoBFS playback replaces the gate and grows a live queue column beside the maze. Shown pre-interaction, so the right side-nav is "LOCKED" and the prompt reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". On mobile the gate panel is partly clipped at the right edge, the maze sits above the panel text, and the bottom bar shows "Back", "3 / 5", and a "Count the work →" button.

### Beat 4 — The operations
![bfs beat4 desktop](img/bfs/beat4-d.png)
![bfs beat4 mobile](img/bfs/beat4-m.png)

The progress marker reads "step 4/5 · THE OPERATIONS". The diagram shows the fully flooded maze: every open cell carries its distance number (S=0 rising to G=8), green-outlined cells trace the BFS path, and a "queue · front on top" column to the right reads "empty" because the run is frozen at completion. A status line reads "✓ shortest distance 8". The main panel has caption "THE OPERATIONS", title "Each cell enters the line once. Each is checked once.", and body text introducing V (open cells), E (links between neighbours), the O(V + E) total-work claim, and the note that DFS does the same work but only BFS's first arrival at G is guaranteed shortest. Interaction type is playback, frozen here as a static solved frame rather than a running animation. The right side-nav reads "NAME THE PATTERN".

### Beat 5 — The pattern
![bfs beat5 desktop](img/bfs/beat5-d.png)
![bfs beat5 mobile](img/bfs/beat5-m.png)

The progress marker reads "step 5/5 · THE PATTERN". The diagram again shows the frozen fully-flooded maze with distance numbers and the green BFS trail, the "queue · front on top" column reading "empty", and the "✓ shortest distance 8" status line. The main panel has caption "THE PATTERN", title "Breadth-First Search.", and body text naming the algorithm (finish every cell at distance d before any at d+1, the queue forcing that order) and listing the triggers "fewest steps" where every step costs the same, "closest match", and "level by level". Interaction type is none (a static frozen frame). The right side-nav reads "FINISH", marking the final beat.

### Code drawer
![bfs code drawer desktop](img/bfs/drawer-code-d.png)

The code drawer opens as a right-side panel titled "THE CODE SO FAR" over the dimmed lesson view, with a subheader "OPTIONAL algorithm.py · the lesson works without it". It renders numbered Python lines: `from collections import deque`, a `Cell = tuple[int, int]` type alias, and `def shortest_steps(grid: list[list[int]], start...` with a docstring about the fewest up/down/left/right steps and a comment that "0 means open, 1 means a wall" and the trick is to start one ring at a time. Visible lines set `rows = len(grid)` and `cols = len(grid[0])`, a `seen: set[Cell] = {start}` set (commented "Each cell gets queued exactly once"), a `queue: deque[tuple[Cell, int]] = deque([(start...` worklist (commented "The queue holds (cell, distance-from-start)"), and the main `while queue:` loop with `(r, c), d = queue.popleft()` and an `if (r, c) == end: return d` goal check. Line 26 (`return d`) is highlighted with a left-edge marker, corresponding to the active code line for the captured beat.
