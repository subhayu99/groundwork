import { DerivationStep } from "@/shared/derivation/types";

export const binarySearchSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "A sorted phone book. Find Karen.",
        body: (
          <>
            <p>
              You&rsquo;re holding a real, sorted phone book &mdash; thousand names, all in
              alphabetical order. Someone says: &ldquo;Find Karen Salazar.&rdquo;
            </p>
            <p>
              How would you actually do it? You wouldn&rsquo;t start at page one. Open the book in
              the middle, look at the page. Too late? Half the book is gone. Too early? The other
              half is gone. Repeat.
            </p>
          </>
        ),
        actionLabel: "I have the question",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Linear scan throws away the sortedness.",
        body: (
          <>
            <p>
              The dumbest approach: read page 1, page 2, page 3, all the way to Karen. For a
              thousand pages that&rsquo;s up to a thousand comparisons.
            </p>
            <p>
              But the book is <strong>sorted</strong>. We&rsquo;ve barely used that. Each page we
              flip past tells us, &ldquo;Karen isn&rsquo;t here.&rdquo; But it doesn&rsquo;t tell us
              <em> how far away</em> she is.
            </p>
            <p>
              What if a single comparison could tell us where she is, not just where she isn&rsquo;t?
            </p>
          </>
        ),
        actionLabel: "Use the sortedness",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Pick a page. The other half goes dark.",
        body: (
          <>
            <p>
              On the right is a sorted array. There&rsquo;s a target value above it. Click any cell
              to &ldquo;guess.&rdquo; Watch what happens to the rest.
            </p>
            <p>
              Half of the array disappears with one click. You eliminated half the possibilities
              without even looking at them. That&rsquo;s the entire trick.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> if every comparison cuts the search space in
              half, how many comparisons do you need before only one cell remains?
            </div>
          </>
        ),
        actionLabel: "Halve, then halve again",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Keep two pointers. Always look in the middle.",
        body: (
          <>
            <p>
              Hold two markers: <code>lo</code> at the start and <code>hi</code> at the end of what&rsquo;s
              still possible. The answer, if it exists, is somewhere in <code>[lo, hi]</code>.
            </p>
            <p>
              At each step look at <code>mid = (lo + hi) / 2</code>. Three outcomes:
            </p>
            <p>
              <code>arr[mid] == target</code> &mdash; done, return <code>mid</code>.
            </p>
            <p>
              <code>arr[mid] &lt; target</code> &mdash; the answer is strictly to the right. Move{" "}
              <code>lo = mid + 1</code>.
            </p>
            <p>
              <code>arr[mid] &gt; target</code> &mdash; the answer is strictly to the left. Move{" "}
              <code>hi = mid - 1</code>.
            </p>
            <p>
              Stop when <code>lo &gt; hi</code> &mdash; the search space is empty, target is absent.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>search space pruning</em>. Each comparison
              eliminates a whole side &mdash; not just one element.
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
        label: "The win",
        title: "Halving a million takes twenty steps.",
        body: (
          <>
            <p>
              Linear scan on a thousand elements: up to 1,000 comparisons. Binary search:{" "}
              <code>log₂(1,000) ≈ 10</code>.
            </p>
            <p>
              Bump the array to a million. Linear scan: a million. Binary search: about 20.
            </p>
            <p>
              That gap is why every sorted-data interface in the world has a binary-search backbone,
              from <code>bisect</code> in Python to the index pages of B-trees in your database.
            </p>
          </>
        ),
        actionLabel: "Same shape, different problems",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Anywhere you can answer 'too small or too big?'",
        body: (
          <>
            <p>
              The phone-book version of binary search searches for an exact value. The deeper version
              searches for the <em>boundary</em> between &ldquo;too small&rdquo; and &ldquo;big
              enough.&rdquo;
            </p>
            <p>
              You can binary-search the answer to questions like: &ldquo;What&rsquo;s the smallest
              ship capacity that can finish the deliveries in 14 days?&rdquo; &mdash; even though
              there&rsquo;s no list at all. As long as the answers go in one direction (the bigger
              the ship, the easier the job), you can guess in the middle and throw away half of
              what&rsquo;s left.
            </p>
            <p>
              Anywhere the possibilities line up &mdash; small to big, easy to hard, no to yes
              &mdash; you can cut them in half with one check.
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
        title: "Binary Search.",
        body: (
          <>
            <p>
              That&rsquo;s the name. Two correct conventions to know &mdash;{" "}
              <code>lo &lt;= hi</code> with closed bounds, or <code>lo &lt; hi</code> with
              half-open. Pick one and stop second-guessing it.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Sorted array&rdquo; + find / find-or-insert position</li>
              <li>&ldquo;Smallest value such that...&rdquo; / &ldquo;largest value such that...&rdquo;</li>
              <li>&ldquo;Minimum X to make all Y feasible&rdquo;</li>
              <li>Anywhere a &ldquo;does this work?&rdquo; answer flips from no to yes exactly once as you turn a dial</li>
            </ul>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
