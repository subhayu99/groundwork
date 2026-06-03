# Annotated-Canvas Conversion — Binary Search

Topic: `algorithms/binary-search` · 7 derivation steps → 7 beats.
Canvas coordinate box: matches the reference prototype (`VW=860, VH=470`); a 15-cell array (`[3,7,11,14,19,23,27,32,38,44,51,59,68,74,81]`) searching for the value **27** (index 6).

Real `@sync` labels available in `algorithm.py`: `sig`, `init`, `loop`, `mid`, `compare`, `found`, `less`, `lo_update`, `greater`, `hi_update`, `notfound`.

---

### Beat 1 — The setup · A sorted phone book. Find page 27.
- **narration**: You're holding a sorted phone book — a thousand names, all in order. Someone says "find 27." You wouldn't start at page one. You'd flip to the **middle**, check if you've gone too far, and throw away half. Then repeat.
- **visual**: array. All 15 cells "live" (full opacity). The middle cell (index 7, value 32) toned as `mid` (sky highlight) with a small `mid` marker beneath it. Everything else idle/normal.
- **panel**: top.
- **arrow**: from the top panel down to the highlighted middle cell (index 7).
- **codeLabels**: `["sig"]` — the function signature line, so the reader sees the whole machine exists before any logic runs.
- **interaction**: none.

---

### Beat 2 — The obvious thing · Scanning throws away the sortedness.
- **narration**: The dumb way: page 1, page 2, page 3… up to a thousand checks. But the book is **sorted**, and we've barely used that. Each page only says "not here" — never *how far away* she is. What if one check told us where she is?
- **visual**: array. Cells 0–5 toned `visited` (faded "already scanned" tone), cell 6 (value 27, the target) toned `mid` to show how far a left-to-right scan must crawl. Cells 7–14 stay idle/live.
- **panel**: bottom (so it doesn't cover the crawling cells).
- **arrow**: from the bottom panel up to the run of visited cells (~index 3), pointing at the wasted scanning work.
- **codeLabels**: `["sig"]` — still framing; the naive scan isn't this algorithm, so don't light real loop lines. (Setup beat: `[]` is also acceptable if we prefer nothing lit here.)
- **interaction**: none.

---

### Beat 3 — The wedge · Guess a page — half the book vanishes.
- **narration**: Guess any page — say you land on **59**. It's bigger than 27, and because the book is sorted, *everything to its right is bigger too*. All of it — gone, in one look. That's the entire trick.
- **visual**: array. Cells 11–14 toned `gone` (dimmed, dropped out of the search). Cell 11 (value 59) toned `mid` as the guess. A `Bracket` spanning cells [11..14] labeled "all gone in one look". Cells 0–10 stay live.
- **panel**: top (main narration) + a second **note** panel lower-center holding the wedge question.
- **arrow**: from the top panel down to the guessed cell (index 11).
- **codeLabels**: `["greater", "hi_update"]` — the guess (59) was too big, so the live algorithm would take the `arr[mid] > target` branch and pull `hi` inward. Lights the real "discard the right half" lines.
- **interaction**: **wedge** — PRESERVE. The user must click a cell to collapse half the array before "Next" unlocks. Wedge question on the note panel: "if every check halves what's left, how many checks until just one page remains?"

---

### Beat 4 — The derivation · Two markers. Always check the middle.
- **narration**: Hold two markers — `lo` (low) at the start, `hi` (high) at the end of what's still possible. Check the **middle**. Match? Done. Too small? answer's to the right, push `lo` past it. Too big? pull `hi` before it. When they cross, it's absent. Each check kills a whole side.
- **visual**: array. All cells live; markers drawn beneath: `lo` under index 0, `hi` under index 14, `mid` under index 7 (toned `mid`). This is the canonical two-pointer frame.
- **panel**: top.
- **arrow**: from the top panel down to the `mid` cell (index 7).
- **codeLabels**: `["init", "loop", "mid"]` — set `lo`/`hi`, enter the `while lo <= hi` loop, compute `mid = (lo + hi) // 2`. The three lines that establish the pointers and the midpoint.
- **interaction**: none. (Optional **playback** if we want the lo/hi/mid markers to animate one halving as a teaser — but keep the canonical static frame as default to avoid stealing Beat 5's cascade.)

---

### Beat 5 — The win · Halving a million takes about twenty steps.
- **narration**: Scanning a thousand pages: up to **1,000** checks. Binary search: about **10**. Make it a million — scanning needs a million; halving needs about **20**. "log" just means *how many times you halve to reach 1*. That gap is why every sorted-data system runs on this.
- **visual**: custom (cascade). A row of pills showing the search space collapsing by half each step: `1000 › 500 › 250 › 125 › 62 › 31 › 15 › 7 › 3 › 1`, with a caption "1,000 → 1 in ~10 halvings · a million → ~20". This replaces the array for one beat.
- **panel**: top.
- **arrow**: none (the cascade itself is the argument; an arrow would clutter it). Optionally a small bracket under the full row labeled "~10 halvings".
- **codeLabels**: `["loop", "mid"]` — the loop + midpoint are exactly the lines that run once per halving, so they map directly to the cascade's step count.
- **interaction**: **playback** — auto-animate the pills appearing left-to-right, one halving per tick, so the reader *feels* the count being small. (Static fallback is fine on reduced-motion.)

---

### Beat 6 — The generalization · Anywhere answers go from "no" to "yes."
- **narration**: The phone-book version finds an exact value. The deeper version finds the **boundary** between "too small" and "big enough." Ask: "smallest ship that finishes the deliveries in 14 days?" — no list at all, but a bigger ship is always easier, so answers line up one way. Guess the middle, throw away half.
- **visual**: custom (boundary). A row of 10 pills: first 6 toned `no` ("ship too small"), last 4 toned `yes` ("big enough"), with a labeled marker "binary-search this boundary" and a `▾` pointer at the no→yes flip. Sub-labels "ship too small" / "big enough" under each side.
- **panel**: top.
- **arrow**: the `▾` marker at the boundary acts as the pointer (panel describes the flip it points to).
- **codeLabels**: `["compare", "less", "greater"]` — the three-way decision (`==`, `<`, `>`) is the same machinery, just answering "feasible?" instead of "equal?". Lights the comparison branch lines to show the structure is identical.
- **interaction**: none. (Optional **playback**: animate a guess landing mid-row and the wrong side dimming, mirroring Beat 5's halving on the no/yes line.)

---

### Beat 7 — The pattern · Binary Search.
- **narration**: That's the name. Two conventions: `lo ≤ hi` (closed bounds) or `lo < hi` (half-open) — pick one and stop second-guessing. You'll spot it when you see: a sorted array + find / find-insert-position; "smallest/largest value such that…"; "minimum X to make all Y work"; any "does this work?" that flips no→yes once as you turn a dial.
- **visual**: array. All cells toned `gone` except the target cell (index 6, value 27) toned `found` with a `✓` marker — the search has resolved to one cell.
- **panel**: top (holds the title + the bulleted pattern signals).
- **arrow**: from the panel down to the found cell (index 6).
- **codeLabels**: `["found"]` — `return mid`, the success line: the algorithm has a name and an answer.
- **interaction**: none.

---

## Notes

- **Wedge preserved (Beat 3).** The current lesson's only gating interaction is the click-to-halve step. It MUST stay a `wedge`: "Next" should not unlock until the user clicks a cell and watches a half disappear. In the live visualizer this is `ClickToHalveViz` with `onWedgeInteraction`; map it to `onInteractionDone`. The interactive visual should emit the *real* branch label via `onActiveLine` based on which cell the user clicks (`compare/found` on a hit, `lo_update` when `arr[mid] < target`, `hi_update` when `>`), overriding the static `codeLabels`.

- **Generalization preserved (Beat 6).** The ship-capacity / no→yes boundary is the lesson's whole "this is bigger than sorted arrays" payoff. Keep it as its own beat with the boundary visual; don't fold it into Beat 7.

- **Jargon taught inline (content rule).** The original cards drop several terms with no plain-words gloss on first use. Fixes baked into the narration above:
  - `lo` / `hi` — gloss as "low / high markers" on first use (Beat 4). The current derivation introduces `lo`/`hi` as bare `<code>` with no expansion.
  - `mid` / `mid = (lo + hi) / 2` — say "the middle" before showing the formula (Beats 1, 4).
  - `arr[mid]` — the original Step 4 uses `arr[mid]`, `arr[mid] < target`, etc. as the *first* array-indexing syntax in the lesson with no explanation. Beat 4's narration says "check the middle" in words; the literal `arr[mid]` only appears in the docked code, where the active-line highlight does the teaching. If any panel shows `arr[mid]`, add a one-clause gloss: "`arr[mid]` = the value sitting at the middle position."
  - **`log` / `log₂(1,000)` — CONTENT BUG.** Original Step 5 writes `log₂(1,000) ≈ 10` with zero explanation of what a logarithm is — a hard violation of the "15-year-old, zero CS" rule. Beat 5's narration now defines it in plain words: "log just means how many times you halve to reach 1." Keep that clause; never show `log₂` bare.
  - `bisect` / B-trees / "index pages of your database" — original Step 5 name-drops `bisect` and B-trees. These are flavor, not load-bearing; keep them as optional "you'll meet these later" color, but they must not be the thing a beginner has to understand to pass the beat. Beat 5 keeps only `bisect` as a light reference.

- **Mobile / dense visuals.** The 15-cell row at `CW=40, GAP=6` is ~684px wide — wider than a phone. On mobile, shrink cells (the live visualizer already uses `cell=22, gap=3` on mobile) or allow horizontal scroll of the canvas. Beat 5's 10-pill cascade (`bw=58`) and Beat 6's 10-pill boundary (`bw=48`) are also wide; on narrow screens reduce pill width or wrap. Panels are positioned in canvas space and scale with the canvas, so they stay anchored, but verify the top panel (`top≈24–28`) doesn't overlap the cascade/boundary rows on the shortest beats.

- **Arrow targets are exact.** Each array beat points at a *specific* index (Beat 1→7, Beat 3→11, Beat 4→7 mid, Beat 7→6 found), matching the reference prototype. Keep arrows short and vertical so they read as "this exact cell," not a vague gesture.

- **Marker consistency.** `lo`/`hi`/`mid`/`✓` markers render beneath cells (below `CY+CH`); the `mid`-tone fill is the in-cell highlight. Don't double-encode (e.g., both a `mid` marker and a redundant bracket) on the same beat except Beat 3, where the bracket is the whole point ("the half that vanished").
