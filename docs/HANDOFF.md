# Handoff — Next Session

Read this first. It exists so a fresh session picks up the in-flight work without re-discovering it.

## Hard rules (already saved to user memory — re-state if a new session shows up)

1. **Tenth-grader accessibility.** Every analogy in `derivation.tsx` must be readable by a 15-year-old with no CS background. No `invariant`, `monotone`, `predicate`, `amortized`, `subarray`, `recurrence`, `memoize` before Step 7. Big-O notation only in Step 5's "operations" table and Step 7 — never in Steps 1–4.
2. **Left ↔ right sync.** Whatever the active card says, the right-side viz must show the *same* example: same target, same characters, same numbers, same person's name. If they have to differ for technical reasons, the card must say so explicitly.
3. **Code drawer is a real code viewer.** Syntax-highlighted Python (already implemented in `src/shared/code/CodeHighlight.tsx`), comments that read like explanations, palette tied to the OKLCH design tokens.

## State at this checkpoint

- 12 topics live: 8 data structures + 4 algorithms.
- Latest commits worth knowing about:
  - `ac9ba99` — code drawer chrome stripped to match reference (no traffic lights, no COPY button, muted palette, topic-specific filename)
  - `4c34cc9` — plain-language principle pill labels + Step 5 Big-O explainers (one-liners next to first `O(...)` per topic)
  - `0ac52f7` — previous HANDOFF doc
- No console errors on any topic at the last full Playwright audit (12 topics at 1440×900).
- Production build clean. `npm run test` passes 15/15.

## What's still open (feature work, not polish)

### Code drawer scrub controls + line-by-line viz sync

The reference design (`docs/superpowers/design-reference/uploads/pasted-1779966676590-0.png`) shows the code drawer as an interactive scrubber: ↺ ← Play → controls at the bottom, a `step N / 32` line counter at top right, and an active-line highlight whose row corresponds to the viz state.

Today's implementation is a static syntax-highlighted viewer. To match the reference:
- `CodeHighlight` already accepts `highlightedLines: number[]` — wire it up in `TopicPageClient` so the active step's `Visualizer` can drive which line is highlighted.
- Add a scrub control row inside `TopicLayout`'s drawer panel: reset, back, play/pause, forward, plus a `step N / total` indicator.
- Each topic visualizer would need to expose its step/animation state so the drawer can drive it (and vice versa). Probably wants a small shared `useScrubber` hook in `src/shared/scrubber/`.

This is a real phase, not a polish task. Probably 1-2 sessions.

### Mobile layout

The 12-topic walkthrough confirms the page doesn't crash on a 390px viewport, but the layout is a stacked one-column read with the viz hidden behind a drawer toggle. Acceptable as a known degradation. Real mobile work is a separate phase.

## Repo facts the next agent needs

- Project root: `/Users/subhayu/Downloads/first-principles-learning-platform`
- GitHub: `https://github.com/subhayu99/first-principles-learning-platform`
- Stack: Next.js 16 (Turbopack), TypeScript, Tailwind v4 (OKLCH tokens), Framer Motion, custom SVG for trees/graphs.
- Topic-as-plugin registry at `src/categories/topic-registry.ts` (delegates to per-category registries in `src/categories/{algorithms,data-structures}/topics/index.ts`).
- Adding a topic = drop a folder + append one entry to the category bundle + append meta to `src/categories/registry.ts`.

## How to resume

1. Read this file end-to-end.
2. Read `/Users/subhayu/.claude/projects/-Users-subhayu-Documents/memory/feedback_first_principles_rules.md` — those are the hard rules.
3. The four polish items from the previous session (principle pills, Big-O explainers, visual walkthrough, code drawer cosmetic review) are all done in `4c34cc9` and `ac9ba99`. Push to remote when you have authorization (auto mode classifier blocks push-to-main).
4. The next genuine work is the code drawer scrub controls — see above.
