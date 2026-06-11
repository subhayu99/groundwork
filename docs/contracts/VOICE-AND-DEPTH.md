# VOICE & DEPTH CONTRACT (L0.12 · gates the L1 wave)

Every L1 topic agent follows this file exactly. The three files in `docs/contracts/`
(this one, `TRACK-NARRATIVES.md`, `BEAT-RITUAL.md`) are the single cohesion source for
the 29-topic conversion — when in doubt, these win over taste.

## 1. The three register voices

The voice strings below are **copied verbatim from `src/shared/audience/policy.ts`
(`REGISTER_VOICE`)** — that constant is the runtime-authoritative source; if it ever
changes, this file follows it, never the other way around.

### `intuitive`

> Concrete and everyday. Open with a physical, real-world analogy; keep sentences
> short; introduce no notation or jargon without an immediate plain-language gloss;
> prefer 'how many times you look' over 'O(n)'. Maximum scaffolding, slowest pace.
> Reader: a sharp 10th-grader with zero coding background.

**Depth default: FULL — every beat (≈6–8 per topic).** The intuitive reader gets the
whole ritual (see `BEAT-RITUAL.md`): the naive attempt, the discovery, the physical
cost count, the lot. Nothing is trimmed; this register is the reason each beat exists.

### `structured`

> Balance the intuition with the idea's actual structure. Introduce notation and
> Big-O, each with a one-line plain meaning the first time. Moderate pace, some
> formalism, fewer analogies. Reader: a college student or early-career developer.

**Depth default: 4–5 beats.** Merge the slow on-ramp (the "obvious thing" beat folds
into the setup), keep the wedge, the derivation, the cost+edge-cases beat, and the
pattern close.

### `rigorous`

> Terse and precise. State the invariant, the exact complexity, the edge cases, and a
> one-line proof sketch. Assume comfort with notation; drop the hand-holding and the
> analogies. Fast. Reader: an experienced practitioner or someone in interview prep.

**Depth default: 1–3 beats.** The acid test is `variables` — the lesson that drew
"7 pages for a variable… absurd". Rigorous variables must read as 2–3 beats. Keep:
the derivation (with invariant), cost+edge-cases, the pattern close. A rigorous
reader who wants the long road can switch registers — never pad for them.

## 2. How depth is expressed (mechanism, not prose)

- Tag beats with `registers?: Register[]` on the beat (in `lesson-spec.tsx`).
  **Untagged = appears for everyone.** Tag the beats that only some registers see
  (e.g. `registers: ["intuitive"]` for the slow on-ramp,
  `registers: ["intuitive", "structured"]` for the wedge build-up).
- The engine (`filterBeatsForAudience`) filters BEFORE prose resolution and falls
  back to the full list if a cut would empty the lesson. You never special-case this.
- **`trimOnRefresh: true`** marks the beats that drop when the learner's goal is
  `refresh` — one trim level past the register cut. Mark the generalization/transfer
  beat and the naive-approach beat first; NEVER mark the derivation, the
  cost+edge-cases beat, or the pattern close (a refresher re-derives — that's the
  product promise).
- **Connectors bridge the cuts.** After tagging, step through each register's
  surviving sequence: no surviving beat's `connector` (or prose) may refer to a beat
  that register never saw ("as we just counted…" pointing at a cut beat). Author
  register variants of the connector via `reg()` where needed.

## 3. Prose rules (`reg()` discipline)

- The skeleton — `id`, `visual`, `arrows`, `codeLabels`, `interaction`, geometry,
  beat ORDER — is authored once and shared. Registers may only vary the prose
  fields: `connector`, panel `label`/`title`/`body`, `detail`, `actionLabel`,
  `takeaway`, plus `bridgeFrom`.
- Wrap varying prose in `reg({ base, intuitive, structured, rigorous })`. Provide
  only the variants that genuinely differ; `base` is the universal fallback and
  doubles as the structured voice unless a distinct `structured` is warranted.
- **Base text stays character-identical.** Converting a lesson must not rewrite the
  existing prose: the current text becomes `base` byte-for-byte. Diffs on a converted
  topic should show wrapping + additions, never edits inside the old strings.
  (Improving base prose is allowed ONLY where another L1 instruction explicitly
  requires it — e.g. adding the cost-derivation beat — and then it is an addition.)

## 4. Takeaway hygiene (recall-deck-ready)

Each beat's `takeaway` feeds the "what we've established" spine today and the recall
deck (L4.1) later. Per takeaway:

- **One line.** Target ≤ 90 characters; hard stop at ~120. No second sentence.
- **Standalone prompt test:** shown alone, days later, under the question
  *"what's the idea?"*, the line must be answerable — it names the idea AND its
  payoff, not a step number or a reference to the visual.
  - Good: `Halving is O(log n) — a million items in ~20 steps.`
  - Bad: `We saw how the window moved.` (refers to a scene the reader can't see)
  - Bad: `Much faster now!` (no idea named)
- Plain string takeaways are auto-glossed by the notation bridge. **If a takeaway
  uses notation, the exact spelling must exist in `GLOSSARY` + `AUTO_TOKENS`
  (`src/shared/lesson/glossary.ts`, `gloss.tsx`)** — all composite cost shapes in
  every used spelling are already there (O(V + E), O(n + m), O(j − i), O(rows ×
  cols), O(cells + connections), O(|A|+|B|)…). If you genuinely need a new one, add
  the key + one styled-matched sentence in the same PR; don't ship an unglossed token.
- Register variants of a takeaway must state the SAME idea at different compression
  (intuitive may say "about twenty looks for a million"; rigorous may say the bound).

## 5. Banned moves (hard rules, reviewers reject on sight)

1. **No unexplained jargon in `intuitive`.** Every term/notation gets an immediate
   plain-language gloss (`<Term>` chip or an in-sentence aside) at first appearance.
2. **No analogies in `rigorous`.** No bookshelves, no fingers, no dance partners —
   invariant, cost, edge cases, proof sketch.
3. **Base text stays character-identical** (see §3).
4. **Never copy whole content per register.** Skeleton + `reg()` prose only. If two
   registers share a paragraph, it lives in `base` — a duplicated paragraph in two
   register slots is a contract violation (H3), because it rots independently.
5. **No new beats forked per register.** Depth = the `registers` tag on shared
   beats, never near-duplicate beats per audience.
6. **No fake gates.** `onInteractionDone` fires on the real answering action only
   (see the GATE HONESTY note in `src/shared/lesson/types.ts`) — never on mount,
   hover, or a passthrough click.
7. **No arithmetic prediction gates.** Predictions are recognition taps (H6) —
   "which half dies?", never "compute the index".

## 6. Done-when (per topic, before the paired verifier runs)

- All three registers render: intuitive = full ritual, structured = 4–5 beats,
  rigorous = 1–3 beats; `goal=refresh` drops the `trimOnRefresh` beats and still
  reads coherently in every register.
- `bridgeFrom` + `principle` stamp authored per `TRACK-NARRATIVES.md`.
- Every takeaway passes the standalone-prompt test; notation in takeaways is
  glossary-covered.
- `npx tsc --noEmit` clean; base-text diff is wrap-only.
