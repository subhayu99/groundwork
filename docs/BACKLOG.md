# Groundwork — Backlog (post B1–B4)

B1–B4 (label-based sync, AnimatedAlgorithmView, phasedVisualizer, tone/CSS colors) are done and
deployed.

**Order (set 2026-05-30): B6 ✅ → cross-cutting → content → frame-by-frame sync audit. B5 is DEFERRED.**

> **B6 done (2026-05-30, commit `0d8a764`, local — not yet pushed):** `src/shared/viz/Scene.tsx`
> is the single node-and-edge SVG engine (positioned circle/rect nodes, toned/labeled/directed edges
> with arrowheads, annotation layer, keyboard-operable nodes). `TreeViz`/`GraphViz` are now thin
> wrappers with unchanged public APIs (consumers: trees, graphs, dp-1d — untouched). tsc/tests/build
> green. **Next: cross-cutting.** New domains use `Scene` directly (rect nodes + directed/labeled edges).

## 1. B5 — contract consolidation (for AI-generated pages) — DEFERRED (do later)
Move `TopicBundle` + `VisualizerProps` into `src/shared/topic/contract.ts`; fold `codeMap` into the
bundle; make step count flexible (drop hardcoded `StepNumber = 1..7`); replace the two near-identical
`topics/index.ts` files + the `if (categoryKey===…)` switch with `defineTopics(domain, bundles)`. Goal: a
model emits ONE self-contained topic object.

## 2. B6 — domain-agnostic `Scene` primitive ✅ DONE (commit `0d8a764`, local)
Positioned-nodes + labeled-edges + annotation layer so new domains reuse the engine without forking:
systems design, DB architectures, distributed systems, load balancing, sharding, OLAP/OLTP,
replication/consensus. Shipped as `src/shared/viz/Scene.tsx`; `TreeViz`/`GraphViz` collapsed into thin
wrappers (the SVG node-and-edge family). Array/grid/stack stay HTML (Motion layout animation) by design
— the SVG node-graph family is what unified. Directed/labeled edges + rect nodes + a11y are the new
capabilities the next domains need.

## 3. Cross-cutting — IN PROGRESS (2026-05-30)
- **Jargon gating — AUDITED, already substantially compliant ✅.** A line→step scan of all 20
  `derivation.tsx` (`/tmp/jargon-step-audit.mjs`) found **zero `O(...)` in steps 1–4** — authors placed
  all complexity discussion in the step-5 "what's cheap, what's not" card. The only steps-1–4 hits are
  LIFO/FIFO at stacks-queues step 4 (defined inline: "LIFO — last in, first out") and bfs step 4 ("the
  queue is FIFO"). `meta.ts`: no Big-O. Viz `O(...)` lives in cost tables / op-labels (summary phases),
  paired with plain words. Conclusion: no broad gating churn needed; revisit bfs-step-4 FIFO if desired.
- **Accessibility — keyboard operability landed centrally:**
  - SVG nodes (trees/graphs) keyboard-operable for free via the B6 `Scene` primitive
    (`role=button`/`tabindex`/Enter+Space → `onNodeClick`). Verified: graphs step-3 nodes activate by
    keyboard. ✅
  - `WindowOverlay` (sliding-window/array window) was **drag-only** → now an ARIA `slider`
    (`role`/`tabindex`/Arrow/Home/End, `aria-valuemin/now/max`). Verified: keyboard slides the window
    AND clears the previously drag-only step-3 wedge gate. ✅
  - `▶` active-line marker already `aria-hidden`. ✅
  - **Viz `aria-live` narration** — `CodeHighlight` now renders a polite `role=status` live region that
    announces the running line ("Now running: mid = (lo + hi) // 2 …") as the active line changes.
    Centralized → every topic for free. Verified: binary-search autoplay emitted 10 in-lockstep
    announcements. ✅ (Future: richer per-operation narration of the *visual* state, not just the code.)
  - **Target-size (WCAG 2.2) audited** across binary-search/graphs/arrays: playback buttons already
    `min-h-[36px]`; the only non-exempt control under 24px was the code scrubber range input (`h-5`→
    now `h-6` = 24px). All other sub-24px hits are inline text links (breadcrumbs, "2 practice
    problems →", topic nav chips) — exempt under the inline-links-in-text exception. ✅
  - **Contrast: NOT yet auto-verified.** Planned axe-core/Lighthouse run was blocked (won't fetch
    remote audit code in this env). TODO: run Lighthouse a11y / axe locally (`npx @axe-core/cli` or
    Chrome DevTools) against the dark + light themes; the OKLCH tokens *look* compliant but this is
    unverified — don't claim it until measured.
  - Pointer-gating closed: both interactive gates (Scene nodes, window slider) are keyboard-operable.

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
