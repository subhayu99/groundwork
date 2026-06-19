## variables
route: `/categories/programming-basics/variables/` · diagram shape: line

### Beat 1 — The need
![variables beat1 desktop](img/variables/beat1-d.png)
![variables beat1 mobile](img/variables/beat1-m.png)
The header reads VARIABLES · A LABELLED BOX with an "IDEA 1 OF 7" pill, "step 1/5", and the beat label THE NEED. The diagram canvas holds a single labelled box: the name `score` floats above an empty box showing `?`, under the caption "you need to remember a number to use later". The main panel is titled "Hold onto a value." with body text about needing a place to keep a value and get it back later, and the why · code · recap chip row plus five progress dots (first filled) sit below it. Side nav shows BACK on the left and the action MAKE A BOX on the right; a −/+ stepper sits in the canvas corner. Mobile stacks the same content vertically with a "1 / 5" counter and a "Make a box →" button in the footer; the diagram caption and box render faintly at reduced size.

### Beat 2 — Create it
![variables beat2 desktop](img/variables/beat2-d.png)
![variables beat2 mobile](img/variables/beat2-m.png)
Step counter reads "step 2/5", label CREATE IT, second progress dot filled. The same `score` box is now active (accent fill and outline) holding the value `0`, under the caption "score = 0 → the value 0 goes into the box named score". The main panel title is "score = 0" with body explaining that writing the name, an `=`, then the value makes a box and puts `0` in it. There is no gate on this beat: the right nav action reads NOW CHANGE IT and advances directly. Mobile mirrors this with the "2 / 5" counter and a "Now change it →" footer button.

### Beat 3 — Change it (predict gate)
![variables beat3 desktop](img/variables/beat3-d.png)
![variables beat3 mobile](img/variables/beat3-m.png)
Step counter reads "step 3/5", label CHANGE IT, third progress dot filled. The `score` box now reads `10` under the caption "score = score + 10 → read 0, add 10, put 10 back". Below the box a PREDICT panel asks "score held 0 a moment ago — where is that 0 now?" with three choice chips: "gone — replaced", "still under the 10", and "saved automatically". This beat is gated (interaction type: wedge / predict gate): the right side nav shows a lock icon labelled LOCKED, and the prompt "↑ TRY IT ON THE DIAGRAM TO CONTINUE" appears under the progress dots. Selecting the correct choice ("gone — replaced") clears the gate and reveals the line "0 + 10 = 10 — the old 0 is gone". On mobile the gate behaves the same way: the footer "Use the value →" button renders dimmed/disabled with the same "↑ TRY IT ON THE DIAGRAM TO CONTINUE" hint, and the mobile capture stopped at this beat because the predict gate was not cleared.

### Beat 4 — Use it (desktop only)
![variables beat4 desktop](img/variables/beat4-d.png)
Step counter reads "step 4/5", label USE IT, fourth progress dot filled. The canvas now shows two boxes: `score` holding `10` (inactive) on the left and `bonus` holding `20` (active) on the right, joined by a flow arrow labelled "× 2", under the caption "bonus = score * 2 → read score (10), make a new box". The main panel title is "bonus = score * 2" with body explaining that `score` stands in for its value (10), so `score * 2` is 20, stored in a new box `bonus`. No gate on this beat; the right nav action reads SEE IT TOGETHER. Mobile did not reach this beat.

### Beat 5 — Put together (desktop only)
![variables beat5 desktop](img/variables/beat5-d.png)
Step counter reads "step 5/5", label PUT TOGETHER, fifth progress dot filled. The canvas shows three named boxes side by side — `score` = `10`, `bonus` = `20`, `name` = `Ada` — under the caption "three named boxes — the program's memory", with a line beneath reading "print(name, score, bonus) → Ada 10 20". The main panel is titled "The program's memory" with body noting each line made or changed a box and `print` reads them back out. The right nav action reads FINISH. Mobile did not reach this beat.

### Code drawer
![variables code drawer desktop](img/variables/drawer-code-d.png)
Opening the code drawer (via the CODE chip) slides a panel in from the right titled "THE CODE SO FAR", tagged "OPTIONAL  algorithm.py · the lesson works without it". It shows the numbered Python source: a comment on line 1 ("# A variable is a name attached to a value..."), then `score = 0`, `score = score + 10`, `bonus = score * 2`, `name = "Ada"`, and `print(name, score, bonus)` on lines 3–7. The current line (line 7, the `print` call) is highlighted with a play-arrow marker in the gutter. A close (×) control sits in the drawer's top-right corner.

_Capture note: desktop reached all 5 beats (5/5); mobile reached 3 of 5 (1/5 through 3/5). Mobile stopped at beat 3 because the predict/wedge gate on "Change it" was not cleared, leaving the advance button disabled. The captured sequence is the structured register (5 beats: need, create, update/change, use, recap); the spec's `types` beat ("Any kind of value") is cut for this register and was not in the captured run._
