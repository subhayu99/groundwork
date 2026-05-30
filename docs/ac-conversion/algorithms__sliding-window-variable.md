# Annotated-Canvas Conversion — Sliding Window (Variable)

Topic: `algorithms/sliding-window-variable` · 7 beats (one per derivation step)
String used on canvas: `"abracadabra"` (matches `visualizer.tsx`, const `S`).
Code source: `algorithm.py` (`longest_unique_substring`), @sync labels available:
`sig`, `expand`, `check`, `contract`, `record`, `update`, `result`.

The canvas primitive throughout is **array** (a row of letter cells), with two
markers `L` (left edge) and `R` (right edge) — the same `CharCells` layout the
current visualizer draws. In-window cells are toned/highlighted; out-of-window
cells are dimmed.

---

### Beat 1 — The setup · The longest stretch of letters with no repeats
- **narration**: Here is a row of letters. The question: what is the longest run you can read left-to-right without ever repeating a letter? Unlike the fixed window, we don't fix the length — we protect a *property*: every letter inside is different.
- **visual**: array — all 11 letters of `"abracadabra"` shown in a row, all toned the same (neutral, none highlighted yet, no `L`/`R` markers, or both parked at index 0). Calm "here's the input" state.
- **panel**: top
- **arrow**: none (or a soft bracket spanning the whole row labelled "find the longest no-repeat run").
- **codeLabels**: `["sig"]` (the function signature line — what we're about to build).
- **interaction**: none

---

### Beat 2 — The obvious thing · Check every possible stretch
- **narration**: The slow way: from every starting spot, walk right until a letter repeats; remember the longest clean run. For an n-letter string that's about n²/2 letter-checks. Worse, we re-verify the same letters again and again — throwing away facts we already proved.
- **visual**: array — same row, but showing the naive scan: one start cell highlighted and a sub-run growing rightward from it (mirrors `NaiveScanViz`, which animates start/end and a `checks` counter). Cells outside the current `[start..end]` run are dimmed. A small "checks: N" readout climbs.
- **panel**: bottom (so the growing run on the row stays uncovered).
- **arrow**: from panel up to the leftmost (start) cell of the current scan run.
- **codeLabels**: `[]` (naive baseline — not the real algorithm; keep code line-quiet, or fall back to `["sig"]`).
- **interaction**: playback (auto-animates the every-start scan, like the existing Play-through).

---

### Beat 3 — The wedge · Two ends. Move them independently
- **narration**: Two markers: `L` on the left edge of your run, `R` on the right edge. "Expand" adds the next letter on the right; "contract" drops the leftmost letter. Try to find the longest no-repeat run yourself — notice you never restart, you only grow R or shrink L.
- **visual**: array — the row with live `L` and `R` markers under the cells; in-window cells toned (sky), outside dimmed. A readout shows the current run, its length, and a unique ✓ / has-repeat ✗ flag (matches `ManualWindowViz`). Two buttons: `expand R →` and `contract L →`.
- **panel**: top (main narration); plus a **note** panel for the wedge question.
- **arrow**: none for the main panel; the note panel sits near the buttons. (Optional: arrow from note to the `L`/`R` markers.)
- **note panel text**: "The wedge question: when does R *want* to move? When does L *have* to move? Are they ever moving for the same reason?"
- **codeLabels**: `[]` (no derived code revealed yet — the learner is deriving the rule by hand).
- **interaction**: **wedge** — user MUST press expand/contract at least once before "Next" unlocks. (Preserve existing `onInteractionDone` gate from `ManualWindowViz`.)

---

### Beat 4 — The derivation · Right grows greedily. Left shrinks just enough
- **narration**: Walk `R` across the string. Each step, is `s[R]` already inside the window `[L, R)`? No repeat — keep it, and update the best length seen. Already inside — the no-repeat rule just broke; slide `L` forward until the duplicate is gone. A small lookup table (character → last index it appeared) lets `L` jump there in one move.
- **visual**: array — the breathing window animating across `"abracadabra"`: `R` advances; on a repeat, `L` jumps past the previous occurrence (mirrors `DerivedViz`). Shows window string, "best so far", and the `last_seen` table being built. In-window cells toned; the duplicate cell flashes when it forces a contraction.
- **panel**: top (main rule); a **note** panel restating the principle: "R grows while the rule holds; L shrinks the smallest amount that brings the rule back."
- **arrow**: from main panel down to the current `R` cell (the letter being tested); when a contraction happens, an arrow can point to `L`'s new landing cell.
- **codeLabels**: `["expand", "check", "contract", "record", "update"]` — the live line marches per operation: `expand` as R advances, `check`/`contract` on a repeat, `record`/`update` when we log the char and refresh best. (The visualizer emits these dynamically via `onActiveLine`; static fallback can be `["expand"]`.)
- **interaction**: playback (auto-animates the full run).

---

### Beat 5 — The win · Every letter touched twice. Linear time
- **narration**: Each letter joins the window once (when `R` reaches it) and leaves once (when `L` passes it). That's about 2n moves total — written O(n), meaning the work grows in step with the string's length. The lookup is instant per step (O(1) — same tiny cost no matter how full the table). Naive on 1,000 letters ≈ half a million checks; this ≈ two thousand.
- **visual**: array — the finished run with the best window highlighted; OR a small cascade/counter contrasting "naive ≈ 500,000" vs "window ≈ 2,000". Each letter cell could carry two faint tick marks (entered once, left once) to make "touched twice" literal. Memory note: at most ~26 entries for English text.
- **panel**: top
- **arrow**: from the count panel to the best-run cells (the answer the linear pass produced).
- **codeLabels**: `["expand", "update"]` (the loop body that runs once per letter — where the 2n comes from). Could also include `["result"]` to show the single return.
- **interaction**: none (or a brief playback of the count cascade).

---

### Beat 6 — The generalization · Any yes/no rule that holds for small windows and breaks past a point
- **narration**: The trick works whenever the window keeps a rule that breaks cleanly once you cross a line. "Smallest window covering every letter of a pattern" — grow R until covered, shrink L while still covered. "Longest run with at most k different values" — same dance. The condition changes; the motion doesn't.
- **visual**: custom — three stacked mini-rows, each a tiny window example: (1) no-repeat (this lesson), (2) "covers pattern", (3) "at most k distinct". Each shows R growing / L shrinking with the same two-marker motion, so the shared shape is visible at a glance. Toned to show the rule holding vs broken.
- **panel**: top or left (it labels several rows, so place it where it doesn't cover any single row's markers).
- **arrow**: optional bracket linking all three rows to the shared label "right grows · left shrinks just enough".
- **codeLabels**: `["expand", "check", "contract"]` (the template skeleton common to every variant — grow, test the rule, shrink).
- **interaction**: none (static comparison; optional playback cycling the three examples).

---

### Beat 7 — The pattern · Sliding Window (Variable)
- **narration**: That's the name — the Variable Sliding Window. Same family as the fixed-size window, but the window breathes: right expands when it can, left contracts when it must. Spot it whenever a problem asks for a longest/shortest contiguous run under a rule that flips on/off once.
- **visual**: array — the final solved state: best no-repeat run highlighted (e.g. `"brac"`/`"cadab"` length 4 in `"abracadabra"`), everything else dimmed, a ✓ on the answer. Clean "done" frame.
- **panel**: top (name + the pattern-signal bullets):
  - "Longest / shortest substring (or subarray) such that …"
  - "At most k of X" / "at least k of X"
  - "Smallest window containing all of Y"
  - Any "works / doesn't work" rule that flips once on a contiguous range.
- **arrow**: from the name panel to the highlighted best run.
- **codeLabels**: `["result"]` (the `return best` — the answer handed back).
- **interaction**: none.

---

## Notes

- **Wedge preservation**: Beat 3 is the gated step. The current `ManualWindowViz`
  fires `onInteraction` on every expand/contract and the phased visualizer gates
  on `onWedgeInteraction`. The annotated-canvas beat MUST keep `interaction: "wedge"`
  and wire the buttons to `onInteractionDone` so "Next" stays locked until the user
  actually moves a pointer. Don't auto-advance.

- **Code labels for naive beats**: Beats 2 and 3 describe the *naive* scan and the
  *manual* exploration — neither maps to a real line of the derived `algorithm.py`.
  Use `[]` (no highlight) rather than forcing an unrelated line to glow. Beat 1 uses
  the signature line `sig` so the code panel isn't empty on entry. This matches the
  reference prototype's convention (setup beats point at `sig`).

- **Per-operation line marching**: Beat 4's value is that the highlighted code line
  *changes with the operation* (`expand` → `check`/`contract` → `record`/`update`),
  driven by `DerivedViz`'s `onActiveLine`. Preserve that dynamic emission; the static
  `codeLabels` list is only a fallback for when the visual isn't animating.

- **Mobile / density**: `CharCells` already shrinks cells to 24px on mobile. The
  `last_seen` table readout in Beat 4 can get wide — keep it `break-all` on narrow
  screens (the visualizer already does this with `max-w-[420px]` + `break-all`).
  On mobile, prefer placing panels top/bottom (not left/right) so they never overlap
  the 11-cell row. Beat 6's three stacked rows are the densest frame — on mobile,
  consider showing one example at a time (playback) instead of all three stacked.

- **CONTENT — jargon to teach on first use (per the zero-CS-background rule)**:
  - **Big-O / O(n) / O(1)** — first appears in Beat 5. The current lesson DOES gloss
    these inline ("cost grows in step with how long the string is" and "instant — same
    cost no matter how big the map gets"). Keep that plain-words clause; do not drop it.
  - **n² / n²/2** — appears in Beat 2. Add a half-clause: "roughly length-times-length
    checks" so a beginner isn't staring at an unexplained exponent.
  - **hash map / lookup table** — appears in Beat 4. The current text says "a hash map
    of character → last seen index." *"Hash map" is unexplained CS jargon.* Rewrite as
    "a small lookup table that, for each letter, remembers the last spot it appeared —
    so we can jump straight there instead of re-scanning." Avoid the bare term "hash map"
    or teach it in one clause ("a hash map — a table that finds any letter's record
    instantly").
  - **substring / subarray** — appears in Beats 6–7. "Substring" = "a run of letters
    sitting next to each other"; worth a one-clause gloss the first time (Beat 6/7).
  - **`s[R]` / `[L, R)` / index** — code-style notation in Beat 4. "Index" = "a letter's
    position number (counting from 0)"; `s[R]` = "the letter sitting at position R";
    `[L, R)` = "the stretch from L up to (but not including) R". Teach `index` the first
    time it shows (Beat 4) since beginners haven't met 0-based positions.
  - **marker / pointer** — "L" and "R" are introduced in Beat 3 as "markers," which is
    already beginner-friendly. Good — keep "marker," avoid the word "pointer."

- **CONTENT BUG / inconsistency spotted**: the lesson PROSE talks about a generic small
  string ("On the right is a small string…"), but the visualizer hard-codes
  `S = "abracadabra"`. The narration should name the actual string the learner sees
  (`"abracadabra"`) so the words match the canvas — otherwise the "small string" wording
  reads as a leftover from a different example. Minor, but fix it for faithfulness.

- **Best-run ambiguity**: `"abracadabra"` has multiple length-4 no-repeat windows
  (`"brac"`, `"cada"`, `"dabr"`). `DerivedViz` tracks the *first* best via `bestRange`,
  so Beat 7's highlighted answer should match whatever `bestRange` lands on (don't
  hard-code a different span in the static beat, or the highlight will disagree with
  the animation).

---

## Peer review
- **verdict: needs-work**

The plan is faithful, feasible, and coherent at the structural level — every visual
maps to a real existing component (`NaiveScanViz`, `ManualWindowViz`, `DerivedViz`,
`CharCells`), the @sync labels (`sig`/`expand`/`check`/`contract`/`record`/`update`/
`result`) all exist verbatim in `algorithm.py`, the wedge gate is correctly preserved,
and the complexity claims (O(n), ~2n, O(1) lookup, ~26 memory) are correct. But there
are a handful of concrete defects that must be fixed before build.

- issues:
  - **Beat 7 — factual error in the example substring.** The narration text says the
    best run is `"brac"`/`"cadab"` length 4. `"cadab"` is length 5, AND it is NOT a
    valid no-repeat substring (it contains two `a`s: c-a-d-a-b). I verified the algorithm
    against `"abracadabra"`: `bestRange` lands on `[1,4]` = `"brac"`. FIX: drop `"cadab"`
    entirely; say `best no-repeat run highlighted (e.g. "brac", length 4)` — and this is
    self-contradicted by your own "Best-run ambiguity" note, which correctly lists the
    valid length-4 windows as `"brac"`, `"cada"`, `"dabr"`. Make Beat 7's example match
    that note (use `"brac"` to match `bestRange`).

  - **Beat 4 — BEGINNER-SAFETY: `s[R]`, `[L, R)`, and "index" all appear with no inline
    gloss in the narration itself.** Your CONTENT note (lines 131-133) correctly flags
    that these must be taught on first use, but the Beat-4 *narration* as written ("is
    `s[R]` already inside the window `[L, R)`?") still ships the bare notation. A
    15-year-old hits `[L, R)` — a half-open interval with mismatched bracket types — and
    has no idea why one end is `[` and the other is `)`. FIX: bake the glosses INTO the
    Beat-4 narration string, not just the notes section, e.g. "is the letter at position
    R (written `s[R]`) already sitting inside the current stretch from L up to R?" Don't
    leave the teaching as an aside the implementer might skip.

  - **Beat 4 — BEGINNER-SAFETY: "hash map" / "lookup table" still leaks.** The Beat-4
    narration body uses "A small lookup table (character → last index it appeared)" which
    is fine, but your CONTENT note admits the *source* derivation.tsx (line 97) literally
    says "With a hash map of character → last seen index." Confirm the conversion will
    use the rewritten plain-words version on canvas and NOT inherit the `derivation.tsx`
    "hash map" phrasing. As written the plan is ambiguous about which text wins. FIX:
    state explicitly that the canvas narration overrides the source prose, and never
    render the bare term "hash map."

  - **Beat 2 — BEGINNER-SAFETY: `n²/2` exponent unexplained in the beat itself.** Same
    pattern as above — your note (line 121) says to add "roughly length-times-length
    checks," but the Beat-2 narration string still reads "about n²/2 letter-checks" with
    no gloss. A beginner has not met `²`. FIX: put the half-clause directly in the
    narration: "about n²/2 — roughly length-times-length — letter-checks."

  - **Beat 5 — minor coherence: codeLabels `["expand", "update"]` vs the "2n" claim.**
    You say these two lines "run once per letter — where the 2n comes from." That's
    slightly misleading: `expand` (the `for` loop, line 13) runs n times and `update`
    (line 20) runs n times, giving 2n line-executions, but the conceptual 2n is "each
    letter enters once + leaves once" (the L and R passes), which is `contract`+`expand`,
    not `update`. The labels are defensible as "loop body" but the narration's mental
    model (enter/leave) points at L/R motion, not the `best = max(...)` update line. FIX:
    either keep labels as-is but don't tie them verbally to the enter/leave story, or
    swap `update`→`contract` so the highlighted lines match the "enters once, leaves
    once" sentence.

  - **Beat 6 — FAITHFULNESS drift from source.** The plan's Beat-6 third example is
    "Longest run with at most k different values," but `derivation.tsx` step 6's third
    bullet is "Maximum-sum stretch with non-negative values and length at most k." The
    plan silently swapped one of the three generalization examples. The swap is arguably
    pedagogically cleaner (the "at most k distinct" variant is the canonical sibling), but
    it's an unflagged divergence from ground truth. FIX: either keep all three source
    examples (covers-pattern / at-most-k-distinct / max-sum-len≤k) or explicitly note
    that you're substituting "at most k distinct" for "max-sum length≤k" and why.

  - **Beat 6 — FEASIBILITY: "three stacked mini-rows" is custom, no existing primitive.**
    The plan labels this `visual: custom` and the source `derivation.tsx` step 6 ships
    NO visualizer for step 6 (the visualizer only defines renders `until: 2`, `until: 3`,
    and default → there is no step-6/7 custom three-row component). So this frame must be
    built from scratch (three `CharCells` instances + a bracket). That's feasible with
    `ArrayViz`/`CharCells` stacked, but the plan should say "new component, composed of 3×
    CharCells" rather than implying a primitive exists. Confirm the build budget for it,
    and apply the mobile one-at-a-time fallback you already noted.

  - **Coherence nit — Beat 2 codeLabels.** You list `["sig"]` as a fallback but mark the
    primary as `[]`. Given Beat 1 already owns `sig`, re-pointing Beat 2 at `sig` would
    make two consecutive beats glow the same line with no narrative reason. Prefer the
    `[]` (code-quiet) option you list first; drop the `sig` fallback for Beat 2 to avoid a
    stale highlight carrying over.
