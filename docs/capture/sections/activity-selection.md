## activity-selection

route: `/categories/algorithms/activity-selection/` · diagram shape: line

The gallery renders this lesson at five beats (setup, instinct, derivation, operations, pattern); the spec's `obvious` and `general` beats are not present in this register. The header reads `ACTIVITY SELECTION · FIT THE MOST MEETINGS`, carries an `IDEA 7 OF 7` pill, and shows a `step N/5 · <LABEL>` counter. A `MAP` link sits top-left, and on desktop a left-rail `BACK` control plus a right-rail action label (with chevron) flank the diagram. The diagram is a horizontal-bar timeline: seven meeting bars (stand-up, design sync, lunch&learn, 1:1, review, all-hands, retro), one per row, laid on a 9→17 hour axis, each bar spanning its start-to-end hours with the range printed inside. A small zoom control (− / +) sits at the bottom-right of the canvas.

### Beat 1 — The setup

![activity-selection beat1 desktop](img/activity-selection/beat1-d.png)
![activity-selection beat1 mobile](img/activity-selection/beat1-m.png)

All seven meetings render as idle (gray) bars in real timeline positions, with a vertical line and downward arrowhead dropping into the tangled 11–14 region where bars overlap. A `BUILDS ON` row under the header carries an `Arrays & Lists` prereq pill. The main panel is captioned `THE SETUP`, titled "One room. Seven people want it. Fit the most.", and explains that two meetings can share the room only if they don't overlap, with touching edges allowed (one ends at 11, the next starts at 11) but 10–12 beside 11–14 clashing. Interaction type is none; the right-rail action reads "How would you decide?". Below the body, `WHY? · CODE · RECAP` chips sit above five progress dots with the first filled. On mobile the diagram sits above the prose, and a bottom bar shows `Back`, the `1 / 5` step counter, and the "How would you decide? →" action button.

### Beat 2 — The instinct

![activity-selection beat2 desktop](img/activity-selection/beat2-d.png)
![activity-selection beat2 mobile](img/activity-selection/beat2-m.png)

This is the wedge beat, captured in its initial pre-interaction state (the dot-jump does not perform the interaction, so the right rail reads `LOCKED` with a padlock icon). The bars are still in original order, and a blue `sort by end →` button sits below the axis with the caption "step 1 — press 'sort by end'". A top-right note reads "The instinct: the dashed line marks when the room next opens. Freeing it soonest rules out the least." The main panel, captioned `THE INSTINCT` and titled "Sort by end time; take the one that frees the room soonest.", describes pressing sort to reorder by earliest finish, then stepping through to keep a meeting only if it starts at or after the last kept one ended. Mechanically: tap "sort by end" (reorders the bars and fires onInteractionDone), then tap "step" to walk the list one meeting at a time, accepting (green) or skipping (red) each as a dashed "free at" line slides right, with a "↺ reset" to start over. The beat is gated by that interaction; a `↑ TRY IT ON THE DIAGRAM TO CONTINUE` hint sits under the dots (second dot active).

### Beat 3 — The derivation

![activity-selection beat3 desktop](img/activity-selection/beat3-d.png)
![activity-selection beat3 mobile](img/activity-selection/beat3-m.png)

The diagram collapses to the first two sorted meetings: stand-up (9–11) drawn green/accepted with a dashed "free at" line at hour 11, and design sync (10–12) drawn active/blue and visibly crossing that line. The caption reads "sorted by end — the walk's first real decision". A `PREDICT` panel is hosted on the canvas asking "stand-up is kept — the room is busy until it ends at 11. design sync runs 10–12. What happens to it?" with three choice pills: "skipped — it starts before the room is free", "kept — it's next on the list", and "it replaces stand-up". The interaction is a single tap on a prediction pill, which fires onInteractionDone; the correct answer is "skipped", and after a short reading pause the auto-playback greedy walk runs to answer it. Captured pre-interaction, the right rail reads `LOCKED` and the `↑ TRY IT ON THE DIAGRAM TO CONTINUE` hint shows. A top-right note reads "Why it wins: swap our first pick for any other; ours frees the room no later, so the swap never loses a meeting." The main panel ("Sort once. Walk once. Track when the room is free.") describes keeping one number, `last_end`, starting at minus infinity. Mobile stacks the diagram and predict panel above the prose with the `3 / 5` counter and a "Count the work →" action.

### Beat 4 — The operations

![activity-selection beat4 desktop](img/activity-selection/beat4-d.png)
![activity-selection beat4 mobile](img/activity-selection/beat4-m.png)

The diagram shows the final solved state: kept meetings (stand-up, lunch&learn, review, retro) outlined green and skipped meetings (design sync, 1:1, all-hands) outlined red, with a dashed "free at 17" line at the right edge and a downward arrow above the timeline. Interaction type is none; the right-rail action reads "NAME THE PATTERN". The main panel, captioned `THE OPERATIONS` and titled "Sort once, then one clean pass.", counts the work: one check per meeting (`O(n)`) and the sort costing about ten thousand comparisons for a thousand meetings (`O(n log n)`), concluding the sort is the whole bill while the walk rides along. Below the body, `WHY? · CODE · RECAP` chips sit above the five dots with the fourth filled.

### Beat 5 — The pattern

![activity-selection beat5 desktop](img/activity-selection/beat5-d.png)
![activity-selection beat5 mobile](img/activity-selection/beat5-m.png)

The diagram repeats the final accepted/rejected set (green kept bars, red skipped bars), with an arrow drawn from a top-right note down to the retro (16–17) bar. The note reads "The result: the green bars are greedy's clash-free set, the most meetings one room can hold." Interaction type is none; the right-rail action reads "FINISH". The main panel, captioned `THE PATTERN` and titled "Greedy.", names the move, states the hard part is knowing greed is allowed (the swap test), lists the signals ("fit the most non-overlapping things", "minimum X to cover all Y"), and points to the `</> code` tab. The five progress dots show the last one filled.

### Code drawer

![activity-selection code drawer desktop](img/activity-selection/drawer-code-d.png)

The code drawer slides in from the right over the lesson, headed "THE CODE SO FAR" with an `OPTIONAL algorithm.py · the lesson works without it` subline and a close (×) button. It shows the Python `fit_meetings(meetings: list[tuple[int, int]])` function: a docstring, `by_end = sorted(meetings, key=lambda m: m[1])`, a `chosen` list and `last_end = float("-inf")` initialization, the `for start, end in by_end:` loop with the `if start >= last_end:` check that appends `(start, end)` and updates `last_end = end`, then `return chosen`. Lines are numbered 1–28, with several highlighted (the sort line and loop body), and a trailing comment block (lines 21–28) explaining why the earliest-ending pick is safe and noting that greedy fails on coins {1, 3, 4} for target 6. The drawer is captured over the Beat 5 ("THE PATTERN") state, with the solved timeline visible behind it on the left.
