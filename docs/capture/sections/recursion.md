## recursion

route: `/categories/algorithms/recursion/` · diagram shape: box

The default register renders 5 beats (the header reads `step N/5`): setup, the instinct (wedge), the derivation, the operations (predict gate), and the pattern. The top bar reads `MAP · ◆ RECURSION · HOW BIG IS YOUR DOWNLOADS FOLDER?` with an `IDEA 4 OF 7` pill and the current beat name; a `BUILDS ON` strip carries the prereq pills `Arrays & Lists` and `Trees`. All beats share one diagram: a Downloads folder tree drawn left-of-centre (Downloads/ → resume, photos/ → beach, party; projects/ → notes, code/ → app.zip; scratch), leaving the right band free for the call-stack or panel. Wedge beats are captured in their INITIAL state because the dot-jump does not perform the interaction, so they appear LOCKED.

### Beat 1 — The setup

![recursion beat1 desktop](img/recursion/beat1-d.png)
![recursion beat1 mobile](img/recursion/beat1-m.png)

The diagram shows the full file tree with every folder row reading `?` for its size while file rows show fixed sizes (resume 2MB, beach 4MB, party 3MB, notes 1MB, app.zip 8MB, scratch 1MB). A blue arrow points into the `Downloads/` root node. The main panel is captioned `THE SETUP` with title "How big is your Downloads folder?" and body text stating the phone reports 19MB but files hide inside nested folders, so each folder shows a `?` until totalled. Interaction type is none. Below the panel sit the `WHY? · CODE · RECAP` chips and a row of five progress dots (first filled). Desktop side-nav shows `BACK` (left) and `FIND THE REPEATED J...` (right); on mobile the tree is horizontally clipped, the panel stacks below, and a bottom bar shows `back`, `1 / 5`, and the forward action `Find the repeated job →`.

### Beat 2 — The instinct

![recursion beat2 desktop](img/recursion/beat2-d.png)
![recursion beat2 mobile](img/recursion/beat2-m.png)

This is the wedge beat, shown here in its initial LOCKED state (the dot-jump does not perform the interaction, so the right rail reads `LOCKED` and the panel shows `↑ TRY IT ON THE DIAGRAM TO CONTINUE`). The diagram highlights all four folder nodes (Downloads/, photos/, projects/, code/) in active blue as clickable, with the caption "folders are clickable · files just know their size" above and the prompt `click a folder to ask "how big are you?"` below. A note card sits over the right band reading "The instinct: if a folder is made of smaller folders just like it, can the rule for the whole be the rule for a part?". The main panel is captioned `THE INSTINCT`, title "Open a folder, and it's a smaller copy of the same problem." Mechanically, clicking a folder fills in its total and turns it green while its children glow, surfacing the message "<folder>/ = its files + each subfolder = <total>MB"; that click fires `api.onInteractionDone()` and clears the gate to allow advancing.

### Beat 3 — The derivation

![recursion beat3 desktop](img/recursion/beat3-d.png)
![recursion beat3 mobile](img/recursion/beat3-m.png)

A static mid-recursion snapshot. The deepest path Downloads/ › projects/ › code/ › app.zip is highlighted on the tree (already-finished nodes such as resume, photos/=7MB, beach, party, notes show green totals), with a bracket under app.zip labelled "base case: return 8, stop". The right band shows the CALL STACK panel ("CALL STACK · newest on top", an "↑ working here" pill) with four frames stacked newest-on-top: app.zip "→ returns 8", code/ "partial 0", projects/ "partial 1", Downloads/ "partial 0", and the note "recursing in — newest call on top". The main panel is captioned `THE DERIVATION`, title "Write the rule. The function calls itself.", explaining `folder_size(node)` with its file case (return its size, stop) and folder case (run on each child, add up). Interaction type is none; this beat is a fixed illustration, not animated by the dot-jump.

### Beat 4 — The operations

![recursion beat4 desktop](img/recursion/beat4-d.png)
![recursion beat4 mobile](img/recursion/beat4-m.png)

This is a predict-gate wedge, shown pre-interaction in its LOCKED state (right rail `LOCKED`, `↑ TRY IT ON THE DIAGRAM TO CONTINUE` under the panel). The tree is drawn idle with all folders showing `?` and the caption "the rule is about to run on the whole tree". A PREDICT card occupies the right band asking "While the rule computes the root's total, how many times does each item get looked at?" with three choices: "once each" (correct), "once per folder above it", and "no telling without running it". The main panel is captioned `THE OPERATIONS`, title "Each item is touched once; calls pile up in a stack.", introducing O(n) and the call stack. Mechanically, tapping a prediction pill fires interaction-done, shows feedback, and after a short pause swaps the visual for an auto-playing recursion (frames pushed and popped on the stack, each node lighting once, plus a "↺ replay" button) that answers the prediction before the panel names it O(n). On mobile the PREDICT card is partially clipped off the right edge.

### Beat 5 — The pattern

![recursion beat5 desktop](img/recursion/beat5-d.png)
![recursion beat5 mobile](img/recursion/beat5-m.png)

The fully resolved tree: every node is green with its real total (Downloads/ 19MB with a "19MB ✓" badge above the root, photos/ 7MB, projects/ 9MB, code/ 8MB, files at their sizes). Two brackets annotate the pattern: a green bracket under scratch labelled "base case — a file knows its size", and a blue bracket over code/→app.zip labelled "recursive case — ask each child, add up". The main panel is captioned `THE PATTERN`, title "Recursion.", defining recursion as a function that calls itself on a smaller version, requiring a base case and a recursive case. Interaction type is none. The right rail action reads `FINISH` and the fifth progress dot is filled. On mobile the bottom bar shows `back`, `5 / 5`, and the greyed `Name the pattern →` action.

### Code drawer

![recursion code drawer desktop](img/recursion/drawer-code-d.png)

Opened from the `code` chip, a right-side drawer slides over beat 5 captioned "THE CODE SO FAR · the lesson works without it" and marked `OPTIONAL algorithm.py`. It shows the numbered Python `def folder_size(node: dict) -> int:` source with a docstring ("Total bytes inside a folder, counting..."), with the base case (`if node["type"] == "file": return node["size"]`) and recursive case (`return sum(folder_size(child) for child in n...`) highlighted, followed by comment lines noting the two non-negotiable pieces (a base case that doesn't recurse, a recursive case that calls the function on a smaller version) and the overflow/wrong-answer consequence of dropping either. A `PRACTISE · try these next` footer sits at the bottom of the drawer.
