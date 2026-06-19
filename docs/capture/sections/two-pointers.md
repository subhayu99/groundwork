## two-pointers
route: `/categories/algorithms/two-pointers/` · diagram shape: line

The re-capture reached all 5 of 5 beats on both desktop (1440) and mobile (390). The captured run renders the lesson at its default depth of five beats: the setup, the instinct (wedge), the derivation (wedge), the win, and the pattern. The top bar carries MAP, the diamond "TWO POINTERS · FIND A PAIR THAT SUMS TO 17" title, an "IDEA 3 OF 7" pill, a "step N/5" counter, and the current beat label. On the first beat a "BUILDS ON" strip beneath the bar holds a single prereq pill, "Arrays & Lists", with a close (x) control. The diagram is a single horizontal row of ten ascending number cards (1, 3, 5, 7, 9, 10, 12, 15, 18, 20) drawn on an SVG canvas with a floating "target = 17" tag above it. Each beat shows a main panel under the canvas with a small caption label, a bold title, and body prose, plus a "WHY? · CODE · RECAP" chip strip and a row of five progress dots. Side-nav labels ("BACK" left, an action label or "LOCKED" right) sit at the canvas edges on desktop; mobile collapses these into a bottom bar with "Back", an "N / 5" counter, and the action button. Wedge beats are shown in their initial, pre-interaction state because the dot-jump does not perform the interaction.

### Beat 1 — The setup

![two-pointers beat1 desktop](img/two-pointers/beat1-d.png)
![two-pointers beat1 mobile](img/two-pointers/beat1-m.png)

The canvas shows the ten-card row in ascending order with the "target = 17" tag centered above it and no pointer markers yet. The bar reads "step 1/5 · THE SETUP" and the "BUILDS ON" strip with the "Arrays & Lists" prereq pill sits beneath it. The main panel is labeled "THE SETUP" with the title "Ten cards on a table. Find the pair that adds up." and body text about ten ordered cards, a friend naming the total 17, and the question of how few cards must be touched. The "WHY? · CODE · RECAP" chips and five progress dots (first filled) appear below. On desktop the right side nav reads "I SEE THE SETUP" with a forward chevron and the left reads "BACK"; on mobile these collapse into a bottom bar showing "Back", "1 / 5", and an enabled "I see the setup →" button. There is no diagram interaction on this beat — advancing uses the next control.

### Beat 2 — The instinct

![two-pointers beat2 desktop](img/two-pointers/beat2-d.png)
![two-pointers beat2 mobile](img/two-pointers/beat2-m.png)

The row now shows the L marker pill under the first card (1) and the R marker pill under the last card (20), both cards highlighted. A line above the row reads "arr[L] + arr[R] = 1 + 20 = 21 (too big)" under the "target = 17" tag. Three clickable controls render below the row: "L → bigger", "↺ reset", and "R → smaller". On desktop a secondary note panel sits to the right reading "The instinct: too small → move which finger to grow the sum? Too big → which one to shrink it?". The main panel is labeled "THE INSTINCT" with the title "Two fingers. One at each end. Move them." and body text introducing L and R as the cards each finger points at. The interaction type is wedge: clicking a finger button (L → bigger or R → smaller) steps that pointer one card inward, updates the running sum and verdict, and fires the beat's completion. Shown pre-interaction here, the right side nav reads "LOCKED" (desktop) and the bottom "I see the pattern →" button is disabled (mobile), with the panel footer showing "↑ TRY IT ON THE DIAGRAM TO CONTINUE".

### Beat 3 — The derivation

![two-pointers beat3 desktop](img/two-pointers/beat3-d.png)
![two-pointers beat3 mobile](img/two-pointers/beat3-m.png)

The row again marks L on card 1 and R on card 20, with the line "arr[L] + arr[R] = 1 + 20 = 21 > 17 (too big)" below the cards. A PREDICT gate panel is drawn on the canvas asking "1 + 20 = 21 — too big. What did that one look prove?" with three pill choices: "only that this one pair fails", "every pair using the 20 is too big" (the correct one), and "every pair using the 1 is too big". On desktop a note panel on the right reads "Why it works: sorted is a promise the cards keep, so each comparison cuts a whole side, not one pair." The main panel is labeled "THE DERIVATION" with the title "Each move retires a whole row of pairs." The interaction type is wedge, driven by the prediction gate: tapping a choice fires completion and reveals the bracket over the row, the dimmed-out side, and the "R steps left" arrow — all hidden in this pre-interaction capture. The right side nav shows "LOCKED" (desktop) and the bottom button is disabled (mobile), with the footer reading "↑ TRY IT ON THE DIAGRAM TO CONTINUE".

### Beat 4 — The win

![two-pointers beat4 desktop](img/two-pointers/beat4-d.png)
![two-pointers beat4 mobile](img/two-pointers/beat4-m.png)

The canvas swaps the card row for two horizontal stat bars: a long red-outlined bar labeled "check every pair (brute force)" with the value 45, and a short green-outlined bar labeled "two fingers converging" with the value 9. A caption beneath reads "n = how many cards (here 10) · worst case is n−1 = 9 · this board finds it even sooner". The main panel is labeled "THE WIN" with the title "Forty-five pairs becomes nine comparisons." and body text explaining brute force takes up to n × (n − 1) / 2 = 45 while two fingers touch each card once (L only moves right, R only left) and meet in at most n − 1 = 9 steps. The right side nav action reads "NAME THE PATTERN". This beat has no interaction.

### Beat 5 — The pattern

![two-pointers beat5 desktop](img/two-pointers/beat5-d.png)
![two-pointers beat5 mobile](img/two-pointers/beat5-m.png)

The canvas dims all cards except 5 and 12 (the answer pair, indices 2 and 6), which render green with "✓" markers and small up-arrows pointing at them; the "target = 17" tag remains above the row. The main panel is labeled "THE PATTERN" with the title "Two Pointers." and body text saying to reach for it whenever a row has a direction (sorted order, symmetry, a one-way pattern) and one comparison can retire a whole side, listing signals: "sorted array + pair sum", "palindrome", "container with most water." The right side nav action reads "FINISH". This beat has no interaction.

### Code drawer

![two-pointers code drawer desktop](img/two-pointers/drawer-code-d.png)

The drawer opens from the right (captured over the beat-5 view), titled "THE CODE SO FAR" and subtitled "OPTIONAL · algorithm.py · the lesson works without it". It shows the Python source for `two_sum_sorted(arr: list[int], target: int)` with a docstring noting the array is assumed sorted ascending and that it walks two pointers, shrinking the search space by one position per step. The body sets `left = 0` and `right = len(arr) - 1`, then runs a `while left < right:` loop computing `s = arr[left] + arr[right]`, returning `(left, right)` on `s == target`, incrementing `left` when `s < target` (# move left), else decrementing `right` (# move right), and ends with `return None`. The `return (left, right)` and `return None` lines carry active-line markers. Below the code, a "PRACTICE · try these next" section lists one item, "Pair sum in a sorted list", tagged EASY with a forward arrow.
