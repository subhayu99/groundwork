## operators
route: `/categories/programming-basics/operators/` · diagram shape: line

### Beat 1 — Combine values
![operators beat1 desktop](img/operators/beat1-d.png)
![operators beat1 mobile](img/operators/beat1-m.png)
The canvas holds three stacked expression rows, each labelled at the left (`arithmetic`, `comparison`, `logical`) with the expression in a bordered pill (`3 + 4 * 2`, `total > 10`, `is_big and total < 100`), an `=` sign, and a result box on the right showing `?`. All three rows and their result boxes are dimmed, and every result reads `?` (nothing resolved yet). The caption above the rows reads "operators take values in and give a new value out". The header shows the breadcrumb `MAP · OPERATORS · COMBINING VALUES`, an `IDEA 4 OF 7` pill, and `step 1/5 · COMBINE VALUES`. A "BUILDS ON" strip below the header carries a `Variables` prereq pill with a dismiss (×). The main panel below reads label "COMBINE VALUES", title "Turn values into new values.", and body about storing being half and combining the other half. The why·code·recap chips and five progress dots (first filled) sit under the panel; the right side nav reads "DO THE MATHS". No interaction is required to advance. On mobile the three rows render in the canvas; the side nav becomes a bottom bar with a "1 / 5" counter and a "Do the maths →" button.

### Beat 2 — Arithmetic
![operators beat2 desktop](img/operators/beat2-d.png)
![operators beat2 mobile](img/operators/beat2-m.png)
The arithmetic row (`3 + 4 * 2`) is now focused (highlighted border) and a PREDICT gate panel overlays the two lower rows. The gate asks "3 + 4 * 2 — which operator runs first?" with three tappable choices: "the + — it's first, left to right", "the * — multiply before add", and "neither — it needs parentheses". The caption reads "3 + 4 * 2 — two operators, one line: something has to run first" and the result box still shows `?` (the row has not resolved). The main panel reads label "ARITHMETIC", title "3 + 4 * 2 → 11", body explaining `* /` happen before `+ -`. Below the dots is the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE", and the right side nav reads "LOCKED". This beat is gated by the predict gate: the learner must tap a choice on the diagram (the correct one being "the * — multiply before add"), after which the row resolves to `11` and the next-step nav unlocks. On mobile the same gate panel renders over the rows, the next button "Compare them →" is dimmed/disabled, and the "↑ TRY IT ON THE DIAGRAM TO CONTINUE" prompt appears.

Mobile capture stopped here (2 of 5 beats). The predict gate at beat 2 was not cleared in the mobile run, so no mobile screenshots exist for beats 3–5.

### Beat 3 — Comparison
![operators beat3 desktop](img/operators/beat3-d.png)
The arithmetic row has resolved: its result box now shows `11` (gate cleared). The comparison row (`total > 10`) is now focused, and its result box shows `True` in a green-bordered box. The logical row remains dimmed with `?`. The caption reads "total > 10 → True · a comparison answers a yes/no question". The header shows `step 3/5 · COMPARISON`. The main panel reads label "COMPARISON", title "total > 10 → True", body listing the six comparison operators (`> < >= <= == !=`) that yield a boolean. Progress dots show the third filled; the right side nav reads "COMBINE ANSWERS". No gate on this beat; advancing via the side nav.

### Beat 4 — Logical
![operators beat4 desktop](img/operators/beat4-d.png)
All three rows are now resolved: arithmetic `= 11`, comparison `= True`, and the logical row (`is_big and total < 100`) is focused with its result box showing `True` (green border). The caption reads "is_big and total < 100 → True · both sides must be True for 'and'". The header shows `step 4/5 · LOGICAL`. The main panel reads label "LOGICAL", title "is_big and total < 100 → True", body covering `and`, `or`, `not` combining booleans (and is True only if both sides are; or if either; not flips). Progress dots show the fourth filled; the right side nav reads "SEE IT WHOLE". No gate; advancing via the side nav.

### Beat 5 — Three families
![operators beat5 desktop](img/operators/beat5-d.png)
All three rows remain resolved (`11`, `True`, `True`) but none is focused now — the view steps back to show the whole set. The caption reads "arithmetic → numbers · comparison & logical → booleans". The header shows `step 5/5 · THREE FAMILIES`. The main panel reads label "THREE FAMILIES", title "Numbers out, or booleans out.", body explaining arithmetic gives numbers while comparison and logical give booleans, and those booleans are the fuel an `if` burns. Progress dots show the fifth (final) filled; the right side nav reads "FINISH". No completion ceremony overlay is visible in this capture — the final beat shows the recap state with the "FINISH" affordance.

### Code drawer
![operators code drawer desktop](img/operators/drawer-code-d.png)
The drawer slides in from the right over the recap beat, titled "THE CODE SO FAR" with a close (×). A subheader reads "OPTIONAL · algorithm.py · the lesson works without it". The code listing shows numbered lines: a comment `# Operators combine values: arithmetic, comparis…`, then `total = 3 + 4 * 2`, `is_big = total > 10`, `ok = is_big and total < 100`, and a highlighted final line `print(total, is_big, ok)` (line 6, marked with a run pointer). The drawer overlaps the right portion of the canvas, partially covering the result boxes.
