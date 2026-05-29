import type { PracticeProblem } from "@/shared/practice/types";

const mergeSortedArray = `def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    """Merge nums2 into nums1 in place, keeping it sorted.

    nums1 has length m + n: the first m slots hold real values,
    the last n slots are zero padding we are free to overwrite.
    We fill from the back so we never clobber an unread value.
    """
    # Pointers to the last real element of each input...
    i = m - 1
    j = n - 1
    # ...and to the last slot of nums1, where the next-largest goes.
    k = m + n - 1

    # Walk backwards, dropping the larger tail value into place.
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[k] = nums1[i]
            i -= 1
        else:
            nums1[k] = nums2[j]
            j -= 1
        k -= 1
    # Once nums2 is exhausted, any leftover nums1 values are
    # already in their correct positions, so we stop.
`;

const sortAnArray = `def sort_array(nums: list[int]) -> list[int]:
    """Sort a list with merge sort: split, sort halves, merge.

    Time:  O(n log n) — log n levels of splitting, O(n) work per level.
    Space: O(n) for the temporary merged lists.
    """
    # A list of 0 or 1 elements is already sorted — base case.
    if len(nums) <= 1:
        return nums

    # Split down the middle and sort each half independently.
    mid = len(nums) // 2
    left = sort_array(nums[:mid])
    right = sort_array(nums[mid:])

    return _merge(left, right)


def _merge(left: list[int], right: list[int]) -> list[int]:
    """Weave two sorted lists into one sorted list."""
    merged: list[int] = []
    i = j = 0

    # Repeatedly take the smaller front element of the two lists.
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    # One list is now empty; append whatever remains in the other.
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged
`;

export const mergesortProblems: PracticeProblem[] = [
  {
    id: "merge-sorted-array",
    title: "Merge Sorted Array",
    difficulty: "easy",
    teaser: "Merge a second sorted array into the first, in place, keeping it sorted.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given two sorted integer arrays, <code>nums1</code> and{" "}
          <code>nums2</code>, along with their real element counts <code>m</code> and{" "}
          <code>n</code>. Merge <code>nums2</code> into <code>nums1</code> so that{" "}
          <code>nums1</code> ends up sorted.
        </p>
        <p>
          The catch: <code>nums1</code> actually has length <code>m + n</code>. Its first{" "}
          <code>m</code> entries are the real values; the trailing <code>n</code> entries are{" "}
          <code>0</code> placeholders you may overwrite. Do the merge{" "}
          <strong>in place</strong> &mdash; don&rsquo;t return a new array.
        </p>
      </div>
    ),
    constraints: [
      "nums1.length == m + n",
      "nums2.length == n",
      "0 ≤ m, n ≤ 200 and 1 ≤ m + n ≤ 200",
      "Both inputs are sorted in non-decreasing order",
    ],
    examples: [
      {
        input: "nums1 = [1, 2, 3, 0, 0, 0], m = 3, nums2 = [2, 5, 6], n = 3",
        output: "[1, 2, 2, 3, 5, 6]",
        note: "The three trailing zeros are filler that gets overwritten by the merge.",
      },
      {
        input: "nums1 = [1], m = 1, nums2 = [], n = 0",
        output: "[1]",
        note: "Nothing to merge in; nums1 is already done.",
      },
    ],
    hints: [
      <p>
        Merging from the <em>front</em> is tempting, but the next sorted value belongs in an
        early slot of <code>nums1</code> &mdash; a slot that still holds a real value you
        haven&rsquo;t read yet. Writing there would clobber it. So front-to-back forces you to
        shift elements or use extra space.
      </p>,
      <p>
        Look at the <em>back</em> instead. The largest of all <code>m + n</code> values belongs
        in the very last slot of <code>nums1</code> &mdash; which is guaranteed empty padding.
        Filling back-to-front, every slot you write to has either been read already or was
        filler. No clobbering.
      </p>,
      <p>
        Keep three pointers: <code>i</code> at the last real value of <code>nums1</code>,{" "}
        <code>j</code> at the last value of <code>nums2</code>, and <code>k</code> at the last
        slot overall. Compare <code>nums1[i]</code> with <code>nums2[j]</code>, drop the larger
        at <code>k</code>, and step that pointer back. When <code>nums2</code> runs out,
        you&rsquo;re finished.
      </p>,
    ],
    solution: mergeSortedArray,
    solutionWalkthrough: (
      <p>
        We make a single backward pass, writing each position of <code>nums1</code> exactly
        once &mdash; that&rsquo;s <code>O(m + n)</code> time and <code>O(1)</code> extra space.
        Filling from the back is the key trick: the tail of <code>nums1</code> is always free
        space, so we never overwrite an element we still need to read. The loop ends as soon as{" "}
        <code>nums2</code> is consumed, since any remaining <code>nums1</code> values are already
        sitting in their final spots.
      </p>
    ),
  },
  {
    id: "sort-an-array",
    title: "Sort an Array",
    difficulty: "medium",
    teaser: "Sort an array yourself using merge sort — split in half, sort each, merge.",
    prompt: (
      <div className="space-y-3">
        <p>
          Given an integer array <code>nums</code>, return it sorted in non-decreasing order.
          The goal here isn&rsquo;t to call the built-in sort &mdash; it&rsquo;s to implement{" "}
          <strong>merge sort</strong> from scratch.
        </p>
        <p>
          The idea: a list of one element is already sorted. To sort a bigger list, split it
          into two halves, sort each half (recursively), then <em>merge</em> the two sorted
          halves into one. This guarantees <code>O(n log n)</code> time regardless of the input.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ nums.length ≤ 50,000",
      "-50,000 ≤ nums[i] ≤ 50,000",
      "Aim for O(n log n) time; do not rely on the language's built-in sort",
    ],
    examples: [
      {
        input: "nums = [5, 2, 3, 1]",
        output: "[1, 2, 3, 5]",
        note: "Split into [5, 2] and [3, 1], sort each to [2, 5] and [1, 3], then merge.",
      },
      {
        input: "nums = [5, 1, 1, 2, 0, 0]",
        output: "[0, 0, 1, 1, 2, 5]",
        note: "Duplicates are preserved; merge sort handles repeated values cleanly.",
      },
    ],
    hints: [
      <p>
        Start from the base case: what&rsquo;s the smallest input you already know how to sort
        without doing any work? A list with <code>0</code> or <code>1</code> element is trivially
        sorted &mdash; return it as is. Every recursion must bottom out here.
      </p>,
      <p>
        For anything larger, find the midpoint and recurse on <code>nums[:mid]</code> and{" "}
        <code>nums[mid:]</code>. Trust the recursion: assume those calls hand you back two{" "}
        <em>fully sorted</em> halves. Your only remaining job is to combine them.
      </p>,
      <p>
        To merge two sorted lists, walk a pointer down each one. Repeatedly compare the two front
        elements and append the smaller to the result, advancing that pointer. When one list
        empties, append everything left in the other. That merge is <code>O(n)</code>, and with{" "}
        <code>log n</code> levels of splitting the whole sort is <code>O(n log n)</code>.
      </p>,
    ],
    solution: sortAnArray,
    solutionWalkthrough: (
      <p>
        Merge sort splits the array roughly <code>log n</code> times before reaching
        single-element pieces, and each level of merging touches all <code>n</code> elements
        once &mdash; so the total is <code>O(n log n)</code>, independent of how the input is
        arranged. The <code>_merge</code> helper does the real work: by always taking the smaller
        of the two front elements, it produces a sorted weave in linear time. Using{" "}
        <code>&lt;=</code> in the comparison keeps equal elements in their original relative order,
        making this implementation stable. The cost is <code>O(n)</code> extra space for the
        temporary lists.
      </p>
    ),
  },
];
