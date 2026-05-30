# Annotated-Canvas Conversion — Sliding Window

Topic: `algorithms/sliding-window` · 7 beats (one per derivation step) · wedge preserved at Beat 3.

Canvas model (mirrors the binary-search reference): one shared row of 10 cells
`[3, 1, 4, 1, 5, 9, 2, 6, 5, 3]`, window size `k = 3`. A bracket/overlay marks the
3 cells currently inside the window. The explanation that used to live in the side
card now sits ON the plane as a panel with an arrow to the exact cell(s) it talks about;
the real `fixed_window_sums` Python docks on the right and the active line(s) follow each beat.

Real `@sync` labels available in `algorithm.py`:
`sig`, `init_window`, `init_results`, `loop`, `slide`, `record`, `result`.

---

### Beat 1 — The setup · Someone keeps asking the same question
- **narration**: Here is a row of ten numbers. A friend points at the first three and asks, "what do these add up to?" Then slides one cell right and asks again — eight times, to the end. The real question: how little arithmetic can you get away with?
- **visual**: array — all 10 cells `live`. The first 3 cells (indices 0–2) toned as the active window; a bracket above them labelled `window · k=3`. Remaining cells (3–9) idle/normal. No counters yet.
- **panel**: top
- **arrow**: from the panel down to the bracket over cells 0–2 (the starting window).
- **codeLabels**: [] (setup — nothing computed yet; optionally `sig` for the function signature)
- **interaction**: none

---

### Beat 2 — The obvious thing · Add three. Slide. Add three. Slide.
- **narration**: The first idea: just do it. For each of the 8 windows, add its three numbers — that's 3×8 = 24 additions. But watch: any two side-by-side windows share two of their three numbers. You add those, then add them right back again.
- **visual**: array — window auto-advances one cell at a time (playback). Inside-window cells highlighted; on each slide, all 3 cells flash yellow (`recompFlash`) to show every number is re-added from scratch. Running line below: `sum = a + b + c = N`. Counter panel: "Total additions" climbing by +3 per slide (warning tone), "This slide +3".
- **panel**: bottom
- **arrow**: from the panel up to the two overlap cells shared between the previous and current window (the numbers being needlessly re-added).
- **codeLabels**: [] (this is the naive baseline; no line of the final sliding code matches re-adding from scratch — keep code dim, or fall back to `sig`)
- **interaction**: playback (auto-animates the window across the row)

---

### Beat 3 — The wedge · Drag the window. Watch only what changes.
- **narration**: Your turn. Grab the bracket and drag it one step right. Don't do mental math — just watch the cells. One number drops out of the left, one new number joins on the right, and the middle ones don't move at all.
- **visual**: array — draggable window (bracket) over the row; left/right step buttons for touch. Inside-window cells highlighted. As the user slides, tone the leaving cell (left edge) and the entering cell (right edge) distinctly; the middle cell stays neutral to show it's untouched. Live readout: `sum of cells i–i+2: N`.
- **panel**: top (main) + a small `note` panel for the wedge question.
- **arrow**: two short arrows from the note — one to the cell leaving on the left, one to the cell entering on the right.
- **panel (note)**: "The wedge question: when you slide by one, how many numbers actually change? How many stay exactly where they were?"
- **codeLabels**: `slide` (`window_sum = window_sum - arr[i - k] + arr[i]`) — the line the user is physically discovering by dragging.
- **interaction**: wedge (PRESERVED — the user must drag/step the window at least once before "Next" unlocks)

---

### Beat 4 — The derivation · Turn the picture into a sentence, then into math.
- **narration**: Two cells change per slide; the rest just sit there. Name them: one cell **leaves**, one **enters**, the middle **stays**. Call the running total `window_sum`. New total = old total, minus the leaver, plus the newcomer. Two operations — no matter how wide the window.
- **visual**: array — a single slide frozen mid-motion. Label the leaving cell `leaves`, the entering cell `enters`, the middle cell `stays`. Show the equation on the plane: `window_sum = window_sum − (leaver) + (newcomer)`, with `(leaver)` and `(newcomer)` color-matched to their cells. A small note restates the principle: we paid to add each number once, then reused that total forever — information reuse.
- **panel**: top (main, holds the equation) + bottom `note` ("The principle: information reuse — pay once, reuse forever.")
- **arrow**: from the `leaves` label to the left-edge cell, and from the `enters` label to the right-edge cell.
- **codeLabels**: `init_window` (the very first `window_sum = sum(arr[:k])` — paying once) and `slide` (`window_sum - arr[i-k] + arr[i]` — the two-op reuse). Optionally `loop` to show this repeats.
- **interaction**: none (or a single-step "advance one slide" playback to animate the leave/enter once)

---

### Beat 5 — The win · Count operations both ways. Then keep counting.
- **narration**: Watch the counters race. The obvious way adds k numbers every slide; the wedge way adds just 2. With k=3 it's a small lead. With a window of 100 across a million numbers, the obvious way takes about fifty times longer for the same answer.
- **visual**: array — same sliding window, but with a naive ↔ derived toggle on the plane (preserve the existing toggle). Two counters compared: "Total ops" climbing by +k (warning) in naive mode vs +2 (good) in derived mode. The window marches; same array, only the bookkeeping differs. The toggle lets the learner replay the same run both ways.
- **panel**: left (so it never covers the marching window or the toggle).
- **arrow**: from the panel to the "Total ops" counter (the number that tells the whole story).
- **codeLabels**: `loop`, `slide`, `record` — the per-slide work whose cost we're counting (`results.append(window_sum)` records each answer).
- **interaction**: playback (auto-animates; user can flip the naive/derived toggle to re-run the comparison)

---

### Beat 6 — The generalization · Same wedge. New question. What carries over?
- **narration**: Forget listing all eight sums. New question: what's the **biggest** three-in-a-row sum? Same slide, two operations per step — just remember the largest total you've seen so far, plus one comparison each step. The wedge doesn't care what you ask; it cares that the window's value changes a little at a time.
- **visual**: array — window slides across the row; each window's sum shown as it passes. A running "max so far" badge updates and lights up whenever a new window beats the record; the winning window stays marked. Shows that only the bookkeeping ("keep the max") changed — the slide is identical.
- **panel**: top
- **arrow**: from the panel to the "max so far" badge (the one new piece compared to Beat 4–5).
- **codeLabels**: `loop`, `slide`, `record` — the same incremental-maintenance lines; the generalization swaps what `record` does (track a max) but keeps the slide. (The shipped `algorithm.py` records all sums; note this in Notes.)
- **interaction**: playback

---

### Beat 7 — The pattern · Sliding Window.
- **narration**: That's the name — Sliding Window. Use it whenever you look at side-by-side stretches of a row and the answer can be nudged as the window moves, instead of rebuilt each time. The Python is docked on the right; trace one full pass.
- **visual**: array — full row shown calm/settled (no active window, or a faint full-width sweep). Below it, the three "pattern signals" as on-plane chips: "contiguous subarray of length k" · "longest / shortest window satisfying X" · "count substrings with property Y".
- **panel**: top (name + signals)
- **arrow**: none (or a single arrow from the panel to the docked code, "the Python is here").
- **codeLabels**: `sig`, `init_window`, `init_results`, `loop`, `slide`, `record`, `result` — light the whole function so the learner sees the complete shape they just earned.
- **interaction**: none

---

## Notes

- **Wedge preserved (Beat 3).** The current lesson gates step 3 on the user dragging/stepping the draggable window (`onWedgeInteraction` / `handleChange`). Keep `interaction: "wedge"` there — "Next" stays locked until the user moves the window at least once. The mobile-friendly left/right step buttons (min 44px targets) must route through the same handler so a tap also opens the gate, exactly as today.
- **The leaver/newcomer arrows are the load-bearing visual.** Beats 3–4 only land if the arrows point at the *single* cell leaving and the *single* cell entering — not the whole window. Tone the middle cell neutral so "stays" reads instantly. On a 10-cell row this is tight on mobile; consider widening the window to a 6–7 cell sub-view on small screens so the leave/enter cells are clearly separated.

- **Jargon taught on first use (content rule):**
  - Beat 1: "row of numbers" instead of "array" on first mention; introduce **window** plainly = "a frame around a few cells next to each other."
  - Beat 4: `window_sum` is introduced in words ("the running total") *before* the symbol appears, and the equation names cells as "leaver/newcomer," not `arr[i]`/`arr[i+k]`. If code-style `arr[i]` is shown, gloss it once: "`arr[i]` just means the number sitting at position i."
  - Beat 4: **information reuse** is stated as "pay to compute something once, then reuse it" — keep that plain-language gloss.
  - Beat 5: avoid raw Big-O. The current step 5 already speaks in concrete counts ("fifty times longer"), which is good — keep it count-based; if O(n)/O(k) is ever shown, gloss "grows in step with the list's length" once.

- **CONTENT BUGS / mismatches spotted in the current lesson:**
  1. **Symbol drift `k` vs `K` vs the `arr[i+k]` form.** Derivation step 4 writes the recurrence as `sum[i+1] = sum[i] − arr[i] + arr[i+k]` (newcomer at `i+k`), but the shipped `algorithm.py` line `slide` writes `window_sum = window_sum - arr[i - k] + arr[i]` (leaver at `i-k`, newcomer at `i`). Both are correct but use *different loop indexing* — the lesson's `i` is the window start, the code's `i` is the newcomer index. A beginner syncing text→code will be confused. In the conversion, narrate in "leaver / newcomer" words and let the highlighted `slide` line carry the exact code form; do not show the `sum[i] − arr[i] + arr[i+k]` symbolic version on the same beat as the code, or reconcile the two index conventions explicitly.
  2. **Step 4 names a variable `sum[i]` that doesn't exist in the code** — the code uses a single rolling `window_sum`, not an indexed `sum[]` array. Use `window_sum` (the real name) in the panel so text and code agree.
  3. **Beat 6 generalization isn't in `algorithm.py`.** Step 6 teaches "keep the maximum window sum" (max-subarray-of-length-k), but the shipped code only appends every sum (`record` → `results.append`). The `codeLabels` for Beat 6 therefore reuse `loop`/`slide`/`record` and the narration must say the *slide is identical*; the "track a max" change lives only in the visual/narration, not in this file. Flag if a second code variant is wanted later.
  4. **Step 5 quantification "fifty times longer" assumes k=100** but the canvas runs k=3. That's fine as a verbal extrapolation, but make clear on the plane that the live demo uses k=3 and the 50× figure is the same idea scaled up — otherwise the counters (+3 vs +2, barely different) seem to contradict the claim.
