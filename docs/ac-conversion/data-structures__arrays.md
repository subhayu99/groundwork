# Annotated-Canvas Conversion — Arrays & Lists

Topic: `data-structures/arrays` · 7 derivation steps → 7 beats.
Reference form: `src/app/sandbox/annotated-canvas/page.tsx`. Contract: `src/shared/lesson/types.ts`.

The story arc to preserve: a pile of books costs you a *count* to reach one → giving every
position a fixed-size home turns that count into one *jump* → that's an array → here's what each
operation costs and why → when to reach for it → the name. The **wedge** is the slider (Beat 3):
the learner must drag it to feel "any slot, one step" before moving on. The **generalization** is
Beat 6 ("when it fits" — arrays are the default sequence; what to use instead).

Code source: `src/categories/data-structures/topics/arrays/algorithm.py`.
@sync labels available: `setup`, `index_read`, `append`, `insert_mid`, `delete`, `loop`,
`loop_body`, `length`.

---

### Beat 1 — The setup · A thousand books. Find the 487th.
- **narration**: You're shelving a thousand books. A friend says "hand me book number 487." You don't care what it is — only that it sits at position 487. The whole question: how fast can you reach that position?
- **visual**: array — a long row of same-size cells (use the 10-cell stand-in `[3,1,4,1,5,9,2,6,5,3]` and tell the learner to picture it 1,000 long). All cells `live`/idle. One target cell toned `mid` to stand for "the 487th." No lo/hi markers; a single marker pill reading `487?` over the target cell.
- **panel**: top.
- **arrow**: from the panel down to the single target ("the 487th") cell.
- **codeLabels**: [] (setup/framing beat — nothing executes yet).
- **interaction**: none.

### Beat 2 — The obvious thing · Pile of books. Count from the top.
- **narration**: The simplest storage: a pile. To reach book 487 you lift the top one, then the next, then the next — 487 lifts for one question. Change the question to book 53 and you start over from the top. Cost grows with the position asked.
- **visual**: array styled as a pile/stack-from-the-top — same row, but cells 0..k-1 toned `visited` (already lifted) with a crawling cursor arrow under the current cell, marching toward the target. A "lifts so far" counter climbs with position. The point: the highlighted swept region keeps growing.
- **panel**: bottom (so the crawling cursor and swept cells up top stay clear).
- **arrow**: from the panel up to the cursor / current "lifted" cell.
- **codeLabels**: [] (this is the slow naive way; the real code never counts like this — emitting `index_read` here would contradict the crawl).
- **interaction**: playback (auto-crawls one book at a time, like the current PileViz "Play through").

### Beat 3 — The wedge · Give every position a fixed home. (WEDGE — preserve)
- **narration**: Now lay the books on a long shelf, every slot the same size: slot 0, slot 1 … slot 999. You don't count to slot 487 — you walk straight to it. **Drag the slider** to any slot and watch the cursor land there in a single step.
- **visual**: array — the same row, now framed as fixed-size shelf slots. The cell at the chosen index toned `found`/`mid`; cursor sits exactly under it. A live readout shows `arr[i] = value · 1 jump` and underneath `base + i × cellSize`. (Teach "index" here: index = the slot's position number, counting from 0.)
- **panel**: top, plus a `note`-variant wedge panel (bottom-center): "What changed about the books? Nothing. What changed about the *arrangement*?"
- **arrow**: from the main panel down to the cursor at the selected slot.
- **codeLabels**: `index_read` (dragging emits this — `books[2]`, jump straight to a position).
- **interaction**: wedge (user MUST drag the slider before "Next" unlocks — preserves the existing wedge).

### Beat 4 — The structure · Same-size slots. Contiguous in memory.
- **narration**: That row of equal slots is an **array**: every element the same size, packed side by side in memory ("contiguous" = no gaps between them). The address of slot `i` is just `base + i × size` — one arithmetic step. Same cost for a thousand or a million books.
- **visual**: array — the full row with a faint "memory ruler" beneath: each cell labelled with its byte address (`base`, `base+sz`, `base+2·sz`, …) so the even stride is visible. One cell toned `mid` with its address formula called out: `base + i × size`. (Teach "constant time": the work doesn't grow as the array grows.)
- **panel**: right (leaves the address ruler under the row readable).
- **arrow**: from the panel to the highlighted cell's address label.
- **codeLabels**: `index_read` (the `base + i × size` jump is exactly what indexed access compiles to).
- **interaction**: none.

### Beat 5 — The operations · What's cheap, what's not, and why.
- **narration**: Read or write by index: one step, same cost no matter the size — we write that O(1) (O(1) = "constant, doesn't grow"). Append at the end: also O(1). Insert in the middle: O(n) (O(n) = "grows in step with the list's length n") — every later element shifts right to make room. Find a value with no index: O(n), you scan.
- **visual**: array — interactive ops board (the current OperationsViz). Buttons: **append · O(1)** (new cell flashes `entering` at the end), **insert mid · O(n)** (a cell enters mid-row, the tail toned `visited` and visibly shifts right), **delete mid · O(n)** (mid cell toned `leaving`, tail shifts left). A "total shifts" counter makes O(n) felt: append adds 0–1, insert/delete add many.
- **panel**: top (board + counters sit centre/bottom).
- **arrow**: from the panel to the insertion point (the cell where shifting starts).
- **codeLabels**: `append`, `insert_mid`, `delete` (each button lights its own line; default-highlight all three for the static beat, then the live viz narrows to the one pressed).
- **interaction**: playback (user presses the op buttons to watch the cost; auto-replayable, not gating).

### Beat 6 — When it fits · Use arrays when position matters more than middle-edits.
- **narration**: Arrays are the default for almost any sequence — reach for them when the work is read-by-position, append, or scan start-to-end. Reach for something else when you're constantly inserting and deleting in the *middle*: you pay O(n) every edit. Linked lists, trees, or hash maps fit that better.
- **visual**: array — the clean full row labelled "the default sequence," beside a small two-column fit/avoid table rendered on the plane: GOOD (green) = read by index, append, scan; AVOID (amber) = heavy middle insert/delete. Optionally a faint dimmed sketch of an alternative (linked cells with gaps) toned down beside it to contrast "no fixed jump there."
- **panel**: left (table sits right of the panel).
- **arrow**: none (this is a judgement/where-it-fits beat, not pointing at one element).
- **codeLabels**: `loop` (the "scan start-to-end" workload arrays are great at) — or [] if a no-line framing reads cleaner.
- **interaction**: none.

### Beat 7 — The structure · Array. List, in Python.
- **narration**: That's the name: **array**. In low-level languages its size is fixed; in Python, `list` is a *dynamic array* — it grows when you append, same cost model. Every time you see `arr[i]` in code, the machine does that `base + i × size` jump. That one line is why arrays are everywhere.
- **visual**: array — the full row, calm/settled, with the operations cost card overlaid on the plane: read by index O(1), append O(1), insert at i O(n), delete at i O(n), find a value O(n). One cell shows `arr[i]` resolving to `base + i × size` to tie code back to the picture.
- **panel**: top.
- **arrow**: from `arr[i]` in the panel to the matching cell in the row.
- **codeLabels**: `setup`, `length` (the `list[...]` definition and `len(books)` — the everyday Python list surface; or include `index_read` to spotlight the `arr[i]` callout).
- **interaction**: none.

---

## Notes

- **Wedge integrity (Beat 3).** The existing lesson gates progress on the slider drag
  (`SliderViz → onWedgeInteraction`). Keep this as the only `wedge` beat: "Next" stays locked
  until the learner drags to at least one slot and feels the single-jump landing. Don't downgrade
  it to `playback`.

- **CONTENT BUG — unexplained jargon in the current lesson.** The live derivation text introduces
  `O(1)` / `O(n)` and the word *constant time* with only parenthetical glosses, and `base + i × size`,
  `arr[i]`, `code`, *contiguous*, *immutable*-adjacent terms appear without a first-time plain-words
  definition. Per the platform's "15-year-old, zero CS" rule this is a violation. The plan above
  teaches each on first use: **index** (Beat 3), **contiguous** + **constant time** (Beat 4),
  **O(1)** and **O(n)** (Beat 5), **dynamic array** (Beat 7).

- **CONTENT BUG — example/visual scale mismatch.** The story is about 1,000 books and "the 487th,"
  but every viz uses a 10-cell array and `TARGET_INDEX = 6` (the "7th book"). The numbers don't line
  up (487 vs 6/7). Not wrong, but jarring for a beginner. Recommendation: keep the small array for
  legibility but explicitly label it "picture this row 1,000 long" on Beats 1–2 (already folded into
  the narration above), and make the target marker read `487?` rather than silently using index 6.

- **CONTENT NOTE — "find a value O(n)" needs the array shown unsorted.** Beat 5/7 claim find-a-value
  is O(n) "you have to look at elements until you find it." That's only true for an *unsorted* array
  — which `[3,1,4,1,5,9,2,6,5,3]` is, good. Don't accidentally sort the demo array, or a sharp
  learner will ask why it isn't binary search.

- **Mobile / dense visual.** Beat 4's address ruler and Beat 6's fit/avoid table are the two densest
  panels. On narrow screens, drop the per-cell byte addresses to just `base` and `base + i×size` on
  the active cell, and stack the fit/avoid table below the row instead of beside it. The reference
  page already scales the fixed `VW×VH` canvas down — keep panel `width`s modest (≤ 560) so they
  don't overrun when scaled.

- **Code-line honesty (Beats 1–2).** Leave `codeLabels: []` on the setup and pile beats. The pile is
  the deliberately-slow naive storage; the real `algorithm.py` only ever does the O(1) `books[i]`
  jump, so lighting `index_read` during the crawl would contradict the animation (the current
  `PileViz` comment makes exactly this point).

- **algorithm.py has `loop` / `loop_body` unused by any beat.** The iterate example (`for i, title in
  enumerate(...)`) isn't a distinct derivation step. Beat 6 ("scan start-to-end") is the natural place
  to point at `loop` if you want every label exercised; otherwise it's fine to leave those two dark.

---

## Peer review

- **verdict: needs-work**

- issues:
  - **Beat 5 (BEGINNER-SAFETY) — `n` is used before it is defined.** The gloss reads "O(n) (O(n) =
    'grows in step with the list's length n')" — it explains O(n) using the symbol `n`, which a
    zero-CS 15-year-old has never met. The definition is circular for the one term that needs it.
    FIX: on first use write "we call the number of items in the list `n`" before the O(n) gloss, e.g.
    "Insert in the middle costs more the bigger the list gets — call the number of items `n`, and the
    cost grows in step with `n`. We write that O(n)."
  - **Beats 2 / 3 / 5 (FEASIBILITY) — these describe reusing the live-app React vizes, which the AC
    runtime cannot embed.** The plan says "like the current PileViz" (B2), "drag the slider" via the
    existing SliderViz (B3), and "the current OperationsViz" with append/insert/delete buttons (B5).
    But an annotated-canvas beat's `visual` is an SVG node or a `(api: BeatVisualApi) => ReactNode`
    render-fn (`src/shared/lesson/types.ts`); the reference page draws raw `<svg>` `Cells`, not the
    React `OperationsViz`/`SliderViz`/`PileViz` components. FIX: state explicitly that B3's slider and
    B5's ops board must be rebuilt as AC-native interactive visuals (render-fn calling
    `api.onActiveLine` / `api.onInteractionDone`), reusing the *logic* of those vizes but not the
    components. As written a builder will try to drop the existing components in and hit the contract.
  - **Beat 5 (FEASIBILITY) — `entering` / `leaving` are not AC tones.** The reference `Cells` tone set
    is `idle | live | gone | mid | found | visited | no | yes` (page.tsx `Tone`/`FILL`/`STROKE`).
    `entering`/`leaving` are `ArrayViz` props, absent from the AC plane. FIX: either map them onto
    existing tones (`entering → mid`, `leaving → no`/`gone`) or note that `FILL`/`STROKE` must be
    extended; don't assume they exist.
  - **Beats 4 & 6 (FEASIBILITY) — memory ruler and fit/avoid table are net-new SVG, not primitives.**
    The plan frames the whole topic as "use existing ArrayViz/GridViz/…" but B4's per-cell byte-address
    ruler and B6's two-column GOOD/AVOID table have no primitive — they must be hand-drawn in the
    beat's `svg` (which is allowed, like the B5 halving-cascade in the reference). FIX: say so, so the
    density/mobile budget (already noted) is scoped as custom SVG work, not a prop on ArrayViz.
  - **Beat 1 (COHERENCE) — the `487?` marker pinned to a 10-cell row reintroduces the very mismatch it
    fixes.** A per-cell marker reading `487?` sitting under index 6 (the 7th cell) literally labels
    "position 487" on a cell that is visually position 6. FIX: float the `487?` as a free SVG callout
    above the row (or as panel text with an arrow to the row generally), not as a `markers[6]` pill
    tied to a wrong index. Same applies to the B1 arrow "to the 487th cell" — there is no 487th cell.
  - **Beat 5 (FAITHFULNESS) — append's "amortized / on average" truth is dropped.** Narration says
    "Append at the end: also O(1)" flat, but both `derivation.tsx` (step 5: "O(1) on average (dynamic
    arrays occasionally reallocate)") and `algorithm.py` ("O(1) amortized") carry the nuance, and B7
    then introduces "dynamic array — it grows when you append" with no reason given. FIX: keep one
    plain clause — "Append at the end: O(1) too (on average — once in a while the shelf is full and the
    books get copied to a bigger shelf, which is where 'dynamic array' in Beat 7 comes from)."
  - **Beat 3 (CORRECTNESS / @sync) — the lit `index_read` line is hardcoded `books[2]` while the
    slider reads `arr[i]` for any `i`.** Dragging to slot 7 lights `third = books[2]`, so the code
    panel literal (`[2]`) disagrees with the on-canvas readout (`arr[7]`). The reference SliderViz
    accepts this same compromise, so it's tolerable, but the plan should flag it: the highlighted
    line teaches "indexed access exists," not the specific index, and the readout is the source of
    truth for the dragged value.
  - **(Minor, BEGINNER-SAFETY) Beat 4 — "one CPU instruction" / "address" / "byte address".** B4
    introduces "address," "memory," "byte address," and "stride" — for zero-CS this is a jump. The
    plan teaches "contiguous" and "constant time" but not "address." FIX: gloss address once
    ("address = the slot's spot in the computer's memory, like a house number on a street").
