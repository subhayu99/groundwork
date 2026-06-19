## constants
route: `/categories/programming-basics/constants/` · diagram shape: line

### Beat 1 — The fixed value
![constants beat1 desktop](img/constants/beat1-d.png)
![constants beat1 mobile](img/constants/beat1-m.png)

The header reads `CONSTANTS · A VALUE THAT WON'T CHANGE` with an `IDEA 3 OF 7` pill, a `step 1/4` counter, and the beat label `THE FIXED VALUE`. A `BUILDS ON` row carries a single prereq pill, `Variables`, with a close (×) control at the right. The diagram is a single box labeled `MAX_SCORE` holding the value `100`, under the idea caption "some values are settings that should never change mid-program". A stepper with − and + controls sits at the lower right of the canvas. The main panel below reads "A value that stays put." with body text about settings like maximum score, ticket price, and π. The why·code·recap chips appear under the panel above four progress dots (first dot filled). The right side nav shows a chevron labeled `LOCK IT IN`; the left shows `BACK`. This beat has no interaction; advancing uses the right nav.

### Beat 2 — Name it in CAPS
![constants beat2 desktop](img/constants/beat2-d.png)
![constants beat2 mobile](img/constants/beat2-m.png)

The counter reads `step 2/4`, label `NAME IT IN CAPS`. The diagram is the `MAX_SCORE` box holding `100`, now drawn active (highlighted outline) with an outline lock glyph above its top-right corner. The caption reads "MAX_SCORE = 100 · the ALL-CAPS name is the signal". The main panel title is `MAX_SCORE = 100`, with body text explaining the UPPER_CASE casing as a constant convention; the words "constant" and "convention" render as underlined inline Term links. The progress dots show the second dot filled. The right nav chevron is labeled `USE IT`. No interaction; advancing uses the right nav.

### Beat 3 — Use it anywhere
![constants beat3 desktop](img/constants/beat3-d.png)
![constants beat3 mobile](img/constants/beat3-m.png)

The counter reads `step 3/4`, label `USE IT ANYWHERE`. The diagram is now two boxes: `MAX_SCORE` holding `100` on the left and `percent` holding `70.0` on the right (the percent box is drawn active in a green/good tone), connected by a left-to-right arrow labeled `score / MAX_SCORE * 100`. The caption reads "percent = score / MAX_SCORE * 100 → 70.0". The main panel title is `percent = score / MAX_SCORE * 100`, with body text about a score of 70 out of a MAX_SCORE of 100; `score`, `70`, `MAX_SCORE`, and `100` are highlighted inline. The third progress dot is filled. The right nav chevron is labeled `THE PROMISE`. No interaction; advancing uses the right nav.

### Beat 4 — A promise, not a lock
![constants beat4 desktop](img/constants/beat4-d.png)
![constants beat4 mobile](img/constants/beat4-m.png)

The counter reads `step 4/4`, label `A PROMISE, NOT A LOCK`. This beat carries the lesson's one interaction, a wedge/predict gate, shown here in its initial pre-interaction state. The diagram shows the `MAX_SCORE` box holding `100` under the caption "further down the file, this line is about to run", and below it a faint line `MAX_SCORE = 50`. A PREDICT card poses "Further down the file, MAX_SCORE = 50 runs. What does Python do?" with three tappable choices: "refuses — raises an error", "runs it — MAX_SCORE is now 50", and "keeps 100 and ignores the 50". The right side nav reads `LOCKED` with a filled lock glyph rather than an advance chevron, and a prompt under the progress dots reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". Mechanically, the gate clears when the learner taps a prediction choice (the correct answer per the spec is "runs it — MAX_SCORE is now 50"); on reveal the caption changes to "nothing technically stops a reassignment — the CAPS name is a promise", the `MAX_SCORE = 50` line is shown crossed out with a × marker, and the action unlocks to `Done`. The main panel title is "Honest about Python." with body text that Python won't stop a later `MAX_SCORE = 50`. The fourth progress dot is filled. On mobile the canvas stacks above the panel, and the footer shows `4 / 4` with a `Back` control and a disabled `Finish ✓` button while the gate is unsatisfied, matching the desktop `LOCKED` state.

### Code drawer
![constants code drawer desktop](img/constants/drawer-code-d.png)

The drawer opens from the right titled `THE CODE SO FAR`, with an `OPTIONAL` tag and the note "algorithm.py · the lesson works without it". It shows numbered lines: a comment `# A constant is a value you promise won't change`, `MAX_SCORE = 100`, `score = 70`, `percent = score / MAX_SCORE * 100`, and `print(percent)`. Numeric literals (`100`, `70`) are syntax-highlighted, and the final line `print(percent)` is highlighted with a ▶ run-pointer marker, corresponding to beat 4's `print` code label. A close (×) control sits at the top right of the drawer.

Note: both desktop and mobile reached all 4 beats. Captures show each beat in its initial state; beat 4's predict gate is shown unanswered, so the post-reveal verdict and the completion ceremony after `Finish` are not pictured.
