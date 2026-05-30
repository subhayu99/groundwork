# Peer Review — algorithms / binary-search

Verdict: **minor-fixes**

Files reviewed:
- `src/categories/algorithms/topics/binary-search/lesson-spec.tsx`
- `src/categories/algorithms/topics/binary-search/derivation.tsx` (ground truth — concepts)
- `src/categories/algorithms/topics/binary-search/algorithm.py` (ground truth — code + @sync labels)

## Summary
Strong, faithful conversion. The wedge interaction (`ClickToHalve`) and the playback
derivation (`AutoBinarySearch`) both survive, the generalization step (boundary / ship
capacity) is preserved, and the conversion **correctly stripped the CS jargon** the
derivation used unsafely — `log₂(1,000)`, `bisect`, `B-trees`, "linear scan", "pointers",
"search space pruning" are all gone or rephrased in plain words. Big-O / log notation
appears nowhere in panel bodies. All seven beats' `codeLabels` reference **real** `@sync`
anchors in `algorithm.py` (`sig, init, loop, mid, compare, found, less, lo_update,
greater, hi_update, notfound`). No invented labels.

Remaining issues are about code-label/narration alignment and a couple of writing nits.

## Issues

### 1. [medium] `general` beat — codeLabels emphasize the equality branch, but the narration is about a yes/no boundary
Beat `general` narration teaches the *boundary* form ("finds the boundary between 'too
small' and 'big enough'… no list at all"). Its `codeLabels` are
`["compare", "less", "greater"]`. `compare` is the **equality** check
(`arr[mid] == target`) — the boundary form has no equality check; it's a two-way
"feasible? yes/no" pivot. Highlighting `compare` here slightly contradicts the very point
the beat makes (that this generalization drops the exact-match test).
**Fix:** drop `compare`; use `codeLabels: ["less", "greater"]` (the directional
pruning is what carries over to boundary search). The `less`/`greater` pair is exactly
the "go up / go down" decision the narration describes.

### 2. [low] `wedge` beat — codeLabels cover only the "bigger" branch, narration leads with both
Beat `wedge` narration covers both directions ("bigger than 27 → right half gone… Smaller?
the left half goes"). Static `codeLabels` are `["greater", "hi_update"]` — only the
"bigger" branch. (The live interaction does fire `["less","lo_update"]` dynamically, so
this is just the resting highlight.) Mildly asymmetric vs. the narration.
**Fix (optional):** `codeLabels: ["less", "greater"]` to mirror the two-way "bigger/smaller"
framing the panel uses, leaving the specific `lo_update`/`hi_update` lines to the live
`api.onActiveLine` calls.

### 3. [low] `win` beat — "database indexes" is unexplained jargon (borderline)
Beat `win` body: "…from search to **database indexes** — runs on this." A 15-year-old with
zero CS may not know what a database index is. It is far safer than the derivation's
"B-trees / bisect," but it's still an unexplained term used as the payoff.
**Fix:** soften to a plain image, e.g. "…why anything that keeps data in order — search
engines, the lookups inside apps — leans on this." Or keep "database indexes" but gloss it:
"…database indexes (the sorted lookup tables that make apps feel instant)…".

### 4. [low] `derive` beat — body is one dense run of clipped fragments (readability)
Beat `derive` body: "Check the middle. Match? done. Too small? the answer's to the right,
move `lo` past it. Too big? move `hi` before it." The staccato fragments plus three inline
`<code>` tokens read as a wall on first pass. It's ~55 words and parses, but it's the
densest panel in the lesson. `lo`/`hi` ARE introduced in-sentence ("two markers — lo at the
start, hi at the end"), so beginner-safety is fine; this is purely flow.
**Fix (optional):** add a touch of connective tissue: "Check the middle value. A match? You're
done. Too small? The answer must be to the right, so move `lo` just past the middle. Too big?
Move `hi` just before it."

## Checks that PASSED
- All `codeLabels` are real `@sync` anchors — no phantom labels.
- No Big-O, no `log`/`log₂`, no complexity notation in any panel body.
- `lo` / `hi` are taught in plain words ("two markers") before/at first `<code>` use.
- "index" appears only in SVG visual captions, never in panel narration (bodies say "page").
- Content correctness: "1,000 → ~10 halvings, a million → ~20" is right; "up to 1,000 looks"
  for one-by-one is right; the sorted-implies-right-half-bigger claim is correct.
- Faithfulness: wedge interaction, two-marker derivation, halving-cascade win, and the
  ship-capacity boundary generalization are all preserved. Target changed from "Karen
  Salazar" (name lookup) to "27" (numeric) to match the numeric array visual — consistent,
  not a defect.
