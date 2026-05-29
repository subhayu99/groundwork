import type { PracticeProblem } from "@/shared/practice/types";

const containsDuplicate = `def contains_duplicate(nums: list[int]) -> bool:
    """True if any value shows up more than once."""
    seen: set[int] = set()

    for x in nums:
        # If x is already in the set, we've met it before.
        if x in seen:
            return True
        seen.add(x)

    return False
`;

const intersection = `def intersection(nums1: list[int], nums2: list[int]) -> list[int]:
    """Unique values that appear in BOTH lists, in any order."""
    # Membership tests against a set are O(1) on average.
    a = set(nums1)
    b = set(nums2)

    # The & operator keeps only the values present in both sets.
    return list(a & b)
`;

export const setsTuplesProblems: PracticeProblem[] = [
  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "easy",
    teaser: "Decide whether any value appears at least twice in a list.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of integers <code>nums</code>. Return{" "}
          <code>True</code> if any single value appears two or more times anywhere in
          the list, and <code>False</code> if every value is distinct.
        </p>
        <p>
          The list may be empty. Values can be negative, zero, or positive.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [1, 2, 3, 1]",
        output: "True",
        note: "The value 1 appears at both the start and the end.",
      },
      {
        input: "nums = [1, 2, 3, 4]",
        output: "False",
        note: "Every value is unique, so nothing repeats.",
      },
    ],
    hints: [
      <p>
        Brute force compares every pair of elements &mdash; that&rsquo;s{" "}
        <code>O(n&sup2;)</code> comparisons. With 100,000 numbers that&rsquo;s ten
        billion checks. We want a single pass instead.
      </p>,
      <p>
        The real question is: &ldquo;have I seen this value before?&rdquo; A{" "}
        <code>set</code> answers that in <code>O(1)</code> on average, because it
        hashes values rather than scanning them.
      </p>,
      <p>
        Walk the list once. Before adding each value to a <code>seen</code> set,
        check if it&rsquo;s already in there &mdash; if so, you&rsquo;ve found a
        duplicate and can return early. Otherwise add it and keep going.
      </p>,
    ],
    solution: containsDuplicate,
    solutionWalkthrough: (
      <p>
        We make one pass over <code>nums</code>. Each <code>in</code> test and each{" "}
        <code>add</code> is <code>O(1)</code> on average, so the whole scan is{" "}
        <code>O(n)</code> time and <code>O(n)</code> space &mdash; far cheaper than
        the <code>O(n&sup2;)</code> pairwise comparison.
      </p>
    ),
  },
  {
    id: "intersection-of-two-arrays",
    title: "Intersection of Two Arrays",
    difficulty: "easy",
    teaser: "Return the unique values that appear in both of two lists.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given two lists of integers, <code>nums1</code> and{" "}
          <code>nums2</code>. Return a list of the values that appear in{" "}
          <em>both</em> lists. Each value in the result must be unique, and the order
          doesn&rsquo;t matter.
        </p>
        <p>
          Either list may contain duplicates of its own, but those duplicates should
          not show up more than once in the answer.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ len(nums1), len(nums2) ≤ 1,000",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums1 = [1, 2, 2, 1], nums2 = [2, 2]",
        output: "[2]",
        note: "Only 2 is common, and it appears once despite the repeats.",
      },
      {
        input: "nums1 = [4, 9, 5], nums2 = [9, 4, 9, 8, 4]",
        output: "[4, 9]",
        note: "Both 4 and 9 are shared; order is not significant.",
      },
    ],
    hints: [
      <p>
        Checking each value of one list against the other with a linear scan is{" "}
        <code>O(n &times; m)</code>. And you&rsquo;d still have to dedupe the result
        afterwards. There&rsquo;s a cleaner tool.
      </p>,
      <p>
        Turning a list into a <code>set</code> drops duplicates for free and gives
        you <code>O(1)</code> membership tests. So <code>set(nums1)</code> and{" "}
        <code>set(nums2)</code> already solve the &ldquo;unique&rdquo; requirement.
      </p>,
      <p>
        Python&rsquo;s set intersection operator <code>&amp;</code> returns exactly the
        values present in both sets. Build both sets, intersect them, and convert back
        to a <code>list</code>.
      </p>,
    ],
    solution: intersection,
    solutionWalkthrough: (
      <p>
        Building each set is <code>O(n)</code> and <code>O(m)</code>. The intersection
        scans the smaller set, testing membership against the larger one in{" "}
        <code>O(1)</code> per element, so the whole thing is linear in the input size.
        Sets also guarantee each shared value appears just once.
      </p>
    ),
  },
];
