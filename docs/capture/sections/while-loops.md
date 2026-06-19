## while-loops
route: `/categories/programming-basics/while-loops/` · diagram shape: line

The capture ran in the structured register (4 beats: need, run, exit, recap; the intuitive-only `setup` beat is cut). Desktop reached all 4 beats; mobile reached 3 of 4 — the predict gate on Beat 3 blocked advancement on the captured mobile pass (see Beat 3 below).

### Beat 1 — Repeat without copying
![while-loops beat1 desktop](img/while-loops/beat1-d.png)
![while-loops beat1 mobile](img/while-loops/beat1-m.png)
The diagram is three stacked rounded rows on the line-shape canvas, all dimmed (idle): `count = 0 → 0 < 3 ✓ → print 0, count → 1`, the same for `1` and `2`. Above them sits the dimmed caption "do the same thing many times — without writing it many times". The top bar reads MAP · WHILE LOOPS · REPEAT WHILE TRUE with an "IDEA 3 OF 7" pill and "step 1/4 · REPEAT WITHOUT COPYING"; a "BUILDS ON" strip below shows an "If / Else" prereq pill with a close (x) control. The main panel under the canvas shows the eyebrow "REPEAT WITHOUT COPYING", the idea title "Repetition, written once.", and body text about printing 0, 1, 2 vs. a thousand. Below are the WHY? · CODE · RECAP chips and four progress dots (first filled). The right side nav reads "SET IT UP" (the action label) with a chevron; left side nav reads "BACK". There is no gate; advancing uses the right-side action. On mobile the layout stacks vertically with a bottom bar showing "Back", "1 / 4", and a "Set it up →" button.

### Beat 2 — Round by round
![while-loops beat2 desktop](img/while-loops/beat2-d.png)
![while-loops beat2 mobile](img/while-loops/beat2-m.png)
The same three round rows are now active (highlighted, accent-bordered, brighter fill) rather than dimmed, with the caption "all three rounds, side by side — each one: check, run the block, then loop back". The top bar shows "step 2/4 · ROUND BY ROUND". The main panel reads eyebrow "ROUND BY ROUND", title "Check → run → repeat.", and body tracing Round 1 (`0 < 3` True, prints `0`, bumps `count` to `1`), then rounds 2 and 3. Progress dots show the second filled. Right side nav reads "WHEN DOES IT STOP?" (the action label for the exit beat), left reads "BACK". No gate on this beat; advancing uses the right-side action. Mobile bottom bar shows "2 / 4" and a "When does it stop? →" button.

### Beat 3 — The exit
![while-loops beat3 desktop](img/while-loops/beat3-d.png)
![while-loops beat3 mobile](img/while-loops/beat3-m.png)
The three rounds stay active, with caption "three rounds done — count is 3, and the loop heads back up to the test". A PREDICT gate panel overlays the lower part of the diagram, posing "count just became 3 — what does the loop do at the next check?" with three choice chips: "it stops — no more rounds", "one more round — 3 prints", and "it starts over from 0". The main panel reads eyebrow "THE EXIT", title "3 < 3 → False → stop", and body explaining that after the third round `count` is `3`, `3 < 3` is False, the block is skipped, and the program moves on. This beat is gated: the right side nav reads "LOCKED" with a padlock icon, and below the progress dots a prompt reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The learner must tap a prediction chip in the diagram; the correct choice is "it stops — no more rounds" (note: 3 < 3 is False so the block is skipped). After the tap and a feedback pause the visual reveals the failed exit row and updates the caption to "count is now 3 → 3 < 3 is False → the loop stops". On mobile the gate renders the same and the bottom-bar "The catch →" button is shown disabled; this gate is where the mobile pass stopped (3/4 reached), so mobile did not capture Beat 4.

### Beat 4 — Repeat while true
![while-loops beat4 desktop](img/while-loops/beat4-d.png)
The diagram now shows all three active rounds plus a fourth row in a red (bad) tone: `count = 3 → 3 < 3 ✗ → stop the loop`, with the caption "✓ printed 0, 1, 2 — then stopped". The top bar reads "step 4/4 · REPEAT WHILE TRUE". The main panel shows eyebrow "REPEAT WHILE TRUE", title "Repeat while the condition holds.", and body describing the while loop as a question asked over and over — True runs the block, False stops, and the body must nudge toward False. Progress dots show the fourth filled. Right side nav reads "FINISH", left reads "BACK". No mobile shot exists for this beat (gate at Beat 3 blocked the mobile pass).

### Code drawer
![while-loops drawer code desktop](img/while-loops/drawer-code-d.png)
Opened over the right side of the Beat 4 view, the drawer is titled "THE CODE SO FAR" with a close (x) control and an "OPTIONAL  algorithm.py · the lesson works without it" subhead. It shows numbered Python lines: a comment "# A while loop repeats its block as long as the …" (truncated at the panel edge), `count = 0`, `while count < 3:`, `print(count)`, `count = count + 1`, and a highlighted line 7 `print("done")` marked with a ▶ pointer. The underlying main panel (title "Repeat while the condition holds.") remains visible to the left.
