import { DerivationStep } from "@/shared/derivation/types";

export const mergesortSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Eight cards in a row. Put them in order.",
        body: (
          <>
            <p>
              You&rsquo;ve got eight cards spread on the table, face up, in whatever order they
              landed: <code>5, 2, 4, 7, 1, 3, 8, 6</code>. Sort them.
            </p>
            <p>
              Eight is easy by eyeballing. Eighty is annoying. Eight hundred million is the kind
              of thing computers spend their lives doing &mdash; every database join, every
              search-result ranking, every leaderboard. The shape of the answer matters.
            </p>
          </>
        ),
        actionLabel: "Try the obvious thing",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Swap adjacent pairs until nothing's out of order.",
        body: (
          <>
            <p>
              The first algorithm everyone reaches for: walk left to right, swap any pair that&rsquo;s
              backwards. Loop until a full pass makes no swaps. It works. It&rsquo;s slow.
            </p>
            <p>
              The problem is each swap fixes one tiny disagreement. To move a card a long way
              across the row, you have to swap it past every single neighbour. The total work
              grows like the <em>square</em> of the size &mdash; a thousand cards take a million
              swaps in the worst case.
            </p>
            <p>
              We need a way to move information across the row in bigger chunks.
            </p>
          </>
        ),
        actionLabel: "Split. Sort. Merge.",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Cut in half. Sort each half. Merge them.",
        body: (
          <>
            <p>
              Pretend the two halves of the row are already sorted somehow. Then the original row
              becomes easy: walk both halves with two fingers, always pick the smaller card next.
              That&rsquo;s a single linear pass &mdash; a clean merge.
            </p>
            <p>
              So the question shrinks: how do you sort each half? Same way. Cut it in half. Sort
              the two pieces. Merge them. The pieces keep getting smaller until they&rsquo;re a
              single card &mdash; a single card is already sorted, so the recursion stops.
            </p>
            <p>
              Press play on the right. Watch the row split into halves, into quarters, into
              singletons. Then watch the merges run upward, sorting as they go.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: sorting halves and merging them is much less work than swap-by-swap,
              because the merge step moves cards from one side to the other in one shot.
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
        title: "Recursion plus a two-finger merge.",
        body: (
          <>
            <p>
              Write <code>sort(arr)</code>. Two cases.
            </p>
            <p>
              <strong>Base case.</strong> If the list has 0 or 1 elements, return it. Already
              sorted.
            </p>
            <p>
              <strong>Recursive case.</strong> Find the middle. Let <code>left = sort(arr[:mid])</code>{" "}
              and <code>right = sort(arr[mid:])</code>. Return <code>merge(left, right)</code>.
            </p>
            <p>
              <strong>The merge.</strong> Two fingers, <code>i</code> at the start of{" "}
              <code>left</code> and <code>j</code> at the start of <code>right</code>. Whichever
              points at the smaller card, write that card to the output and step that finger
              forward. When one side runs out, dump the rest of the other side at the end.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>decomposition</em>. Hard sort becomes two
              smaller sorts plus a cheap merge. The smaller sorts solve themselves by the same
              rule.
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
        title: "Half each level. Linear merge. Logs and lines.",
        body: (
          <>
            <p>
              <strong>How many splits?</strong> Each split halves the array. Halving a thousand
              elements takes about ten levels (because 2<sup>10</sup> = 1024).{" "}
              <code>O(log n)</code> (cost grows very slowly &mdash; doubling the input size only
              adds one more level).
            </p>
            <p>
              <strong>How much work per level?</strong> Each merge at any level looks at each
              card in its slice exactly once. Across the whole level, the merges touch every
              card &mdash; <code>O(n)</code> per level.
            </p>
            <p>
              <strong>Total:</strong> <code>n</code> per level times <code>log n</code> levels =
              <code> O(n log n)</code>. For a million elements that&rsquo;s about twenty million
              operations &mdash; not a trillion.
            </p>
            <p>
              <strong>Memory:</strong> the merge needs a second copy of the slice to write into,
              so memory is <code>O(n)</code>. There are other sorts that don&rsquo;t need that
              copy (quicksort, in-place), but they trade away a different guarantee.
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
        title: "Divide and conquer is everywhere.",
        body: (
          <>
            <p>
              The shape of mergesort &mdash; split, solve each half, combine &mdash; turns up
              wherever a problem on <em>n</em> items breaks naturally into the same problem on
              <em> n/2</em> items, with a cheap combine step.
            </p>
            <p>
              Same shape, different stories: counting inversions in a sequence (a sneaky variant
              of mergesort), the closest pair of points on a plane, large-integer multiplication
              (Karatsuba), the fast Fourier transform, parallel computations that hand work to
              two cores then merge their results.
            </p>
            <p>
              When the combine step is the expensive part you might lose; when it&rsquo;s the
              cheap part you win big. Mergesort wins because merging is linear &mdash; cheaper
              than sorting each half from scratch would have been.
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
        title: "Mergesort.",
        body: (
          <>
            <p>
              That&rsquo;s the name. It&rsquo;s the textbook example of divide and conquer. The
              recursion does the dividing; the merge does the conquering.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Sort&rdquo; on big data with a worst-case guarantee</li>
              <li>&ldquo;Merge two sorted streams&rdquo; (which is the merge step on its own)</li>
              <li>&ldquo;Process huge files that don&rsquo;t fit in memory&rdquo; (external
              mergesort)</li>
              <li>Anywhere divide-and-conquer with linear combine seems to fit</li>
            </ul>
            <p>
              Open the drawer for the Python. The recursion is short. The merge is the longer
              loop. Together they&rsquo;re fewer than twenty lines of real work.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
