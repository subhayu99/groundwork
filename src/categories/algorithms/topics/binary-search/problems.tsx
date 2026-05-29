import type { PracticeProblem } from "@/shared/practice/types";

const binarySearch = `def binary_search(nums: list[int], target: int) -> int:
    """Return the index of target in a sorted list, or -1 if absent."""
    # The answer, if it exists, lives somewhere in [lo, hi].
    lo, hi = 0, len(nums) - 1

    while lo <= hi:
        # Midpoint without risking overflow in languages that care.
        mid = lo + (hi - lo) // 2

        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            # Target is bigger, so throw away the left half.
            lo = mid + 1
        else:
            # Target is smaller, so throw away the right half.
            hi = mid - 1

    return -1
`;

const firstBadVersion = `def first_bad_version(n: int, is_bad) -> int:
    """Find the first bad version in 1..n, calling is_bad as few times as possible."""
    # The first bad version lives somewhere in [lo, hi].
    lo, hi = 1, n

    while lo < hi:
        mid = lo + (hi - lo) // 2

        if is_bad(mid):
            # mid might be the first bad one, so keep it in range.
            hi = mid
        else:
            # mid is good, so the culprit is strictly to the right.
            lo = mid + 1

    # lo and hi have met — that's the boundary.
    return lo
`;

export const binarySearchProblems: PracticeProblem[] = [
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "easy",
    teaser: "Find the index of a target value in a sorted array, or -1 if it isn't there.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of integers <code>nums</code> sorted in increasing order, and a{" "}
          <code>target</code> value. Return the index where <code>target</code> appears, or{" "}
          <code>-1</code> if it isn&rsquo;t in the list.
        </p>
        <p>
          All values are distinct, and you should aim for <code>O(log n)</code> time &mdash; the
          sortedness is a gift you don&rsquo;t want to waste.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 100,000",
      "nums is sorted in strictly increasing order",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
        output: "4",
        note: "9 sits at index 4.",
      },
      {
        input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
        output: "-1",
        note: "2 never appears in the list.",
      },
    ],
    hints: [
      <p>
        A linear scan checks every element &mdash; that&rsquo;s <code>O(n)</code> and ignores the
        fact that the list is sorted. With a million elements you&rsquo;d touch a million values.
        Sortedness lets us do far better.
      </p>,
      <p>
        Look at the middle element. If it equals the target, you&rsquo;re done. If it&rsquo;s{" "}
        <em>smaller</em> than the target, every element to its left is also smaller, so the target
        (if present) must be on the right &mdash; and vice versa. Each comparison throws away half
        of what&rsquo;s left.
      </p>,
      <p>
        Keep two pointers, <code>lo</code> and <code>hi</code>, marking the range that could still
        contain the answer. Repeatedly check the midpoint and shrink the range to one side. After
        about <code>log&#8322; n</code> steps the range is empty &mdash; that&rsquo;s your{" "}
        <code>-1</code>.
      </p>,
    ],
    solution: binarySearch,
    solutionWalkthrough: (
      <p>
        Every iteration halves the search range, so the loop runs at most{" "}
        <code>log&#8322; n</code> times &mdash; about 17 steps for 100,000 elements instead of
        100,000. The work per step is constant, giving <code>O(log n)</code> time and{" "}
        <code>O(1)</code> extra space.
      </p>
    ),
  },
  {
    id: "first-bad-version",
    title: "First Bad Version",
    difficulty: "medium",
    teaser: "Find the first broken build given a checker, using as few checks as possible.",
    prompt: (
      <div className="space-y-3">
        <p>
          Versions <code>1</code> through <code>n</code> were released in order. At some point one
          version introduced a bug, and <em>every</em> version after it is also bad. You&rsquo;re
          given a function <code>is_bad(v)</code> that returns <code>True</code> if version{" "}
          <code>v</code> is bad. Find the <em>first</em> bad version.
        </p>
        <p>
          Calling <code>is_bad</code> is expensive (think: spinning up a full test suite), so
          minimize how many times you call it. The versions form a clean boundary: a run of good
          ones followed by a run of bad ones.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ first_bad ≤ n ≤ 2,000,000,000",
      "Once a version is bad, all later versions are bad too",
      "is_bad runs in O(1) but should be called as few times as possible",
    ],
    examples: [
      {
        input: "n = 5, first bad version is 4",
        output: "4",
        note: "Versions 1, 2, 3 are good; 4 and 5 are bad. The boundary is at 4.",
      },
      {
        input: "n = 1, version 1 is bad",
        output: "1",
        note: "Only one version, and it's bad.",
      },
    ],
    hints: [
      <p>
        Checking versions one by one until <code>is_bad</code> first returns <code>True</code> is{" "}
        <code>O(n)</code> calls &mdash; with two billion versions that&rsquo;s hopeless. The
        good-then-bad pattern is exactly the structure binary search loves.
      </p>,
      <p>
        Ask <code>is_bad(mid)</code>. If <code>mid</code> is bad, the first bad version is{" "}
        <code>mid</code> <em>or something to its left</em> &mdash; so keep <code>mid</code> in the
        candidate range. If <code>mid</code> is good, the first bad version is strictly to the{" "}
        <em>right</em>.
      </p>,
      <p>
        Use the boundary pattern: loop while <code>lo &lt; hi</code>, set{" "}
        <code>hi = mid</code> when <code>mid</code> is bad and <code>lo = mid + 1</code> when it&rsquo;s
        good. When <code>lo</code> and <code>hi</code> meet, that single surviving index is the
        first bad version. Beware the off-by-one: setting <code>hi = mid - 1</code> here would
        skip the answer.
      </p>,
    ],
    solution: firstBadVersion,
    solutionWalkthrough: (
      <p>
        Because <code>mid</code> stays in range when it&rsquo;s bad, the loop converges on the
        leftmost bad version rather than just <em>a</em> bad one. It halves the range each step, so
        it calls <code>is_bad</code> only about <code>log&#8322; n</code> times &mdash; roughly 31
        calls for two billion versions &mdash; in <code>O(log n)</code> time and{" "}
        <code>O(1)</code> space.
      </p>
    ),
  },
];
