# Sets & Tuples — Annotated-Canvas Conversion Plan

Topic key: `sets-tuples` · category `data-structures` · 7 derivation steps → 7 beats.

The visual splits into two layouts (matching `visualizer.tsx`):
- **Beats 1–2** show a plain **list** of name-chips (the naive container).
- **Beats 3–7** show two stacked containers on one plane: a **set** (rounded pills, top) and a **tuple** (a parenthesised row of three boxes, bottom).

Code source is `algorithm.py`. Real `@sync` labels present: `set_def`, `set_add`, `set_add_dup`, `set_in`, `set_discard`, `set_ops`, `tuple_def`, `tuple_unpack`, `tuple_immutable`, `tuple_key`.

Canvas convention (mirrors the binary-search reference): VW≈860, VH≈470; panels are absolutely positioned in that box with arrows pointing at the exact element. "Set" pills sit centred-upper, "tuple" boxes centred-lower, so panels go to the side or to the empty top/bottom strip.

---

### Beat 1 — The setup · Two small containers. Two different jobs.
- **narration**: Tonight you track who is in a chat room — you only care "is alice here, yes or no?", not when she arrived or how many times she logged in. Down the hall, weather readings come as one packet: (date, latitude, temperature). Same idea — a container — but opposite rules.
- **visual**: array (plain list). Six name-chips in a loose row: `alice`, `bob` filled live; the rest dimmed/toned as "could be added". A faint second cluster on the right hints at a 3-box packet `(date, lat, temp)` toned but not yet active. No markers.
- **panel**: top (the empty strip above the chips).
- **arrow**: from the panel down to the chip row (the "container").
- **codeLabels**: [] (pure setup — no code yet).
- **interaction**: none.

---

### Beat 2 — The obvious thing · Stuff a list. Scan when you need it.
- **narration**: The easy move: keep everyone in a plain list. To check for alice you scan chip by chip until you hit her or run out — slow if the list is long. Store the weather packet in a list too, but later you'll forget whether spot 0 or spot 1 was the latitude. Both work; neither fits.
- **visual**: array (plain list). The same chips, now with a scan sweep: chips 0..k toned "visited" (already checked) and the current chip highlighted as the scan cursor — "scanning for alice". Show "list length" growing; a small note that a repeat `alice` would be accepted (no uniqueness rule).
- **panel**: bottom.
- **arrow**: from the panel up to the scan cursor chip.
- **codeLabels**: [] (naive baseline — the real code starts at the set, not here).
- **interaction**: playback (auto-sweep the scan to show the cost).

---

### Beat 3 — The wedge · Try adding the same person twice. Then try the packet.
- **narration**: Your turn. Add alice to the set — then add her again. The set shrugs: she's in or she isn't, no "second alice." Now poke the packet below: try to change a field, try to add a fourth. Both refuse. Ask yourself: what does each container's *refusal* tell you it's for?
- **visual**: custom (set + tuple side-by-side, the live interactive widget). Set pills: `alice`, `bob` present; buttons to add a name / add alice again / remove last; a live "alice in set: True/False" readout. Tuple: `("2026-05-28", 47.5, 22.1)` in three boxes; buttons "try: tuple[0] = ..." and "try: tuple.append(...)" flash a red TypeError. ("immutable" = can't be changed after it's made — say this in plain words the first time.)
- **panel**: left (set) — plus a small **note** panel for the wedge question.
- **arrow**: from the main panel to the set pills; the note panel (no arrow, or a short arrow to the tuple).
- **codeLabels**: emitted live by the widget — `set_add` (fresh add), `set_add_dup` (adding a duplicate, silently ignored), `set_discard` (remove last), `set_in` (the membership readout). Static fallback: `["set_add", "set_add_dup"]`.
- **interaction**: wedge (PRESERVE — the user must add/duplicate/poke before continuing).

---

### Beat 4 — The structures · A set is a hash map's keys. A tuple is a fixed record.
- **narration**: A set is a hash map with the values thrown away — only the keys kept. (A hash map jumps straight to an item by name in one step; "key" = the name you look up by.) "Is x in the set?" is one hop, instant. Re-adding x does nothing — its slot already holds it. A tuple is the opposite: an ordered, fixed-size packet you can't edit; position carries meaning — slot 0 is always the date.
- **visual**: custom (set + tuple). Set: pills shown sitting in faint hash "slots/buckets" (a bucket = a numbered cubby the name hashes into) to show one-hop lookup; the duplicate-add lands in an already-filled slot and bounces. Tuple: three boxes labelled by position `[0] date · [1] lat · [2] temp`, a lock icon on the row to signal "fixed."
- **panel**: top.
- **arrow**: two short arrows — one to a set bucket ("one hop"), one to the tuple's position labels ("position = meaning").
- **codeLabels**: `["set_def", "tuple_def"]` (the two definitions side by side).
- **interaction**: none.

---

### Beat 5 — The operations · Sets are hash-fast. Tuples are basically free.
- **narration**: Set: add, remove, and "in" each cost O(1) on average — "O(1)" means the time stays the same no matter how big the set gets. Combine two sets (overlap, merge, leftovers) costs about the size of the smaller one. Tuple: grab slot i instantly; reading all n items is O(n) — time grows in step with the count. You can't change a tuple — and *that's* why it can live inside a set or be a hash-map key. Lists can't.
- **visual**: custom (set + tuple). Set side annotated with cost tags: `add O(1)`, `in O(1)`, `A∩B / A∪B / A−B  O(min(|A|,|B|))`. Tuple side: `tuple[0] → O(1)`, `iterate → O(n)`. A small inset shows a tuple `(47.5, 22.1)` being dropped *into* a set successfully, while a list `[47.5, 22.1]` is rejected.
- **panel**: bottom.
- **arrow**: from the panel up to the "tuple goes into the set" inset (the load-bearing payoff of immutability).
- **codeLabels**: `["set_ops", "tuple_immutable", "tuple_key"]`.
- **interaction**: none.

---

### Beat 6 — When they fit · Set for "is X here?". Tuple for "X, Y, Z stay together."
- **narration**: Reach for a set whenever you'd ask "contains? unique? in both? in one but not the other?" — online users, URLs you've seen, nodes you've visited, allow-lists. Reach for a tuple when several values describe one thing and the shape never changes: (x, y) points, (row, col) grid spots, (date, lat, temp) readings, a function handing back several results at once.
- **visual**: custom (set + tuple). Set pill cluster captioned with use-case chips: `online users · seen URLs · visited nodes · whitelist`. Tuple row captioned: `(x, y) · (row, col) · (date, lat, temp)`. Each side's earlier example stays on-screen, now tagged with its real-world job.
- **panel**: left for the set caption, mirrored note/caption on the right for the tuple (or one wide top panel covering both).
- **arrow**: one arrow to the set cluster, one to the tuple row.
- **codeLabels**: `["set_in", "tuple_unpack"]` (membership question vs. unpacking a packet by position).
- **interaction**: none.

---

### Beat 7 — The structures · Set and Tuple.
- **narration**: That's the name: Set and Tuple. Python writes a set with curly braces `{1, 2, 3}` and a tuple with parentheses `(1, 2, 3)`. The deeper move both make: they *say what the data is for*. A list is so flexible it stays silent about intent. A set says "membership matters." A tuple says "these belong together as one thing."
- **visual**: custom (set + tuple), settled "final" state. Set pill row labelled `{ … }` and tuple box row labelled `( … )`, both calm/idle-toned. A one-line contrast caption: "list = silent · set = membership · tuple = one thing." Hint to open the code drawer for the Python interface.
- **panel**: top.
- **arrow**: from the panel to the two brace/paren labels (the naming payoff).
- **codeLabels**: `["set_def", "tuple_def"]` (close on the two definitions, mirroring the opening of each block).
- **interaction**: none.

---

## Notes

- **CONTENT BUG — unexplained jargon in the current lesson.** The live derivation drops several terms with no plain-words gloss, which breaks the "15-year-old, zero CS" promise. Each is fixed in the narration above:
  - `hash map`, `keys`, `bucket` (step 4 / `set_def` comment) — appear cold. Glossed in Beat 4 ("a hash map jumps straight to an item in one step"; "bucket = a numbered cubby").
  - `immutable` (step 4) — the word never appears in the derivation body but the *concept* "can't be changed once you make it" is used; the code comment says "immutable." Beat 3 introduces it in plain words on first use.
  - `O(1)` / `O(n)` / `O(min(|A|,|B|))` (step 5) — the derivation parenthesises O(1) and O(n) but introduces `O(min(|A|,|B|))` with no gloss at all. Beat 5 teaches O(1) and O(n) in plain words and describes the min-size cost verbally ("about the size of the smaller one") rather than leaning on the symbol.
- **No `lo/hi/mid` markers here** — that marker vocabulary is binary-search-specific. For this topic the "markers" are position labels on the tuple (`[0] [1] [2]`) and bucket slots on the set.
- **Wedge preserved**: Beat 3 is the only gating beat. The existing widget already emits the correct `@sync` labels live via `onActiveLine` and gates on `onWedgeInteraction`; the plan keeps that exact behaviour. Static `codeLabels` are only the fallback.
- **Dense visual / mobile**: Beats 3–7 stack two containers vertically — on narrow screens the side panels (left/right) should collapse to top/bottom so they don't overlap the pills. Beat 5's cost tags are the densest; on mobile, drop the per-operation tags to a single summary line and keep only the "tuple-into-set" inset, which is the load-bearing idea.
- **`set_ops` / `tuple_unpack` / `tuple_key` lines**: these exist in `algorithm.py` but are never demonstrated by the interactive widget (it only emits `set_add`/`set_add_dup`/`set_in`/`set_discard`). They light up only via the static `codeLabels` on Beats 5–6, so the code panel still walks the full file across the lesson even though the canvas widget doesn't trigger them.
- **Example consistency**: keep the weather packet exactly `("2026-05-28", 47.5, 22.1)` across all tuple beats (matches both `visualizer.tsx` and `algorithm.py`) so the same packet is the through-line.

## Peer review
- verdict: needs-work
- issues:
  - **Beat 5 — visual still renders raw set-notation the narration deliberately avoids.** The narration carefully glosses `O(1)`/`O(n)` and describes the merge cost in words ("about the size of the smaller one"), but the cost tag spec is literally `A∩B / A∪B / A−B  O(min(|A|,|B|))`. A zero-CS 15-year-old has never seen `∩`, `∪`, or the `|A|` size-bars. This is the single worst beginner-safety leak: the canvas shows symbols the prose was rewritten to dodge. FIX — change the tag text to plain English on the visual too: `overlap · merge · leftovers ≈ size of smaller set` (drop `∩ ∪ −` and `|A|` entirely, or show them only with an inline mini-legend "∩ = in both, ∪ = in either, − = in one not the other"). Keep `O(1)`/`O(n)` since those are glossed.
  - **Beat 3 — "TypeError" shown on screen but never glossed.** Visual says the tuple buttons "flash a red TypeError." `immutable` is correctly put in plain words, but `TypeError` is itself unexplained jargon that the 15-year-old will read on the canvas. FIX — label the red flash in plain words, e.g. "✗ not allowed — a tuple can't be changed" (and optionally keep the tiny word `TypeError` as a secondary caption, not the headline).
  - **Beat 1/2 — feasibility gap with ArrayViz.** Visual is tagged `array (plain list)` but asks for (a) a "faint second cluster on the right hinting at a 3-box packet `(date, lat, temp)`" sitting beside the array, and (b) Beat 2's "list length growing" plus a "repeat alice accepted" note. ArrayViz can do chips + a scan cursor + visited toning, but a co-displayed second packet cluster and a growing-length animation are not stock ArrayViz features. FIX — either (i) reuse the existing custom `SetTupleViz` toned-down for beats 1–2, or (ii) explicitly state these are static decorative overlays layered over ArrayViz, not ArrayViz props. Don't imply ArrayViz renders the tuple cluster natively.
  - **Beat 5 — "list `[47.5, 22.1]` is rejected" inset is not driven by the widget.** The plan's own Note (line 94) confirms `SetTupleViz` only emits add/dup/in/discard — it has no tuple-into-set or list-rejection action. So the load-bearing "tuple goes in, list bounces" inset is necessarily a static drawing, not interactive. FIX — say so explicitly ("static inset; the widget does not perform this") so the builder doesn't go hunting for a widget hook that maps to `tuple_key`.
  - **Beat 4 — codeLabels don't cover the beat's load-bearing claim.** Narration's key assertion is "re-adding x does nothing — its slot already holds it" (the dedup/bucket idea), but codeLabels are only `["set_def","tuple_def"]`. The line that actually proves this (`set_add_dup`, algorithm.py L8) is not highlighted. FIX — make codeLabels `["set_def","set_add_dup","tuple_def"]` so the highlighted code matches the spoken claim.
  - **Beat 4 — "fixed record" jargon.** Title "A tuple is a fixed record" uses "record" cold; a 15-year-old won't know the CS sense. Minor, but FIX — gloss once in the narration ("a record = one bundled item with named/positional slots") or just say "fixed packet," reusing the Beat-1 "packet" word for consistency.
  - **Beat 6 — narration↔codeLabels mismatch on tuple_unpack.** codeLabels `["set_in","tuple_unpack"]`, and the plan rationalises tuple_unpack as "unpacking a packet by position." But Beat 6's tuple narration is about *use-cases* ((x,y), (row,col)), not unpacking — the word "unpack" never appears in the beat. The highlighted `tuple_unpack` line (`date, lat, temp = reading`) won't visibly connect to anything on the canvas. FIX — either add one clause to the narration ("…and you pull the pieces back out by position: `date, lat, temp = reading`") or swap the label to `tuple_def` to match the "shape is fixed" framing.
