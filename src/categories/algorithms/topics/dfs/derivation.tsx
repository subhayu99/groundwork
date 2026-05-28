import { DerivationStep } from "@/shared/derivation/types";

export const dfsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "A small maze. Get to the corner.",
        body: (
          <>
            <p>
              On the right is a five-by-five grid. You start in the top-left corner. The goal is
              the bottom-right. Some cells are walls &mdash; you can&rsquo;t walk through them.
              You can move one cell at a time: up, down, left, right. <strong>Is there a
              way?</strong>
            </p>
            <p>
              Your eyes can see the answer in a second. A computer can&rsquo;t see the whole grid
              at once. It has to look at one cell at a time.
            </p>
          </>
        ),
        actionLabel: "How would the computer try?",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Try every sequence of moves. There are too many.",
        body: (
          <>
            <p>
              Brute force: write out every possible sequence of moves of every length, check each
              one against the maze. The number of sequences explodes &mdash; four choices at every
              step, applied for steps and steps. For a small maze it&rsquo;s already millions.
            </p>
            <p>
              We need to be smarter than &ldquo;try everything.&rdquo; The first cheap rule:{" "}
              <strong>don&rsquo;t revisit cells.</strong> If we&rsquo;ve already been here,
              we&rsquo;ve already explored everything reachable from here. Going again is wasted.
            </p>
            <p>
              The second rule: if a cell&rsquo;s neighbours all lead nowhere, this cell leads
              nowhere &mdash; turn around.
            </p>
          </>
        ),
        actionLabel: "Walk and back up when stuck",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Pick a direction. Dig as deep as you can. Back up when stuck.",
        body: (
          <>
            <p>
              Press the controls on the right. The walker picks a direction and steps into it. Each
              cell it visits is marked. When the walker can&rsquo;t go anywhere new, it backs up
              one cell and tries the next direction from there.
            </p>
            <p>
              Watch the trail. It snakes outward, hits a wall, retreats, and tries again from the
              last branch point. The retreat is the heart of it.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: the maze from any given cell is a smaller version of the same problem
              &mdash; <em>find a path from this cell to the goal.</em> If a neighbour can find a
              path, this cell can too.
            </div>
          </>
        ),
        actionLabel: "Press play and watch",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Standing at a cell, ask each neighbour.",
        body: (
          <>
            <p>
              Define <code>find_path_from(cell, trail)</code>. Three cases.
            </p>
            <p>
              <strong>You&rsquo;re on the goal.</strong> Return the trail.
            </p>
            <p>
              <strong>You&rsquo;re on any other cell.</strong> Mark it visited. For each
              neighbour: if it&rsquo;s open and unvisited, call{" "}
              <code>find_path_from(neighbour, trail + neighbour)</code>. If that returns a trail,
              return it &mdash; we&rsquo;re done. If it returns nothing, try the next neighbour.
            </p>
            <p>
              <strong>Out of neighbours.</strong> Return nothing. The caller will try its next
              neighbour from the cell it&rsquo;s standing on.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>decomposition</em>. The big maze is solved by
              solving each smaller maze starting from a neighbour. The recursion writes itself.
            </div>
          </>
        ),
        actionLabel: "Count the work",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Each cell handled once. Stack as deep as the longest detour.",
        body: (
          <>
            <p>
              Because we mark cells visited, each cell becomes the &ldquo;current cell&rdquo;
              at most once. From each cell we glance at four neighbours. So the total work is{" "}
              <code>O(cells + walls)</code> (cost grows in step with how big the maze is, plus how
              many connections we have to check) &mdash; for a five-by-five grid, a few dozen
              checks at the very most.
            </p>
            <p>
              <strong>Memory:</strong> the function calls stack up &mdash; one frame per cell along
              the current trail. If the deepest dead-end of the maze is twenty cells in, the stack
              gets twenty deep before retreating.
            </p>
            <p>
              For a very wide and twisty maze, that stack can grow long. Real systems sometimes
              swap the recursive walk for an explicit list (a stack of cells to visit) that lives
              on the heap. Same algorithm, different bookkeeping.
            </p>
          </>
        ),
        actionLabel: "Same shape, new problems",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Not just grids. Anything with neighbours.",
        body: (
          <>
            <p>
              The maze cell could be anything with neighbours &mdash; a folder with subfolders, a
              friend with friends, a webpage with links. The walker doesn&rsquo;t care.
            </p>
            <p>
              Same shape, different stories: crawl every page on a website, find every connected
              component on a social graph, detect cycles in a dependency tree, walk a
              filesystem looking for a file, solve a sudoku by trying each empty cell, count islands
              on a map.
            </p>
            <p>
              Whenever the question is &ldquo;can I reach X from here&rdquo; or &ldquo;what can I
              reach from here,&rdquo; this is the walk.
            </p>
          </>
        ),
        actionLabel: "Name the pattern",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The pattern",
        title: "Depth-First Search.",
        body: (
          <>
            <p>
              That&rsquo;s the name. <em>Depth-first</em> because at each step we go as deep as
              we can before turning around. The opposite habit &mdash; checking everything close
              before anything far &mdash; is a different walk we&rsquo;ll see next.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Is there a path / can I reach / does it connect?&rdquo;</li>
              <li>&ldquo;Visit every connected thing&rdquo; (count components, mark a region)</li>
              <li>&ldquo;Try a choice, undo it, try the next&rdquo; (sudoku, n-queens)</li>
              <li>The natural answer is recursive: each step looks like the original problem</li>
            </ul>
            <p>
              Open the drawer to see the Python. The recursive helper does the real work; the rest
              just sets up the visited set and kicks the walk off at the start.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
