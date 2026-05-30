# Annotated-canvas conversion — Hash Maps

Topic: `data-structures/hash-maps` · 7 derivation steps → 7 beats.
Canvas design size: **860 × 470** (matches the reference prototype).
Code source: `src/categories/data-structures/topics/hash-maps/algorithm.py`.

The lesson teaches one idea: instead of **searching** a list for a key, you
**compute** where the key lives and jump straight there. The wedge (Step 3) is
the interactive type-a-name beat and MUST stay a `wedge`. Step 7 is the
generalization/naming beat.

A quick teaching-order note baked into the narration below: the very first time
a piece of jargon shows up it gets a one-clause plain-English gloss — "scan"
(read items one by one), "sorted", "binary search" (halving), O(n)/O(1) (cost
that grows with the pile vs. cost that never changes), "hash function",
"bucket"/"slot", "index" (`arr[i]`), "collision", "chaining", "resize/rehash",
"dictionary".

---

### Beat 1 — The setup · A phone book with ten thousand names. Find Alice's number.
- **narration**: You hold a phone book — ten thousand names, in no special order. Someone asks for Alice's number. You don't know her page, or even if she's listed. Every answer has a cost. How much work is finding one name?
- **visual**: grid — the 13-row phone-book list (name + number, two columns) rendered as a tall stack of `idle` cells, all live/neutral. "alice" sits near the bottom (last entry) but is NOT yet highlighted. A small caption above: `the phone book · find "alice"`.
- **panel**: top
- **arrow**: none (the whole list is the subject; an arrow to one row would mislead).
- **codeLabels**: `[]` (pure setup — no code runs yet; the docked panel shows the file dimmed).
- **interaction**: none

---

### Beat 2 — The obvious thing · Open page one. Start reading.
- **narration**: The simple way: read names top to bottom until you hit Alice — a "scan." On page 4,872 that's 4,872 reads; if she's absent, all 10,000. Cost grows with the pile — call that O(n). Sorting lets you halve the search ("binary search," ~14 checks) but you must keep it sorted. Better idea: what if the name itself told you the page?
- **visual**: grid — same phone-book stack, now animated as a linear scan: a cursor walks top→down, each visited row tinted `visited`, the current row `mid` (sky). A live counter beneath reads `comparisons: N`; it grinds all the way to "alice" near the end, then flips to `✓ found`. (Reuses the existing `LinearScanViz` behaviour.)
- **panel**: bottom
- **arrow**: from the panel up to the current cursor row (the cell being compared right now).
- **codeLabels**: `[]` — the scan is the *naive* baseline; the real `HashMap` code is the fix, not this. Keep the docked panel dimmed so the contrast lands. (Optionally show `hm_get_scan` to hint "this is the slow walk we're about to avoid," but default to `[]`.)
- **interaction**: playback (auto-animates the grind; this is the cost made visible).

---

### Beat 3 — The wedge · Type a name. Watch the address appear.
- **narration**: Here's the turn. Type any name and a "hash function" — a tiny recipe that chews the letters into a number — hands you a slot. It looks nothing up; it just computes. One hop to the answer, no matter how huge the book. The wedge: what if every key knew where to find itself?
- **visual**: grid — a text input on the plane plus a row of 16 numbered `slot` boxes (0–15). As the user types, one box lights `mid` (sky) and shows the typed name; a line reads `hash("name") mod 16 = N`. Below: `found: <number>` if the name is in the book, else `name not in the book`, plus a `1 hop` tag. (Reuses `HashLookupViz`.)
- **panel**: top — main panel. Use a **second `note` panel** (bottom-center) for the wedge question "what if every key knew where to find itself?" — preserve it as its own callout like the reference prototype's `panel2`.
- **arrow**: from the main panel down to the single lit slot box (the computed address).
- **codeLabels**: `hm_slot` (the visual emits this live via `onActiveLine`; `_slot` = `hash(key) % capacity`, the exact line that turns a key into a box number).
- **interaction**: **wedge** — the user MUST type at least once before "Next" unlocks. This is the existing gating step; keep it.

---

### Beat 4 — The structure · An array of buckets, addressed by a hash function.
- **narration**: A hash map is two parts glued together. One: a plain array of slots we call "buckets" — and jumping to box number i (`arr[i]`) is instant however big the array is. Two: the hash function, which turns any key into a box number. Store = hash, drop in the box. Find = hash, look in the box. No searching — just arithmetic.
- **visual**: grid — the 16-box "bucket array" (4×4), each labelled `slot 0…15`. Animate the 13 names dropping into their hashed boxes (`AnimatePresence` pop-in). Most boxes hold one name; a couple hold two. Don't foreground collisions yet — just show "every name landed in a computed box." (Reuses `BucketsViz`.)
- **panel**: left (the 4×4 grid is wide/central; a left panel keeps the boxes clear).
- **arrow**: from the panel to one filled bucket (e.g. a single-name slot) — "key → its computed box."
- **codeLabels**: `hm_put_slot`, `hm_put_append` (storing a key: compute its slot, then drop it in the bucket). The visual already emits `["hm_put_slot","hm_put_scan","hm_put_append"]`; for THIS beat, lead with slot+append (the "drop it in" story). `hm_buckets` (the `[[] for _…]` array-of-slots line) is a fine alternative to anchor "an array of buckets."
- **interaction**: playback (the names animate into their slots).

---

### Beat 5 — The operations · Constant time, on average. Watch the word "average."
- **narration**: Insert, look up, delete: all O(1) on average — cost stays flat whether the table holds ten keys or ten million. Two wrinkles. A "collision" is two keys landing in the same box; we "chain" them (keep a tiny list per box) so both fit. And when the table fills, we build a bigger one and re-place everything — slow, but rare enough to vanish in the average.
- **visual**: grid — same 16-box bucket array, but now the shared-slot boxes are highlighted `mid`/warn (yellow) to make collisions the star; a caption reads `13 names in 16 buckets · K collisions (yellow = two names share a slot — chain them)`. Optionally a small inset showing one yellow box expanding into a 2-item chain. (Reuses `BucketsViz`, collision styling already present.)
- **panel**: bottom
- **arrow**: from the panel up to a yellow (collision) bucket — the box where chaining happens.
- **codeLabels**: `hm_put_scan`, `hm_put_overwrite`, `hm_put_append` (the chaining path: walk the box's tiny list, overwrite if the key's already there, else append). Add `hm_get_scan` to show lookup also walks only that one box.
- **interaction**: none (static — let the reader sit with the collision picture and the word "average").

---

### Beat 6 — When it fits · Lookups by key. Counting. Caching. Deduping. Most things.
- **narration**: Reach for a hash map whenever you'd say "given X, find Y." Counting how often each word appears. Remembering ("caching") an expensive result. Removing duplicates. Joining two datasets on a shared field. The one thing it can't do: keep things in order, or answer "all keys between A and M." For ordered/range work, use a tree.
- **visual**: custom — a small "use-it / don't-use-it" board. Left column (green `yes` tone): four use-case chips — `count words`, `cache results`, `dedupe`, `join on a field` — each with a tiny `dict[key] → value` glyph. Right column (one `no`/hard-toned chip): `keep order / range query → use a tree`. Clean two-column split, no array.
- **panel**: top
- **arrow**: from the panel to the boundary between the green column and the red "use a tree" chip — "here's where hash maps stop."
- **codeLabels**: `lookup`, `membership` (the `dict` lines that ARE "given X find Y": `phone["alice"]` and `"dan" in phone`). `iterate` is a fine add to gesture at the O(n) "walk everything" exception.
- **interaction**: none

---

### Beat 7 — The structure · Hash map. Dictionary, in Python.
- **narration**: This is the named pattern: hash map, hash table, dictionary, associative array — same idea everywhere. Python's `dict` is one; so are JavaScript's `Map`, Java's `HashMap`, Go's `map`. It's the workhorse of real code. The principle underneath is the deepest trade in computing: spend memory (a big array) to never have to search.
- **visual**: custom — the summary card. Center: `phone["alice"] → +1-555-0102   in 1 hop`. Below it, the operations table: insert / lookup / delete / membership = `O(1) average` (green), iterate-all = `O(n)` (warn), order/range = `use a tree` (hard). A one-line footer: `trade space for time`. (Reuses `SummaryViz`.)
- **panel**: bottom
- **arrow**: from the panel up to the `phone["alice"] → … in 1 hop` line (the punchline being named).
- **codeLabels**: `dict_init`, `insert`, `lookup` (the practical "just use `dict`" block — `phone = {}`, `phone["alice"] = …`, then the one-hop read). This anchors the "in practice" half of the file the lesson ends on.
- **interaction**: none

---

## Notes

- **Voice / jargon glosses (content rule).** The current card text uses several
  terms without ever defining them for a true beginner. The narration above
  introduces each on first use:
  - Step 2 card writes `log₂(10,000) ≈ 14` and "binary search" with no
    gloss — a 15-year-old won't parse `log₂`. Rewritten to "halve the search
    (~14 checks)" and the word "scan" is defined as "read names one by one."
  - Step 4 card uses `arr[i]` bare — glossed as "box number i."
  - Step 5 introduces `O(1)`, `O(n)`, "collision," "chaining," "rehash" with
    only light explanation; the beat-5 narration defines collision, chaining,
    and the resize-vanishes-in-the-average idea in plain words. **First O(n)
    appears in Beat 2** ("cost grows with the pile"), and **first O(1) in
    Beat 5** ("cost stays flat") — make sure those glosses survive editing,
    since they're the first time either symbol appears in THIS lesson.
  - "hash function," "bucket"/"slot," "dictionary" all get a one-clause gloss
    on first appearance (Beats 3, 3/4, 7).

- **Code-sync mismatch (real, worth flagging).** The wedge visual hashes with
  `h = h * 31 + charCode` (a polynomial rolling hash), but `algorithm.py`'s
  `_slot` calls Python's built-in `hash(key)`. They are *different* hash
  functions, so the slot a learner sees on screen will NOT equal what the real
  code computes. The `@sync: hm_slot` highlight is still pedagogically correct
  (both do "key → slot via a hash, mod capacity"), but if anyone tries to
  reconcile the on-screen number with the code they'll be confused. Either note
  "illustrative hash" on the canvas or leave as-is; do not claim they're
  identical.

- **Naive beats have no code.** Beats 1 and 2 are the phone-book / linear-scan
  baseline — there is no `@sync` label for "scan the whole book" because the
  point is that the real code *replaces* it. `codeLabels: []` (dimmed panel) is
  intentional and matches the contract's "naive/setup → []" guidance. Don't
  invent a label to fill them.

- **Wedge preservation.** Beat 3 is the only gating beat. It uses the live
  `onInteractionDone` / `onActiveLine` API (type a name → emits `hm_slot`,
  satisfies the wedge). Keep `interaction: "wedge"`; "Next" stays locked until
  the user types. This is the lesson's one required interaction.

- **Dense visual / mobile.** Beat 4–5's 4×4 bucket grid plus a side/bottom
  panel is the tightest layout. On the 860-wide canvas put the panel **left**
  (Beat 4) and **bottom** (Beat 5) so it never overlaps the boxes. On mobile
  the canvas scales down (the prototype's ResizeObserver handles this); the
  16-box grid is the element most likely to crowd — consider shrinking box
  labels (`slot N`) at small scale. The Beat-2 scan list is 13 rows tall; keep
  it in a fixed-height scroll/clip region (the existing `max-h-[260px]
  overflow-hidden`) so the panel arrow target stays on-canvas.

- **Two beats share the label "The structure"** in the source (Steps 4 and 7).
  That's intentional in the original (structure → name), but when rendering the
  beat kicker, Beat 7's title "Hash map. Dictionary, in Python." carries the
  distinction. No bug — just don't let the duplicate label read as a copy-paste
  error.

- **Visual reuse map** (current `visualizer.tsx` → beats): `LinearScanViz` →
  Beats 1–2; `HashLookupViz` → Beat 3; `BucketsViz` → Beats 4–5;
  `SummaryViz` → Beat 7. Beat 6 ("when it fits") has **no existing visual** —
  it's currently a text-only card — so the two-column use-case board is **new
  art** to build for the annotated-canvas form.

---

## Peer review

- **verdict: needs-work**

- **issues:**

  - **Beat 4 — wrong collision count in narration/visual gloss.** The plan says
    "Most boxes hold one name; **a couple hold two**." Running the actual code
    hash (`h*31 + charCode`, mod 16) over the 13-name `PHONE_BOOK`, slot **2
    holds THREE names** (`fawn, eli, june`) and slot 12 holds two (`maya, ivy`).
    Total = 3 collisions. **Fix:** change Beat 4 to "most boxes hold one name; a
    few hold two or more" (or just "some boxes get crowded"), so it isn't
    falsified the instant the boxes render.

  - **Beat 5 — collision caption claims "two names share a slot," but one slot
    has three.** The caption `(yellow = two names share a slot — chain them)` is
    copied from the existing `BucketsViz` (visualizer.tsx L245) and is wrong for
    this dataset (slot 2 = three names). It also makes the chaining story weaker
    (a 3-item chain is the better illustration). **Fix:** reword to "yellow =
    more than one name shares a slot — chain them," and point the Beat-5 arrow at
    slot 2 (the 3-item chain) rather than any 2-item box, since that's the
    strongest "this is why we keep a list per bucket" picture. If you keep the
    optional inset of "one box expanding into a chain," use slot 2's 3-item
    chain.

  - **Beat 2 — `mid (sky)` conflates two different style tokens.** The plan
    describes the current scan row as "`mid` (sky)." In the real code the
    *current* row uses `--accent-sky` (visualizer.tsx L96) while *already-visited*
    rows use `--diff-med` (the "mid"/yellow token, L98). Calling the cursor row
    "`mid` (sky)" mislabels it. **Fix:** say "current row = sky (`--accent-sky`),
    already-read rows = muted/`mid` (`--diff-med`)" so the codeLabels↔visual
    color story is exact.

  - **Stale source comment may leak into "illustrative hash" note.** The plan's
    "Code-sync mismatch" note correctly states the wedge uses a polynomial
    `h*31+charCode` hash. Good — but visualizer.tsx L29 still carries a *wrong*
    comment ("Simple hash: sum of char codes mod buckets"). The plan's note is
    right and the code is polynomial; just make sure whoever builds the canvas
    doesn't echo that stale "sum of char codes" comment into the on-canvas
    "illustrative hash" caption. **Fix:** caption it "illustrative hash
    (polynomial), not Python's built-in `hash`" and (separately) delete the stale
    L29 code comment.

  - **Beat 3 — wedge gloss is beginner-safe but "mod" is unglossed.** The visual
    line `hash("name") mod 16 = N` (and code `% capacity`) shows `mod` to a
    15-year-old with no gloss. `mod` = remainder after division is exactly the
    "wrap into 0–15" trick that keeps the slot in range. **Fix:** add a
    one-clause gloss the first time `mod` appears in Beat 3 narration, e.g.
    "…mod 16 (the remainder after dividing by 16 — it just wraps the number into
    a box from 0 to 15)." Everything else in the jargon ladder (scan, O(n)/O(1),
    bucket, collision, chaining, dictionary) is well-glossed.

  - **Beat 5 — "open addressing" is in the source card but dropped from
    narration; confirm that's intended.** derivation.tsx Step 5 mentions both
    "chaining" AND "open addressing (try the next bucket over)." The Beat-5
    narration keeps only chaining. This is a reasonable simplification for a
    beginner (one collision strategy, not two), and the visual only depicts
    chaining — so it's *coherent*. **Fix (minor):** add a one-line note in the
    plan stating "open addressing intentionally dropped to keep one collision
    story" so a reviewer doesn't read it as an accidental omission of source
    content.

  - **Faithfulness/feasibility — all OK, noting for the record.** Wedge
    preserved (Beat 3, `interaction: wedge`, emits real `hm_slot`); naive beats
    correctly `codeLabels: []`; generalization intact (Beat 7). All cited
    `@sync` labels exist in algorithm.py (`hm_slot`, `hm_buckets`, `hm_put_slot`,
    `hm_put_scan`, `hm_put_overwrite`, `hm_put_append`, `hm_get_scan`,
    `lookup`, `membership`, `iterate`, `dict_init`, `insert`) — none invented.
    All visuals map to existing primitives except Beat 6's two-column board,
    correctly flagged as new art. No false complexity claims (O(1) avg / O(n)
    iterate / use-a-tree for range all match SummaryViz).
