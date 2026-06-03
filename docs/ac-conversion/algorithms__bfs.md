# Annotated-Canvas conversion — algorithms / bfs (Breadth-First Search)

Topic title: **Breadth-First Search**
Canvas design size: **860 × 470** (match the reference prototype).
Code source: `src/categories/algorithms/topics/bfs/algorithm.py`.
Primitive used throughout: **grid** (5×5 maze) — except Beat 6, which is a **graph**, and Beat 4's grid sits beside a small **stack/queue** column (front-on-top line).

Real `@sync` labels available in `algorithm.py`:
`sig`, `rows`, `cols`, `seen`, `init_queue`, `loop`, `dequeue`, `visit`, `found`, `neighbors`, `seen_check`, `mark`, `enqueue`.

The maze (0 = open, 1 = wall), START = top-left (S), GOAL = bottom-right (G):
```
0 0 0 0 1
1 1 0 1 0
0 0 0 0 0
0 1 1 1 0
0 0 0 0 0
```

---

### Beat 1 — The setup · Same maze. New question: how few steps?
- **narration:** Same maze, same start (S) and goal (G). But the question changed. Not "is there a way out?" — now it's "what's the *fewest* steps?" That word *fewest* changes everything: a long winding path still counts as a path, so we need a walker that always reports the shortest route.
- **visual:** grid — the full 5×5 maze. Walls toned dark/solid, open cells idle. S highlighted (start tone) top-left, G highlighted (goal tone) bottom-right. No distance numbers yet.
- **panel:** top
- **arrow:** from the panel down to the **G** cell (the goal we now want the *shortest* path to).
- **codeLabels:** `["sig"]`
- **interaction:** none

---

### Beat 2 — The obvious thing · Depth-first finds a path. It doesn't promise the shortest.
- **narration:** A depth-first walker dives down one branch all the way to a dead end before trying another. On *this* maze its path happens to be 8 steps — the true shortest. But on another maze it could slog the long way around. Finding *a* path isn't the same as finding the *shortest* one.
- **visual:** grid — same maze. The pre-computed DFS trail (S→(0,1)→(0,2)→(1,2)→(2,2)→(2,3)→(2,4)→(3,4)→G) lit in a "trail" tone; all other open cells dimmed/idle. Walls solid.
- **panel:** bottom
- **arrow:** from the panel up to a mid-trail cell (e.g. (2,2)) where the trail bends — the "scenic detour" moment.
- **codeLabels:** `["sig"]`
- **interaction:** none

---

### Beat 3 — The wedge · Spread a ripple outward, one ring at a time.
- **narration:** Press play. A ripple of light spreads from S. First the cells one step away, then two, then three. The small number on each cell is its *distance* — the fewest steps from S to reach it. The instant the ripple touches G, that number is the answer: nothing closer was skipped.
- **visual:** grid — animated ring-by-ring flood. Each newly reached open cell turns "visited" tone and shows its distance number as a sub-label (0 on S, then 1, 2, 3…). The current frontier ring reads brightest. When G is hit, it flashes goal/found tone with its distance. A live counter shows "cells reached" and, on arrival, "✓ goal at distance N".
- **panel:** left
- **arrow:** none (the spreading rings *are* the action; an arrow would fight the animation). Optionally a small note panel ("the wedge") bottom-right restating: a cell two steps away can never light before a one-step cell, so the first touch of G is the shortest.
- **codeLabels:** `[]` (conceptual ripple — no single code line yet; the queue is introduced next beat)
- **interaction:** wedge — **PRESERVE.** User must press play (or step the rings) to advance the ripple to the goal before continuing.

---

### Beat 4 — The derivation · A queue holds 'the next ring to look at'.
- **narration:** A *queue* is a waiting line: you join at the back, you're called from the front (first in, first out — FIFO). Put S in line at distance 0. Loop: pull the front cell; if it's G, its distance is the answer. Otherwise mark each open, unseen neighbour *seen*, give it distance = mine + 1, and send it to the back. Marking on entry means each cell is counted once — at its smallest distance.
- **visual:** grid (maze with distance numbers, current cell in "active" tone) beside a vertical **queue** column on the right, front on top, each slot showing `(row,col)` and `d=…`. One BFS operation per frame: dequeue front → goal-check → push unseen neighbours to the back. A "visited" counter sits below.
- **panel:** top
- **arrow:** from the panel to the **front slot of the queue** (the cell about to be pulled) — the "called from the front" idea.
- **codeLabels:** `["init_queue", "loop", "dequeue", "visit", "found", "seen_check", "mark", "enqueue"]` (the whole loop body; the live visual narrows these per frame via `onActiveLine`)
- **interaction:** playback

---

### Beat 5 — The operations · Each cell enters the line once. Each is checked once.
- **narration:** Because a cell is marked seen the moment it joins the line, it never joins twice. Count V cells and E connections: the total work is O(V + E) — "O(...)" just means *how the effort grows*, and here it grows in step with how many cells plus connections we look at. Memory holds only the current wavefront, not the whole grid.
- **visual:** grid — the fully explored maze, every reachable open cell carrying its final distance number (toned "visited"), the shortest path S→G subtly emphasised. A small side tally: "cells V · connections E · work O(V+E)". (Reuses the Beat-4 final frame, frozen, distances shown.)
- **panel:** bottom
- **arrow:** from the panel up to the queue/wavefront region (or to any one cell) to anchor "each enters once".
- **codeLabels:** `["seen", "seen_check", "mark"]` (the seen-set is exactly what guarantees once-each)
- **interaction:** none

---

### Beat 6 — The generalization · Anywhere you want 'closest first'.
- **narration:** The maze is just one story. Wherever connections cost the same — one click is one click — this outward walk gives the shortest route: degrees of separation on a friend network, word ladders (cat→…→dog), routing a packet over equal-cost links, printing a tree level by level. When links have *different* costs (a real road map), you swap the plain line for a priority queue — that's Dijkstra's algorithm. Same shape, smarter line.
- **visual:** graph — a small node-and-edge network (~7–9 round nodes, equal-length edges) with a source node ringed, BFS distance rings shown as concentric "0,1,2" bands or distance labels on each node. Drop the grid here so the "any equal-cost network" point lands visually. Edges drawn equal/uniform to stress "one click is one click".
- **panel:** top
- **arrow:** from the panel to the **source node** (the "me" the distances are measured from).
- **codeLabels:** `["neighbors", "enqueue"]` (the neighbour loop + push is the part that's network-shape-agnostic)
- **interaction:** none

---

### Beat 7 — The pattern · Breadth-First Search.
- **narration:** That's the name. *Breadth-first* because we finish every cell at distance d before any cell at d+1, and the queue is what forces that order. Reach for it when you hear "fewest steps / shortest path" on an unweighted map, "closest matching X", or "level by level" — anywhere every step costs the same.
- **visual:** grid — the solved maze, the shortest S→G path lit in "found" tone with a ✓ on G and "shortest distance N" shown; non-path cells dimmed. Pattern-signal bullets live in the panel, not the canvas.
- **panel:** right
- **arrow:** from the panel to the **G** cell (✓ — the answer the whole walk was for).
- **codeLabels:** `["found"]`
- **interaction:** none

---

## Notes

- **Wedge preserved (Beat 3).** The original gating interaction is the ripple: the user must press play / step the rings until the flood reaches the goal. Keep `interaction: "wedge"` and require the play/step action before "Next" unlocks. This is the only wedge in the lesson — do not let the auto-playback of Beat 4 absorb it.

- **Beat 4 is the densest frame: maze + live queue side-by-side.** On the 860×470 canvas, dock the queue column to the right of the maze (mirrors the current `flex-row` layout) and put the text panel along the **top** so it never overlaps either. On mobile, the queue column will be tight — consider showing only the first ~6 queue slots with a "+N more" footer (the visualizer already caps at 7).

- **Beat 3 arrow = none on purpose.** A flood animation reads on its own; a static arrow pointing at one cell would lie as the ripple moves. Use a small "note" panel for the wedge restatement instead of an arrow.

- **Primitive switch at Beat 6 (grid → graph).** Every other beat is the maze grid; Beat 6 deliberately swaps to an abstract node-edge graph so "any equal-cost network" isn't read as "only grids". Keep edges visually uniform to sell "one click is one click". This is the lesson's generalization step — keep it.

- **Jargon taught inline (first appearance, plain words):**
  - *queue / FIFO* — Beat 4: "a waiting line: join at the back, called from the front (first in, first out)."
  - *distance* (as smallest-steps) — Beat 3: defined as "the fewest steps from S to reach it."
  - *seen / visited / marked* — Beat 4: "mark each open, unseen neighbour seen … counted once."
  - *Big-O — O(V+E)* — Beat 5: "'O(...)' just means how the effort grows."
  - *node / edge / graph* — Beat 6: introduced as a "node-and-edge network" of people/links, in plain terms.
  - *priority queue / Dijkstra* — Beat 6: named only as "a smarter line" for unequal costs; not required to understand BFS.

- **CONTENT BUG / risk spotted — DFS length claim (Beats 2 & 5).** The current lesson and visualizer (`ContrastViz`) assert that on *this* maze DFS length (8) equals the true shortest (8), then say "on a different maze depth-first could be much longer." That's pedagogically fine but slightly self-undercutting: the headline "Depth-first … doesn't promise the shortest" is demonstrated by an example where it *does* match. The narration I wrote leans into this honestly ("on *this* maze it happens to match"). Keep the honest framing rather than implying DFS is shown failing here — otherwise an alert 15-year-old will notice the example contradicts the headline.

- **`V` / `E` are undefined symbols in the current Beat-5 text.** The original derivation writes `O(V + E)` with `<code>V</code>`/`<code>E</code>` introduced only as "cells V and connections E" in passing. In the AC version, the panel must spell out V = number of cells, E = number of connections *before or as* O(V+E) appears, and O(...) itself must be glossed (done above). This is the main content-rule fix needed on conversion.

- **Distance sub-labels must stay legible on small cells.** The grid uses 56px cells with a distance sub-number; at mobile scale verify the sub-number doesn't collide with the S/G letters. The reference scaler (`ResizeObserver`, min scale 0.3) handles shrink, but the distance digits are the smallest text on the plane — they are load-bearing for the whole "closest first" story.

---

## Peer review
- verdict: needs-work
- issues:
  - **Beat 5 — "connections E" is an undefined term for a grid (BEGINNER-SAFETY).** The narration says "Count V cells and E connections: the total work is O(V + E)". On a maze a 15-year-old has no idea what a "connection" is — nothing earlier in the lesson uses that word. The notes flag that V/E must be spelled out but the Beat-5 narration itself still leaves "connection" undefined. FIX: in Beat 5, define it concretely for the grid before O(V+E) appears, e.g. "V = how many open cells there are; E = how many neighbour-to-neighbour links between them (each cell touches up to 4)." Only then introduce O(V+E).
  - **Beat 5 — "wavefront" / "current wavefront" is unexplained jargon (BEGINNER-SAFETY).** Narration: "Memory holds only the current wavefront, not the whole grid." The word *wavefront* never gets a plain-words gloss anywhere (Beat 3 says "ring" / "ripple"; Beat 4 says "the next ring"). FIX: reuse the already-established word — "Memory holds only the cells in the current ring (the ripple's edge), not the whole grid." Keep the vocabulary consistent with Beats 3–4 ("ring"), drop "wavefront".
  - **Beat 6 — codeLabels `["neighbors", "enqueue"]` rationale is backwards (FAITHFULNESS/CORRECTNESS).** The note claims `neighbors` is "the part that's network-shape-agnostic". The `neighbors` line in algorithm.py is `for dr, dc in ((-1,0),(1,0),(0,-1),(0,1))` — the four grid offsets, i.e. the MOST grid-specific line in the file. Highlighting it while saying "this generalizes to any network" mildly contradicts the code shown. FIX: either (a) keep `["enqueue"]` only and narrate "the push to the back is the same on any network; only how you *list* a node's neighbours changes", or (b) keep `neighbors` but call it out honestly as "the one line that swaps out per network shape" rather than the shape-agnostic part.
  - **Beat 4 — `seen` (initial seed of start) is missing from codeLabels (COHERENCE).** Narration explicitly says "Put S in line at distance 0" and "Marking on entry means each cell is counted once". The seeding `visited = {start}` carries `@sync: seen`, and the once-each guarantee is the seen-set — yet Beat 4's labels are `["init_queue","loop","dequeue","visit","found","seen_check","mark","enqueue"]` with `seen` omitted. Beat 5 uses `seen` but Beat 4's "marking on entry / counted once" sentence has no line to land on. FIX: add `"seen"` to Beat 4 codeLabels so the "marked seen on entry" claim has its code anchor.
  - **Beats 2 & 5 — DFS "same total work" framing risks contradicting the Beat-2 headline (FAITHFULNESS).** The note already flags this honestly, but the plan's Beat-2 narration ("on *this* maze its path happens to be 8 steps — the true shortest") plus Beat-5's "same total work for the same maze" can read to an alert 15-year-old as "so why not just use DFS?" FIX: in Beat 5 keep one sentence making the discriminator explicit — "DFS finds *a* path with the same total work, but BFS is the only one whose *first* arrival at G is guaranteed shortest" — so the win is restated where the cost comparison lands, not just in Beat 2.
  - **Beat 3 — `codeLabels: []` is fine, but confirm the primitive supports a code-drawer-empty beat (FEASIBILITY).** The conceptual-ripple beat shows no active line. Verify the AC renderer tolerates an empty codeLabels array without leaving a stale highlight from Beat 2's `sig`. Minor, but call it out so the build doesn't carry Beat 2's `sig` highlight into the wedge.
  - **Nit — Beat 4 narration "give it distance = mine + 1" uses an informal pronoun ("mine") (BEGINNER-SAFETY, minor).** A first-time reader may not parse "mine" = "the cell I just pulled from the front". FIX: "give it a distance of one more than the cell we just pulled."
