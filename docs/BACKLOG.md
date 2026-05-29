# Groundwork — Backlog (post B1–B4)

B1–B4 (label-based sync, AnimatedAlgorithmView, phasedVisualizer, tone/CSS colors) are done and
deployed. Remaining work, **in the agreed order**:

## 1. B5 — contract consolidation (for AI-generated pages)
Move `TopicBundle` + `VisualizerProps` into `src/shared/topic/contract.ts`; fold `codeMap` into the
bundle; make step count flexible (drop hardcoded `StepNumber = 1..7`); replace the two near-identical
`topics/index.ts` files + the `if (categoryKey===…)` switch with `defineTopics(domain, bundles)`. Goal: a
model emits ONE self-contained topic object.

## 2. B6 — domain-agnostic `Scene` primitive
Positioned-nodes + labeled-edges + annotation layer (array/tree/graph become special cases) so new
domains reuse the engine without forking: systems design, DB architectures, distributed systems, load
balancing, sharding, OLAP/OLTP, replication/consensus.

## 3. Cross-cutting
- **Jargon gating:** `O(1)/O(n)…` and CS terms (hash, bucket, pointer, node, immutable, LIFO/FIFO…)
  appear in early steps before they're explained — gate to ~step 5+ everywhere (code comments, viz
  button labels, card copy).
- **Accessibility:** clickable SVG nodes (trees/graphs) + sliders aren't keyboard-operable and the
  step-3 wedge gate can hard-block keyboard/SR users — add `role`/`tabindex`/keydown, don't pointer-gate
  progress, add a viz `aria-live` narration, `aria-hidden` the ▶ marker, audit contrast + 24px targets.

## 4. Content work
- **Gaps:** hash-maps "bucket" concept is only commented pseudo-code (add real bucket code);
  sets-tuples is hardcoded to `add("alice")` (parameterize); tuple-immutability is told, never shown.
- **Content-correctness pass:** verify every derivation card's claims + left↔right example match, all 20
  `algorithm.py`, and the 40 practice problems/solutions.

## 5. LAST — frame-by-frame code↔visual sync deep audit
Subhayu still perceives sync issues — the highlight is "video-like" and coarse sampling can look synced
when it isn't. **Method: BURST screenshots at ~100–200ms intervals during a single autoplay, plus one
per discrete interaction (click/drag)**, pairing the visual state with the highlighted code line to
confirm the highlight steps in lockstep with each animation frame — on autoplay AND interactive/wedge
steps, across all topics. Harness: `/tmp/burst-sync.js` (a starting point) + `/tmp/analyze.js`.
