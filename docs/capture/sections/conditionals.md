## conditionals
route: `/categories/programming-basics/conditionals/` · diagram shape: line

### Beat 1 — The choice
![conditionals beat1 desktop](img/conditionals/beat1-d.png)
![conditionals beat1 mobile](img/conditionals/beat1-m.png)
The canvas draws the if/elif/else ladder: a `score = 72` chip sits at the top, and three condition rows (`score >= 90`, `score >= 60`, `else`) each point through an arrow to an output box (`grade = "A"`, `grade = "B"`, `grade = "F"`). All rows render idle (greyed at half opacity) with no verdicts shown. The top bar reads "IF / ELSE · CHOOSING A PATH", an "IDEA 2 OF 7" pill, "step 1/5", and the beat label "THE CHOICE". Below the bar a "BUILDS ON" strip shows prereq pills "Variables" and "Operators" (dismissable via an x). The main panel below the canvas is captioned "THE CHOICE" with the title "Turn a score into a grade." and body text about code that does the same thing every time, ending on "choose". The why?·code·recap chips sit above five progress dots (first filled). Left nav is "BACK"; right nav is "ASK A QUESTION". This beat has no gate. On mobile the same ladder, panel, and prereq strip stack vertically with a bottom footer showing "back", "1 / 5", and an "Ask a question" button.

### Beat 2 — if: the first test
![conditionals beat2 desktop](img/conditionals/beat2-d.png)
The ladder now evaluates the first row: `score >= 90` is outlined red with a "False" verdict label beneath it, and a "no ↓" marker drops to the next row. Rows 2 and 3 stay idle/greyed. A caption under the ladder reads "72 >= 90 ? → False, so the A block is skipped". The panel is captioned "IF: THE FIRST TEST", titled "if score >= 90:", with body text defining an if as a yes/no condition and noting the indented `grade = "A"` never runs (with linked Terms for "if", "condition", "indented"). Progress dots show the second filled. Right nav reads "IT FAILED. NOW WHAT…". This beat has no gate.

### Beat 3 — elif: the next test
![conditionals beat3 desktop](img/conditionals/beat3-d.png)
![conditionals beat3 mobile](img/conditionals/beat3-m.png)
This beat is gated by a prediction wedge. The ladder shows row 1 (`score >= 90`) red with "False" and the "no ↓" drop; rows below stay idle and the `score = 72` chip is hidden in the pre-reveal state so the gate fits the band. A PREDICT panel overlays the lower canvas asking "72 >= 60 is about to pass, so grade = "B" runs. What happens to the else row below?" with three choice chips: "skipped, unread", "still checked", "else runs too". The correct choice is "skipped, unread"; selecting a choice shows its note, then after a pause the visual reveals (`score = 72` chip returns, row 2 turns accent/True, and the caption becomes "72 >= 60 ? → True, so grade = B (and we stop checking)"). The panel is captioned "ELIF: THE NEXT TEST", titled "elif score >= 60:". Until the gate is answered the right nav shows a "LOCKED" lock icon and the footer prompts "↑ TRY IT ON THE DIAGRAM TO CONTINUE". Progress dots show the third filled. On mobile the ladder and the PREDICT overlay render inside the canvas; the footer shows "back", "3 / 5", and a greyed "And if all fail? →" next button, confirming the gate blocks advance until a prediction is made.

### Beat 4 — else: the fallback
![conditionals beat4 desktop](img/conditionals/beat4-d.png)
The ladder now shows the resolved state: row 1 `score >= 90` red with "False", row 2 `score >= 60` accent with "True" and its `grade = "B"` output box highlighted accent, and row 3 `else` greyed with a "skipped" verdict. Caption reads "else is skipped here — but it would catch a score like 40 → F". The panel is captioned "ELSE: THE FALLBACK", titled "else:", with body explaining else has no condition and runs only when every if/elif above was False, and that 72 already matched B so else is skipped. Progress dots show the fourth filled. Right nav reads "SEE IT WHOLE". This beat has no gate.

### Beat 5 — Exactly one path
![conditionals beat5 desktop](img/conditionals/beat5-d.png)
The final ladder repeats the resolved state — row 1 red "False", row 2 accent "True" with the `grade = "B"` box highlighted, row 3 `else` greyed "skipped" — with the caption "✓ exactly one branch runs · grade = B". The panel is captioned "EXACTLY ONE PATH", titled "One question, one answer.", with body describing the if/elif/else chain as a single decision: Python walks tests top to bottom, runs the first True block, exactly one runs, then continues with `print`. Progress dots show the fifth (final) filled. Right nav reads "FINISH". This beat has no gate.

### Code drawer
![conditionals code drawer desktop](img/conditionals/drawer-code-d.png)
The drawer slides in from the right, headed "THE CODE SO FAR" with a close x and an "OPTIONAL · algorithm.py · the lesson works without it" subline. It shows the full Python source numbered lines 1–10: a `# if / elif / else` comment, `score = 72`, the `if score >= 90:` / `grade = "A"` block, `elif score >= 60:` / `grade = "B"`, `else:` / `grade = "F"`, and `print(grade)` on line 10 with a current-line marker (`▸`) highlighting it (captured on the final beat, where the recap maps to `print`).
