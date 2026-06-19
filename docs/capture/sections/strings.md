## strings
route: `/categories/data-structures/strings/` · diagram shape: line

This re-capture reached all beats on both viewports: desktop `{reached:5, total:5}` and mobile `{reached:5, total:5}`. The live lesson runs the 5-step flow (the step counter reads `step 1/5` … `step 5/5`): The setup, The instinct, The structure, The operations, String. Each beat below is shown in its initial state from the dot-jump; the interactive (wedge) beats appear pre-interaction, so their gates read `LOCKED` and the interactions are described from the spec.

### Beat 1 — The setup

![strings beat1 desktop](img/strings/beat1-d.png)
![strings beat1 mobile](img/strings/beat1-m.png)

The diagram is a single horizontal row of 19 character cells spelling out `the quick brown fox`, with spaces drawn as a faint dot (`·`) and an index (0–18) labeled under each cell. The header reads `STRINGS · FIND "BROWN" IN A SENTENCE`, an `IDEA 3 OF 7` pill, then `· step 1/5 · THE SETUP`; a `BUILDS ON` prereq bar below carries one pill, `Arrays & Lists`. The main panel under the canvas is captioned `THE SETUP` with the title "Find a word inside a sentence." and body text asking whether the word `brown` is in the sentence and where, noting you see one long stream of letters rather than five neat boxes. The why·code·recap chips sit below the body with five progress dots (first dot filled). The left side nav reads `BACK`; the right side nav reads `I HAVE THE QUESTION` (the beat's actionLabel). On mobile the row is compressed to fit width, and the side-nav labels become a bottom bar with `back`, a `1 / 5` counter, and an `I have the question →` button. There is no gate on this beat; advancing is a single click of the forward nav.

### Beat 2 — The instinct

![strings beat2 desktop](img/strings/beat2-d.png)
![strings beat2 mobile](img/strings/beat2-m.png)

The same 19-cell `the quick brown fox` row is shown, now with a draggable slider track running beneath it labeled "drag the start box" and a caption above the row reading `s[0:5] = "the·q"` (the current 5-letter candidate window, starting at index 0). A diagonal arrow points down toward the highlighted cells; cells 0–4 (the window) render in the active tone. The main panel is captioned `THE INSTINCT`, title "Drag the highlight. Read underneath.", with body text explaining that the five highlighted letters are the candidate and that landing on box 12 is no harder than box 2. A separate note panel to the right reads "The instinct: if reading any letter is instant, what actually makes a string different from a plain row of letter-boxes?". The right side nav shows `LOCKED` (this is the pre-interaction state), and under the why·code·recap dots a prompt reads `↑ TRY IT ON THE DIAGRAM TO CONTINUE`. This is a wedge interaction: the learner drags the start-box slider, which re-slices the candidate (`s[start:start+5]`) and compares it to `brown`; any move fires the interaction-done signal and unlocks the forward nav. The capture shows it locked because the dot-jump does not perform the drag. On mobile the row, slider, and arrow are scaled down, the note panel is not visibly separated, and the bottom bar shows `back`, a `2 …` counter, and a dimmed `Same machinery, different content →` button; the same `↑ TRY IT ON THE DIAGRAM TO CONTINUE` prompt appears.

### Beat 3 — The structure

![strings beat3 desktop](img/strings/beat3-d.png)
![strings beat3 mobile](img/strings/beat3-m.png)

The diagram switches to the short 5-cell `hello` row (indices 0–4), with cell 0 (`h`) outlined and a vertical arrow pointing down into it. A `PREDICT` panel overlays the lower canvas asking "This string has acted like an array so far — what does s[0] = 'H' do?" with three tappable choices: "replaces the first letter, in place", "refused — the program raises an error", and "quietly hands back an edited copy". The main panel is captioned `THE STRUCTURE`, title "A string is an array of characters.", with body text stating the one twist: a string is immutable, so `s[0]='H'` is not allowed and to change it you build a brand-new string. The right side nav reads `LOCKED` and the `↑ TRY IT ON THE DIAGRAM TO CONTINUE` prompt is shown; the third progress dot is filled. This is a wedge interaction via a prediction gate: tapping one choice fires interaction-done and reveals the answer (the correct one is "refused"); on reveal a `🔒 locked` pill and a refusal caption ("s[0] = 'H' is not allowed — strings are immutable") appear, which are hidden in this pre-interaction capture. On mobile the `hello` row, predict panel, and choices stack within the narrower canvas above the same caption and chips.

### Beat 4 — The operations

![strings beat4 desktop](img/strings/beat4-d.png)
![strings beat4 mobile](img/strings/beat4-m.png)

The `hello` row (indices 0–4) is shown with cell 0 outlined, a caption above reading "every edit builds a NEW string", a vertical arrow into the row, and a counter below reading "characters copied so far: 0". A `↺ replay` button sits under the counter. A note panel to the right reads "The trap: gluing letters on with += in a loop re-copies everything each time and quietly explodes. Build a list and join once instead." The main panel is captioned `THE OPERATIONS`, title "Reading is free. Building is not.", with body text explaining `s[i]` is O(1) while every edit copies the whole string into a new string. The right side nav reads `NAME THE STRUCTURE` and the fourth progress dot is filled. This is a playback beat: a timed animation replaces `s[0]` with `H`, then appends `!` twice, incrementing the copied-characters counter each step (the capture shows the initial frame at count 0); the `↺ replay` button restarts the animation. On mobile the row, counter, and note are scaled into the narrower canvas above the caption.

### Beat 5 — String

![strings beat5 desktop](img/strings/beat5-d.png)
![strings beat5 mobile](img/strings/beat5-m.png)

The 19-cell `the quick brown fox` row returns, dimmed (visited tone), with a vertical arrow pointing down into a centered cost-table card. The table lists six operations and their costs: `s[i]` → `O(1)`, `len(s)` → `O(1)`, `s[i:j]` → `O(j - i)`, `a + b` → `O(n + m)`, `repeat +=` → `way too long`, `find word` → `scans the text`. The main panel is captioned `THE STRUCTURE`, title "String.", with body text giving the mental model: an array of characters, immutable from the outside, indexed instantly, where "changing" one letter quietly builds a whole new string. The right side nav reads `FINISH` and the fifth (final) progress dot is filled. There is no gate on this beat. On mobile the dimmed row and cost table sit inside the narrower canvas, and the bottom bar shows `back`, a `5 / 5` counter, and a `Finish ✓` button.

### Code drawer

![strings code drawer desktop](img/strings/drawer-code-d.png)

The code drawer (captured open on the final beat) slides over the right side of the canvas, headed `THE CODE SO FAR` with an `OPTIONAL · algorithm.py · the lesson works without it` subtitle. It shows the Python string interface line by line: `s = "the quick brown fox"`, indexed access `first = s[0]` (O(1), `# 't'`), `n = len(s)` (O(1), `# 19`), slicing `word = s[4:9]` (O(k), `# "quick"`), concatenation `hello = "hi " + s` (O(n + m)), substring search `i = s.find("brown")` (`# 10, or -1 if absent`), the mutation note `# 6. Cannot mutate in place — s[0] = "H" raises`, then `caps = s.upper()` (`# "THE QUICK BROWN..."`). Several lines carry a left-arrow active marker (including `s = "the quick brown fox"`, `first = s[0]`, `n = len(s)`, `word = s[4:9]`, `hello = "hi " + s`, `i = s.find("brown")`, and `caps = s.upper()`), matching the active code labels for this beat. Below the code a `PRACTICE · try these next` section lists "Valid anagram" tagged `EASY →`.
