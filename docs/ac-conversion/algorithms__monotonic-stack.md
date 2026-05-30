# Annotated-Canvas conversion — algorithms / monotonic-stack

**Topic:** Monotonic Stack · "Eight cold days. When does it warm up?"
**Source data:** `TEMPS = [73, 74, 75, 71, 69, 72, 76, 73]` (index 0–7). Expected `answer = [1, 1, 4, 2, 1, 1, 0, 0]`.
**Code source:** `algorithm.py` → `days_until_warmer(temps)`. Real @sync labels available:
`sig`, `init_answer`, `init_stack`, `loop`, `while_pop`, `pop`, `record`, `push`, `done`.

The lesson keeps its 7 derivation steps as 7 beats. The visual that already exists for each phase
stays; its explanation moves onto the canvas as a positioned text panel with an arrow to the exact
element it describes. The real Python docks on the right and the highlighted line(s) follow the beat.

The visualizer maps phases to beats like this:
- Beats 1–2 → `NaiveScanViz` (bars + base/probe markers, comparison counter)
- Beat 3 → `ManualWalkViz` (the WEDGE — user clicks "send day i"; bars + answer row + waiting stack)
- Beats 4–7 → `DerivedViz` (auto-play one pass; bars + answer row + waiting stack + ops counter)

Canvas: bars row (8 temperature bars, value °, index beneath), an **answer row** of 8 cells below it,
and a **waiting stack** panel (vertical, top-on-top, shows `day i / temp°`). Reuse these primitives.

---

### Beat 1 — The setup · Eight cold days. When does it warm up?
- **narration:** For each day, count the days until a warmer one. If the next warmer day is two ahead, the answer is 2. If no warmer day ever comes, the answer is 0. Eight days is easy — but weather apps hold a whole year.
- **visual:** array of bars (height ∝ temperature). All 8 bars `idle`/live, value and index labels shown. The answer row sits below, all cells empty (shown as `·`). One sample day toned `active` (e.g. day 0 = 73°) to anchor "stand on a day."
- **panel:** top
- **arrow:** from the panel down to the `active` bar (day 0), illustrating "stand here and look right."
- **codeLabels:** `["sig"]`
- **interaction:** none

---

### Beat 2 — The obvious thing · Stand on each day. Look right until it gets warmer.
- **narration:** The honest way: stand on a day and walk forward until a warmer one shows up; note the gap. The cold early days re-scan almost the whole week. Eight days is fine; a million is not — the work grows like size times size.
- **visual:** same bars. `base` day toned `active`, the `probe` day it's currently comparing toned `compare`; days already passed toned `visited`. The running **comparisons** counter from `NaiveScanViz` shown beneath. This is the auto-play naive scan.
- **panel:** bottom
- **arrow:** from the panel up to the `probe` bar (the day being re-read), labelling "re-checking this day again."
- **codeLabels:** `[]`  (naive scan is not in `algorithm.py`; nothing lights up — keep code panel dim or pinned to `sig`)
- **interaction:** playback

---

### Beat 3 — The wedge · Keep a line of days still waiting.
- **narration:** Walk left to right. Keep a line — a **stack** — of days still waiting for a warmer one (a stack means we only add to and take from the same end, the back). Each new day asks the last in line: "Am I warmer than you?" Warmer → you're their answer, send them home with the gap. Not warmer → join the back and wait.
- **visual:** bars + answer row + **waiting stack** panel. The arriving day toned `active`; days on the stack toned `waiting`; days already answered toned `answered`; the answer row fills in `i - j` as days leave. User clicks **"send day i"** to advance one outer step; the stack visibly grows on cold days and drains on warm ones.
- **panel:** left  (so the stack panel on the right stays clear)
- **arrow:** from the panel to the top of the waiting stack (the "last person in line" being asked).
- **codeLabels:** `["while_pop", "record", "push"]`  (emitted live by `linesForStep`: `while_pop`+`record` on pop steps, `push` always)
- **interaction:** wedge  (PRESERVE — user must step through before continuing)

---

### Beat 4 — The derivation · A stack of indices. Pop while today wins.
- **narration:** The line is a stack, and we store each day's **index** (its position 0–7), not its temperature, so we can subtract to get the gap. For each new day, while the stack's top day is cooler, remove it ("pop") and record `answer = today − that day`. Then add today. Whoever's left at the end stays 0.
- **visual:** the auto-play `DerivedViz` — bars + answer row + waiting stack, running one full pass. Active day `active`, stack days `waiting`, answered days `answered`. The "pops this step" footer on the stack panel shows pops happening.
- **panel:** top
- **arrow:** from the panel to the waiting-stack panel where a pop is occurring (`record` → answer cell being filled).
- **codeLabels:** `["loop", "while_pop", "pop", "record", "push"]`
- **interaction:** playback

---

### Beat 5 — The operations · A few days do a lot. The average is constant.
- **narration:** One warm day can pop everyone waiting — looks expensive. But every pop was paid for by a push that already happened, so total pushes plus pops is at most `2n` (twice the number of days). We call that `O(n)`: the work grows in step with how many days there are. Spread out, each day costs a flat, near-instant amount on average.
- **visual:** same `DerivedViz` pass, but emphasize the **counter**: `total pushes + pops` climbing toward its `cap = 2 × 8 = 16`. Optionally freeze on the warm day (day 2 = 75° or day 6 = 76°) that triggers several pops, those stack days flashing `answered` as they leave. A small bracket/note shows "total ≤ 2n".
- **panel:** bottom
- **arrow:** from the panel to the `total pushes + pops / cap` counter line.
- **codeLabels:** `["while_pop", "pop", "push"]`  (the operations being counted)
- **interaction:** playback

---

### Beat 6 — The generalization · Anything that asks "previous/next thing with a property."
- **narration:** The trick isn't about temperatures. It fits any "for each item, what's the next or previous one that's bigger / smaller / taller / cheaper?" Largest rectangle under a row of bars; how long a stock kept rising; the next lighter paint color. Same shape every time.
- **visual:** custom. Keep the temperature bars but ghost them (`gone`/dimmed), and overlay 2–3 small "story" mini-rows beside the bars — e.g. a row of histogram bars, a rising-then-dipping stock line — each tagged with its question. The point is one walk + a stack of waiters works for all of them. Keep it sparse; this is a concept beat, not a sim.
- **panel:** right
- **arrow:** none  (panel labels the family of stories; no single element to point at)
- **codeLabels:** `["loop", "while_pop", "push"]`  (the unchanging shape: walk once, pop while it wins, push)
- **interaction:** none

---

### Beat 7 — The pattern · Monotonic Stack.
- **narration:** That's the name. The stack is "monotonic" because the temperatures inside only go one direction — cooler at the bottom, colder near the top — and the moment a new day would break that order, you pop until it holds. And the cheap-on-average cost, where rare expensive steps are pre-paid by all the cheap ones, has a name: **amortized**.
- **visual:** final completed state — all bars resolved (`answered`/`gone`), the full answer row filled `[1,1,4,2,1,1,0,0]`, the waiting stack showing the leftover days that never warmed (their answer = 0). A "pattern signals" checklist panel lists the cues (next/previous bigger-smaller; "days until X"; largest rectangle; one pass, total work ≤ a few × length).
- **panel:** top  (with the signals list); the filled answer row reads as the payoff beneath.
- **arrow:** from the panel to the two stuck-on-the-stack days (day 6=76°, day 7=73°) whose answer stayed 0 — "never found a warmer day."
- **codeLabels:** `["done"]`  (return; whoever's left keeps answer 0)
- **interaction:** none

---

## Notes

- **Wedge preserved:** Beat 3 is the only gating beat. It uses `ManualWalkViz`'s "send day i" button — the user must step the days themselves before "Next" unlocks. Beats 4/5 auto-play (`DerivedViz`), Beats 1/6/7 are static, Beat 2 auto-plays the naive scan. This matches the existing phase→interaction mapping.

- **Three primitives stacked vertically** (bars + answer row + waiting stack) make this canvas **taller and denser** than the binary-search reference (which is a single row). On mobile the stack panel should drop below the answer row (it already renders in a column), and text panels (left/right on beats 3/6) should reflow to top/bottom. Budget vertical space — consider a taller canvas `height` than the 470 reference.

- **Code-panel honesty:** Beats 1–2 describe the *naive* approach, which is **not** in `algorithm.py`. The reference form would light real lines; here Beat 2 must show **no** highlight (or pin to `sig`) rather than fake a line. Flagged in `codeLabels: []` for Beat 2.

- **`record` line nuance:** `answer[j] = i - j` uses indices `i` (today) and `j` (the popped day). The narration must already have taught "we store the index/position, not the temperature" (done in Beat 4) before this subtraction reads as "the gap." Keep Beat 4 before any reliance on `i - j`.

- **Jargon to teach inline (first appearance):** "stack / add-and-remove-from-the-same-end" (Beat 3), "index = position 0–7" (Beat 4), "pop = remove the top" (Beat 4), `2n` / `O(n)` = "work grows with the number of days" (Beat 5), "amortized = rare costly steps pre-paid by cheap ones" (Beat 7). The lesson already does most of this; the conversion must not let `O(n)`, `i - j`, `pop`, or `stack` appear earlier than its plain-words gloss.

- **Content check — no bugs found.** The current lesson is sound: the example temps produce a correct answer row, the wedge logic matches `algorithm.py` (`temps[waiting[-1]] < t` strict-less, so equal temps don't pop — day 7=73° correctly does **not** answer day 0=73°), and the amortization claim (`≤ 2n`, `O(1)` amortized) is accurate. One small writing note: the original Step 5 says "average is constant" and "flat, instant cost" before naming `amortized` in Step 7 — fine, but the beginner gloss for `O(n)` should land in Beat 5 the first time the symbol shows, which the narration above does.

- **Bar height vs. value:** `barHeight` normalizes temps into pixel heights — visually helpful (warmer = taller) and reinforces "today is taller → pops the shorter waiters." Keep it; it makes the monotonic (decreasing down the stack) invariant visible.
