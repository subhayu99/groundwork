## sliding-window-variable
route: `/categories/algorithms/sliding-window-variable/` · diagram shape: line

The re-capture reached all beats on both viewports (desktop 5/5, mobile 5/5). The lesson renders in its five-beat register: setup, instinct, derivation, win, pattern. The spec defines seven beats total; the `naive` ("The obvious thing") and `general` ("The generalization") beats are register-trimmed and do not appear in this render. The top bar shows a MAP link, the topic title "VARIABLE SLIDING WINDOW · LONGEST RUN WITH NO REPEATS", an "IDEA 1 OF 7" pill, a "step N/5" counter, and the per-beat label. The worked string is `abracadabra`, one letter per box.

### Beat 1 — The setup
![sliding-window-variable beat1 desktop](img/sliding-window-variable/beat1-d.png)
![sliding-window-variable beat1 mobile](img/sliding-window-variable/beat1-m.png)

The diagram is a single line of eleven letter boxes spelling `abracadabra`, one character per box, with a bracket above the row labeled "find the longest no-repeat run" and a vertical arrow pointing down into the row. A "BUILDS ON" prereq strip below the header carries two pills, "Sliding Window" and "Hash Maps". The main panel under the diagram is captioned "THE SETUP" with the title "The longest stretch with no repeats." and body text describing `abracadabra` as a row of letter boxes and the rule that every letter inside the run must be different (no fixed length is given). Under the panel are the WHY? · CODE · RECAP chips and a five-dot progress row with the first dot filled. The right side nav reads "I HAVE THE QUESTION", the left reads "BACK". This beat has no diagram interaction (interaction: none), so the learner advances by clicking the forward nav. A zoom +/− control sits at the bottom-right of the diagram frame. On mobile the row, caption, and body stack vertically, with a bottom bar holding "Back", a "1 / 5" counter, and the forward action button.

### Beat 2 — The instinct
![sliding-window-variable beat2 desktop](img/sliding-window-variable/beat2-d.png)
![sliding-window-variable beat2 mobile](img/sliding-window-variable/beat2-m.png)

The eleven-box row shows the interactive manual window in its initial state: box 0 (`a`) is highlighted active with an "L R" marker pinned beneath it (L and R coincide on the first cell), and a status line above the row reads `"a" · length 1 · no repeats ✓`. Three controls sit below the row: a `↺` reset button, a disabled `contract L →` button (disabled because L equals R), and an enabled `expand R →` button. A note card on the right reads "The instinct: when does R want to move? When does L have to move? Are they ever moving for the same reason?". The main panel is captioned "THE INSTINCT", titled "Two ends. Move them by hand.", and explains the two markers L and R and what `expand R` and `contract L` do. This is a wedge interaction: the learner clicks the window controls to grow R (pull in the next letter) or contract L (drop the leftmost), and boxes turn active (window unique) or bad/red on a repeat. Shown pre-interaction, so the right side nav reads "LOCKED" and the prompt under the chips reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE"; clicking a window control fires the beat's interaction-done signal and unlocks forward navigation. On mobile the diagram, status line, and controls render in a smaller frame above the panel, with the bottom-bar forward button shown disabled and a "2 / 5" counter.

### Beat 3 — The derivation
![sliding-window-variable beat3 desktop](img/sliding-window-variable/beat3-d.png)
![sliding-window-variable beat3 mobile](img/sliding-window-variable/beat3-m.png)

The diagram is frozen at the lesson's pivot: the window holds "abr" (box 0 outlined red and marked "L", boxes 1-2 active blue with box 2 marked "R") and box 3, a second `a`, is outlined red and marked "next"; the caption reads `window "abr" — R's next letter is a second "a", and its old copy is still inside`. A PREDICT panel on the canvas asks "What's the smallest move that lets the new "a" in and keeps the run repeat-free?" with three choices: "slide L just past the old "a"" (correct), "restart the window at the new "a"", and "leave the new "a" out and grow R past it". The main panel is captioned "THE DERIVATION", titled "Right always grows. Left shrinks just enough." This is a wedge interaction implemented as a prediction gate: tapping a pill fires the interaction-done signal, shows feedback, and after a short reading pause the AutoWindow playback runs to answer the prediction. Shown pre-interaction, so the right side nav reads "LOCKED" and the footer reads "↑ TRY IT ON THE DIAGRAM TO CONTINUE"; committing to a choice clears the gate. On mobile the predict panel overlays the diagram and the body text stacks below.

### Beat 4 — The win
![sliding-window-variable beat4 desktop](img/sliding-window-variable/beat4-d.png)
![sliding-window-variable beat4 mobile](img/sliding-window-variable/beat4-m.png)

The diagram shows a static linear-time contrast: boxes 1-4 ("brac") are highlighted green with "L" under box 1 and "R" under box 4, the rest dimmed. A caption above reads "each letter is added once (R reaches it) and dropped once (L passes it): about 2n moves" with a vertical arrow into the row, and a line below the row reads "naive on 1,000 letters ≈ 500,000 checks · breathing window ≈ 2,000". The main panel is captioned "THE WIN", titled "Every letter touched twice. Linear time.", with body text stating each letter joins and leaves once (about 2n moves, written O(n)), the table lookup is instant (O(1)), and naive on 1,000 letters is about half a million checks against this method's roughly two thousand. The fourth progress dot is filled. The right side nav reads "NAME THE PATTERN". This beat has no diagram interaction (interaction: none).

### Beat 5 — The pattern
![sliding-window-variable beat5 desktop](img/sliding-window-variable/beat5-d.png)
![sliding-window-variable beat5 mobile](img/sliding-window-variable/beat5-m.png)

The diagram shows the final answer: boxes 1-4 ("brac") highlighted green, "L" under box 1, "R ✓" under box 4, with an upward arrow pointing into the window. The main panel is captioned "THE PATTERN", titled "Sliding Window (Variable).", and the body names the pattern, gives the answer as `brac` (length 4), describes the window as breathing (right expands when it can, left contracts when it must), and gives the trigger cue (longest or shortest substring under a rule that flips on or off). All five progress dots are filled and the right side nav reads "FINISH". This beat has no diagram interaction (interaction: none).

### Code drawer
![sliding-window-variable code drawer desktop](img/sliding-window-variable/drawer-code-d.png)

The drawer slides in from the right over the beat-5 desktop scene, headed "THE CODE SO FAR" with the subline "OPTIONAL · algorithm.py · the lesson works without it". It shows the Python source `def longest_unique_substring(s: str) -> int:` with a docstring describing the variable sliding window (right grows whenever adding `s[right]` keeps it valid; left shrinks just enough to restore the rule when a repeat shows up). The body initializes `last_seen: dict[str, int] = {}`, `left = 0`, `best = 0`, then loops `for right, ch in enumerate(s):` with the guard `if ch in last_seen and last_seen[ch] >= left:`, the update `left = last_seen[ch] + 1`, then `last_seen[ch] = right`, `best = max(best, right - left + 1)`, and `return best`. The `return best` line (line 22) is marked as the active line. Below the function are commented lines describing the same template under a different invariant. Line numbers run down the left margin.
