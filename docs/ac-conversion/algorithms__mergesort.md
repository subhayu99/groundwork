# Mergesort — Annotated Canvas conversion plan

Source lesson: 7 derivation steps (`derivation.tsx`), per-step visuals (`visualizer.tsx`),
real code `algorithm.py`. Target form: the binary-search annotated-canvas reference
(`src/app/sandbox/annotated-canvas/page.tsx`) filling the `LessonBeat` contract
(`src/shared/lesson/types.ts`).

Working array: `5, 2, 4, 7, 1, 3, 8, 6` (8 cards), matching the visualizer.

`@sync` labels available in `algorithm.py`:
`sig`, `base`, `split`, `recurse_left`, `recurse_right`, `merge_call`,
`merge_loop`, `merge_compare`, `merge_take`, `merge_tail`.

One beat per derivation step (7 beats). Canvas reuses the array primitive (rows of
value cards), plus a small custom "level-stack" / "cost bars" drawing on the counting
and generalization beats.

---

### Beat 1 — The setup · Eight cards in a row. Put them in order.
- **narration**: Eight cards landed in a jumble: 5, 2, 4, 7, 1, 3, 8, 6. Sort them into order. Eight is easy by eye. But computers sort eight-hundred-million-row tables all day — every database join, every leaderboard. The *shape* of a good method is what matters here.
- **visual**: array. One row of 8 cards showing the unsorted values, all toned `idle`/`live` (neutral). Nothing highlighted yet — this is the raw problem.
- **panel**: top.
- **arrow**: none (or a soft bracket under the whole row labelled "sort these").
- **codeLabels**: `sig` (the function signature `mergesort(nums)` — what we're about to write).
- **interaction**: none.

---

### Beat 2 — The obvious thing · Swap adjacent pairs until nothing's out of order.
- **narration**: The first idea everyone reaches for: walk left to right, swap any backwards pair, repeat until a pass makes no swaps. It works but it's slow — each swap fixes one tiny disagreement, so moving a card far means swapping it past every neighbour. A thousand cards can cost a million swaps.
- **visual**: array. Same 8-card row; one adjacent pair (e.g. cards 0 and 1, values 5 and 2) toned `compare`/`active` to show the one-pair-at-a-time swap. A small counter caption "swaps pile up: ~n²" beneath. Optionally show one card needing to crawl the full width.
- **panel**: bottom.
- **arrow**: from the panel up to the highlighted adjacent pair being compared.
- **codeLabels**: `[]` (naive bubble sort — not in `algorithm.py`; this beat is the foil. Leave empty or fall back to `sig`).
- **interaction**: none.
- *Jargon to teach here*: "grows like the **square** of the size" — say plainly "double the cards and the work roughly *quadruples*"; avoid the bare symbol n² unless immediately glossed.

---

### Beat 3 — The wedge · Cut in half. Sort each half. Merge them.
- **narration**: Pretend the two halves are already sorted. Then finishing is easy: walk both halves with two fingers, always take the smaller card next — one clean pass. So the only question shrinks to "how do I sort a half?" Same trick, on something smaller. Keep cutting until each piece is a single card — and one card is already sorted. **Try it: press split, then merge.**
- **visual**: array, interactive. The row splits into segments level by level (8 → two 4s → four 2s → eight singletons), then merges back up, sorted segments toned `sorted`/`yes`. This is the existing `SplitMergeViz` — the user clicks **split →** repeatedly to reach singletons, then **merge →** to rebuild. Preserve that hands-on driving.
- **panel**: top (main explanation) + a `note` panel.
- **arrow**: from the main panel down to the current active segments being split or merged.
- **note panel** (the wedge): "**The wedge:** sorting two halves and merging them is far less work than swap-by-swap — because one merge slides cards from one side to the other in a single pass." Place bottom-center so it never covers the segment row.
- **codeLabels**: while splitting → `split`, `recurse_left`, `recurse_right`; while merging → `merge_loop`, `merge_compare`, `merge_take` (the visual emits these live via `onActiveLine`, matching `SPLIT_LINES`/`MERGE_LINES`).
- **interaction**: **wedge** — user MUST split down to singletons and merge at least once before "Next". This preserves the existing gating wedge step.
- *Jargon to teach here*: "a single **linear** pass" → gloss as "one walk through, each card looked at once."

---

### Beat 4 — The derivation · Recursion plus a two-finger merge.
- **narration**: Write `sort(arr)` — a recipe that calls itself. **Base case:** 0 or 1 cards? Already sorted, hand it back. **Otherwise:** find the middle, sort the left half, sort the right half, then merge. **The merge:** two fingers `i` and `j` at the start of each half; write whichever card is smaller and step that finger on; when one half empties, dump the rest.
- **visual**: array, two-panel split. Top: the 8-card row with a vertical `mid` divider after card 4 and brackets labelling `left` (cards 0–3) and `right` (cards 4–7). Below: two short sorted rows with finger markers `i` and `j` on their first cards, and an empty `out` row filling up — illustrating the two-finger merge.
- **panel**: right (so the array + merge demo stays visible on the left).
- **arrow**: from the panel to the `mid` divider, plus a small arrow to the `i`/`j` finger markers.
- **codeLabels**: `base`, `split`, `recurse_left`, `recurse_right`, `merge_call` (the recursive case) — and optionally `merge_loop`, `merge_compare`, `merge_take`, `merge_tail` when describing the two-finger walk. Keep one function's labels lit at a time as the narration moves from recurse → merge.
- **interaction**: none (or `playback` of one merge of two 4-card halves).
- *Jargon to teach here*: **recursion** = "a recipe that calls itself on a smaller piece"; `arr[:mid]` / `arr[mid:]` = "the left chunk up to the middle / the right chunk from the middle on"; `i`/`j` are **pointers** = "fingers marking where you're looking."

---

### Beat 5 — The operations · Half each level. Linear merge. Logs and lines.
- **narration**: **How many cuts?** Each cut halves the pile, so a thousand cards take ~10 levels (2¹⁰≈1000) — written `O(log n)`, meaning cost grows *very* slowly: doubling the input adds just one level. **Work per level?** Every merge looks at each card once → `O(n)` per level. **Total:** n per level × log n levels = `O(n log n)` ≈ 20 million ops for a million cards, not a trillion. **Memory:** the merge copies a slice to write into → `O(n)` extra space.
- **visual**: custom — a level-stack / cost diagram. Left: the array drawn as a triangle of levels (8 across the top, splitting down to singletons) with a `log n` height bracket on the side. Right or overlaid: a per-level cost label "n cards touched" repeated × "log n levels". Tone the merge sweep of the current level `active`. Mirrors the `splitFrames`/`mergeFrames` level snapshots in `AutoMergesortViz`.
- **panel**: left.
- **arrow**: bracket pointing to the level-count (height = `log n`) and an arrow to one level's "n work" label.
- **codeLabels**: `split` + `recurse_left` + `recurse_right` (the halving) and `merge_loop` + `merge_tail` (the per-level linear work). The closing `algorithm.py` comment block already states O(n log n).
- **interaction**: none (or `playback` stepping level by level).
- *Jargon to teach here* (FIRST Big-O appearance in the lesson — teach all in plain words):
  - `O(log n)` = "the step-count grows like the number of times you can halve n before reaching 1."
  - `O(n)` = "work grows in step with the number of cards — n cards, ~n operations."
  - `O(n log n)` = "n work repeated for each of log n levels."
  - `len(nums)` / `len` = "how many items are in the list."
  - "**in-place**" (mentioned re: quicksort) = "rearranges within the same row without a second copy."

---

### Beat 6 — The generalization · Divide and conquer is everywhere.
- **narration**: The shape — split, solve each half, combine — fits any problem on n items that breaks into the *same* problem on n/2 items with a cheap combine. Same skeleton, different stories: counting out-of-order pairs, the closest two points on a map, fast big-number multiplication, the FFT, splitting work across two CPU cores then merging. Win when the combine is cheap (merge is); lose when it's the expensive part.
- **visual**: custom — one "split → two children → combine" tree fragment (a `tree` primitive): a parent node forking into two n/2 children, with a labelled "cheap combine" arrow merging them back. Around or below it, 3–4 small chips naming other instances (counting inversions, closest pair, Karatsuba, FFT) toned neutral, to show the same shape reused.
- **panel**: top.
- **arrow**: from the panel to the "combine" edge of the tree (the step that decides win/lose).
- **codeLabels**: `split`, `recurse_left`, `recurse_right`, `merge_call` — the generic "divide, recurse twice, combine" skeleton visible in `mergesort()`.
- **interaction**: none.
- *Jargon to teach here*: **node** = "one box in the tree, holding a chunk of the problem"; **divide and conquer** = "break into smaller same-shaped pieces, solve those, stitch results."

---

### Beat 7 — The pattern · Mergesort.
- **narration**: That's the name: the textbook **divide-and-conquer** sort. The recursion does the dividing; the merge does the conquering. You'll reach for it when you see: "sort big data with a worst-case guarantee," "merge two already-sorted streams," "sort a file too big for memory" (external mergesort), or any divide-and-conquer with a cheap linear combine. Open the code drawer — under twenty lines of real work.
- **visual**: array. The full 8 cards now in sorted order `1 2 3 4 5 6 7 8`, all toned `sorted`/`found` — the finished result, with a "✓ sorted" badge. Optionally a faint ghost of the original jumble above, to bookend the lesson.
- **panel**: bottom, with the bulleted "pattern signals" list.
- **arrow**: from the panel up to the sorted row (or a checkmark on the row).
- **codeLabels**: `sig` (and optionally `merge_call`) — the whole routine, now named.
- **interaction**: none.

---

## Notes

- **Mobile / dense visuals.** Beat 5's level-triangle and Beat 4's stacked
  `left`/`right`/`out` rows are the densest. On narrow screens, collapse the merge
  demo (Beat 4) to a single two-finger row instead of three stacked rows, and let the
  Beat 5 triangle scale down via the same fixed-canvas `scale` transform the reference
  page uses (`VW`/`VH` ResizeObserver). Keep panels on `top`/`bottom` on mobile so they
  stack above/below the canvas rather than overlapping it.

- **Wedge preservation.** Beat 3 is the only gating beat. In the current visualizer
  it's `SplitMergeViz` with manual **split →** / **merge →** buttons that call
  `onInteraction`. The contract's `interaction: "wedge"` + `onInteractionDone()` must
  fire after the user has both split to singletons AND merged at least one level — do
  not let "Next" unlock on mount.

- **Code-label fidelity (per function).** The visualizer is careful never to light lines
  from two functions at once: split frames emit only `mergesort()` labels
  (`split`/`recurse_left`/`recurse_right`), merge frames only `merge()` labels
  (`merge_loop`/`merge_compare`/`merge_take`/`merge_tail`). Preserve that — on Beat 4,
  when narration moves from "sort each half" to "the merge," switch the lit label set
  rather than lighting both functions simultaneously.

- **Content bug — `merge_call` label is unused by the visualizer.** `algorithm.py`
  defines `# @sync: merge_call` on the `return merge(left, right)` line, but neither
  `SPLIT_LINES`/`MERGE_LINES` nor the per-frame label arrays in `visualizer.tsx`
  reference it, so that line never highlights in the current lesson. The conversion
  should use `merge_call` on Beats 4/6/7 (the "then merge" / skeleton beats) so every
  defined anchor lights up somewhere.

- **Content bug — `base` label is unused by the visualizer.** Same as above: the base
  case (`if len(nums) <= 1: return nums`) is the recursion's stopping rule and is
  discussed in Beat 4's narration, but the current visualizer never lights it. Light
  `base` on Beat 4 when narration says "0 or 1 cards — already sorted."

- **Unexplained jargon in the source lesson (must be fixed in conversion).** The current
  derivation introduces, with NO plain-words gloss for a 15-year-old: `O(log n)`,
  `O(n)`, `O(n log n)` (step 5), the slice syntax `arr[:mid]` / `arr[mid:]` and the
  pointers `i`/`j` (step 4), the word **recursion** (used in step 3 before step 4
  defines anything), and "the square of the size" / superscript `2¹⁰` (step 5). Each is
  flagged in the per-beat "Jargon to teach" notes above and MUST be glossed on first
  appearance per the platform's zero-CS-background promise.

- **Minor wording risk.** Step 5 says halving a thousand "takes about ten levels
  (because 2¹⁰ = 1024)". 2¹⁰ = 1024 is correct; just ensure the beginner sees *why*
  "number of halvings to reach 1" equals that exponent — state it as "you can halve
  1000 about ten times before you hit a single card."

- **Faithful generalization.** Beat 6 keeps the topic's real generalization (divide &
  conquer: inversions, closest pair, Karatsuba, FFT, parallel split/merge) and Beat 7
  keeps the real pattern signals list — both carried over verbatim in spirit, only
  re-voiced for a beginner.

---

## Peer review

- **verdict: needs-work**

The plan is faithful, the wedge is preserved, and every visual is buildable (the
reference page draws bespoke inline SVG via a render-fn, so the level-triangle,
cost-bars, and tree fragment are all in scope). But there are concrete tone/label
mismatches, an unglossed-symbol gap, and a mis-described wedge gate that must be fixed
before build.

- issues:
  - **Beat 3 + "Wedge preservation" note — the wedge gate is mis-described vs. the
    existing component, FEASIBILITY.** The note says Next must unlock only after the user
    "has both split to singletons AND merged at least one level" and "do not let Next
    unlock on mount." But the existing `SplitMergeViz` calls `onInteraction?.()` on the
    *first* `split →` click (and again on the first `merge →`), so it already unlocks on
    the first split — there is no "split-to-singletons-then-merge" gate to preserve.
    Fix: either (a) restate the requirement as "unlock after the first split click"
    (matches the existing component, and is the honest description), or (b) explicitly
    flag that NEW gating logic is required — track `allAtomic(segs)` reached AND `phase
    === "merging"` happened, then call `onInteractionDone()`. Pick one; don't claim the
    current component already does (b).
  - **All beats — tone names mix two incompatible vocabularies, COHERENCE/FEASIBILITY.**
    The plan tones cards as `idle`/`live`, `compare`/`active`, `sorted`/`yes`,
    `found`. But the annotated-canvas reference page (`page.tsx`) defines its OWN local
    `Tone = "idle" | "live" | "gone" | "mid" | "found" | "visited" | "no" | "yes"`,
    while `compare`/`active`/`sorted` come from the *visualizer*/shared `tones.ts`
    (which itself has no `sorted`, `compare`, `found`, `live`, or `yes` — it has
    `active`/`good`/`visited`). No single vocabulary contains `compare`, `sorted`, AND
    `yes`. Fix: pick the reference page's local Tone set and rewrite each beat's tones to
    it — e.g. Beat 2 highlighted pair → `mid`/`visited` (not "compare/active"); Beat 3/7
    sorted segments → `yes` (not "sorted"); Beat 7 finished row → `found`/`yes` (not
    "sorted/found"). State the chosen set once at the top of the doc.
  - **Beat 4 — `arr[:mid]` / `arr[mid:]` slice syntax appears in narration but the gloss
    is buried in a side-note, BEGINNER-SAFETY.** The narration literally shows
    `left = sort(arr[:mid])` and `right = sort(arr[mid:])`. A 15-year-old hits `[:mid]`
    and `[mid:]` — colon-slice notation — with the gloss only in the "Jargon to teach"
    meta-note, not in the beat the learner reads. Fix: inline the gloss in the beat body
    on first use, e.g. "`arr[:mid]` means the left chunk up to the middle; `arr[mid:]`
    the right chunk from the middle on," OR replace the code with plain words
    ("sort the left half, sort the right half") and keep the literal slice only in the
    code drawer.
  - **Beat 5 — `2¹⁰` / superscript and `log n` risk an unglossed symbol, BEGINNER-SAFETY.**
    The narration uses "2¹⁰≈1000" and "`O(log n)`". The Notes flag this, but the beat
    text as written leads with the symbol before the plain-words "halve 1000 about ten
    times" framing. Fix: order it plain-first — "you can halve a thousand about ten times
    before you reach one card; we write that count `log n`" — and never show the bare
    superscript `2¹⁰` without immediately saying "2 multiplied by itself ten times."
  - **Beat 5 — "in-place" is glossed in the meta-note but the narration never actually
    says the word, COHERENCE.** The "Jargon to teach" list defines **in-place**, but the
    Beat 5 narration only says "the merge copies a slice" and references quicksort's
    different guarantee — it doesn't use "in-place." Either add the word to the narration
    (then the gloss is needed) or drop the in-place gloss from the meta-note. As written,
    the gloss is orphaned.
  - **Beat 4 codeLabels — lighting `base` + `split` + `recurse_*` + `merge_call` +
    `merge_loop` + `merge_compare` + `merge_take` + `merge_tail` in one beat violates the
    plan's own "one function lit at a time" rule, COHERENCE.** The beat lists nearly every
    label across BOTH `mergesort()` and `merge()`. The Notes correctly say to switch the
    lit set as narration moves recurse → merge, but the `codeLabels` array doesn't encode
    that sequencing (the contract's static `codeLabels` lights all listed lines at once;
    only a render-fn calling `onActiveLine` can sequence). Fix: state that Beat 4 must be
    an interactive/`playback` beat driving `onActiveLine` to switch sets, OR split the
    static `codeLabels` to just `["base","split","recurse_left","recurse_right"]` and
    rely on the merge demo's `onActiveLine` for the `merge_*` set — don't list all ten
    statically.
  - **Beat 2 codeLabels — "fall back to `sig`" contradicts the foil framing, minor
    COHERENCE.** Beat 2 is the naive-bubble foil with no line in `algorithm.py`. Lighting
    `sig` (the mergesort signature) while narrating bubble sort would point the learner at
    the wrong code. Fix: leave `codeLabels: []` (empty) — the contract allows it — rather
    than falling back to `sig`.
  - **Beat 6 visual — TreeViz/Scene requires caller-supplied x/y layout; the chips
    naming inversions/Karatsuba/FFT aren't tree nodes, FEASIBILITY (minor).** `TreeViz`
    takes `nodes` with explicit `x/y` and `edges`; that handles the parent→two-children
    fragment fine. But the "3–4 small chips" around it are not nodes/edges — they're
    bespoke SVG labels (like the reference page's `Bracket`/`text`). Fix: note that the
    chips are drawn as plain canvas `<text>`/rects alongside the TreeViz group, not via
    the tree primitive.
  - **Correctness spot-checks all PASS (record):** `O(n log n)`, `O(n)` space, `2¹⁰=1024`,
    "~20M ops for 1M", "~10 levels for 1000" are all correct. The `merge_call`-unused and
    `base`-unused content bugs are correctly identified and the fix (light them on
    Beats 4/6/7) is sound. The `@sync` anchors named (`sig`, `base`, `split`,
    `recurse_left`, `recurse_right`, `merge_call`, `merge_loop`, `merge_compare`,
    `merge_take`, `merge_tail`) all exist in `algorithm.py`. No wrong-complexity or
    wrong-anchor claims found.
