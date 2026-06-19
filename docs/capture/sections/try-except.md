## try-except
route: `/categories/programming-basics/try-except/` · diagram shape: line

### Beat 1 — Code that can fail
![try-except beat1 desktop](img/try-except/beat1-d.png)
![try-except beat1 mobile](img/try-except/beat1-m.png)
The diagram is a branching flow: a top `try: / return a / b` box splits into two downward-arrow routes labeled "no error" (left, to an "it worked → returns 5.0" box) and "raises error" with a lightning glyph (right, to an "except ZeroDivisionError: → returns 0" box). On this beat both routes render neutral/unlit. The dim caption above reads "some lines can fail, and a failure crashes the whole program". The header shows "TRY / EXCEPT · CATCHING ERRORS", an "IDEA 6 OF 7" pill, "step 1/5", and the beat label "CODE THAT CAN FAIL"; a "BUILDS ON · Functions" prereq pill sits below. The main panel reads idea "CODE THAT CAN FAIL", title "When a line blows up.", with body prose about division by zero, missing files, and bad input crashing the program; "error" is an underlined Term. Below are the WHY? · CODE · RECAP chips and a row of 5 progress dots with the first filled. The right side nav reads "WRAP IT", left reads "BACK". No gate; advancing is by the side nav / Wrap it button. On mobile the diagram is scaled to a single column, the side-nav labels become bottom "Back" and "Wrap it" buttons, and a "1 / 5" counter sits between them.

### Beat 2 — try — attempt it
![try-except beat2 desktop](img/try-except/beat2-d.png)
![try-except beat2 mobile](img/try-except/beat2-m.png)
The same branching flow renders, with the `try: / return a / b` box now drawn with a brighter (highlighted) stroke than the two outcome boxes below it, which stay neutral. The caption reads "wrap the line that might fail inside try:". Header shows "step 2/5" and label "TRY — ATTEMPT IT". The main panel idea is "TRY — ATTEMPT IT", title "try: return a / b", body explaining that the risky line goes inside a `try:` block which Python attempts and, on failure, looks for a matching `except`. Progress dots show the second dot filled. Side nav: left "BACK", right "AND THE SAFETY NET". No gate; advance by side nav.

### Beat 3 — except — catch it
![try-except beat3 desktop](img/try-except/beat3-d.png)
![try-except beat3 mobile](img/try-except/beat3-m.png)
The same flow diagram, routes still unlit. Caption reads "if a matching error is raised, control jumps to except". Header shows "step 3/5" and label "EXCEPT — CATCH IT". The main panel idea is "EXCEPT — CATCH IT", title "except ZeroDivisionError:", body describing the `except` block as the safety net Python jumps to when `try` raises that error, returning `0` instead of crashing. The third progress dot is filled. Side nav: left "BACK", right "THE GOOD CASE". No gate; advance by side nav.

### Beat 4 — The happy path
![try-except beat4 desktop](img/try-except/beat4-d.png)
![try-except beat4 mobile](img/try-except/beat4-m.png)
This beat is gated by a predict gate. The flow diagram shifts up to make room for a "PREDICT" panel overlaid on the lower diagram area, asking "10 / 2 succeeds — what does the except block do on this run?" with three choice chips: "skipped entirely", "runs anyway, after", and "checks the result". The caption above the boxes reads "safe_divide(10, 2): 10 / 2 works, no error this run" and both routes are unlit before the prediction. Header shows "step 4/5" and label "THE HAPPY PATH". The main panel idea is "THE HAPPY PATH", title "safe_divide(10, 2) → 5.0", body explaining the `try` succeeds, returns `5.0`, and the `except` is "skipped completely". Below the WHY? · CODE · RECAP chips, the fourth progress dot is filled and a hint reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The right side nav reads "LOCKED" with a padlock icon. The gate clears when the learner taps a prediction choice on the diagram: that fires the interaction-done signal and reveals the lit "ok" route (the no-error path and the "it worked → returns 5.0" box light, caption updates to note "except skipped"), which unlocks the next-beat nav. On mobile the predict panel renders inside the scaled diagram with the same three chips, the "↑ TRY IT ON THE DIAGRAM TO CONTINUE" hint shows, and the bottom "Now break it →" button is disabled (dimmed) until the gate is cleared.

Mobile capture stopped at this beat (reached 4/5 versus desktop 5/5): the predict gate at Beat 4 was not cleared in the mobile run, so the locked next-beat control kept Beat 5 unreachable on mobile.

### Beat 5 — The caught error
![try-except beat5 desktop](img/try-except/beat5-d.png)
The flow diagram now lights the error route: the "raises error" arrow and the "except ZeroDivisionError: → returns 0" box render in the red/hard-difficulty tone with a glowing border, while the left "no error / it worked" box is dimmed. The caption reads "safe_divide(10, 0): 10 / 0 raises → jumps to except → returns 0". Header shows "step 5/5" and label "THE CAUGHT ERROR". The main panel idea is "THE CAUGHT ERROR", title "safe_divide(10, 0) → 0", body explaining that `10 / 0` raises `ZeroDivisionError`, control jumps to `except` which returns `0`, and the program "keeps running". The fifth progress dot is filled. Side nav: left "BACK", right "FINISH". No mobile shot exists for this beat (mobile did not reach it).

### Code drawer
![try-except code drawer desktop](img/try-except/drawer-code-d.png)
The drawer opens from the right edge over the Beat 5 scene, headed "THE CODE SO FAR" with a close (×) button. A sub-label reads "OPTIONAL · algorithm.py · the lesson works without it". It shows the Python source with line numbers: a comment "# try runs risky code; if it raises an error, ex…" (truncated at the drawer edge), then `def safe_divide(a, b):` with a `try: / return a / b` block, an `except ZeroDivisionError: / return 0` handler, and two calls `print(safe_divide(10, 2))` and `print(safe_divide(10, 0))`. Lines tied to the current beat are highlighted: line 7 (`return 0`) and line 10 (`print(safe_divide(10, 0))`) carry the active-line markers/highlight matching Beat 5's codeLabels.
