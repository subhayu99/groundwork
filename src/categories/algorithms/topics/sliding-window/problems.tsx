import type { PracticeProblem } from "@/shared/practice/types";

const maxWindowSum = `def max_window_sum(nums: list[int], k: int) -> int:
    """Largest sum of any k consecutive numbers."""
    # Pay for the first window in full.
    window = sum(nums[:k])
    best = window

    # Slide forward: drop the leaver, add the newcomer.
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)

    return best
`;

export const slidingWindowProblems: PracticeProblem[] = [
  {
    id: "max-window-sum",
    title: "Maximum sum of a window of length k",
    difficulty: "easy",
    teaser: "Find the largest sum of any k consecutive numbers in a list.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers (some positive, some negative) and an integer{" "}
          <code>k</code>. Return the largest sum you can form by picking <code>k</code>{" "}
          consecutive numbers anywhere in the list.
        </p>
        <p>
          The list always has at least <code>k</code> numbers in it. Both positive and negative
          values are fair game.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ k ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "16",
        note: "The window at the end — 3+6+7 — beats every other window of length 3.",
      },
      {
        input: "nums = [-1, -2, -3, -4], k = 2",
        output: "-3",
        note: "All windows are negative; the least-bad one is [-1, -2].",
      },
    ],
    hints: [
      <p>
        Brute force: for every starting index <code>i</code>, sum{" "}
        <code>nums[i:i+k]</code> and keep the best. That&rsquo;s <code>O(n &times; k)</code>{" "}
        operations &mdash; a million numbers with <code>k = 1000</code> would be a billion sums.
        We can do much better.
      </p>,
      <p>
        Two windows that are one step apart share <code>k - 1</code> of their numbers. So when
        the window slides right by one, exactly one number leaves the front and exactly one new
        number joins the back. The bulk in the middle doesn&rsquo;t change.
      </p>,
      <p>
        Maintain a running <code>window</code> sum. Pay for the very first window in full (one
        call to <code>sum</code>). After that, every slide is two operations: subtract the
        leaver, add the newcomer. Total work is <code>O(n)</code> &mdash; one quick pass.
      </p>,
    ],
    solution: maxWindowSum,
    solutionWalkthrough: (
      <p>
        The function spends <code>k</code> additions once to pay for the first window, then takes
        one subtraction and one addition per slide. For a list of size <code>n</code> we do at
        most <code>n + k</code> additions in total &mdash; far below the <code>n &times; k</code>{" "}
        of the naive approach.
      </p>
    ),
  },
];
