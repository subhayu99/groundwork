## variables
route: `/categories/programming-basics/variables/` · diagram shape: line

### Beat 1 — The need
![variables beat1 desktop](img/variables/beat1-d.png)
![variables beat1 mobile](img/variables/beat1-m.png)
The header reads VARIABLES · A LABELLED BOX with an "IDEA 1 OF 7" pill, a "step 1/5" marker, and the beat label THE NEED. The diagram canvas holds a single labelled box: the name `score` floats above an empty box showing `?`, under the caption "you need to remember a number to use later"; the box renders muted/inactive because no value is stored yet. The main panel "THE NEED" titled "Hold onto a value." explains a program needs a place to keep a value and get it back later, with the why · code · recap chip row and five progress dots (first dot active) below it. The side-nav shows BACK on the left and the action "Make a box" on the right, with a −/+ stepper in the canvas corner. Mobile stacks the diagram above the panel and shows a bottom bar with Back, a "1 / 5" counter, and a "Make a box →" button.

### Beat 2 — Create it
![variables beat2 desktop](img/variables/beat2-d.png)
![variables beat2 mobile](img/variables/beat2-m.png)
The marker reads "step 2/5 · CREATE IT" and the second progress dot is active. The same `score` box is now active (accent fill and outline) holding the value `0`, under the caption "score = 0 → the value 0 goes into the box named score". The main panel "CREATE IT" titled "score = 0" explains that writing the name, an `=`, then the value makes a box called `score` and puts `0` in it. There is no gated interaction on this beat: the right side-nav action reads "Now change it" and advances directly. Mobile mirrors this with the "2 / 5" counter and a "Now change it →" footer button.

### Beat 3 — Change it
![variables beat3 desktop](img/variables/beat3-d.png)
![variables beat3 mobile](img/variables/beat3-m.png)
The marker reads "step 3/5 · CHANGE IT" and the third progress dot is active. The `score` box now reads `10` under the caption "score = score + 10 → read 0, add 10, put 10 back", and below it a PREDICT panel asks "score held 0 a moment ago — where is that 0 now?" with three choice chips: "gone — replaced", "still under the 10", and "saved automatically". The interaction type is `wedge`: the beat is gated, so the right side-nav shows a lock icon labelled LOCKED and the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE" appears under the dots; this is the captured initial pre-interaction state. Selecting the correct choice ("gone — replaced") clears the gate and reveals the line "0 + 10 = 10 — the old 0 is gone" before the lesson allows advancing. The main panel "CHANGE IT" titled "score = score + 10" explains the right side is worked out first using the current value, then stored back. On mobile the "Use the value →" footer button renders dimmed/disabled with the same "↑ TRY IT ON THE DIAGRAM TO CONTINUE" hint.

### Beat 4 — Use it
![variables beat4 desktop](img/variables/beat4-d.png)
![variables beat4 mobile](img/variables/beat4-m.png)
The marker reads "step 4/5 · USE IT" and the fourth progress dot is active. The canvas shows two boxes: `score` holding `10` (inactive) on the left and `bonus` holding `20` (active) on the right, joined by a flow arrow labelled "× 2", under the caption "bonus = score * 2 → read score (10), make a new box". The main panel "USE IT" titled "bonus = score * 2" explains that `score` stands in for its value (10), so `score * 2` is 20, stored in a new box `bonus`. There is no gate on this beat; the right side-nav action reads "See it together". Mobile stacks the same content with a "4 / 5" counter and a "See it together →" footer button.

### Beat 5 — Put together
![variables beat5 desktop](img/variables/beat5-d.png)
![variables beat5 mobile](img/variables/beat5-m.png)
The marker reads "step 5/5 · PUT TOGETHER" and the fifth progress dot is active. The canvas shows three named boxes side by side — `score` = `10`, `bonus` = `20`, `name` = `Ada` — under the caption "three named boxes — the program's memory", with a line beneath reading "print(name, score, bonus) → Ada 10 20". The main panel "PUT TOGETHER" titled "The program's memory" notes each line made or changed a box and `print` reads them back out. This is the closing recap beat with no interaction; the right side-nav action reads FINISH, and mobile shows a matching "5 / 5" counter and "Finish" footer button.

### Code drawer
![variables code drawer desktop](img/variables/drawer-code-d.png)
Opening the code drawer (via the CODE chip) slides a panel in from the right titled "THE CODE SO FAR", tagged "OPTIONAL · algorithm.py · the lesson works without it". It shows the numbered Python source: a comment on line 1 ("# A variable is a name attached to a value. Stor…"), then `score = 0`, `score = score + 10`, `bonus = score * 2`, `name = "Ada"`, and `print(name, score, bonus)` on lines 3–7. The current line (line 7, the `print` call) is highlighted with a play-arrow marker in the gutter, and a close (×) control sits in the drawer's top-right corner.

_Capture note: desktop reached all 5 beats (5/5) and mobile reached all 5 beats (5/5). The captured sequence is the structured register (5 beats: need, create, update/change, use, recap); the spec's `types` beat ("Any kind of value") is intuitive-only and is cut for this register, so it was not in the captured run. Wedge beats are shown in their initial locked state because the dot-jump does not perform the interaction._
