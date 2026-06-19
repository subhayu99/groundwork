## stacks-queues
route: `/categories/data-structures/stacks-queues/` · diagram shape: box

The gallery renders this lesson in its structured register, so the side rail and the dot strip show 5 steps (`step N/5`). The top bar reads `STACKS & QUEUES · TWO CONTRACTS ON A ROW`, carries an `IDEA 3 OF 7` chip, a `MAP` link, and the current beat label. A `BUILDS ON` banner with an `Arrays & Lists` prereq pill (and an X to dismiss) sits under the bar on the first beat. Each beat shows a `WHY? · CODE · RECAP` chip trio above the five-dot progress strip, left/right side-nav labels (`BACK` and the next action chevron), and a `−`/`+` zoom control in the canvas. On desktop the panel text sits below the canvas; on mobile the canvas crops to the center of the diagram and the nav collapses into a bottom bar with `back`, an `N / 5` step counter, and the next-action button.

### Beat 1 — The setup
![stacks-queues beat1 desktop](img/stacks-queues/beat1-d.png)
![stacks-queues beat1 mobile](img/stacks-queues/beat1-m.png)

The canvas draws a single horizontal row of five boxes (home, inbox, draft, sent, page) with a faint `front →` marker at the left edge and `← back` at the right; this is the shared row both later stories sit on. The main panel reads `THE SETUP` as the caption, titled "Two questions. Opposite rules. Same row of items.", with body text contrasting the browser back button (returns the newest page first) against a barista serving whoever ordered first (oldest). The right rail shows the `I HAVE THE QUESTION` action; the first of five dots is filled. This beat has no gate; the learner advances by pressing the action chevron. On mobile the row crops to inbox/draft/sent and the `BUILDS ON · Arrays & Lists` banner shows at the top, with a `1 / 5` counter and "I have the question →" in the bottom bar.

### Beat 2 — The instinct
![stacks-queues beat2 desktop](img/stacks-queues/beat2-d.png)
![stacks-queues beat2 mobile](img/stacks-queues/beat2-m.png)

The canvas splits into two stacked-box structures side by side. On the left, `STACK · last in, first out` with an `↑ top` pill above three boxes (draft tinted on top, then inbox, then home) and `push`/`pop` buttons beneath. On the right, `QUEUE · first in, first out` with an `↑ front (out)` pill above latte (tinted at front) and mocha, plus `add`/`remove` buttons. A helper line reads "press push / pop on the stack, or add / remove on the queue", and a note panel overlays the lower canvas: "The instinct: if you promise to only ever touch the ends, what suddenly becomes free?". The main panel caption is `THE INSTINCT`, titled "Touch only the ends. Watch which end each move uses." The interaction is a wedge gate: clicking any of the four SVG buttons mutates that structure (push appends a pooled value to the top, pop removes the top, add joins the queue's back, remove serves the front), highlights the matching code line, and fires the interaction-done callback to clear the gate. Captured pre-interaction, so the right rail shows a padlock with `LOCKED` and the footer reads `↑ TRY IT ON THE DIAGRAM TO CONTINUE` (the mobile advance button "Restrict, then optimize →" renders greyed/disabled).

### Beat 3 — The structure
![stacks-queues beat3 desktop](img/stacks-queues/beat3-d.png)
![stacks-queues beat3 mobile](img/stacks-queues/beat3-m.png)

The canvas shows the two contracts side by side (STACK with draft/inbox/home, QUEUE with latte/mocha/americano), each with a downward arrow pointing at it from above and the touch-point tinted (stack top active, queue front active). The main panel caption is `THE STRUCTURE`, titled "One end, or two.", explaining that a stack adds and removes only at the top (LIFO, last in first out) while a queue adds at the back and removes from the front (FIFO, first in first out); LIFO and FIFO render as underlined glossary terms. The right rail action is `WHAT'S THE COST?`. This beat has no gate; the third dot is filled.

### Beat 4 — The operations
![stacks-queues beat4 desktop](img/stacks-queues/beat4-d.png)
![stacks-queues beat4 mobile](img/stacks-queues/beat4-m.png)

The canvas shows a single STACK column (`↑ top — both push & pop here`, items draft/inbox/home with the top tinted) and a caption "went in: home → inbox → draft" beneath it. A `PREDICT` gate panel sits to the right asking "Three pops will empty this stack — in what order do the three come out?" with three choices: "home, inbox, draft — the order they went in", "draft, inbox, home — arrival order, reversed", and "no way to tell without running it". The main panel caption is `THE OPERATIONS`, titled "Every move is at an end, so every move is instant.", noting push/pop/peek are O(1) and a queue's add/remove are O(1) only on a deque, not a plain list whose front-removal is O(n) (O(1), deque, O(n) render as glossary terms). The interaction is a wedge: tapping one prediction choice fires the interaction-done callback, shows feedback (the reversed-order choice is correct), then after a short pause auto-plays a push-three-then-pop-three animation answering the prediction. Captured pre-interaction, so the right rail shows `LOCKED` and the footer reads `↑ TRY IT ON THE DIAGRAM TO CONTINUE`. Mobile crops the canvas so the STACK column and the left edge of the PREDICT panel are visible.

### Beat 5 — The pattern
![stacks-queues beat5 desktop](img/stacks-queues/beat5-d.png)
![stacks-queues beat5 mobile](img/stacks-queues/beat5-m.png)

The canvas draws the two named contracts as physical pictures: `STACK — a pile of plates` (draft/inbox/home with a bracket reading "add & take from top") and `QUEUE — a coffee-shop line` (latte/mocha/americano with a bracket reading "join back · called from front"), both brackets drawn in the easy-difficulty color. The main panel caption is `THE PATTERN`, titled "Stack and Queue.", stating the names come from the pictures and that both are two contracts on a plain row where the contract keeps every move instant. The right rail action is `FINISH` and the fifth dot is filled. This beat has no gate.

### Code drawer
![stacks-queues code drawer desktop](img/stacks-queues/drawer-code-d.png)

Opening the code drawer slides a panel in from the right over the canvas. Its header reads `THE CODE SO FAR` with an `OPTIONAL · algorithm.py — the lesson works without it` subtitle. The numbered Python source shows the stack section first (`history: list[str] = []`, three `history.append(...)` lines commented `# push — O(1)`, then `last = history.pop()` and `peek = history[-1]`), then the queue section (`from collections import deque`, `orders: deque[str] = deque()`, three `orders.append(...)` lines commented `# enqueue — O(1)`, and `first = orders.popleft()`), with notes to avoid `list.pop(0)` because it is O(n). Highlighted lines correspond to the active `codeLabels` for the current beat (the append/push and pop lines). A `PRACTICE — try these next` footer lists a follow-up exercise with a forward arrow.
