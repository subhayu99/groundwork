## dp-1d
route: `/categories/algorithms/dp-1d/` · diagram shape: box

The captured run renders the lesson at the structured register, so 5 of the spec's 7 beats appear (the `obvious` and `general` beats are cut at this register). Both viewports reached all 5 beats. The header reads "DYNAMIC PROGRAMMING · WAYS TO CLIMB 8 STAIRS" with an "IDEA 1 OF 7" pill and a "step N/5 · <LABEL>" counter. The why·code·recap chip row and a 5-dot progress indicator sit under the main panel. Captures show each beat in its initial state, so wedge beats appear LOCKED, since the dot-jump does not perform the interaction.

### Beat 1 — The setup
![dp-1d beat1 desktop](img/dp-1d/beat1-d.png)
![dp-1d beat1 mobile](img/dp-1d/beat1-m.png)
The diagram is a staircase of 8 stacked treads labeled "step 1" (bottom) through "step 8" (top), each shifted right as it climbs, with a caption "8 steps · hop 1 or 2 at a time" and a sky-tinted "step 8" tread the arrow points to. A "BUILDS ON" prereq row shows pills "Arrays & Lists", "Hash Maps", and "Recursion" (dismissible via an X at right). The main panel is titled "How many ways to climb the stairs?" and states the 8-step setup with the 1/2/3-step counts. Side nav reads "BACK" (left, dimmed) and "THE NATURAL RULE" (right). The first progress dot is filled. No gate; the learner advances with the right nav. On mobile the staircase and panel stack, with a bottom bar showing "Back", "1 / 5", and a "The natural rule →" button.

### Beat 2 — The instinct
![dp-1d beat2 desktop](img/dp-1d/beat2-d.png)
![dp-1d beat2 mobile](img/dp-1d/beat2-m.png)
The diagram switches to a recursion tree for ways(6): circular nodes labeled with the call value (6 at top branching to 5 and 4, down through repeated 3s, 2s, and 1s), connected by edges, with the caption "naive: every circle is real work — many ask the same question". A "remember answers" toggle button sits below the tree, and on desktop a note card reads "The instinct: every sub-question has exactly one true answer. Computing it twice is pure waste, so write it down once." The main panel is titled "Solve each question once. Look it up after." This beat is gated (interaction "wedge"): the right nav shows "LOCKED" and the footer prompt reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". Clicking "remember answers" fires the interaction-done signal — repeat calls recolor green and the caption updates to report how many calls are looked up versus the reduced real-work count, which clears the gate. Shown pre-interaction, so the tree is in its naive (uncolored) state.

### Beat 3 — The derivation
![dp-1d beat3 desktop](img/dp-1d/beat3-d.png)
![dp-1d beat3 mobile](img/dp-1d/beat3-m.png)
The diagram is a 9-cell dp row: the first two cells hold "1" (green-bordered, marked "dp0" and "dp1" below), the remaining seven hold "·". A green bracket above the first two cells is labeled "the two base values", and an arrow drops into it. The main panel is titled "Two flavours, same answer." and describes the top-down notebook build versus the bottom-up table build, ending with the rolling-pair code (a, b = 1, 1 then a, b = b, a + b). Side nav reads "BACK" and "COUNT THE WORK". The third progress dot is filled. No gate; advance with the right nav.

### Beat 4 — The operations
![dp-1d beat4 desktop](img/dp-1d/beat4-d.png)
![dp-1d beat4 mobile](img/dp-1d/beat4-m.png)
The diagram shows the dp row with dp0 and dp1 filled (1, 1) and the rest as "·", caption "naive ways(8) burned 67 calls — now price the write-it-down way", with an arrow pointing down into the row. A PREDICT card is hosted below the row asking "Seven empty slots, each needing just the two answers before it — how much work to fill them all?" with three choices: "it still explodes — the repeats sneak back", "about half of the 67 calls", and "one addition per slot" (the correct option). The main panel is titled "From exponential to one quick pass." and explains the O(n) time / O(1) space result, with tappable "O(n)" and "O(1)" term chips. This beat is gated (interaction "wedge", predict gate): the right nav shows "LOCKED" and the footer reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". Picking a choice reveals its note, then after a pause the row auto-fills slot by slot (AutoTabulate) to answer the prediction, which clears the gate. Shown pre-interaction, so the gate sits unanswered with the row still at dp0/dp1.

### Beat 5 — The pattern
![dp-1d beat5 desktop](img/dp-1d/beat5-d.png)
![dp-1d beat5 mobile](img/dp-1d/beat5-m.png)
The diagram is the fully filled dp row: 1, 1, 2, 3, 5, 8, 13, 21, 34, every cell green-bordered, with a green checkmark marker under the last cell and the caption "the whole table, computed in one pass · dp[8] = 34"; an arrow points down at the final "34" cell. A note card at top-right reads "Spot it on number of ways / minimum cost / maximum value problems where naive recursion explodes from repeated calls, and a greedy grab-the-best step gives the wrong answer." The main panel is titled "Dynamic Programming." and gives the plain-language definition (solve overlapping sub-questions once, write them down, look them up). Side nav reads "BACK" and "FINISH". The fifth (final) progress dot is filled. No gate; the right nav presents "FINISH".

### Code drawer
![dp-1d code drawer desktop](img/dp-1d/drawer-code-d.png)
The drawer opens from the right titled "THE CODE SO FAR", tagged "OPTIONAL · algorithm.py · the lesson works without it". It shows the Python source for `def ways_to_climb(n: int) -> int:` with a docstring spelling out the recurrence (ways(n) = ways(n-1) + ways(n-2), ways(0)=1, ways(1)=1), the tabulation comment, the base check `if n <= 1: return 1`, the rolling-pair loop (`a, b = 1, 1`; `for _ in range(2, n + 1): a, b = b, a + b`; `return b`), and a commented-out memoization variant referencing `from functools import lru_cache` / `@lru_cache(maxsize=None)`. Line 18 (`return b`) is highlighted as the active line. The main panel and dp row stay visible behind the drawer.
