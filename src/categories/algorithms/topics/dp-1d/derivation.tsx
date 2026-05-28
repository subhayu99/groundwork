import { DerivationStep } from "@/shared/derivation/types";

export const dp1dSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "How many ways to climb the stairs?",
        body: (
          <>
            <p>
              You&rsquo;re at the bottom of a staircase with 8 steps. Each move, you can take
              either 1 step or 2 steps. <strong>How many distinct routes get you to the top?</strong>
            </p>
            <p>
              For 1 step: one way (just one little hop).
              For 2 steps: two ways (1+1 or 2).
              For 3 steps: three ways (1+1+1, 1+2, 2+1).
              For 8 steps: more than you want to count by hand.
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
        title: "Recursion writes itself. And does the same work over and over.",
        body: (
          <>
            <p>
              Standing at step <code>n</code>, the only choice that matters is your <em>last</em>{" "}
              move. Either you took 1 step (so you were at <code>n-1</code>), or you took 2 (so
              you were at <code>n-2</code>). The number of ways to reach <code>n</code> is:
            </p>
            <p>
              <code>ways(n) = ways(n - 1) + ways(n - 2)</code>
            </p>
            <p>
              That&rsquo;s a tiny rule. Write it as a recursive function and we&rsquo;re done.
              Almost.
            </p>
            <p>
              <strong>The trap:</strong> to compute <code>ways(8)</code> we ask for{" "}
              <code>ways(7)</code> and <code>ways(6)</code>. To compute <code>ways(7)</code> we
              ask for <code>ways(6)</code> and <code>ways(5)</code>. We just asked for{" "}
              <code>ways(6)</code> twice. Lower down it&rsquo;s much worse &mdash;{" "}
              <code>ways(2)</code> gets re-computed dozens of times.
            </p>
            <p>
              The work isn&rsquo;t hard. It&rsquo;s repeated.
            </p>
          </>
        ),
        actionLabel: "Write the answer down once",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Solve each subproblem once. Look it up after.",
        body: (
          <>
            <p>
              On the right is the recursion tree for <code>ways(6)</code>. Press play. Watch how
              many times the same call shows up.
            </p>
            <p>
              Toggle <strong>remember answers</strong>. Now when a call comes back for the second
              time, we don&rsquo;t recompute &mdash; we just hand back the answer we wrote down
              the first time. The tree shrinks dramatically.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: every subproblem has exactly one true answer. Computing it twice is
              waste. Write it down the first time; reuse it forever after.
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
        title: "Two flavours. Same answer.",
        body: (
          <>
            <p>
              <strong>Top-down (memoization).</strong> Write the recursive rule as it sits. Add a
              dictionary: before doing the work, check if the answer&rsquo;s already in the
              dictionary; if it is, return it. After the work, store it. Each subproblem is solved
              at most once.
            </p>
            <p>
              <strong>Bottom-up (tabulation).</strong> Drop the recursion entirely. Build a table
              from the smallest case upward. Set <code>dp[0] = 1</code>, <code>dp[1] = 1</code>,
              then loop: <code>dp[i] = dp[i - 1] + dp[i - 2]</code>. By the time you reach{" "}
              <code>dp[n]</code>, the two values you need are already in the table.
            </p>
            <p>
              For this problem the bottom-up form only ever needs the last two values, so two
              variables are enough &mdash; constant memory, single pass.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>information reuse</em>. The same subproblem
              never gets solved twice. The whole speed-up comes from one rule:{" "}
              <em>write it down so you can look it up.</em>
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
        title: "From exponential to one quick pass.",
        body: (
          <>
            <p>
              <strong>Naive recursion:</strong> work roughly doubles for each extra step.
              <code> ways(40)</code> calls itself a billion times &mdash; minutes of compute.
            </p>
            <p>
              <strong>Memoized / tabulated:</strong> each <code>i</code> from 0 to <code>n</code>{" "}
              is computed exactly once, with one addition. That&rsquo;s <code>O(n)</code> (cost
              grows in step with how many stairs there are).
            </p>
            <p>
              <strong>Memory:</strong> top-down keeps a dictionary of <code>n+1</code> answers.
              Bottom-up needs just the last two &mdash; <code>O(1)</code> (a fixed amount no matter
              how tall the staircase).
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
        title: "Anywhere the answer for n depends on answers for smaller n.",
        body: (
          <>
            <p>
              The stairs problem isn&rsquo;t special. Wherever a problem has a small recursive
              rule and the recursion ends up asking for the same sub-answer many times, the same
              trick saves you.
            </p>
            <p>
              Same shape, different stories: edit distance between two words, longest common
              subsequence of two sequences, the fewest coins to make change for an amount,
              knapsack (which items fit in a bag with a weight limit), the cheapest path through
              a grid of costs.
            </p>
            <p>
              Two ingredients are required: the answer must split into <em>overlapping</em>{" "}
              subproblems (otherwise there&rsquo;s nothing to reuse), and the answer to a
              subproblem must always be the same (so you can write it down once).
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
        title: "Dynamic Programming.",
        body: (
          <>
            <p>
              That&rsquo;s the name. The dramatic word is misleading &mdash; nothing about it is
              dynamic in the everyday sense. It just means: <em>solve overlapping subproblems
              once, write them down, look them up.</em>
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Number of ways&rdquo; / &ldquo;minimum cost&rdquo; / &ldquo;maximum
              value&rdquo; with a small recursive rule</li>
              <li>The naive recursion is exponential because the same call repeats</li>
              <li>You can describe the answer at <em>n</em> using answers at strictly smaller
              <em>n</em>&rsquo;s</li>
              <li>Greedy gives the wrong answer because future choices depend on past ones</li>
            </ul>
            <p>
              Open the drawer for the Python. The loop form is what real production code looks
              like; the memoized recursion is in the comment for the readers who think recursive.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
