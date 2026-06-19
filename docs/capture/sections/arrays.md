## arrays
route: `/categories/data-structures/arrays/` · diagram shape: line

The runtime exposes 5 reachable beats (the header reads "step 1/5" through "step 5/5"). The lesson spec defines 7 beats, but two of them (`pile` "The obvious thing" and `fit` "When it fits") carry `trimOnRefresh: true` and were trimmed out, leaving the reachable sequence: setup, wedge, structure, operations, name. Desktop reached all 5; mobile reached 4 (the predict gate on beat 4 was not cleared, so it stopped there).

### Beat 1 — The setup
![arrays beat1 desktop](img/arrays/beat1-d.png)
![arrays beat1 mobile](img/arrays/beat1-m.png)

The diagram is a single horizontal row of ten same-size cells holding the values 3, 1, 4, 1, 5, 9, 2, 6, 5, 3; the cell at index 6 (value 2) is highlighted in an active blue tone with a vertical arrow pointing down into it. Top bar shows the "MAP" link, "ARRAYS · REACH ANY SLOT IN ONE STEP", an "IDEA 5 OF 7" pill, "step 1/5", and the beat label "THE SETUP". A "BUILDS ON" strip below the bar shows a prereq pill "For Loops". The main panel below the diagram is labeled "THE SETUP" with the title "A thousand books. Find the 487th." and body text about reaching book number 487 by its position. The why · code · recap chips sit under the panel above five progress dots (first dot filled). The right side nav reads "I HAVE THE QUESTION" with a forward chevron; the left reads "BACK". No interaction gate — clicking the forward control advances. On mobile the layout stacks vertically with the diagram in a card and a bottom bar showing "Back", "1 / 5", and "I have the question".

### Beat 2 — The instinct
![arrays beat2 desktop](img/arrays/beat2-d.png)
![arrays beat2 mobile](img/arrays/beat2-m.png)

The diagram is the ten-cell row with index 0 (value 3) outlined in a green "good" tone and a "↑ here" marker beneath it; an index strip 0–9 runs below the cells, with the selected index drawn in accent ink. A caption above the row reads "click any slot — you land on it in one step, no counting". The main panel is labeled "THE INSTINCT", titled "Give every position a fixed home.", with body text introducing slot 0…999 and the term index. A secondary note panel on the right reads "The instinct: what changed about the books? Nothing. What changed about the arrangement?" This beat is a wedge gate (`interaction: "wedge"`): the right side nav shows a lock icon labeled "LOCKED" and the footer reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The learner clicks any slot; the clicked cell turns green, the marker and index strip move to it, the caption updates to show `arr[i]` with the `base + i × size · 1 jump` text, and the gate fires `onInteractionDone`, unlocking the advance ("Storage decides speed"). Mobile shows the same gated state at step 2/5 with a dimmed "Storage decides speed" button and the "TRY IT ON THE DIAGRAM TO CONTINUE" prompt.

### Beat 3 — The structure
![arrays beat3 desktop](img/arrays/beat3-d.png)
![arrays beat3 mobile](img/arrays/beat3-m.png)

The diagram is the memory ruler: the ten-cell row with index 6 (value 2) highlighted green and an address-offset label under every cell — "base" under index 0, then "+1·sz", "+2·sz" … "+9·sz". A vertical arrow points down into the highlighted cell, and a green line below reads "slot 6's spot = base + 6 × size — same one step for a row of a million". The main panel is labeled "THE STRUCTURE", titled "Same-size slots, packed side by side.", explaining the `base + i × size` address arithmetic and the term constant time. The why · code · recap chips and five progress dots (third filled) sit below. Right nav reads "WHAT OPERATIONS COS…" (truncated) with a forward chevron; left reads "BACK". No interaction gate — this is a static visual that advances on click.

### Beat 4 — The operations
![arrays beat4 desktop](img/arrays/beat4-d.png)
![arrays beat4 mobile](img/arrays/beat4-m.png)

The diagram is the insert-cost predict gate. An eight-cell row (3, 1, 4, 5, 9, 2, 6, 5) is shown with index 3 (value 5) highlighted active and a "↓ 8 goes here" marker beneath it; a caption above reads "a new value, 8, needs slot 3 — and the slots are all taken". A PREDICT panel is hosted on the canvas with the question "A new value needs slot 3 — what happens to the cells after it?" and three choice pills: "nothing — they stay put", "every later cell shifts right", and "only the last cell moves". A right note panel reads "Append at the end is O(1) too, on average. Once in a while the shelf is full and the books are copied to a bigger one." The main panel is labeled "THE OPERATIONS", titled "Cheap reads, costly middle-edits.", explaining O(1) reads versus O(n) middle inserts. This beat is a predict gate (`interaction: "wedge"`): the right side nav shows a lock icon labeled "LOCKED" and the footer reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The learner taps a choice; the gate marks the correct answer ("every later cell shifts right"), shows feedback, then after a reading pause auto-plays the AutoInsert animation in which the tail shifts right one cell at a time (muted tone) and the new value 8 lands in slot 3 (green), with a step counter and a "↺ replay" button. Clearing the gate unlocks the advance ("Name the structure"). On mobile this is the last reached beat (step 4/5): the predict panel is visible but the gate was not cleared, so the "Name the structure" button at the bottom remains dimmed and the "TRY IT ON THE DIAGRAM TO CONTINUE" prompt is shown. Mobile did not reach beat 5.

### Beat 5 — The pattern
![arrays beat5 desktop](img/arrays/beat5-d.png)

The diagram returns to the full ten-cell row with index 6 (value 2) highlighted green and an `arr[i]` marker beneath it, with the vertical arrow pointing into it. The main panel is labeled "THE PATTERN", titled "Array. List, in Python.", with body text naming the structure, the term dynamic array, and the `base + i × size` jump tying back to idea 5 of 7. The why · code · recap chips sit above the five progress dots (fifth filled). The right side nav reads "FINISH" with a forward chevron; the left reads "BACK". No interaction gate. No mobile capture exists for this beat.

### Code drawer
![arrays code drawer desktop](img/arrays/drawer-code-d.png)

Opening the Code panel slides in a right-hand drawer titled "THE CODE SO FAR", with a sub-label "OPTIONAL  algorithm.py · the lesson works without it". It shows numbered Python source for `books: list[str]` with six commented operations: indexed access `books[2]` (O(1)), `books.append("Frame")` (O(1) amortized), `books.insert(2, "Bridge")` (O(n)), `del books[1]` (O(n)), iteration with `for i, title in enumerate(books)`, and `n = len(books)` (O(1)). Two lines (the `books` declaration on line 3 and `n = len(books)` on line 22) are highlighted with a left-edge marker. Below the code a "PRACTICE · try these next" section lists "Move Zeroes" tagged "EASY" with a forward arrow. The drawer has a close (×) control top-right. This drawer was captured on beat 5 (step 5/5). The captured final beat (beat 5, "The pattern") does not show a completion ceremony screen in the desktop shot.
