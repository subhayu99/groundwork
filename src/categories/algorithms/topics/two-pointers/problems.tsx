import type { PracticeProblem } from "@/shared/practice/types";

const pairSum = `def pair_sum_sorted(nums: list[int], target: int) -> tuple[int, int] | None:
    """Find any (i, j) with i < j and nums[i] + nums[j] == target."""
    l, r = 0, len(nums) - 1

    while l < r:
        s = nums[l] + nums[r]
        if s == target:
            return (l, r)
        # Too small? Need a bigger left value.
        # Too big? Need a smaller right value.
        if s < target:
            l += 1
        else:
            r -= 1

    return None
`;

export const twoPointersProblems: PracticeProblem[] = [
  {
    id: "pair-sum-sorted",
    title: "Pair sum in a sorted list",
    difficulty: "easy",
    teaser: "Find a pair of indices whose values sum to a target — the list is already sorted.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers that&rsquo;s already sorted in non-decreasing
          order, plus a target integer. Return any pair of indices <code>(i, j)</code> with{" "}
          <code>i &lt; j</code> such that <code>nums[i] + nums[j] == target</code>. If no such
          pair exists, return <code>None</code>.
        </p>
        <p>
          The sortedness is the gift. It would be a different problem on an unsorted list.
        </p>
      </div>
    ),
    constraints: [
      "2 ≤ len(nums) ≤ 100,000",
      "nums is sorted in non-decreasing order",
      "Values fit in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [1, 3, 4, 5, 7, 10, 11], target = 9",
        output: "(2, 3)",
        note: "nums[2] + nums[3] = 4 + 5 = 9.",
      },
      {
        input: "nums = [2, 4, 6], target = 5",
        output: "None",
        note: "No pair sums to 5 — the closest pair (2, 4) is 6.",
      },
    ],
    hints: [
      <p>
        The brute force is to try every pair: <code>O(n<sup>2</sup>)</code> sums to evaluate.
        For a million numbers that&rsquo;s a trillion sums. We need to use the fact that the
        list is sorted.
      </p>,
      <p>
        Put one finger at the leftmost element and another at the rightmost. Look at their sum.
        If it&rsquo;s exactly the target, return their indices. If it&rsquo;s too small, the
        right finger is fine but the left finger needs to point at a bigger value &mdash; move
        the left finger right.
      </p>,
      <p>
        If the sum is too big, similar logic: the left finger is fine but the right finger needs
        to point at something smaller &mdash; move the right finger left. The fingers converge.
        When they meet, every pair has been considered (in O(n) time) without ever building one
        explicitly.
      </p>,
    ],
    solution: pairSum,
    solutionWalkthrough: (
      <p>
        Each step moves exactly one finger inward by one position. The fingers meet after at
        most <code>n - 1</code> steps, and each step does one addition and one comparison.
        Total work: <code>O(n)</code> &mdash; one pass, no nested loop, no extra memory.
      </p>
    ),
  },
];
