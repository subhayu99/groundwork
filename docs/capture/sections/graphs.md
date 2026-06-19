## graphs
route: `/categories/data-structures/graphs/` · diagram shape: box

### Beat 1 — The setup

![graphs beat1 desktop](img/graphs/beat1-d.png)
![graphs beat1 mobile](img/graphs/beat1-m.png)

The header reads "GRAPHS · WHO KNOWS WHOM" with an "IDEA 5 OF 7" pill and "step 1/5 · THE SETUP". A "BUILDS ON" bar shows two prerequisite pills, Trees and Hash Maps, with a close (×) control at the right. The canvas shows the social network as an idle node-and-edge graph: eight labelled circle nodes (alice, bob, cara, harper, dan, eli, fawn, grace) joined by undirected friendship lines, with no node lit. The main panel below carries the eyebrow "THE SETUP", title "Who knows whom?", and body text introducing connections (friends, web links, roads) and that a line means "these two are friends." The footer has the why? · code · recap chips and a row of five progress dots with the first filled. On desktop the side rails read "BACK" (left) and "I HAVE THE QUESTION" with a chevron (right). On mobile the diagram stacks above the panel, the prerequisite pills sit under the header, and a bottom bar shows "Back", a "1 / 5" counter, and an "I have the question →" button. A zoom −/+ control sits at the canvas bottom-right. This beat has no interaction.

### Beat 2 — The instinct

![graphs beat2 desktop](img/graphs/beat2-d.png)
![graphs beat2 mobile](img/graphs/beat2-m.png)

Labelled "THE INSTINCT" with title "Click a person. Follow their links." The same eight-person graph appears with the caption "click any person — their direct friends light up" above it and a "↺ reset" button below the nodes. A floating note card overlaps the lower-right of the canvas: "The instinct: what is the smallest amount of record-keeping needed to answer 'who's connected to whom?'". The interaction type is wedge: clicking a node fires the interaction-done signal, turns that node active, lights its direct neighbors ("trail" tone) plus the connecting edges, activates the bfs_neighbors code line, and changes the caption to report that person's friend count ("one lookup"). The shot shows the pre-interaction state, so the right rail reads "LOCKED" and the footer instructs "↑ TRY IT ON THE DIAGRAM TO CONTINUE"; performing one click clears the gate and unlocks advance. The why? · code · recap chips and the five-dot tracker (second dot filled) sit at the bottom.

### Beat 3 — The structure

![graphs beat3 desktop](img/graphs/beat3-d.png)
![graphs beat3 mobile](img/graphs/beat3-m.png)

Labelled "THE STRUCTURE" with title "A graph = dots + lines." The visual highlights alice (active/blue) with her edges drawn green ("trail" tone), and beside the graph a code-styled panel renders the adjacency list as `friends = {` followed by one row per person (`alice: [bob, cara, harper]`, `bob: [alice, dan, harper]`, `cara: [alice, eli, harper]`, `harper: [alice, bob, cara, fawn, grace]`, `dan: [bob, fawn]`, `eli: [cara, grace]`, `fawn: [dan, harper]`, `grace: [eli, harper]`) and a closing `}`, with alice's row tinted in the accent color. The body text defines a graph as nodes plus edges stored as an adjacency list, a lookup table from each person to their friends. The right rail reads "WHAT OPERATIONS?". The footer shows the why? · code · recap chips and the five-dot tracker with the third dot filled. This beat has no interaction.

### Beat 4 — The operations

![graphs beat4 desktop](img/graphs/beat4-d.png)
![graphs beat4 mobile](img/graphs/beat4-m.png)

Labelled "THE OPERATIONS" with title "Walk it: nearest friends first." The graph sits idle with only alice lit (active/blue) and a caption above reading "a walk starts at alice — commit to its shape, then watch". A "PREDICT" panel on the right poses "The walk starts at alice. Who gets visited, in what shape?" with three choice pills: "in rings — friends, then friends-of-friends", "one deep path, then back up", and "around the loops — some visited twice". The interaction type is wedge, run through a prediction gate: tapping one pill fires the interaction-done signal, shows feedback, and after a short pause the gate reveals an automatic breadth-first-search playback that spreads ring by ring from alice (the "rings" pill is the correct choice). The shot shows the pre-interaction, pre-reveal state, so the right rail reads "LOCKED" and the footer instructs "↑ TRY IT ON THE DIAGRAM TO CONTINUE". The why? · code · recap chips and the five-dot tracker (fourth dot filled) appear at the bottom; on mobile the predict panel is partly off-screen to the right and the bottom bar shows "4 / 5" with a "Name it →" button.

### Beat 5 — Graph

![graphs beat5 desktop](img/graphs/beat5-d.png)
![graphs beat5 mobile](img/graphs/beat5-m.png)

Labelled "THE STRUCTURE" with the single-word title "Graph." The visual returns to the plain idle eight-person graph with no nodes highlighted. The body text names the structure as a table from each node to its neighbors and points to breadth-first / depth-first walks (dive deep down one path, then back up), shortest routes, and spotting separate clusters as the richness on top. The right rail reads "FINISH". The footer shows the why? · code · recap chips and the five-dot tracker with the fifth (last) dot filled. This beat has no interaction.

### Code drawer

![graphs code drawer desktop](img/graphs/drawer-code-d.png)

Opened from the "CODE" chip, the drawer slides in from the right titled "THE CODE SO FAR" and shows the Python source with line numbers. Visible lines include the tail of the edge setup (`add_edge("harper", "grace")`), then a commented breadth-first search section: "Breadth-first search: visit closer-by friends … This finds shortest paths in unweighted graphs", `def bfs(start: str) -> list[str]:` with `seen: set[str] = {start}`, `queue: deque[str] = deque([start])`, and `order: list[str] = []`, followed by a `while queue:` loop that pops with `queue.popleft()`, appends to `order`, iterates `for neighbor in friends[node]:`, and adds unseen neighbors to both `seen` and the queue, then `return order`. Below it a commented depth-first search section defines `def dfs(start: str) -> list[str]:` with a `seen` set and `order` list and a nested `def visit(node: str) -> None:` helper that returns early if the node is in `seen`, then calls `seen.add(node)`. The current active line (around line 53, `seen.add(node)`) is highlighted with a left-edge caret marker.
