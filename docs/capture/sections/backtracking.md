## backtracking

route: `/categories/algorithms/backtracking/` · diagram shape: box

The captured route renders 5 of the spec's 7 beats: the default register trims the `obvious` and `general` beats, so the on-screen step counter reads 1/5 through 5/5. The header shows a map link, the title "BACKTRACKING · SIX QUEENS, NO CLASHES", an "IDEA 2 OF 7" pill, the step indicator, and the current beat label. A "BUILDS ON" prerequisite row sits beneath the header on the first beat with pills for Arrays & Lists, Recursion, and Depth-First Search. Each beat carries WHY? · CODE · RECAP chips above a five-dot progress strip, with BACK and a forward action label in the left and right gutters. The visual band holds a 6×6 board of rounded square cells.

### Beat 1 — The setup

![backtracking beat1 desktop](img/backtracking/beat1-d.png)
![backtracking beat1 mobile](img/backtracking/beat1-m.png)

The board shows a single queen at row 0, column 2 (toned green) with every square it attacks lit red across its row, column, and both diagonals; a downward arrow points to the queen from above. The main panel is labeled "THE SETUP", titled "Six queens on a 6×6 board. No clashes.", and the body explains that a chess queen attacks its whole row, column, and diagonals (the red squares) and that the goal is placing all six with none in another's line of fire. The "BUILDS ON" row above shows the three prerequisite pills, the WHY? · CODE · RECAP chips appear with the first of five dots active, and the right gutter action reads "HOW WOULD YOU SEARCH?". On mobile the board sits at top, the panel text stacks below, and the forward action becomes a full-width "How would you search? →" button next to "1 / …".

### Beat 2 — The instinct

![backtracking beat2 desktop](img/backtracking/beat2-d.png)
![backtracking beat2 mobile](img/backtracking/beat2-m.png)

This is the wedge beat (interaction: "wedge"); it is shown pre-interaction, so the right gutter reads "LOCKED" and the footer prompts "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The board's top row (row 0) is highlighted blue as the next clickable row while lower rows are idle. A right-gutter readout shows "placed 0 of 6" with "← undo" and "↺ reset" buttons, and a note panel states the instinct: don't finish a guess before checking it can still win, test at every step, quit a branch when it can't reach a full board. The main panel is labeled "THE INSTINCT", titled "Place a queen. Check. Undo when stuck." Mechanically, the learner clicks a safe (blue) square in the next row top-down; attacked (red) squares refuse the click; with no safe square the learner presses undo to lift the last queen and try another column. Any interaction (a click or undo) fires onInteractionDone to clear the LOCKED gate. On mobile the board, the "placed" counter, and the undo/reset controls stack; the forward button reads "Make it a rule →".

### Beat 3 — The derivation

![backtracking beat3 desktop](img/backtracking/beat3-d.png)
![backtracking beat3 mobile](img/backtracking/beat3-m.png)

The board shows a partial placement — queens at row 0 col 1, row 1 col 3, row 2 col 0 (green) — with their combined attacks lit red and one blue "active" candidate cell in row 3, pointed to by a left-side arrow. The main panel is labeled "THE DERIVATION", titled "Place row by row. Recurse. Undo a dead end.", and the body describes `placed` as the list of columns picked per filled row (so `[1, 3]` fills rows 0 and 1), the save-when-six base case, and the per-safe-column add / call `place` a row deeper / pop sequence, defining recursion inline and naming the pop as the undo. A note panel states the principle: rejecting a column skips every board that would have started with it — a whole branch never built — which is pruning. This beat is non-interactive; the right gutter action reads "COUNT THE WORK".

### Beat 4 — The operations

![backtracking beat4 desktop](img/backtracking/beat4-d.png)
![backtracking beat4 mobile](img/backtracking/beat4-m.png)

This is a wedge beat with a prediction gate, shown pre-interaction: the right gutter reads "LOCKED" and the footer prompts "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The board is empty with the caption "the empty board, before the search runs" below it. A PREDICT panel overlays the board asking "Six column picks per row make 46,656 possible boards — how many will the checking search actually build?" with three tappable choices: "still tens of thousands", "about half of them", and "a few hundred" (the correct one). The main panel is labeled "THE OPERATIONS", titled "Worst case balloons. The prune cuts deep.", noting the search touches a few hundred boards instead of 46,656, that `boards built` climbs and `solutions` reach 4, that the worst case stays exponential, and that memory stays tiny (paused `place` calls, six deep at most). Mechanically, one tap on a prediction pill is the real interaction; PredictGate fires onInteractionDone, shows feedback, and after a short pause reveals the AutoBacktrack playback that animates placing, pruning, and undoing while a live "boards built" counter answers the prediction. On mobile the PREDICT panel is partly clipped at the right edge over the empty board; the forward button reads "Name the pattern →".

### Beat 5 — The pattern

![backtracking beat5 desktop](img/backtracking/beat5-d.png)
![backtracking beat5 mobile](img/backtracking/beat5-m.png)

The board shows a complete legal six-queens solution — queens at columns [1, 3, 5, 0, 2, 4] across the rows, all toned green with no red attacks — and a left-pointing arrow at the row-2 queen. The main panel is labeled "THE PATTERN", titled "Backtracking.", and the body names the move as depth-first search (dig down one path before trying others) with a check at every step, identifies the "back" as the undo, notes that saving a board uses `placed[:]` (a frozen copy so later undos can't erase it), and gives the "find all / is there any" usage cue plus the fact that six queens has 4 solutions. This beat is non-interactive; the right gutter action reads "FINISH". On mobile the solved board sits above the stacked panel and the footer button reads "Finish ✓".

### Code drawer

![backtracking code drawer desktop](img/backtracking/drawer-code-d.png)

The code drawer slides in from the right over the final beat (step 5/5), titled "THE CODE SO FAR" with an "OPTIONAL — the lesson works without it" note and a close button. It shows the Python source `algorithm.py`: a `n_queens(n: int) -> list[list[int]]` function with a docstring, a `solutions` list, a nested `safe(placed, row, col) -> bool` helper that scans `placed` for same-column and same-diagonal clashes, and a `place(placed) -> None` function whose base case appends `placed[:]` when `len(placed) == n` and whose loop tries every column in `range(n)`. The currently active lines (the base-case `if len(placed) == n:` and `solutions.append(placed[:])`) are highlighted, matching the recorded-solution step of the closing beat.
