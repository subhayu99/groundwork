import { DerivationStep } from "@/shared/derivation/types";

export const twoPointersSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Ten cards on a table. Find the pair that adds up.",
        body: (
          <>
            <p>
              Ten cards are laid out in a row, smallest to largest. Your friend points at a number
              &mdash; let&rsquo;s say <code>17</code> &mdash; and asks: &ldquo;Find me two cards that add
              up to exactly this.&rdquo;
            </p>
            <p>
              You can pick any two cards. You can lift them up, look at them, put them back. The
              question is: how few cards do you have to touch?
            </p>
          </>
        ),
        actionLabel: "I see the setup",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Try every pair until one works.",
        body: (
          <>
            <p>
              The honest answer: pick the first card, then check it against every other card. If
              nothing sums to <code>17</code>, pick the second card, check it against every card
              after. And so on.
            </p>
            <p>
              For ten cards that&rsquo;s <code>9 + 8 + 7 + ... + 1 = 45</code> pairs to inspect.
              You&rsquo;d touch every card many times. For a thousand cards, half a million pairs.
            </p>
            <p>
              But the cards are <strong>sorted</strong>. We haven&rsquo;t used that fact at all.
            </p>
          </>
        ),
        actionLabel: "Sorted should mean something",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Two fingers. One at each end. Move them.",
        body: (
          <>
            <p>
              Put your left finger on the smallest card and your right finger on the largest. Add the
              two numbers. Use the buttons on the right to move whichever finger feels right.
            </p>
            <p>
              Don&rsquo;t think about a strategy yet. Just look at what happens. When does each finger
              want to move? What does it mean when the sum is too small? Too big?
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> if the sum is too small, which finger could you
              move to make it bigger? If the sum is too big, which one could you move?
            </div>
          </>
        ),
        actionLabel: "I see the pattern",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Each move eliminates a whole row of pairs.",
        body: (
          <>
            <p>
              Call the fingers <code>L</code> and <code>R</code>. Look at <code>arr[L] + arr[R]</code>.
            </p>
            <p>
              <strong>Too small?</strong> Every pair using <code>arr[L]</code> with anything between{" "}
              <code>L</code> and <code>R</code> is also too small &mdash; the right side is the
              biggest one available. So we never need to look at <code>arr[L]</code> again.
              Move <code>L</code> one to the right.
            </p>
            <p>
              <strong>Too big?</strong> Symmetric. Every pair using <code>arr[R]</code> with anything
              from <code>L</code> to <code>R</code> is also too big. Drop <code>R</code> by one.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> sortedness is a guarantee &mdash; an{" "}
              <em>invariant</em>. Each comparison eliminates a whole side of the search space, not
              just one pair.
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
        title: "Forty-five pairs becomes nine comparisons.",
        body: (
          <>
            <p>
              Brute force touches up to <code>n &times; (n &minus; 1) / 2</code> pairs. With{" "}
              <code>n = 10</code> that&rsquo;s 45 comparisons.
            </p>
            <p>
              Two pointers touches each card at most once. <code>L</code> only moves right.{" "}
              <code>R</code> only moves left. They meet in the middle after at most{" "}
              <code>n &minus; 1</code> steps. Nine comparisons. Done.
            </p>
            <p>
              Press play on the right and watch the fingers converge.
            </p>
          </>
        ),
        actionLabel: "Try it elsewhere",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Same fingers. New questions.",
        body: (
          <>
            <p>
              Now the question is: is this word a palindrome? Same trick. One finger at each end.
              Compare letters. If they match, both fingers step inward. If not, it&rsquo;s not a
              palindrome. Same number of moves: <code>n / 2</code>.
            </p>
            <p>
              Or: given the heights of vertical lines, which two lines hold the most water? Two
              fingers at the ends. Always move the shorter one inward (it&rsquo;s the bottleneck).
              Same convergence pattern.
            </p>
            <p>
              The fingers don&rsquo;t care what they&rsquo;re comparing. They care that the
              underlying structure has a <em>direction</em> &mdash; sortedness, symmetry, height
              &mdash; that tells each finger which way to move.
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
        title: "Two Pointers.",
        body: (
          <>
            <p>
              That&rsquo;s the name. It applies whenever a row of data has a direction &mdash; sorted
              order, symmetry, or some monotone property &mdash; and each comparison can eliminate
              one whole side of the remaining possibilities.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Sorted array&rdquo; + &ldquo;pair sum&rdquo; / &ldquo;target&rdquo;</li>
              <li>&ldquo;Palindrome&rdquo; / &ldquo;symmetric&rdquo;</li>
              <li>&ldquo;Remove duplicates in place&rdquo;</li>
              <li>&ldquo;Container with most&rdquo; / &ldquo;trap rainwater&rdquo;</li>
            </ul>
            <p>
              Open the code drawer below to see how it looks in Python.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
