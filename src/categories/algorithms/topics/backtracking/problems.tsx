import type { PracticeProblem } from "@/shared/practice/types";

const subsets = `def subsets(nums: list[int]) -> list[list[int]]:
    """Every subset of a list of distinct integers."""
    result: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int) -> None:
        # Every prefix of choices is itself a valid subset.
        result.append(path[:])  # snapshot — path keeps mutating

        for i in range(start, len(nums)):
            path.append(nums[i])   # choose
            backtrack(i + 1)       # recurse on what's left
            path.pop()             # undo

    backtrack(0)
    return result
`;

const permutations = `def permutations(nums: list[int]) -> list[list[int]]:
    """Every ordering of a list of distinct integers."""
    result: list[list[int]] = []
    path: list[int] = []
    used = [False] * len(nums)

    def backtrack() -> None:
        # A full-length path is one complete ordering.
        if len(path) == len(nums):
            result.append(path[:])  # snapshot
            return

        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])   # choose
            backtrack()            # recurse
            path.pop()             # undo
            used[i] = False        # undo

    backtrack()
    return result
`;

export const backtrackingProblems: PracticeProblem[] = [
  {
    id: "subsets",
    title: "All subsets",
    difficulty: "medium",
    teaser: "Generate every possible subset of a list of distinct integers.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of <em>distinct</em> integers. Return{" "}
          <strong>every</strong> subset &mdash; the power set. That includes the empty
          subset <code>[]</code> and the full list itself.
        </p>
        <p>
          The order of the subsets in your answer doesn&rsquo;t matter, and neither does the
          order of elements within each subset. You just have to produce all of them, with no
          duplicates.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 20",
      "All integers in nums are distinct",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [1, 2, 3]",
        output: "[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]",
        note: "8 subsets in total — 2 raised to the power 3, one yes/no choice per element.",
      },
      {
        input: "nums = [0]",
        output: "[[], [0]]",
        note: "Either you take the 0 or you don't.",
      },
    ],
    hints: [
      <p>
        For each element you face a binary choice: <em>include it</em> or{" "}
        <em>leave it out</em>. With <code>n</code> elements that&rsquo;s{" "}
        <code>2<sup>n</sup></code> combinations &mdash; exactly the number of subsets. So the
        shape of the answer is a decision tree, not a single loop.
      </p>,
      <p>
        Walk the elements left to right, carrying a <code>path</code> of what you&rsquo;ve
        chosen so far. The pattern is <strong>choose &rarr; recurse &rarr; undo</strong>: append
        an element to <code>path</code>, recurse on the elements after it, then{" "}
        <code>pop</code> it back off so the next choice starts from a clean slate.
      </p>,
      <p>
        Here every node of the tree is a valid subset, not just the leaves &mdash; so record a{" "}
        <em>copy</em> of <code>path</code> on entry to each call. Pass a <code>start</code> index
        so you only ever look forward; that&rsquo;s what stops <code>[1, 2]</code> and{" "}
        <code>[2, 1]</code> from both appearing. Snapshot with <code>path[:]</code>, because{" "}
        <code>path</code> itself keeps getting mutated.
      </p>,
    ],
    solution: subsets,
    solutionWalkthrough: (
      <p>
        <code>backtrack(start)</code> records the current <code>path</code> as a subset, then
        tries extending it with each later element in turn. The{" "}
        <code>append</code>/<code>pop</code> pair is the choose-and-undo move: it leaves{" "}
        <code>path</code> exactly as it found it, so siblings in the tree don&rsquo;t pollute each
        other. We visit <code>2<sup>n</sup></code> nodes and copy a path at each, giving{" "}
        <code>O(n &times; 2<sup>n</sup>)</code> total work.
      </p>
    ),
  },
  {
    id: "permutations",
    title: "All permutations",
    difficulty: "medium",
    teaser: "Generate every ordering of a list of distinct integers.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of <em>distinct</em> integers. Return{" "}
          <strong>every</strong> arrangement of them &mdash; all the different orders you can lay
          the same numbers out in.
        </p>
        <p>
          Every permutation uses <em>all</em> of the numbers, each exactly once. The order in
          which you return the permutations doesn&rsquo;t matter.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 8",
      "All integers in nums are distinct",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [1, 2, 3]",
        output: "[[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]",
        note: "6 orderings — 3! = 3 × 2 × 1.",
      },
      {
        input: "nums = [0, 1]",
        output: "[[0, 1], [1, 0]]",
        note: "Two numbers, two orders.",
      },
    ],
    hints: [
      <p>
        Unlike subsets, every answer here has the full length <code>n</code>, and order matters.
        At the first position you have <code>n</code> choices, at the second{" "}
        <code>n - 1</code>, and so on &mdash; <code>n!</code> permutations in all. Again that&rsquo;s
        a decision tree, branching on &ldquo;which unused number goes next?&rdquo;
      </p>,
      <p>
        Track which numbers are still available with a <code>used</code> boolean array (distinct
        values make this clean). The familiar move is{" "}
        <strong>choose &rarr; recurse &rarr; undo</strong>: mark a number used and{" "}
        <code>append</code> it, recurse to fill the next slot, then <code>pop</code> it and clear
        its <code>used</code> flag so it&rsquo;s free for sibling branches.
      </p>,
      <p>
        The base case is when <code>path</code> has reached length <code>n</code>: that&rsquo;s a
        complete ordering, so append a <em>copy</em> (<code>path[:]</code>) and return. Note
        there are <strong>two</strong> things to undo after each recursive call &mdash; the{" "}
        <code>path.pop()</code> and the <code>used[i] = False</code>. Forget either and later
        branches inherit a corrupted state.
      </p>,
    ],
    solution: permutations,
    solutionWalkthrough: (
      <p>
        <code>backtrack</code> fills one slot at a time. At each level it scans for an unused
        number, claims it (set <code>used</code>, <code>append</code>), and dives deeper; once
        the call returns it releases that number (<code>pop</code>, clear <code>used</code>) and
        moves on. When <code>path</code> is full we&rsquo;ve made <code>n</code> choices, so we
        snapshot it. There are <code>n!</code> leaves and we do <code>O(n)</code> work copying
        each, for <code>O(n &times; n!)</code> overall.
      </p>
    ),
  },
];
