## data-types
route: `/categories/programming-basics/data-types/` · diagram shape: line

### Beat 1 — Kinds of value
![data-types beat1 desktop](img/data-types/beat1-d.png)
![data-types beat1 mobile](img/data-types/beat1-m.png)
The diagram draws a row of four value boxes — `age` holding `7`, `price` holding `3.14`, `name` holding `"Ada"`, `is_adult` holding `False` — each with a type chip beneath it (`int`, `float`, `str`, `bool`). No box is highlighted on this beat; all four and their chips render in the muted tone. The caption above the row reads "a value isn't just a value — it's a kind of value". The top bar shows MAP, the diamond DATA TYPES · KINDS OF VALUE title, an "IDEA 3 OF 7" pill, and "step 1/5 · KINDS OF VALUE"; below it a "BUILDS ON" strip carries a "Variables" prereq pill with a close (x) control. The main panel under the diagram shows the "KINDS OF VALUE" label, the title "Not all values are alike.", body prose about each value carrying a type Python infers, then the why·code·recap chips and five progress dots (first filled). The right side nav reads "WHOLE NUMBERS" with a chevron; the left reads "BACK". On mobile the same four-box diagram, panel, and chips stack vertically, and a bottom action bar shows "Back", "1 / 5", and a "Whole numbers" forward button. No gate on this beat.

### Beat 2 — Numbers: int & float
![data-types beat2 desktop](img/data-types/beat2-d.png)
![data-types beat2 mobile](img/data-types/beat2-m.png)
The same four-box row renders, now with the `age = 7` box and its `int` chip highlighted in the accent tone. The caption reads "7 is an int (whole) · 3.14 is a float (has a decimal)". The main panel label is "NUMBERS: INT & FLOAT", title "age = 7 · price = 3.14", with body text explaining a whole number like `7` is an int and `3.14` with a decimal point is a float, the dot being the only spelling difference. Progress dots show the second dot filled. Side nav reads "BACK" (left) and "TEXT" (right). Mobile mirrors the layout with the bottom bar showing "Back", "2 / 5", and a "Text" forward button. No gate on this beat.

### Beat 3 — Text: str (gated, wedge / predict)
![data-types beat3 desktop](img/data-types/beat3-d.png)
![data-types beat3 mobile](img/data-types/beat3-m.png)
The four-box row renders with the `name` box (`"Ada"`) and its `str` chip highlighted. The caption reads `"Ada" is a str — the quotes are how Python knows it's text`. Overlaid on the diagram is a PREDICT gate panel asking 'Quotes make "Ada" text. So "7" — digits in quotes — is…' with three choice buttons: "still the number 7", "text — a string", and "an error". The main panel label is "TEXT: STR", title `name = "Ada"`, with body text about quotes delimiting text versus a bare name lookup. Below the progress dots (third filled) the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE" appears, and the right side nav shows "LOCKED" with a padlock icon. This beat is gated: the learner must pick a choice in the predict gate (correct answer "text — a string") before the lesson unlocks and the forward nav becomes available. On mobile the same gate overlays the diagram, the bottom bar reads "Back", "3 / 5", and the "True or False" forward button renders disabled/greyed with the same "TRY IT ON THE DIAGRAM TO CONTINUE" prompt. Mobile capture stopped at this beat (reached 3/5) — the predict gate was not cleared, so beats 4 and 5 were not reachable on mobile.

### Beat 4 — Yes / no: bool
![data-types beat4 desktop](img/data-types/beat4-d.png)
Desktop only (mobile blocked at the beat 3 gate). The four-box row renders with the `is_adult` box (`False`) and its `bool` chip highlighted in the accent tone. The caption reads `age >= 18 → False · a bool is the answer to a yes/no question`. The main panel label is "YES / NO: BOOL", title `is_adult = age >= 18`, with body text that a boolean is either True or False, comparisons produce them (`age >= 18` is False), and that is what an `if` checks. Progress dots show the fourth filled. Side nav reads "BACK" (left) and "SEE THEM TOGETHER" (right). No gate on this beat.

### Beat 5 — Four to start
![data-types beat5 desktop](img/data-types/beat5-d.png)
Desktop only (mobile blocked at the beat 3 gate). The four-box row renders with no single box highlighted; all four boxes and chips show in the resting tone. The caption reads `type(price) → <class 'float'> · the same value can be checked any time`. The main panel label is "FOUR TO START", title "int · float · str · bool", with body text that the four cover most early code and the type travels with the value, contrasting `3 + 4` adding to `7` with `"3" + "4"` joining to `"34"`. All five progress dots are filled, the last active. Side nav reads "BACK" (left) and "FINISH" (right). No gate on this beat.

### Code drawer
![data-types code drawer desktop](img/data-types/drawer-code-d.png)
The code drawer slides in from the right with header "THE CODE SO FAR" and a close (x) control. A sub-line reads "OPTIONAL  algorithm.py · the lesson works without it". The code panel shows numbered lines of `algorithm.py`: a comment "# Every value has a type. Python infers it from…", then `age = 7`, `price = 3.14`, `name = "Ada"`, `is_adult = age >= 18`, and a highlighted line 7 `print(type(price))`. The drawer overlays the right portion of the diagram while the main panel and progress dots stay visible beneath.
