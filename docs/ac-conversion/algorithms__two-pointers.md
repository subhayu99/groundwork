# Annotated-Canvas conversion — Two Pointers

Topic: `algorithms/two-pointers` · 7 derivation steps → 7 beats.

The visual stays a single horizontal **array** of 10 sorted cards
`[1, 3, 5, 7, 9, 10, 12, 15, 18, 20]`, target `17`. Two markers `L` (left)
and `R` (right) sit under the cards and slide along the row. The current
explanation moves ONTO the plane as a text panel; the real `algorithm.py`
docks on the right and lights the active `@sync` line(s) each beat.

`@sync` labels available in `algorithm.py`:
`sig`, `init`, `init_right`, `loop`, `compute`, `compare`, `found`,
`less`, `move_left`, `greater`, `move_right`, `notfound`.

---

### Beat 1 — The setup · Ten cards on a table. Find the pair that adds up.
- **narration**: Ten number cards lie in a row, smallest to largest. A friend names a total — say 17 — and asks for two cards that add up to it exactly. The question: how few cards must you touch?
- **visual**: array — all 10 cards shown live (idle/live tone), values readable, no card highlighted yet. A small floating tag reads `target = 17`. No `L`/`R` markers yet.
- **panel**: top
- **arrow**: none (the panel introduces the whole row, not one cell).
- **codeLabels**: `["sig"]` (the function signature — what we're about to build).
- **interaction**: none

---

### Beat 2 — The obvious thing · Try every pair until one works.
- **narration**: The honest way: pick a card, test it against every other. Nothing sums to 17? Pick the next, test the rest. For ten cards that's 45 tests — you'd touch cards over and over. The cards are sorted, but we haven't used that yet.
- **visual**: array — animate the brute-force scan. Highlight a moving pair `(i, j)`: card `i` toned as the anchor, card `j` sweeping rightward; already-tested pairs dim. A running counter shows comparisons climbing toward 45. Below the row: `arr[i] + arr[j] = …`, colored red when too big.
- **panel**: bottom
- **arrow**: from the panel up to the sweeping `j` card (the pair currently being checked).
- **codeLabels**: `[]` (naive method — not in the final `algorithm.py`; leave the code panel unlit / on `sig`).
- **interaction**: playback (auto-sweeps the pairs)

---

### Beat 3 — The wedge · Two fingers. One at each end. Move them.
- **narration**: Put one finger (call it L) on the smallest card, one (R) on the largest. Add them. You decide which finger to nudge. Just watch: when the sum is too small, which finger makes it bigger? Too big — which one makes it smaller?
- **visual**: array — all cards live. `L` marker under card 0, `R` marker under card 9, both highlighted. Below: `arr[L] + arr[R] = 1 + 20 = 21 (too big)`, the verdict word colored. User taps move buttons; markers slide and the sum/verdict update live.
- **panel**: top (the instruction) + a `note` panel: "The wedge question: if the sum is too small, which finger could you move to make it bigger? If it's too big, which one?"
- **arrow**: two short arrows — one from the panel down to the `L` card, one to the `R` card (the two fingers it's talking about).
- **codeLabels**: `["compute", "compare"]` (the per-step sum-and-test the fingers are mimicking).
- **interaction**: wedge (PRESERVED — user must move a pointer at least once before Next unlocks)

---

### Beat 4 — The derivation · Each move eliminates a whole row of pairs.
- **narration**: Look at `arr[L] + arr[R]`. Too small? R is already the biggest card left, so every pair using arr[L] is too small too — drop L, step it right. Too big? Mirror it: drop R, step it left. One look retires a whole side, not one pair.
- **visual**: array — `L` and `R` markers in place. Show the "too small" case frozen: shade the entire span of cards from `L` to `R` (other than the moving end) as the row of pairs being eliminated in one move; an arrow shows `L` about to step right. A `note` reminds: "Sorted is a promise the data keeps — each comparison cuts a whole side."
- **panel**: top
- **arrow**: a bracket spanning cards `L..R` labelled "all these pairs gone in one move", plus a short arrow on `L` pointing right (the step it takes).
- **codeLabels**: `["compute", "less", "move_left", "greater", "move_right"]` (the too-small → step-L and too-big → step-R branches).
- **interaction**: none

---

### Beat 5 — The win · Forty-five pairs becomes nine comparisons.
- **narration**: Brute force checks up to `n × (n − 1) / 2` pairs — 45 for ten cards. Two pointers touches each card at most once: L only moves right, R only moves left. They meet in the middle in at most `n − 1` steps. Nine comparisons. Done.
- **visual**: array — auto-run the real two-pointer algorithm to completion. `L` slides right, `R` slides left, each frame retires its end (dim the card just passed), comparison counter ticks 1…up to 9, and the matching pair turns green when the sum hits 17. A side-by-side stat: `brute force 45  ·  two pointers 9`.
- **panel**: bottom (so it never sits over the converging markers).
- **arrow**: from the panel to the meeting point where `L` and `R` converge.
- **codeLabels**: `["loop", "compute", "compare", "found"]` (the loop converging and the successful return).
- **interaction**: playback (press play; fingers converge)

---

### Beat 6 — The generalization · Same fingers. New questions.
- **narration**: The fingers don't care what they compare. Palindrome? One at each end, step inward while letters match — `n / 2` moves. Most water between two lines? Two ends, always move the shorter (it's the bottleneck). What they need is a *direction*: sortedness, symmetry, height.
- **visual**: custom (still on the same plane) — split into two mini-scenes stacked or side by side: (a) a word like `R A C E C A R` with two markers stepping inward, matching letters tinted green; (b) a row of vertical bars (line heights) with markers at the ends and the shorter bar flagged "move this one". The original number row can dim into the background as the "first example".
- **panel**: left (keeps the two scenes clear on the right).
- **arrow**: one arrow to the inward-stepping letter pair in scene (a); one to the shorter bar in scene (b).
- **codeLabels**: `["loop", "compare"]` (the same converge-and-compare skeleton, reused regardless of what's compared).
- **interaction**: playback (each mini-scene steps inward once or twice to show the shared motion)

---

### Beat 7 — The pattern · Two Pointers.
- **narration**: That's the name: Two Pointers. Use it whenever a row has a *direction* — sorted order, symmetry, a one-way pattern — and each comparison can retire a whole side. Signals: "sorted array + pair sum/target", "palindrome", "remove duplicates in place", "container with most / trap rainwater".
- **visual**: array — the solved board: the matching pair (cards summing to 17) glowing green with a ✓; every other card dimmed/retired. The four signal phrases listed as small chips beside the row. A quiet prompt: "open the code panel to read it in Python."
- **panel**: top, holding the name + the bulleted pattern signals.
- **arrow**: from the panel down to the green matched pair (the answer the whole lesson built to).
- **codeLabels**: `["found", "notfound"]` (the two ways the routine ends — pair found, or pointers crossed with no match).
- **interaction**: none

---

## Notes

**Jargon taught on first use (content rule).** The current derivation already
leans plain-spoken, but several CS terms appear unexplained and MUST be glossed
in-canvas on first appearance:

- **"pointer"** — beat 3 is the first real use. Gloss it as simply "a finger
  marking a position in the row"; the lesson's own finger metaphor does this, so
  keep `L`/`R` framed as fingers and only later name them "pointers" (beat 7).
- **`arr[L]`, `arr[R]`** — bracket/indexing syntax first appears beats 3–4. Add a
  one-clause gloss the first time: "`arr[L]` just means *the card the L finger is
  pointing at*." Don't assume the reader knows array indexing.
- **`n`** — first appears in beat 5's `n × (n − 1) / 2` and `n − 1`. Gloss once:
  "`n` is just how many cards there are (here, 10)."
- **Big-O is NOT named in this lesson** and that's fine — the lesson teaches the
  win in concrete counts (45 vs 9) rather than `O(n²)` vs `O(n)`. Do **not**
  introduce `O(...)` notation here; if a later beat tempts it, keep the concrete
  numbers. (If house style requires the symbol, it must be taught: "we write this
  growth as O(n) — work grows in step with the number of cards.")

**Content bug / faithfulness flags spotted in the current lesson:**

1. **Beat 2 arithmetic is loose.** The text says "9 + 8 + 7 + … + 1 = 45 pairs"
   and "For a thousand cards, half a million pairs." Both are right
   (1000·999/2 = 499,500 ≈ half a million), but the visualizer's `NaiveViz`
   counts comparisons differently and may stop early on a found pair, so the
   on-screen counter can disagree with the stated "45". When wiring the playback,
   either let it run the full 45 (no early stop) or change the panel to "up to 45"
   to stay honest.

2. **Beat 5 "nine comparisons" is the best/worst-case headline, not the count for
   THIS array.** With `arr = [1,3,5,7,9,10,12,15,18,20]`, target 17, the two
   pointers actually find `5 + 12` (indices 2 and 6) well before nine steps — the
   real run is ~5 comparisons. "Nine" is the *worst case* (`n − 1`). Keep the
   "45 → 9" headline as the bound, but if the playback shows the real run finishing
   in ~5, add "(this lucky board finishes even sooner)" so the number on screen
   doesn't contradict the panel.

3. **`compare` vs `compute` labels.** `algorithm.py` splits the sum (`compute`)
   from the equality test (`compare`). The original `visualizer.tsx` only uses
   `compute`/`found`/`move_left`/`move_right` (it never lights `compare`, `less`,
   `greater`, `loop`). The plan above uses the richer real labels so the docked
   code lights the precise branch each beat is about — verify these labels resolve
   against the parsed `labelToLine` before shipping.

**Mobile / dense-visual:** beat 6 is the densest — two mini-scenes (word +
bars). On narrow screens stack them vertically and shrink to one comparison each,
or fall back to showing only the palindrome scene with the bars as a caption.
Beat 2's full 45-pair sweep should be skippable (a "skip to result" affordance)
so a phone user isn't stuck watching 45 frames. The single shared array row keeps
every other beat light enough for mobile.
