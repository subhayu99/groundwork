# Annotated-canvas conversion — data-structures / Strings

Source lesson: `src/categories/data-structures/topics/strings/`
Reference form: `src/app/sandbox/annotated-canvas/page.tsx`
Contract: `src/shared/lesson/types.ts` (`LessonSpec` / `LessonBeat`)

Canvas: `{ width: 860, height: 470 }` (same design box as the reference).
Code source: `algorithm.py`. Real `@sync` labels available:
`source`, `index_read`, `length`, `slice`, `concat`, `find`, `rebuild`.

The running example string is `"the quick brown fox"` (19 characters, indices 0–18),
searching for the word `"brown"` (5 chars, found starting at index 10). A second tiny
string `"hello"` is used for the immutability beats.

Each derivation step becomes one beat. The wedge (step 3, the drag slider) is preserved
as a `wedge` interaction.

---

### Beat 1 — The setup · Find a word inside a sentence
- **narration**: Someone hands you a sentence and asks: "Is the word `brown` in here, and where?" You don't see five neat boxes — you see one long stream of letters. So how do you actually go find `brown` inside it?
- **visual**: `array` — a single row of 19 character cells spelling `the quick brown fox` (spaces shown as a faint dot `·`), index numbers under each cell. All cells idle/live tone. None highlighted yet — this is just the raw text the way you first meet it.
- **panel**: top
- **arrow**: none (nothing located yet — we're posing the question, not pointing at an answer).
- **codeLabels**: `["source"]`  (the line `s = "the quick brown fox"`)
- **interaction**: none

---

### Beat 2 — The obvious thing · Walk character by character
- **narration**: Start at box 0. Compare the next five letters to `brown`. No match? Slide one box right and retry. For a 19-letter sentence and a 5-letter word that's 15 starting spots, up to 5 checks each — about 75 comparisons. Slow, but it works. And jumping straight to box 10 costs nothing.
- **visual**: `array` — same 19-cell row. A 5-cell "candidate window" is toned (highlighted with a sky tone) sitting over an early, non-matching position, e.g. indices 4–8 (`quick`). Cells already passed (0–3) shown dimmed/visited to suggest the slide. Index numbers shown.
- **panel**: bottom
- **arrow**: from the panel up to the left edge of the highlighted 5-cell window (the current starting box), showing "this is one candidate position".
- **codeLabels**: `["find"]`  (the substring-search line `i = s.find("brown")` — the operation this scan implements)
- **interaction**: playback (auto-slides the window position-by-position, the way the existing `NaiveSearchViz` plays through and counts comparisons)

---

### Beat 3 — The wedge · Drag the highlight, read what's underneath
- **narration**: Drag the slider to choose a starting box. The five letters under the highlight are your candidate. Slide it across. Notice: landing on box 12 is no harder than box 2 — reading any single letter is one quick lookup, exactly like an array. So what really makes a string different from a row of letter-boxes?
- **visual**: `array` — the 19-cell row with a user-controlled 5-cell highlight window (driven by the slider, mirroring the existing `SliderViz`). When the window sits on 10–14 the cells turn green and read `= "brown" ✓`. A small live readout shows `s[start:start+5] = "…"`. Index numbers shown.
- **panel**: left (keeps the right side clear for the slider control and the moving highlight)
- **arrow**: from the panel to the highlighted candidate window (the five cells currently under the slider).
- **panel2 (note)**: bottom — "The wedge question: what's actually different between a string and an array of characters? Anything at all?"
- **codeLabels**: `["slice", "find"]`  (sliding re-slices the candidate then compares it — `word = s[4:9]` and `i = s.find("brown")`, matching the existing viz's `onActiveLine`)
- **interaction**: wedge (user MUST drag the slider before continuing — preserved from the current lesson)

---

### Beat 4 — The structure · A string is an array of characters
- **narration**: That's the whole secret: a string is just an array of characters — boxed in order, side by side in memory — so every array move you learned still works. The one twist: in Python, Java, and JavaScript a string is *immutable* (can't be changed once made). `s[0] = 'T'` simply isn't allowed; to "change" it you build a brand-new string.
- **visual**: `array` — the short string `hello` shown as 5 cells with index numbers. The cell `s[0]` is toned to draw the eye, with a small "locked / can't overwrite" cue. No counters yet — this beat reveals the structure and its one twist.
- **panel**: top
- **arrow**: from the panel to cell `s[0]` (the box you're *not* allowed to overwrite in place).
- **codeLabels**: `["index_read", "rebuild"]`  (`first = s[0]` — indexing works just like arrays; `caps = s.upper()` — the "can't mutate, build a new one" line)
- **interaction**: none

---

### Beat 5 — The operations · Indexing is free, building is not
- **narration**: Reading one letter `s[i]` is O(1) — "O(1)" means instant, same cost however long the string is. A slice `s[i:j]` copies that span (cost grows with its length). Joining two strings copies both. The trap: gluing letters on with `+=` in a loop re-copies everything each time and quietly explodes — use a list and `join` instead.
- **visual**: `array` / `cascade` — the `hello` row, with action buttons (preserve existing `ImmutabilityViz`): "replace s[0]" and "append '!'". Each press flashes the edited cell and grows a running "characters copied so far" counter, making the copy cost visible. Optionally a small cost legend (`s[i]` instant, `s[i:j]` copies span, `+=` in a loop explodes).
- **panel**: bottom
- **arrow**: from the panel to the "characters copied so far" counter (the number that keeps climbing — that's the hidden cost).
- **codeLabels**: `["index_read", "slice", "concat", "rebuild"]`  (the four cost lines: `s[0]`, `s[4:9]`, `"hi " + s`, `s.upper()`; the live viz emits `concat` on append and `rebuild` on replace)
- **interaction**: playback (user clicks the edit buttons; counter animates — same hands-on behavior as today)

---

### Beat 6 — When it fits · Text, tokens, addresses, URLs
- **narration**: Strings are everywhere because most data the world hands you is text — log lines, JSON keys, emails, URLs, error messages. Anywhere you'd say "this thing has a name," there's probably a string. Two habits: build text in a list and join at the end; to search, lean on built-in functions over a hand-written scan.
- **visual**: `custom` — a small labelled gallery of real-world string examples stacked as chips/rows: a URL, an email, a JSON key `"name"`, a log line, an error message — each rendered as its own little character strip to reinforce "all just strings." The chip whose pattern is being highlighted (e.g. the URL) is toned.
- **panel**: top
- **arrow**: from the panel to the cluster of example chips (the "all of these are strings" group).
- **codeLabels**: `["find", "concat"]`  (the two everyday habits: searching → `find`, building text → `concat`/join)
- **interaction**: none

---

### Beat 7 — The structure · String
- **narration**: The name is the obvious one: a *string*. Mental model — an array of characters, immutable from the outside, indexed in constant time (instant lookups). Almost every array cost rule carries straight over; the only new rule is that "changing" one character means quietly building a whole new string.
- **visual**: `array` — the full `the quick brown fox` row, calm/settled tone (the lesson resolved), and a compact cost table beside or below it: `s[i] → O(1)`, `len(s) → O(1)`, `s[i:j] → O(j−i)`, `a + b → O(n+m)`, `repeat += → way too long`, `find → O(n)–O(n·m)`. Mirrors the existing `SummaryViz`.
- **panel**: bottom
- **arrow**: from the panel to the cost table (the takeaway card the learner leaves with).
- **codeLabels**: `["source", "index_read", "length", "slice", "concat", "find", "rebuild"]`  (the whole interface lights up — this beat is the full recap; or narrow to `["index_read", "rebuild"]` if a lighter highlight reads better)
- **interaction**: none

---

## Notes

- **Wedge preserved**: Beat 3 keeps the drag-the-slider gate (`interaction: "wedge"`). The runtime should not enable "Next" until the user moves the slider at least once — same as the current `SliderViz` calling `onWedgeInteraction`. The slider control sits on the right, so the panel is placed `left` and the arrow points right toward the highlighted window — they must not overlap the slider track.

- **Two different example strings**: Beats 1–3 and 6–7 use the 19-cell sentence `"the quick brown fox"`; beats 4–5 switch to the 5-cell `"hello"` to demo immutability/copy cost. Make the visual transition between the long and short string explicit so it doesn't look like a glitch. 19 cells at the reference cell width won't fill 860px the same way 15 array cells do — recompute `X0`/stride so the row stays centered, and shrink cells on mobile (the existing viz already drops to 15px cells with 2px gaps for mobile — carry that over).

- **Mobile density**: 19 character cells + index labels is the densest visual in the set. On narrow screens, shrink cells (existing `MOBILE_CELL = 15`, `MOBILE_GAP = 2`) and consider hiding index numbers below a breakpoint. The cost table in beats 5 and 7 should wrap to a single column on mobile.

- **`find` vs slice labeling**: the naive scan in beat 2 is conceptually `s.find("brown")`, but the *mechanism* the slider reveals in beat 3 is repeated `slice` + compare. That's why beat 2 lights `find` (the operation) and beat 3 lights `slice` + `find` (the mechanism + the conceptual operation), exactly as the existing `SliderViz.onActiveLine` already emits.

- **CONTENT — jargon that must be taught on first use (the current lesson is mostly good, but a few terms appear bare):**
  - `O(1)` / `O(j−i)` / `O(n+m)` — Big-O notation appears in step 5 (and the summary table) with no plain-words gloss the very first time. The current step-5 text *does* gloss O(1) as "instant — same cost no matter how long the string is," which is good; make sure that plain-words clause lands on the FIRST O(...) the learner sees (beat 5). Gloss `O(j−i)` as "copies that span" and `O(n+m)` as "copies both" inline.
  - `immutable` — step 4 uses the *behavior* ("can't be edited in place") but never names it; step 7 then drops the bare word "immutable." Teach the word on first use in beat 4: "immutable (can't be changed once made)."
  - `slice` / `concatenate` — fine in context but should be shown as the plain action ("copy out a span" / "glue two strings"), which the narration above does.
  - `s[i]`, `s[i:j]`, `+=`, `len`, `join` — code syntax. First appearance of `s[i:j]` and `+=` should read as "a slice / gluing letters on," handled in the narration above. `len(s)` first appears in beat 7's table — gloss as "its length."

- **CONTENT BUG / inaccuracy spotted**: step 5's original text says repeated `+=` "cost grows like the square of the length" (O(n²)). That's the classic teaching claim and is correct for naive implementations, BUT CPython specifically optimizes in-place `s += x` in a tight loop, so it's not *guaranteed* quadratic in real CPython. The lesson's own summary table softens this to "repeat += → way too long," which is the safer phrasing. Recommend keeping the narration vague ("quietly explodes / re-copies everything so far") rather than asserting a hard O(n²) — the rewritten narration above does this. Not a hard bug, but worth not over-claiming to a beginner.

- **Arrow geometry**: reuse the reference's `Arrow` + marker (`ac-arrow`) and the `Bracket` helper. Beat 4's "locked s[0]" and beat 6's "all of these are strings" cluster are the only non-row visuals; keep their arrow endpoints anchored to the toned element's edge, not its center, so the arrowhead doesn't sit on top of the glyph.

- **Code panel default**: keep it docked open (`showCode = true`) as in the reference; the strings interface is short (8 meaningful lines) so it never needs scrolling on desktop.

---

## Peer review
- **verdict: needs-work**

- issues:
  - **Beat 1 + "visual" field across ALL beats — contract mismatch (feasibility-blocking).** The plan writes `visual: array | grid | custom` and panel slots `panel: top | bottom | left`, but `LessonBeat` (src/shared/lesson/types.ts) has NO `visual:"array"` mode and NO named panel slots. A beat's `visual` is either an SVG `ReactNode` or a render-fn; panels are an array of `{left, top, width}` in canvas coords (see src/app/sandbox/annotated-canvas/page.tsx, `panel:{left:150,top:28,width:560}`). Fix: rewrite every beat to (a) supply `svg` built from a `CharRow`/`Cells`-style SVG group, and (b) give each panel explicit `left/top/width` numbers. The current shorthand cannot be handed to `LessonRuntime` as-is.
  - **Arrows are prose, not coordinates (feasibility-blocking).** Every beat says e.g. "arrow: from the panel up to the left edge of the highlighted 5-cell window." The contract `LessonArrow` requires literal `{x1,y1,x2,y2}`. Fix: compute endpoints from a `cellX(i)`-style helper (the 19-cell row needs its own `X0`/`STRIDE`, NOT the reference's 15-cell `CW=40,GAP=6`). Note Beat 95 already says to recompute X0/stride — carry that all the way into the arrow coords.
  - **Beat 2/3/5 "preserve existing NaiveSearchViz/SliderViz/ImmutabilityViz" — these are the OLD card-system vizzes (visualizer.tsx), built with `<div>`/flexbox + `usePlayback`, not SVG.** They will NOT drop into the SVG canvas plane unchanged. The plan says "mirroring the existing SliderViz" as if reusable; in practice the interactive logic (slider state, `slice===PATTERN` → emit `[slice, find]`, copies counter) is portable but the DOM rendering must be re-authored as an SVG render-fn that calls `api.onActiveLine` / `api.onInteractionDone`. Fix: state explicitly that only the *logic* ports, and the render is rebuilt in SVG — otherwise an implementer will try to embed a flexbox component in an `<svg>`.
  - **Beat 3 — `s[start:start+5]` readout vs the `s[4:9]` codeLabel may confuse.** Narration/readout shows the live slider slice (`s[10:15]`="brown" at match), but codeLabels point at the static `word = s[4:9]` ("quick") line. This is defensible (line is the *mechanism*), but a 15-year-old watching `s[10:15]` light up the `s[4:9]` line will see a mismatch. Fix: either gloss in narration ("the code line shows one example slice, `s[4:9]`; the slider does the same slice at whatever position you pick"), or have the render-fn emit a dynamic marker. Don't leave the index discrepancy silent.
  - **Beat 5 — over-claim risk on `+=`, and the plan contradicts the live ground truth.** The plan's NOTE (line 107) correctly recommends NOT asserting hard O(n²) to a beginner, and beat 5 narration is appropriately vague ("quietly explodes"). GOOD. But the source derivation.tsx step 5 STILL says "the cost grows like the square of the length." Flag: the conversion narration and the ground-truth lesson now disagree. Fix: pick one. Recommend the softened version in both, and add a one-line note that the conversion intentionally diverges from derivation.tsx here (so a reviewer doesn't "restore fidelity" by re-adding the n² claim).
  - **Beat 5 BEGINNER-SAFETY — `O(j−i)` and `O(n+m)` appear before they're grounded.** The narration glosses O(1) ("instant") but then says "a slice s[i:j] copies that span" and "joining copies both" without ever showing what n, m, i, j ARE to a kid who's never seen a variable-as-length. The codeLabels expose `s[4:9]` and `"hi " + s`. Fix: on first use, say "n and m just mean the lengths of the two strings" inline, mirroring the inline gloss the plan already mandates for O(1).
  - **Beat 6 — `custom` gallery is the one genuinely new visual; confirm it's hand-rolled SVG.** "chips/rows… each rendered as its own little character strip" is buildable, but NOT from ArrayViz/GridViz (those are value-array vizzes, not labelled-chip galleries). The plan lists feasibility against "ArrayViz, GridViz, TreeViz, GraphViz, StackPanel" — none of those produce this. Fix: state Beat 6 is bespoke SVG (`<text>` chips + per-char mini-rows), like the reference's `Bracket`/`Arrow` helpers, and budget for it; don't imply a primitive covers it.
  - **Beat 7 — codeLabels lighting all 7 lines at once is fine, but the cost-table claim `repeat += → way too long` must match Beat 5's softened wording, and `find → O(n)–O(n·m)` introduces `n·m` with no gloss.** Ground truth algorithm.py line 17 says "O(n*m) naive, O(n+m) with KMP" — KMP is correctly hidden from the beginner, good. But `O(n·m)` in the summary table is the first time the learner sees a *product* of two lengths. Fix: gloss as "up to length-of-text times length-of-word" or drop the `·m` term for beginners (the lesson never explains why search can be n·m). As written a 15-year-old hits an unexplained `n·m`.
  - **Minor — Beat 4 "locked / can't overwrite" cue on `s[0]`:** feasible as SVG (a small lock glyph + `no`-tone rect), but the reference has no lock primitive; note it's a bespoke marker so it isn't assumed free. Also confirm the long→short string swap (19-cell sentence → 5-cell "hello") between beats 3 and 4 animates rather than hard-cuts (Note line 95 flags this — keep it in the beat itself, not just the notes).
  - **Verified-correct (no action):** indices ("brown" at 10–14, 19 chars 0–18), the 15-positions/75-comparisons count, `s[4:9]`="quick", the `@sync` label set (source/index_read/length/slice/concat/find/rebuild all exist in algorithm.py), and the wedge gate (SliderViz `onInteraction` → `onWedgeInteraction`) all check out against ground truth.
