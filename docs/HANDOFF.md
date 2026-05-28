# Handoff — Next Session

Read this first. It exists so a fresh session picks up the in-flight work without re-discovering it.

## Hard rules (already saved to user memory — re-state if a new session shows up)

1. **Tenth-grader accessibility.** Every analogy in `derivation.tsx` must be readable by a 15-year-old with no CS background. No `invariant`, `monotone`, `predicate`, `amortized`, `subarray`, `recurrence`, `memoize` before Step 7. Big-O notation only in Step 5's "operations" table and Step 7 — never in Steps 1–4.
2. **Left ↔ right sync.** Whatever the active card says, the right-side viz must show the *same* example: same target, same characters, same numbers, same person's name. If they have to differ for technical reasons, the card must say so explicitly.
3. **Code drawer is a real code viewer.** Syntax-highlighted Python (already implemented in `src/shared/code/CodeHighlight.tsx`), comments that read like explanations, palette tied to the OKLCH design tokens.

## What's in flight (in priority order)

### 1. Principle pill labels (small, high-leverage, START HERE)

The pills shown on the home page topic cards and at the top of every topic page render `topic.principles` directly — they show kebab-case strings like `monotonicity and invariants`, `trade space for time`. That's the only remaining CS-coded text the user sees on a topic page.

**The plan:** add a `displayName` field to `PrincipleMeta` with plain-language equivalents, then change the two render sites to look up via `getPrinciple(key).displayName`.

**Files to touch:**
- `src/principles/registry.ts` — add `displayName: string` field to `PrincipleMeta` interface and set it on each principle. Suggested copy:
  - `information-reuse` → "Reuse what you already know"
  - `search-space-pruning` → "Eliminate half each step"
  - `monotonicity-and-invariants` → "Keep a promise alive"
  - `decomposition` → "Smaller version of the same problem"
  - `trade-space-for-time` → "Write it down, look it up"
  - `amortization` → "Pay extra sometimes, save on average"
  - `greedy-choice` → "Best local choice = best overall"
- `src/app/page.tsx` — line ~58: replace `{p.replaceAll("-", " ")}` inside the pill with a lookup. Import `getPrinciple` from `@/principles/registry`.
- `src/app/categories/[category]/[topic]/TopicPageClient.tsx` — line ~59: same change.

**Verify:** open `/` and `/categories/algorithms/sliding-window`. Pills should read in plain English. No kebab-case anywhere.

### 2. Step 5 Big-O tables — add a plain-language explainer line

Step 5 ("the operations") legitimately uses Big-O notation. Per the rule it can stay, but each line should have a one-line explainer the first time a notation appears so the reader doesn't have to know it.

**The pattern to apply per Step 5 card body:** keep `<code>O(...)</code>` but prepend a parenthetical translation the first time per topic.

- `O(1)` → "instant — same cost no matter how big the list is"
- `O(n)` → "cost grows in step with how many items there are"
- `O(log n)` → "cost grows very slowly; doubling the list adds one step"
- `O(n²)` → "cost grows like the square of the size — a thousand items is a million steps"
- `O(n + m)` → "cost grows with the size of both inputs added together"

**Files to touch (every topic has a Step 5 except a couple of foundation topics):**
- `src/categories/data-structures/topics/arrays/derivation.tsx`
- `src/categories/data-structures/topics/strings/derivation.tsx`
- `src/categories/data-structures/topics/hash-maps/derivation.tsx`
- `src/categories/data-structures/topics/sets-tuples/derivation.tsx`
- `src/categories/data-structures/topics/stacks-queues/derivation.tsx`
- `src/categories/data-structures/topics/linked-lists/derivation.tsx`
- `src/categories/data-structures/topics/trees/derivation.tsx`
- `src/categories/data-structures/topics/graphs/derivation.tsx`
- `src/categories/algorithms/topics/two-pointers/derivation.tsx`
- `src/categories/algorithms/topics/binary-search/derivation.tsx`
- `src/categories/algorithms/topics/sliding-window/derivation.tsx`
- `src/categories/algorithms/topics/sliding-window-variable/derivation.tsx`

Approach: open each, find Step 5, add the explainer to the first Big-O appearance. Don't repeat per line — one anchor per notation per topic is enough.

### 3. Visual walkthrough of every topic in a real browser

The headless audit I ran in the last session caught text issues but not visual ones. Walk each topic in a real browser at 1440×900 and look for:

- **Text truncation** in cards (especially Step 4 derivation where prose is densest)
- **Right panel alignment** — viz should center-align vertically and horizontally
- **Stats panel readability** at all steps
- **Code drawer height** — does it crowd out the viz when open at Step 7?
- **Mobile** — open one topic at 390×844 to see how broken it is (we know it's bad; just confirm it's not crashing)

The Playwright skill lives at `/Users/subhayu/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill`. Use it to take full-page screenshots:

```bash
cd /Users/subhayu/Downloads/first-principles-learning-platform && (npm run dev > /tmp/fp-dev.log 2>&1 &) && sleep 5
# then run a Playwright script that visits each /categories/<cat>/<key> and screenshots
```

Topic URLs:
- `/categories/data-structures/{arrays, strings, hash-maps, sets-tuples, stacks-queues, linked-lists, trees, graphs}`
- `/categories/algorithms/{two-pointers, binary-search, sliding-window, sliding-window-variable}`

### 4. Code drawer review (eyeballs needed)

The code drawer was rebuilt with a Python tokenizer + OKLCH palette in commit `c0f5451`. Subhayu remembered the original Claude web design had a specific look he liked. When picking this up:

- Open `/categories/algorithms/sliding-window` (any topic), localStorage-set the topic completed (see snippet below) so the drawer is unlocked.
- Take a screenshot, show it to Subhayu, ask whether the palette/spacing/header match what he remembered.

Reference asset that was the original design source: `/Users/subhayu/Documents/docs/superpowers/design-reference/` (the Claude web export — `code.jsx`, `styles.css`, plus screenshots).

```js
// Set a topic completed so the drawer unlocks for inspection:
localStorage.setItem('fp-progress-v1', JSON.stringify({
  version: 1,
  lastUpdated: new Date().toISOString(),
  categories: { algorithms: { 'sliding-window': {
    derivation: { currentStep: 7, completedSteps: [1,2,3,4,5,6,7], revealedHints: [], completed: true },
    problems: {}, customInputs: [],
  } } },
  settings: { theme: 'system', animationSpeed: 'normal', codeLanguage: 'python' },
}));
```

## State at this checkpoint

- 12 topics live: 8 data structures + 4 algorithms.
- Latest commits worth knowing about:
  - `92522fb` — completed cards re-openable; code drawer pinned under right column only
  - `bc3dd4b` — jargon stripped from algorithm topics
  - `4116988` — Big-O removed from early steps of DS topics
  - `6d169c9` — viz top labels rewritten to plain English everywhere
- No console errors on any topic at the last full audit.
- Production build clean. `npm run test` passes 15/15.

## Repo facts the next agent needs

- Project root: `/Users/subhayu/Downloads/first-principles-learning-platform`
- GitHub: `https://github.com/subhayu99/first-principles-learning-platform`
- Stack: Next.js 16 (Turbopack), TypeScript, Tailwind v4 (OKLCH tokens), Framer Motion, custom SVG for trees/graphs.
- Topic-as-plugin registry at `src/categories/topic-registry.ts` (delegates to per-category registries in `src/categories/{algorithms,data-structures}/topics/index.ts`).
- Adding a topic = drop a folder + append one entry to the category bundle + append meta to `src/categories/registry.ts`.

## How to resume

1. Read this file end-to-end.
2. Read `/Users/subhayu/.claude/projects/-Users-subhayu-Documents/memory/feedback_first_principles_rules.md` — those are the hard rules.
3. Do item 1 (principle pills) first — it's the smallest and most visible win.
4. Commit after each item with a focused message. Push.
5. Cross items off this list by deleting them from this file when done, and update "State at this checkpoint" before the next handoff.
