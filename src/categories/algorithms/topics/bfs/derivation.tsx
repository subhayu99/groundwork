import { DerivationStep } from "@/shared/derivation/types";

export const bfsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Same maze. New question: how few steps?",
        body: (
          <>
            <p>
              On the right is the same five-by-five maze. Same start, same goal. But now the
              question is <strong>not</strong> &ldquo;is there a way?&rdquo; The question is{" "}
              <strong>&ldquo;what&rsquo;s the fewest steps?&rdquo;</strong>
            </p>
            <p>
              That word <em>fewest</em> changes everything. A walker that dives deep along one
              branch might find a way, but it might find a long, scenic way. We need a walker that
              somehow always reports the shortest route.
            </p>
          </>
        ),
        actionLabel: "Why deep-first isn't enough",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Depth-first finds a path. It doesn't promise the shortest.",
        body: (
          <>
            <p>
              The depth-first walker plunges down one branch all the way to a dead end before
              trying another. If the goal happens to be on the first branch, great. If
              it&rsquo;s one cell away through a different branch, the walker still slogs across
              the whole maze first.
            </p>
            <p>
              So the walker would need to keep finding paths and remember the shortest. That works
              &mdash; but it does a ton of extra exploring. There&rsquo;s a smarter order.
            </p>
            <p>
              What if instead of going deep, we explored <em>by distance</em>? Visit every cell
              one step from start, then every cell two steps away, then three&hellip; The very
              first time we touch the goal, that&rsquo;s as close as it&rsquo;s ever going to be.
            </p>
          </>
        ),
        actionLabel: "Walk outward by distance",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Spread a ripple outward, one ring at a time.",
        body: (
          <>
            <p>
              On the right, press play. A ripple of light spreads out from the start cell. First
              it lights the cells one step away. Then those one step from <em>those</em>. Then
              three. Then four.
            </p>
            <p>
              The number under each cell is the distance &mdash; the smallest number of steps from
              start that touches it. The first time the ripple reaches the goal, that number is
              the answer.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: the ripple grows in lockstep. There&rsquo;s no way a cell <em>two</em>{" "}
              steps away has been touched before a cell <em>one</em> step away. So when we first
              touch the goal, no shorter route exists. We&rsquo;ve already checked all the closer
              ones.
            </div>
          </>
        ),
        actionLabel: "Press play and watch the ripple",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "A queue holds 'the next ring to look at'.",
        body: (
          <>
            <p>
              Keep a <strong>queue</strong> &mdash; a line where you join at the back and get
              called from the front. Put the start cell in line with distance 0.
            </p>
            <p>
              <strong>Loop:</strong> pull the next cell from the front. If it&rsquo;s the goal,
              its distance is the answer. Otherwise, look at each open, unseen neighbour. Mark them
              seen, give them distance = mine + 1, and put them at the back of the line.
            </p>
            <p>
              Marking cells seen the moment they enter the line is the small but crucial detail.
              It means each cell gets a distance exactly once &mdash; the smallest possible.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>keep a promise alive.</em> The queue is FIFO, so
              the distance of whatever we pop only ever goes up. The first time we touch the goal,
              its distance is the smallest it will ever be.
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
        title: "Each cell enters the line once. Each is checked once.",
        body: (
          <>
            <p>
              Because we mark a cell seen the moment it enters the line, no cell ever joins the
              line twice. With cells <code>V</code> and connections <code>E</code>, total work is{" "}
              <code>O(V + E)</code> (cost grows in step with how many cells plus how many
              connections we look at).
            </p>
            <p>
              <strong>Memory:</strong> the queue holds the cells in the current and next ring at
              the same time. For a thin, long maze that&rsquo;s small. For a wide-open grid the
              queue can hold the whole perimeter of the wavefront at once &mdash; still much
              smaller than the full grid.
            </p>
            <p>
              <strong>vs DFS:</strong> same total work for the same maze. The difference is in
              what you discover first &mdash; closest first, instead of deepest first.
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
        title: "Anywhere you want 'closest first'.",
        body: (
          <>
            <p>
              The maze is just a familiar example. Anywhere the connections are equal-cost &mdash;
              one click is one click &mdash; this walk gives the shortest route.
            </p>
            <p>
              Same shape, different stories: degrees of separation on a social graph (&ldquo;how
              far is this person from me?&rdquo;), word ladders (turn cat into dog one letter at
              a time), routing a packet across a network with equal-weight links, level-by-level
              traversal of a tree, broadcasting a message to all your immediate neighbours, then
              theirs, then theirs.
            </p>
            <p>
              When connections aren&rsquo;t equal-cost &mdash; a real road map with distances
              &mdash; the walk needs a different bookkeeper (a priority queue, sorted by total
              cost). That&rsquo;s Dijkstra&rsquo;s algorithm. Same shape, smarter line.
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
        title: "Breadth-First Search.",
        body: (
          <>
            <p>
              That&rsquo;s the name. <em>Breadth-first</em> because we finish every cell at
              distance d before any cell at distance d+1. <em>The queue</em> is what makes that
              order happen.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Fewest steps / shortest path&rdquo; in an unweighted graph or grid</li>
              <li>&ldquo;Closest matching X&rdquo; on a network of equal-cost links</li>
              <li>&ldquo;Level-by-level&rdquo; anything &mdash; print a tree level by level,
              broadcast outward</li>
              <li>Every step has the same cost</li>
            </ul>
            <p>
              Open the drawer for the Python. A queue, a visited set, a loop. The trick is in the
              order, not the code.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
