# Annotated-Canvas Conversion — Stacks & Queues

**Topic:** `data-structures/stacks-queues` · 7 derivation steps → 7 beats
**Source code:** `src/categories/data-structures/topics/stacks-queues/algorithm.py`
**Real `@sync` labels available:** `sig`, `push`, `pop`, `peek`, `qinit`, `enqueue`, `dequeue`

Canvas is the existing 860×470 design box from the reference. The visual for each beat reuses what the current `visualizer.tsx` already draws per step (the naive-array cost demo for steps 1–2; the side-by-side stack + queue for steps 3–7). The explanation moves OFF the card column and ONTO the plane as a positioned panel with an arrow. Code docks on the right; active line(s) follow the beat.

---

### Beat 1 — The setup · Two questions. Different rules. Same row of items.
- **narration**: You're browsing. The browser remembers your pages so "back" returns the *newest* one first. In another room a barista serves whoever ordered *first*. Both are just rows of items — so why do the rules look opposite?
- **visual**: array (the `NaiveArrayViz` row). One horizontal row of 5 toned-idle item boxes (`latte mocha americano drip espresso`), `front →` label on the left, `← back` on the right. Nothing highlighted yet — this is the shared "row of items" both stories sit on.
- **panel**: top
- **arrow**: none (the panel describes the whole row, not one cell).
- **codeLabels**: `[]`  *(pure story setup — no code yet)*
- **interaction**: none

---

### Beat 2 — The obvious thing · Use an array. Add to the end. Remove from anywhere.
- **narration**: Adding at the *end* of a row is instant — one move, however long the row. But the barista's next customer sits at the *front*, and removing the front slides every other item left by one. The more items waiting, the more shifting you pay.
- **visual**: array (`NaiveArrayViz`). Same 5-box row. Tone the front box (`latte`, index 0) as "leaving"; tone boxes 1–4 with the `diff-med` "shifting left" wash (the `x: -4` nudge the component already applies). Show the live `total shifts paid` counter beneath. Two end-buttons read `pop front · O(n)` and `pop back · O(1)` so the contrast is visible.
- **panel**: bottom
- **arrow**: from the panel up to the front box (index 0) — "this removal is the expensive one."
- **codeLabels**: `[]`  *(this is the naive plain-array failure mode; the file's first labelled line, `sig`, is the fix introduced in beat 3, so keep code dark here)*
- **interaction**: none
- **First-time terms to teach in this narration:** *"instant — same cost no matter how long the row" = O(1)*; *"cost grows in step with how many items = O(n)"*. Introduce both in plain words here since the buttons show the `O(1)` / `O(n)` labels.

---

### Beat 3 — The wedge · Push and pop. Watch which end they touch.
- **narration**: Two structures, both empty. Press *push* a few times, then *pop*. The left one adds and removes at the *same* end. The right one adds at one end, removes from the other. Same items — the only difference is *where you're allowed to touch*.
- **visual**: stack + queue side-by-side (`StackQueueViz`). Left: vertical "stack · lifo" column with `↑ top` marker, both actions at the top. Right: horizontal "queue · fifo" row with `front →` / `← back`, add at back, remove at front. Live op-readout line under each (`push(home) · O(1)`, etc.).
- **panel**: top  *(small "wedge question" note panel docks bottom-center, mirroring the reference's `panel2`)*
- **arrow**: from the main panel to the **top of the stack** (the end both stack ops touch) — the thing the user is about to test.
- **codeLabels**: `[]`  *(do not pre-light lines — the visual itself emits the real label as the user clicks: `push`/`pop` for the stack, `enqueue`/`dequeue` for the queue, via `onActiveLine`)*
- **interaction**: **wedge** — PRESERVED. User must push/pop (or enqueue/dequeue) at least once before "Next" unlocks. The wedge question on the note panel: *"If you decide up front that you'll only ever touch the ends, what becomes free?"*
- **First-time terms to teach:** *push = add an item; pop = remove the most recent item; enqueue = add at the back; dequeue = remove from the front.* State each in plain words the first time its button is named.

---

### Beat 4 — The structure · Stack: one end. Queue: two ends, different roles.
- **narration**: A **stack** only adds and removes at the *top* — newest out first (last in, first out). A **queue** adds at the *back* and removes from the *front* — oldest out first (first in, first out). The restriction isn't a limit; it's what makes both moves instant.
- **visual**: stack + queue side-by-side (`StackQueueViz`), now with a few items in each from the wedge. Highlight the stack's **top** box and the queue's **front** box with the accent tone; dim the interior boxes so only the touch-points stand out.
- **panel**: left  *(leaves the two structures room on the right)*
- **arrow**: two short arrows — one to the stack's top box, one to the queue's front box — anchoring "newest out first" vs "oldest out first."
- **codeLabels**: `["sig", "qinit"]`  *(the two declarations: `history: list[str] = []` for the stack, `orders: deque[str] = deque()` for the queue — the structures themselves)*
- **interaction**: none
- **First-time terms to teach:** *LIFO = last in, first out (the newest one leaves first)*; *FIFO = first in, first out (the oldest one leaves first)*. Spell both out — the card uses the acronyms.

---

### Beat 5 — The operations · All ends. All constant time. No middle.
- **narration**: Stack: `push`, `pop`, and `peek` (look at the top without removing) are all instant. Queue: `enqueue` and `dequeue` are instant *if* you use the right tool. A plain list's `pop(0)` looks harmless but pays for every item shifting left — slow as the queue grows.
- **visual**: stack + queue side-by-side. On the stack, flash `push` (top box appears) then `peek` (top box gets a thin "looked at, not removed" ring). On the queue, contrast two removals: `dequeue` from a `deque` glides out at O(1); show a ghosted "plain-list `pop(0)`" variant where the rest of the row shifts left (reuse the beat-2 shift wash) labelled `O(n)`.
- **panel**: bottom
- **arrow**: from the panel to the queue's front box — "removing here is O(1) with a deque, O(n) with a plain list."
- **codeLabels**: `["push", "pop", "peek", "enqueue", "dequeue"]`  *(the full operation set; the `# Don't use list.pop(0)` comment in the .py is unlabelled context above `enqueue`)*
- **interaction**: playback  *(auto-animates push→peek and the deque-vs-list removal contrast)*
- **First-time terms to teach:** *peek = look at the top item without taking it off*; *deque ("deck") = a list built to add/remove fast at both ends*. The narration already does this — keep it.

---

### Beat 6 — When it fits · Stack for undo / recursion. Queue for fairness / work pools.
- **narration**: Reach for a **stack** when you want the most-recently-added next: browser back, undo history, matching brackets, depth-first search. Reach for a **queue** when you want the longest-waiter next: scheduling, print jobs, task pools, breadth-first search. Tempted to grab the middle? Wrong structure.
- **visual**: stack + queue side-by-side, calm/at-rest. Around the stack, float small example chips (`browser back`, `undo`, `call stack`, `DFS`); around the queue, float (`scheduling`, `task pool`, `print spooler`, `BFS`). Tone a middle box of each row as `no` (forbidden) with a small "no middle" cross to reinforce the rule.
- **panel**: left
- **arrow**: one arrow to the stack's example cluster, one to the queue's — mapping each use-case set to its structure. (Or a single bracket spanning each structure's chips.)
- **codeLabels**: `[]`  *(use-case beat — no specific line; keep the full file visible but unlit, or fall back to `["sig", "qinit"]` to keep both declarations gently lit)*
- **interaction**: none
- **First-time terms to teach:** *call stack = the list of functions currently waiting on each other to finish*; *DFS / BFS = depth-first / breadth-first search, two ways to explore — DFS dives deep first, BFS spreads wide level by level.* These appear nowhere earlier, so expand them in one clause each (don't just drop the acronyms as the current card does).

---

### Beat 7 — The structures · Stack and Queue.
- **narration**: The names are the physical pictures. A stack of plates: add to the top, take from the top. A queue at a coffee shop: join the back, get called from the front. They're not exotic data structures — just two *contracts* on a plain row, and the contract is what makes them fast.
- **visual**: stack + queue side-by-side, fully populated, both labelled with their final names (`STACK`, `QUEUE`) and the plate-pile / coffee-line analogy icons. Gently animate one full cycle on each (push→pop on the stack, enqueue→dequeue on the queue) as the closing recap.
- **panel**: top
- **arrow**: none (this beat names both whole structures, not one element).
- **codeLabels**: `["push", "pop", "enqueue", "dequeue"]`  *(light the four operating lines together so the docked Python reads as the finished contract; "Open the drawer to see how Python expresses both" maps to the code panel being open here)*
- **interaction**: none  *(final beat — "Mark complete")*

---

## Notes

**Wedge is real and must be preserved.** Beat 3 is the gating step: in `visualizer.tsx` the `StackQueueViz` only receives `onWedgeInteraction` when `p.step === 3`, and any push/pop/enqueue/dequeue calls `touch()` → satisfies the wedge. The annotated-canvas beat 3 must keep `interaction: "wedge"` and not advance until the user clicks a structure button. Do not auto-play beat 3.

**Visual is interactive, not a static SVG.** Unlike the binary-search reference (pure SVG per beat), this topic's canvas is a live React widget the learner clicks. The `visual` for beats 3–7 should be a render-fn (`BeatVisual` as `(api) => ReactNode`) that wires `api.onActiveLine` and `api.onInteractionDone`, mirroring the existing `onActiveLine` / `onInteraction` props. The code line genuinely *follows the click* (push → `push` line) rather than only the beat's static `codeLabels` — `codeLabels` is the fallback when no click has happened yet. This is exactly the `BeatVisualApi` contract in `types.ts`.

**Two sub-visuals, one phase boundary.** Beats 1–2 use `NaiveArrayViz` (single row, shift-cost demo); beats 3–7 use `StackQueueViz` (side-by-side). The current `phasedVisualizer` switches at `until: 2`. Keep that boundary: beat 2 → beat 3 is where the canvas swaps from "one plain array" to "two contracts." Worth a soft transition so the swap reads as the payoff of the wedge, not a context loss.

**Mobile.** `StackQueueViz` already stacks the two structures vertically on mobile (`useIsMobile`) and shrinks min-heights (260→160 for the stack, 260→120 for the queue). On the annotated canvas, panels must dock so they never cover the active end: on the narrow layout prefer `top`/`bottom` panels (beats 1,2,3,5,7) over `left`/`right` (beats 4,6), or have left/right panels fall back to bottom on mobile. Arrows should re-anchor when the two structures reflow vertically — point to the top-of-stack and front-of-queue by element ref, not fixed canvas coords.

**Code-panel anchor accuracy.** All labels in the plan are verified against `algorithm.py`: `sig` (line 6, `history` decl), `push` (7), `pop` (10), `peek` (11), `qinit` (19, `orders` decl), `enqueue` (20), `dequeue` (23). Note `qinit` not `qsig` — the queue's declaration label differs from the stack's `sig`. The `# Don't use list.pop(0)` warning (lines 15–16) is an unlabelled comment; beat 5's `O(n)` plain-list point references it visually but has no `@sync` line to light.

**CONTENT BUGS / jargon gaps spotted in the current lesson:**
1. **Unexplained acronyms LIFO / FIFO (step 4) and DFS / BFS (step 6).** The current cards drop "LIFO — last in, first out" (OK, that one self-defines) but "depth-first traversal" / "breadth-first traversal" in step 6 are never explained — a 15-year-old won't know them. The plan expands DFS/BFS in beat 6's narration. Likewise "function call stack" / "recursion" (step 6 + the topic's framing) need a one-clause plain definition; added to beat 6.
2. **`O(1)` / `O(n)` appear first in the step-2 buttons (`pop front · O(n)`, `pop back · O(1)`) before any prose defines them.** The current step-2 card *does* describe the cost in words ("one move, no matter how long") but never ties that phrasing to the `O(...)` symbol the buttons show. Beat 2's narration must explicitly bind "instant, same cost regardless of length = O(1)" and "cost grows with the count = O(n)" the first time the symbol is on screen.
3. **`collections.deque` / `pop(0)` (step 5)** are real Python and fine to show, but "deque" is unglossed in the current card. Beat 5 adds the plain-words gloss (*"deque — a list built to add/remove fast at both ends; say 'deck'"*). The pronunciation helps a beginner who'd otherwise read it as "de-queue."
4. **No factual errors** in the current lesson — the O(1)/O(n) claims, the LIFO/FIFO mapping, and the deque-vs-list-`pop(0)` warning are all correct and match `algorithm.py`. The only issues are unexplained jargon, which the rewritten narrations fix.

---

## Peer review
- **verdict: needs-work**

The plan is faithful, the wedge is preserved, the @sync labels and line numbers are correct, and the jargon-gap analysis is genuinely good. But several beats describe visual states the *existing* `StackQueueViz` / `NaiveArrayViz` cannot produce, and a couple of beginner-safety claims in the narrations are themselves left unexplained. Concrete fixes below.

- **Beat 5 — visual is not buildable as written.** Narration/visual call for the stack to "flash `peek` (top box gets a thin 'looked at, not removed' ring)" and for a "ghosted plain-list `pop(0)`" variant that shifts the row. But `StackQueueViz` (verified in `visualizer.tsx`) renders **only four buttons** — `push`, `pop`, `enqueue`, `dequeue` — and emits only those four via `onActiveLine`. There is **no peek action, no ring state, and no plain-list/`pop(0)` ghost variant** in the component. Fix: either (a) downgrade beat 5's visual to what exists (push/pop on the stack, enqueue/dequeue on the queue, with the O(1)/O(n) contrast carried by the *code panel + narration* only), or (b) explicitly flag that `peek` and the ghosted-`pop(0)` overlay are **new component work** required before this beat can ship. As written, the `interaction: playback` "auto-animates push→peek and the deque-vs-list removal contrast" is not implementable with the current widget.

- **Beat 5 — `codeLabels: ["push","pop","peek","enqueue","dequeue"]` will light `peek`, but nothing on the canvas corresponds to it.** The static label resolves fine via `labelToLine` (algorithm.py line 11 has `@sync: peek`), so the *code* highlight is correct — but it lights a line the *visual* never demonstrates, breaking narration↔visual↔code coherence. Tie the fix to the beat-5 visual fix above: only light `peek` on a beat where the canvas actually shows a peek.

- **Beat 2 — `total shifts paid` counter and the two end-buttons are real, but the "tone the front box as leaving + diff-med shift wash" requires confirming `NaiveArrayViz` exposes that per-box state.** The component does render `pop front · O(n)` / `pop back · O(1)` buttons and a `total shifts paid` counter (confirmed), and the buttons are `popFront`/`popBack`/`pushBack`. Good. But the plan says `interaction: none` while the only way the counter increments is by clicking those buttons. Fix: either make beat 2 `interaction: playback` (auto-click pop-front a few times to drive the counter), or state the counter starts pre-seeded — otherwise the narration's "the more items waiting, the more shifting you pay" lands on a static `0`.

- **Beat 2 / beginner-safety — "array" itself is never glossed.** Beat 1 narration (ground truth) says "lists of items"; beat 2 switches to "array" and "row." A 15-year-old with zero CS may not equate them. Fix: in beat 2 add one clause — "an array (a fixed row of slots in memory)". The plan's term-teaching list covers O(1)/O(n) but silently introduces "array."

- **Beat 3 — narration says "Press push a few times then pop," but the queue half of the wedge uses `enqueue`/`dequeue` buttons, not push/pop.** The plan's own codeLabels note acknowledges the queue emits `enqueue`/`dequeue`, yet the narration tells the user to "Press push." A beginner pressing on the queue will see `enqueue`. Fix: narration should say "press the add/remove buttons on each" or name both pairs, matching the actual button labels (`push`/`pop` left, `enqueue`/`dequeue` right).

- **Beat 1 visual — `front →` / `← back` are both confirmed present in the components, good** — but the plan lists items as `latte mocha americano drip espresso` and frames beat 1 around *the browser* (newest-first) and *the barista* (oldest-first). The shared row is labelled with coffee names only, which visually anchors to the barista/queue story and not the browser/stack story. Minor: acknowledge that the beat-1 row reads as "the barista's line," or relabel neutrally, so the "same row, two rules" point isn't visually pre-biased toward the queue.

- **Beat 6 — good catch on DFS/BFS/call-stack, but the plan still leaves "recursion" (in the beat label "Stack for undo / recursion") unexpanded.** The beat title/label uses "recursion"; the narration expands call-stack/DFS/BFS but not "recursion" itself. Fix: add a one-clause gloss ("recursion — a function that calls itself, stacking up unfinished calls") or drop the word from the label, since it appears in the beat label a beginner reads first.

- **Beat 4 / codeLabels `["sig","qinit"]` — correct and verified** (line 6 `history` decl, line 19 `orders` decl). The note that it's `qinit` not `qsig` is accurate and a good guard. No change.

- **Feasibility (positive):** All named primitives exist (`ArrayViz`, `GridViz`, `TreeViz`, `GraphViz`, `Scene`, `StackPanel`), and `BeatVisualApi` with `onActiveLine` + `onInteractionDone` is real in `src/shared/lesson/types.ts`; `BeatVisual = ReactNode | ((api) => ReactNode)`. The render-fn approach the plan describes is supported. The plan's claim of an "onInteraction" prop on the API is slightly off — the API method is **`onInteractionDone`** (the *component* `StackQueueViz` takes an `onInteraction` prop). Fix the wording in the "Visual is interactive" note to say the render-fn wires the component's `onInteraction` to `api.onInteractionDone`.

- **Phase boundary (positive):** `phasedVisualizer([{ until: 2, render: NaiveArrayViz }, ... StackQueueViz])` confirmed; the beat-2→3 swap claim is accurate. Wedge gating (`onInteraction` only when `p.step === 3`) confirmed.
