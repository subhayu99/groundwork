## for-loops
route: `/categories/programming-basics/for-loops/` · diagram shape: line

### Beat 1 — Walk a collection
![for-loops beat1 desktop](img/for-loops/beat1-d.png)
![for-loops beat1 mobile](img/for-loops/beat1-m.png)
The header reads `FOR LOOPS · ONCE PER ITEM` with an `IDEA 1 OF 7` pill, a `MAP` link, and `step 1/4 · WALK A COLLECTION`. A `BUILDS ON` strip carries one prereq pill, `While Loops`, with a dismiss × on the right. The canvas shows the caption "you have a list of things; do the same step to each one" above the monospace literal `[ 10, 20, 30 ]` and three boxes holding 10, 20, 30, none highlighted; to the right a `total` box reads 0. The main panel below reads "WALK A COLLECTION / Do something to every item." with body prose about collections and the fiddliness of a `while` counter. The why·code·recap chips and four progress dots (first filled) sit at the bottom; side nav shows `BACK` (left, dimmed) and a `›` with `SET UP THE WALK` (right). On mobile the panel stacks under the canvas and the right-arrow becomes a bottom `Set up the walk →` button with a `1 / 4` counter; the diagram text is scaled down. No interaction gate — advancing is by the next-step arrow.

### Beat 2 — First item
![for-loops beat2 desktop](img/for-loops/beat2-d.png)
![for-loops beat2 mobile](img/for-loops/beat2-m.png)
Header now reads `step 2/4 · FIRST ITEM`. The caption is "round 1: price = 10 → total = 0 + 10 = 10". In the box row the first item (10) is highlighted with an accent border and labelled `price` underneath; 20 and 30 are plain. The `total` box on the right is highlighted green at 10, and a faint arrow runs from the price box across to the total box. The main panel reads "FIRST ITEM / price = 10 → total = 10" with body text explaining the loop set `price` to the first item and ran `total = total + price`. Progress dots show the second dot filled. Side nav: `BACK` left, `› NEXT ITEM` right. Mobile mirrors this with the panel stacked below and a `Next item →` button, counter `2 / 4`. No interaction gate.

### Beat 3 — Each one in turn
![for-loops beat3 desktop](img/for-loops/beat3-d.png)
![for-loops beat3 mobile](img/for-loops/beat3-m.png)
Header reads `step 3/4 · EACH ONE IN TURN`. Before the gate clears, the caption reads "round 1 done: price = 10, total = 10 — the loop heads back to the top"; the first box (10) is highlighted as `price` and `total` is 10. Overlaid on the canvas is a `PREDICT` card asking "Round 1 is done — what happens to price when round 2 begins?" with three choices: "the loop refills it — just 20 now", "still 10 — my code must change it", and "it holds 10 and 20 now". This beat is gated (interaction type: wedge / predict gate). The right side nav shows a lock icon with `LOCKED`, and a hint "↑ TRY IT ON THE DIAGRAM TO CONTINUE" sits under the progress dots (third dot filled). Selecting the correct choice ("the loop refills it") clears the gate and reveals round 2 — the caption becomes "round 2: price = 20 → total = 10 + 20 = 30", the second box (20) highlights as `price`, and `total` updates to 30, which is the state the panel ("price = 20 → total = 30") describes. On mobile the same predict card renders over the canvas with the lock unrendered in the desktop side-rail position; the bottom bar shows `After the last →` and counter `3 / 4`. In the automated capture the mobile run stopped at this beat (reached 3 of 4), so beat 4 has no mobile shot — the predict gate held mobile here.

### Beat 4 — Out the other side
![for-loops beat4 desktop](img/for-loops/beat4-d.png)
Header reads `step 4/4 · OUT THE OTHER SIDE`. The caption reads "✓ used every item · total = 10 + 20 + 30 = 60"; all three boxes (10, 20, 30) render as past/dimmed with none highlighted, and the `total` box is highlighted green at 60. The main panel reads "OUT THE OTHER SIDE / total = 60" with body text noting that after the third item there is nothing left, the loop ends, and the start-an-accumulator-and-add-each-item pattern is named (the word "accumulator" is a linked Term). Progress dots show the fourth dot filled; side nav shows `BACK` left and `› FINISH` right. No mobile shot was captured for this beat.

### Code drawer
![for-loops code drawer desktop](img/for-loops/drawer-code-d.png)
The drawer opens on the right titled "THE CODE SO FAR" with an `OPTIONAL` tag and the note "algorithm.py · the lesson works without it". It shows numbered source lines: a comment "# A for loop runs its block once for each item i...", a blank line, `total = 0`, `for price in [10, 20, 30]:`, `total = total + price`, and `print(total)`. Lines 5 and 6 are highlighted with a `▸` gutter marker, corresponding to this beat's `codeLabels` (body, after). The drawer overlays the right portion of the canvas while the main panel stays visible beneath.
