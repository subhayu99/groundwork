## functions
route: `/categories/programming-basics/functions/` · diagram shape: line

### Beat 1 — Name a set of steps

![functions beat1 desktop](img/functions/beat1-d.png)
![functions beat1 mobile](img/functions/beat1-m.png)

The diagram draws the function-as-machine: two stacked input chips labeled `width` and `height` on the left, arrows feeding into a rounded box that reads `area(width, height)` / `return` / `width * height`, and an arrow out to a `?` box on the right. The caption above reads "the same calculation, needed in many places". The header bar shows MAP, the diamond FUNCTIONS title with "INPUTS IN, ANSWER OUT", an "IDEA 4 OF 7" pill, and "step 1/5 · NAME A SET OF STEPS". A "BUILDS ON" row carries an "If / Else" prereq pill with a close (X). The main panel below the canvas shows the eyebrow label "NAME A SET OF STEPS", the title "Bottle up a calculation.", and body text about copy-pasting `width * height` being error-prone, with `function` linked as a term. Under it sit the WHY? · CODE · RECAP chips and five progress dots (first filled). The side nav reads "BACK" (left) and "DEFINE IT" (right). No gate; the learner advances with DEFINE IT. On mobile the canvas and panel stack vertically, the prereq pill stays in the BUILDS ON row, and a bottom bar shows Back, "1 / 5", and a "Define it" button.

### Beat 2 — def — the recipe

![functions beat2 desktop](img/functions/beat2-d.png)
![functions beat2 mobile](img/functions/beat2-m.png)

The same machine diagram renders, still with `width`/`height` inputs and an unlit `?` output. The caption reads "def area(width, height): return width * height · not run yet". Header shows "step 2/5 · DEF — THE RECIPE". The main panel title is "def area(width, height):" with body explaining `def` defines a function, `width` and `height` are `parameters` (named blanks), the indented body is the recipe, and nothing runs yet. Progress dots show the second dot filled. Side nav reads "BACK" and "PRESS THE BUTTON". No gate; advancing is a click on the right nav. Mobile stacks canvas over panel with the bottom Back / "2 / 5" / next bar.

### Beat 3 — call — fill the blanks

![functions beat3 desktop](img/functions/beat3-d.png)
![functions beat3 mobile](img/functions/beat3-m.png)

The machine is lit: the input chips now read `4` and `3`, the central machine box is highlighted with the accent fill/stroke, and the output box on the right shows `12` in the green "good" tone. The caption reads "area(4, 3): width = 4, height = 3 → returns 12". Header shows "step 3/5 · CALL — FILL THE BLANKS". The main panel title is "room = area(4, 3)" and the body explains writing `area(4, 3)` calls it, `4` fills `width`, `3` fills `height` (the `arguments`), the body runs, `return` hands back `12`, and the value lands in `room`. Third progress dot filled. Side nav reads "BACK" and "USE IT AGAIN". No gate; advance via the right nav.

### Beat 4 — Reuse it

![functions beat4 desktop](img/functions/beat4-d.png)
![functions beat4 mobile](img/functions/beat4-m.png)

This beat is gated (wedge / predict gate). The diagram shows the machine with inputs `10` and `2` and an unlit `?` output; the caption reads "the hall is 10 by 2 — and the machine is already built". A PREDICT panel is overlaid on the canvas with the question "The hall is 10 by 2 — how does the program get its area?" and three choice chips: "write width * height again", "call area(10, 2)", and "change the def line to 10 and 2". Header shows "step 4/5 · REUSE IT". The right side nav reads "LOCKED" with a lock icon, and the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE" sits under the progress dots (fourth dot filled). The main panel title is "hall = area(10, 2) → 20" with body about calling again with different arguments to get `20` from the same definition. The gate clears when the learner picks the correct choice ("call area(10, 2)"); on reveal the caption changes to "area(10, 2) → 20 · one definition, any inputs", the machine lights and the output box shows `20`, which unlocks the next nav. On mobile the PREDICT panel renders inside the canvas the same way, the bottom "Sum up" button is shown disabled, and the "TRY IT ON THE DIAGRAM TO CONTINUE" prompt appears; this gate is where the mobile run stopped (mobile reached 4 of 5 beats).

### Beat 5 — Inputs in, answer out

![functions beat5 desktop](img/functions/beat5-d.png)

The diagram returns to the generic machine with `width`/`height` inputs and an unlit `?` output. The caption reads "one definition, called many times: room = 12, hall = 20". Header shows "step 5/5 · INPUTS IN, ANSWER OUT". The main panel title is "Define once, call anywhere." with body that a function is a named machine — arguments in, body runs, a value back via `return` — turning "a block of steps" into "one word you can reuse." Fifth (last) progress dot filled. Side nav reads "BACK" and "FINISH". No mobile shot exists for this beat because the mobile run stopped at the beat 4 gate.

### Code drawer

![functions code drawer desktop](img/functions/drawer-code-d.png)

The drawer slides in from the right titled "THE CODE SO FAR", tagged "OPTIONAL · algorithm.py · the lesson works without it", with a close (X). It shows the eight-line Python source with line numbers: a comment on line 1 ("# A function packages steps under a name: take i…", clipped at the drawer edge), `def area(width, height):` / `return width * height`, then `room = area(4, 3)`, `hall = area(10, 2)`, and `print(room, hall)`. Line 8 (`print(room, hall)`) is highlighted with a left arrow marker as the current line. The underlying canvas (machine diagram, caption, panel) stays visible to the left while the drawer is open.
