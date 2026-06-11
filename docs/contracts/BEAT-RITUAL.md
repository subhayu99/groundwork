# BEAT RITUAL (L0.12 · gates the L1 wave)

The shared opening/closing shape every lesson follows, so 29 topics read as one
book. The reference implementation is the binary-search pilot
(`src/categories/algorithms/topics/binary-search/lesson-spec.tsx`); its seven beats
ARE this ritual. Slot names below are roles, not required `id`s/labels — but keep
labels in the pilot's register ("The setup", "The wedge", "The win"…) unless the
topic demands otherwise.

## The skeleton (full depth = the intuitive register)

| slot | role | binary-search pilot | notes |
|---|---|---|---|
| 1 | **OPEN** | "The setup" | see opening ritual below |
| 2 | The obvious thing | "The obvious thing" | the naive approach, honestly tried; its cost COUNTED physically (looks, steps, copies) — the E17 seed |
| 3 | The wedge | "The instinct" | the discovery move; interactive (`wedge`), gated behind a **prediction gate** |
| 4 | The derivation | "The derivation" | the idea made mechanical; `playback` beat, code lines following every step |
| 5 | The win + edge cases | "The win" | E17 + E18 — see below |
| 6 | The generalization | "The generalization" | same shape on a different problem; the transfer moment |
| 7 | **CLOSE** | "The pattern" | see closing ritual below |

Topics legitimately vary between 6–8 beats at full depth (a structure topic may need
two derivation-ish beats, an algorithm may fold 5 into 4) — the OPEN and CLOSE
rituals and the E17/E18 placements do not vary.

## Opening ritual (beat 1, every topic)

1. **Bridge line** — `spec.bridgeFrom`, one register-aware line recalling the bridge
   anchor's takeaway (anchor fixed per topic in `TRACK-NARRATIVES.md`). Quiet,
   italic, beat 1 only. The learner starts standing on something they own.
2. **The problem in one breath** — the main panel states the lesson's driving
   problem as one concrete question ("Find page 27 in a 1,000-page book"), never as
   a definition ("Binary search is…"). If the reader can't FEEL the problem, the
   derivation has nothing to push against.
3. **First visual** — the concrete object (the row, the chain, the grid) already on
   canvas in beat 1. No empty stages, no abstract diagrams before the problem is
   physical.

No notation in slot 1's base/intuitive prose. The pattern's NAME is not spoken yet —
naming happens at the close (the learner derives first, names second).

## Closing ritual (last beat, every topic)

1. **Name-the-pattern** — NOW the proper name lands ("this move is called binary
   search / this is a monotonic stack"), explicitly tied to its principle:
   the `PrincipleStamp` ("idea n of 7", per the TRACK-NARRATIVES table) is this
   beat's emotional payload — the learner files the lesson under one of seven ideas.
2. **Takeaway recap** — the close's own `takeaway` states the whole lesson's idea in
   one recall-deck-ready line (hygiene rules in `VOICE-AND-DEPTH.md` §4); the
   accreting spine is now complete and reads as the lesson's summary.
3. **Hand-off** — the engine's completion bar points at the next topic; the close's
   prose may tip forward in ONE clause ("next: what if the row isn't sorted?") but
   never opens new material. The recap beat is also where the code panel auto-opens
   (engine behavior) — the close should read as "here's the whole thing, on one
   screen".

## Where prediction gates belong

- **Before reveals, never after.** The gate sits at the moment the learner has
  enough to GUESS but hasn't been shown: predict which half dies before the wedge
  reveal; predict "way fewer / about the same" before the cost reveal. A gate after
  the reveal is theater — banned.
- **Recognition taps only (H6).** Three tappable choices, answerable by looking at
  the visual — never arithmetic, never recall of terminology. Wrong answer = gentle
  retry with the visual unchanged, not an explanation dump.
- **Gate honesty:** `onInteractionDone` fires on the real answering tap only (see
  `src/shared/lesson/types.ts`). Wedge beats gate "Next" until the genuine
  interaction happened.
- Typical full-depth count: 1–2 gates (the wedge always; optionally the cost
  predict). Gates survive register cuts wherever their beat survives — rigorous
  readers predict too (theirs may gate on the invariant: "which side preserves it?").

## Where the cost-derivation and edge-cases beats sit (E17 / E18)

- **E17 — cost derived physically BEFORE Big-O is named.** The naive cost is counted
  in slot 2 (looks/steps on the actual visual); the new idea's cost is counted in
  slot 5 the same physical way (count the halvings, count each element's on/off) —
  and only once the number is FELT does the notation land: "counting it like this is
  what people write as O(log n)" (with the `<Term>` gloss). Big-O appearing before
  its physical count, in any register's surviving sequence, is a contract violation.
  Algorithms track: mandatory. Structure topics: same rule for their core costs
  (lookup/insert/scan).
- **E18 — "complexity & edge cases" lives with the win (slot 5), before the close.**
  The exact cost (best/worst where it matters) plus the edge cases that bite: the
  empty input, the one-element input, the not-found path, the ±1 boundary, the
  overflow note where honest. Rigorous keeps this beat ALWAYS (it's most of what
  rigorous came for); intuitive gets the same facts told gently. `trimOnRefresh`
  must NOT mark this beat.

## Depth presets (which slots survive — see VOICE-AND-DEPTH for the mechanism)

| register | beats | surviving slots |
|---|---|---|
| `intuitive` | full (≈6–8) | all |
| `structured` | 4–5 | 1 (+2 folded in) · 3 · 4 · 5 · 7 |
| `rigorous` | 1–3 | 4 (with invariant stated) · 5 · 7 (7 may fold into 5 for a 2-beat lesson) |
| `goal=refresh` | −1 level | drop `trimOnRefresh` beats: slot 6 first, then slot 2 |

After tagging, walk each register's sequence start→end: connectors must bridge the
cuts (no references to beats that register never saw), and the OPEN/CLOSE rituals
must still hold — every register, however short, gets a bridge-in and a named,
stamped, recapped close.
